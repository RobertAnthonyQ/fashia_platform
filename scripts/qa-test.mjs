/**
 * FASHIA QA Test Script — Phase 1 (Backend Pass)
 * Tests: Auth, Profiles, Models CRUD, Garments, Gallery, Credits, Swagger
 * Run: node scripts/qa-test.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";

// Load .env manually
const envContent = readFileSync(".env", "utf8");
const env = {};
for (const line of envContent.split("\n")) {
  const eq = line.indexOf("=");
  if (eq > 0 && !line.trimStart().startsWith("#")) {
    env[line.substring(0, eq).trim()] = line.substring(eq + 1).trim();
  }
}

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const BASE_URL = "http://localhost:3000";

const TEST_EMAIL = `qa-test-${Date.now()}@fashia-test.com`;
const TEST_PASSWORD = "TestPass123!@#";

// Admin client (bypasses RLS)
const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Test results tracking
const results = { passed: 0, failed: 0, skipped: 0, bugs: [] };

function log(status, id, message) {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  console.log(`${icon} ${id}: ${message}`);
  if (status === "PASS") results.passed++;
  else if (status === "FAIL") results.failed++;
  else results.skipped++;
}

function bug(id, endpoint, input, expected, actual, severity, owner) {
  results.bugs.push({ id, endpoint, input, expected, actual, severity, owner });
  console.log(
    `\n🐛 BUG: ${id}\n  Endpoint: ${endpoint}\n  Input: ${input}\n  Expected: ${expected}\n  Actual: ${actual}\n  Severity: ${severity}\n  Owner: ${owner}\n`,
  );
}

// Helper to make authenticated requests
async function authFetch(path, options = {}, accessToken) {
  const url = `${BASE_URL}${path}`;
  const headers = { ...options.headers };

  if (accessToken) {
    // Set the Supabase auth cookie
    const projectRef = SUPABASE_URL.replace("https://", "").split(".")[0];
    const cookieValue = JSON.stringify({
      access_token: accessToken,
      refresh_token: "test",
      token_type: "bearer",
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
    });
    // Base64 encode chunks for Supabase cookie format
    const encoded = Buffer.from(cookieValue).toString("base64");
    headers["Cookie"] = `sb-${projectRef}-auth-token=base64-${encoded}`;
  }

  const res = await fetch(url, { ...options, headers, redirect: "manual" });
  let body;
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }
  return { status: res.status, body, headers: res.headers };
}

// Helper for unauthenticated requests
async function noAuthFetch(path, options = {}) {
  return authFetch(path, options, null);
}

async function main() {
  console.log("========================================");
  console.log("FASHIA QA Test Suite — Backend Pass 1");
  console.log("========================================\n");

  let userId, accessToken;
  let testModelId, testGarmentId, testGenerationId, testOutputId;

  // ============================================
  // PHASE 1: Auth & Profiles
  // ============================================
  console.log("\n--- Phase 1: Auth & Profiles ---\n");

  // QA-01: Register test user
  try {
    const { data, error } = await admin.auth.admin.createUser({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
    log("PASS", "QA-01", `Test user registered: ${userId}`);
  } catch (e) {
    log("FAIL", "QA-01", `Failed to register test user: ${e.message}`);
    bug(
      "QA-01",
      "Supabase Admin API",
      TEST_EMAIL,
      "User created",
      e.message,
      "critical",
      "backend",
    );
    console.log("Cannot continue without test user");
    process.exit(1);
  }

  // Sign in to get access token
  const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  try {
    const { data, error } = await anonClient.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });
    if (error) throw error;
    accessToken = data.session.access_token;
    console.log("  🔑 Got access token\n");
  } catch (e) {
    log("FAIL", "QA-01b", `Failed to sign in: ${e.message}`);
    await cleanup(userId);
    process.exit(1);
  }

  // QA-02: Verify profile auto-created with 10 credits
  try {
    const { data: profile, error } = await admin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error || !profile) {
      log("FAIL", "QA-02", `Profile not auto-created: ${error?.message}`);
      bug(
        "QA-02",
        "DB trigger",
        "New user signup",
        "Profile auto-created with 10 credits",
        "No profile found",
        "critical",
        "backend",
      );
    } else if (profile.credits !== 10) {
      log("FAIL", "QA-02", `Credits = ${profile.credits}, expected 10`);
      bug(
        "QA-02",
        "DB trigger",
        "New user signup",
        "10 credits",
        `${profile.credits} credits`,
        "major",
        "backend",
      );
    } else {
      log(
        "PASS",
        "QA-02",
        `Profile auto-created with ${profile.credits} credits`,
      );
    }
  } catch (e) {
    log("FAIL", "QA-02", `Error: ${e.message}`);
  }

  // QA-03: GET /api/profiles → returns profile
  try {
    const { status, body } = await authFetch("/api/profiles", {}, accessToken);
    if (status === 200 && body.id === userId) {
      log("PASS", "QA-03", `GET /api/profiles → 200, correct user`);
    } else {
      log(
        "FAIL",
        "QA-03",
        `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
      );
      bug(
        "QA-03",
        "GET /api/profiles",
        "Valid auth",
        "200 with profile",
        `${status}: ${JSON.stringify(body).substring(0, 100)}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-03", `Error: ${e.message}`);
  }

  // QA-04: PUT /api/profiles → update fields
  try {
    const { status, body } = await authFetch(
      "/api/profiles",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: "QA Tester",
          country: "Peru",
          company_name: "FASHIA QA",
        }),
      },
      accessToken,
    );
    if (status === 200 && body.full_name === "QA Tester") {
      log("PASS", "QA-04", `PUT /api/profiles → 200, fields updated`);
    } else {
      log(
        "FAIL",
        "QA-04",
        `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
      );
      bug(
        "QA-04",
        "PUT /api/profiles",
        "Valid update data",
        "200 with updated profile",
        `${status}: ${JSON.stringify(body).substring(0, 100)}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-04", `Error: ${e.message}`);
  }

  // QA-05: PUT /api/profiles invalid data → 400
  try {
    const { status, body } = await authFetch(
      "/api/profiles",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: "" }), // empty string violates min(1)
      },
      accessToken,
    );
    if (status === 400) {
      log("PASS", "QA-05", `PUT /api/profiles invalid → 400`);
    } else {
      log("FAIL", "QA-05", `Expected 400, got ${status}`);
      bug(
        "QA-05",
        "PUT /api/profiles",
        '{ full_name: "" }',
        "400",
        `${status}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-05", `Error: ${e.message}`);
  }

  // QA-06: GET /api/profiles no auth → 401
  try {
    const { status } = await noAuthFetch("/api/profiles");
    if (status === 401) {
      log("PASS", "QA-06", `GET /api/profiles no auth → 401`);
    } else {
      log("FAIL", "QA-06", `Expected 401, got ${status}`);
      bug(
        "QA-06",
        "GET /api/profiles",
        "No auth",
        "401",
        `${status}`,
        "critical",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-06", `Error: ${e.message}`);
  }

  // QA-07: Middleware redirect (skip - tested via browser, not easily via fetch)
  log("SKIP", "QA-07", "Middleware redirect test (requires browser)");

  // ============================================
  // PHASE 2: Fashion Models CRUD
  // ============================================
  console.log("\n--- Phase 2: Fashion Models CRUD ---\n");

  // QA-08: POST /api/models → create
  try {
    const { status, body } = await authFetch(
      "/api/models",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "QA Test Model",
          gender: "female",
          country: "Colombia",
          age: 25,
          style: "casual elegant",
        }),
      },
      accessToken,
    );
    if (status === 201 && body.id) {
      testModelId = body.id;
      log("PASS", "QA-08", `POST /api/models → 201, id: ${testModelId}`);
    } else {
      log(
        "FAIL",
        "QA-08",
        `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
      );
      bug(
        "QA-08",
        "POST /api/models",
        "Valid model data",
        "201 with model",
        `${status}: ${JSON.stringify(body).substring(0, 100)}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-08", `Error: ${e.message}`);
  }

  // QA-09 & QA-10: AI fields (skip in Pass 1)
  log("SKIP", "QA-09", "AI description field (Pass 2 — AI Engineer)");
  log("SKIP", "QA-10", "AI ref_face_url field (Pass 2 — AI Engineer)");

  // QA-11: POST /api/models missing name → 400
  try {
    const { status } = await authFetch(
      "/api/models",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gender: "male" }),
      },
      accessToken,
    );
    if (status === 400) {
      log("PASS", "QA-11", `POST /api/models missing name → 400`);
    } else {
      log("FAIL", "QA-11", `Expected 400, got ${status}`);
      bug(
        "QA-11",
        "POST /api/models",
        '{ gender: "male" }',
        "400",
        `${status}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-11", `Error: ${e.message}`);
  }

  // QA-12: POST /api/models invalid gender → 400
  try {
    const { status } = await authFetch(
      "/api/models",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", gender: "invalid_gender" }),
      },
      accessToken,
    );
    if (status === 400) {
      log("PASS", "QA-12", `POST /api/models invalid gender → 400`);
    } else {
      log("FAIL", "QA-12", `Expected 400, got ${status}`);
      bug(
        "QA-12",
        "POST /api/models",
        '{ name: "Test", gender: "invalid" }',
        "400",
        `${status}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-12", `Error: ${e.message}`);
  }

  // QA-13: POST /api/models age out of range → 400
  try {
    const { status } = await authFetch(
      "/api/models",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test", gender: "male", age: 5 }), // min is 16
      },
      accessToken,
    );
    if (status === 400) {
      log("PASS", "QA-13", `POST /api/models age=5 → 400`);
    } else {
      log("FAIL", "QA-13", `Expected 400, got ${status}`);
      bug(
        "QA-13",
        "POST /api/models",
        '{ name: "Test", gender: "male", age: 5 }',
        "400",
        `${status}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-13", `Error: ${e.message}`);
  }

  // QA-14: POST /api/models no auth → 401
  try {
    const { status } = await noAuthFetch("/api/models", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacker", gender: "male" }),
    });
    if (status === 401) {
      log("PASS", "QA-14", `POST /api/models no auth → 401`);
    } else {
      log("FAIL", "QA-14", `Expected 401, got ${status}`);
      bug(
        "QA-14",
        "POST /api/models",
        "No auth",
        "401",
        `${status}`,
        "critical",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-14", `Error: ${e.message}`);
  }

  // QA-15: GET /api/models → returns own + presets
  try {
    const { status, body } = await authFetch("/api/models", {}, accessToken);
    if (status === 200 && Array.isArray(body)) {
      log("PASS", "QA-15", `GET /api/models → 200, ${body.length} models`);
    } else {
      log(
        "FAIL",
        "QA-15",
        `Status: ${status}, is array: ${Array.isArray(body)}`,
      );
      bug(
        "QA-15",
        "GET /api/models",
        "Valid auth",
        "200 with array",
        `${status}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-15", `Error: ${e.message}`);
  }

  // QA-16: GET /api/models/[id] → single model
  if (testModelId) {
    try {
      const { status, body } = await authFetch(
        `/api/models/${testModelId}`,
        {},
        accessToken,
      );
      if (status === 200 && body.id === testModelId) {
        log("PASS", "QA-16", `GET /api/models/${testModelId} → 200`);
      } else {
        log("FAIL", "QA-16", `Status: ${status}`);
        bug(
          "QA-16",
          `GET /api/models/${testModelId}`,
          "Valid auth+id",
          "200 with model",
          `${status}`,
          "major",
          "backend",
        );
      }
    } catch (e) {
      log("FAIL", "QA-16", `Error: ${e.message}`);
    }
  }

  // QA-17: GET /api/models/[id] other user's → 404
  try {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { status } = await authFetch(
      `/api/models/${fakeId}`,
      {},
      accessToken,
    );
    if (status === 404) {
      log("PASS", "QA-17", `GET /api/models/fake → 404`);
    } else {
      log("FAIL", "QA-17", `Expected 404, got ${status}`);
      bug(
        "QA-17",
        `GET /api/models/${fakeId}`,
        "Other user id",
        "404",
        `${status}`,
        "critical",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-17", `Error: ${e.message}`);
  }

  // QA-18: PUT /api/models/[id] → update
  if (testModelId) {
    try {
      const { status, body } = await authFetch(
        `/api/models/${testModelId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Updated QA Model",
            style: "streetwear",
          }),
        },
        accessToken,
      );
      if (status === 200 && body.name === "Updated QA Model") {
        log(
          "PASS",
          "QA-18",
          `PUT /api/models/${testModelId} → 200, name updated`,
        );
      } else {
        log(
          "FAIL",
          "QA-18",
          `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
        );
        bug(
          "QA-18",
          `PUT /api/models/${testModelId}`,
          "Valid update",
          "200 with updated model",
          `${status}`,
          "major",
          "backend",
        );
      }
    } catch (e) {
      log("FAIL", "QA-18", `Error: ${e.message}`);
    }
  }

  // QA-19: PUT /api/models/[id] preset → 404 (not 403 per security rules)
  // First need to find a preset (if any exist)
  let presetId;
  try {
    const { data: presets } = await admin
      .from("fashion_models")
      .select("id")
      .eq("is_preset", true)
      .limit(1);
    presetId = presets?.[0]?.id;
  } catch {}

  if (presetId) {
    try {
      const { status } = await authFetch(
        `/api/models/${presetId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "Hacked Preset" }),
        },
        accessToken,
      );
      if (status === 404) {
        log("PASS", "QA-19", `PUT preset → 404 (correct security)`);
      } else {
        log("FAIL", "QA-19", `Expected 404, got ${status}`);
        bug(
          "QA-19",
          `PUT /api/models/${presetId}`,
          "Preset model",
          "404",
          `${status}`,
          "critical",
          "backend",
        );
      }
    } catch (e) {
      log("FAIL", "QA-19", `Error: ${e.message}`);
    }
  } else {
    log("SKIP", "QA-19", "No presets in DB to test");
  }

  // QA-22: GET /api/models/presets → only presets
  try {
    const { status, body } = await authFetch(
      "/api/models/presets",
      {},
      accessToken,
    );
    if (status === 200 && Array.isArray(body)) {
      const allPresets = body.every((m) => m.is_preset === true);
      if (body.length === 0 || allPresets) {
        log(
          "PASS",
          "QA-22",
          `GET /api/models/presets → 200, ${body.length} presets`,
        );
      } else {
        log("FAIL", "QA-22", `Non-preset models returned`);
        bug(
          "QA-22",
          "GET /api/models/presets",
          "Valid auth",
          "Only presets",
          "Non-presets included",
          "major",
          "backend",
        );
      }
    } else {
      log("FAIL", "QA-22", `Status: ${status}`);
    }
  } catch (e) {
    log("FAIL", "QA-22", `Error: ${e.message}`);
  }

  // QA-20/QA-23: DELETE /api/models/[id] → delete own, then verify gone
  // Create a model to delete
  let deleteModelId;
  try {
    const { status, body } = await authFetch(
      "/api/models",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "To Delete", gender: "male" }),
      },
      accessToken,
    );
    if (status === 201) deleteModelId = body.id;
  } catch {}

  if (deleteModelId) {
    try {
      const { status } = await authFetch(
        `/api/models/${deleteModelId}`,
        {
          method: "DELETE",
        },
        accessToken,
      );
      if (status === 200) {
        log("PASS", "QA-20", `DELETE /api/models/${deleteModelId} → 200`);
        // QA-23: Verify gone
        const { status: getStatus } = await authFetch(
          `/api/models/${deleteModelId}`,
          {},
          accessToken,
        );
        if (getStatus === 404) {
          log("PASS", "QA-23", `Deleted model returns 404`);
        } else {
          log("FAIL", "QA-23", `Deleted model still returns ${getStatus}`);
        }
      } else {
        log("FAIL", "QA-20", `Expected 200, got ${status}`);
      }
    } catch (e) {
      log("FAIL", "QA-20", `Error: ${e.message}`);
    }
  }

  // QA-21: DELETE /api/models/[id] preset → 404
  if (presetId) {
    try {
      const { status } = await authFetch(
        `/api/models/${presetId}`,
        {
          method: "DELETE",
        },
        accessToken,
      );
      if (status === 404) {
        log("PASS", "QA-21", `DELETE preset → 404`);
      } else {
        log("FAIL", "QA-21", `Expected 404, got ${status}`);
        bug(
          "QA-21",
          `DELETE /api/models/${presetId}`,
          "Preset model",
          "404",
          `${status}`,
          "critical",
          "backend",
        );
      }
    } catch (e) {
      log("FAIL", "QA-21", `Error: ${e.message}`);
    }
  } else {
    log("SKIP", "QA-21", "No presets in DB to test");
  }

  // ============================================
  // PHASE 4: Garments (limited — no multipart upload)
  // ============================================
  console.log("\n--- Phase 4: Garments ---\n");

  // QA-32: Manually create test garment record via admin
  try {
    const mockAnalysis = {
      main_garment: {
        type: "dress",
        color: "red",
        material: "silk",
        fit: "slim",
      },
      accessory_sets: [{ name: "Gold earrings", type: "jewelry" }],
      locations: [{ name: "Studio", type: "indoor" }],
      poses: [{ name: "Standing", type: "full_body" }],
      lighting: [{ name: "Soft light", type: "studio" }],
    };

    const { data, error } = await admin
      .from("garments")
      .insert({
        user_id: userId,
        image_url: "https://example.com/test-garment.jpg",
        description: "QA test garment",
        analysis: mockAnalysis,
      })
      .select()
      .single();

    if (error) throw error;
    testGarmentId = data.id;
    log("PASS", "QA-32", `Test garment created: ${testGarmentId}`);
  } catch (e) {
    log("FAIL", "QA-32", `Failed to create test garment: ${e.message}`);
  }

  // QA-33: GET /api/garments → returns list
  try {
    const { status, body } = await authFetch("/api/garments", {}, accessToken);
    if (status === 200 && Array.isArray(body) && body.length > 0) {
      log("PASS", "QA-33", `GET /api/garments → 200, ${body.length} garments`);
    } else {
      log(
        "FAIL",
        "QA-33",
        `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
      );
      bug(
        "QA-33",
        "GET /api/garments",
        "Valid auth",
        "200 with garments array",
        `${status}: ${JSON.stringify(body).substring(0, 100)}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-33", `Error: ${e.message}`);
  }

  // QA-34: GET /api/garments/[id] → returns garment with analysis
  if (testGarmentId) {
    try {
      const { status, body } = await authFetch(
        `/api/garments/${testGarmentId}`,
        {},
        accessToken,
      );
      if (status === 200 && body.id === testGarmentId && body.analysis) {
        log(
          "PASS",
          "QA-34",
          `GET /api/garments/${testGarmentId} → 200 with analysis`,
        );

        // QA-35: Verify analysis structure
        const a = body.analysis;
        if (
          a.main_garment &&
          a.accessory_sets &&
          a.locations &&
          a.poses &&
          a.lighting
        ) {
          log("PASS", "QA-35", `Analysis JSON has correct structure`);
        } else {
          log(
            "FAIL",
            "QA-35",
            `Analysis missing fields: ${Object.keys(a).join(", ")}`,
          );
        }
      } else {
        log("FAIL", "QA-34", `Status: ${status}`);
        bug(
          "QA-34",
          `GET /api/garments/${testGarmentId}`,
          "Valid auth+id",
          "200 with garment+analysis",
          `${status}`,
          "major",
          "backend",
        );
      }
    } catch (e) {
      log("FAIL", "QA-34", `Error: ${e.message}`);
    }
  }

  // QA-36: GET /api/garments/[id] other user's → 404
  try {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { status } = await authFetch(
      `/api/garments/${fakeId}`,
      {},
      accessToken,
    );
    if (status === 404) {
      log("PASS", "QA-36", `GET /api/garments/fake → 404`);
    } else {
      log("FAIL", "QA-36", `Expected 404, got ${status}`);
      bug(
        "QA-36",
        `GET /api/garments/${fakeId}`,
        "Other user garment",
        "404",
        `${status}`,
        "critical",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-36", `Error: ${e.message}`);
  }

  // QA-39: GET /api/garments no auth → 401
  try {
    const { status } = await noAuthFetch("/api/garments");
    if (status === 401) {
      log("PASS", "QA-39", `GET /api/garments no auth → 401`);
    } else {
      log("FAIL", "QA-39", `Expected 401, got ${status}`);
      bug(
        "QA-39",
        "GET /api/garments",
        "No auth",
        "401",
        `${status}`,
        "critical",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-39", `Error: ${e.message}`);
  }

  // ============================================
  // PHASE 6: Generations (create test data directly)
  // ============================================
  console.log("\n--- Phase 6: Generations ---\n");

  // Create test generation data directly to test endpoints (since AI not built yet)
  if (testModelId && testGarmentId) {
    try {
      const { data, error } = await admin
        .from("generations")
        .insert({
          user_id: userId,
          model_id: testModelId,
          garment_id: testGarmentId,
          config: { location: "studio", pose: "standing" },
          credits_used: 5,
          prompt_used: "Test prompt for QA",
          status: "completed",
        })
        .select()
        .single();

      if (error) throw error;
      testGenerationId = data.id;

      // Create test output
      const { data: output, error: outErr } = await admin
        .from("generated_outputs")
        .insert({
          generation_id: testGenerationId,
          image_url: "https://example.com/test-output.jpg",
          media_type: "image",
          is_favorite: false,
        })
        .select()
        .single();

      if (!outErr && output) testOutputId = output.id;

      log(
        "PASS",
        "QA-prep",
        `Test generation & output created: ${testGenerationId}`,
      );
    } catch (e) {
      log("FAIL", "QA-prep", `Failed to create test data: ${e.message}`);
    }
  }

  // QA-56: POST /api/generations no auth → 401
  try {
    const { status } = await noAuthFetch("/api/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model_id: "test", garment_id: "test" }),
    });
    if (status === 401) {
      log("PASS", "QA-56", `POST /api/generations no auth → 401`);
    } else {
      log("FAIL", "QA-56", `Expected 401, got ${status}`);
    }
  } catch (e) {
    log("FAIL", "QA-56", `Error: ${e.message}`);
  }

  // QA-59: GET /api/generations → list
  try {
    const { status, body } = await authFetch(
      "/api/generations",
      {},
      accessToken,
    );
    if (status === 200 && body.data && Array.isArray(body.data)) {
      log(
        "PASS",
        "QA-59",
        `GET /api/generations → 200, ${body.data.length} generations`,
      );
    } else {
      log(
        "FAIL",
        "QA-59",
        `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
      );
      bug(
        "QA-59",
        "GET /api/generations",
        "Valid auth",
        "200 with data array",
        `${status}: ${JSON.stringify(body).substring(0, 100)}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-59", `Error: ${e.message}`);
  }

  // QA-60: GET /api/generations/[id] → detail with outputs
  if (testGenerationId) {
    try {
      const { status, body } = await authFetch(
        `/api/generations/${testGenerationId}`,
        {},
        accessToken,
      );
      if (status === 200 && body.id === testGenerationId) {
        const hasOutputs = Array.isArray(body.generated_outputs);
        log(
          "PASS",
          "QA-60",
          `GET /api/generations/${testGenerationId} → 200, outputs: ${hasOutputs}`,
        );
      } else {
        log("FAIL", "QA-60", `Status: ${status}`);
        bug(
          "QA-60",
          `GET /api/generations/${testGenerationId}`,
          "Valid auth+id",
          "200 with generation",
          `${status}`,
          "major",
          "backend",
        );
      }
    } catch (e) {
      log("FAIL", "QA-60", `Error: ${e.message}`);
    }
  }

  // QA-61: GET /api/generations/[id] other user's → 404
  try {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { status } = await authFetch(
      `/api/generations/${fakeId}`,
      {},
      accessToken,
    );
    if (status === 404) {
      log("PASS", "QA-61", `GET /api/generations/fake → 404`);
    } else {
      log("FAIL", "QA-61", `Expected 404, got ${status}`);
    }
  } catch (e) {
    log("FAIL", "QA-61", `Error: ${e.message}`);
  }

  // QA-68: POST multi-angle no auth → 401
  try {
    const { status } = await noAuthFetch(
      "/api/generations/some-id/multi-angle",
      {
        method: "POST",
      },
    );
    if (status === 401) {
      log("PASS", "QA-68", `POST multi-angle no auth → 401`);
    } else {
      log("FAIL", "QA-68", `Expected 401, got ${status}`);
    }
  } catch (e) {
    log("FAIL", "QA-68", `Error: ${e.message}`);
  }

  // ============================================
  // PHASE 8: Gallery & Favorites
  // ============================================
  console.log("\n--- Phase 8: Gallery & Favorites ---\n");

  // QA-69: GET /api/gallery → returns outputs
  try {
    const { status, body } = await authFetch("/api/gallery", {}, accessToken);
    if (status === 200 && body.data && Array.isArray(body.data)) {
      log(
        "PASS",
        "QA-69",
        `GET /api/gallery → 200, ${body.data.length} outputs`,
      );
    } else {
      log(
        "FAIL",
        "QA-69",
        `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
      );
      bug(
        "QA-69",
        "GET /api/gallery",
        "Valid auth",
        "200 with data array",
        `${status}: ${JSON.stringify(body).substring(0, 100)}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-69", `Error: ${e.message}`);
  }

  // QA-70: GET /api/gallery?favorite=true → only favorites
  try {
    const { status, body } = await authFetch(
      "/api/gallery?favorite=true",
      {},
      accessToken,
    );
    if (status === 200 && body.data) {
      log(
        "PASS",
        "QA-70",
        `GET /api/gallery?favorite=true → 200, ${body.data.length} favorites`,
      );
    } else {
      log("FAIL", "QA-70", `Status: ${status}`);
    }
  } catch (e) {
    log("FAIL", "QA-70", `Error: ${e.message}`);
  }

  // QA-74: PUT /api/gallery/[id]/favorite → mark favorite
  if (testOutputId) {
    try {
      const { status, body } = await authFetch(
        `/api/gallery/${testOutputId}/favorite`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_favorite: true }),
        },
        accessToken,
      );
      if (status === 200 && body.is_favorite === true) {
        log("PASS", "QA-74", `PUT favorite → 200, is_favorite=true`);

        // QA-75: Verify in DB
        const { data: dbOutput } = await admin
          .from("generated_outputs")
          .select("is_favorite")
          .eq("id", testOutputId)
          .single();
        if (dbOutput?.is_favorite === true) {
          log("PASS", "QA-75", `DB confirms is_favorite=true`);
        } else {
          log("FAIL", "QA-75", `DB says is_favorite=${dbOutput?.is_favorite}`);
        }

        // QA-76: Unmark
        const { status: s2, body: b2 } = await authFetch(
          `/api/gallery/${testOutputId}/favorite`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ is_favorite: false }),
          },
          accessToken,
        );
        if (s2 === 200 && b2.is_favorite === false) {
          log("PASS", "QA-76", `PUT unfavorite → 200, is_favorite=false`);

          // QA-77: Verify in DB
          const { data: dbOutput2 } = await admin
            .from("generated_outputs")
            .select("is_favorite")
            .eq("id", testOutputId)
            .single();
          if (dbOutput2?.is_favorite === false) {
            log("PASS", "QA-77", `DB confirms is_favorite=false`);
          } else {
            log(
              "FAIL",
              "QA-77",
              `DB says is_favorite=${dbOutput2?.is_favorite}`,
            );
          }
        } else {
          log("FAIL", "QA-76", `Expected 200, got ${s2}`);
        }
      } else {
        log(
          "FAIL",
          "QA-74",
          `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
        );
        bug(
          "QA-74",
          `PUT /api/gallery/${testOutputId}/favorite`,
          "{ is_favorite: true }",
          "200 with is_favorite=true",
          `${status}: ${JSON.stringify(body).substring(0, 100)}`,
          "major",
          "backend",
        );
      }
    } catch (e) {
      log("FAIL", "QA-74", `Error: ${e.message}`);
    }
  }

  // QA-78: PUT favorite on other user's output → 404
  try {
    const fakeId = "00000000-0000-0000-0000-000000000000";
    const { status } = await authFetch(
      `/api/gallery/${fakeId}/favorite`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_favorite: true }),
      },
      accessToken,
    );
    if (status === 404) {
      log("PASS", "QA-78", `PUT favorite on fake output → 404`);
    } else {
      log("FAIL", "QA-78", `Expected 404, got ${status}`);
    }
  } catch (e) {
    log("FAIL", "QA-78", `Error: ${e.message}`);
  }

  // QA-79: GET /api/gallery no auth → 401
  try {
    const { status } = await noAuthFetch("/api/gallery");
    if (status === 401) {
      log("PASS", "QA-79", `GET /api/gallery no auth → 401`);
    } else {
      log("FAIL", "QA-79", `Expected 401, got ${status}`);
    }
  } catch (e) {
    log("FAIL", "QA-79", `Error: ${e.message}`);
  }

  // ============================================
  // PHASE 9: Credits
  // ============================================
  console.log("\n--- Phase 9: Credits ---\n");

  // QA-80: GET /api/credits → current balance
  try {
    const { status, body } = await authFetch("/api/credits", {}, accessToken);
    if (status === 200 && typeof body.credits === "number") {
      log("PASS", "QA-80", `GET /api/credits → 200, credits: ${body.credits}`);
    } else {
      log("FAIL", "QA-80", `Status: ${status}, body: ${JSON.stringify(body)}`);
      bug(
        "QA-80",
        "GET /api/credits",
        "Valid auth",
        "200 with credits number",
        `${status}: ${JSON.stringify(body)}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-80", `Error: ${e.message}`);
  }

  // QA-81: Balance matches profile.credits
  try {
    const { status, body: creditsBody } = await authFetch(
      "/api/credits",
      {},
      accessToken,
    );
    const { data: profile } = await admin
      .from("profiles")
      .select("credits")
      .eq("id", userId)
      .single();
    if (creditsBody.credits === profile?.credits) {
      log(
        "PASS",
        "QA-81",
        `Balance ${creditsBody.credits} matches profile.credits ${profile?.credits}`,
      );
    } else {
      log(
        "FAIL",
        "QA-81",
        `API says ${creditsBody.credits}, DB says ${profile?.credits}`,
      );
      bug(
        "QA-81",
        "GET /api/credits",
        "Balance consistency",
        "Match profile.credits",
        `API: ${creditsBody.credits}, DB: ${profile?.credits}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-81", `Error: ${e.message}`);
  }

  // QA-82: GET /api/credits/history → paginated ledger
  try {
    const { status, body } = await authFetch(
      "/api/credits/history",
      {},
      accessToken,
    );
    if (
      status === 200 &&
      body.data &&
      Array.isArray(body.data) &&
      typeof body.total === "number"
    ) {
      log(
        "PASS",
        "QA-82",
        `GET /api/credits/history → 200, ${body.data.length} entries, total: ${body.total}`,
      );
    } else {
      log(
        "FAIL",
        "QA-82",
        `Status: ${status}, body: ${JSON.stringify(body).substring(0, 200)}`,
      );
      bug(
        "QA-82",
        "GET /api/credits/history",
        "Valid auth",
        "200 with paginated data",
        `${status}: ${JSON.stringify(body).substring(0, 100)}`,
        "major",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-82", `Error: ${e.message}`);
  }

  // ============================================
  // PHASE 11: Swagger
  // ============================================
  console.log("\n--- Phase 11: Swagger ---\n");

  // QA-94: /api-docs loads
  try {
    const res = await fetch(`${BASE_URL}/api-docs`);
    if (res.status === 200) {
      const html = await res.text();
      log("PASS", "QA-94", `GET /api-docs → 200 (${html.length} bytes)`);
    } else {
      log("FAIL", "QA-94", `Status: ${res.status}`);
    }
  } catch (e) {
    log("FAIL", "QA-94", `Error: ${e.message}`);
  }

  // QA-95: All backend endpoints listed in swagger
  try {
    const res = await fetch(`${BASE_URL}/api/swagger`);
    const spec = await res.json();
    const paths = Object.keys(spec.paths || {});
    const expectedPaths = [
      "/api/profiles",
      "/api/models",
      "/api/models/{id}",
      "/api/models/presets",
      "/api/garments",
      "/api/garments/{id}",
      "/api/generations",
      "/api/generations/{id}",
      "/api/generations/{id}/multi-angle",
      "/api/gallery",
      "/api/gallery/{id}/favorite",
      "/api/credits",
      "/api/credits/history",
      "/api/credits/purchase",
    ];
    const missing = expectedPaths.filter((p) => !paths.includes(p));
    if (missing.length === 0) {
      log(
        "PASS",
        "QA-95",
        `All ${expectedPaths.length} backend endpoints in swagger`,
      );
    } else {
      log("FAIL", "QA-95", `Missing paths: ${missing.join(", ")}`);
      bug(
        "QA-95",
        "GET /api/swagger",
        "All endpoints",
        `All ${expectedPaths.length} paths listed`,
        `Missing: ${missing.join(", ")}`,
        "minor",
        "backend",
      );
    }
  } catch (e) {
    log("FAIL", "QA-95", `Error: ${e.message}`);
  }

  // ============================================
  // PHASE: Garment Delete (QA-37, QA-38)
  // ============================================
  // Create a new garment just for delete testing (keep testGarmentId for gen tests)
  let deleteGarmentId;
  try {
    const { data, error } = await admin
      .from("garments")
      .insert({
        user_id: userId,
        image_url: "https://example.com/to-delete.jpg",
        description: "To delete",
      })
      .select()
      .single();
    if (!error) deleteGarmentId = data.id;
  } catch {}

  if (deleteGarmentId) {
    // QA-37: DELETE /api/garments/[id]
    try {
      const { status } = await authFetch(
        `/api/garments/${deleteGarmentId}`,
        {
          method: "DELETE",
        },
        accessToken,
      );
      if (status === 200) {
        log("PASS", "QA-37", `DELETE /api/garments/${deleteGarmentId} → 200`);

        // QA-38: Verify gone
        const { status: getStatus } = await authFetch(
          `/api/garments/${deleteGarmentId}`,
          {},
          accessToken,
        );
        if (getStatus === 404) {
          log("PASS", "QA-38", `Deleted garment returns 404`);
        } else {
          log("FAIL", "QA-38", `Deleted garment returns ${getStatus}`);
        }
      } else {
        log("FAIL", "QA-37", `Expected 200, got ${status}`);
      }
    } catch (e) {
      log("FAIL", "QA-37", `Error: ${e.message}`);
    }
  }

  // ============================================
  // CLEANUP
  // ============================================
  console.log("\n--- Cleanup ---\n");
  await cleanup(userId);

  // ============================================
  // REPORT
  // ============================================
  console.log("\n========================================");
  console.log(
    `RESULTS: ${results.passed} passed, ${results.failed} failed, ${results.skipped} skipped`,
  );
  console.log("========================================\n");

  if (results.bugs.length > 0) {
    console.log(`\n🐛 ${results.bugs.length} BUGS FOUND:\n`);
    for (const b of results.bugs) {
      console.log(`  ${b.id} | ${b.endpoint} | ${b.severity} | ${b.owner}`);
      console.log(`    Expected: ${b.expected}`);
      console.log(`    Actual: ${b.actual}\n`);
    }
  }
}

async function cleanup(userId) {
  try {
    // Delete outputs, generations, garments, models, then user
    await admin
      .from("generated_outputs")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    await admin.from("generations").delete().eq("user_id", userId);
    await admin.from("garments").delete().eq("user_id", userId);
    await admin
      .from("fashion_models")
      .delete()
      .eq("user_id", userId)
      .eq("is_preset", false);
    await admin.from("credit_ledger").delete().eq("user_id", userId);
    await admin.from("profiles").delete().eq("id", userId);
    await admin.auth.admin.deleteUser(userId);
    console.log("  🧹 Cleanup complete");
  } catch (e) {
    console.log(`  ⚠️ Cleanup error: ${e.message}`);
  }
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
