import {SupabaseClient} from "https://deno.land/x/supabase@1.3.1/src/SupabaseClient.ts";
import RiddleRepository from "./repositories/RiddleRepository.ts";
import {config} from "dotenv";

import riddles from "./data/riddles.json" assert {type: "json"};

const env = config();


async function main() {
	const supabase = new SupabaseClient(env.SUPABASE_URL as string, env.SUPABASE_KEY as string, {
		detectSessionInUrl: false,
	});
	const repo = new RiddleRepository(supabase);

	for (const riddle of riddles) {
		console.log('Riddle instertion #', riddle.id);
		await repo.post(riddle.id, riddle.content, riddle.show, riddle.answer);
	}

}

main();
