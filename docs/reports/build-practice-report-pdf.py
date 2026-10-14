#!/usr/bin/env python3
"""Build LabPath-Practice-Report.pdf from report content."""

from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

OUT = Path(__file__).resolve().parent / "LabPath-Practice-Report.pdf"

styles = getSampleStyleSheet()
styles.add(
    ParagraphStyle(
        name="DocTitle",
        parent=styles["Title"],
        fontSize=20,
        spaceAfter=2,
        textColor=colors.HexColor("#0f172a"),
    )
)
styles.add(
    ParagraphStyle(
        name="DocSub",
        parent=styles["Normal"],
        fontSize=11,
        textColor=colors.HexColor("#475569"),
        spaceAfter=12,
    )
)
styles.add(
    ParagraphStyle(
        name="SecH1",
        parent=styles["Heading1"],
        fontSize=13,
        spaceBefore=12,
        spaceAfter=6,
        textColor=colors.HexColor("#0f172a"),
    )
)
styles.add(
    ParagraphStyle(
        name="Body",
        parent=styles["Normal"],
        fontSize=10,
        leading=13.5,
        spaceAfter=6,
    )
)
styles.add(
    ParagraphStyle(
        name="Li",
        parent=styles["Normal"],
        fontSize=9.5,
        leading=12.5,
        leftIndent=12,
        spaceAfter=3,
    )
)
styles.add(
    ParagraphStyle(
        name="Meta",
        parent=styles["Normal"],
        fontSize=9,
        textColor=colors.HexColor("#64748b"),
        spaceAfter=8,
    )
)


def table(data, widths):
    t = Table(data, colWidths=widths)
    t.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#f1f5f9")),
                ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ("FONTSIZE", (0, 0), (-1, -1), 8.5),
                ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#e2e8f0")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    return t


