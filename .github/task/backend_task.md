# FASHIA — Backend Agent Tasks

> Guide: Always read `src/types/database.ts` before writing any code.
> Pattern: Validations → Services → API Routes → Swagger

---

## Phase 1: Foundation

- [x] **B-01** Create folder structure
  - `lib/supabase/server.ts` — Server client with cookies
  - `lib/supabase/admin.ts` — Service role client (bypasses RLS)
  - `lib/supabase/client.ts` — Browser client
  - `lib/validations/` — Zod schemas folder
  - `lib/services/` — Business logic folder
  - `lib/utils/` — Helpers folder
  - `middleware.ts` — Route protection
- [x] **B-02** Verify Supabase connection works (server + admin)
- [x] **B-03** Verify middleware redirects unauthenticated users

---

## Phase 2: Zod Validations

> Read `src/types/database.ts` first. Every schema must match the DB types exactly.

- [x] **B-04** `lib/validations/profiles.ts`
  - `updateProfileSchema` (full_name, country, company_name, metadata)
- [x] **B-05** `lib/validations/fashion-models.ts`
  - `createFashionModelSchema` (name, gender, country, age, style, ref_face_url?)
  - `updateFashionModelSchema` (partial of create)
- [x] **B-06** `lib/validations/garments.ts`
  - `createGarmentSchema` (image file validation: type, size max 10MB)
- [x] **B-07** `lib/validations/generations.ts`
  - `createGenerationSchema` (model_id, garment_id, config, output_type)
  - `generationConfigSchema` (accessory_set, location, pose, lighting, framing, camera_angle)
- [x] **B-08** `lib/validations/generated-outputs.ts`
  - `toggleFavoriteSchema` (is_favorite boolean)
- [x] **B-09** `lib/validations/credits.ts`
  - `purchaseCreditsSchema` (amount, payment method)
- [x] **B-10** `lib/validations/index.ts` — Re-export everything

---

## Phase 3: Services (Use subagents — one per service)

> Subagent instruction template:
> "You are a backend subagent. Read `src/types/database.ts` and
> `lib/validations/[name].ts`. Create `lib/services/[name].ts`
> with all CRUD functions. Use Supabase client from `lib/supabase/server.ts`.
> Return `{ data, error }` consistently. Full TypeScript, no `any`."

- [x] **B-11** `lib/services/profiles.ts`
  - `getProfile(userId)`
  - `updateProfile(userId, data)`
  - `getCreditsBalance(userId)`
- [x] **B-12** `lib/services/fashion-models.ts`
  - `listModels(userId)` — own + presets
  - `getModel(userId, modelId)` — verify ownership
  - `createModel(userId, data)`
  - `updateModel(userId, modelId, data)` — block presets
  - `deleteModel(userId, modelId)` — block presets
  - `listPresets()`
- [x] **B-13** `lib/services/garments.ts`
  - `listGarments(userId)`
  - `getGarment(userId, garmentId)`
  - `createGarment(userId, imageUrl, description?, analysis?)`
  - `deleteGarment(userId, garmentId)`
- [x] **B-14** `lib/services/generations.ts`
  - `listGenerations(userId, filters?)`
  - `getGeneration(userId, generationId)` — include outputs
  - `createGeneration(userId, data)` — debit credits atomically
  - `updateGenerationStatus(generationId, status, errorMessage?)`
  - `getGenerationsByGarment(userId, garmentId)`
  - `getGenerationsByModel(userId, modelId)`
- [x] **B-15** `lib/services/generated-outputs.ts`
  - `listOutputsByGeneration(generationId)`
  - `createOutput(generationId, data)`
  - `toggleFavorite(userId, outputId)`
  - `listFavorites(userId)`
  - `deleteOutput(userId, outputId)`
- [x] **B-16** `lib/services/credits.ts`
  - `getBalance(userId)`
  - `getHistory(userId, page?, limit?)`
  - `debitCredits(userId, amount, type, description, generationId?)`
  - `refundCredits(userId, amount, generationId)`
  - `addCredits(userId, amount, type, description)`
- [x] **B-17** `lib/services/storage.ts`
  - `uploadGarmentImage(userId, file)` → bucket: garments
  - `uploadModelRef(userId, file)` → bucket: model-refs
  - `uploadOutput(userId, generationId, file)` → bucket: outputs
  - `getSignedUrl(bucket, path)`
  - `getPublicUrl(bucket, path)`
  - `deleteFile(bucket, path)`

---

## Phase 4: API Routes (Use subagents — one per resource)

> Subagent instruction template:
> "You are a backend subagent. Create API routes for [resource].
> Import service from `lib/services/[name].ts` and validation from
> `lib/validations/[name].ts`. Every endpoint must:
>
> 1. Auth check with createClient() + getUser()
> 2. Validate input with Zod
> 3. Call service function
> 4. Return NextResponse.json()
> 5. Include JSDoc comment for Swagger
>    Handle errors: 400 (validation), 401 (auth), 402 (credits), 404 (not found), 500 (server)."

- [x] **B-18** `app/api/profiles/route.ts`
  - GET → getProfile
  - PUT → updateProfile
- [x] **B-19** `app/api/models/route.ts`
  - GET → listModels
  - POST → createModel
- [x] **B-20** `app/api/models/[id]/route.ts`
  - GET → getModel
  - PUT → updateModel
  - DELETE → deleteModel
- [x] **B-21** `app/api/models/presets/route.ts`
  - GET → listPresets
- [x] **B-22** `app/api/garments/route.ts`
  - GET → listGarments
  - POST → createGarment (multipart upload + trigger analysis)
- [x] **B-23** `app/api/garments/[id]/route.ts`
  - GET → getGarment (with analysis JSON)
  - DELETE → deleteGarment
- [x] **B-24** `app/api/generations/route.ts`
  - GET → listGenerations (with query filters)
  - POST → createGeneration (debit credits + start pipeline)
- [x] **B-25** `app/api/generations/[id]/route.ts`
  - GET → getGeneration (with all outputs)
- [x] **B-26** `app/api/generations/[id]/multi-angle/route.ts`
  - POST → create child generation with parent_id
- [x] **B-27** `app/api/gallery/route.ts`
  - GET → listOutputs (filters: favorite, model_id, garment_id, date)
- [x] **B-28** `app/api/gallery/[id]/favorite/route.ts`
  - PUT → toggleFavorite
- [x] **B-29** `app/api/credits/route.ts`
  - GET → getBalance
- [x] **B-30** `app/api/credits/history/route.ts`
  - GET → getHistory (paginated)
- [x] **B-31** `app/api/credits/purchase/route.ts`
  - POST → purchaseCredits (Stripe placeholder)

---

## Phase 5: Swagger Documentation

- [x] **B-32** Configure `lib/swagger.ts` with next-swagger-doc
- [x] **B-33** Create `app/api-docs/page.tsx` with SwaggerUI
- [x] **B-34** Verify all endpoints appear in /api-docs
- [x] **B-35** Verify request/response schemas are correct
