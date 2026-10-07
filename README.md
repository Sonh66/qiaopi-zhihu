# 侨批智护

数字丝路背景下的侨批 AIGC 合规研究工作台，覆盖项目建档、样本方案、素材审核、生成链路、授权分配、跨境规则、图片识别记录、授权决策、发布检查和 JSON 档案导出。

## 运行

```sh
npm install
npm start
```

打开 http://127.0.0.1:5173 。也可直接打开 `index.html`。浏览器运行资源保存在 `vendor/`，不依赖在线 CDN。使用其他端口时设置 `PORT` 环境变量。

## 界面与动画

GSAP 3.15.0 驱动方向转场、导航指示器、研究路线、生成结果和操作反馈。支持取消连续切换的旧动画、浏览器前进后退、深链接、移动端导航、键盘操作和系统减少动态效果设置。动画开关保存在本地；项目业务数据当前保存在内存中，刷新前应导出档案。

`design.css` 为当前界面样式，`motion.js` 管理导航与动画，`app.js` 管理原有业务规则。

## 部署

```sh
npm run build
```

网站部署到 GitHub Pages，当前访问地址为 https://sonh.me/qiaopi-zhihu/ 。该地址继承了账号已有的主域名；https://sonh66.github.io/qiaopi-zhihu/ 会跳转到该地址。推送到 `main` 后，GitHub Actions 自动检查代码、构建 `dist/` 并部署。目标自定义域名为 `qiaopi-zhihu.sonh.me`，其 CNAME 解析目标应为 `sonh66.github.io`。详细步骤见 [DEPLOYMENT.md](DEPLOYMENT.md)。

## 检查

```sh
npm run check
npm run test:ui
```

UI 检查使用当前 Codex 附带的 Playwright 和本机 Edge，输出在 `artifacts/`。其他环境可通过 `PLAYWRIGHT_MODULE` 指定 Playwright 模块路径。

## 功能边界

样本模块生成叙事方案与提示词。图片模块读取生成器元数据、参数片段并做基础视觉抽样，不能证明图片一定由 AI 生成；当前没有接入在线图片生成或视觉识别模型。合规输出使用项目内的示例规则，需按研究成果持续维护。

## 资源来源

- 动画库： https://github.com/greensock/GSAP ，许可：https://gsap.com/community/standard-license/
- 图标：Lucide，ISC 许可，见 `vendor/LUCIDE-LICENSE.txt`。
- `assets/qiaopi.jpg`：三猎摄影，潮州博物馆藏侨批，CC BY-SA 4.0。原图未经修改：https://commons.wikimedia.org/wiki/File:%E4%BE%A8%E6%89%B91.jpg ，许可：https://creativecommons.org/licenses/by-sa/4.0/ 。
- 业务需求来源：本机原始项目大纲与用户提供的功能图，未随网站仓库上传。

本次参考了 UI/UX Pro Max、frontend-design、gsap-motion 和 design-principles。Anthropic 官方 frontend-design 已另安装为 `anthropic-frontend-design`。GSAP 与 Claude Code 仓库是软件项目，不是可直接安装的 Codex skill。
