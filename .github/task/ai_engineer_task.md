# FASHIA — AI Engineer Agent Tasks (v2)

> Guide: AI Engineer works after Backend + QA finish their phases.
> Read `src/lib/ai/prompts_example.md` for prompt reference and examples.
> Read `src/types/database.ts` for all DB types.
> You own ALL AI logic: types, prompts, parsers, services, API routes, Swagger.
> You are the backend for everything AI-related.

---

## Phase 1: Setup & Types

- [ ] **AI-01** Read `src/lib/ai/prompts_example.md` — Understand prompt patterns and examples
- [ ] **AI-02** Read `src/types/database.ts` — Understand all DB table types

- [ ] **AI-03** Create `lib/ai/types.ts` — All AI interfaces

  ```typescript
  // Garment analysis (returned by Vision)
  interface GarmentAnalysis {
    main_garment: string;
    accessory_sets: string[];
    locations: string[];
    poses: string[];
    lighting: string[];
  }

  // Model description (generated from user inputs)
  interface ModelDescription {
    description: string;
    physical_summary: string;
  }

  // Model face generation
  interface ModelFaceResult {
    face_image_url: string;
    face_prompt_used: string;
  }

  // Photographer prompt
  interface PhotographerPrompt {
    prompt: string;
  }

  // Studio options (mapped from analysis for frontend dropdowns)
  interface SelectOption {
    value: string;
    label: string;
    is_recommended: boolean;
    is_custom: boolean;
  }

  interface StudioOptions {
    garment_description: string;
    accessory_options: SelectOption[];
    location_options: SelectOption[];
    pose_options: SelectOption[];
    lighting_options: SelectOption[];
    framing_options: SelectOption[];
    angle_options: SelectOption[];
  }

  // Generation config (what user selected)
  interface GenerationConfig {
    accessory_set: string;
    location: string;
    pose: string;
    lighting: string;
    framing: string;
    camera_angle: string;
    ai_model_used: string;
  }

  // Pipeline results
  interface GarmentUploadResult {
    garment: Garment;
    analysis: GarmentAnalysis;
    options: StudioOptions;
  }

  interface ModelCreationResult {
    model: FashionModel;
    face_generated: boolean;
  }

  interface PhotoGenerationResult {
    generation: Generation;
    outputs: GeneratedOutput[];
  }
  ```

- [ ] **AI-04** Create `lib/ai/config.ts` — AI configuration
  - [ ] Model names and versions (vision, image generation, face generation)
  - [ ] Credit costs per action (analysis: 1, generation: 5, multi-angle: 15, re-gen: 3)
  - [ ] Max retries: 3
  - [ ] Timeout: 60s for image gen, 30s for text
  - [ ] Supported image formats and max sizes

---

## Phase 2: Prompts

> ALWAYS read `src/lib/ai/prompts_example.md` first for patterns and style.
> All prompts in English. All outputs as JSON (no markdown, no backticks).

- [ ] **AI-05** Create `lib/ai/prompts.ts` — All prompt templates

  - [ ] `PROMPT_VISION_V1` — Analyze garment from image
    - Input: garment image
    - Output: JSON → `GarmentAnalysis`
    - Must detect: type, colors, patterns, texture, fabric
    - Must suggest: 3 complete accessory sets (with footwear), 3 locations, 3 poses, 3 lighting setups
    - First lighting = absolute best for this specific fabric
    - Response: ONLY valid JSON, no backticks, no explanation

  - [ ] `PROMPT_MODEL_DESCRIPTION_V1` — Generate full model description
    - Input: gender, country, age, style (free text from user)
    - Output: JSON → `ModelDescription`
    - Must create complete physical description: body, skin, hair, facial features, build, height
    - Must respect gender, ethnicity from country, age
    - Must incorporate style vibe into overall look
    - Keep it simple: user gives minimal input, AI fills in everything

  - [ ] `PROMPT_MODEL_FACE_V1` — Generate model face/portrait
    - Input: model description (from PROMPT_MODEL_DESCRIPTION), gender, age, style
    - Output: A portrait generation prompt optimized for Gemini image model
    - Must generate: realistic headshot/portrait of the virtual model
    - Style: clean, neutral background, fashion model casting photo
    - Must match the description exactly (skin tone, hair, age, features)
    - Ultra-realistic, no 3D render look

  - [ ] `PROMPT_PHOTOGRAPHER_V1` — Generate final photo prompt
    - Input: garment description, model description, selected config
    - Output: JSON → `PhotographerPrompt`
    - Must include "(WEARING EXACT MATCH TO REFERENCE GARMENT)"
    - Must handle "Automatic" by inferring best technical choice
    - Single paragraph, English, ultra-realistic

  - [ ] `PROMPT_MULTI_ANGLE_V1` — Modify prompt for angle variations
    - Input: original prompt, target angle
    - Output: JSON → `PhotographerPrompt`
    - Keep everything identical, only change angle/framing/lens

