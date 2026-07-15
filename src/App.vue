<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Delete,
  Edit,
  Headset,
  Microphone,
  RefreshLeft,
  Setting,
  SwitchButton
} from "@element-plus/icons-vue";
import { useReviewLessons } from "./composables/useReviewLessons";
import { getSeedDailyContent, reviewContentVersion } from "./data/reviewLessons";
import { getReviewPhonetic } from "./data/reviewPhonetics";
import {
  clearStoredReviewEditCode,
  fetchRemoteReviewState,
  getStoredReviewEditCode,
  isReviewSyncError,
  saveRemoteReviewState,
  storeReviewEditCode
} from "./services/reviewSync";
import { speak } from "./services/speech";
import type { ReviewItem, ReviewLesson } from "./types/review";
import type {
  RemoteReviewState,
  ReviewSyncPayload,
  SyncedReferenceImageState
} from "./services/reviewSync";

const {
  lessons,
  activeLesson,
  activeLessonId,
  activeIndex,
  activeItem,
  progressPercent,
  selectLesson,
  setActiveIndex,
  nextItem,
  previousItem,
  addLesson,
  updateLesson,
  removeItem,
  deleteLesson,
  restoreSeedLessons,
  replaceLessons
} = useReviewLessons();

type SettingsSection = "lessons" | "add" | "learning";
type ReferenceImageStatus = "idle" | "loading" | "error";
type SyncStatus = "idle" | "loading" | "saving" | "offline" | "error" | "conflict";

interface ReferenceImageState {
  url: string;
  title: string;
  cursor: number;
  status: ReferenceImageStatus;
}

interface CommonsImageInfo {
  thumburl?: string;
  url?: string;
  mime?: string;
}

interface CommonsImagePage {
  title?: string;
  imageinfo?: CommonsImageInfo[];
}

interface CommonsImageResponse {
  query?: {
    pages?: Record<string, CommonsImagePage>;
  };
}

const settingsDrawerOpen = ref(false);
const dailyContentDrawerOpen = ref(false);
const settingsSection = ref<SettingsSection>("lessons");
const referenceImageStorageKey = "kid-english-review-reference-images-v1";
const referenceImageStates = reactive<Record<string, ReferenceImageState>>(
  buildReferenceImageStates(readReferenceImageSnapshots())
);
const syncStatus = ref<SyncStatus>("idle");
const syncRevision = ref(0);
const syncUpdatedAt = ref("");
const settingsOptions: Array<{ label: string; value: SettingsSection }> = [
  { label: "复习内容", value: "lessons" },
  { label: "添加复习日", value: "add" },
  { label: "学习设置", value: "learning" }
];
const referenceImageStopWords = new Set([
  "a",
  "an",
  "the",
  "i",
  "am",
  "is",
  "are",
  "see",
  "go",
  "to",
  "do",
  "does",
  "what",
  "we",
  "you",
  "like",
  "have",
  "has",
  "this",
  "that",
  "my",
  "your",
  "need",
  "make",
  "big",
  "small",
  "for",
  "of",
  "in",
  "on"
]);
const referenceSentenceImageStopWords = new Set([
  "a",
  "an",
  "the",
  "i",
  "am",
  "is",
  "are",
  "do",
  "does",
  "what",
  "we",
  "you",
  "this",
  "that",
  "my",
  "your",
  "to",
  "for",
  "of",
  "in",
  "on"
]);
const referenceSentenceImageQueryMap: Array<[RegExp, string]> = [
  [/i see an? x-?ray/i, "person looking at x-ray"],
  [/i have six toys/i, "six toys"],
  [/this is my box/i, "cardboard box"],
  [/the ox is big/i, "large ox animal"],
  [/i like yogurt/i, "child eating yogurt"],
  [/i am tired.*yawn/i, "person yawning tired"],
  [/the yak is big/i, "large yak animal"],
  [/we see a yacht/i, "people on yacht"],
  [/zero is a number/i, "number zero"],
  [/i go to the zoo/i, "children at zoo"],
  [/i see a zebra/i, "person watching zebra"],
  [/i pull my zipper/i, "pulling zipper"],
  [/z is for zero/i, "letter z zero"],
  [/z is for zebra/i, "letter z zebra"],
  [/what fruit do you like/i, "fruit choices"],
  [/i like\s*\.{3}/i, "favorite fruit"],
  [/what do we need to make smoothie/i, "smoothie ingredients"],
  [/we need\s*\.{3}/i, "smoothie ingredients"]
];
const preferredReferenceImageStyles = [
  "illustration",
  "3d illustration",
  "clipart",
  "drawing",
  "cartoon",
  "icon"
];
const fallbackReferenceImageStyles = ["photo", "real life"];
const referenceImageQueryMap: Array<[RegExp, string]> = [
  [/pineapple|菠萝/i, "pineapple fruit"],
  [/\bapple\b|苹果/i, "apple fruit"],
  [/\bpear\b|梨/i, "pear fruit"],
  [/\borange\b|橘子/i, "orange fruit"],
  [/watermelon|西瓜/i, "watermelon fruit"],
  [/dragon fruit|火龙果/i, "dragon fruit"],
  [/mango|芒果/i, "mango fruit"],
  [/kiwi|奇异果/i, "kiwifruit"],
  [/smoothie|冰沙/i, "fruit smoothie"],
  [/ice cube|冰块/i, "ice cube"],
  [/sugar|糖/i, "sugar"],
  [/syrup|糖浆/i, "syrup"],
  [/blender|搅拌机/i, "kitchen blender"],
  [/\bcup\b|杯子/i, "drinking cup"],
  [/straw|吸管/i, "drinking straw"],
  [/x-ray|x ray|x光/i, "x-ray radiograph"],
  [/\bsix\b|六/i, "number six"],
  [/\bbox\b|盒子|箱子/i, "cardboard box"],
  [/\box\b|公牛/i, "ox animal"],
  [/yogurt|酸奶酪|酸奶/i, "yogurt food"],
  [/yawn|打哈欠/i, "yawning"],
  [/\byak\b|牦牛/i, "yak animal"],
  [/yacht|游艇/i, "yacht boat"],
  [/zero|数字 0|数字0/i, "number zero"],
  [/\bzoo\b|动物园/i, "zoo animals"],
  [/zebra|斑马/i, "zebra animal"],
  [/zipper|拉链/i, "zipper"],
  [/letter|字母/i, "alphabet letters"]
];
const spellingPreferenceKey = "vancy-review-show-spelling";
const studyModeRepeatCountKey = "vancy-study-mode-repeat-count";
const studyModeIntervalSecondsKey = "vancy-study-mode-interval-seconds";
const showSpelling = ref(window.localStorage.getItem(spellingPreferenceKey) === "true");
const studyModeRepeatCount = ref(readNumberSetting(studyModeRepeatCountKey, 3, 1, 10));
const studyModeIntervalSeconds = ref(
  readNumberSetting(studyModeIntervalSecondsKey, 2, 0.5, 10)
);
const isStudyModeActive = ref(false);
let studyModeRunId = 0;
let studyModeTimer: number | null = null;
let resolveStudyModeDelay: (() => void) | null = null;

