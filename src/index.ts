import {config} from 'dotenv';
import {Client as TMIClient} from 'tmi';

import {SupabaseClient} from 'supabase';
import {getMessageCommand} from "./helpers/chat.ts";
import AnswerRepository from "./repositories/AnswerRepository.ts";
import {Question} from "./types/Question.ts";

import Pusher from "npm:pusher-js";

const env = config();

let twitchClient: TMIClient;
const QUESTION_TIMEOUT = 60000;
const RIDDLE_LINE_INTERVAL_TIMEOUT = 3000;


let currentQuestion: Question | null = null;
let questionTimeout: number;

const supabase = new SupabaseClient(env.SUPABASE_URL as string, env.SUPABASE_KEY as string, {
	detectSessionInUrl: false,
});

async function launchQuestion() {
	const repo = new AnswerRepository(supabase);
	currentQuestion = await repo.getCurrent();
	for (const index in currentQuestion.question) {
		const line = currentQuestion.question[index];
		setTimeout(function questionLineMessage() {
			twitchClient.say(env.CHANNEL_NAME, line);
		}, Number(index) * RIDDLE_LINE_INTERVAL_TIMEOUT);
	}

	setTimeout(function questionTip() {
		twitchClient.say(env.CHANNEL_NAME, `=> Tapez !pf suivez de votre mot pour répondre. Fin dans ${QUESTION_TIMEOUT / 1000}s !`);
	}, currentQuestion.question.length * RIDDLE_LINE_INTERVAL_TIMEOUT);

	questionTimeout = setTimeout(function questionEnd() {
		currentQuestion = null;
		twitchClient.say(env.CHANNEL_NAME, 'Personne n\'a trouvé dans le temps imparti...');
	}, QUESTION_TIMEOUT);
}

async function postAnswer(message: string, username: string) {
	if (currentQuestion === null) {
		return;
	}

	const repo = new AnswerRepository(supabase);
	// Success
	if (message.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()) {
		twitchClient.say(env.CHANNEL_NAME, `GG @${username} !!`);
		clearTimeout(questionTimeout);
		const isOk = await repo.post(message, username, true, currentQuestion.id);
		currentQuestion = null;
		if (!isOk) {
			throw new Error('Unable to insert answer');
		}
	}
	// Wrong
	else {
		const isOk = await repo.post(message, username, false, currentQuestion.id);
		if (!isOk) {
			throw new Error('Unable to insert answer');
		}
	}
}

async function showBoard() {
	const repo = new AnswerRepository(supabase);
	const board = await repo.getBoard();
	if (!board) {
		throw new Error('Unable to insert answer');
	}

	const message = Object.entries(board).map(function (item, index) {
		return `${index + 1}. ${item[0]}: ${item[1]}pts`;
	}).join(' -- ');
	twitchClient.say(env.CHANNEL_NAME, message);
}

async function handleTwitchChat() {
	twitchClient = new TMIClient({
		connection: {
			// The secure config is required if you're using tmi on the server.
			// Node doesn't handle automatically upgrading .dev domains to use TLS.
			secure: Boolean(env.TWITCH_SERVER_SECURE),
			server: env.TWITCH_SERVER_HOST,
			port: env.TWITCH_SERVER_PORT ? Number(env.TWITCH_SERVER_PORT) : undefined,
		},
		options: {debug: true},
		identity: {
			username: env.BOT_USERNAME,
			password: env.BOT_OAUTH_TOKEN,
		},
		channels: [env.CHANNEL_NAME],
	});

	try {
		await twitchClient.connect();
	} catch (error) {
		console.error('Unable to connect to IRC server');
		console.error(error);
	}

	twitchClient.say(env.CHANNEL_NAME, 'Bonjour jeunes gens');

	twitchClient.on('chat', async function chatHandler(
		channel: string,
		{username, 'message-type': messageType}: { username: string; 'message-type': string },
		message: string,
	) {
		// Create DB
		const command = getMessageCommand(message);

		if (!command || command?.name !== 'pf') {
			return;
		}

		// Board of players
		if (command.message === 'board') {
			await showBoard();
		}
		// An answer has been post
		else if (command.message !== '' && currentQuestion !== null) {
			await postAnswer(command.message, username);
		}
	});

	return twitchClient;
}

async function main() {
	await handleTwitchChat();

	// Subscribe to pusher event to get reward
	const pusher = new Pusher(env.PUSHER_APP_KEY, {
		cluster: 'eu',
	});
	const channel = pusher.subscribe('alert-channel');
	channel.bind('alert', function (eventData: any) {
		if (eventData.type === "command" && eventData.commandName === "pf") {
			launchQuestion();
		}
	});
}

main();
