# Requires `make` (Git Bash on Windows may not have it — use the raw commands
# listed in README.md if `make` is unavailable).

.PHONY: help install dev test lint freeze-check i18n clean

help:
	@echo "install       install backend + frontend deps"
	@echo "dev           run backend (:8000) and frontend (:5173)"
	@echo "test          run the backend test suite"
	@echo "lint          ruff check backend/"
	@echo "freeze-check  regenerate reason keys and fail if any are missing"
	@echo "i18n          verify every key exists in EN/HI/PA"
	@echo "clean         remove caches and the intel db"

install:
	cd backend && python -m pip install -r requirements.txt
	cd frontend && npm install

dev:
	@echo "Run these in two terminals:"
	@echo "  cd backend  && uvicorn app.main:app --reload --port 8000"
	@echo "  cd frontend && npm run dev"

test:
	cd backend && python -m pytest -q

lint:
	cd backend && python -m ruff check .

# Regenerates backend/app/data/reason_keys.json from rules.json + patterns.json,
# then fails if any key is missing from any messages_*.json.
freeze-check:
	cd backend && python ../tools/freeze_reason_keys.py
	cd backend && python ../tools/check_i18n.py

i18n:
	cd backend && python ../tools/check_i18n.py

clean:
	rm -rf backend/.pytest_cache backend/app/__pycache__ intel.db intel.db-wal intel.db-shm
	find backend -name "__pycache__" -type d -exec rm -rf {} +