# 侨批智护部署与域名绑定

目标域名：`qiaopi-zhihu.sonh.me`。

## Cloudflare Pages

该网站是纯静态页面，可连接私有 GitHub 仓库部署，不需要在服务器运行 Node 服务。

1. Cloudflare 控制台进入 Workers & Pages，创建 Pages 项目，连接 GitHub 仓库 `Sonh66/qiaopi-zhihu`。
2. 生产分支选择 `main`，框架预设选择 `None`，构建命令填写 `npm run build`，输出目录填写 `dist`，项目名可填写 `qiaopi-zhihu`。
3. 等待第一次部署成功，记录平台实际分配的 `<项目名>.pages.dev` 地址。项目名如已被占用，应使用实际地址。
4. 在 Pages 项目的 Custom domains 中添加 `qiaopi-zhihu.sonh.me`，根据平台提示完成验证和 DNS 设置。
5. 如果 `sonh.me` 的 DNS 已托管在 Cloudflare，可以由 Pages 自动配置记录。否则，在当前 DNS 服务商处添加下表中的 CNAME 记录。

| 类型 | 主机记录 | 目标 | TTL |
| --- | --- | --- | --- |
| CNAME | `qiaopi-zhihu` | Pages 实际分配的 `<项目名>.pages.dev` | 自动或 300 秒 |

目标值不填写 `https://`，也不填写路径。同名的旧记录如有冲突，先核对其用途再修改。先在 Pages 中添加自定义域名，再按提示设置 DNS，并等待证书与域名状态变为 Active。

## 其他静态托管平台

Vercel、Netlify 等也可导入该仓库，构建命令为 `npm run build`，输出目录为 `dist`。域名应在所选平台中添加，CNAME 目标以平台给出的值为准。

## GitHub Pages

本仓库初始为私有。GitHub Pages 对私有仓库的支持取决于账户方案；免费个人方案可使用公开仓库，或继续用支持私有仓库的静态托管平台。

如果后续改用 GitHub Pages，应设置 Pages 发布来源，并在发布目录增加内容为 `qiaopi-zhihu.sonh.me` 的 `CNAME` 文件，同时在 Pages 设置中添加这个自定义域名。其子域名 DNS 目标为 `sonh66.github.io`，不是 GitHub 仓库页面地址。

当前 GitHub Actions 只检查并打包网站，不会自动部署或修改域名。部署包可在 Actions 的成功运行页面下载。

## 本地构建

```sh
npm ci --ignore-scripts
npm run check
npm run build
```

`dist/` 仅包含运行页面、样式、脚本、图片和本地图标/动画库，不包含原始需求文档、测试输出、日志或 `node_modules/`。
