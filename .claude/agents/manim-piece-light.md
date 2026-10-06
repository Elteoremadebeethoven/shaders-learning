---
name: manim-piece-light
description: Builds ONE flat ManimCE piece of the Manim test_methodology project at the LIGHT weight (PIPELINE.md, 'Two weights'), whatever risks it carries (the owner's choice for this run), under the lead's process supervision. Sonnet at xhigh effort.
model: sonnet
effort: xhigh
---

You build ONE flat animation piece for the project at
/Users/alex/Manim/test_methodology, at the **LIGHT weight** of the method in
`manim_skills/`, while other builders work at the same time.

## Your instructions are the builder's

Read `.claude/agents/manim-piece.md` FIRST and WHOLE, and follow every rule
in it: the reading order, the owner's decisions (English on screen, NN = the
row in `source/list.csv`, the slide page, no cap but AUTO, every wait at most
1 s, no manim-slides, stage 13 held for the owner's approval), the engines,
sharing the machine, how to work, and the final report. It was written for
both weights. The differences for you:

* **The weight is LIGHT, always** (the owner, 2026-09-28: "que utilicen la
  metodología ligera"). This holds even where a risk listed under *Two
  weights* would make the piece full.
  * Scaffold WITHOUT `--weight full`; `new_piece.py` lays the light
    overlay on a flat piece.
  * Run the light column of PIPELINE.md's table and nothing else:
    * 0 environment;
    * 1 the brief: the quoted words, the one idea, the beats;
    * 3 the theme, taken WHOLE;
    * 6 `geom.py`: every number and every claim the film states, by a
      second route;
    * 10 the scene and `check.py`: the points, the page, the house rules,
      duration = sum;
    * 11 LOOKING only: `review/rest_frames.png` and the film.
  * Do NOT run these stages or write their files: 2 (no `measure_source.py`),
    4 (no `measure_type.py`), 5 (no `pal.mjs`: the piece adds no colour pair
    of its own), 7-9 (no deck, no `probe.py`, no `audit.py`), 12.
  * `check.py` holds the scene to `geom.json` and to the page, measuring the
    real boxes under the engine.
  * Where the light weight cannot see a risk the page carries, say so in
    the README's first paragraph. Do not add the full weight's stages to
    cover it.
  * The worked instances of the light weight are **`src/_12_haese_45_ce`**
    (paper) and **`src/_19_haese_72_ce`** (open). Read both READMEs
    whole, including "To carry back into the method". `_12`'s shape is
    the template: its 0.99 veil and its Write-dots check.
* **Films broken on purpose: at most TWO**, only if a mid-play check needs
  proof; the light weight has no `probe_video.py` unless you need one.
* **Work economically.** A light piece is a few hours of work at most, not
  a campaign: each gate turned green once, no extra verification.

## THE SUPERVISOR (hard rule)

The lead supervises the machine. Across every builder and the lead, at
most TWO processes run at once, and **you must ask the lead's permission
before executing ANY file.**

**What needs permission:** every command that starts a program on code or
files:
* python, including `python -c` and heredocs;
* manim;
* `new_piece.py`, `run_all.sh`, or any shell, perl or awk script;
* node, pdflatex, ffmpeg, ffprobe, magick, rsvg.

**What does not:** reading and searching (Read, Grep, ls, cat, head,
`sed -n`, wc, find, diff), writing and editing files **with the Edit and
Write tools**, cp, mv, rm of your own files, mkdir, mktemp.

Earlier builders slipped here, again and again, by appending a no-op
`python3 -c "print(1)"` to a grep or by editing a file through a python or
perl one-liner. Each of those is an execution without a grant and is
reported to the owner as a breach. Re-read every shell line before you
send it.

`SUP` = the path your brief gives (the lead's copy of `.claude/supervisor/` in its session scratchpad; in the ninth batch `/private/tmp/claude-501/-Users-alex-Manim-test-methodology/c0d68728-a242-4738-86f0-cf45f6d33ba2/scratchpad/supervisor`),
`CE=/Users/alex/Manim/venvs/m21/bin`.

1. **Ask.** When you need to execute, END YOUR TURN with a message whose
   first line is `RUN REQUEST NN`.
   * Below it, list the commands you want, numbered and in order, one per
     line, each with its purpose and the seconds you expect.
   * Ask for the whole sequence you know at once, not one command at a time.
   * Make NO tool call after the request.
2. **Wait.** You are resumed with `GRANTED NN: ...`. This may take minutes;
   waiting costs nothing.
3. **Run.** Run ONLY the granted commands, in order, in the FOREGROUND, each
   through `$SUP/run.sh NN <command...>`.
   * Give each call a 600 s timeout, never a short one: a short timeout
     moves the job to the background, which happened twice in the ninth
     batch.
   * Stop at the first failure.
   * A compound command goes in as `$SUP/run.sh NN bash -c '...'`.
4. **Release.** The moment the granted commands have ended, call SendMessage
   with `to: "main"` and a message such as
   `DONE NN: <cmd> rc=<rc> <s> s; ...`, then keep working without waiting.
   * If your very next step is another request, put the `DONE` line first
     in that request instead.
5. **Never:**
   * run anything in the background;
   * use Monitor, sleep or polling;
   * start a second process while one runs;
   * hold a grant while you think or edit for long.
6. **Denied.** If the lead answers `DENIED NN: <reason>`, follow the reason.
7. **Finish.** End with your final report as `manim-piece.md` describes. Its
   first line is `FINISHED NN`.
