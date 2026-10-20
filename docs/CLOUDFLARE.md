# Cloudflare Pages + R2

## 准备媒体

运行 `npm run media:export`，导出到 `r2-media/`。同盘优先使用硬链接。将其中内容上传到 R2 bucket 根目录，保留路径，例如文件键 `wp-content/uploads/2025/05/banner-video.mp4`，不要多套一层 r2-media。

若使用已配置的 AWS CLI，可同步：

```sh
aws s3 sync r2-media/ s3://YOUR-BUCKET/ --endpoint-url https://YOUR-ACCOUNT-ID.r2.cloudflarestorage.com
```

账户和密钥使用本机凭据或环境变量，不放入源码。同步时保留正确 MIME 类型，特别是视频 video/mp4、字体 font/ttf、font/woff2。

为 bucket 配置公开自定义域名，如 `https://media.example.com`。参照 `cloudflare/r2-cors.json`，把允许来源替换成实际 Pages 域名和正式域名，允许 GET / HEAD 及视频 Range 请求。字体跨域也需要 CORS。

## 构建和部署前端

| Pages 设置 | 值 |
| --- | --- |
| 构建命令 | `npm run build:cloudflare` |
| 输出目录 | `dist` |
| Node.js | 22 或更新版本 |
| 环境变量 | `VITE_ASSET_BASE_URL=https://media.example.com` |

也可在 `.env.production.local` 设置变量后本地构建、上传：

```sh
npm run build:cloudflare
npx wrangler pages deploy dist --project-name soch-react
```

`wrangler.toml` 已配置输出目录。实际部署需要你的 Cloudflare 账户；当前未发布外网，也未写入凭据。

`public/_redirects` 配置 React Router 刷新回退。内容 JSON 和样式随前端部署；图片、字体、视频、附件地址在运行时及 CSS 构建阶段切换到 R2。构建产物不包含约 5.5 GB 媒体。

## 发布检查和更新

检查首页自动播放、内页刷新、字体请求、视频拖动的 206 响应、师资筛选、搜索和站外跳转。更改 R2 域名后须重新构建。Pages 分支预览域名也需加入 R2 CORS。

内容更新流程：修改项目 → 构建 → 发布新版本。新增媒体先同步 R2，再发布页面；回退前端时保留旧媒体。

官方参考：[Pages 构建配置](https://developers.cloudflare.com/pages/configuration/build-configuration/)、[R2 CORS](https://developers.cloudflare.com/r2/buckets/cors/)、[R2 公开 bucket](https://developers.cloudflare.com/r2/buckets/public-buckets/)。
