# oDiv

oDiv 是一个基于 Next.js 15、React 19 和 TypeScript 的中英双语个人博客 Starter。项目采用 App Router，以 MDX 管理文章，并内置主题切换、响应式导航和数据可视化示例。

## 功能

- 中文和英文双语路由
- 基于 MDX 的文章管理
- 明暗主题切换
- Ocean、Violet 可配置主题色板
- 固定侧边栏与移动端导航
- 博客、项目、关于等页面
- 代码语法高亮
- FOMO/代币经济模拟与 ECharts 图表
- Next.js typed routes

## 技术栈

- [Next.js](https://nextjs.org/) 15
- [React](https://react.dev/) 19
- [TypeScript](https://www.typescriptlang.org/)
- [next-intl](https://next-intl.dev/)
- [next-themes](https://github.com/pacocoursey/next-themes)
- [MDX](https://mdxjs.com/)
- [ECharts](https://echarts.apache.org/)
- CSS、SCSS、PostCSS
- pnpm

## 快速开始

### 环境要求

- Node.js：建议使用当前维护中的 LTS 版本
- pnpm：建议使用支持 lockfile v9 的版本

安装依赖：

```bash
pnpm install
```

启动开发服务器：

```bash
pnpm dev
```

打开以下地址：

- 中文站点：<http://localhost:3000/zh>
- 英文站点：<http://localhost:3000/en>

生产构建：

```bash
pnpm build
pnpm start
```

## 项目结构

```text
.
├─ app/
│  ├─ [locale]/          中英文页面和布局
│  ├─ api/               API Route
│  └─ styles/            全局与模块化样式
├─ components/           可复用组件
├─ config/               站点和主题配置
├─ content/posts/
│  ├─ zh/                中文 MDX 文章
│  └─ en/                英文 MDX 文章
├─ i18n/                 国际化路由与请求配置
├─ lib/                  MDX 读取和元数据工具
├─ messages/             中英文翻译
└─ public/               图片、图标等静态资源
```

## 路由

所有普通页面都带有语言前缀：

| 页面 | 中文路径 | 英文路径 |
| --- | --- | --- |
| 首页 | `/zh` | `/en` |
| 博客 | `/zh/blog` | `/en/blog` |
| 项目 | `/zh/projects` | `/en/projects` |
| 关于 | `/zh/about` | `/en/about` |
| FOMO 工具 | `/zh/fomo-tool` | `/en/fomo-tool` |

默认语言是中文，路由配置位于 `i18n/routing.ts`。

## 编写文章

文章按照语言放入对应目录：

```text
content/posts/zh/example.mdx
content/posts/en/example.mdx
```

每篇文章需要导出元数据：

```mdx
export const metadata = {
  title: "文章标题",
  description: "文章简介",
  date: "2026-07-30",
  slug: "example",
  lang: "zh",
  tags: ["Next.js"],
  draft: false
}

# 文章标题

这里是文章正文。
```

约定：

- 文件名与 `slug` 保持一致。
- `lang` 只能是 `zh` 或 `en`。
- `draft: true` 的文章不会显示在文章列表中。
- 文章按照 `date` 从新到旧排列。
- 双语文章建议使用相同的文件名和 slug。

## 国际化

界面翻译位于：

```text
messages/zh.json
messages/en.json
```

新增页面或界面文本时，应同步维护两个文件。当前支持的语言和默认语言需要在 `i18n/routing.ts` 与 `config/site.ts` 中保持一致。

## 主题配置

主题色板统一定义在 `config/theme.ts`。每个色板都需要提供完整的浅色和深色 token：

```ts
export const themePalettes = {
  example: {
    name: "Example",
    light: {
      // 浅色主题 token
    },
    dark: {
      // 深色主题 token
    }
  }
}
```

新增或修改主题时，请同时检查明暗模式以及移动端显示效果。

## 配置站点信息

站点名称、描述、语言、导航和社交链接位于 `config/site.ts`。部署前请替换示例社交链接和邮箱地址。

## 开发说明

- 项目使用 pnpm，请勿额外提交 npm 或 Yarn 锁文件。
- TypeScript 已开启严格模式。
- 默认使用服务端组件，需要浏览器 API、状态或事件时才使用客户端组件。
- `.env*`、`.next`、`node_modules` 和构建产物不会提交到 Git。
- 更完整的协作规范见 [AGENTS.md](./AGENTS.md)。

## License

本仓库目前未声明开源许可证。如需公开分发或允许第三方复用，请先添加合适的 `LICENSE` 文件。
