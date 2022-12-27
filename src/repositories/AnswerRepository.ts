import type { definitions } from '../types/supabase.ts';

import {SupabaseClient} from "https://deno.land/x/supabase/mod.ts";

type Answer = definitions['pf_answer'];

interface BaseAnswerEntity extends Answer {}

export interface AnswerEntity extends Answer {
	text: string;
	active: boolean;
}

export default class AnswerRepository {
	readonly dbClient: SupabaseClient;

	constructor(dbClient: SupabaseClient) {
		this.dbClient = dbClient;
	}

	async getAll(): Promise<Array<AnswerEntity>> {
		const { data, error } = await this.dbClient.from('pf_answer').select('*').eq('active', true);

		if (error || !data) {
			console.error(error);
			console.error('Unable to get pf_answers from API');
			return [];
		}

		const pf_answers: Array<AnswerEntity> = data as Array<BaseAnswerEntity>;

		return pf_answers;
	}
}
