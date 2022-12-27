import {config} from 'dotenv';
import {Client as TMIClient} from 'tmi';

import {SupabaseClient} from 'supabase';

const env = config();

let twitchClient: TMIClient;

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
			username: env.BROADCASTER_USERNAME,
			password: env.BROADCASTER_OAUTH_TOKEN,
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


	twitchClient.on('chat', function chatHandler() {
		twitchClient.say(env.CHANNEL_NAME, 'Bonjour jeunes gens');
		// Create DB

		// Respond to !pf ask
		//   - open question
		//   - tell the timers
		//   - verify current question already

		// Respond to !pf <answer>
		//   - Save answer
		//   - Detect winner and Say it
		//   - close question

	});

	return twitchClient;
}

async function main() {
	await handleTwitchChat();
}

main();
