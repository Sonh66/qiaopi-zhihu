# GitHub Pages 部署与域名绑定

仓库： https://github.com/Sonh66/qiaopi-zhihu （公开）。

当前网站地址： https://sonh.me/qiaopi-zhihu/ 。项目继承账号已有主域名 `sonh.me`，https://sonh66.github.io/qiaopi-zhihu/ 会跳转到这个地址。GitHub Pages 已启用 HTTPS。

目标自定义域名：`qiaopi-zhihu.sonh.me`。

## 自动部署

GitHub Pages 的发布来源设为 GitHub Actions。每次向 `main` 推送代码，`.github/workflows/check.yml` 会检查 JavaScript、构建 `dist/`，再自动发布到 GitHub Pages。Pull request 只检查和打包，不会发布。

在仓库 Actions 页面可以查看构建与部署结果，也可手动运行 Website checks and GitHub Pages。默认网站使用仓库子路径，页面资源采用相对路径，支持该路径和后续自定义域名。

## 自定义域名

先在 `sonh.me` 当前 DNS 服务商的控制台添加：

| 类型 | 主机记录 | 目标 | TTL |
| --- | --- | --- | --- |
| CNAME | `qiaopi-zhihu` | `sonh66.github.io` | 自动或 300 秒 |

目标不填写 `https://`，不填写仓库路径，也不填写 `github.com`。如果存在同名旧记录，核对用途后修改为上述记录。使用 Cloudflare DNS 时，初次验证建议选择 DNS only（灰色云朵）。

解析生效后，在仓库 Settings → Pages → Custom domain 填写 `qiaopi-zhihu.sonh.me` 并保存。等待 DNS 检查与证书签发成功，再启用 Enforce HTTPS。

当前先使用已生效的 `sonh.me/qiaopi-zhihu/` 地址；目标子域名尚未发现 DNS 记录。子域名绑定后，现有 GitHub Pages 项目地址会重定向到该子域名。

本项目通过 GitHub Actions 发布；自定义域名以 Settings → Pages 中的配置为准，不需要为该工作流生成额外的 `CNAME` 文件。

## 本地构建

```sh
npm ci --ignore-scripts
npm run check
npm run build
```

`dist/` 仅包含运行页面、样式、脚本、图片和本地图标/动画库，不包含原始需求文档、测试输出、日志或 `node_modules/`。本地 `server.cjs` 仅供预览，GitHub Pages 不运行 Node 服务。
