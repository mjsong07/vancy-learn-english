import type { ReviewItem, ReviewItemCategory, ReviewLesson } from "../types/review";

export const reviewStorageKey = "kid-english-review-lessons-v1";
export const reviewProgressStorageKey = "kid-english-review-progress-v1";
export const reviewActiveLessonStorageKey = "kid-english-review-active-lesson-v1";
export const reviewContentVersionStorageKey = "kid-english-review-content-version-v1";
export const reviewContentVersion = 13;

export function createReviewId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function sanitizeReviewText(value: string) {
  return Array.from(value)
    .filter((character) => {
      if (character.length > 1) return true;
      const codePoint = character.charCodeAt(0);
      return codePoint < 0xd800 || codePoint > 0xdfff;
    })
    .join("");
}

export function buildReviewItem(
  english: string,
  chinese = "",
  note = "",
  category?: ReviewItemCategory
): ReviewItem {
  const normalizedEnglish = sanitizeReviewText(english).trim().replace(/\s+/g, " ");
  const normalizedChinese = sanitizeReviewText(chinese).trim();
  return {
    id: createReviewId("item"),
    english: normalizedEnglish,
    chinese: normalizedChinese,
    category: category || inferCategory(normalizedEnglish),
    emoji: pickEmoji(normalizedEnglish, normalizedChinese),
    note: sanitizeReviewText(note).trim()
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
    if (isLetterTitleReviewItem(item)) return false;

    const key = getReviewItemDedupeKey(item.english);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function isLetterTitleReviewItem(item: Pick<ReviewItem, "english" | "category">) {
  return item.category === "letter" && /^letter\s+[a-z]{1,2}$/i.test(item.english.trim());
}

const seedDailyContent: Record<string, string> = {
  "lesson-letter-x": `📆【今日学习内容】
————————————
👩‍🏫教学重点
1.唱歌曲《A is for Apple》A-Z(结合歌曲记忆字母发音及相关单词）

2.复习《Super ABC》letter Xx～Zz👇
1️⃣.字母操 letter Zz
2️⃣字母大小写
3️⃣字母发音及相关单词

——相关单词
1️⃣X-ray X光片
2️⃣six 六
3️⃣box 盒子，箱子
4️⃣ox 公牛
————
1️⃣yogurt 酸奶酪
2️⃣yawn 打哈欠🥱
3️⃣yak 牦牛
4️⃣yacht 游艇🛥️
———
1️⃣zero 数字0
2️⃣zoo 动物园
3️⃣zebra 斑马🦓
4️⃣zipper 拉链

—重点句型朗读
 I see an X-ray.
I have six toys.
This is my box.
The ox is big.
 I like yogurt.
 I am tired. I yawn.
The yak is big.
We see a yacht.
Zero is a number.
I go to the zoo.
I see a zebra.
 I pull my zipper.

——字母辨认训练

4.课前口语对话

5.书写练习
————————————
🌞【家庭作业】:
🧡口语作业💬
1️⃣观看外教老师指读视频字母Xx～Zz
2️⃣.跟读指读视频
————————————
[Sun]【今日课堂小结】
今天进行Xx～Zz的字母总复习，宝贝们的辨音能力有提升哦，继续加油，回去多跟读～@所有人`,
  "lesson-letter-y": `📆【今日学习内容】
————————————
👩‍🏫教学重点
1.唱歌曲《A is for Apple》A-Z（结合歌曲记忆字母发音及相关单词）

2.学习《Super ABC》letter Yy👇
1️⃣学习字母操 letter Yy
2️⃣学习字母大小写
3️⃣学习字母发音及相关单词

—相关单词
1️⃣yogurt 酸奶酪
2️⃣yawn 打哈欠🥱
3️⃣yak 牦牛
4️⃣yacht 游艇🛥️

—重点句型👇
1️⃣Y is for ….

—拓展句型表达：
1. I like yogurt.
（我喜欢酸奶酪。）
2. I am tired. I yawn.
（我累了，我打哈欠。）
3. The yak is big.
（这头牦牛很大。）
4. We see a yacht.
（我们看到一艘游艇。）

3.日常口语对话：提升听力能力

4.课堂完成书写
————————————
🌞【家庭作业】:
口语作业💬
1️⃣观看外教老师字母 Yy 指读视频
2️⃣跟读指读视频
————————————
[Sun]【今日课堂小结】
今日学习字母 Y，宝贝们要注意 Yy 的大小写和发音，回家多跟读、多复习哦！`,
  "lesson-letter-z": `📆【今日学习内容】
————————————
👩‍🏫教学重点
1.唱歌曲《A is for Apple》A-Z(结合歌曲记忆字母发音及相关单词）

2.学习《Super ABC》letter Zz👇
1️⃣学习字母操 letter Zz
2️⃣学习字母大小写
3️⃣学习字母发音及相关单词

—相关单词
1️⃣zero 数字0
2️⃣zoo 动物园
3️⃣zebra 斑马🦓
4️⃣zipper 拉链

—重点句型👇
1️⃣Z is for ….

—拓展句型表达：
1. Zero is a number.
（零是一个数字。）
2. I go to the zoo.
（我去动物园。）
3. I see a zebra.
（我看到一只斑马。）
4. I pull my zipper.
（我拉我的拉链。）

3.日常口语对话：提升听力能力

4.课堂完成书写
————————————
🌞【家庭作业】:
口语作业💬
1️⃣观看外教老师指读视频
2️⃣.跟读指读视频
————————————
[Sun]【今日课堂小结】
今日学习字母Z，孩子们回去需要多跟读多复习哦！`,
  "lesson-unit-6-fruits": `📆【今日学习内容】
————————————
👩‍🏫教学目标
💙学习《Students Book》Unit 6 Fruit 主题词汇：
1️⃣apple 苹果🍎
2️⃣pear 梨🍐
3️⃣orange 橘子🍊
4️⃣watermelon 西瓜🍉

—拓展单词
1️⃣pineapple 菠萝🍍
2️⃣mango 芒果🥭

💙学习句子
What fruit do you like?
I like...

🌞【家庭作业】:
跟读课堂音频，复习水果单词和重点句型。
————————————
[Sun]【今日课堂小结】
同学们今天表现超棒哒！因为周日上冰沙活动课，我们前置教学水果词汇。回家也要多多复习呦！`,
  "lesson-smoothie-diy": `LG1上课内容🧑‍🏫
————————
一、本节课课堂主题🍍
水果冰沙DIY特色英语实践课，将生活场景与英语学习结合，学习水果、制作工具、健康饮食相关英文词汇与问答句型。

二、本节课学习知识点📖
1. 核心词汇
（1）水果 Fruits
apple 苹果、dragon fruit 火龙果、mango 芒果、kiwifruit 奇异果……
（2）制作工具&材料 Materials
ice cube 冰块、sugar / syrup 糖/糖浆、blender 搅拌机、cup 杯子、straw 吸管…

2. 核心问答句型
3. 询问喜好
Q：What fruit do you like? 你喜欢什么水果？
A：I like … 我喜欢……

2. 询问制作材料
Q：What do we need to make smoothie? 做冰沙我们需要什么？
A：We need … 我们需要……

三、课堂实操环节
1. 单词认读：全班看图认读所有水果、工具单词，老师带读纠正发音；

2. 听力输入：外教老师全英文进行冰沙制作的操作

3. DIY手工实践：全员动手制作菠萝冰沙，制作过程中外教引导全程操作与用到的材料；

4. 品尝分享：品尝自制冰沙，用英文描述口感。

四、书写手臂肌肉训练：
1. 涂色书写：给作业纸上水果、工具图案涂色
———————
作业内容✍️
口语作业：跟读下发作业纸（3遍）`
};

export function getSeedDailyContent(lessonId: string) {
  return seedDailyContent[lessonId] || "";
}

export const seedReviewLessons: ReviewLesson[] = [
  {
    id: "lesson-letter-x",
    title: "Letter Xx-Zz 总复习",
    dateLabel: "今日课堂",
    theme: "Super ABC",
    summary: "字母 Xx～Zz、相关单词和课堂重点句型。",
    teacherText:
      "A is for Apple / letter Xx / X-ray X光片 / six 六 / box 盒子，箱子 / ox 公牛 / I see an X-ray. / I have six toys. / This is my box. / The ox is big. / letter Yy / yogurt 酸奶酪 / yawn 打哈欠 / yak 牦牛 / yacht 游艇 / I like yogurt. / I am tired. I yawn. / The yak is big. / We see a yacht. / letter Zz / zero 数字0 / zoo 动物园 / zebra 斑马 / zipper 拉链 / Zero is a number. / I go to the zoo. / I see a zebra. / I pull my zipper.",
    dailyContent: seedDailyContent["lesson-letter-x"],
    items: [
      buildReviewItem("A is for Apple", "字母歌曲 A-Z", "歌曲复习", "letter"),
      buildReviewItem("X-ray", "X 光片"),
      buildReviewItem("six", "六"),
      buildReviewItem("box", "盒子，箱子"),
      buildReviewItem("ox", "公牛"),
      buildReviewItem("I see an X-ray.", "我看到一张 X 光片。", "重点句型", "sentence"),
      buildReviewItem("I have six toys.", "我有六个玩具。", "重点句型", "sentence"),
      buildReviewItem("This is my box.", "这是我的盒子。", "重点句型", "sentence"),
      buildReviewItem("The ox is big.", "这头公牛很大。", "重点句型", "sentence"),
      buildReviewItem("yogurt", "酸奶酪"),
      buildReviewItem("yawn", "打哈欠"),
      buildReviewItem("yak", "牦牛"),
      buildReviewItem("yacht", "游艇"),
      buildReviewItem("I like yogurt.", "我喜欢酸奶酪。", "重点句型", "sentence"),
      buildReviewItem("I am tired. I yawn.", "我累了，我打哈欠。", "重点句型", "sentence"),
      buildReviewItem("The yak is big.", "这头牦牛很大。", "重点句型", "sentence"),
      buildReviewItem("We see a yacht.", "我们看到一艘游艇。", "重点句型", "sentence"),
      buildReviewItem("zero", "数字 0"),
      buildReviewItem("zoo", "动物园"),
      buildReviewItem("zebra", "斑马"),
      buildReviewItem("zipper", "拉链"),
      buildReviewItem("Zero is a number.", "零是一个数字。", "重点句型", "sentence"),
      buildReviewItem("I go to the zoo.", "我去动物园。", "重点句型", "sentence"),
      buildReviewItem("I see a zebra.", "我看到一只斑马。", "重点句型", "sentence"),
      buildReviewItem("I pull my zipper.", "我拉我的拉链。", "重点句型", "sentence")
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
    dailyContent: seedDailyContent["lesson-letter-y"],
    items: [
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
    dailyContent: seedDailyContent["lesson-letter-z"],
    items: [
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
    dailyContent: seedDailyContent["lesson-unit-6-fruits"],
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
    theme: "Fruits Smoothie DIY",
    summary: "水果、冰沙制作材料与喜好、材料问答句型。",
    teacherText:
      "apple 苹果 / dragon fruit 火龙果 / mango 芒果 / kiwifruit 奇异果 / pineapple 菠萝 / smoothie 冰沙 / ice cube 冰块 / sugar 糖 / syrup 糖浆 / blender 搅拌机 / cup 杯子 / straw 吸管 / What fruit do you like? / I like ... / What do we need to make smoothie? / We need ...",
    dailyContent: seedDailyContent["lesson-smoothie-diy"],
    items: [
      buildReviewItem("apple", "苹果"),
      buildReviewItem("dragon fruit", "火龙果"),
      buildReviewItem("mango", "芒果"),
      buildReviewItem("kiwifruit", "奇异果"),
      buildReviewItem("pineapple", "菠萝"),
      buildReviewItem("smoothie", "冰沙"),
      buildReviewItem("ice cube", "冰块"),
      buildReviewItem("sugar", "糖"),
      buildReviewItem("syrup", "糖浆"),
      buildReviewItem("blender", "搅拌机"),
      buildReviewItem("cup", "杯子"),
      buildReviewItem("straw", "吸管"),
      buildReviewItem("What fruit do you like?", "你喜欢什么水果？", "询问喜好", "sentence"),
      buildReviewItem("I like ...", "我喜欢……", "回答喜好", "sentence"),
      buildReviewItem(
        "What do we need to make smoothie?",
        "做冰沙我们需要什么？",
        "询问制作材料",
        "sentence"
      ),
      buildReviewItem("We need ...", "我们需要……", "回答制作材料", "sentence")
    ]
  }
];

export function parseReviewText(rawText: string) {
  const parsed = rawText
    .split(/\n|；|;/)
    .flatMap((line) => line.split(/\s+\/\s+/))
    .flatMap((line) => parseReviewLine(line))
    .filter(
      (item) =>
        Boolean(item.english) &&
        Boolean(item.chinese.trim()) &&
        (item.category === "word" || item.category === "sentence")
    );

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
    .replace(/[📆👩‍🏫🌞💬👇🧑‍🏫📖✍️🍍🦓]/gu, "")
    .replace(/^[\s—\-＿_【\]】]+|[\s—\-＿_【\]】]+$/g, "")
    .replace(/^[0-9①②③④⑤⑥⑦⑧⑨1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣8️⃣9️⃣.、)\s-]+/gu, "")
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