function normalizeNumberSetting(value: unknown, fallback: number, min: number, max: number) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue)) return fallback;
  return Math.min(max, Math.max(min, nextValue));
}

function readNumberSetting(key: string, fallback: number, min: number, max: number) {
  return normalizeNumberSetting(window.localStorage.getItem(key), fallback, min, max);
}

watch(
  referenceImageStates,
  () => {
    persistReferenceImageSnapshots();
  },
  { deep: true }
);

watch(showSpelling, (value) => {
  window.localStorage.setItem(spellingPreferenceKey, String(value));
});

watch(studyModeRepeatCount, (value) => {
  const nextValue = Math.round(normalizeNumberSetting(value, 3, 1, 10));
  if (nextValue !== value) {
    studyModeRepeatCount.value = nextValue;
    return;
  }

  window.localStorage.setItem(studyModeRepeatCountKey, String(nextValue));
});

watch(studyModeIntervalSeconds, (value) => {
  const nextValue = normalizeNumberSetting(value, 2, 0.5, 10);
  if (nextValue !== value) {
    studyModeIntervalSeconds.value = nextValue;
    return;
  }

  window.localStorage.setItem(studyModeIntervalSecondsKey, String(nextValue));
});

const lessonForm = reactive({
  generatedContent: "",
  teacherText: ""
});
const lessonEditorOpen = ref(false);
const lessonEditorForm = reactive({
  lessonId: "",
  title: "",
  generatedContent: "",
  teacherText: ""
});

onMounted(() => {
  void loadRemoteReviewState({ silent: true });
});

const currentLetters = computed(() => {
  const item = activeItem.value;
  if (!item || item.category !== "word") return [];

  const letters = item.english.replace(/[^A-Za-z]/g, "");
  if (letters.length < 2 || letters.length > 12) return [];

  return letters.split("").map((letter) => ({
    letter,
    vowel: /[aeiou]/i.test(letter)
  }));
});

const currentCardSubtitle = computed(() => {
  const item = activeItem.value;
  if (!item) return "";
  if (item.chinese) return item.chinese;
  if (item.note) return item.note;
  return activeLesson.value?.theme || "";
});

const currentItemType = computed(() => {
  if (activeItem.value?.category === "letter") return "Letter";
  if (activeItem.value?.category === "sentence") return "Sentence";
  return "Word";
});

const currentTitleFontSize = computed(() => {
  const length = activeItem.value?.english.trim().length || 1;
  const fittedSize = Math.floor(600 / length);
  return `${Math.min(43, Math.max(12, fittedSize))}px`;
});

const currentPhonetic = computed(() => {
  if (activeItem.value?.category !== "word") return "";
  return getReviewPhonetic(activeItem.value.english);
});

const currentPhoneticFontSize = computed(() => {
  const length = currentPhonetic.value.length || 1;
  const fittedSize = Math.floor(190 / length);
  return `${Math.min(13, Math.max(10, fittedSize))}px`;
});

const currentReferenceImageState = computed(() => {
  const item = activeItem.value;
  return item ? getReferenceImageState(item.id) : null;
});

const currentReferenceImageUrl = computed(() => currentReferenceImageState.value?.url || "");

const currentReferenceImageTitle = computed(() => currentReferenceImageState.value?.title || "");

const isReferenceImageLoading = computed(
  () => currentReferenceImageState.value?.status === "loading"
);

const isSyncBusy = computed(() => syncStatus.value === "loading" || syncStatus.value === "saving");

