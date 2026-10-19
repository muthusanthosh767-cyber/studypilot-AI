from pydantic import BaseModel, Field

class GenerateQuizRequest(BaseModel):
    document_id: str
    question_count: int = Field(default=5, ge=1, le=20)

class QuizAnswer(BaseModel):
    question_id: str
    selected_option: int = Field(ge=0, le=3)

class SubmitQuizRequest(BaseModel):
    document_id: str
    document_name: str
    answers: list[QuizAnswer]
    questions: list[dict]

