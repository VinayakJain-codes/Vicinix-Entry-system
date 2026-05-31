<!-- GSD:project-start source:PROJECT.md -->

## Project

**Marketnera QR Entry System**

A full-stack, real-time event access control platform that replaces manual attendance sheets with a digital, WhatsApp-delivered QR workflow. It generates a unique QR per student, delivers it via WhatsApp, and provides a scan-and-validate guard interface for institutional events (300-1,000 scale).

**Core Value:** Real-time, fraud-resistant digital entry validation and accurate headcount visibility at the gates, powered by WhatsApp QR delivery.

### Constraints

- **Tech Stack**: Next.js 15 (App Router), TypeScript, Supabase, Tailwind CSS — Chosen for rapid deployment and built-in API/realtime capabilities.
- **WhatsApp API Rate Limits**: Max 80 messages per second — Blast mechanism must include 15ms delay logic between sends.
- **Deployment**: Vercel — For zero-config hosting of the Next.js app.
- **Security**: Supabase Row Level Security (RLS) — Guards must not have direct DB query access; all validation runs securely through server-side `/api/scan`.

<!-- GSD:project-end -->

<!-- GSD:stack-start source:STACK.md -->

## Technology Stack

Technology stack not yet documented. Will populate after codebase mapping or first phase.
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->

## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->

## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:skills-start source:skills/ -->

## Project Skills

No project skills found. Add skills to any of: `.agent/skills/`, `.agents/skills/`, `.cursor/skills/`, `.github/skills/`, or `.codex/skills/` with a `SKILL.md` index file.
<!-- GSD:skills-end -->

<!-- GSD:workflow-start source:GSD defaults -->

## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:

- `/gsd-quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd-debug` for investigation and bug fixing
- `/gsd-execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->

<!-- GSD:profile-start -->

## Developer Profile

> Profile not yet configured. Run `/gsd-profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
