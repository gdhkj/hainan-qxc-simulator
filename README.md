# 海南七星彩模拟盘

这是一个纯前端版本，适合直接打开或部署到 GitHub Pages。

特点：
- 无后端
- 无数据库
- 无真实交易
- 仅在浏览器本地存储状态（localStorage）
- 适合演示、学习和原型展示

## 直接打开

在浏览器中直接打开项目根目录下的 `index.html` 即可。无需安装任何依赖，也无需服务器。

## GitHub Pages

如果你想放到 GitHub Pages：

1. 打开 GitHub 仓库
2. 进入 Settings → Pages
3. Source 选 `Deploy from a branch`
4. 选择 `main` 分支，保存
5. GitHub 会生成一个站点地址

## 说明

- 数据保存在浏览器里的 `localStorage`
- 关闭页面后数据通常还在
- 浏览器清除缓存后会重置
- 这是一个演示项目，不涉及真实赌资或真实结算

## 目录架构

- `index.html`
- `styles.css`
- `app.js`

## 运行方式

本地直接双击打开即可：

```bash
open index.html
```

Windows 直接双击 `index.html`，或者在浏览器地址栏中输入本地文件路径即可。

## 注意

这不是正式生产系统，也不是真实下注系统；它只是一个纯前端原型。