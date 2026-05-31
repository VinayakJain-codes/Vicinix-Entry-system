# Marketnera QR Entry System

## What This Is

A full-stack, real-time event access control platform that replaces manual attendance sheets with a digital, WhatsApp-delivered QR workflow. It generates a unique QR per student, delivers it via WhatsApp, and provides a scan-and-validate guard interface for institutional events (300-1,000 scale).

## Core Value

Real-time, fraud-resistant digital entry validation and accurate headcount visibility at the gates, powered by WhatsApp QR delivery.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Ingest student data from Excel uploads with parsing and validation
- [ ] Generate one-time-use signed QR codes per student (Marketnera-branded with Vicinix tech credit)
- [ ] Deliver QR codes via Meta Cloud WhatsApp API directly to students
- [ ] Provide a mobile-first PWA QR scanning interface for guards (GRANTED/DENIED states)
- [ ] Prevent QR re-entry fraud (single-use validation)
- [ ] Super Admin Dashboard for live entry feed, headcount stats, and bulk management
- [ ] Master QR code for tracking aggregate gate footfall (multi-scan capability)
- [ ] Role-based access control (Super Admin, Admin, Guard) via Supabase Auth

### Out of Scope

- [Facial Recognition Gate] — Deferred to future premium feature
- [SMS/Email Fallback Delivery] — Future scope, initially relying only on WhatsApp API
- [Offline Guard Mode] — Future scope, currently requires live validation against Supabase to prevent fraud

## Context

- The system operates under the **Marketnera** brand (hyperlocal commerce), with Vicinix credited as the technical sponsor.
- WhatsApp delivery uses the Meta Cloud API free tier (~1,000 conversations/mo, max 80 msg/sec).
- QR design must strictly follow the dual-brand visual hierarchy (Marketnera dominant, Vicinix subordinate).
- The solution relies heavily on Supabase for Auth, PostgreSQL DB, Realtime subscriptions, Storage, and Edge functions instead of a custom backend.

## Constraints

- **Tech Stack**: Next.js 15 (App Router), TypeScript, Supabase, Tailwind CSS — Chosen for rapid deployment and built-in API/realtime capabilities.
- **WhatsApp API Rate Limits**: Max 80 messages per second — Blast mechanism must include 15ms delay logic between sends.
- **Deployment**: Vercel — For zero-config hosting of the Next.js app.
- **Security**: Supabase Row Level Security (RLS) — Guards must not have direct DB query access; all validation runs securely through server-side `/api/scan`.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Use Supabase as Backend | Replaces custom server; offers built-in DB, Auth, Realtime, Storage, reducing infrastructure overhead | — Pending |
| PWA for Guard UI | No app installation needed; enables fast onboarding for transient event staff | — Pending |
| Meta Cloud API for WhatsApp | Direct, robust integration for QR delivery within free tier limits | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-05-31 after initialization*
