import type {definitions} from '../types/supabase.ts';

import {SupabaseClient} from "https://deno.land/x/supabase/mod.ts";

type BaseAnswerEntity = definitions['pf_answer'];

export interface AnswerEntity extends BaseAnswerEntity {
	question_id: string;
	username: string;
	answer: string;
	valie: boolean;
}

export default class AnswerRepository {
	readonly dbClient: SupabaseClient;

	constructor(dbClient: SupabaseClient) {
		this.dbClient = dbClient;
	}

	async post(answer: string, username: string, valid: boolean, questionId: string): Promise<boolean> {
		const {data, error} = await this.dbClient.from('pf_answer')
			.insert({
				question_id: questionId,
				answer,
				username,
				valid
			});
		return !(error || data.length === 0);
	}
}