def main():
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=16 * mm,
    )
    s = []

    s.append(Paragraph("LabPath Practice Report", styles["DocTitle"]))
    s.append(
        Paragraph(
            "End-to-End Completion of the Published Problem Catalogue",
            styles["DocSub"],
        )
    )
    s.append(
        table(
            [
                ["Author", "Jewel Mia"],
                ["Date", "12 October 2026"],
                ["Scope", "30 live problems — 18 RAG · 11 Guardrails · 1 Agent"],
                ["Platform", "LabPath (simulator + hidden eval graders)"],
            ],
            [28 * mm, 130 * mm],
        )
    )
    s.append(Spacer(1, 10))

    s.append(Paragraph("Executive Summary", styles["SecH1"]))
    s.append(
        Paragraph(
            "I completed the full published LabPath catalogue. Each exercise uses a production-style brief, "
            "an interactive simulator, structured submission, and automated graders with a hidden evaluation set. "
            "This report covers what the problems are like, how I executed the catalogue, challenges encountered, "
            "and outcomes.",
            styles["Body"],
        )
    )

    s.append(Paragraph("1. What the problems are like", styles["SecH1"]))
    for line in [
        "<b>Brief</b> — Scenarios framed as launch reviews, security drills, or eval regressions.",
        "<b>Simulator</b> — RAG pipeline (corpus, chunk, query, generate), guardrails L1/L2/L3, or agent/tool loops.",
        "<b>Submission</b> — JSON fields: chunk params, prompts, attacks, page content, retriever code, controls.",
        "<b>Grading</b> — Class A gates: recall@k, nDCG, citations, refusals, levels won, Wilson thresholds, tool logs.",
        "<b>Feedback</b> — Sample failing cases on miss; hidden eval decides pass. No partial credit on class A.",
    ]:
        s.append(Paragraph("• " + line, styles["Li"]))
    s.append(
        Paragraph(
            "Difficulty: Easy introduces one lever; Medium adds trade-offs; Hard mirrors production (hybrid retrieval, "
            "adversarial corpus, slice regression, multi-turn jailbreak, custom retriever code).",
            styles["Body"],
        )
    )

    s.append(Paragraph("2. RAG track (18) — nature of the problems", styles["SecH1"]))
    s.append(
        table(
            [
                ["Phase", "Focus", "What they were like"],
                [
                    "1",
                    "Corpus",
                    "Chunk boundaries, overlap, top-k, scope — wrong splits hid answers from context.",
                ],
                [
                    "2",
                    "SLA / cost",
                    "Policy KB recall; token and spend caps — recall-only tuning failed.",
                ],
                [
                    "3",
                    "Generation",
                    "Frozen retrieval; [chunk:id] citations, grounding, refusals; stale index; hidden vs public eval.",
                ],
                [
                    "4–6",
                    "Production",
                    "Rerank, hybrid, code retriever, packing, multi-hop, adversarial spans, slice regression gate.",
                ],
            ],
            [14 * mm, 22 * mm, 122 * mm],
        )
    )

    s.append(PageBreak())

    s.append(Paragraph("3. Guardrails track (11) — nature of the problems", styles["SecH1"]))
    s.append(
        table(
            [
                ["Mode", "#", "What they were like"],
                [
                    "G1",
                    "4",
                    "Three-level concierge; attack prompts — direct exfil, indirect via retrieval, encoding, supply-chain docs.",
                ],
                [
                    "G2",
                    "2",
                    "Tool/data paths — BCC smuggle on send_email, PII/secret canaries via content the agent reads.",
                ],
                [
                    "G3",
                    "5",
                    "Blue-team — refusal UX, rules+judge, Wilson FP/FN, benign pass, multi-turn escalation.",
                ],
            ],
            [14 * mm, 10 * mm, 134 * mm],
        )
    )

    s.append(Paragraph("4. Agent track (1)", styles["SecH1"]))
    s.append(
        Paragraph(
            "<b>Agentic Loop with Grader Stop</b> — Malformed tool calls require one recovery (corrected args) then stop; "
            "pass verified from tool logs (no killed_loop).",
            styles["Body"],
        )
    )

    s.append(Paragraph("5. Method", styles["SecH1"]))
    for line in [
        "RAG phases in catalogue order; Guardrails G1→G2→G3; agent last.",
        "Submission log: change → metric → hidden pass/fail.",
        "Review class A gates before tuning.",
        "Time-boxed sessions on Hard problems.",
    ]:
        s.append(Paragraph("• " + line, styles["Li"]))

    s.append(Paragraph("6. Challenges", styles["SecH1"]))
    s.append(
        table(
            [
                ["Area", "Issue"],
                ["Hidden eval", "Public pass, hidden fail until strategy changed."],
                ["R3 citations", "False refusals on answerable questions."],
                ["Guard layers", "L1 attacks failed L2/L3 without redesign."],
                ["Metrics", "Recall tuning broke cost/spend problems."],
                ["G3", "Wilson / benign-pass threshold sensitivity."],
                ["Environment", "Production VM auth/cookies cost session time (ops, not content)."],
            ],
            [30 * mm, 128 * mm],
        )
    )

    s.append(PageBreak())
    s.append(Paragraph("7. What I learned from solving the problems", styles["SecH1"]))

    s.append(Paragraph("7.1 RAG track", styles["Body"]))
    s.append(
        table(
            [
                ["Topic", "Learning"],
                [
                    "Chunking",
                    "Wrong boundaries hide answers in context; heading/sentence splits beat fixed windows; overlap after sane splits.",
                ],
                [
                    "Metrics & cost",
                    "recall@k is a contract; log k vs tokens; FinOps caps conflict with recall-only tuning.",
                ],
                [
                    "Generation",
                    "Citations [chunk:id], grounding, and refusal balance — over-refusal fails answerable cases.",
                ],
                [
                    "Eval",
                    "Public smoke ≠ ship; hidden eval and slice regression gates (aggregate up, slice down).",
                ],
                [
                    "Advanced",
                    "Rerank/hybrid trade latency; custom retriever = explicit scoring; adversarial/multi-hop = real KB risk.",
                ],
            ],
            [28 * mm, 130 * mm],
        )
    )
    s.append(Spacer(1, 8))

    s.append(Paragraph("7.2 Guardrails track", styles["Body"]))
    s.append(
        table(
            [
                ["Topic", "Learning"],
                [
                    "G1",
                    "Per-level attacks — L1/L2/L3 need different shapes; one jailbreak rarely clears all.",
                ],
                [
                    "G2",
                    "Risk in page/tool context; BCC smuggle & canaries = schema validation, not chat-only.",
                ],
                [
                    "G3",
                    "Rules+judge, Wilson FP/FN, benign pass — tune monitors like production alerting.",
                ],
                [
                    "Mindset",
                    "G1/G2 offence informs G3 control tuning — need real attack shapes, not guesswork.",
                ],
            ],
            [28 * mm, 130 * mm],
        )
    )
    s.append(Spacer(1, 8))

    s.append(Paragraph("7.3 Agent & process", styles["Body"]))
    for line in [
        "<b>Agent:</b> Recover once with different tool args, then stop; grades from tool logs, not prose.",
        "<b>Process:</b> Class A gates are the spec; failing-case snippets beat generic tips.",
        "<b>Habit:</b> Submission log (change → metric → pass/fail) on Hard problems.",
        "<b>Reviews:</b> Full catalogue = map of skills (chunking through Wilson gates) with concrete examples.",
    ]:
        s.append(Paragraph("• " + line, styles["Li"]))

    s.append(Paragraph("8. Conclusion", styles["SecH1"]))
    s.append(
        Paragraph(
            "I completed all 30 published LabPath problems. The catalogue covers retrieval engineering, generation "
            "policy, eval discipline, offensive and defensive LLM security, and agent loop recovery. The learnings "
            "above are what I would apply on the next production RAG or agent launch.",
            styles["Body"],
        )
    )
    doc.build(s)
    print(f"Wrote {OUT} ({OUT.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
