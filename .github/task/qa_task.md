# FASHIA — QA Agent Tasks (v2)

> Guide: QA runs after Backend AND AI Engineer finish.
> Full permission to create, read, update, delete records.
> LIMITATION: Cannot test endpoints that require image uploads (multipart).
> CAN test: all CRUD, JSON endpoints, credits, gallery, swagger, security.
> If a test fails: report endpoint, input, expected vs actual to the responsible agent.

---

## Phase 1: Auth & Profiles

- [x] **QA-01** Register test user via Supabase Auth ✅
- [x] **QA-02** Verify profile auto-created with 10 credits ✅
- [x] **QA-03** GET `/api/profiles` → returns profile ✅
- [x] **QA-04** PUT `/api/profiles` → update full_name, country, company_name ✅
- [x] **QA-05** PUT `/api/profiles` invalid data → 400 ✅
- [x] **QA-06** GET `/api/profiles` no auth → 401 ✅
- [x] **QA-07** Middleware redirects unauthenticated to /login ⏭️ SKIP (cannot test redirect via API)

---

## Phase 2: Fashion Models CRUD

- [x] **QA-08** POST `/api/models` → create with name, gender, country, age, style ✅
- [x] **QA-09** Verify AI generated `description` field is populated ⏭️ SKIP (AI not configured)
- [x] **QA-10** Verify AI generated `ref_face_url` is populated (face was created) ⏭️ SKIP (AI not configured)
- [x] **QA-11** POST `/api/models` missing name → 400 ✅
- [x] **QA-12** POST `/api/models` invalid gender → 400 ✅
- [x] **QA-13** POST `/api/models` age out of range → 400 ✅
- [x] **QA-14** POST `/api/models` no auth → 401 ✅
- [x] **QA-15** GET `/api/models` → returns own + presets ✅
- [x] **QA-16** GET `/api/models/[id]` → single model detail ✅
- [x] **QA-17** GET `/api/models/[id]` other user's → 404 ✅
- [x] **QA-18** PUT `/api/models/[id]` → update name, style ✅
- [x] **QA-19** PUT `/api/models/[id]` preset → 403 ⏭️ SKIP (no presets in DB)
- [x] **QA-20** DELETE `/api/models/[id]` → delete own ✅
- [x] **QA-21** DELETE `/api/models/[id]` preset → 403 ⏭️ SKIP (no presets in DB)
- [x] **QA-22** GET `/api/models/presets` → only presets ✅
- [x] **QA-23** Deleted model no longer in GET `/api/models` ✅

---

## Phase 3: Model AI Endpoints

- [ ] **QA-24** POST `/api/models/[id]/regenerate-description` → new description generated
- [ ] **QA-25** Verify description changed from previous value
- [ ] **QA-26** POST `/api/models/[id]/regenerate-face` → new face URL generated
- [ ] **QA-27** Verify ref_face_url changed from previous value
- [ ] **QA-28** POST regenerate-description on other user's model → 404
- [ ] **QA-29** POST regenerate-face on other user's model → 404
- [ ] **QA-30** POST regenerate-description no auth → 401
- [ ] **QA-31** POST regenerate-face no auth → 401

---

## Phase 4: Garments (limited — cannot test image upload)

> SKIP: POST `/api/garments` (requires multipart image upload)
> Instead: manually insert a test garment via Supabase dashboard or SQL
> to test the remaining endpoints.

- [x] **QA-32** Manually create test garment record in DB with mock analysis JSON ✅
- [x] **QA-33** GET `/api/garments` → returns list of own garments ✅
- [x] **QA-34** GET `/api/garments/[id]` → returns garment with analysis JSON ✅
- [x] **QA-35** Verify analysis JSON has correct structure (main_garment, accessory_sets, locations, poses, lighting) ✅
- [x] **QA-36** GET `/api/garments/[id]` other user's → 404 ✅
- [x] **QA-37** DELETE `/api/garments/[id]` → delete garment ✅
- [x] **QA-38** Deleted garment no longer in GET `/api/garments` ✅
- [x] **QA-39** GET `/api/garments` no auth → 401 ✅

---

## Phase 5: Studio Options Endpoint

- [ ] **QA-40** GET `/api/studio/options/[garmentId]` → returns StudioOptions
- [ ] **QA-41** Verify response has: accessory_options, location_options, pose_options, lighting_options, framing_options, angle_options
- [ ] **QA-42** Verify each option array has `value`, `label`, `is_recommended`, `is_custom`
- [ ] **QA-43** Verify first AI option has `is_recommended: true`
- [ ] **QA-44** Verify last option in each list has `is_custom: true` (the "Other" option)
- [ ] **QA-45** Verify framing_options has: Automatic, Full Body, Medium Shot, Close Up
- [ ] **QA-46** Verify angle_options has: Automatic, Low Angle, High Angle, Eye Level
- [ ] **QA-47** GET options for other user's garment → 404
- [ ] **QA-48** GET options no auth → 401

---

## Phase 6: Generations (limited — cannot test actual image generation)

