# DataDeck Agent Guidelines

This repository implements **DataDeck** — an illuminated, transparent data-pipeline studio where every transformation is visible, reversible, and user-controlled.

## Design Direction & Aesthetic Standards
- Direction: [`docs/DESIGN_SYSTEM.md`](docs/DESIGN_SYSTEM.md) specifies the **Maximalist White** visual language.
- Key principles:
  - 12 named tonal whites (`--white-100` down to `--white-10`), deep warm shadows (`--shadow-1` through `--shadow-4`), emboss and deboss highlights.
  - Ink (`#1C1B18`) and Graphite (`#4A4840`) are reserved exclusively for text and data marks.
  - Visual hierarchy and series differentiation in data charts use **form, patterns, hatchings, dash arrays, and marker geometries**, never arbitrary rainbow hues.
  - Ornaments: Guilloché patterns, 8px dotted grid, paper grain, corner framing brackets (⌜ ⌝ ⌞ ⌟), index numerals (`№ 01`, `§ 02`, `Fig. 1`), circular status seals ("DEAL READY", "CLEANSED", "FORECASTED"), and ribbon tabs.
  - Card Deck metaphor: Stage rail (① Ingest · ② Cleanse · ③ Forecast · ④ Compose), center card stack with slight rotation fanning (±1.5°), and right-hand inspector panel.
  - Tone & voice: Literary, precise, slightly theatrical ("Deal in your data", "Shuffling the deck...", "14 strays set aside", "A card slipped — here's why").

## Craftsmanship & UI Skills
- Typography: Consult [`skills-main/skills/better-typography/SKILL.md`](skills-main/skills/better-typography/SKILL.md) for tabular numbers, font pairings (*Fraunces*, *Inter*, *JetBrains Mono*, *Cormorant Garamond*), and text mechanics.
- Accessibility: Consult [`skills-main/skills/better-accessibility/SKILL.md`](skills-main/skills/better-accessibility/SKILL.md) for semantic structure, keyboard navigation, focus rings, and high contrast (≥15:1 for ink on snow).
- Interface Polish: Consult [`skills-main/skills/better-interface/SKILL.md`](skills-main/skills/better-interface/SKILL.md) and [`skills-main/skills/better-ui/SKILL.md`](skills-main/skills/better-ui/SKILL.md).

<!-- antislop:start -->
## antislop
For UI, copy, people, mobile layout, or code comments work, read `anti-slop-3.2.20/antislop.md` (core) and then the skill for the task:
- UI / visual: `anti-slop-3.2.20/skills/antislop-ui/SKILL.md`
- Copy & text: `anti-slop-3.2.20/skills/antislop-copywriting/SKILL.md`
- People: `anti-slop-3.2.20/skills/antislop-human/SKILL.md`
- Mobile / responsive: `anti-slop-3.2.20/skills/antislop-layoutmobile/SKILL.md`
- Code comments: `anti-slop-3.2.20/skills/antislop-code/SKILL.md`
Before starting, follow the core's "Two Usage Modes" section in strict order: explicit session instruction first, then global preference, then ask. A session instruction always wins. For a resolved mode, say `antislop active: <mode> (session override).` or `antislop active: <mode> (global preference).` once before presenting findings or making edits, using the actual mode and source. Acknowledging the user's request without naming the source does not replace this notice.
Only an explicit choice of antislop during or after selects a session mode. A request to review, audit, or avoid file edits does not select a mode; read the global preference in that case. Another skill's mode does not select antislop's mode.
If the mode is unresolved, ask during/after and end the response; wait for the answer before any UI review, planning, or concept. For read-only tasks, put the active-mode notice only at the start of the final answer, never in progress messages. For editing tasks, announce before the first edit and omit it from the final answer.
To update antislop later: download `antislop.md` again, or run `npx antislop-ai --update` if it was installed as skill folders.
<!-- antislop:end -->
