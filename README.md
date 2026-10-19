# StudyPilot AI 📚

A study and exam-preparation assistant that turns PDF notes into practice quizzes and tracks results.

## Features
- Upload text-based PDF notes
- Extract text with page numbers
- Generate practice MCQs from extracted notes (rule-based starter; no paid AI key required)
- Take quizzes and view scores
- Save quiz history in SQLite
- FastAPI backend with interactive API docs
- React + TypeScript frontend
- Basic backend tests

## Tech stack
- Frontend: React, TypeScript, Vite
- Backend: Python, FastAPI, PyMuPDF, SQLite
- Tests: Pytest

## Requirements
- Python 3.10+
- Node.js 18+
- npm

## Run locally

### 1. Backend
Open a terminal in the project root:

```bash
cd backend
python -m venv .venv
```

Activate the environment:
- Windows PowerShell: `.venv\Scripts\Activate.ps1`
- Windows CMD: `.venv\Scripts\activate.bat`
- macOS/Linux: `source .venv/bin/activate`

Install dependencies and run:

```bash
pip install -r requirements.txt
uvicorn app.main:app --reload
```

API docs: http://127.0.0.1:8000/docs

### 2. Frontend
Open a second terminal in the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the URL printed by Vite, usually http://localhost:5173.

## How it works
1. Upload a text-based PDF.
2. The backend extracts text and preserves page numbers.
3. Choose how many questions to generate.
4. Answer the quiz and submit it.
5. Review the score and source page for each question.

## Important limitations
- The starter quiz generator uses sentence/keyword heuristics, not a large language model. Generated questions may be simple or imperfect.
- Scanned/image-only PDFs need OCR and are not supported by this starter version.
- Source page references show where the source sentence was extracted; always verify important answers against the original notes.
- This demo is not intended for sensitive/private documents.

## API endpoints
- `GET /` — API status
- `GET /health` — health check
- `POST /api/documents/upload` — upload PDF and extract text
- `POST /api/quizzes/generate` — generate questions from a document
- `POST /api/quizzes/submit` — score a submitted quiz
- `GET /api/progress` — recent quiz attempts

## Tests
From the project root, activate the backend environment and run:

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

## GitHub upload
Create an empty repository named `studypilot-ai`, then from this folder:

```bash
git init
git add .
git commit -m "Build StudyPilot AI MVP"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/studypilot-ai.git
git push -u origin main
```

Replace `YOUR-USERNAME` with your GitHub username. Never commit API keys, passwords, private PDFs, or your local database.

## Future improvements
- Optional AI provider integration with grounded citations
- OCR for scanned PDFs
- Login and multi-user accounts
- Revision planner and flashcards
- Topic-level analytics
