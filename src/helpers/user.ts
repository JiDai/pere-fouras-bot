export function isModo(userTags: Record<string, any>): boolean {
	return userTags?.moderator || userTags?.broadcaster;
}

export function isSub(userTags: Record<string, any>): boolean {
	return userTags?.subscriber || isModo(userTags);
}
