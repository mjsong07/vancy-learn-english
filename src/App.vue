<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  ArrowLeft,
  ArrowRight,
  Calendar,
  Delete,
  Headset,
  Microphone,
  RefreshLeft,
  Setting,
  StarFilled,
  SwitchButton
} from "@element-plus/icons-vue";
import { useReviewLessons } from "./composables/useReviewLessons";
import { getReviewPhonetic } from "./data/reviewPhonetics";
import { speak } from "./services/speech";
import type { ReviewItem } from "./types/review";

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
  removeItem,
  deleteLesson,
  restoreSeedLessons
} = useReviewLessons();

type SettingsSection = "lessons" | "add" | "restore";

const settingsDrawerOpen = ref(false);
const settingsSection = ref<SettingsSection>("lessons");
const settingsOptions: Array<{ label: string; value: SettingsSection }> = [
  { label: "复习内容", value: "lessons" },
  { label: "添加复习日", value: "add" },
  { label: "恢复示例", value: "restore" }
];
const spellingPreferenceKey = "vancy-review-show-spelling";
const showSpelling = ref(window.localStorage.getItem(spellingPreferenceKey) === "true");

watch(showSpelling, (value) => {
  window.localStorage.setItem(spellingPreferenceKey, String(value));
});

const lessonForm = reactive({
  title: "",
  dateLabel: "",
  theme: "",
  summary: "",
  teacherText: ""
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

const activeTeacherContent = computed(() => {
  const teacherText = activeLesson.value?.teacherText.trim();
  return teacherText || activeLesson.value?.summary || "";
});

const activeTeacherContentLabel = computed(() => {
  return activeTeacherContent.value.replace(/\s+\/\s+/g, "\n");
});

function speakActiveItem() {
  if (!activeItem.value) return;
  speakReviewText(activeItem.value.english, activeItem.value.category === "sentence");
}

function speakReviewText(text: string, slow = false) {
  speak(text, {
    pitch: 1.12,
    rate: slow ? 0.7 : 0.78
  });
}

function handleCreateLesson() {
  addLesson({ ...lessonForm });
  resetLessonForm();
  settingsDrawerOpen.value = false;
  settingsSection.value = "lessons";
  ElMessage.success("已添加复习日");
}

function openSettings(section: SettingsSection = "lessons") {
  settingsSection.value = section;
  settingsDrawerOpen.value = true;
}

function handleSelectLesson(lessonId: string) {
  selectLesson(lessonId);
  settingsSection.value = "lessons";
}

function handleSelectItem(itemIndex: number) {
  setActiveIndex(itemIndex);
  settingsDrawerOpen.value = false;
}

function handleDeleteLesson(lessonId: string) {
  deleteLesson(lessonId);
  ElMessage.success("已删除复习日");
}

function handleRemoveItem(item: ReviewItem) {
  if (!activeLesson.value) return;
  removeItem(activeLesson.value.id, item.id);
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
    ElMessage.success("已恢复内置内容");
  } catch {}
}

function resetLessonForm() {
  lessonForm.title = "";
  lessonForm.dateLabel = "";
  lessonForm.theme = "";
  lessonForm.summary = "";
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
            <el-button :icon="Headset" text @click="speakActiveItem">Listen</el-button>
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
              :style="{
                gridTemplateColumns: `repeat(${currentLetters.length}, minmax(0, 1fr))`
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

          <div class="picture-frame">
            <span class="picture-emoji">{{ activeItem.emoji }}</span>
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
            <span class="star-badge">
              <el-icon><StarFilled /></el-icon>
            </span>
          </div>
          <p class="teacher-content">{{ activeTeacherContentLabel }}</p>
        </section>
      </aside>
    </section>

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

            <div class="settings-display-toggle">
              <strong>显示拼写</strong>
              <el-switch v-model="showSpelling" aria-label="显示拼写" />
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
                  @click="handleSelectLesson(lesson.id)"
                >
                  <span class="settings-lesson-icon">
                    <el-icon><Calendar /></el-icon>
                  </span>
                  <span class="settings-lesson-copy">
                    <strong>{{ lesson.title }}</strong>
                    <small>{{ lesson.dateLabel }} · {{ lesson.items.length }} 项</small>
                  </span>
                </button>
                <el-button
                  v-if="lessons.length > 1"
                  class="settings-lesson-delete"
                  :icon="Delete"
                  circle
                  text
                  aria-label="删除复习日"
                  @click="handleDeleteLesson(lesson.id)"
                />
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
              <p>填写标题并粘贴老师发来的课堂内容。</p>
            </div>

            <el-form label-position="top" class="lesson-form settings-lesson-form">
              <el-form-item label="标题">
                <el-input v-model="lessonForm.title" placeholder="Letter Aa / 水果课 / 动物课" />
              </el-form-item>
              <el-form-item label="日期">
                <el-input v-model="lessonForm.dateLabel" placeholder="7月14日 / 周日课堂" />
              </el-form-item>
              <el-form-item label="主题">
                <el-input v-model="lessonForm.theme" placeholder="Super ABC / Fruits" />
              </el-form-item>
              <el-form-item label="小结">
                <el-input v-model="lessonForm.summary" placeholder="今天复习的重点" />
              </el-form-item>
              <el-form-item label="老师发来的内容">
                <el-input
                  v-model="lessonForm.teacherText"
                  type="textarea"
                  :rows="8"
                  resize="none"
                  placeholder="zero 数字0&#10;I see a zebra.（我看到一只斑马。）&#10;What fruit do you like? 你喜欢什么水果？"
                />
              </el-form-item>
              <el-button class="settings-save-button" type="primary" @click="handleCreateLesson">
                保存复习日
              </el-button>
            </el-form>
          </section>

          <section v-else class="settings-section settings-restore-section">
            <span class="settings-restore-icon">
              <el-icon><RefreshLeft /></el-icon>
            </span>
            <h3>恢复内置复习内容</h3>
            <p>将课程列表恢复为内置示例，当前添加的课程会被替换。</p>
            <el-button type="danger" plain :icon="RefreshLeft" @click="handleRestoreSeeds">
              恢复示例内容
            </el-button>
          </section>
        </div>
      </div>
    </el-drawer>
  </main>
</template>
