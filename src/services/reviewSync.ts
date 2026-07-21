import type { ReviewLesson } from "../types/review";

export interface SyncedReferenceImageState {
  url: string;
  title: string;
  cursor: number;
  displayMode?: "emoji" | "image";
}

export interface ReviewSyncPayload {
  contentVersion: number;
  lessons: ReviewLesson[];
  referenceImages: Record<string, SyncedReferenceImageState>;
}

export interface RemoteReviewState {
  revision: number;
  updatedAt: string;
  payload: ReviewSyncPayload | null;
}

export type ReviewSyncErrorCode = "unauthorized" | "conflict" | "unavailable" | "invalid";

export class ReviewSyncError extends Error {
  code: ReviewSyncErrorCode;
  remoteState?: RemoteReviewState;

  constructor(code: ReviewSyncErrorCode, message: string, remoteState?: RemoteReviewState) {
    super(message);
    this.name = "ReviewSyncError";
    this.code = code;
    this.remoteState = remoteState;
  }
}

interface SaveRemoteReviewStatePayload {
  editCode: string;
  expectedRevision: number;
  payload: ReviewSyncPayload;
}

const configuredReviewStateEndpoint = String(import.meta.env.VITE_REVIEW_SYNC_URL || "").trim();
const reviewStateEndpoint =
  import.meta.env.DEV && configuredReviewStateEndpoint
    ? "/api/review-state"
    : configuredReviewStateEndpoint;
export const reviewEditCodeStorageKey = "vancy-review-edit-code-v1";

export function getStoredReviewEditCode() {
  try {
    return window.localStorage.getItem(reviewEditCodeStorageKey)?.trim() || "";
  } catch {
    return "";
  }
}

export function storeReviewEditCode(editCode: string) {
  try {
    window.localStorage.setItem(reviewEditCodeStorageKey, editCode.trim());
  } catch {}
}

export function clearStoredReviewEditCode() {
  try {
    window.localStorage.removeItem(reviewEditCodeStorageKey);
  } catch {}
}

export async function fetchRemoteReviewState() {
  assertReviewSyncConfigured();
  const response = await fetch(reviewStateEndpoint, {
    headers: { Accept: "application/json" },
    cache: "no-store"
  }).catch(() => {
    throw new ReviewSyncError("unavailable", "云端同步服务暂不可用");
  });

  if (!response.ok) {
    throw new ReviewSyncError("unavailable", "云端同步服务暂不可用");
  }

  return readRemoteReviewState(response);
}

export async function saveRemoteReviewState(payload: SaveRemoteReviewStatePayload) {
  assertReviewSyncConfigured();
  const response = await fetch(reviewStateEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).catch(() => {
    throw new ReviewSyncError("unavailable", "云端同步服务暂不可用");
  });

  if (response.status === 401) {
    throw new ReviewSyncError("unauthorized", "家庭编辑码不正确");
  }

  if (response.status === 409) {
    const remoteState = await readRemoteReviewState(response).catch(() => undefined);
    throw new ReviewSyncError("conflict", "云端数据已更新", remoteState);
  }

  if (response.status === 400) {
    throw new ReviewSyncError("invalid", "同步数据格式不正确");
  }

  if (!response.ok) {
    throw new ReviewSyncError("unavailable", "云端同步服务暂不可用");
  }

  return readRemoteReviewState(response);
}

export function isReviewSyncError(error: unknown): error is ReviewSyncError {
  return error instanceof ReviewSyncError;
}

function assertReviewSyncConfigured() {
  if (!reviewStateEndpoint) {
    throw new ReviewSyncError("unavailable", "尚未配置 Supabase 同步服务");
  }
}

async function readRemoteReviewState(response: Response) {
  try {
    return normalizeRemoteReviewState(await response.json());
  } catch {
    throw new ReviewSyncError("unavailable", "云端同步数据读取失败");
  }
}

function normalizeRemoteReviewState(value: unknown): RemoteReviewState {
  const rawState = isRecord(value) ? value : {};
  return {
    revision: normalizeRevision(rawState.revision),
    updatedAt: typeof rawState.updatedAt === "string" ? rawState.updatedAt : "",
    payload: normalizeReviewSyncPayload(rawState.payload)
  };
}

function normalizeReviewSyncPayload(value: unknown): ReviewSyncPayload | null {
  if (!isRecord(value)) return null;

  return {
    contentVersion: normalizeRevision(value.contentVersion),
    lessons: Array.isArray(value.lessons) ? (value.lessons as ReviewLesson[]) : [],
    referenceImages: normalizeReferenceImages(value.referenceImages)
  };
}

function normalizeReferenceImages(value: unknown) {
  if (!isRecord(value)) return {};

  return Object.entries(value).reduce<Record<string, SyncedReferenceImageState>>(
    (images, [itemId, image]) => {
      if (!isRecord(image)) return images;
      images[itemId] = {
        url: typeof image.url === "string" ? image.url : "",
        title: typeof image.title === "string" ? image.title : "",
        cursor: normalizeRevision(image.cursor),
        displayMode: image.displayMode === "image" ? "image" : "emoji"
      };
      return images;
    },
    {}
  );
}

function normalizeRevision(value: unknown) {
  const revision = Number(value);
  return Number.isFinite(revision) && revision >= 0 ? Math.floor(revision) : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