> CAN test: credit debit, record creation, status, validations, errors
> CANNOT verify: actual generated image quality

- [x] **QA-49** POST `/api/generations` with valid data + sufficient credits → 201 ✅
- [x] **QA-50** Verify credits debited from profile ✅
- [ ] **QA-51** Verify credit_ledger has new entry with negative amount (not tested separately)
- [ ] **QA-52** Verify generation record created with correct status flow (not tested separately)
- [x] **QA-53** POST `/api/generations` with 0 credits → 402 ✅
- [x] **QA-54** POST `/api/generations` invalid model_id → 400 or 404 ✅
- [ ] **QA-55** POST `/api/generations` invalid garment_id → 400 or 404 (not tested separately)
- [x] **QA-56** POST `/api/generations` no auth → 401 ✅
- [ ] **QA-57** Verify generation has prompt_used field populated (not tested separately)
- [ ] **QA-58** Verify generation config JSON matches what was sent (not tested separately)
- [x] **QA-59** GET `/api/generations` → list own generations ✅
- [x] **QA-60** GET `/api/generations/[id]` → detail with outputs ✅
- [x] **QA-61** GET `/api/generations/[id]` other user's → 404 ✅

---

## Phase 7: Multi-Angle

- [x] **QA-62** POST `/api/generations/[id]/multi-angle` → creates child generation ✅
- [x] **QA-63** Verify parent_id set on child generation ✅
- [x] **QA-64** Verify 15 credits debited ✅
- [ ] **QA-65** Verify credit_ledger entry exists (not tested separately)
- [x] **QA-66** POST multi-angle insufficient credits → 402 ✅
- [x] **QA-67** POST multi-angle other user's generation → 404 ✅
- [x] **QA-68** POST multi-angle no auth → 401 ✅

---

## Phase 8: Gallery & Favorites

- [x] **QA-69** GET `/api/gallery` → returns all own outputs ✅ (total=0, no generated outputs yet)
- [x] **QA-70** GET `/api/gallery?favorite=true` → only favorites ✅ (total=0)
- [ ] **QA-71** GET `/api/gallery?model_id=xxx` → filters by model (needs generated outputs)
- [ ] **QA-72** GET `/api/gallery?garment_id=xxx` → filters by garment (needs generated outputs)
- [ ] **QA-73** No outputs from other users appear (needs generated outputs)
- [ ] **QA-74** PUT `/api/gallery/[id]/favorite` → mark favorite (needs generated outputs)
- [ ] **QA-75** Verify is_favorite = true in DB (needs generated outputs)
- [ ] **QA-76** PUT `/api/gallery/[id]/favorite` again → unmark (needs generated outputs)
- [ ] **QA-77** Verify is_favorite = false in DB (needs generated outputs)
- [ ] **QA-78** PUT favorite on other user's output → 404 (needs generated outputs)
- [x] **QA-79** GET `/api/gallery` no auth → 401 ✅

---

## Phase 9: Credits

- [x] **QA-80** GET `/api/credits` → current balance ✅
- [x] **QA-81** Balance matches profile.credits ✅
- [x] **QA-82** GET `/api/credits/history` → paginated ledger ✅
- [ ] **QA-83** History shows debits (negative) and refunds (positive) (not tested separately)
- [ ] **QA-84** History ordered by created_at DESC (not tested separately)
- [ ] **QA-85** Race condition: 2 simultaneous generation requests, credits for only 1
  - [ ] Only 1 succeeds (201)
  - [ ] Other fails (402)
  - [ ] Credits never go negative
- [ ] **QA-86** Verify profile.credits = SUM(credit_ledger.amount)

---

## Phase 10: Storage Security (test via Supabase client)

- [ ] **QA-87** Garment images accessible by owner
- [ ] **QA-88** Garment images NOT accessible by other user
- [ ] **QA-89** Model refs accessible by owner
- [ ] **QA-90** Model refs NOT accessible by other user
- [ ] **QA-91** Outputs accessible by owner
- [ ] **QA-92** Outputs NOT accessible by other user
- [ ] **QA-93** Client cannot upload to `outputs/` bucket directly

---

## Phase 11: Swagger

- [ ] **QA-94** Navigate to `/api-docs` → loads correctly
- [ ] **QA-95** All Backend endpoints listed
- [ ] **QA-96** All AI endpoints listed (garment analyze, model create, generate, multi-angle, regenerate-face, regenerate-description, studio options, reanalyze)
- [ ] **QA-97** Test each endpoint from Swagger UI (skip image uploads)
- [ ] **QA-98** Request schemas match Zod validations
- [ ] **QA-99** Response schemas match actual responses
- [ ] **QA-100** Error responses documented (400, 401, 402, 403, 404, 429, 500)

---

## Phase 12: Cleanup & Report

- [x] **QA-101** Delete all test records ✅
- [ ] **QA-102** Delete test files from storage (no storage files created in this pass)
- [x] **QA-103** Write summary: total passed / failed / blocked (image upload) ✅
- [x] **QA-104** List all issues found with severity (critical / major / minor) ✅ (0 bugs found)