---

## Phase 3: Gemini Client & Parsers

- [ ] **AI-06** Create `lib/ai/gemini.ts` — Gemini API client
  - [ ] Initialize with `GEMINI_API_KEY` from env
  - [ ] Text generation function (for prompts that return JSON)
  - [ ] Vision function (for image + text input)
  - [ ] Image generation function (for creating photos)
  - [ ] Configure safety settings
  - [ ] Configure generation params (temperature, top_p)

- [ ] **AI-07** Create `lib/ai/parsers.ts` — Safe JSON parsers
  - [ ] `parseGarmentAnalysis(raw: string): GarmentAnalysis`
  - [ ] `parseModelDescription(raw: string): ModelDescription`
  - [ ] `parsePhotographerPrompt(raw: string): PhotographerPrompt`
  - [ ] Each parser must:
    - Strip markdown backticks if present
    - Strip "```json" prefix if present
    - Try JSON.parse
    - Validate required fields exist
    - Return fallback/default on failure
    - Log raw response on parse error

- [ ] **AI-08** Create `lib/ai/retry.ts` — Retry logic
  - [ ] `withRetry<T>(fn, maxRetries, delay): Promise<T>`
  - [ ] Exponential backoff: 1s → 2s → 4s
  - [ ] Log each retry attempt
  - [ ] After max retries: throw with full context

- [ ] **AI-09** Create `lib/ai/logger.ts` — AI operation logging
  - [ ] Log: model used, prompt (first 200 chars), response time, success/fail
  - [ ] Log full raw response on parse failures
  - [ ] Log credit operations linked to AI calls

---

## Phase 4: Service Functions

- [ ] **AI-10** Create `lib/ai/services/analyze-garment.ts`
  - [ ] `analyzeGarment(imageBytes, mimeType): Promise<GarmentAnalysis>`
  - [ ] Send image + PROMPT_VISION to Gemini Vision
  - [ ] Parse with `parseGarmentAnalysis`
  - [ ] Retry up to 3 times
  - [ ] Return typed result

- [ ] **AI-11** Create `lib/ai/services/generate-model-description.ts`
  - [ ] `generateModelDescription(input): Promise<ModelDescription>`
  - [ ] Input: `{ gender, country, age, style }`
  - [ ] Send to Gemini with PROMPT_MODEL_DESCRIPTION
  - [ ] Parse with `parseModelDescription`
  - [ ] Retry up to 3 times

- [ ] **AI-12** Create `lib/ai/services/generate-model-face.ts`
  - [ ] `generateModelFace(input): Promise<ModelFaceResult>`
  - [ ] Input: `{ description, gender, age, style }`
  - [ ] Step 1: Build face generation prompt using PROMPT_MODEL_FACE + description
  - [ ] Step 2: Send to Gemini Image model
  - [ ] Step 3: Receive image bytes
  - [ ] Step 4: Upload to storage bucket `model-refs/{userId}/face_{modelId}.jpg`
  - [ ] Step 5: Return `{ face_image_url, face_prompt_used }`
  - [ ] This replaces the need for users to upload a photo
  - [ ] Retry up to 3 times

- [ ] **AI-13** Create `lib/ai/services/generate-prompt.ts`
  - [ ] `generatePhotographerPrompt(input): Promise<PhotographerPrompt>`
  - [ ] Input: garment description, garment analysis, model description, config
  - [ ] Resolve "Automatic" values internally
  - [ ] Parse with `parsePhotographerPrompt`
  - [ ] Validate prompt contains reference garment tag

- [ ] **AI-14** Create `lib/ai/services/generate-image.ts`
  - [ ] `generateImage(prompt, garmentImageBytes, mimeType): Promise<Buffer>`
  - [ ] Send prompt + reference image to Gemini Image model
  - [ ] Config: response_modalities = ["IMAGE", "TEXT"]
  - [ ] Handle streaming response
  - [ ] Extract image from inline_data
  - [ ] Return image buffer
  - [ ] Retry up to 3 times

