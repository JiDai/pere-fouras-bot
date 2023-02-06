import type {CommandMessage} from "../types/CommandMessage.ts";

export function getMessageCommand(message: string): CommandMessage | null {
    const matches = message.match(/^\!([a-z_0-9]+)(.*)/);
    if (matches) {
        return {
            name: matches[1],
            args: matches.length === 3 ? matches[2].trim() : '',
        };
    }
    return null;
}