const syncStatusLabel = computed(() => {
  if (syncStatus.value === "loading") return "正在同步";
  if (syncStatus.value === "saving") return "正在保存";
  if (syncStatus.value === "offline") return "离线缓存";
  if (syncStatus.value === "conflict") return "需要重新同步";
  if (syncStatus.value === "error") return "同步失败";
  return syncRevision.value > 0 ? "已连接" : "待初始化";
});

const syncStatusDetail = computed(() => {
  if (syncStatus.value === "offline") return "云端暂时不可用，本机数据仍可继续使用";
  if (syncStatus.value === "conflict") return "云端已有新版本，先同步后再保存";
  if (syncUpdatedAt.value) return `版本 ${syncRevision.value} · ${formatSyncTime(syncUpdatedAt.value)}`;
  return "首次保存后会初始化 Supabase 云端数据";
});

const activeDailyContent = computed(() => {
  const lesson = activeLesson.value;
  if (!lesson) return "暂无今日学习内容。";
  return (
    lesson.teacherText?.trim() ||
    getSeedDailyContent(lesson.id) ||
    "暂无老师发来的内容。"
  );
});

const currentLearningItems = computed(() => {
  const lesson = activeLesson.value;
  if (!lesson) return [];
  return lesson.items.filter((item) => item.category === "word" || item.category === "sentence");
});

function isPlayableReviewItem(item: ReviewItem | null) {
  return item?.category === "word" || item?.category === "sentence";
}

function speakActiveItem() {
  if (!activeItem.value) return;
  return speakReviewText(activeItem.value.english, activeItem.value.category === "sentence");
}

function speakReviewText(text: string, slow = false) {
  return speak(text, {
    pitch: 1.12,
    rate: slow ? 0.7 : 0.78
  });
}

function readReferenceImageSnapshots() {
  try {
    const rawValue = window.localStorage.getItem(referenceImageStorageKey);
    return rawValue
      ? (JSON.parse(rawValue) as Record<string, SyncedReferenceImageState>)
      : {};
  } catch {
    return {};
  }
}

function buildReferenceImageStates(snapshots: Record<string, SyncedReferenceImageState>) {
  return Object.entries(snapshots).reduce<Record<string, ReferenceImageState>>(
    (states, [itemId, snapshot]) => {
      states[itemId] = {
        url: snapshot.url || "",
        title: snapshot.title || "",
        cursor: Number.isFinite(Number(snapshot.cursor)) ? Number(snapshot.cursor) : 0,
        status: "idle"
      };
      return states;
    },
    {}
  );
}

function serializeReferenceImageSnapshots() {
  return Object.entries(referenceImageStates).reduce<Record<string, SyncedReferenceImageState>>(
    (snapshots, [itemId, state]) => {
      if (!state.url && !state.title && !state.cursor) return snapshots;
      snapshots[itemId] = {
        url: state.url,
        title: state.title,
        cursor: state.cursor
      };
      return snapshots;
    },
    {}
  );
}

function persistReferenceImageSnapshots() {
  try {
    window.localStorage.setItem(
      referenceImageStorageKey,
      JSON.stringify(serializeReferenceImageSnapshots())
    );
  } catch {}
}

function applyReferenceImageSnapshots(snapshots: Record<string, SyncedReferenceImageState>) {
  Object.keys(referenceImageStates).forEach((itemId) => {
    delete referenceImageStates[itemId];
  });

  Object.entries(buildReferenceImageStates(snapshots)).forEach(([itemId, state]) => {
    referenceImageStates[itemId] = state;
  });
  persistReferenceImageSnapshots();
}

function buildReviewSyncPayload(): ReviewSyncPayload {
  return {
    contentVersion: reviewContentVersion,
    lessons: cloneReviewLessons(lessons.value),
    referenceImages: serializeReferenceImageSnapshots()
  };
}

function cloneReviewLessons(sourceLessons: ReviewLesson[]) {
  return JSON.parse(JSON.stringify(sourceLessons)) as ReviewLesson[];
}

function applyRemoteReviewState(remoteState: RemoteReviewState) {
  syncRevision.value = remoteState.revision;
  syncUpdatedAt.value = remoteState.updatedAt;

  if (!remoteState.payload) return;

  replaceLessons(remoteState.payload.lessons);
  applyReferenceImageSnapshots(remoteState.payload.referenceImages || {});
}

async function loadRemoteReviewState(options: { silent?: boolean } = {}) {
  syncStatus.value = "loading";

  try {
    const remoteState = await fetchRemoteReviewState();
    applyRemoteReviewState(remoteState);
    syncStatus.value = "idle";

    if (!remoteState.payload && (!options.silent || getStoredReviewEditCode())) {
      await saveCurrentReviewState(
        "已用本机数据初始化云端",
        "云端暂无数据，本机数据暂未同步"
      );
      return;
    }

    if (!options.silent) {
      ElMessage.success("已同步云端最新数据");
    }
  } catch {
    syncStatus.value = "offline";
    if (!options.silent) {
      ElMessage.warning("云端同步暂不可用，本机缓存可继续使用");
    }
  }
}

