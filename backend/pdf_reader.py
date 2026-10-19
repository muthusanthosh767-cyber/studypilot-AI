import fitz
from fastapi import HTTPException

MAX_FILE_BYTES = 10 * 1024 * 1024

def extract_pdf_pages(data: bytes) -> list[dict]:
    if not data:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(data) > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="PDF must be 10 MB or smaller.")
    try:
        doc = fitz.open(stream=data, filetype="pdf")
    except Exception:
        raise HTTPException(status_code=400, detail="This file could not be read as a PDF.")
    pages = []
    try:
        for index, page in enumerate(doc):
            text = " ".join(page.get_text("text").split())
            if text:
                pages.append({"page": index + 1, "text": text})
    finally:
        doc.close()
    if not pages:
        raise HTTPException(
            status_code=422,
            detail="No selectable text found. Scanned PDFs need OCR, which this version does not include."
        )
    return pages
