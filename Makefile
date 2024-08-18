
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
	deno run --import-map=import_map.json --allow-read --allow-write --allow-net src/crawl.ts

.PHONY: import
import:
	deno run --import-map=import_map.json --allow-read --allow-write --allow-net src/import.ts

.PHONY: test
test:
	echo "Error: no test specified"

.PHONY: generate_supabase_defs
generate_supabase_defs:
	npx openapi-typescript ${SUPABASE_URL}/rest/v1/\?apikey=${SUPABASE_KEY} --output src/types/supabase.ts