async function saveCurrentReviewState(successMessage: string, fallbackMessage: string) {
  const editCode = await getReviewEditCode();
  if (!editCode) {
    syncStatus.value = "error";
    ElMessage.warning(fallbackMessage);
    return false;
  }

  syncStatus.value = "saving";

  try {
    const remoteState = await saveRemoteReviewState({
      editCode,
      expectedRevision: syncRevision.value,
      payload: buildReviewSyncPayload()
    });
    storeReviewEditCode(editCode);
    applyRemoteReviewState(remoteState);
    syncStatus.value = "idle";
    ElMessage.success(successMessage);
    return true;
  } catch (error) {
    handleReviewSyncError(error, fallbackMessage);
    return false;
  }
}

async function getReviewEditCode() {
  const storedEditCode = getStoredReviewEditCode();
  if (storedEditCode) return storedEditCode;

  try {
    const result = await ElMessageBox.prompt(
      "请输入 Supabase Edge Function 中配置的家庭编辑码。",
      "云端保存",
      {
        confirmButtonText: "保存",
        cancelButtonText: "取消",
        inputType: "password",
        inputPattern: /\S+/,
        inputErrorMessage: "请输入家庭编辑码"
      }
    );
    const editCode = String(result.value || "").trim();
    if (editCode) storeReviewEditCode(editCode);
    return editCode;
  } catch {
    return "";
  }
}

function handleReviewSyncError(error: unknown, fallbackMessage: string) {
  if (!isReviewSyncError(error)) {
    syncStatus.value = "offline";
    ElMessage.warning(fallbackMessage);
    return;
  }

  if (error.code === "unauthorized") {
    clearStoredReviewEditCode();
    syncStatus.value = "error";
    ElMessage.error("家庭编辑码不正确，本机改动已保留但没有同步到云端");
    return;
  }

  if (error.code === "conflict") {
    syncStatus.value = "conflict";
    syncUpdatedAt.value = error.remoteState?.updatedAt || syncUpdatedAt.value;
    ElMessage.warning("云端已有新版本，本机改动已保留；请先同步云端后再保存");
    return;
  }

  syncStatus.value = "offline";
  ElMessage.warning(fallbackMessage);
}

function formatSyncTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function getReferenceImageState(itemId: string) {
  if (!referenceImageStates[itemId]) {
    referenceImageStates[itemId] = {
      url: "",
      title: "",
      cursor: 0,
      status: "idle"
    };
  }

  return referenceImageStates[itemId];
}

function getReferenceImageQuery(item: ReviewItem) {
  if (item.category === "sentence") {
    const sentenceQuery = getSentenceReferenceImageQuery(item);
    if (sentenceQuery) return sentenceQuery;
  }

  const sourceText = `${item.english} ${item.chinese} ${item.note || ""}`;
  const mappedQuery = referenceImageQueryMap.find(([pattern]) => pattern.test(sourceText))?.[1];
  if (mappedQuery) return mappedQuery;

  const words = getReferenceImageWords(item.english, referenceImageStopWords);
  if (words.length) return words.slice(0, 3).join(" ");
  return item.category === "letter" ? "alphabet letters" : "english vocabulary object";
}

function getSentenceReferenceImageQuery(item: ReviewItem) {
  const sourceText = `${item.english} ${item.chinese} ${item.note || ""}`;
  const mappedQuery = referenceSentenceImageQueryMap.find(([pattern]) =>
    pattern.test(sourceText)
  )?.[1];
  if (mappedQuery) return mappedQuery;

  const words = getReferenceImageWords(item.english, referenceSentenceImageStopWords);
  return words.slice(0, 5).join(" ");
}

function getReferenceImageWords(text: string, stopWords: Set<string>) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !stopWords.has(word));
}

function getReferenceImageSearchQueries(item: ReviewItem) {
  const baseQuery = getReferenceImageQuery(item);
  const preferredQueries = preferredReferenceImageStyles.map((style) => `${baseQuery} ${style}`);
  const fallbackQueries = fallbackReferenceImageStyles.map((style) => `${baseQuery} ${style}`);
  return Array.from(new Set([...preferredQueries, ...fallbackQueries, baseQuery]));
}

function buildCommonsSearchUrl(query: string, cursor: number) {
  const searchUrl = new URL("https://commons.wikimedia.org/w/api.php");
  searchUrl.searchParams.set("origin", "*");
  searchUrl.searchParams.set("action", "query");
  searchUrl.searchParams.set("format", "json");
  searchUrl.searchParams.set("generator", "search");
  searchUrl.searchParams.set("gsrnamespace", "6");
  searchUrl.searchParams.set("gsrsearch", query);
  searchUrl.searchParams.set("gsrlimit", "12");
  searchUrl.searchParams.set("gsroffset", String((cursor % 8) * 12));
  searchUrl.searchParams.set("prop", "imageinfo");
  searchUrl.searchParams.set("iiprop", "url|mime");
  searchUrl.searchParams.set("iiurlwidth", "640");
  return searchUrl.toString();
}

async function fetchReferenceImages(item: ReviewItem, cursor: number) {
  for (const query of getReferenceImageSearchQueries(item)) {
    const images = await fetchCommonsReferenceImages(query, item.english, cursor);
    if (images.length) return images;
  }

  return [];
}

