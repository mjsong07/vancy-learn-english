# Vancy 英语复习

为 4 岁孩子准备的课后英语听读复习工具。家长可以按上课日期录入老师发来的单词和句子，孩子逐张查看内容并点击播放英文发音。

## 功能

- 按日期创建和切换复习内容
- 粘贴老师发来的课堂总结，自动拆分英文单词和句子
- 单独添加英文与中文释义
- 逐张显示单词、字母或句子
- 使用浏览器语音朗读英文
- 自动记录每个复习日的学习进度
- 数据保存在当前浏览器的 `localStorage`
- 内置 Letter Xx/Yy/Zz 字母单元和水果冰沙示例课

## 本地运行

```bash
pnpm install
pnpm dev
```

默认访问地址：`http://127.0.0.1:5173/vancy-learn-english/`

## 构建

```bash
pnpm build
```

Vite 的部署路径配置为 `/vancy-learn-english/`。如果部署到其他子路径，请同步修改 `vite.config.ts` 中的 `base`。

## 主要目录

```text
src/
├── App.vue
├── composables/useReviewLessons.ts
├── data/reviewLessons.ts
├── services/speech.ts
├── styles/main.css
└── types/review.ts
```
