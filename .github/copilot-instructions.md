# FASHIA – GitHub Copilot Instructions

FASHIA is an AI-powered professional photo/video generation platform for clothing brands.  
Stack: **Next.js 16 App Router · React 19 · TypeScript strict · Supabase · Prisma 7 · Gemini API · Tailwind CSS v4 · shadcn/ui · Zod**.

---

## TypeScript

- Always use **strict mode**. Never use `any`.
- Use `interface` for component props and object shapes; use `type` for unions and aliases.
- Path alias `@/*` maps to the project root.

---

## Naming Conventions

| Thing                 | Convention                 |
| --------------------- | -------------------------- |
| React components      | `PascalCase`               |
| Hooks                 | `use` prefix + `camelCase` |
| API route URLs        | `kebab-case`               |
| Database columns      | `snake_case`               |
| Environment variables | `UPPER_SNAKE_CASE`         |

---

## Database & Types

- **Always read `src/types/database.ts` before writing any DB-related code.** It is the single source of truth for all DB types.
- Zod schemas in `src/lib/validations/` must match `database.ts` exactly.
- Use Supabase clients from `src/lib/supabase/`: `server.ts` for server actions/routes, `client.ts` for client components, `admin.ts` for privileged operations.

---

## API Route Pattern

Every API route must follow this exact order:

1. Auth check via `supabase.auth.getUser()` — return `401` if missing.
2. Zod validation of the request body/params — return `400` on failure.
3. Service call (business logic lives in `src/lib/services/`).
4. `NextResponse.json()` response.

**HTTP error codes:**

| Code | Meaning                                     |
| ---- | ------------------------------------------- |
| 400  | Validation error                            |
| 401  | Not authenticated                           |
| 402  | Insufficient credits                        |
| 404  | Not found **or** resource not owned by user |
| 429  | Rate limit                                  |
| 500  | Server error                                |

Include JSDoc for every endpoint (used by Swagger at `/api-docs`).

---

## Security Rules

- Return **404, never 403**, for resources the authenticated user doesn't own.
- Verify resource ownership inside every endpoint before returning or mutating data.
- Never expose API keys or Supabase service-role credentials on the client side.

---

## Credit System

Credits are **atomic**: reserve credits → execute AI operation → confirm on success or **refund on failure**.  
Costs: analysis = 1 · generation = 5 · multi-angle ×4 = 15 · re-generation = 3.

---

## Agent System

This project uses specialized agents with prompts in `.claude/prompts/` and tasks in `.github/task/`. Execution order: Backend -> QA Pass 1 -> AI Engineer -> QA Pass 2 -> Frontend -> QA E2E.

| Agent | Prompt | Tasks |
|-------|--------|-------|
| Backend | `.claude/prompts/backend.md` | `.github/task/backend_task.md` |
| AI Engineer | `.claude/prompts/ai-engineer.md` | `.github/task/ai_engineer_task.md` |
| QA | `.claude/prompts/qa.md` | `.github/task/qa_task.md` |
| Frontend | `.claude/prompts/frontend.md` | `.github/task/frontend_task.md` |

**Agent rules:** Read your task file first, pick next unchecked task, mark `[x]` when done. Always read `src/types/database.ts` before DB-related code. Use subagents for 5+ independent tasks. Don't touch other agent's scope.

---

## File & Folder Layout
src/
app/
(auth)/ # public: login, register
(dashboard)/ # protected: studio, models, gallery, credits, settings
api/ # API routes
api-docs/ # Swagger UI
types/database.ts # SOURCE OF TRUTH – never modify manually
lib/
supabase/ # server.ts · admin.ts · client.ts
validations/ # Zod schemas
services/ # CRUD business logic (one file per resource)
ai/ # All AI logic (see AI section above)
components/
ui/ # shadcn/ui primitives
studio/ # Studio feature components
models/ # Model feature components
gallery/ # Gallery feature components
shared/ # Reusable across features
middleware.ts # Route protection (project root)
code
Code
---

## General Principles

- Do not add features, refactor, or "improve" code beyond what is explicitly asked.
- Do not add comments or docstrings to code you did not change.
- Do not add error handling for scenarios that cannot happen — trust framework guarantees.
- Keep solutions minimal: the right amount of complexity is the minimum needed.

---

