# Society Hub — React + Vite + TypeScript

正式应用在项目根目录。React 组件和结构化内容渲染页面，React Router 管理原站路径。不执行原站 WordPress / jQuery 脚本，不嵌入旧 HTML 页面。

## 本地运行

需要 Node.js 22 或更新版本。

```sh
npm install
npm run dev
```

打开 **http://127.0.0.1:5173/**。当前电脑已安装依赖，也可双击 **查看网站.cmd**。

```sh
npm run build
npm run preview
npm test
```

Vite 开发和构建预览读取 r2-media/ 素材，无需 Python。没有导出素材时会回退读取 mirror/ 的媒体文件；不会提供旧 HTML 或 JavaScript 应用。

## 后续修改

- src/components/：React 导航、轮播、师资筛选、招聘、搜索、课程展开等交互。
- public/content/routes.json：网址到页面文件的索引。覆盖 390 条采集记录，去除协议和末尾斜杠重复后为 367 个独立页面。
- public/content/pages/：各页面标题、正文结构、链接和图片引用；shared/：共享页头和页脚。
- public/content/faculty.json、careers.json：可独立维护的人员与招聘数据。
- public/theme/：原版样式迁移；src/overrides.css：兼容修正与新增样式。
- r2-media/：图片、字体、视频、附件，可直接同步到 R2。

内容节点为 {tag, attrs, children}，文字是普通字符串，由 React 创建 DOM。修改正文后同步 search.json 和 archives.json 的对应摘要。

后续直接通过对话提出“替换首页视频”“更新某位老师”“新增新闻”等需求，在此项目继续修改。

## 部署与历史文件

见 docs/CLOUDFLARE.md。前端部署 Pages，媒体放 R2，构建时通过 VITE_ASSET_BASE_URL 指定媒体域名。

mirror/、source-inspection/ 和 SOCH-Original-Mirror.zip 是历史采集资料，不是当前 React 版本源码。不要用旧 ZIP 覆盖项目。一次性迁移脚本 scripts/import-content.py 会重写内容文件，日常更新不要运行。

## 还原范围和限制

保留原站中英文内容、原字体、布局、图片和视频，并用 React 实现交互。原站语言开关本身隐藏，未凭空新增翻译。站外微信、招生和个人主页保留原地址。原站失效页面和资源记录在 public/content/migration-report.json。招聘与人员数据是采集时快照，更新时修改内容文件。

本地构建和功能检查不代表已在 Cloudflare 发布，也不构成每个页面逐像素一致的证明。验收记录见 docs/VERIFICATION.md。
