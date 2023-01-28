import type {definitions} from '../types/supabase.ts';

import {SupabaseClient} from "https://deno.land/x/supabase/mod.ts";

type BaseAnswerEntity = definitions['pf_answer'];

export default class AnswerRepository {
	readonly dbClient: SupabaseClient;

	constructor(dbClient: SupabaseClient) {
		this.dbClient = dbClient;
	}

	async post(answer: string, username: string, valid: boolean, riddleId: string): Promise<boolean> {
		const {data, error} = await this.dbClient.from('pf_answer')
			.insert({
				riddle_id: riddleId,
				answer,
				username,
				valid
			});
		return !(error || data.length === 0);
	}

	async getBoard(): Promise<Record<string, number>> {
		const {data, error} = await this.dbClient.from('pf_answer')
			.select('*')
			.eq('valid', true)
			.limit(5);

		if (error || !data) {
			console.error('Cannot get board');
			return {};
		}

		const result: Record<string, number> = {};
		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			const key = item.username;
			if (!result[key]) {
				result[key] = 0;
			}

			if (item.valid) {
				result[key] += 1;
			}
		}

		const sortedResult: Record<string, number> = {};
		Object.keys(result)
			.sort((a, b) => result[b] - result[a]) // sort by descending order
			.forEach(key => sortedResult[key] = result[key]);

		return sortedResult;
	}
}
