# Design QA

## 验证范围

- 参考图：`codex-clipboard-b5fd70f4-edf4-44ac-887b-7091c9a4e23c.png`（底部设置抽屉）
- 参考图：`codex-clipboard-69ed6ca2-b932-4355-8f1a-d4a90034e414.png`（设置入口）
- 参考图：`codex-clipboard-a611db99-bd4e-4090-8bb0-3d2ac3d0fbc5.png`（发音按钮与翻译）
- 参考图：`codex-clipboard-f80e3e6d-8924-41a3-9cd1-5e0d3467aa0b.png`（复习列表）
- 参考图：`codex-clipboard-31692362-af8c-42ac-a6a7-f0310a18e5bf.png`（横向统计）
- 参考图：`codex-clipboard-0e60e96c-cb49-43f7-b0eb-8a3204d2e20a.png`（移除顶部编辑按钮）
- 参考图：`codex-clipboard-9ff7b0ed-2fc3-4060-9781-6802e4fcf773.png`（步骤按钮位置）
- 参考图：`codex-clipboard-b2985afd-e370-493e-80fe-5db1abac1ffe.png`（移除课程标题栏）
- 参考图：`codex-clipboard-b35830ff-cfeb-4ec9-a423-9e9a90fa413f.png`（图标单行滚动）
- 参考图：`codex-clipboard-b62e18cc-b0bf-4115-9e80-6e466ec28ff8.png`（紧凑布局）
- 参考图：`codex-clipboard-e2377c7f-e3dc-4a17-acf7-8ed93dc89627.png`（长单词拼写）
- 参考图：`codex-clipboard-b75930f7-8c91-46a0-bcc5-a8343ea14be1.png`（拼写显示开关）
- 参考图：`codex-clipboard-579ba5c9-ee42-47a6-9a8f-1479e7f80e3b.png`（长问题单行显示）
- 参考图：`codex-clipboard-7aaabbcb-d27f-420c-830d-612c9aec2a4f.png`（短标题页面高度）
- 参考图：`codex-clipboard-8d149506-5aeb-4eb0-948f-af1be1355c13.png`（长标题页面高度）
- 参考图：`codex-clipboard-2cc1728b-4436-47df-94a6-86424e6de9cf.png`（单词音标位置）
- 实现截图：`/tmp/vancy-sentence-layout-final.jpg`
- 实现截图：`/tmp/vancy-settings-list-final.jpg`
- 实现截图：`/tmp/vancy-summary-layout-final.jpg`
- 实现截图：`/tmp/vancy-question-single-line-final.jpg`
- 实现截图：`/tmp/vancy-fixed-height-kiwi.png`
- 实现截图：`/tmp/vancy-fixed-height-pineapple.png`
- 实现截图：`/tmp/vancy-phonetic-blender-final.png`
- 验证视口：390 x 844 手机视口

## 对照结果

- 全局对照：`/tmp/vancy-settings-full-comparison.png`
- 设置入口局部对照：`/tmp/vancy-settings-trigger-comparison.png`
- 设置抽屉局部对照：`/tmp/vancy-settings-drawer-comparison.png`
- 学习卡对照：`/tmp/vancy-study-comparison-v2.jpg`
- 复习列表对照：`/tmp/vancy-list-comparison-v2.jpg`
- 横向统计对照：`/tmp/vancy-summary-comparison-v2.jpg`
- 顶部操作对照：`/tmp/vancy-top-controls-comparison.jpg`
- 步骤导航对照：`/tmp/vancy-step-navigation-comparison.jpg`
- 标题栏移除对照：`/tmp/vancy-header-removal-comparison.jpg`
- 横向图标条对照：`/tmp/vancy-horizontal-strip-comparison.jpg`
- 紧凑布局对照：`/tmp/vancy-compact-layout-comparison.jpg`
- 拼写单行对照：`/tmp/vancy-spelling-nowrap-comparison.jpg`
- 拼写默认隐藏对照：`/tmp/vancy-spelling-toggle-comparison.jpg`
- 长问题单行对照：`/tmp/vancy-question-nowrap-comparison.jpg`
- 固定高度页面对照：`/tmp/vancy-fixed-height-comparison.png`
- 单词音标位置对照：`/tmp/vancy-phonetic-comparison.png`
- 拼写设置截图：`/tmp/vancy-spelling-setting-final.jpg`
- 设置入口位于内容导航之后、下一步按钮之前，顺序和间距稳定。
- 设置抽屉采用底部弹出结构，包含标题、关闭按钮、三段切换和当前内容列表。
- 课程列表在手机宽度下使用两列，避免长标题挤压；色彩、字体和圆角沿用当前项目样式。
- 顶部品牌、添加复习日、恢复示例和课程切换区域已移除。
- 页面快速添加区已移除，复习列表已迁入复习设置。
- 字母、单词、句子统计稳定横向显示为三列。
- 发音按钮位于翻译旁边，计算尺寸为 52 x 52，圆角为 50%。
- 主图下方说明文字已移除，主图区域提升至 220px 高，图片字号提升至 10rem。
- 顶部编辑按钮已移除，复习设置入口移动到学习卡最顶部。
- 上一个与下一个并排放置在图片正下方，内容导航位于步骤按钮之后。
- 课程标题栏已完整移除，复习设置后直接显示进度。
- 图标导航强制单行显示，可独立横向滚动且滚动条隐藏。
- 发音按钮缩小为 44px，内容导航图标缩小为 38px，并压缩学习卡纵向间距。
- 拼写区按字母数量动态分列，长单词使用较小字号并始终保持单行。
- 复习设置新增“显示拼写”开关，首次进入默认关闭。
- 关闭时整行拼写不渲染，开启后显示并记住用户选择。
- 学习问题固定单行显示，按文本长度自动缩放字号，避免长问题换行撑高页面。
- 标题、翻译、拼写、图片、步骤按钮和图标导航均使用固定高度轨道，切换内容时下方模块不再偏移。
- 单词页在中文翻译左侧显示 IPA 音标，字母和句子页保持原有翻译布局。

