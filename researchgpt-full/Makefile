dev:
	docker compose up --build

api:
	cd apps/api && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

web:
	cd apps/web && npm run dev

zip:
	cd .. && zip -r researchgpt-full.zip researchgpt-full -x '*/node_modules/*' '*/.next/*' '*/__pycache__/*'
