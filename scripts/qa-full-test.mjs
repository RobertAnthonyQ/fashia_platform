/**
 * FASHIA QA Full Test Script
 * Tests all API endpoints: profiles, models, garments, gallery, credits, generations
 */

const SUPABASE_URL = "https://kcvbvkcastqpjaqqtsnq.supabase.co";
const ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdmJ2a2Nhc3RxcGphcXF0c25xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NTQwOTIsImV4cCI6MjA4ODQzMDA5Mn0.tLrfG6hxB5LPgbX6OighDABZsmCn9rNnYhS2T_xhSo8";
const SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtjdmJ2a2Nhc3RxcGphcXF0c25xIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjg1NDA5MiwiZXhwIjoyMDg4NDMwMDkyfQ.SOCJGiVela8n7BDSKbLNO3-pnxp1ahpInN7iDSnQfeY";
const APP_URL = "http://localhost:3000";

let JWT = "";
let USER_ID = "";
let SESSION_COOKIES = "";
const results = [];
let passed = 0;
let failed = 0;
let skipped = 0;
const bugs = [];

// Supabase project ref extracted from URL
const SUPABASE_REF = "kcvbvkcastqpjaqqtsnq";

// ─── Helpers ───────────────────────────────────────────────────────────
function log(id, status, endpoint, detail) {
  const icon = status === "PASS" ? "✅" : status === "FAIL" ? "❌" : "⏭️";
  console.log(`${icon} ${id}: ${endpoint} — ${detail}`);
  results.push({ id, status, endpoint, detail });
  if (status === "PASS") passed++;
  else if (status === "FAIL") failed++;
  else skipped++;
}

function reportBug(id, method, path, input, expected, actual, severity, owner) {
  bugs.push({ id, method, path, input, expected, actual, severity, owner });
}

function buildSessionCookies(sessionData) {
  // Supabase SSR stores sessions as chunked cookies:
  // sb-{ref}-auth-token.0, sb-{ref}-auth-token.1, etc.
  const json = JSON.stringify(sessionData);
  const CHUNK_SIZE = 3500; // Supabase uses ~3500 chars per chunk
  const chunks = [];
  for (let i = 0; i < json.length; i += CHUNK_SIZE) {
    chunks.push(json.substring(i, i + CHUNK_SIZE));
  }
  const cookieName = `sb-${SUPABASE_REF}-auth-token`;
  if (chunks.length === 1) {
    return `${cookieName}=${encodeURIComponent(chunks[0])}`;
  }
  return chunks
    .map((chunk, i) => `${cookieName}.${i}=${encodeURIComponent(chunk)}`)
    .join("; ");
}

async function api(method, path, body, useAuth) {
  const headers = { "Content-Type": "application/json" };
  if (useAuth && SESSION_COOKIES) {
    headers["Cookie"] = SESSION_COOKIES;
  }
  const opts = { method, headers };
  if (body && method !== "GET") opts.body = JSON.stringify(body);
  const url = `${APP_URL}${path}`;
  try {
    const res = await fetch(url, opts);
    let data;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { status: res.status, data };
  } catch (err) {
    return { status: 0, data: null, error: err.message };
  }
}

