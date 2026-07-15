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
- 可通过 Cloudflare Pages Functions + D1 同步复习内容和参考图片
- 内置 Letter Xx/Yy/Zz 字母单元和水果冰沙示例课

## 本地运行

```bash
pnpm install
pnpm dev
```

默认访问地址：`http://127.0.0.1:5173/`

## 构建

```bash
pnpm build
```

默认构建路径为 `/`，适合 Cloudflare Pages。若要继续构建 GitHub Pages 子路径版本：

```bash
pnpm build:github
```

## Cloudflare 同步部署

1. 在 Cloudflare Pages 连接 GitHub 仓库 `mjsong07/vancy-learn-english`。
2. Build command 填 `pnpm build`，Build output directory 填 `dist`。
3. 创建 D1 database，例如 `vancy-learn-english-db`。
4. 在 Pages 项目的 Settings > Bindings 添加 D1 database binding，变量名固定为 `DB`。
5. 在 Variables and Secrets 添加 Secret，变量名固定为 `REVIEW_EDIT_CODE`，值为家庭编辑码。
6. 在 D1 Console 执行 `migrations/0001_create_review_shared_state.sql`。
7. 重新部署 Pages，让 binding 和 secret 生效。

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
