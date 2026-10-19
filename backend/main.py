from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db, list_attempts, save_attempt
from app.schemas import GenerateQuizRequest, SubmitQuizRequest
from app.services.pdf_reader import extract_pdf_pages
from app.services.question_generator import generate_questions

app = FastAPI(title="StudyPilot AI API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

documents: dict[str, dict] = {}

@app.on_event("startup")
def startup():
    init_db()

@app.get("/")
def home():
    return {"message": "StudyPilot AI API is running", "docs": "/docs"}

@app.get("/health")
def health():
    return {"status": "healthy"}

@app.post("/api/documents/upload")
async def upload_document(file: UploadFile = File(...)):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF file.")
    data = await file.read()
    pages = extract_pdf_pages(data)
    import uuid
    document_id = str(uuid.uuid4())
    documents[document_id] = {"name": file.filename, "pages": pages}
    total_chars = sum(len(page["text"]) for page in pages)
    return {
        "document_id": document_id,
        "filename": file.filename,
        "pages_with_text": len(pages),
        "characters_extracted": total_chars,
        "preview": pages[0]["text"][:700],
        "message": "PDF text extracted successfully."
    }

@app.post("/api/quizzes/generate")
def create_quiz(payload: GenerateQuizRequest):
    document = documents.get(payload.document_id)
    if not document:
        raise HTTPException(status_code=404, detail="Document not found. Upload the PDF again.")
    try:
        questions = generate_questions(document["pages"], payload.question_count)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc))
    # Keep answer keys in memory for this demo; frontend receives them for simple client scoring.
    return {
        "document_id": payload.document_id,
        "document_name": document["name"],
        "questions": questions,
        "note": "Starter generator uses source-sentence heuristics; verify questions against the PDF."
    }

@app.post("/api/quizzes/submit")
def submit_quiz(payload: SubmitQuizRequest):
    if not payload.questions:
        raise HTTPException(status_code=400, detail="No questions were submitted.")
    answers = {item.question_id: item.selected_option for item in payload.answers}
    total = len(payload.questions)
    score = 0
    results = []
    for question in payload.questions:
        selected = answers.get(question.get("id"))
        correct = selected == question.get("correct_index")
        score += int(correct)
        results.append({
            "question_id": question.get("id"),
            "selected_option": selected,
            "correct_index": question.get("correct_index"),
            "correct": correct,
            "explanation": question.get("explanation"),
            "source_page": question.get("source_page"),
        })
    attempt_id = save_attempt(payload.document_name, score, total)
    return {"attempt_id": attempt_id, "score": score, "total": total, "percentage": round(score / total * 100), "results": results}

@app.get("/api/progress")
def progress():
    attempts = list_attempts()
    return {"attempts": attempts, "count": len(attempts)}
