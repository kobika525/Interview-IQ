"""Generates downloadable PDF reports using reportlab (pure Python, no
external binary dependency)."""

import os

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

from app.config import settings

styles = getSampleStyleSheet()
TITLE_STYLE = ParagraphStyle("TitleStyle", parent=styles["Title"], textColor=colors.HexColor("#1E2438"))
HEADING_STYLE = ParagraphStyle("HeadingStyle", parent=styles["Heading2"], textColor=colors.HexColor("#1EA7FF"))
BODY_STYLE = styles["BodyText"]


def _display_metric(value, suffix: str = "") -> str:
    return "Unavailable" if value is None else f"{value}{suffix}"


def _output_path(kind: str, entity_id: int) -> str:
    directory = os.path.join(settings.UPLOAD_DIR, "reports")
    os.makedirs(directory, exist_ok=True)
    path = os.path.join(directory, f"{kind}_{entity_id}.pdf")
    return path


def generate_interview_report_pdf(report: dict, question_breakdown: list[dict]) -> str:
    path = _output_path("interview_report", report["id"])
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    story = [
        Paragraph("Interview IQ — Interview Report", TITLE_STYLE),
        Spacer(1, 12),
        Paragraph(f"Overall score: {report['overall_score']} / 100 ({report['performance_label']})", HEADING_STYLE),
        Spacer(1, 8),
        Paragraph(report["executive_summary"], BODY_STYLE),
        Spacer(1, 14),
    ]

    score_pairs = [
            ("Communication", "communication_score"), ("Technical", "technical_score"),
            ("Problem Solving", "problem_solving_score"), ("Confidence", "confidence_score"),
            ("Relevance", "relevance_score"), ("Structure", "structure_score"),
            ("Professionalism", "professionalism_score"), ("Grammar", "grammar_score"),
            ("Voice quality", "voice_quality_score"),
    ]
    score_table_data = [["Category", "Score"]] + [
        [label, str(report.get(key))]
        for label, key in score_pairs
        if report.get(key) is not None
    ]
    table = Table(score_table_data, colWidths=[8 * cm, 4 * cm])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1EA7FF")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E1E6F5")),
        ("FONTSIZE", (0, 0), (-1, -1), 9),
    ]))
    story.append(table)
    story.append(Spacer(1, 16))

    voice_rows = [
        [label, str(report.get(key))]
        for label, key in [
            ("Recording duration (s)", "recording_duration_seconds"), ("Words per minute", "speaking_wpm"),
            ("Speaking speed", "speaking_speed"), ("Average pause (s)", "average_pause_seconds"),
            ("Longest pause (s)", "longest_pause_seconds"), ("Long pauses", "long_pause_count"),
            ("Filler words", "filler_word_count"), ("Voice confidence", "voice_confidence_score"),
            ("Voice fluency", "voice_fluency_score"), ("Pronunciation quality", "pronunciation_quality_score"),
            ("Voice clarity", "speech_clarity_score"),
        ] if report.get(key) is not None
    ]
    if voice_rows:
        story.append(Paragraph("Voice Delivery Metrics", HEADING_STYLE))
        voice_table = Table([["Metric", "Value"]] + voice_rows, colWidths=[8 * cm, 4 * cm])
        voice_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1EA7FF")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E1E6F5")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        story.extend([voice_table, Spacer(1, 16)])

    video_rows = [
        [label, str(report.get(key))]
        for label, key in [
            ("Eye contact (%)", "eye_contact_percentage"),
            ("Face detection (%)", "face_detection_percentage"),
            ("Head position", "head_position_score"),
            ("Looking away (%)", "looking_away_percentage"),
            ("Smile detection (%)", "smile_percentage"),
            ("Face visibility (%)", "face_visibility_percentage"),
            ("Camera stability", "camera_stability_score"),
            ("Lighting quality", "lighting_quality_score"),
        ] if report.get(key) is not None
    ]
    if video_rows:
        story.append(Paragraph("Video Presentation Metrics", HEADING_STYLE))
        video_table = Table([["Metric", "Value"]] + video_rows, colWidths=[8 * cm, 4 * cm])
        video_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1EA7FF")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E1E6F5")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        story.extend([video_table, Spacer(1, 16)])

    visual = report.get("visual_metrics") or {}
    if visual:
        story.append(Paragraph("Visual Presentation Analysis", HEADING_STYLE))
        visual_rows = [
            ["Face presence", _display_metric(visual.get("face_presence_percentage"), "%")],
            ["Camera engagement (approx.)", _display_metric(visual.get("eye_contact_percentage"), "%")],
            ["Head stability", _display_metric(visual.get("head_stability_score"), "/100")],
            ["Lighting", str(visual.get("lighting_status") or "unavailable").replace("_", " ")],
            ["Camera framing", _display_metric(visual.get("camera_framing_score"), "/100")],
            ["Multiple-face warning", "Yes" if visual.get("multiple_face_warning") else "No"],
            ["Visual Presentation Score", _display_metric(visual.get("visual_presentation_score"), "/100")],
        ]
        visual_table = Table([["Metric", "Value"]] + visual_rows, colWidths=[8 * cm, 6 * cm])
        visual_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1EA7FF")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#E1E6F5")),
            ("FONTSIZE", (0, 0), (-1, -1), 9),
        ]))
        story.extend([visual_table, Spacer(1, 8)])
        for guidance in visual.get("camera_framing_guidance", []):
            story.append(Paragraph(f"&#8226; {guidance}", BODY_STYLE))
        if visual.get("lighting_recommendation"):
            story.append(Paragraph(visual["lighting_recommendation"], BODY_STYLE))
        story.extend([
            Spacer(1, 6),
            Paragraph(visual.get("visual_presentation_disclaimer") or
                      "This score evaluates visible interview-presentation conditions and does not measure personality, emotion, honesty, or hiring suitability.",
                      ParagraphStyle("VisualDisclaimer", parent=BODY_STYLE, fontSize=8, textColor=colors.grey)),
            Spacer(1, 16),
        ])

    story.append(Paragraph("Strengths", HEADING_STYLE))
    for s in report["strengths"]:
        story.append(Paragraph(f"• {s}", BODY_STYLE))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Growth Areas", HEADING_STYLE))
    for g in report["growth_areas"]:
        story.append(Paragraph(f"• {g}", BODY_STYLE))
    story.append(Spacer(1, 10))

    for title, key in (
        ("Interview Tips", "interview_tips"), ("Career Advice", "career_advice"),
        ("Suggested Learning Resources", "suggested_learning_resources"),
    ):
        if report.get(key):
            story.append(Paragraph(title, HEADING_STYLE))
            for item in report[key]:
                story.append(Paragraph(f"• {item}", BODY_STYLE))
            story.append(Spacer(1, 10))

    if report.get("improved_answers"):
        story.append(Paragraph("Improved Answers", HEADING_STYLE))
        for index, answer in enumerate(report["improved_answers"], start=1):
            story.append(Paragraph(f"{index}. {answer}", BODY_STYLE))
        story.append(Spacer(1, 10))

    if report.get("hiring_recommendation"):
        story.append(Paragraph("Mock Interview Readiness", HEADING_STYLE))
        story.append(Paragraph(report["hiring_recommendation"], BODY_STYLE))
        story.append(Spacer(1, 10))

    story.append(Paragraph("Question-by-Question Feedback", HEADING_STYLE))
    for i, item in enumerate(question_breakdown, start=1):
        story.append(Paragraph(f"<b>Q{i}: {item['question']}</b>", BODY_STYLE))
        story.append(Paragraph(f"Score: {item['score']}/100 — {item['feedback']}", BODY_STYLE))
        story.append(Spacer(1, 6))

    story.append(Spacer(1, 14))
    story.append(Paragraph(report["model_disclaimer"], ParagraphStyle("Disclaimer", parent=BODY_STYLE, fontSize=8, textColor=colors.grey)))

    doc.build(story)
    return path


def generate_resume_report_pdf(resume_filename: str, analysis: dict) -> str:
    path = _output_path("resume_analysis", analysis["id"])
    doc = SimpleDocTemplate(path, pagesize=A4, topMargin=2 * cm, bottomMargin=2 * cm)
    story = [
        Paragraph("Interview IQ — Resume Analysis", TITLE_STYLE),
        Spacer(1, 10),
        Paragraph(f"File: {resume_filename}", BODY_STYLE),
        Paragraph(f"Estimated AI-assisted ATS readiness score: {analysis['overall_score']} / 100", HEADING_STYLE),
        Spacer(1, 12),
        Paragraph("Strengths", HEADING_STYLE),
    ]
    for s in analysis["strengths"]:
        story.append(Paragraph(f"• {s}", BODY_STYLE))
    story.append(Spacer(1, 10))
    story.append(Paragraph("Suggestions", HEADING_STYLE))
    for s in analysis["suggestions"]:
        story.append(Paragraph(f"• {s}", BODY_STYLE))

    doc.build(story)
    return path