async function fetchCommonsReferenceImages(query: string, fallbackTitle: string, cursor: number) {
  const response = await fetch(buildCommonsSearchUrl(query, cursor));
  if (!response.ok) throw new Error("Reference image request failed");

  const payload = (await response.json()) as CommonsImageResponse;
  return Object.values(payload.query?.pages || {})
    .map((page) => ({
      title: page.title?.replace(/^File:/i, "") || fallbackTitle,
      info: page.imageinfo?.[0]
    }))
    .filter(({ info }) => {
      if (!info?.mime?.startsWith("image/")) return false;
      if (/svg/i.test(info.mime) && !info.thumburl) return false;
      return Boolean(info.thumburl || info.url);
    });
}

function preloadReferenceImage(src: string) {
  return new Promise<void>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Reference image preload failed"));
    image.src = src;
  });
}

async function refreshReferenceImage() {
  const item = activeItem.value;
  if (!item) return;

  const state = getReferenceImageState(item.id);
  if (state.status === "loading") return;

  const currentCursor = state.cursor;
  state.cursor = currentCursor + 1;
  state.status = "loading";

  try {
    let images = await fetchReferenceImages(item, currentCursor);
    if (!images.length && currentCursor > 0) {
      images = await fetchReferenceImages(item, 0);
    }

    const selectedImage = images[currentCursor % images.length];
    const imageUrl = selectedImage?.info?.thumburl || selectedImage?.info?.url;
    if (!imageUrl) throw new Error("No reference image found");

    await preloadReferenceImage(imageUrl);
    state.url = imageUrl;
    state.title = selectedImage.title;
    state.status = "idle";
    await saveCurrentReviewState("参考图片已同步", "参考图片已更新，本机暂存但云端未同步");
  } catch {
    state.status = "error";
    ElMessage.warning("参考图片下载失败，请稍后再试");
  }
}

function waitForStudyMode(ms: number, runId: number) {
  return new Promise<void>((resolve) => {
    resolveStudyModeDelay = resolve;
    studyModeTimer = window.setTimeout(() => {
      if (studyModeTimer !== null) {
        window.clearTimeout(studyModeTimer);
        studyModeTimer = null;
      }
      resolveStudyModeDelay = null;
      if (runId === studyModeRunId) {
        resolve();
      }
    }, ms);
  });
}

function stopStudyMode() {
  isStudyModeActive.value = false;
  studyModeRunId += 1;
  if (studyModeTimer !== null) {
    window.clearTimeout(studyModeTimer);
    studyModeTimer = null;
  }
  resolveStudyModeDelay?.();
  resolveStudyModeDelay = null;
  window.speechSynthesis?.cancel();
}

async function runStudyMode(runId: number) {
  const totalItems = activeLesson.value?.items.length || 0;

  for (let itemOffset = 0; itemOffset < totalItems; itemOffset += 1) {
    if (!isStudyModeActive.value || runId !== studyModeRunId) return;

    const item = activeItem.value;
    if (isPlayableReviewItem(item)) {
      for (let repeatIndex = 0; repeatIndex < studyModeRepeatCount.value; repeatIndex += 1) {
        if (!isStudyModeActive.value || runId !== studyModeRunId) return;

        await speakReviewText(item.english, item.category === "sentence");
        if (repeatIndex < studyModeRepeatCount.value - 1) {
          await waitForStudyMode(studyModeIntervalSeconds.value * 1000, runId);
        }
      }
    }

    if (!isStudyModeActive.value || runId !== studyModeRunId) return;
    if (itemOffset < totalItems - 1) {
      nextItem();
      await nextTick();
    }
  }

  stopStudyMode();
}

function toggleStudyMode() {
  if (isStudyModeActive.value) {
    stopStudyMode();
    return;
  }

  isStudyModeActive.value = true;
  const runId = studyModeRunId + 1;
  studyModeRunId = runId;
  void runStudyMode(runId);
}

watch(
  () => activeItem.value?.id,
  () => {
    if (isStudyModeActive.value) return;
    if (!isPlayableReviewItem(activeItem.value)) return;

    void speakActiveItem();
  },
  { immediate: true }
);

watch(activeLessonId, () => {
  stopStudyMode();
});

onBeforeUnmount(() => {
  stopStudyMode();
});

async function handleCreateLesson() {
  const generatedContent = lessonForm.generatedContent.trim();
  const teacherText = lessonForm.teacherText.trim();
  if (!generatedContent) {
    ElMessage.warning("请先填写生成内容");
    return;
  }

  const lesson = addLesson({ generatedContent, teacherText });
  if (!lesson) {
    ElMessage.warning("生成内容中没有识别到带中文翻译的单词或句子");
    return;
  }

  resetLessonForm();
  settingsDrawerOpen.value = false;
  settingsSection.value = "lessons";
  await saveCurrentReviewState("已添加复习日并同步", "已添加复习日，本机暂存但云端未同步");
}

function getLessonGeneratedContent(lesson: ReviewLesson) {
  return (
    lesson.generatedContent?.trim() ||
    lesson.teacherText?.trim() ||
    lesson.dailyContent?.trim() ||
    ""
  );
}

function openLessonEditor(lesson: ReviewLesson) {
  selectLesson(lesson.id);
  lessonEditorForm.lessonId = lesson.id;
  lessonEditorForm.title = lesson.title;
  lessonEditorForm.generatedContent = getLessonGeneratedContent(lesson);
  lessonEditorForm.teacherText = lesson.teacherText?.trim() || "";
  lessonEditorOpen.value = true;
}