async function supabaseAdmin(method, path, body) {
  const headers = {
    "Content-Type": "application/json",
    apikey: ANON_KEY,
    Authorization: `Bearer ${SERVICE_KEY}`,
  };
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${SUPABASE_URL}${path}`, opts);
  let data;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return { status: res.status, data };
}

// ─── Auth Setup ────────────────────────────────────────────────────────
async function getJWT() {
  console.log("\n🔐 Authenticating QA user...");
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "qa@fashia.com",
      password: "QaPassword123!",
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error("❌ Failed to authenticate:", data);
    process.exit(1);
  }
  JWT = data.access_token;
  USER_ID = data.user.id;

  // Build cookie-based session for Next.js Supabase SSR
  const sessionData = {
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_at: data.expires_at,
    expires_in: data.expires_in,
    token_type: data.token_type,
    user: data.user,
  };
  SESSION_COOKIES = buildSessionCookies(sessionData);
  console.log(`✅ JWT obtained + session cookies built. User ID: ${USER_ID}`);
}

// ─── Ensure Profile Exists ─────────────────────────────────────────────
async function ensureProfile() {
  // Check if profile exists
  const { status } = await supabaseAdmin(
    "GET",
    `/rest/v1/profiles?id=eq.${USER_ID}&select=*`,
  );
  if (status === 200) {
    // Fetch it
    const check = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}&select=*`,
      {
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
      },
    );
    const profiles = await check.json();
    if (profiles.length === 0) {
      // Create profile
      console.log("📋 Creating profile for QA user...");
      await supabaseAdmin("POST", "/rest/v1/profiles", {
        id: USER_ID,
        email: "qa@fashia.com",
        credits: 100,
        full_name: "QA Test User",
      });
    } else {
      // Make sure we have enough credits for testing
      await supabaseAdmin("PATCH", `/rest/v1/profiles?id=eq.${USER_ID}`, {
        credits: 100,
      });
      console.log("📋 Profile exists. Reset credits to 100.");
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 1: PROFILES
// ═══════════════════════════════════════════════════════════════════════
async function testProfiles() {
  console.log("\n══════════════════════════════════");
  console.log("PHASE 1: AUTH & PROFILES");
  console.log("══════════════════════════════════");

  // QA-01: User exists (already done in setup)
  log("QA-01", "PASS", "Supabase Auth", "QA user registered/exists");

  // QA-02: Profile exists with credits
  const profileCheck = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?id=eq.${USER_ID}&select=*`,
    {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    },
  );
  const profiles = await profileCheck.json();
  if (profiles.length > 0 && profiles[0].credits !== null) {
    log(
      "QA-02",
      "PASS",
      "Profile auto-created",
      `credits=${profiles[0].credits}`,
    );
  } else {
    log("QA-02", "FAIL", "Profile auto-created", "No profile or no credits");
    reportBug(
      "QA-02",
      "-",
      "profiles",
      "-",
      "Profile with credits",
      "Missing",
      "major",
      "backend",
    );
  }

  // QA-03: GET /api/profiles
  const { status: s3, data: d3 } = await api(
    "GET",
    "/api/profiles",
    null,
    true,
  );
  if (s3 === 200 && d3 && d3.id) {
    log("QA-03", "PASS", "GET /api/profiles", `id=${d3.id}, email=${d3.email}`);
  } else {
    log(
      "QA-03",
      "FAIL",
      "GET /api/profiles",
      `status=${s3}, data=${JSON.stringify(d3)}`,
    );
    reportBug(
      "QA-03",
      "GET",
      "/api/profiles",
      "valid auth",
      "200 + profile",
      `${s3}`,
      "major",
      "backend",
    );
  }

  // QA-04: PUT /api/profiles (valid update)
  const { status: s4, data: d4 } = await api(
    "PUT",
    "/api/profiles",
    {
      full_name: "QA Test Updated",
      country: "Spain",
      company_name: "FASHIA QA Co",
    },
    true,
  );
  if (s4 === 200 && d4) {
    log(
      "QA-04",
      "PASS",
      "PUT /api/profiles",
      `updated full_name=${d4.full_name}`,
    );
  } else {
    log(
      "QA-04",
      "FAIL",
      "PUT /api/profiles",
      `status=${s4}, data=${JSON.stringify(d4)}`,
    );
    reportBug(
      "QA-04",
      "PUT",
      "/api/profiles",
      "valid body",
      "200",
      `${s4}`,
      "major",
      "backend",
    );
  }

  // QA-05: PUT /api/profiles invalid data
  const { status: s5 } = await api(
    "PUT",
    "/api/profiles",
    {
      full_name: "",
      country: "",
    },
    true,
  );
  if (s5 === 400) {
    log("QA-05", "PASS", "PUT /api/profiles (invalid)", `status=400`);
  } else {
    log(
      "QA-05",
      "FAIL",
      "PUT /api/profiles (invalid)",
      `expected 400, got ${s5}`,
    );
    reportBug(
      "QA-05",
      "PUT",
      "/api/profiles",
      "empty strings",
      "400",
      `${s5}`,
      "major",
      "backend",
    );
  }

  // QA-06: GET /api/profiles no auth
  const { status: s6 } = await api("GET", "/api/profiles", null, false);
  if (s6 === 401) {
    log("QA-06", "PASS", "GET /api/profiles (no auth)", "status=401");
  } else {
    log(
      "QA-06",
      "FAIL",
      "GET /api/profiles (no auth)",
      `expected 401, got ${s6}`,
    );
    reportBug(
      "QA-06",
      "GET",
      "/api/profiles",
      "no auth",
      "401",
      `${s6}`,
      "critical",
      "backend",
    );
  }

  // QA-07: Middleware redirect (can't fully test via API, skip)
  log(
    "QA-07",
    "SKIP",
    "Middleware redirect",
    "Cannot test redirect via API call",
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 2: FASHION MODELS CRUD
// ═══════════════════════════════════════════════════════════════════════
let createdModelId = "";
async function testModels() {
  console.log("\n══════════════════════════════════");
  console.log("PHASE 2: FASHION MODELS CRUD");
  console.log("══════════════════════════════════");

  // QA-08: POST /api/models (create)
  const { status: s8, data: d8 } = await api(
    "POST",
    "/api/models",
    {
      name: "QA Test Model",
      gender: "female",
      country: "Argentina",
      age: 25,
      style: "elegant",
    },
    true,
  );
  if (s8 === 201 && d8 && d8.id) {
    createdModelId = d8.id;
    log("QA-08", "PASS", "POST /api/models", `id=${d8.id}`);
  } else {
    log(
      "QA-08",
      "FAIL",
      "POST /api/models",
      `status=${s8}, data=${JSON.stringify(d8)}`,
    );
    reportBug(
      "QA-08",
      "POST",
      "/api/models",
      "valid body",
      "201",
      `${s8}`,
      "major",
      "backend",
    );
  }

  // QA-09: Verify description field (may or may not be populated - AI)
  if (d8 && d8.description) {
    log(
      "QA-09",
      "PASS",
      "Model description",
      `description=${d8.description.substring(0, 50)}...`,
    );
  } else {
    log(
      "QA-09",
      "SKIP",
      "Model description",
      "AI not configured or description not populated",
    );
  }

  // QA-10: Verify ref_face_url
  if (d8 && d8.ref_face_url) {
    log(
      "QA-10",
      "PASS",
      "Model ref_face_url",
      `url=${d8.ref_face_url.substring(0, 50)}...`,
    );
  } else {
    log(
      "QA-10",
      "SKIP",
      "Model ref_face_url",
      "AI not configured or face not generated",
    );
  }

  // QA-11: POST /api/models missing name
  const { status: s11 } = await api(
    "POST",
    "/api/models",
    {
      gender: "male",
    },
    true,
  );
  if (s11 === 400) {
    log("QA-11", "PASS", "POST /api/models (no name)", "status=400");
  } else {
    log(
      "QA-11",
      "FAIL",
      "POST /api/models (no name)",
      `expected 400, got ${s11}`,
    );
    reportBug(
      "QA-11",
      "POST",
      "/api/models",
      "missing name",
      "400",
      `${s11}`,
      "major",
      "backend",
    );
  }

  // QA-12: POST /api/models invalid gender
  const { status: s12 } = await api(
    "POST",
    "/api/models",
    {
      name: "Invalid",
      gender: "xyz",
    },
    true,
  );
  if (s12 === 400) {
    log("QA-12", "PASS", "POST /api/models (bad gender)", "status=400");
  } else {
    log(
      "QA-12",
      "FAIL",
      "POST /api/models (bad gender)",
      `expected 400, got ${s12}`,
    );
    reportBug(
      "QA-12",
      "POST",
      "/api/models",
      "invalid gender",
      "400",
      `${s12}`,
      "major",
      "backend",
    );
  }

  // QA-13: POST /api/models age out of range
  const { status: s13 } = await api(
    "POST",
    "/api/models",
    {
      name: "Age Test",
      gender: "male",
      age: 5, // min=16
    },
    true,
  );
  if (s13 === 400) {
    log("QA-13", "PASS", "POST /api/models (bad age)", "status=400");
  } else {
    log(
      "QA-13",
      "FAIL",
      "POST /api/models (bad age)",
      `expected 400, got ${s13}`,
    );
    reportBug(
      "QA-13",
      "POST",
      "/api/models",
      "age=5 (<16)",
      "400",
      `${s13}`,
      "major",
      "backend",
    );
  }

  // QA-14: POST /api/models no auth
  const { status: s14 } = await api(
    "POST",
    "/api/models",
    {
      name: "Noauth",
      gender: "male",
    },
    false,
  );
  if (s14 === 401) {
    log("QA-14", "PASS", "POST /api/models (no auth)", "status=401");
  } else {
    log(
      "QA-14",
      "FAIL",
      "POST /api/models (no auth)",
      `expected 401, got ${s14}`,
    );
    reportBug(
      "QA-14",
      "POST",
      "/api/models",
      "no auth",
      "401",
      `${s14}`,
      "critical",
      "backend",
    );
  }

  // QA-15: GET /api/models (list)
  const { status: s15, data: d15 } = await api(
    "GET",
    "/api/models",
    null,
    true,
  );
  if (s15 === 200 && Array.isArray(d15)) {
    log("QA-15", "PASS", "GET /api/models", `count=${d15.length}`);
  } else {
    log(
      "QA-15",
      "FAIL",
      "GET /api/models",
      `status=${s15}, isArray=${Array.isArray(d15)}`,
    );
    reportBug(
      "QA-15",
      "GET",
      "/api/models",
      "valid auth",
      "200 + array",
      `${s15}`,
      "major",
      "backend",
    );
  }

  // QA-16: GET /api/models/[id]
  if (createdModelId) {
    const { status: s16, data: d16 } = await api(
      "GET",
      `/api/models/${createdModelId}`,
      null,
      true,
    );
    if (s16 === 200 && d16 && d16.id === createdModelId) {
      log("QA-16", "PASS", "GET /api/models/[id]", `name=${d16.name}`);
    } else {
      log("QA-16", "FAIL", "GET /api/models/[id]", `status=${s16}`);
      reportBug(
        "QA-16",
        "GET",
        `/api/models/${createdModelId}`,
        "valid auth+id",
        "200",
        `${s16}`,
        "major",
        "backend",
      );
    }
  } else {
    log("QA-16", "SKIP", "GET /api/models/[id]", "No model created");
  }

  // QA-17: GET /api/models/[id] other user's -> 404
  const fakeId = "00000000-0000-0000-0000-000000000001";
  const { status: s17 } = await api("GET", `/api/models/${fakeId}`, null, true);
  if (s17 === 404) {
    log("QA-17", "PASS", "GET /api/models/[id] (other user)", "status=404");
  } else {
    log(
      "QA-17",
      "FAIL",
      "GET /api/models/[id] (other user)",
      `expected 404, got ${s17}`,
    );
    reportBug(
      "QA-17",
      "GET",
      `/api/models/${fakeId}`,
      "other user id",
      "404",
      `${s17}`,
      "critical",
      "backend",
    );
  }

  // QA-18: PUT /api/models/[id] (update)
  if (createdModelId) {
    const { status: s18, data: d18 } = await api(
      "PUT",
      `/api/models/${createdModelId}`,
      {
        name: "QA Updated Model",
        style: "casual",
      },
      true,
    );
    if (s18 === 200 && d18) {
      log("QA-18", "PASS", "PUT /api/models/[id]", `name=${d18.name}`);
    } else {
      log("QA-18", "FAIL", "PUT /api/models/[id]", `status=${s18}`);
      reportBug(
        "QA-18",
        "PUT",
        `/api/models/${createdModelId}`,
        "valid update",
        "200",
        `${s18}`,
        "major",
        "backend",
      );
    }
  } else {
    log("QA-18", "SKIP", "PUT /api/models/[id]", "No model created");
  }

  // QA-19: PUT preset model -> 403 (check if presets exist)
  const { data: presets } = await api("GET", "/api/models/presets", null, true);
  if (presets && Array.isArray(presets) && presets.length > 0) {
    const presetId = presets[0].id;
    const { status: s19 } = await api(
      "PUT",
      `/api/models/${presetId}`,
      { name: "Hack" },
      true,
    );
    if (s19 === 403 || s19 === 404) {
      log(
        "QA-19",
        "PASS",
        "PUT /api/models/[preset]",
        `status=${s19} (blocked)`,
      );
    } else {
      log(
        "QA-19",
        "FAIL",
        "PUT /api/models/[preset]",
        `expected 403/404, got ${s19}`,
      );
      reportBug(
        "QA-19",
        "PUT",
        `/api/models/${presetId}`,
        "preset edit",
        "403",
        `${s19}`,
        "major",
        "backend",
      );
    }
  } else {
    log("QA-19", "SKIP", "PUT /api/models/[preset]", "No presets found");
  }

  // QA-22: GET /api/models/presets
  const { status: s22, data: d22 } = await api(
    "GET",
    "/api/models/presets",
    null,
    true,
  );
  if (s22 === 200 && Array.isArray(d22)) {
    const allPreset = d22.every((m) => m.is_preset);
    log(
      "QA-22",
      allPreset ? "PASS" : "FAIL",
      "GET /api/models/presets",
      `count=${d22.length}, allPreset=${allPreset}`,
    );
    if (!allPreset)
      reportBug(
        "QA-22",
        "GET",
        "/api/models/presets",
        "-",
        "all is_preset=true",
        "some not preset",
        "major",
        "backend",
      );
  } else {
    log("QA-22", "FAIL", "GET /api/models/presets", `status=${s22}`);
    reportBug(
      "QA-22",
      "GET",
      "/api/models/presets",
      "-",
      "200 + array",
      `${s22}`,
      "major",
      "backend",
    );
  }

  // QA-20: DELETE /api/models/[id] (will test later after all reads)
  // QA-21: DELETE preset -> 403
  if (presets && Array.isArray(presets) && presets.length > 0) {
    const presetId = presets[0].id;
    const { status: s21 } = await api(
      "DELETE",
      `/api/models/${presetId}`,
      null,
      true,
    );
    if (s21 === 403 || s21 === 404) {
      log(
        "QA-21",
        "PASS",
        "DELETE /api/models/[preset]",
        `status=${s21} (blocked)`,
      );
    } else {
      log(
        "QA-21",
        "FAIL",
        "DELETE /api/models/[preset]",
        `expected 403/404, got ${s21}`,
      );
      reportBug(
        "QA-21",
        "DELETE",
        `/api/models/${presetId}`,
        "delete preset",
        "403",
        `${s21}`,
        "major",
        "backend",
      );
    }
  } else {
    log("QA-21", "SKIP", "DELETE /api/models/[preset]", "No presets");
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 4: GARMENTS (limited — manual insert needed)
// ═══════════════════════════════════════════════════════════════════════
let testGarmentId = "";
async function testGarments() {
  console.log("\n══════════════════════════════════");
  console.log("PHASE 4: GARMENTS");
  console.log("══════════════════════════════════");

  // QA-32: Manually create test garment in DB
  const mockAnalysis = {
    main_garment: { type: "dress", color: "red", material: "silk" },
    accessory_sets: [{ name: "elegant", items: ["earrings", "bracelet"] }],
    locations: ["studio", "outdoor park"],
    poses: ["standing", "walking"],
    lighting: ["natural", "studio soft"],
  };
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/garments`, {
    method: "POST",
    headers: {
      apikey: ANON_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      user_id: USER_ID,
      image_url: "https://example.com/test-garment.jpg",
      description: "QA test garment",
      analysis: mockAnalysis,
    }),
  });
  const insertData = await insertRes.json();
  if (Array.isArray(insertData) && insertData.length > 0) {
    testGarmentId = insertData[0].id;
    log("QA-32", "PASS", "Insert test garment (DB)", `id=${testGarmentId}`);
  } else if (insertData && insertData.id) {
    testGarmentId = insertData.id;
    log("QA-32", "PASS", "Insert test garment (DB)", `id=${testGarmentId}`);
  } else {
    log(
      "QA-32",
      "FAIL",
      "Insert test garment (DB)",
      `response=${JSON.stringify(insertData)}`,
    );
    reportBug(
      "QA-32",
      "POST",
      "supabase/garments",
      "manual insert",
      "garment created",
      JSON.stringify(insertData),
      "critical",
      "backend",
    );
    return;
  }

  // QA-33: GET /api/garments
  const { status: s33, data: d33 } = await api(
    "GET",
    "/api/garments",
    null,
    true,
  );
  if (s33 === 200 && Array.isArray(d33)) {
    log("QA-33", "PASS", "GET /api/garments", `count=${d33.length}`);
  } else {
    log(
      "QA-33",
      "FAIL",
      "GET /api/garments",
      `status=${s33}, isArray=${Array.isArray(d33)}`,
    );
    reportBug(
      "QA-33",
      "GET",
      "/api/garments",
      "valid auth",
      "200 + array",
      `${s33}`,
      "major",
      "backend",
    );
  }

  // QA-34: GET /api/garments/[id]
  const { status: s34, data: d34 } = await api(
    "GET",
    `/api/garments/${testGarmentId}`,
    null,
    true,
  );
  if (s34 === 200 && d34) {
    log("QA-34", "PASS", "GET /api/garments/[id]", `id=${d34.id}`);
  } else {
    log("QA-34", "FAIL", "GET /api/garments/[id]", `status=${s34}`);
    reportBug(
      "QA-34",
      "GET",
      `/api/garments/${testGarmentId}`,
      "valid id",
      "200",
      `${s34}`,
      "major",
      "backend",
    );
  }

  // QA-35: Verify analysis JSON structure
  if (d34 && d34.analysis) {
    const a = d34.analysis;
    const hasFields =
      a.main_garment &&
      a.accessory_sets &&
      a.locations &&
      a.poses &&
      a.lighting;
    if (hasFields) {
      log(
        "QA-35",
        "PASS",
        "Analysis JSON structure",
        "All required fields present",
      );
    } else {
      log(
        "QA-35",
        "FAIL",
        "Analysis JSON structure",
        `Missing fields: ${JSON.stringify(Object.keys(a))}`,
      );
      reportBug(
        "QA-35",
        "-",
        "analysis",
        "mock data",
        "all fields",
        `keys=${JSON.stringify(Object.keys(a))}`,
        "major",
        "backend",
      );
    }
  } else {
    log(
      "QA-35",
      "FAIL",
      "Analysis JSON structure",
      "No analysis data in response",
    );
  }

  // QA-36: GET /api/garments/[id] other user -> 404
  const { status: s36 } = await api(
    "GET",
    `/api/garments/00000000-0000-0000-0000-000000000001`,
    null,
    true,
  );
  if (s36 === 404) {
    log("QA-36", "PASS", "GET /api/garments/[id] (other user)", "status=404");
  } else {
    log(
      "QA-36",
      "FAIL",
      "GET /api/garments/[id] (other user)",
      `expected 404, got ${s36}`,
    );
    reportBug(
      "QA-36",
      "GET",
      "/api/garments/fake-id",
      "other user",
      "404",
      `${s36}`,
      "critical",
      "backend",
    );
  }

  // QA-39: GET /api/garments no auth
  const { status: s39 } = await api("GET", "/api/garments", null, false);
  if (s39 === 401) {
    log("QA-39", "PASS", "GET /api/garments (no auth)", "status=401");
  } else {
    log(
      "QA-39",
      "FAIL",
      "GET /api/garments (no auth)",
      `expected 401, got ${s39}`,
    );
    reportBug(
      "QA-39",
      "GET",
      "/api/garments",
      "no auth",
      "401",
      `${s39}`,
      "critical",
      "backend",
    );
  }

  // QA-37 & QA-38 will be done at cleanup
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 8: GALLERY & FAVORITES
// ═══════════════════════════════════════════════════════════════════════
async function testGallery() {
  console.log("\n══════════════════════════════════");
  console.log("PHASE 8: GALLERY & FAVORITES");
  console.log("══════════════════════════════════");

  // QA-69: GET /api/gallery
  const { status: s69, data: d69 } = await api(
    "GET",
    "/api/gallery",
    null,
    true,
  );
  if (s69 === 200 && d69 && "data" in d69) {
    log("QA-69", "PASS", "GET /api/gallery", `total=${d69.total}`);
  } else {
    log(
      "QA-69",
      "FAIL",
      "GET /api/gallery",
      `status=${s69}, data=${JSON.stringify(d69)}`,
    );
    reportBug(
      "QA-69",
      "GET",
      "/api/gallery",
      "valid auth",
      "200 + paginated",
      `${s69}`,
      "major",
      "backend",
    );
  }

  // QA-70: GET /api/gallery?favorite=true
  const { status: s70, data: d70 } = await api(
    "GET",
    "/api/gallery?favorite=true",
    null,
    true,
  );
  if (s70 === 200) {
    log(
      "QA-70",
      "PASS",
      "GET /api/gallery?favorite=true",
      `total=${d70?.total}`,
    );
  } else {
    log("QA-70", "FAIL", "GET /api/gallery?favorite=true", `status=${s70}`);
    reportBug(
      "QA-70",
      "GET",
      "/api/gallery?favorite=true",
      "filter",
      "200",
      `${s70}`,
      "minor",
      "backend",
    );
  }

  // QA-79: GET /api/gallery no auth
  const { status: s79 } = await api("GET", "/api/gallery", null, false);
  if (s79 === 401) {
    log("QA-79", "PASS", "GET /api/gallery (no auth)", "status=401");
  } else {
    log(
      "QA-79",
      "FAIL",
      "GET /api/gallery (no auth)",
      `expected 401, got ${s79}`,
    );
    reportBug(
      "QA-79",
      "GET",
      "/api/gallery",
      "no auth",
      "401",
      `${s79}`,
      "critical",
      "backend",
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 9: CREDITS
// ═══════════════════════════════════════════════════════════════════════
async function testCredits() {
  console.log("\n══════════════════════════════════");
  console.log("PHASE 9: CREDITS");
  console.log("══════════════════════════════════");

  // QA-80: GET /api/credits
  const { status: s80, data: d80 } = await api(
    "GET",
    "/api/credits",
    null,
    true,
  );
  if (s80 === 200 && d80 && "credits" in d80) {
    log("QA-80", "PASS", "GET /api/credits", `credits=${d80.credits}`);
  } else {
    log(
      "QA-80",
      "FAIL",
      "GET /api/credits",
      `status=${s80}, data=${JSON.stringify(d80)}`,
    );
    reportBug(
      "QA-80",
      "GET",
      "/api/credits",
      "valid auth",
      "200 + credits field",
      `${s80}`,
      "major",
      "backend",
    );
  }

  // QA-81: Balance matches profile.credits
  const { data: profileData } = await api("GET", "/api/profiles", null, true);
  if (profileData && d80 && profileData.credits === d80.credits) {
    log("QA-81", "PASS", "Balance matches profile", `both=${d80.credits}`);
  } else {
    log(
      "QA-81",
      "FAIL",
      "Balance matches profile",
      `profile=${profileData?.credits} vs credits=${d80?.credits}`,
    );
    reportBug(
      "QA-81",
      "-",
      "credits",
      "-",
      "credits match",
      "mismatch",
      "major",
      "backend",
    );
  }

  // QA-82: GET /api/credits/history
  const { status: s82, data: d82 } = await api(
    "GET",
    "/api/credits/history",
    null,
    true,
  );
  if (s82 === 200 && d82 && "data" in d82) {
    log(
      "QA-82",
      "PASS",
      "GET /api/credits/history",
      `total=${d82.total}, page=${d82.page}`,
    );
  } else {
    log("QA-82", "FAIL", "GET /api/credits/history", `status=${s82}`);
    reportBug(
      "QA-82",
      "GET",
      "/api/credits/history",
      "-",
      "200 + paginated",
      `${s82}`,
      "major",
      "backend",
    );
  }

  // Test credits no auth
  const { status: sNoAuth } = await api("GET", "/api/credits", null, false);
  if (sNoAuth === 401) {
    log("QA-80b", "PASS", "GET /api/credits (no auth)", "status=401");
  } else {
    log(
      "QA-80b",
      "FAIL",
      "GET /api/credits (no auth)",
      `expected 401, got ${sNoAuth}`,
    );
  }

  // Purchase credits test
  const { status: sPurchase, data: dPurchase } = await api(
    "POST",
    "/api/credits/purchase",
    {
      amount: 10,
      payment_method: "test_card",
    },
    true,
  );
  if (sPurchase === 200 && dPurchase && dPurchase.success) {
    log(
      "QA-Purchase",
      "PASS",
      "POST /api/credits/purchase",
      `amount=${dPurchase.amount}`,
    );
  } else {
    log(
      "QA-Purchase",
      "FAIL",
      "POST /api/credits/purchase",
      `status=${sPurchase}`,
    );
    reportBug(
      "QA-Purchase",
      "POST",
      "/api/credits/purchase",
      "valid body",
      "200",
      `${sPurchase}`,
      "major",
      "backend",
    );
  }

  // Purchase invalid
  const { status: sPInv } = await api(
    "POST",
    "/api/credits/purchase",
    {
      amount: -5,
    },
    true,
  );
  if (sPInv === 400) {
    log(
      "QA-PurchaseInv",
      "PASS",
      "POST /api/credits/purchase (invalid)",
      "status=400",
    );
  } else {
    log(
      "QA-PurchaseInv",
      "FAIL",
      "POST /api/credits/purchase (invalid)",
      `expected 400, got ${sPInv}`,
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 6: GENERATIONS
// ═══════════════════════════════════════════════════════════════════════
let createdGenerationId = "";
async function testGenerations() {
  console.log("\n══════════════════════════════════");
  console.log("PHASE 6: GENERATIONS");
  console.log("══════════════════════════════════");

  // Make sure we have enough credits
  await supabaseAdmin("PATCH", `/rest/v1/profiles?id=eq.${USER_ID}`, {
    credits: 100,
  });

  // We need a valid model_id and garment_id
  if (!createdModelId || !testGarmentId) {
    log(
      "QA-49",
      "SKIP",
      "POST /api/generations",
      "Need model and garment first",
    );
    return;
  }

  // Get balance before
  const { data: balBefore } = await api("GET", "/api/credits", null, true);
  const creditsBefore = balBefore?.credits ?? 0;

  // QA-49: POST /api/generations
  const { status: s49, data: d49 } = await api(
    "POST",
    "/api/generations",
    {
      model_id: createdModelId,
      garment_id: testGarmentId,
      config: { location: "studio", pose: "standing", lighting: "natural" },
      output_type: "image",
    },
    true,
  );
  if (s49 === 201 && d49 && d49.id) {
    createdGenerationId = d49.id;
    log(
      "QA-49",
      "PASS",
      "POST /api/generations",
      `id=${d49.id}, status=${d49.status}`,
    );
  } else {
    log(
      "QA-49",
      "FAIL",
      "POST /api/generations",
      `status=${s49}, data=${JSON.stringify(d49)}`,
    );
    reportBug(
      "QA-49",
      "POST",
      "/api/generations",
      "valid body",
      "201",
      `${s49}`,
      "major",
      "backend",
    );
  }

  // QA-50: Verify credits debited
  const { data: balAfter } = await api("GET", "/api/credits", null, true);
  const creditsAfter = balAfter?.credits ?? 0;
  if (creditsBefore - creditsAfter === 5) {
    log(
      "QA-50",
      "PASS",
      "Credits debited",
      `before=${creditsBefore}, after=${creditsAfter}, diff=5`,
    );
  } else {
    log(
      "QA-50",
      "FAIL",
      "Credits debited",
      `before=${creditsBefore}, after=${creditsAfter}, expected diff=5`,
    );
    reportBug(
      "QA-50",
      "-",
      "credits",
      "-",
      "debit 5",
      `diff=${creditsBefore - creditsAfter}`,
      "critical",
      "backend",
    );
  }

  // QA-56: POST /api/generations no auth
  const { status: s56 } = await api(
    "POST",
    "/api/generations",
    {
      model_id: createdModelId,
      garment_id: testGarmentId,
    },
    false,
  );
  if (s56 === 401) {
    log("QA-56", "PASS", "POST /api/generations (no auth)", "status=401");
  } else {
    log(
      "QA-56",
      "FAIL",
      "POST /api/generations (no auth)",
      `expected 401, got ${s56}`,
    );
    reportBug(
      "QA-56",
      "POST",
      "/api/generations",
      "no auth",
      "401",
      `${s56}`,
      "critical",
      "backend",
    );
  }

  // QA-54: POST /api/generations invalid model_id
  const { status: s54 } = await api(
    "POST",
    "/api/generations",
    {
      model_id: "not-a-uuid",
      garment_id: testGarmentId,
    },
    true,
  );
  if (s54 === 400) {
    log("QA-54", "PASS", "POST /api/generations (bad model_id)", "status=400");
  } else {
    log(
      "QA-54",
      "FAIL",
      "POST /api/generations (bad model_id)",
      `expected 400, got ${s54}`,
    );
    reportBug(
      "QA-54",
      "POST",
      "/api/generations",
      "invalid model_id",
      "400",
      `${s54}`,
      "major",
      "backend",
    );
  }

  // QA-59: GET /api/generations
  const { status: s59, data: d59 } = await api(
    "GET",
    "/api/generations",
    null,
    true,
  );
  if (s59 === 200 && d59 && "data" in d59) {
    log("QA-59", "PASS", "GET /api/generations", `total=${d59.total}`);
  } else {
    log("QA-59", "FAIL", "GET /api/generations", `status=${s59}`);
    reportBug(
      "QA-59",
      "GET",
      "/api/generations",
      "-",
      "200 + paginated",
      `${s59}`,
      "major",
      "backend",
    );
  }

  // QA-60: GET /api/generations/[id]
  if (createdGenerationId) {
    const { status: s60, data: d60 } = await api(
      "GET",
      `/api/generations/${createdGenerationId}`,
      null,
      true,
    );
    if (s60 === 200 && d60) {
      log("QA-60", "PASS", "GET /api/generations/[id]", `status=${d60.status}`);
    } else {
      log("QA-60", "FAIL", "GET /api/generations/[id]", `status=${s60}`);
      reportBug(
        "QA-60",
        "GET",
        `/api/generations/${createdGenerationId}`,
        "-",
        "200",
        `${s60}`,
        "major",
        "backend",
      );
    }
  }

  // QA-61: GET /api/generations/[id] other user -> 404
  const { status: s61 } = await api(
    "GET",
    "/api/generations/00000000-0000-0000-0000-000000000001",
    null,
    true,
  );
  if (s61 === 404) {
    log(
      "QA-61",
      "PASS",
      "GET /api/generations/[id] (other user)",
      "status=404",
    );
  } else {
    log(
      "QA-61",
      "FAIL",
      "GET /api/generations/[id] (other user)",
      `expected 404, got ${s61}`,
    );
    reportBug(
      "QA-61",
      "GET",
      "/api/generations/fake",
      "other user",
      "404",
      `${s61}`,
      "critical",
      "backend",
    );
  }

  // QA-53: POST /api/generations with 0 credits
  await supabaseAdmin("PATCH", `/rest/v1/profiles?id=eq.${USER_ID}`, {
    credits: 0,
  });
  const { status: s53 } = await api(
    "POST",
    "/api/generations",
    {
      model_id: createdModelId,
      garment_id: testGarmentId,
    },
    true,
  );
  if (s53 === 402) {
    log("QA-53", "PASS", "POST /api/generations (0 credits)", "status=402");
  } else {
    log(
      "QA-53",
      "FAIL",
      "POST /api/generations (0 credits)",
      `expected 402, got ${s53}`,
    );
    reportBug(
      "QA-53",
      "POST",
      "/api/generations",
      "0 credits",
      "402",
      `${s53}`,
      "critical",
      "backend",
    );
  }

  // Restore credits
  await supabaseAdmin("PATCH", `/rest/v1/profiles?id=eq.${USER_ID}`, {
    credits: 100,
  });
}

// ═══════════════════════════════════════════════════════════════════════
// PHASE 7: MULTI-ANGLE
// ═══════════════════════════════════════════════════════════════════════
async function testMultiAngle() {
  console.log("\n══════════════════════════════════");
  console.log("PHASE 7: MULTI-ANGLE");
  console.log("══════════════════════════════════");

  if (!createdGenerationId) {
    log(
      "QA-62",
      "SKIP",
      "POST /api/generations/[id]/multi-angle",
      "No generation created",
    );
    return;
  }

  // Get balance before
  const { data: balBefore } = await api("GET", "/api/credits", null, true);
  const creditsBefore = balBefore?.credits ?? 0;

  // QA-62: POST multi-angle
  const { status: s62, data: d62 } = await api(
    "POST",
    `/api/generations/${createdGenerationId}/multi-angle`,
    {},
    true,
  );
  if (s62 === 201 && d62) {
    log("QA-62", "PASS", "POST multi-angle", `id=${d62.id}`);

    // QA-63: parent_id set
    if (d62.parent_id === createdGenerationId) {
      log("QA-63", "PASS", "parent_id set", `parent_id=${d62.parent_id}`);
    } else {
      log(
        "QA-63",
        "FAIL",
        "parent_id set",
        `expected ${createdGenerationId}, got ${d62.parent_id}`,
      );
    }

    // QA-64: 15 credits debited
    const { data: balAfter } = await api("GET", "/api/credits", null, true);
    const creditsAfter = balAfter?.credits ?? 0;
    if (creditsBefore - creditsAfter === 15) {
      log(
        "QA-64",
        "PASS",
        "15 credits debited",
        `before=${creditsBefore}, after=${creditsAfter}`,
      );
    } else {
      log(
        "QA-64",
        "FAIL",
        "15 credits debited",
        `diff=${creditsBefore - creditsAfter}`,
      );
      reportBug(
        "QA-64",
        "-",
        "credits",
        "-",
        "debit 15",
        `diff=${creditsBefore - creditsAfter}`,
        "critical",
        "backend",
      );
    }
  } else {
    log(
      "QA-62",
      "FAIL",
      "POST multi-angle",
      `status=${s62}, data=${JSON.stringify(d62)}`,
    );
    reportBug(
      "QA-62",
      "POST",
      `/api/generations/${createdGenerationId}/multi-angle`,
      "-",
      "201",
      `${s62}`,
      "major",
      "backend",
    );
  }

  // QA-66: multi-angle insufficient credits
  await supabaseAdmin("PATCH", `/rest/v1/profiles?id=eq.${USER_ID}`, {
    credits: 0,
  });
  const { status: s66 } = await api(
    "POST",
    `/api/generations/${createdGenerationId}/multi-angle`,
    {},
    true,
  );
  if (s66 === 402) {
    log("QA-66", "PASS", "POST multi-angle (0 credits)", "status=402");
  } else {
    log(
      "QA-66",
      "FAIL",
      "POST multi-angle (0 credits)",
      `expected 402, got ${s66}`,
    );
    reportBug(
      "QA-66",
      "-",
      "multi-angle",
      "0 credits",
      "402",
      `${s66}`,
      "critical",
      "backend",
    );
  }

  // Restore
  await supabaseAdmin("PATCH", `/rest/v1/profiles?id=eq.${USER_ID}`, {
    credits: 100,
  });

  // QA-67: multi-angle other user's generation -> 404
  const { status: s67 } = await api(
    "POST",
    "/api/generations/00000000-0000-0000-0000-000000000001/multi-angle",
    {},
    true,
  );
  if (s67 === 404) {
    log("QA-67", "PASS", "POST multi-angle (other user)", "status=404");
  } else {
    log(
      "QA-67",
      "FAIL",
      "POST multi-angle (other user)",
      `expected 404, got ${s67}`,
    );
    reportBug(
      "QA-67",
      "POST",
      "multi-angle/fake",
      "other user",
      "404",
      `${s67}`,
      "critical",
      "backend",
    );
  }

  // QA-68: multi-angle no auth
  const { status: s68 } = await api(
    "POST",
    `/api/generations/${createdGenerationId}/multi-angle`,
    {},
    false,
  );
  if (s68 === 401) {
    log("QA-68", "PASS", "POST multi-angle (no auth)", "status=401");
  } else {
    log(
      "QA-68",
      "FAIL",
      "POST multi-angle (no auth)",
      `expected 401, got ${s68}`,
    );
    reportBug(
      "QA-68",
      "POST",
      "multi-angle",
      "no auth",
      "401",
      `${s68}`,
      "critical",
      "backend",
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════
// CLEANUP
// ═══════════════════════════════════════════════════════════════════════
async function cleanup() {
  console.log("\n══════════════════════════════════");
  console.log("CLEANUP");
  console.log("══════════════════════════════════");

  // 1. Clean up credit ledger entries FIRST (FK to generations)
  await supabaseAdmin("DELETE", `/rest/v1/credit_ledger?user_id=eq.${USER_ID}`);
  console.log("🧹 Cleaned up credit ledger");

  // 2. Delete generated_outputs for user's generations (FK to generations)
  const genListResp = await fetch(
    `${SUPABASE_URL}/rest/v1/generations?user_id=eq.${USER_ID}&select=id`,
    {
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` },
    },
  );
  const genList = await genListResp.json();
  if (Array.isArray(genList) && genList.length > 0) {
    const genIds = genList.map((g) => g.id).join(",");
    await supabaseAdmin(
      "DELETE",
      `/rest/v1/generated_outputs?generation_id=in.(${genIds})`,
    );
  }
  console.log("🧹 Cleaned up generated outputs");

  // 3. Delete test generations (FK to garments/models)
  if (createdGenerationId) {
    await supabaseAdmin(
      "DELETE",
      `/rest/v1/generations?parent_id=eq.${createdGenerationId}`,
    );
    await supabaseAdmin(
      "DELETE",
      `/rest/v1/generations?id=eq.${createdGenerationId}`,
    );
  }
  await supabaseAdmin("DELETE", `/rest/v1/generations?user_id=eq.${USER_ID}`);
  console.log("🧹 Cleaned up test generations");

  // 4. Delete test garment via API (now safe — no FK references)
  if (testGarmentId) {
    const { status } = await api(
      "DELETE",
      `/api/garments/${testGarmentId}`,
      null,
      true,
    );
    log(
      "QA-37",
      status === 200 ? "PASS" : "FAIL",
      "DELETE /api/garments/[id]",
      `status=${status}`,
    );

    // QA-38: verify deleted
    const { status: s38 } = await api(
      "GET",
      `/api/garments/${testGarmentId}`,
      null,
      true,
    );
    if (s38 === 404) {
      log("QA-38", "PASS", "Garment deleted verification", "status=404");
    } else {
      log(
        "QA-38",
        "FAIL",
        "Garment deleted verification",
        `expected 404, got ${s38}`,
      );
    }
  }

  // 5. Delete test model via API (QA-20) (now safe)
  if (createdModelId) {
    const { status } = await api(
      "DELETE",
      `/api/models/${createdModelId}`,
      null,
      true,
    );
    log(
      "QA-20",
      status === 200 ? "PASS" : "FAIL",
      "DELETE /api/models/[id]",
      `status=${status}`,
    );

    // QA-23: verify deleted
    const { status: s23 } = await api(
      "GET",
      `/api/models/${createdModelId}`,
      null,
      true,
    );
    if (s23 === 404) {
      log("QA-23", "PASS", "Model deleted verification", "status=404");
    } else {
      log(
        "QA-23",
        "FAIL",
        "Model deleted verification",
        `expected 404, got ${s23}`,
      );
    }
  }

  // Restore credits
  await supabaseAdmin("PATCH", `/rest/v1/profiles?id=eq.${USER_ID}`, {
    credits: 10,
  });
  console.log("🧹 Reset credits to 10");
}

// ═══════════════════════════════════════════════════════════════════════
// SUMMARY
// ═══════════════════════════════════════════════════════════════════════
function printSummary() {
  console.log("\n══════════════════════════════════════════════════════");
  console.log("                    QA SUMMARY                      ");
  console.log("══════════════════════════════════════════════════════");
  console.log(`Total:   ${results.length}`);
  console.log(`Passed:  ${passed}`);
  console.log(`Failed:  ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log("");

  if (bugs.length > 0) {
    console.log("══════════════════════════════════════════════════════");
    console.log("                    BUG REPORTS                      ");
    console.log("══════════════════════════════════════════════════════");
    for (const b of bugs) {
      console.log(`FAIL: ${b.id}`);
      console.log(`  Endpoint: ${b.method} ${b.path}`);
      console.log(`  Input: ${b.input}`);
      console.log(`  Expected: ${b.expected}`);
      console.log(`  Actual: ${b.actual}`);
      console.log(`  Severity: ${b.severity}`);
      console.log(`  Owner: ${b.owner}`);
      console.log("");
    }
  } else {
    console.log("🎉 No bugs found!");
  }
}

// ═══════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════
async function main() {
  console.log("🚀 FASHIA QA Test Suite Starting...");
  console.log(`   App URL: ${APP_URL}`);
  console.log(`   Supabase: ${SUPABASE_URL}`);

  await getJWT();
  await ensureProfile();

  await testProfiles();
  await testModels();
  await testGarments();
  await testGallery();
  await testCredits();
  await testGenerations();
  await testMultiAngle();
  await cleanup();

  printSummary();
}

main().catch((err) => {
  console.error("💥 Test suite crashed:", err);
  process.exit(1);
});
