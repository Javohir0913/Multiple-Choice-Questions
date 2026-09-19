"""CSV/Excel bulk import for questions.

Expected columns (header row, case-insensitive):
    question, option_a, option_b, option_c, option_d, correct_answer, difficulty

- correct_answer: one of A/B/C/D (case-insensitive)
- difficulty: easy/medium/hard, optional, defaults to "medium"
"""
import io

import pandas as pd
from sqlalchemy.orm import Session

from app.models.answer import Answer
from app.models.question import Difficulty, Question
from app.schemas.question import ImportResult

REQUIRED_COLUMNS = ["question", "option_a", "option_b", "option_c", "option_d", "correct_answer"]
OPTION_COLUMNS = ["option_a", "option_b", "option_c", "option_d"]
OPTION_LETTERS = ["A", "B", "C", "D"]


def _read_dataframe(filename: str, content: bytes) -> pd.DataFrame:
    buffer = io.BytesIO(content)
    lowered = filename.lower()
    if lowered.endswith(".csv"):
        df = pd.read_csv(buffer)
    elif lowered.endswith(".xlsx") or lowered.endswith(".xls"):
        df = pd.read_excel(buffer)
    else:
        raise ValueError("Faqat .csv, .xlsx yoki .xls fayllar qo'llab-quvvatlanadi")
    df.columns = [str(c).strip().lower() for c in df.columns]
    return df


def import_questions(db: Session, subcategory_id: int, filename: str, content: bytes) -> ImportResult:
    df = _read_dataframe(filename, content)

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Fayl ustunlari yetishmayapti: {', '.join(missing)}")

    imported = 0
    errors: list[str] = []

    for idx, row in df.iterrows():
        row_num = idx + 2  # header + 1-indexed
        try:
            text = str(row["question"]).strip()
            if not text or text.lower() == "nan":
                errors.append(f"Qator {row_num}: savol matni bo'sh")
                continue

            options = [str(row[col]).strip() for col in OPTION_COLUMNS]
            if any(not o or o.lower() == "nan" for o in options):
                errors.append(f"Qator {row_num}: barcha 4 ta javob varianti to'ldirilishi kerak")
                continue

            correct_raw = str(row["correct_answer"]).strip().upper()
            if correct_raw not in OPTION_LETTERS:
                errors.append(f"Qator {row_num}: correct_answer A/B/C/D dan biri bo'lishi kerak")
                continue

            difficulty = Difficulty.medium
            if "difficulty" in df.columns:
                raw_difficulty = str(row["difficulty"]).strip().lower()
                if raw_difficulty in (d.value for d in Difficulty):
                    difficulty = Difficulty(raw_difficulty)

            question = Question(subcategory_id=subcategory_id, text=text, difficulty=difficulty)
            db.add(question)
            db.flush()  # get question.id

            correct_index = OPTION_LETTERS.index(correct_raw)
            for i, option_text in enumerate(options):
                db.add(Answer(question_id=question.id, text=option_text, is_correct=(i == correct_index)))

            imported += 1
        except Exception as exc:  # noqa: BLE001
            errors.append(f"Qator {row_num}: {exc}")

    db.commit()
    return ImportResult(imported=imported, errors=errors)
