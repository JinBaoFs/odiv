# Personal Blog Starter

基于 Next.js 15 + TypeScript + React 的个人博客框架，包含：

- next-intl 多语言路由
- next-themes 深浅色切换
- 左侧固定菜单 / 右侧内容区滚动布局
- config/theme.ts 主题色集中配置
- 示例页面：首页、文章、项目、关于

## 启动

```bash
pnpm install
npm run dev
```

打开 `/zh` 或 `/en`。

## 主题色配置

在 `config/theme.ts` 中新增 palette，并在 `app/globals.css` 或你的主题注入逻辑中映射为 CSS 变量。

