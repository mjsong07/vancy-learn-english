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
- 通过 Supabase Edge Function + PostgreSQL 同步复习内容和参考图片状态
- 内置 Letter Xx/Yy/Zz 字母单元和水果冰沙示例课

## 本地运行

```bash
pnpm install
pnpm dev
```

默认访问地址：`http://127.0.0.1:5173/`

## 构建

普通构建路径为 `/`：

```bash
pnpm build
```

GitHub Pages 使用仓库子路径构建：

```bash
pnpm build:github
```

## GitHub Pages + Supabase 部署

### 1. 创建 Supabase 数据表

在 Supabase 创建免费项目，然后进入 SQL Editor，执行：

```text
supabase/migrations/20260715000000_create_review_shared_state.sql
```

数据表已启用 RLS，`anon` 和 `authenticated` 角色不能直接访问；读写统一通过使用 service role 的 Edge Function 完成。

### 2. 部署 Edge Function

先登录并关联 Supabase 项目：

```bash
npx supabase login
npx supabase link --project-ref <项目 ID>
```

设置家庭编辑码。建议使用长度至少 16 位的随机值：

```bash
npx supabase secrets set REVIEW_EDIT_CODE=<家庭编辑码>
```

如果以后绑定了其他前端域名，可以增加允许跨域访问的来源，多个来源用英文逗号分隔：

```bash
npx supabase secrets set ALLOWED_ORIGINS=https://mjsong07.github.io
```

部署公开读取、编辑码保护写入的同步函数：

```bash
npx supabase functions deploy review-state --no-verify-jwt
```

同步接口地址格式如下：

```text
https://<项目 ID>.supabase.co/functions/v1/review-state
```

### 3. 配置 GitHub Pages

进入 GitHub 仓库的 `Settings > Secrets and variables > Actions > Variables`，添加仓库变量：

```text
VITE_REVIEW_SYNC_URL=https://<项目 ID>.supabase.co/functions/v1/review-state
```

推送到 `main` 后，`.github/workflows/pages.yml` 会使用 `pnpm build:github` 构建并部署到：

```text
https://mjsong07.github.io/vancy-learn-english/
```

### 4. 本地连接 Supabase

复制环境变量示例并填写同步接口：

```bash
cp .env.example .env.local
pnpm dev
```

首次进入应用时点击“同步云端”，输入 Edge Function 中配置的家庭编辑码，即可使用当前浏览器数据初始化 Supabase。

## 主要目录

```text
src/
├── App.vue
├── composables/useReviewLessons.ts
├── data/reviewLessons.ts
├── services/reviewSync.ts
├── services/speech.ts
├── styles/main.css
└── types/review.ts

supabase/
├── functions/review-state/index.ts
└── migrations/20260715000000_create_review_shared_state.sql
```