## 交互验证

- 复习内容：可以切换复习日，切换后关闭抽屉并更新当前内容。
- 复习列表：设置抽屉内完整显示当前 29 项内容，选择后回到对应学习卡。
- 添加复习日：五个表单项和保存按钮正常显示。
- 恢复示例：确认弹窗正常打开，取消后数据不变且抽屉保持可用。
- 页面无横向溢出，设置入口始终位于下一步按钮上方。
- 步骤导航验证为 13 / 29 → 14 / 29 → 13 / 29，前进和返回均正常。
- 图标条 `flex-wrap` 为 `nowrap`、`overflow-x` 为 `auto`，实测滚动距离为 46px。
- 图标条滚动时页面宽度保持 390px，无整页横向溢出。
- `pineapple` 的 9 个字母保持单行，字号为 18.88px。
- `watermelon` 的 10 个字母保持单行，字号自动降至 16px。
- 首次加载时拼写隐藏；开启并刷新后仍显示；关闭并刷新后仍隐藏。
- `What do we need to make smoothie?` 在 390px 手机视口下以 18px 单行完整显示，无裁切和横向溢出。
- 短单词 `straw` 保持 43px 大字号，长短内容切换时排版稳定。
- 在 390 x 844 视口连续切换水果冰沙全部 17 项后，标题区、图片、步骤按钮、图标条及内容面板的坐标差值均为 0px。
- 拼写开启时，单词页和句子页均保留 54px 拼写轨道；实测学习卡高度均为 490px，图片与内容面板位置一致。
- `blender` 实测显示 `/ˈblendər/`，音标无截断；翻译轨道保持 44px，切换到句子后图片坐标不变。
- 当前内置课程的单词均有音标映射，句子与字母内容未渲染音标。
- 页面自身无控制台错误；Chrome 翻译扩展出现的网络超时与项目无关。
- Chrome 控制台仅有 Vite 连接调试信息，无错误或警告。
- `pnpm build` 通过；仅保留原有的第三方 PURE 注释和大分包提示。

## 问题分级

- P0：无
- P1：无
- P2：无
- P3：长课程标题在课程卡片中使用省略号，属于手机布局的预期处理。

## 修订记录

1. 移除页面顶部操作区。
2. 在下一步按钮上方新增复习设置入口。
3. 将复习内容切换、添加复习日、恢复示例统一迁入底部设置抽屉。
4. 完成参考图并排对照、交互回归、控制台检查和生产构建。
5. 移除“添加到当前复习日”区域。
6. 将复习列表迁入复习设置抽屉。
7. 将课程统计调整为横向三列。
8. 将圆形发音按钮移到翻译旁边。
9. 移除主图说明并放大主图展示。
10. 移除课程信息栏右侧编辑按钮。
11. 将复习设置入口移动到页面顶部。
12. 将上下步按钮并排放到图片下方。
13. 移除课程标题信息栏。
14. 将内容图标改为单行横向滚动。
15. 缩小发音按钮和内容导航图标，并收紧整体间距。
16. 将拼写区改为动态单行网格并按长度缩小字号。
17. 在复习设置中新增默认关闭且可持久化的“显示拼写”开关。
18. 将问题标题改为单行显示，并按内容长度在 12px 至 43px 之间自动缩放。
19. 固定学习卡全部内容轨道高度，并为无拼写内容保留等高占位，消除逐项切换偏移。
20. 在单词翻译左侧增加 IPA 音标，并保持固定高度与非单词页面布局稳定。

final result: passed
