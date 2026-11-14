# edgetunnel-pages

Automated js-confuser pipeline for `cmliu/edgetunnel` on Cloudflare Pages.

## 工作流说明

1. 动态拉取上游最新 `_worker.js`
2. 提取 2.4MB 经文注释暂存
3. 使用 `js-confuser` 对核心 JS 进行现代 AST 混淆（无固定特征签名）
4. 混淆完成后缝合经文并输出至 `release` 分支
5. Cloudflare Pages 监听 `release` 分支自动部署
