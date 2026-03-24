dev:
	docker-compose up --build

test:
	npm run test --workspace=packages/server

lint:
	npm run lint

clean:
	docker-compose down && docker system prune -f
