import { createClient } from "npm:@supabase/supabase-js@2";

interface ReviewStateRow {
  payload: Record<string, unknown> | null;
  revision: number;
  updated_at: string;
}

const stateId = "default";
const tableName = "review_shared_state";
const defaultAllowedOrigins = [
  "https://mjsong07.github.io",
  "http://127.0.0.1:5173",
  "http://localhost:5173"
];

Deno.serve(async (request) => {
  const responseHeaders = buildResponseHeaders(request);

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: responseHeaders });
  }

  if (request.method !== "GET" && request.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405, responseHeaders);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Supabase service configuration is missing" }, 500, responseHeaders);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  if (request.method === "GET") {
    const state = await readState(supabase);
    return state.error
      ? jsonResponse({ error: state.error }, 500, responseHeaders)
      : jsonResponse(state.value, 200, responseHeaders);
  }

  const reviewEditCode = Deno.env.get("REVIEW_EDIT_CODE");
  if (!reviewEditCode) {
    return jsonResponse({ error: "REVIEW_EDIT_CODE secret is missing" }, 500, responseHeaders);
  }

  const body = await readRequestJson(request);
  if (!isRecord(body) || !isRecord(body.payload)) {
    return jsonResponse({ error: "Invalid review state payload" }, 400, responseHeaders);
  }

  if (!safeEqual(String(body.editCode || ""), reviewEditCode)) {
    return jsonResponse({ error: "Invalid edit code" }, 401, responseHeaders);
  }

  const expectedRevision = normalizeRevision(body.expectedRevision);
  if (expectedRevision === null) {
    return jsonResponse({ error: "Invalid expected revision" }, 400, responseHeaders);
  }

  const nextRevision = expectedRevision + 1;
  const updatedAt = new Date().toISOString();
  const { data, error } = await supabase
    .from(tableName)
    .update({
      payload: body.payload,
      revision: nextRevision,
      updated_at: updatedAt
    })
    .eq("id", stateId)
    .eq("revision", expectedRevision)
    .select("payload, revision, updated_at")
    .maybeSingle<ReviewStateRow>();

  if (error) {
    return jsonResponse({ error: "Failed to save review state" }, 500, responseHeaders);
  }

  if (!data) {
    const currentState = await readState(supabase);
    return currentState.error
      ? jsonResponse({ error: currentState.error }, 500, responseHeaders)
      : jsonResponse(currentState.value, 409, responseHeaders);
  }

  return jsonResponse(toRemoteState(data), 200, responseHeaders);
});

function buildResponseHeaders(request: Request) {
  const configuredOrigins = (Deno.env.get("ALLOWED_ORIGINS") || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const allowedOrigins = new Set([...defaultAllowedOrigins, ...configuredOrigins]);
  const requestOrigin = request.headers.get("Origin") || "";
  const headers: Record<string, string> = {
    "Cache-Control": "no-store",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin"
  };

  if (allowedOrigins.has(requestOrigin)) {
    headers["Access-Control-Allow-Origin"] = requestOrigin;
    headers["Access-Control-Allow-Headers"] = "content-type";
    headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS";
  }

  return headers;
}

async function readState(supabase: ReturnType<typeof createClient>) {
  const { data, error } = await supabase
    .from(tableName)
    .select("payload, revision, updated_at")
    .eq("id", stateId)
    .single<ReviewStateRow>();

  if (error || !data) {
    return { error: "Failed to read review state", value: null };
  }

  return { error: "", value: toRemoteState(data) };
}

function toRemoteState(row: ReviewStateRow) {
  return {
    revision: normalizeRevision(row.revision) || 0,
    updatedAt: row.updated_at || "",
    payload: isRecord(row.payload) ? row.payload : null
  };
}

async function readRequestJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function normalizeRevision(value: unknown) {
  const revision = Number(value);
  if (!Number.isFinite(revision) || revision < 0) return null;
  return Math.floor(revision);
}

function safeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);

  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] || 0) ^ (rightBytes[index] || 0);
  }

  return difference === 0;
}

function jsonResponse(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), { status, headers });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