---

## Phase 5: Pipelines (Full Orchestration)

- [ ] **AI-15** Create `lib/ai/pipelines/garment-upload.ts`

  ```
  garmentUploadPipeline(userId, imageFile)
  
  1. Upload image to storage → garments/{userId}/{id}.jpg → imageUrl
  2. Debit 1 credit (atomic)
  3. analyzeGarment(imageBytes) → GarmentAnalysis
  4. Save to garments table:
     - image_url
     - description = analysis.main_garment
     - analysis = full JSON
  5. Map analysis → StudioOptions (for frontend)
  6. Return { garment, analysis, options }
  
  On failure at 3+: refund credit, delete uploaded image
  ```

  - [ ] Implement with full error handling and rollback

- [ ] **AI-16** Create `lib/ai/pipelines/model-creation.ts`

  ```
  modelCreationPipeline(userId, { name, gender, country, age, style })
  
  1. generateModelDescription({ gender, country, age, style }) → ModelDescription
  2. generateModelFace({ description, gender, age, style }) → ModelFaceResult
  3. Save to fashion_models table:
     - name, gender, country, age, style (user inputs)
     - description = AI generated
     - ref_face_url = AI generated face image URL
  4. Return { model, face_generated: true }
  
  On failure at face gen: save model WITHOUT face (face_generated: false)
  Face generation is optional, model creation should not fail because of it
  ```

  - [ ] Implement pipeline
  - [ ] Face generation failure should NOT block model creation
  - [ ] User can regenerate face later

- [ ] **AI-17** Create `lib/ai/pipelines/regenerate-face.ts`

  ```
  regenerateFacePipeline(userId, modelId)
  
  1. Fetch model from DB
  2. generateModelFace({ description, gender, age, style })
  3. Upload new face to storage (overwrite old if exists)
  4. Update fashion_models.ref_face_url
  5. Return updated model
  ```

  - [ ] Implement as separate pipeline (user can trigger from UI)

- [ ] **AI-18** Create `lib/ai/pipelines/photo-generation.ts`

  ```
  photoGenerationPipeline(userId, { modelId, garmentId, config })
  
  1. Fetch fashion_model (need description, ref_face_url)
  2. Fetch garment (need description, analysis, image from storage)
  3. Debit 5 credits (atomic)
  4. Create generation record (status: processing)
  5. generatePhotographerPrompt({
       garmentDescription,
       garmentAnalysis,
       modelDescription,
       config
     })
  6. generateImage(prompt, garmentImageBytes)
  7. Upload output to storage → outputs/{userId}/{generationId}/photo.jpg
  8. Save to generated_outputs table
  9. Update generation: status → completed, prompt_used = final prompt
  10. Return { generation, outputs }
  
  On failure at 5+: refund credits, status → failed, save error_message
  ```

  - [ ] Implement with atomic credit handling
  - [ ] Save prompt_used for reproducibility

- [ ] **AI-19** Create `lib/ai/pipelines/multi-angle.ts`

  ```
  multiAnglePipeline(userId, generationId)
  
  1. Fetch parent generation (prompt, config, garment image)
  2. Debit 15 credits (atomic)
  3. Define 4 angles: low_angle, high_angle, 3/4_profile, over_shoulder
  4. Create child generation (parent_id = original, status: processing)
  5. For each angle:
     a. Modify prompt with PROMPT_MULTI_ANGLE (change only angle/framing)
     b. generateImage(modifiedPrompt, garmentImageBytes)
     c. Upload to storage outputs/{userId}/{childGenId}/angle_{n}.jpg
     d. Save to generated_outputs with angle field set
  6. Update child generation: status → completed
  7. Return all 4 outputs
  
  On failure: refund credits, status → failed
  ```

  - [ ] Implement with parallel generation where possible

---

## Phase 6: JSON → UI Mappers

- [ ] **AI-20** Create `lib/ai/mappers.ts`

  - [ ] `mapAnalysisToOptions(analysis: GarmentAnalysis): StudioOptions`
    - Map accessory_sets → 3 options + "Other (write manually)"
    - Map locations → 3 options + "Other (write manually)"
    - Map poses → 3 options + "Other (write manually)"
    - Map lighting → "Automatic (best)" + 3 options + "Studio White (E-commerce)" + "Other"
    - Static framing options: Automatic, Full Body, Medium Shot, Close Up
    - Static angle options: Automatic, Low Angle, High Angle, Eye Level
    - First AI option in each group → `is_recommended: true`
    - "Other" option → `is_custom: true`

  - [ ] `mapUserConfigToPromptInput(config, garment, model): PromptInput`
    - Resolve "Automatic" to AI-inferred best
    - Resolve custom text entries
    - Build complete input for generatePhotographerPrompt

