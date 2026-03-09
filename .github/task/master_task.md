# Master Task Checklist (v3)

> Detailed tasks in each agent's file. This tracks high-level progress.
> See `CLAUDE.md` for orchestration rules.
> Order: Backend → QA Pass 1 → AI Engineer → QA Pass 2 → Frontend → QA E2E

---

## Week 1: Backend
- [ ] Setup + middleware (B-01 to B-06)
- [ ] Zod validations (B-07 to B-13)
- [ ] Services with subagents (B-14 to B-20)

## Week 2: Backend API + QA Pass 1
- [ ] API routes with subagents (B-21 to B-34)
- [ ] Swagger (B-35 to B-38)
- [ ] QA: Auth + profiles (QA-01 to QA-07)
- [ ] QA: Models CRUD (QA-08 to QA-21)
- [ ] QA: Garments (QA-22 to QA-29)
- [ ] QA: Gallery (QA-30 to QA-39)
- [ ] QA: Credits (QA-40 to QA-47)
- [ ] QA: Storage (QA-48 to QA-54)

## Week 3: AI Integration
- [ ] AI: Setup + types (AI-01 to AI-04)
- [ ] AI: Prompts (AI-05 to AI-09)
- [ ] AI: Client + parsers (AI-10 to AI-13)
- [ ] AI: Services with subagents (AI-14 to AI-18)
- [ ] AI: Pipelines (AI-19 to AI-23)
- [ ] AI: Mappers (AI-24 to AI-25)
- [ ] AI: Routes with subagents (AI-26 to AI-33)
- [ ] AI: Swagger (AI-34 to AI-36)
- [ ] AI: Error handling (AI-37 to AI-41)

## Week 3.5: QA Pass 2
- [ ] QA: Model AI endpoints (QA-55 to QA-64)
- [ ] QA: Studio options (QA-65 to QA-73)
- [ ] QA: Generations (QA-74 to QA-89)
- [ ] QA: Multi-angle (QA-90 to QA-96)
- [ ] QA: Swagger (QA-97 to QA-103)
- [ ] QA: Cleanup + report (QA-104 to QA-107)

## Week 4: Frontend
- [ ] Setup + deps + tailwind config (F-01 to F-04)
- [ ] Shared components with subagents (F-05 to F-13)
- [ ] Layouts (F-14 to F-15)
- [ ] Auth pages (F-16 to F-18)
- [ ] Dashboard home (F-19)
- [ ] Models page with subagents (F-20 to F-28)
- [ ] Studio flow with subagents (F-29 to F-40)
- [ ] Gallery with subagents (F-41 to F-47)
- [ ] Credits page (F-48 to F-52)
- [ ] Settings page (F-53 to F-56)
- [ ] Polish (F-57 to F-65)

## Week 5: Final QA (E2E)
- [ ] Register → login → redirect to studio
- [ ] Create model → AI generates description + face
- [ ] Upload garment → AI analyzes → see options
- [ ] Configure session → generate photo → see result
- [ ] Favorite + download from result
- [ ] Multi-angle → 4 photos
- [ ] Gallery filters + detail modal
- [ ] Credits debit + history matches
- [ ] Settings update profile
- [ ] Mobile responsive all pages
- [ ] Insufficient credits → warning, blocks generation
- [ ] Sign out → redirect to login