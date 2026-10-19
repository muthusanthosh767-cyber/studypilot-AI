import re
import uuid

STOPWORDS = {
    "about", "above", "after", "again", "against", "also", "among", "because",
    "before", "being", "between", "could", "during", "each", "from", "have",
    "into", "more", "most", "other", "over", "same", "should", "some", "such",
    "than", "that", "their", "there", "these", "they", "this", "those", "through",
    "under", "using", "very", "what", "when", "where", "which", "while", "with",
    "would", "your", "the", "and", "for", "are", "was", "were", "has", "had",
    "can", "not", "but", "its", "you", "our", "all", "any", "use", "used",
}

def _sentences(text: str) -> list[str]:
    chunks = re.split(r"(?<=[.!?])\s+|(?<=;)\s+", text)
    return [re.sub(r"\s+", " ", s).strip(" -•\t") for s in chunks if len(s.split()) >= 7]

def _keywords(sentence: str) -> list[str]:
    words = re.findall(r"[A-Za-z][A-Za-z0-9-]{3,}", sentence)
    seen = set()
    result = []
    for word in words:
        low = word.lower()
        if low not in STOPWORDS and low not in seen:
            seen.add(low)
            result.append(word.strip("-"))
    return result

def generate_questions(pages: list[dict], count: int) -> list[dict]:
    candidates = []
    for page in pages:
        for sentence in _sentences(page["text"]):
            keywords = _keywords(sentence)
            if keywords:
                candidates.append({"sentence": sentence, "page": page["page"], "keywords": keywords})
    # Prefer longer but readable sentences; preserve different source sentences.
    candidates.sort(key=lambda item: min(len(item["sentence"].split()), 28), reverse=True)
    questions = []
    used = set()
    all_keywords = []
    for candidate in candidates:
        key = candidate["sentence"].lower()
        if key in used:
            continue
        used.add(key)
        all_keywords.extend(candidate["keywords"])
        if len(questions) >= count:
            break
        answer = candidate["keywords"][0]
        masked = re.sub(rf"\b{re.escape(answer)}\b", "________", candidate["sentence"], count=1, flags=re.I)
        distractors = []
        for word in candidate["keywords"][1:] + all_keywords:
            if word.lower() != answer.lower() and word.lower() not in {x.lower() for x in distractors}:
                distractors.append(word)
            if len(distractors) == 3:
                break
        # Fallback options if source sentence has too few distinct keywords.
        for fallback in ["security", "system", "process", "information", "network", "method"]:
            if len(distractors) >= 3:
                break
            if fallback.lower() != answer.lower() and fallback.lower() not in {x.lower() for x in distractors}:
                distractors.append(fallback)
        options = distractors[:3] + [answer]
        # deterministic shuffle by rotating based on question count
        shift = len(questions) % 4
        options = options[shift:] + options[:shift]
        correct_index = next(i for i, option in enumerate(options) if option.lower() == answer.lower())
        questions.append({
            "id": str(uuid.uuid4()),
            "question": f"Complete the sentence: {masked}",
            "options": options,
            "correct_index": correct_index,
            "explanation": candidate["sentence"],
            "source_page": candidate["page"],
        })
    if not questions:
        raise ValueError("Not enough readable text to generate questions. Try a PDF with longer sentences.")
    return questions
