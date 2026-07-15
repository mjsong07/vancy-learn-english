interface D1Database {
  prepare(query: string): D1PreparedStatement;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}

interface D1Result {
  success: boolean;
  meta?: {
    changes?: number;
  };
}

interface Env {
  DB?: D1Database;
  REVIEW_EDIT_CODE?: string;
}

interface PagesContext {
  request: Request;
  env: Env;
}

interface ReviewStateRow {
  payload: string;
  revision: number;
  updatedAt: string;
}

const stateId = "default";
const responseHeaders = {
  "Cache-Control": "no-store",
  "Content-Type": "application/json; charset=utf-8"
};

const createTableSql = `
  CREATE TABLE IF NOT EXISTS review_shared_state (
    id TEXT PRIMARY KEY CHECK (id = 'default'),
    payload TEXT NOT NULL,
    revision INTEGER NOT NULL DEFAULT 0,
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`;

export async function onRequestGet(context: PagesContext) {
  const db = getDatabase(context.env);
  if (!db) return jsonResponse({ error: "D1 binding DB is missing" }, 500);

  await ensureTable(db);
  return jsonResponse(await readState(db));
}

export async function onRequestPost(context: PagesContext) {
  const db = getDatabase(context.env);
  if (!db) return jsonResponse({ error: "D1 binding DB is missing" }, 500);
  if (!context.env.REVIEW_EDIT_CODE) {
    return jsonResponse({ error: "REVIEW_EDIT_CODE secret is missing" }, 500);
  }

  const body = await readRequestJson(context.request);
  if (!isRecord(body) || !isRecord(body.payload)) {
    return jsonResponse({ error: "Invalid review state payload" }, 400);
  }

  if (body.editCode !== context.env.REVIEW_EDIT_CODE) {
    return jsonResponse({ error: "Invalid edit code" }, 401);
  }

  const expectedRevision = normalizeRevision(body.expectedRevision);
  if (expectedRevision === null) {
    return jsonResponse({ error: "Invalid expected revision" }, 400);
  }

  await ensureTable(db);

  const currentState = await readState(db);
  if (currentState.revision !== expectedRevision) {
    return jsonResponse(currentState, 409);
  }

  const nextRevision = currentState.revision + 1;
  const payloadText = JSON.stringify(body.payload);
  let writeResult: D1Result;

  try {
    writeResult = currentState.payload
      ? await db
          .prepare(
            `
              UPDATE review_shared_state
              SET payload = ?, revision = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
              WHERE id = ? AND revision = ?
            `
          )
          .bind(payloadText, nextRevision, stateId, currentState.revision)
          .run()
      : await db
          .prepare(
            `
              INSERT INTO review_shared_state (id, payload, revision)
              VALUES (?, ?, ?)
            `
          )
          .bind(stateId, payloadText, nextRevision)
          .run();
  } catch {
    return jsonResponse(await readState(db), 409);
  }

  if (!writeResult.success || writeResult.meta?.changes === 0) {
    return jsonResponse(await readState(db), 409);
  }

  return jsonResponse(await readState(db));
}

async function ensureTable(db: D1Database) {
  await db.prepare(createTableSql).run();
}

async function readState(db: D1Database) {
  const row = await db
    .prepare(
      `
        SELECT payload, revision, updated_at AS updatedAt
        FROM review_shared_state
        WHERE id = ?
      `
    )
    .bind(stateId)
    .first<ReviewStateRow>();

  if (!row) {
    return {
      revision: 0,
      updatedAt: "",
      payload: null
    };
  }

  return {
    revision: normalizeRevision(row.revision) || 0,
    updatedAt: row.updatedAt || "",
    payload: parsePayload(row.payload)
  };
}

async function readRequestJson(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

function parsePayload(payload: string) {
  try {
    return JSON.parse(payload);
  } catch {
    return null;
  }
}

function normalizeRevision(value: unknown) {
  const revision = Number(value);
  if (!Number.isFinite(revision) || revision < 0) return null;
  return Math.floor(revision);
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: responseHeaders
  });
}

function getDatabase(env: Env) {
  return env.DB || null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
