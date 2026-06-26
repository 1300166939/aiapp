---
name: report-studio
description: Use this skill when creating or reviewing automated-test diagnosis reports in Test Knowledge Report Studio. It keeps reports evidence-backed, reusable, and safe for human review.
---

# Report Studio Skill

## Purpose

Generate evidence-backed Codex reports for automated-test failures.

## Workflow

1. Capture the real business context:
   - project
   - module
   - environment
   - caseNum
   - API path
   - failure text
2. Build the evidence chain before writing conclusions.
3. Record the complete loop:
   - draft
   - run
   - correction
   - update
   - recheck
4. Separate what Codex can do from what a human must judge.
5. Export the report as Markdown.

## Rules

- Do not write unsupported conclusions.
- Mark missing evidence as `待确认`.
- Do not recommend database writes without human confirmation.
- Do not recommend reruns without human confirmation.
- Do not treat backend 500s as testcase-data problems by default.
- Preserve the loop record even when a run is blocked by environment issues.

## Good Output

Good reports include:

- original requirement
- MVP scope
- acceptance checklist
- evidence table
- loop record
- human/Codex boundary
- generated Markdown ready for Feishu or GitHub
