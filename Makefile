
ifneq (,$(wildcard ./.env))
    include .env
    export
endif


.PHONY: install
install:
	deno cache --reload --unstable --lock-write --lock=lock.json ./deps.ts


.PHONY: start
start:
	deno run --import-map=import_map.json --allow-read --allow-net src/index.ts

.PHONY: dev
dev:
	deno run --import-map=import_map.json --allow-read --allow-net --watch src/index.ts


.PHONY: crawl
crawl:
	deno run --allow-read --allow-write --allow-net --watch src/crawl.ts

.PHONY: test
test:
	echo "Error: no test specified"


.PHONY: twitch-get-oauth-app-token
.SILENT: twitch-get-oauth-app-token
twitch-get-oauth-app-token:
	twitch configure --client-id=${TWITCH_APP_CLIENT_ID} --client-secret=${TWITCH_APP_CLIENT_SECRET}
	twitch token


.PHONY: twitch-get-oauth-user-token
.SILENT: twitch-get-oauth-user-token
twitch-get-oauth-user-token:
	twitch configure --client-id=${TWITCH_APP_CLIENT_ID} --client-secret=${TWITCH_APP_CLIENT_SECRET}
	twitch token -u


.PHONY: generate_supabase_defs
generate_supabase_defs:
	npx openapi-typescript ${SUPABASE_URL}/rest/v1/\?apikey=${SUPABASE_KEY} --output src/types/supabase.ts
