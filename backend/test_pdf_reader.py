import fitz
import pytest
from fastapi import HTTPException
from app.services.pdf_reader import extract_pdf_pages

def test_rejects_empty_file():
    with pytest.raises(HTTPException):
        extract_pdf_pages(b"")

def test_extracts_text_from_pdf():
    doc = fitz.open()
    page = doc.new_page()
    page.insert_text((72, 72), "StudyPilot sample PDF contains selectable text for testing.")
    data = doc.tobytes()
    doc.close()
    pages = extract_pdf_pages(data)
    assert pages
    assert pages[0]["page"] == 1
    assert "StudyPilot" in pages[0]["text"]
