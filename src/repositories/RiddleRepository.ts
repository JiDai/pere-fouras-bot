import type {definitions} from '../types/supabase.ts';

import {SupabaseClient} from "https://deno.land/x/supabase/mod.ts";

type BaseRiddleEntity = definitions['pf_riddle'];

export interface RiddleEntity extends BaseRiddleEntity {
	riddle_id: string;
	username: string;
	answer: string;
	valie: boolean;
}

export default class RiddleRepository {
	readonly dbClient: SupabaseClient;

	constructor(dbClient: SupabaseClient) {
		this.dbClient = dbClient;
	}

	async getCurrent(): Promise<RiddleEntity | null> {
		const {data, error} = await this.dbClient
			.from('pf_riddle')
			.select('*')
			.eq('enabled', true);

		if (error || !data) {
			console.error('Cannot get current riddle');
			console.error(error);
			return null;
		}

		const index = Math.floor(Math.random() * data.length);
		return data[index];
	}

	async post(id: string, content: Array<string>, show: string, answer: string): Promise<boolean> {
		const {data, error} = await this.dbClient.from('pf_riddle')
			.insert({
				id,
				content,
				show,
				answer,
			});
		if (error) {
			console.error(error);
		}
		return !(error || data.length === 0);
	}

}
