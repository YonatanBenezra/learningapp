# Phase 3 Step 3 — Proctor vendor demo playbook

**Owner:** Jewel Mia (demo booking + contract). Yonatan Benezra (technical + DPIA notes).

Use with [phase-3-proctor-vendor-shortlist.md](./phase-3-proctor-vendor-shortlist.md).

---

## এখনই করো (আজ, কোনো vendor approval ছাড়া)

### 1. Constructor SDK playground — self-service demo

**URL:** https://sdk-demo.web.proctor.constructor.app/

এটা public sandbox। Jewel বা Yonatan browser-এ গিয়ে:

1. **Start** → consent screen দেখো (camera + desktop recording)
2. Demo quiz complete করো
3. Note করো:
   - Webcam + screen share flow কেমন
   - Native app লাগে কিনা (O10 gate 7)
   - Post-exam review mode demo-তে দেখানো যায় কিনা (sales call-এ চাইবে)
   - No-webcam mode playground-এ আছে কিনা

**Fill after:** `docs/phase-3-proctor-demo-notes.md` → Constructor section

---

## এই সপ্তাহ — তিন vendor demo book

| # | Vendor | Demo path | Who books | Contact |
|---|---|---|---|---|
| 1 | **Constructor Proctor** | SDK playground (above) + sales demo for API/EU/price | Jewel Mia | all-sales@constructor.tech · https://constructor.tech/lp/proctor/competitor |
| 2 | **PRUEFSTER** | Website calendar — "I want to provide an exam" | Jewel Mia | https://pruefster.com → Get in touch · +49 5161 7089050 |
| 3 | **Talview EU** | 30-min demo form | Jewel Mia | https://www.talview.com/en/demo · us@talview.com |

---

## Demo booking email (Jewel Mia — copy/paste)

**Subject:** Demo request — LabPath proctoring integration (EU, record-and-review, API)

```
Hi,

I'm Jewel Mia, co-founder at LabPath (labpath.com) — a graded practice platform for AI engineers, built by Bina/CyberProAI.

We're evaluating proctoring for verified assessments and would like a 30-minute demo focused on:

- Record-and-review (async) — NOT live invigilation
- Web SDK or REST API embedded in our product (browser-only, no desktop installer)
- EU data processing and storage (must be named in your DPA)
- Face-matching and ID capture disabled
- Per-sitting pricing at ~50 and ~500 sittings/year (target ≤ €8/sitting)

Attendees: Jewel Mia (commercial) + Yonatan Benezra (product/technical).

Please send a calendar link or propose times (CET-friendly).

After the demo we'd like a written quote and your DPA template.

Best,
Jewel Mia
LabPath / Bina
```

---

## Demo-তে যা দেখতে/জিজ্ঞেস করতে হবে (checklist)

Demo চলাকালীন worksheet Part 1 gates mark করো — verbal answer = `pending*` (written quote/DPA দিয়ে confirm):

| Gate | Demo-তে কী দেখবে / জিজ্ঞেস করবে |
|---|---|
| 1 Record-and-review | Live proctor দেখাচ্ছে না তো? "Post-review" / "AI + async review" mode দেখাও |
| 2 ≤ €8/sitting | Written quote চাও — verbal price লিখে রাখো, gate pass না |
| 3 No min commitment | "Smallest contract for ~50 sittings/year?" |
| 4 EU storage | "DPA-তে region name কী? Marketing page না — contract clause" |
| 5 30-day retention | Retention config screen বা API দেখাও |
| 6 No biometric | Face-match / ID verification toggle OFF দেখাও |
| 7 Web SDK | Browser flow — installer/native app লাগে কিনা |
| 8 DPA | Template same week-এ পাঠাতে বলো |
| 9 Export on exit | Termination-এ recording export + delete process |
| 10 No webcam | Webcam deny করলে কী হয়? Screen reader doc আছে? |

---

## Demo পরে (প্রতি vendor)

- [ ] Notes লিখো → [phase-3-proctor-demo-notes.md](./phase-3-proctor-demo-notes.md)
- [ ] Written quote চাও (email follow-up — Part 3 questions)
- [ ] DPA template চাও
- [ ] Shortlist worksheet Part 1 update (`pass` / `fail` / `pending`)
- [ ] সব gate pass + price OK → Jewel Mia DPA sign → Yonatan DPIA

---

## কোড / integration — এখনো না

Demo বা playground দেখলেও production recording চালু করো না। Integration Step 4-এ, vendor + signed DPA-র পর।
