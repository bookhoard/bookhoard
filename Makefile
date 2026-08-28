.PHONY: dev build start lint install docker-up docker-down docker-logs clean

dev: ## Run the Next.js dev server
	pnpm dev

build: ## Production build
	pnpm build

start: ## Run the production build
	pnpm start

lint: ## Lint the project
	pnpm lint

install: ## Install dependencies
	pnpm install

docker-up: ## Start app + MinIO via docker compose
	docker compose up

docker-down: ## Stop docker compose stack
	docker compose down

docker-logs: ## Tail docker compose logs
	docker compose logs -f

clean: ## Remove build artifacts
	rm -rf .next
