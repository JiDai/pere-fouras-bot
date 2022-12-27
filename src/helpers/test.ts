import { TMIClient } from '../../deps.ts';

// @ts-ignore
export const tmiClientStub: TMIClient = {
	say: function (channel: string, message: string): Promise<unknown> {
		return Promise.resolve('ok');
	},
};