## CRITICAL: CONTINUATION & COST OPTIMIZATION
- **CRITICAL:** ALWAYS WHEN YOU FINISH ANSWERING SOMETHING, USE THE TOOL `ASK` TO ASK THE DEVELOPER.
- **NEVER** finish without asking if the developer wants to know more, if they want to optimize something else, or what the next step is.
- You MUST always use the `ASK` tool to continue the session because failing to do so will negatively repercute in developer costs.

---

## PARALLELISM & MASTER TASKS
- **PRIORITY:** Maximize parallelism. Use subagents heavily to execute multiple tasks concurrently.
- Master tasks and general instructions are located in `.github/task/master_task.md`. Always check this file to understand the overarching goals.

---

## EXCEPTIONAL COMMANDS (`.github/COMMANDS.md`)
- You **MUST** check `.github/COMMANDS.md` every time you finish a task.
- This file contains "exceptional instructions" that have priority over your initial instructions.
- **Contradictions:** If a new instruction contradicts an older one, the newer instruction is the correct one.
- **Skipped Approvals:** If the developer skips a command that requires approval, it is a strict signal that you MUST read `COMMANDS.md` because a new instruction has likely been added for the next steps.
- **Timestamping:** When you find a new instruction or variation in `COMMANDS.md`, rewrite the line of the new instruction in your response and prepend an initial timestamp `[DATE-HOUR:MINUTE:SECOND]` to explicitly show when the instruction was given and considered.

---

## MEMORY MANAGEMENT (`.github/MEMORY.md`)
- **Before starting** any task, review `.github/MEMORY.md` to see if previously completed tasks can help with your current assignment.
- **After finishing** every single task, you **MUST** update `.github/MEMORY.md`.
- The update must be short and concisely summarized. Do not let this file become large.
- You **MUST** structure the update using the following exact format:

```markdown
# [TASK NAME OR WHAT WAS DONE]
## [WHAT WAS EXECUTED]

**CRITICAL** ALWAYS YOU FINISH ANSWERING SOMETHING, USE THE TOOL: 'ASK' FOR ASKING THE DEVELOPER, DO NOT FINISH WITHOUT ASKING IF HE WANTS TO KNOW MORE OR IF HE WANTS TO OPTIMIZE SOMETHING ELSE,USE THE TOOL 'ASK' ALWAYS TO CONTINUE WITH THE SESSION, BECAUSE IF U DONT , IT WILL REPECUTE IN DEVELOPER COST.



## RULES
LA PRIORIDAD ES HACER PARALELISMO, usa bastante el tema de los subagents.

WE HAVE A .github\COMMANDS.md WITH EXCEPTIONAL COMMANDS YOU SHOULD CHECKOUT WHILE DEVELOPING, YOU FINISH SOMETHING, YOU CHECK COMMANDS.md. Why? because there will be instructions that i wanna give it to you that wasnt in my initial instructions, lets call them 'exceptional instructions' there are prioritary.  LETS BE CAREFUL: I'm a human, so sometimes i can put an instruction and then change my mind and put another one, so if you see that i put an instruction and then i put another one that contradicts the first one, you should consider the second one as the correct one. For better timing, when you see a variation in the COMMANDS file you should rewrite the line of the new instruction and put an inicial [DATE-HOUR:MINUTE:SECOND] to know when the instruction was given, and when you consider it. Also, when i skip a command that i have to approve, that is a sign that you have to read COMMANDS.md because maybe i have given you an instruction that you have to consider for the next steps.


cada vez que culmines algo actualiza el resumen de .github\MEMORY.md, ojo aqui tiene que ser lo que se pidio y lo que se hizo de manera corta y resumida, ojo que siempre se actualiza y se resume no tiene que ser una archivo grande, y antes de inicia con algo revisas el MEMORY.md para ver si antes se hizo algo que nos ayude para la tarea asignada o las tareas que ya se hicieron, este tiene que estar estructurado de la siguiente forma con #, ##, ###, LA TAREA O LO QUE SE HIZO, QUE SE HIZO Y DESCRIPCIÓN. OJO QUE SIEMPRE ACTUALIZA CUANOD FINALICES UNA TAREA.

## MANDATORY RULE: Session continuity

NEVER end a response without using the `ask_user_input` tool at the end.

After completing any task (code, analysis, explanation, fix, etc.):
1. Deliver the complete result.
2. Immediately use `ask_user_input` to ask the developer if they want to:
   - Optimize something from the deliverable
   - Continue with a related task
   - Go deeper on a specific point
   - Move on to something completely different

This rule has NO exceptions. It applies even if the task seems 100% complete.
If you don't ask, the developer loses control of the session and that has a direct cost.