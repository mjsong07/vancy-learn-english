import type { ReviewItem, ReviewItemCategory, ReviewLesson } from "../types/review";

export const reviewStorageKey = "kid-english-review-lessons-v1";
export const reviewProgressStorageKey = "kid-english-review-progress-v1";
export const reviewActiveLessonStorageKey = "kid-english-review-active-lesson-v1";
export const reviewContentVersionStorageKey = "kid-english-review-content-version-v1";
export const reviewContentVersion = 8;

export function createReviewId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function buildReviewItem(
  english: string,
  chinese = "",
  note = "",
  category?: ReviewItemCategory
): ReviewItem {
  const normalizedEnglish = english.trim().replace(/\s+/g, " ");
  const normalizedChinese = chinese.trim();
  return {
    id: createReviewId("item"),
    english: normalizedEnglish,
    chinese: normalizedChinese,
    category: category || inferCategory(normalizedEnglish),
    emoji: pickEmoji(normalizedEnglish, normalizedChinese),
    note: note.trim()
  };
}

export function getReviewItemDedupeKey(english: string) {
  return english
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[…]+/g, "...")
    .replace(/[.?!,，。！？]+$/g, "")
    .toLowerCase();
}

export function dedupeReviewItems(items: ReviewItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = getReviewItemDedupeKey(item.english);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export const seedReviewLessons: ReviewLesson[] = [
  {
    id: "lesson-letter-x",
    title: "Letter Xx",
    dateLabel: "今日课堂",
    theme: "Super ABC",
    summary: "字母 Xx、相关单词和课堂重点句型。",
    teacherText:
      "letter Xx / X-ray X光片 / six 六 / box 盒子，箱子 / ox 公牛 / I see an X-ray. / I have six toys. / This is my box. / The ox is big.",
    items: [
      buildReviewItem("letter Xx", "字母 Xx", "大写 X，小写 x · 字母发音", "letter"),
      buildReviewItem("X-ray", "X 光片"),
      buildReviewItem("six", "六"),
      buildReviewItem("box", "盒子，箱子"),
      buildReviewItem("ox", "公牛"),
      buildReviewItem("I see an X-ray.", "我看到一张 X 光片。", "重点句型", "sentence"),
      buildReviewItem("I have six toys.", "我有六个玩具。", "重点句型", "sentence"),
      buildReviewItem("This is my box.", "这是我的盒子。", "重点句型", "sentence"),
      buildReviewItem("The ox is big.", "这头公牛很大。", "重点句型", "sentence")
    ]
  },
  {
    id: "lesson-letter-y",
    title: "Letter Yy",
    dateLabel: "今日课堂",
    theme: "Super ABC",
    summary: "字母 Yy、相关单词和课堂重点句型。",
    teacherText:
      "letter Yy / yogurt 酸奶酪 / yawn 打哈欠 / yak 牦牛 / yacht 游艇 / I like yogurt. / I am tired. I yawn. / The yak is big. / We see a yacht.",
    items: [
      buildReviewItem("letter Yy", "字母 Yy", "大写 Y，小写 y · 字母发音", "letter"),
      buildReviewItem("yogurt", "酸奶酪"),
      buildReviewItem("yawn", "打哈欠"),
      buildReviewItem("yak", "牦牛"),
      buildReviewItem("yacht", "游艇"),
      buildReviewItem("I like yogurt.", "我喜欢酸奶酪。", "重点句型", "sentence"),
      buildReviewItem("I am tired. I yawn.", "我累了，我打哈欠。", "重点句型", "sentence"),
      buildReviewItem("The yak is big.", "这头牦牛很大。", "重点句型", "sentence"),
      buildReviewItem("We see a yacht.", "我们看到一艘游艇。", "重点句型", "sentence")
    ]
  },
  {
    id: "lesson-letter-z",
    title: "Letter Zz",
    dateLabel: "今日课堂",
    theme: "Super ABC",
    summary: "字母 Zz、相关单词和课堂重点句型。",
    teacherText:
      "letter Zz / zero 数字0 / zoo 动物园 / zebra 斑马 / zipper 拉链 / Z is for zero. / Z is for zebra. / Zero is a number. / I go to the zoo. / I see a zebra. / I pull my zipper.",
    items: [
      buildReviewItem("letter Zz", "字母 Zz", "字母操 · 大写 Z，小写 z", "letter"),
      buildReviewItem("zero", "数字 0"),
      buildReviewItem("zoo", "动物园"),
      buildReviewItem("zebra", "斑马"),
      buildReviewItem("zipper", "拉链"),
      buildReviewItem("Z is for zero.", "Z 代表 zero。", "重点句型", "sentence"),
      buildReviewItem("Z is for zebra.", "Z 代表 zebra。", "重点句型", "sentence"),
      buildReviewItem("Zero is a number.", "零是一个数字。", "重点句型", "sentence"),
      buildReviewItem("I go to the zoo.", "我去动物园。", "重点句型", "sentence"),
      buildReviewItem("I see a zebra.", "我看到一只斑马。", "重点句型", "sentence"),
      buildReviewItem("I pull my zipper.", "我拉我的拉链。", "重点句型", "sentence")
    ]
  },
  {
    id: "lesson-unit-6-fruits",
    title: "Unit 6 水果",
    dateLabel: "今日学习",
    theme: "Students Book · Fruit",
    summary:
      "教学目标：学习《Students Book》Unit 6 Fruit 主题词汇与句型。\n家作：跟读音频。\n课堂小结：同学们今天表现超棒哒！因为周日上冰沙活动课，我们前置教学水果词汇。回家也要多多复习呦！",
    teacherText:
      "apple 苹果 / pear 梨 / orange 橘子 / watermelon 西瓜 / pineapple 菠萝 / mango 芒果 / What fruit do you like? / I like...",
    items: [
      buildReviewItem("apple", "苹果"),
      buildReviewItem("pear", "梨"),
      buildReviewItem("orange", "橘子"),
      buildReviewItem("watermelon", "西瓜"),
      buildReviewItem("pineapple", "菠萝", "拓展单词"),
      buildReviewItem("mango", "芒果", "拓展单词"),
      buildReviewItem("What fruit do you like?", "你喜欢什么水果？", "核心句型", "sentence"),
      buildReviewItem("I like...", "我喜欢……", "接上喜欢的水果", "sentence")
    ]
  },
  {
    id: "lesson-smoothie-diy",
    title: "水果冰沙 DIY",
    dateLabel: "LG1 课堂",
    theme: "Fruits Smoothie",
    summary: "水果、制作材料和冰沙课堂问答。",
    teacherText:
      "dragon fruit 火龙果 / kiwifruit 奇异果 / ice cube 冰块 / sugar 糖 / syrup 糖浆 / blender 搅拌机 / cup 杯子 / straw 吸管 / I like mango. / What do we need to make smoothie? / We need ice cubes. / We need a blender.",
    items: [
      buildReviewItem("dragon fruit", "火龙果"),
      buildReviewItem("kiwifruit", "奇异果"),
      buildReviewItem("pineapple smoothie", "菠萝冰沙"),
      buildReviewItem("ice cube", "冰块"),
      buildReviewItem("sugar", "糖"),
      buildReviewItem("syrup", "糖浆"),
      buildReviewItem("blender", "搅拌机"),
      buildReviewItem("cup", "杯子"),
      buildReviewItem("straw", "吸管"),
      buildReviewItem("I like mango.", "我喜欢芒果。", "", "sentence"),
      buildReviewItem(
        "What do we need to make smoothie?",
        "做冰沙我们需要什么？",
        "",
        "sentence"
      ),
      buildReviewItem("We need ice cubes.", "我们需要冰块。", "", "sentence"),
      buildReviewItem("We need a blender.", "我们需要一台搅拌机。", "", "sentence"),
      buildReviewItem("It is yummy.", "它很好吃。", "品尝分享", "sentence")
    ]
  }
];

export function parseReviewText(rawText: string) {
  const parsed = rawText
    .split(/\n|；|;/)
    .flatMap((line) => line.split(/\s+\/\s+/))
    .flatMap((line) => parseReviewLine(line))
    .filter((item) => item.english);

  return dedupeReviewItems(parsed);
}

function parseReviewLine(line: string): ReviewItem[] {
  const cleaned = cleanLine(line);
  if (!cleaned || !/[A-Za-z]/.test(cleaned)) return [];

  const parenthesized = parseParenthesizedPairs(cleaned);
  if (parenthesized.length) return parenthesized;

  if (/[、,，]/.test(cleaned)) {
    const pieces = cleaned
      .split(/[、,，]/)
      .flatMap((piece) => parseSinglePair(piece))
      .filter(Boolean);
    if (pieces.length > 1) return pieces;
  }

  return parseSinglePair(cleaned);
}

function parseParenthesizedPairs(line: string): ReviewItem[] {
  const pairs: ReviewItem[] = [];
  const pattern = /([A-Za-z][A-Za-z0-9\s'.?!,-]*[A-Za-z0-9.?!])\s*[（(]([^）)]+)[）)]/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(line))) {
    pairs.push(buildReviewItem(stripPromptPrefix(match[1]), match[2]));
  }
  return pairs;
}

function parseSinglePair(line: string): ReviewItem[] {
  const cleaned = cleanLine(line);
  const englishStart = cleaned.search(/[A-Za-z]/);
  if (englishStart < 0) return [];

  const englishAndChinese = cleaned.slice(englishStart);
  const chineseStart = englishAndChinese.search(/[\u4e00-\u9fff]/);

  if (chineseStart >= 0) {
    const english = stripPromptPrefix(englishAndChinese.slice(0, chineseStart));
    const chinese = englishAndChinese.slice(chineseStart).replace(/[。.!?？：:]+$/g, "");
    return english ? [buildReviewItem(english, chinese)] : [];
  }

  const englishOnly = stripPromptPrefix(englishAndChinese);
  if (!shouldKeepEnglishOnly(englishOnly)) return [];
  return [buildReviewItem(englishOnly)];
}

function cleanLine(line: string) {
  return line
    .replace(/[📆👩‍🏫🌞💬👇🧑‍🏫📖✍️🍍🦓]/g, "")
    .replace(/^[\s—\-＿_【\]】]+|[\s—\-＿_【\]】]+$/g, "")
    .replace(/^[0-9①②③④⑤⑥⑦⑧⑨1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣.、)\s-]+/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function stripPromptPrefix(text: string) {
  return text
    .replace(/^[QqAa][：:]\s*/g, "")
    .replace(/[“”"']/g, "")
    .replace(/[…]+/g, "...")
    .replace(/\s+/g, " ")
    .trim();
}

function shouldKeepEnglishOnly(text: string) {
  if (!text) return false;
  if (/^(LG|Super ABC|ABC|A-Z)$/i.test(text)) return false;
  return /[.?!]$/.test(text) || text.split(/\s+/).length <= 4;
}

function inferCategory(english: string): ReviewItemCategory {
  if (/^letter\s+[A-Za-z]/i.test(english)) return "letter";
  if (/[.?!]$/.test(english) || english.split(/\s+/).length > 3) return "sentence";
  return "word";
}

function pickEmoji(english: string, chinese: string) {
  const text = `${english} ${chinese}`.toLocaleLowerCase();
  const emojiMap: Array<[RegExp, string]> = [
    [/pineapple|菠萝/, "🍍"],
    [/apple|苹果/, "🍎"],
    [/pear|梨/, "🍐"],
    [/orange|橘子/, "🍊"],
    [/watermelon|西瓜/, "🍉"],
    [/dragon fruit|火龙果/, "🐲"],
    [/mango|芒果/, "🥭"],
    [/kiwi|奇异果/, "🥝"],
    [/smoothie|冰沙/, "🥤"],
    [/ice cube|冰块/, "🧊"],
    [/sugar|糖/, "🍬"],
    [/syrup|糖浆/, "🍯"],
    [/blender|搅拌机/, "🔄"],
    [/\bcup\b|杯子/, "🥤"],
    [/straw|吸管/, "🧃"],
    [/x-ray|x ray|x光/, "🩻"],
    [/\bsix\b|六/, "6️⃣"],
    [/\bbox\b|盒子|箱子/, "📦"],
    [/\box\b|公牛/, "🐂"],
    [/yogurt|酸奶酪|酸奶/, "🥣"],
    [/yawn|打哈欠/, "🥱"],
    [/\byak\b|牦牛/, "🦬"],
    [/yacht|游艇/, "🛥️"],
    [/zero|数字 0|数字0/, "0️⃣"],
    [/\bzoo\b|动物园/, "🦁"],
    [/zebra|斑马/, "🦓"],
    [/zipper|拉链/, "🧥"],
    [/letter|字母/, "🔤"],
    [/number|数字/, "🔢"]
  ];
  return emojiMap.find(([pattern]) => pattern.test(text))?.[1] || "🔊";
}