async function handleUpdateLesson() {
  const title = lessonEditorForm.title.trim();
  if (!title) {
    ElMessage.warning("请先填写标题");
    return;
  }

  const generatedContent = lessonEditorForm.generatedContent.trim();
  if (!generatedContent) {
    ElMessage.warning("请先填写生成内容");
    return;
  }

  const lesson = updateLesson(lessonEditorForm.lessonId, {
    title,
    generatedContent,
    teacherText: lessonEditorForm.teacherText
  });
  if (!lesson) {
    ElMessage.warning("生成内容中没有识别到带中文翻译的单词或句子");
    return;
  }

  selectLesson(lesson.id);
  lessonEditorOpen.value = false;
  await saveCurrentReviewState("复习日已更新并同步", "复习日已更新，本机暂存但云端未同步");
}

function openSettings(section: SettingsSection = "lessons") {
  settingsSection.value = section;
  settingsDrawerOpen.value = true;
}

function handleSelectItem(itemIndex: number) {
  setActiveIndex(itemIndex);
  settingsDrawerOpen.value = false;
}

async function handleDeleteLesson(lessonId: string) {
  deleteLesson(lessonId);
  await saveCurrentReviewState("已删除复习日并同步", "已删除复习日，本机暂存但云端未同步");
}

async function handleRemoveItem(item: ReviewItem) {
  if (!activeLesson.value) return;
  removeItem(activeLesson.value.id, item.id);
  await saveCurrentReviewState("已删除并同步", "已删除，本机暂存但云端未同步");
}

async function handleRestoreSeeds() {
  try {
    await ElMessageBox.confirm(
      "恢复后会替换当前复习日列表，确定继续吗？",
      "恢复示例",
      {
        confirmButtonText: "恢复",
        cancelButtonText: "取消",
        type: "warning"
      }
    );
    restoreSeedLessons();
    settingsDrawerOpen.value = false;
    settingsSection.value = "lessons";
    await saveCurrentReviewState("已恢复内置内容并同步", "已恢复内置内容，本机暂存但云端未同步");
  } catch {}
}

function resetLessonForm() {
  lessonForm.generatedContent = "";
  lessonForm.teacherText = "";
}
</script>

