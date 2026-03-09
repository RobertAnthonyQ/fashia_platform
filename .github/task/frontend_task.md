# Frontend Agent — Tasks

> Start ONLY after Backend, AI Engineer, and QA have finished.
> All API endpoints are built and tested. Figma designs exist.
> Use subagents for parallel page/component creation.

---

## Phase 1: Setup

- [ ] F-01 Install dependencies: shadcn/ui init, lucide-react, react-hook-form, @hookform/resolvers, framer-motion, react-dropzone
- [ ] F-02 Configure tailwind.config: add custom accent color `accent: "#BEFF00"`, add Space Grotesk font
- [ ] F-03 Configure global styles: import Space Grotesk from Google Fonts, set dark body bg (#09090B)
- [ ] F-04 Install shadcn components: button, input, label, select, dialog, card, skeleton, toast, dropdown-menu, avatar, badge, tabs, separator, tooltip, sheet

---

## Phase 2: Shared Components (use subagents — parallel)

- [ ] F-05 `components/shared/Sidebar.tsx` — fixed left 240px, logo, nav items with icons (Studio, Models, Gallery, Credits, Settings), active state with green left border, credit badge at bottom, user avatar + name
- [ ] F-06 `components/shared/Header.tsx` — full width top bar, page title left, user avatar + name right
- [ ] F-07 `components/shared/CreditBadge.tsx` — pill shape, ⚡ icon, credit number, variants: normal / low (yellow) / empty (red)
- [ ] F-08 `components/shared/EmptyState.tsx` — centered icon + title + description + optional CTA button, reusable props
- [ ] F-09 `components/shared/LoadingState.tsx` — skeleton shimmer patterns (card grid, list, detail), reusable
- [ ] F-10 `components/shared/ErrorState.tsx` — error icon + message + retry button, reusable
- [ ] F-11 `components/shared/PageHeader.tsx` — title + subtitle + right-side action button slot
- [ ] F-12 `components/shared/ConfirmDialog.tsx` — reusable confirmation modal (icon + title + description + cancel/confirm buttons)
- [ ] F-13 `components/shared/MobileNav.tsx` — bottom navigation bar for mobile (icons only: Studio, Models, Gallery, Credits, Settings)

---

## Phase 3: Layout

- [ ] F-14 `app/(dashboard)/layout.tsx` — sidebar + header + main content area, responsive (sidebar hidden on mobile, bottom nav instead)
- [ ] F-15 `app/(auth)/layout.tsx` — centered layout, no sidebar, dark bg

---

## Phase 4: Auth Pages

- [ ] F-16 `app/(auth)/login/page.tsx` — split layout: left form (Google button + magic link email), right fashion photo. Fashia logo top-left
- [ ] F-17 `app/(auth)/callback/route.ts` — Supabase auth callback handler, redirect to /studio after login
- [ ] F-18 Auth state management — detect logged in user, redirect from login if already authenticated

---

## Phase 5: Dashboard Home

- [ ] F-19 `app/(dashboard)/page.tsx` — welcome message, 4 stat cards (models count, garments count, photos count, credits balance), recent generations grid (3 thumbnails), quick action buttons (Open Studio, Create Model, Buy Credits)

---

## Phase 6: Models Page (use subagents — parallel for components)

- [ ] F-20 `app/(dashboard)/models/page.tsx` — server component, fetch models, render ModelPageClient
- [ ] F-21 `components/models/ModelsPageClient.tsx` — client wrapper with state management for create/edit/delete
- [ ] F-22 `components/models/ModelCard.tsx` — square face portrait, name, badges (gender, country, age), style text truncated, edit/regenerate-face/delete ghost icons. Preset badge on presets. Hover: border highlight
- [ ] F-23 `components/models/ModelGrid.tsx` — 3-column grid of ModelCards, sections "Your Models" + "Platform Presets"
- [ ] F-24 `components/models/CreateModelModal.tsx` — dialog/sheet with form: name input, gender select, country input, age number input, style textarea. Helper text "AI will generate description and face". Submit → POST /api/models → show loading → close on success with toast
- [ ] F-25 `components/models/EditModelModal.tsx` — same form pre-filled, PUT /api/models/[id]
- [ ] F-26 Delete model flow — ConfirmDialog → DELETE /api/models/[id] → toast → refresh list
- [ ] F-27 Regenerate face action — POST /api/models/[id]/regenerate-face → loading state on card → update face image
- [ ] F-28 Empty state if no custom models

---

## Phase 7: Studio Page — Multi-Step Flow (use subagents — one per step)

- [ ] F-29 `app/(dashboard)/studio/page.tsx` — client component, multi-step wizard state (step 1-4), persist state across steps with useState/useReducer
- [ ] F-30 `components/studio/StepIndicator.tsx` — horizontal steps: 1.Upload 2.Select Model 3.Configure 4.Result. Active=green, completed=green check, pending=gray. Connected by thin line

### Step 1: Upload Garment
- [ ] F-31 `components/studio/GarmentUploader.tsx` — react-dropzone zone (dashed border, cloud icon, "Drop your garment image here", accepts JPG/PNG, max 10MB). On drop: preview image + POST /api/garments (FormData) + loading state + show analysis result. "⚡ 1 credit" note. "Next →" button when done
- [ ] F-32 `components/studio/GarmentPreview.tsx` — uploaded image thumbnail + detected garment description text + analysis status (loading/done)

### Step 2: Select Model
- [ ] F-33 `components/studio/ModelSelector.tsx` — fetch models from /api/models. Tab toggle "Your Models" / "Presets". Grid of small model cards (face + name). Selected = green border + glow. Right panel shows selected model detail (face, name, badges, description). "+ Create New" button opens CreateModelModal. "← Back" and "Continue →" navigation
- [ ] F-34 `components/studio/ModelPreviewPanel.tsx` — selected model detail sidebar (large face, name, badges, style, AI description preview)

### Step 3: Configure
- [ ] F-35 `components/studio/SessionConfigurator.tsx` — fetch StudioOptions from GET /api/studio/options/[garmentId]. Render 6 dropdown selects populated from options. Each dropdown: first AI option has "✨ Recommended" badge. Last option "Other (write manually)" → reveals textarea. Two columns: left=form, right=summary card
- [ ] F-36 `components/studio/ConfigDropdown.tsx` — reusable select component for studio options. Props: label, options (SelectOption[]), value, onChange. Shows is_recommended badge. Handles is_custom → text input toggle
- [ ] F-37 `components/studio/SessionSummary.tsx` — right panel card: garment thumbnail + model face + list of selected config options + cost "⚡ 5 credits" + balance + "Generate Photo" green button. Disable button if insufficient credits with warning

### Step 4: Result
- [ ] F-38 `components/studio/ResultViewer.tsx` — large generated image (centered, rounded-xl). Action bar below: favorite toggle, download, re-generate (3cr), multi-angle (15cr). Collapsible "Prompt used" section. "New Session" button + "View in Gallery" link
- [ ] F-39 `components/studio/GenerationLoading.tsx` — skeleton shimmer in image area + green progress bar + "Generating your photo..." animated text + "Usually takes 15-30 seconds" muted text. Poll GET /api/generations/[id] until status=completed
- [ ] F-40 `components/studio/MultiAngleGrid.tsx` — 2x2 grid of 4 images, each labeled with angle name. Each with own favorite + download. Triggered by POST /api/generations/[id]/multi-angle

---

## Phase 8: Gallery Page (use subagents — parallel)

- [ ] F-41 `app/(dashboard)/gallery/page.tsx` — server component, fetch initial data
- [ ] F-42 `components/gallery/GalleryPageClient.tsx` — client wrapper with filter state, pagination
- [ ] F-43 `components/gallery/GalleryFilters.tsx` — pill tabs (All, Favorites, Photos, Videos) + dropdown filters (Model, Garment). Active filter = green underline. Fetch from /api/gallery with query params
- [ ] F-44 `components/gallery/ImageGrid.tsx` — 4-column responsive grid (4 desktop, 3 tablet, 2 mobile). Image cards with hover overlay (dark gradient, model name, favorite heart, date). Click opens detail
- [ ] F-45 `components/gallery/ImageDetailModal.tsx` — two columns: left=full image with prev/next arrows, right=metadata panel (model face+name, garment thumbnail+name, config list, actions: favorite/download/re-generate/multi-angle, prompt expandable, date). Close X button
- [ ] F-46 Gallery empty state
- [ ] F-47 Gallery pagination or infinite scroll

---

## Phase 9: Credits Page

- [ ] F-48 `app/(dashboard)/credits/page.tsx` — server component, fetch balance + history
- [ ] F-49 `components/credits/CreditsPageClient.tsx` — client wrapper
- [ ] F-50 `components/credits/BalanceCard.tsx` — large card: huge balance number (64px), "credits" label, plan badge (PRO green), "Buy Credits" green button, "Manage Plan" ghost link
- [ ] F-51 `components/credits/CostReference.tsx` — 3 small cards: Analysis 1cr, Generation 5cr, Multi-angle 15cr. Each with icon + label
- [ ] F-52 `components/credits/CreditHistory.tsx` — table: Date, Type, Description, Amount. Green for positive, red for negative. Paginated. Fetch from /api/credits/history

---

## Phase 10: Settings Page

- [ ] F-53 `app/(dashboard)/settings/page.tsx`
- [ ] F-54 Profile section: avatar (editable), name input, email (readonly), company input, country input, save button → PUT /api/profiles
- [ ] F-55 Plan section: current plan badge, details, change plan button
- [ ] F-56 Danger section: sign out button, delete account link (with confirmation)

---

## Phase 11: Polish

- [ ] F-57 Loading skeletons on every page (match layout shape)
- [ ] F-58 Error states on every page (friendly message + retry)
- [ ] F-59 Empty states on every page (icon + message + CTA)
- [ ] F-60 Toast notifications for all actions (success/error) using shadcn toast
- [ ] F-61 Mobile responsive: sidebar → hamburger/bottom nav, grids → fewer columns, modals → full screen sheets
- [ ] F-62 Keyboard navigation: focus rings, escape closes modals, tab order
- [ ] F-63 Page transitions with framer-motion (subtle fade/slide on route change)
- [ ] F-64 Favicon + meta tags + Open Graph image for sharing
- [ ] F-65 404 page (dark, minimal, "Page not found", back to dashboard link)