---

## Phase 7: API Routes (AI owns these endpoints)

> AI Engineer creates and owns all AI-related API routes.
> Follow same patterns as Backend agent: auth → validate → execute → respond.
> Include JSDoc for Swagger on every endpoint.

- [ ] **AI-21** Create/update `app/api/garments/route.ts` POST handler
  - [ ] Receive multipart image upload
  - [ ] Run `garmentUploadPipeline`
  - [ ] Return: garment + analysis + mapped StudioOptions
  - [ ] Swagger: document request (multipart), response (GarmentUploadResult)

- [ ] **AI-22** Create/update `app/api/models/route.ts` POST handler
  - [ ] Receive: name, gender, country, age, style
  - [ ] Run `modelCreationPipeline`
  - [ ] Return: model with AI description + generated face URL
  - [ ] Swagger: document request body, response (ModelCreationResult)

- [ ] **AI-23** Create `app/api/models/[id]/regenerate-face/route.ts`
  - [ ] POST → run `regenerateFacePipeline`
  - [ ] Return: updated model with new face URL
  - [ ] Swagger: document endpoint

- [ ] **AI-24** Create `app/api/models/[id]/regenerate-description/route.ts`
  - [ ] POST → regenerate AI description from existing model data
  - [ ] Return: updated model with new description
  - [ ] Swagger: document endpoint

- [ ] **AI-25** Create/update `app/api/generations/route.ts` POST handler
  - [ ] Receive: model_id, garment_id, config, output_type
  - [ ] Run `photoGenerationPipeline`
  - [ ] Return: generation with outputs
  - [ ] Swagger: document full request/response

- [ ] **AI-26** Create/update `app/api/generations/[id]/multi-angle/route.ts`
  - [ ] POST → run `multiAnglePipeline`
  - [ ] Return: child generation with 4 angle outputs
  - [ ] Swagger: document endpoint

- [ ] **AI-27** Create `app/api/garments/[id]/reanalyze/route.ts`
  - [ ] POST → re-run garment analysis (new AI analysis)
  - [ ] Debit 1 credit
  - [ ] Return: updated garment with new analysis + options
  - [ ] Swagger: document endpoint

- [ ] **AI-28** Create `app/api/studio/options/[garmentId]/route.ts`
  - [ ] GET → fetch garment analysis and return mapped StudioOptions
  - [ ] No credits charged (just reading existing analysis)
  - [ ] Frontend calls this to populate dropdowns
  - [ ] Swagger: document response (StudioOptions)

---

## Phase 8: Swagger Documentation for AI Endpoints

- [ ] **AI-29** Add JSDoc Swagger comments to all AI endpoints:
  - [ ] POST `/api/garments` — Upload & analyze garment
  - [ ] POST `/api/models` — Create model with AI description + face
  - [ ] POST `/api/models/[id]/regenerate-face` — Regenerate face
  - [ ] POST `/api/models/[id]/regenerate-description` — Regenerate description
  - [ ] POST `/api/generations` — Generate photo
  - [ ] POST `/api/generations/[id]/multi-angle` — Multi-angle variations
  - [ ] POST `/api/garments/[id]/reanalyze` — Re-analyze garment
  - [ ] GET `/api/studio/options/[garmentId]` — Get studio options

- [ ] **AI-30** Verify all AI endpoints appear in `/api-docs`
- [ ] **AI-31** Verify request/response schemas are correct in Swagger

---

## Phase 9: Error Handling

- [ ] **AI-32** All pipelines handle failures:
  - [ ] Credits refunded on ANY AI failure
  - [ ] Storage cleaned up on partial failure (delete orphan uploads)
  - [ ] Generation status set to "failed" with error_message
  - [ ] User gets meaningful error, not raw API error

- [ ] **AI-33** All parsers handle malformed responses:
  - [ ] Fallback defaults when JSON is invalid
  - [ ] Log raw response for debugging
  - [ ] Never crash — always return something usable

- [ ] **AI-34** Rate limiting awareness:
  - [ ] Respect Gemini API rate limits
  - [ ] Queue requests if needed
  - [ ] Return 429 to user if API is overloaded