<template>
  <main class="kid-review-app">
    <section v-if="activeLesson && activeItem" class="review-workspace" aria-live="polite">
      <section class="phone-stage" aria-label="发音复习卡">
        <button class="review-settings-trigger" type="button" @click="openSettings()">
          <span class="settings-trigger-icon">
            <el-icon><Setting /></el-icon>
          </span>
          <span class="settings-trigger-copy">
            <span>复习设置</span>
            <strong>{{ activeLesson.title }} · {{ activeLesson.items.length }} 项</strong>
          </span>
          <el-icon class="settings-trigger-arrow"><ArrowRight /></el-icon>
        </button>

        <el-progress
          class="review-progress"
          :percentage="progressPercent"
          :show-text="false"
          :stroke-width="12"
        />

        <div class="review-meta-row">
          <span>{{ activeLesson.dateLabel }}</span>
          <strong>{{ activeIndex + 1 }} / {{ activeLesson.items.length }}</strong>
        </div>

        <article class="study-card" :class="{ 'has-spelling': showSpelling }">
          <div class="type-row">
            <span>{{ currentItemType }}</span>
            <el-button
              :icon="Headset"
              text
              :type="isStudyModeActive ? 'primary' : undefined"
              @click="toggleStudyMode"
            >
              {{ isStudyModeActive ? "停止学习" : "学习模式" }}
            </el-button>
          </div>

          <div class="word-display">
            <h2 :style="{ fontSize: currentTitleFontSize }">{{ activeItem.english }}</h2>
          </div>

          <div class="translation-row" :class="{ 'has-phonetic': currentPhonetic }">
            <span
              v-if="currentPhonetic"
              class="phonetic"
              :style="{ fontSize: currentPhoneticFontSize }"
              aria-label="音标"
            >
              {{ currentPhonetic }}
            </span>
            <p class="translation">{{ currentCardSubtitle }}</p>
            <el-button
              class="speaker-button"
              :icon="Microphone"
              circle
              aria-label="播放发音"
              @click="speakActiveItem"
            />
          </div>

          <div v-if="showSpelling" class="spelling-slot">
            <div
              v-if="currentLetters.length"
              class="letter-row"
              :class="{
                dense: currentLetters.length > 7,
                compact: currentLetters.length > 9
              }"
              aria-label="字母拆分"
            >
              <button
                v-for="(part, partIndex) in currentLetters"
                :key="`${part.letter}-${partIndex}`"
                class="letter-pill"
                :class="{ vowel: part.vowel }"
                type="button"
                @click="speakReviewText(part.letter)"
              >
                <strong>{{ part.letter }}</strong>
              </button>
            </div>
          </div>

          <div class="picture-tools">
            <div class="picture-frame" :class="{ 'has-reference-image': currentReferenceImageUrl }">
              <img
                v-if="currentReferenceImageUrl"
                class="reference-image"
                :src="currentReferenceImageUrl"
                :alt="`${activeItem.english} 参考图片`"
                :title="currentReferenceImageTitle"
                referrerpolicy="no-referrer"
              />
              <span v-else class="picture-emoji">{{ activeItem.emoji }}</span>
              <span v-if="isReferenceImageLoading" class="picture-loading">下载中</span>
            </div>
            <el-tooltip content="联网刷新参考图片" placement="left">
              <el-button
                class="reference-refresh-button"
                :icon="RefreshLeft"
                circle
                :loading="isReferenceImageLoading"
                aria-label="刷新参考图片"
                @click="refreshReferenceImage"
              />
            </el-tooltip>
          </div>

          <div class="step-navigation" aria-label="复习步骤导航">
            <button class="previous-step-button" type="button" @click="previousItem">
              <el-icon><ArrowLeft /></el-icon>
              <span>上一个</span>
            </button>
            <button class="next-step-button" type="button" @click="nextItem">
              <span>下一个</span>
              <el-icon><ArrowRight /></el-icon>
            </button>
          </div>
        </article>

        <div class="mini-card-strip" aria-label="复习内容导航">
          <button
            v-for="(item, itemIndex) in activeLesson.items"
            :key="item.id"
            class="mini-card"
            :class="{ active: itemIndex === activeIndex }"
            type="button"
            @click="setActiveIndex(itemIndex)"
          >
            <span>{{ item.emoji }}</span>
          </button>
        </div>

      </section>

      <aside class="content-panel" aria-label="当前复习内容">
        <section class="summary-panel">
          <div class="panel-title-row">
            <div>
              <p>{{ activeLesson.theme }}</p>
              <h2>{{ activeLesson.title }}</h2>
            </div>
            <button
              class="daily-content-button"
              type="button"
              aria-haspopup="dialog"
              @click="dailyContentDrawerOpen = true"
            >
              <el-icon><Calendar /></el-icon>
              <span>今日学习内容</span>
            </button>
          </div>
          <div v-if="currentLearningItems.length" class="lesson-learning-list">
            <p v-for="item in currentLearningItems" :key="item.id">
              <span>{{ item.english }}</span>
              <small v-if="item.chinese">{{ item.chinese }}</small>
            </p>
          </div>
          <p v-else class="lesson-learning-empty">暂无单词和句子。</p>
        </section>
      </aside>
    </section>

    <el-drawer
      v-model="dailyContentDrawerOpen"
      class="daily-content-drawer"
      direction="btt"
      size="88%"
      :with-header="false"
      append-to-body
    >
      <section class="daily-content-shell" aria-label="今日学习内容">
        <header class="daily-content-header">
          <div class="daily-content-title">
            <strong>今日学习内容</strong>
            <span>{{ activeLesson?.title }}</span>
          </div>
          <el-button :icon="SwitchButton" text @click="dailyContentDrawerOpen = false">
            关闭
          </el-button>
        </header>
        <div class="daily-content-body">
          <p class="daily-content-copy">{{ activeDailyContent }}</p>
        </div>
      </section>
    </el-drawer>

    <el-drawer
      v-model="settingsDrawerOpen"
      class="review-settings-drawer"
      direction="btt"
      size="82%"
      :with-header="false"
      append-to-body
    >
      <div class="settings-drawer-shell">
        <div class="settings-drawer-header">
          <strong>复习设置</strong>
          <el-button :icon="SwitchButton" text @click="settingsDrawerOpen = false">关闭</el-button>
        </div>

        <div class="settings-segmented-wrap">
          <el-segmented
            v-model="settingsSection"
            class="review-settings-segmented"
            :options="settingsOptions"
          />
        </div>

        <div class="settings-drawer-content">
          <section v-if="settingsSection === 'lessons'" class="settings-section">
            <div class="settings-section-intro">
              <h3>选择复习内容</h3>
              <p>切换后会继续上次的复习进度。</p>
            </div>

            <nav class="settings-lesson-grid" aria-label="复习日列表">
              <div
                v-for="lesson in lessons"
                :key="lesson.id"
                class="settings-lesson-card"
                :class="{ active: lesson.id === activeLessonId }"
              >
                <button
                  class="settings-lesson-main"
                  type="button"
                  @click="selectLesson(lesson.id)"
                >
                  <span class="settings-lesson-icon">
                    <el-icon><Calendar /></el-icon>
                  </span>
                  <span class="settings-lesson-copy">
                    <strong>{{ lesson.title }}</strong>
                    <small>{{ lesson.dateLabel }} · {{ lesson.items.length }} 项</small>
                  </span>
                </button>
                <div class="settings-lesson-actions">
                  <el-button
                    class="settings-lesson-edit"
                    :icon="Edit"
                    circle
                    text
                    aria-label="编辑复习日"
                    @click.stop="openLessonEditor(lesson)"
                  />
                  <el-button
                    v-if="lessons.length > 1"
                    class="settings-lesson-delete"
                    :icon="Delete"
                    circle
                    text
                    aria-label="删除复习日"
                    @click.stop="handleDeleteLesson(lesson.id)"
                  />
                </div>
              </div>
            </nav>

            <section class="settings-review-list" aria-label="当前复习列表">
              <div class="panel-title-row compact">
                <h3>复习列表</h3>
                <span>{{ activeLesson?.items.length || 0 }} items</span>
              </div>

              <div
                v-for="(item, itemIndex) in activeLesson?.items || []"
                :key="item.id"
                class="review-row"
                :class="{ active: itemIndex === activeIndex }"
                role="button"
                tabindex="0"
                @click="handleSelectItem(itemIndex)"
                @keydown.enter.prevent="handleSelectItem(itemIndex)"
              >
                <span class="row-emoji">{{ item.emoji }}</span>
                <span class="row-copy">
                  <strong>{{ item.english }}</strong>
                  <small>{{ item.chinese || item.note || item.category }}</small>
                </span>
                <span class="row-actions">
                  <el-button
                    :icon="Microphone"
                    circle
                    text
                    aria-label="播放"
                    @click.stop="speakReviewText(item.english, item.category === 'sentence')"
                  />
                  <el-button
                    v-if="(activeLesson?.items.length || 0) > 1"
                    :icon="Delete"
                    circle
                    text
                    aria-label="删除"
                    @click.stop="handleRemoveItem(item)"
                  />
                </span>
              </div>
            </section>
          </section>

          <section v-else-if="settingsSection === 'add'" class="settings-section">
            <div class="settings-section-intro">
              <h3>添加复习日</h3>
              <p>生成内容用于提取，老师原文只作为辅助显示。</p>
            </div>

            <el-form label-position="top" class="lesson-form settings-lesson-form">
              <el-form-item label="生成内容">
                <el-input
                  v-model="lessonForm.generatedContent"
                  type="textarea"
                  :rows="10"
                  resize="none"
                  placeholder="请输入要生成复习内容的中英文内容&#10;&#10;例如：&#10;zero 数字0&#10;I see a zebra.（我看到一只斑马。）"
                />
              </el-form-item>
              <el-form-item label="老师发来的内容（辅助显示）">
                <el-input
                  v-model="lessonForm.teacherText"
                  type="textarea"
                  :rows="7"
                  resize="none"
                  placeholder="可选：粘贴老师发来的完整课堂内容"
                />
              </el-form-item>
              <el-button class="settings-save-button" type="primary" @click="handleCreateLesson">
                保存复习日
              </el-button>
            </el-form>
          </section>

          <section v-else class="settings-section">
            <div class="settings-section-intro">
              <h3>学习设置</h3>
              <p>调整复习显示、自动播放和云端同步。</p>
            </div>

            <div class="settings-display-toggle">
              <strong>显示拼写</strong>
              <el-switch v-model="showSpelling" aria-label="显示拼写" />
            </div>

            <section class="settings-sync-card" :class="`status-${syncStatus}`">
              <div class="settings-sync-title">
                <strong>云端同步</strong>
                <small>{{ syncStatusLabel }}</small>
              </div>
              <div class="settings-sync-row">
                <span>{{ syncStatusDetail }}</span>
                <el-button
                  :icon="RefreshLeft"
                  text
                  :loading="isSyncBusy"
                  @click="loadRemoteReviewState()"
                >
                  同步云端
                </el-button>
              </div>
            </section>

            <section class="settings-study-mode-card" aria-label="学习模式设置">
              <div class="settings-study-mode-title">
                <strong>学习模式</strong>
                <small>自动播放后跳到下一个</small>
              </div>
              <div class="settings-study-mode-controls">
                <label class="settings-number-field">
                  <span>重复次数</span>
                  <el-input-number
                    v-model="studyModeRepeatCount"
                    :min="1"
                    :max="10"
                    :step="1"
                    :precision="0"
                    controls-position="right"
                    aria-label="学习模式重复次数"
                  />
                </label>
                <label class="settings-number-field">
                  <span>间隔秒数</span>
                  <el-input-number
                    v-model="studyModeIntervalSeconds"
                    :min="0.5"
                    :max="10"
                    :step="0.5"
                    :precision="1"
                    controls-position="right"
                    aria-label="学习模式间隔秒数"
                  />
                </label>
              </div>
            </section>

            <section class="settings-restore-section">
              <span class="settings-restore-icon">
                <el-icon><RefreshLeft /></el-icon>
              </span>
              <h3>恢复内置复习内容</h3>
              <p>将课程列表恢复为内置示例，当前添加的课程会被替换。</p>
              <el-button type="danger" plain :icon="RefreshLeft" @click="handleRestoreSeeds">
                恢复示例内容
              </el-button>
            </section>
          </section>
        </div>
      </div>
    </el-drawer>

    <el-dialog
      v-model="lessonEditorOpen"
      class="lesson-editor-dialog"
      title="编辑复习日"
      width="min(92vw, 520px)"
      append-to-body
    >
      <el-form label-position="top" class="lesson-form lesson-editor-form">
        <el-form-item label="标题">
          <el-input
            v-model="lessonEditorForm.title"
            maxlength="50"
            show-word-limit
            placeholder="请输入复习日标题"
          />
        </el-form-item>
        <el-form-item label="生成内容">
          <el-input
            v-model="lessonEditorForm.generatedContent"
            type="textarea"
            :rows="10"
            resize="none"
            placeholder="请输入带中英文翻译的单词或句子"
          />
        </el-form-item>
        <el-form-item label="老师发来的内容（辅助显示）">
          <el-input
            v-model="lessonEditorForm.teacherText"
            type="textarea"
            :rows="7"
            resize="none"
            placeholder="可选：粘贴老师发来的完整课堂内容"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="lessonEditorOpen = false">取消</el-button>
        <el-button type="primary" @click="handleUpdateLesson">保存修改</el-button>
      </template>
    </el-dialog>
  </main>
</template>
