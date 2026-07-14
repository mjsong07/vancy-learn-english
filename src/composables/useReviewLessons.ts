import { computed, ref, watch } from "vue";
import {
  buildReviewItem,
  createReviewId,
  dedupeReviewItems,
  getReviewItemDedupeKey,
  parseReviewText,
  reviewActiveLessonStorageKey,
  reviewContentVersion,
  reviewContentVersionStorageKey,
  reviewProgressStorageKey,
  reviewStorageKey,
  seedReviewLessons
} from "../data/reviewLessons";
import type { ReviewItem, ReviewLesson } from "../types/review";

function cloneSeedLessons() {
  return JSON.parse(JSON.stringify(seedReviewLessons)) as ReviewLesson[];
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? (JSON.parse(rawValue) as T) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeLessons(rawLessons: ReviewLesson[]) {
  const fallback = cloneSeedLessons();
  if (!Array.isArray(rawLessons) || !rawLessons.length) return fallback;

  return rawLessons
    .filter((lesson) => lesson?.id && lesson?.title)
    .map((lesson) => ({
      ...lesson,
      dateLabel: lesson.dateLabel || "复习日",
      theme: lesson.theme || "English Review",
      summary: lesson.summary || "",
      teacherText: lesson.teacherText || "",
      items: normalizeLessonItems(lesson.items, fallback[0].items)
    }));
}

function normalizeLessonItems(items: ReviewItem[] | undefined, fallbackItems: ReviewItem[]) {
  const sourceItems = Array.isArray(items) && items.length ? items : fallbackItems;
  const dedupedItems = dedupeReviewItems(sourceItems);
  return dedupedItems.length ? dedupedItems : fallbackItems;
}

const seedLessonMigrations = [
  { version: 3, lessonId: "lesson-unit-6-fruits", replaceExisting: true }
] as const;

const legacyGroupedLetterLessonIds = new Set(["lesson-letter-xyz-review", "lesson-letter-z"]);
const letterUnitLessonIds = ["lesson-letter-x", "lesson-letter-y", "lesson-letter-z"];
const refreshedSeedLessonIds = new Set([
  ...letterUnitLessonIds,
  "lesson-unit-6-fruits",
  "lesson-smoothie-diy"
]);

function restoreLessonsFromTeacherText(rawLessons: ReviewLesson[]) {
  return rawLessons.map((lesson) => {
    if (!lesson.teacherText.trim()) return lesson;

    const parsedItems = parseReviewText(lesson.teacherText);
    return parsedItems.length
      ? {
          ...lesson,
          items: parsedItems
        }
      : lesson;
  });
}

function loadReviewLessons() {
  const seedLessons = normalizeLessons(cloneSeedLessons());
  const normalizedLessons = normalizeLessons(readJson(reviewStorageKey, seedLessons));
  const storedVersionValue = Number(localStorage.getItem(reviewContentVersionStorageKey) || "1");
  const storedVersion = Number.isFinite(storedVersionValue) ? storedVersionValue : 1;

  if (storedVersion >= reviewContentVersion) return normalizedLessons;

  let migratedLessons = normalizedLessons;
  let latestLessonId = "";

  seedLessonMigrations.forEach((migration) => {
    if (storedVersion >= migration.version) return;

    const seedLesson = seedLessons.find((lesson) => lesson.id === migration.lessonId);
    if (!seedLesson) return;

    const hasLesson = migratedLessons.some((lesson) => lesson.id === seedLesson.id);
    if (!hasLesson) {
      migratedLessons = [seedLesson, ...migratedLessons];
    } else if (migration.replaceExisting) {
      migratedLessons = migratedLessons.map((lesson) =>
        lesson.id === seedLesson.id ? seedLesson : lesson
      );
    }
    latestLessonId = seedLesson.id;
  });

  if (storedVersion === 6) {
    migratedLessons = restoreLessonsFromTeacherText(migratedLessons);
  }

  if (storedVersion < 8) {
    const refreshedSeedLessons = seedLessons.filter((lesson) =>
      refreshedSeedLessonIds.has(lesson.id)
    );
    const customLessons = migratedLessons.filter(
      (lesson) =>
        !legacyGroupedLetterLessonIds.has(lesson.id) && !refreshedSeedLessonIds.has(lesson.id)
    );
    migratedLessons = [...refreshedSeedLessons, ...customLessons];
    latestLessonId = refreshedSeedLessons[0]?.id || latestLessonId;
  }

  localStorage.setItem(reviewStorageKey, JSON.stringify(migratedLessons));
  localStorage.setItem(reviewContentVersionStorageKey, String(reviewContentVersion));
  if (latestLessonId) {
    localStorage.setItem(reviewActiveLessonStorageKey, latestLessonId);
  }

  return migratedLessons;
}

export function useReviewLessons() {
  const lessons = ref<ReviewLesson[]>(loadReviewLessons());
  const activeLessonId = ref(
    localStorage.getItem(reviewActiveLessonStorageKey) || lessons.value[0]?.id || ""
  );
  const progressMap = ref<Record<string, number>>(readJson(reviewProgressStorageKey, {}));

  const activeLesson = computed(() => {
    return lessons.value.find((lesson) => lesson.id === activeLessonId.value) || lessons.value[0];
  });

  const activeIndex = computed(() => {
    const lesson = activeLesson.value;
    if (!lesson) return 0;
    const maxIndex = Math.max(lesson.items.length - 1, 0);
    return Math.min(progressMap.value[lesson.id] || 0, maxIndex);
  });

  const activeItem = computed(() => activeLesson.value?.items[activeIndex.value] || null);
  const progressPercent = computed(() => {
    const lesson = activeLesson.value;
    if (!lesson?.items.length) return 0;
    return Math.round(((activeIndex.value + 1) / lesson.items.length) * 100);
  });

  const itemCounts = computed(() => {
    return lessons.value.reduce<Record<string, { word: number; sentence: number; letter: number }>>(
      (counts, lesson) => {
        counts[lesson.id] = { word: 0, sentence: 0, letter: 0 };
        lesson.items.forEach((item) => {
          counts[lesson.id][item.category] += 1;
        });
        return counts;
      },
      {}
    );
  });

  watch(
    lessons,
    (nextLessons) => {
      localStorage.setItem(reviewStorageKey, JSON.stringify(nextLessons));
    },
    { deep: true }
  );

  watch(
    progressMap,
    (nextProgress) => {
      localStorage.setItem(reviewProgressStorageKey, JSON.stringify(nextProgress));
    },
    { deep: true }
  );

  watch(activeLessonId, (nextLessonId) => {
    localStorage.setItem(reviewActiveLessonStorageKey, nextLessonId);
  });

  function selectLesson(lessonId: string) {
    if (lessons.value.some((lesson) => lesson.id === lessonId)) {
      activeLessonId.value = lessonId;
    }
  }

  function setActiveIndex(nextIndex: number) {
    const lesson = activeLesson.value;
    if (!lesson?.items.length) return;
    progressMap.value = {
      ...progressMap.value,
      [lesson.id]: (nextIndex + lesson.items.length) % lesson.items.length
    };
  }

  function nextItem() {
    setActiveIndex(activeIndex.value + 1);
  }

  function previousItem() {
    setActiveIndex(activeIndex.value - 1);
  }

  function addLesson(payload: {
    title: string;
    dateLabel: string;
    theme: string;
    summary: string;
    teacherText: string;
  }) {
    const parsedItems = parseReviewText(payload.teacherText);
    const lesson: ReviewLesson = {
      id: createReviewId("lesson"),
      title: payload.title.trim() || "新的复习日",
      dateLabel: payload.dateLabel.trim() || "复习日",
      theme: payload.theme.trim() || "English Review",
      summary: payload.summary.trim() || "课后复习内容",
      teacherText: payload.teacherText.trim(),
      items: parsedItems.length ? parsedItems : [buildReviewItem("hello", "你好")]
    };
    lessons.value = [lesson, ...lessons.value];
    activeLessonId.value = lesson.id;
    progressMap.value = { ...progressMap.value, [lesson.id]: 0 };
  }

  function addItemToActiveLesson(english: string, chinese: string) {
    const lesson = activeLesson.value;
    if (!lesson || !english.trim()) return;
    const nextItem = buildReviewItem(english, chinese);
    const nextItemKey = getReviewItemDedupeKey(nextItem.english);
    const existingItemIndex = lesson.items.findIndex(
      (item) => getReviewItemDedupeKey(item.english) === nextItemKey
    );

    if (existingItemIndex >= 0) {
      setActiveIndex(existingItemIndex);
      return;
    }

    updateLessonItems(lesson.id, [...lesson.items, nextItem]);
    setActiveIndex(lesson.items.length);
  }

  function removeItem(lessonId: string, itemId: string) {
    const lesson = lessons.value.find((candidate) => candidate.id === lessonId);
    if (!lesson || lesson.items.length <= 1) return;
    const nextItems = lesson.items.filter((item) => item.id !== itemId);
    updateLessonItems(lessonId, nextItems);
    const currentIndex = progressMap.value[lessonId] || 0;
    progressMap.value = {
      ...progressMap.value,
      [lessonId]: Math.min(currentIndex, nextItems.length - 1)
    };
  }

  function deleteLesson(lessonId: string) {
    if (lessons.value.length <= 1) return;
    lessons.value = lessons.value.filter((lesson) => lesson.id !== lessonId);
    if (activeLessonId.value === lessonId) {
      activeLessonId.value = lessons.value[0]?.id || "";
    }
  }

  function restoreSeedLessons() {
    lessons.value = normalizeLessons(cloneSeedLessons());
    activeLessonId.value = lessons.value[0]?.id || "";
    progressMap.value = {};
  }

  function updateLessonItems(lessonId: string, items: ReviewItem[]) {
    const nextItems = dedupeReviewItems(items);
    lessons.value = lessons.value.map((lesson) =>
      lesson.id === lessonId
        ? {
            ...lesson,
            items: nextItems.length ? nextItems : lesson.items
          }
        : lesson
    );
  }

  return {
    lessons,
    activeLessonId,
    activeLesson,
    activeIndex,
    activeItem,
    progressPercent,
    itemCounts,
    selectLesson,
    setActiveIndex,
    nextItem,
    previousItem,
    addLesson,
    addItemToActiveLesson,
    removeItem,
    deleteLesson,
    restoreSeedLessons
  };
}
