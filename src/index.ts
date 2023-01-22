import {config} from 'dotenv';
import {Client as TMIClient} from 'tmi';

import {SupabaseClient} from 'supabase';
import {getMessageCommand} from "./helpers/chat.ts";
import AnswerRepository from "./repositories/AnswerRepository.ts";
import riddles from "./data/riddles.json" assert {type: "json"};
import {Question} from "./types/Question.ts";

const env = config();

let twitchClient: TMIClient;
const QUESTION_TIMEOUT = 30000;

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

	const supabase = new SupabaseClient(env.SUPABASE_URL as string, env.SUPABASE_KEY as string, {
		detectSessionInUrl: false,
	});

	twitchClient.say(env.CHANNEL_NAME, 'Bonjour jeunes gens');

	let currentQuestion: Question | null = null;
	let questionTimeout: number;

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

		// Ask a question
		if (command.message === 'ask' && currentQuestion === null) {
			const index = Math.floor(Math.random() * riddles.length);
			currentQuestion = riddles[index];
			for (const line of currentQuestion.question) {
				twitchClient.say(env.CHANNEL_NAME, line);
			}
			twitchClient.say(env.CHANNEL_NAME, `=> Tapez !pf suivez de votre mot pour répondre. Fin dans ${QUESTION_TIMEOUT / 1000}s !`);
			questionTimeout = setTimeout(function questionEnd() {
				currentQuestion = null;
				twitchClient.say(env.CHANNEL_NAME, 'Personne n\'a trouvé dans le temps imparti...');
			}, QUESTION_TIMEOUT);
		}
		// An answer has been post
		else if (command.message !== '' && currentQuestion !== null) {
			const repo = new AnswerRepository(supabase);

			// Success
			if (command.message.toLowerCase().trim() === currentQuestion.answer.toLowerCase().trim()) {
				twitchClient.say(env.CHANNEL_NAME, `GG @${username} !!`);
				clearTimeout(questionTimeout);
				const isOk = await repo.post(command.message, username, true, currentQuestion.id);
				currentQuestion = null;
				if (!isOk) {
					throw new Error('Unable to insert answer');
				}
			}
			// Wrong
			else {
				const isOk = await repo.post(command.message, username, false, currentQuestion.id);
				if (!isOk) {
					throw new Error('Unable to insert answer');
				}
			}
		}
	});

	return twitchClient;
}

async function main() {
	await handleTwitchChat();
}

main();
