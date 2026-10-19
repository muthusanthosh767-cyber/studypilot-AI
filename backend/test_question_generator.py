from app.services.question_generator import generate_questions

def test_generates_questions_with_source_pages():
    pages = [{
        "page": 2,
        "text": "Computer networks connect multiple devices together. Network security protects information from unauthorized access."
    }]
    questions = generate_questions(pages, 2)
    assert len(questions) >= 1
    assert all(q["source_page"] == 2 for q in questions)
    assert all(len(q["options"]) == 4 for q in questions)
    assert all(0 <= q["correct_index"] < 4 for q in questions)
