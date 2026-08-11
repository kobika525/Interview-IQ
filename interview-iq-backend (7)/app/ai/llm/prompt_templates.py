"""Centralized prompt templates for the optional local-LLM enrichment path."""

QUESTION_GENERATION_PROMPT = """You are an interview coach. Generate one {interview_type} interview
question about "{topic}" at {difficulty} difficulty for a {role} candidate.
Return only the question text, nothing else."""

FEEDBACK_ENRICHMENT_PROMPT = """You are an interview coach reviewing a candidate's answer.
Question: {question}
Candidate answer: {answer}
Give two sentences of specific, constructive feedback. Do not repeat the question."""
