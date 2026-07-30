# AGENTS.md

本文档用于约束在本仓库中工作的开发者和 AI Agent。修改代码前，请先阅读本文件以及相关目录中的实现。

## 项目概述

oDiv 是一个基于 Next.js App Router 的中英双语个人博客 Starter，支持：

- MDX 博客文章
- `zh` / `en` 国际化路由
- 明暗主题和可配置主题色板
- 响应式侧边栏与移动端导航
- 项目、关于等内容页面
- 基于 ECharts 的 FOMO/代币经济模拟工具

## 技术栈

- Next.js 15
- React 19
- TypeScript
- next-intl
- next-themes
- MDX
- ECharts
- CSS、SCSS、PostCSS
- pnpm

## 常用命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm lint
```

提交改动前，至少运行与改动范围相匹配的检查。涉及路由、构建配置、MDX 或服务端组件时，应优先运行 `pnpm build`。如果命令因项目现有配置或依赖问题失败，需要明确记录失败命令和原因。

## 目录约定

```text
app/                 Next.js App Router 页面、布局、API 和全局样式
app/[locale]/        带语言前缀的页面
components/          可复用 React 组件
config/              站点信息和主题配置
content/posts/       按语言划分的 MDX 文章
i18n/                next-intl 路由、请求和导航配置
lib/                 MDX 读取、元数据等服务端工具
messages/            中英文翻译文件
public/              静态资源
```

## 开发约束

### TypeScript 与 React

- 新增业务代码使用 TypeScript，不新增 JavaScript 业务文件。
- 保持 `strict` 类型检查，不使用无必要的 `any`、类型断言或 `@ts-ignore`。
- 默认使用服务端组件；只有需要状态、事件、浏览器 API 或客户端 Hook 时才添加 `"use client"`。
- 不要在服务端组件中直接访问 `window`、`document` 或其他浏览器 API。
- 遵循 App Router 约定；当前动态路由中的 `params` 使用异步形式。
- 使用 `@/` 路径别名引用项目根目录模块。

### 国际化

- 当前仅支持 `zh` 和 `en`，默认语言为 `zh`。
- 普通页面必须位于 `app/[locale]` 下，URL 始终包含语言前缀。
- 新增用户可见文本时，应同步更新 `messages/zh.json` 和 `messages/en.json`。
- 不要在组件中硬编码本应翻译的界面文本。
- 修改语言列表时，需要同步检查 `config/site.ts`、`i18n/routing.ts`、消息文件和文章目录。

### 路由与导航

- 新增或修改页面后，检查导航项是否存在对应路由。
- 内部链接优先使用项目的国际化导航封装；使用原生 `next/link` 时，必须确认语言前缀能够正确保留。
- `middleware.ts` 不处理 API、Next.js 内部资源和带扩展名的静态文件。
- Next.js 已启用 typed routes，不要用不必要的强制断言绕过路由类型。

### MDX 文章

- 中文文章放在 `content/posts/zh`，英文文章放在 `content/posts/en`。
- 文件使用 `.mdx` 后缀，文件名应与文章 slug 保持一致。
- 每篇文章必须默认导出 MDX 内容，并导出符合以下结构的 `metadata`：

```ts
{
  title: string
  description: string
  date: string
  slug: string
  lang: "zh" | "en"
  updatedAt?: string
  tags?: string[]
  cover?: string
  draft?: boolean
}
```

- 日期推荐使用 `YYYY-MM-DD` 格式。
- `draft: true` 的文章不会出现在文章列表中。
- 同一内容存在双语版本时，两个语言目录应使用相同文件名和 slug。

### 样式与主题

- 优先复用 `app/styles` 中的现有变量、布局和组件类。
- 不要在多个组件中重复硬编码颜色、间距和断点。
- 主题色板集中维护在 `config/theme.ts`。
- 新增色板时必须同时提供完整的 `light` 和 `dark` token。
- 修改主题相关样式时，需要同时验证明暗模式。
- 页面专属 SCSS 可与页面放在同一目录；通用样式应放入共享样式文件。

### FOMO 工具

- `app/[locale]/fomo-tool` 是客户端计算与可视化页面。
- 修改计算逻辑时，应保留输入校验和 `MAX_ITERATIONS` 安全上限。
- ECharts 实例必须在组件卸载时释放，并正确响应窗口尺寸和主题变化。
- 金融或代币模拟结果仅用于演示和计算，不应表述为投资建议。

## 修改原则

- 只修改完成任务所必需的文件，避免无关重构。
- 不覆盖或回退用户已有但尚未提交的改动。
- 不提交 `.next`、`node_modules`、环境变量、日志或其他生成文件。
- 不在代码、文档或配置中写入密钥、Token、真实账号或私人信息。
- 修改依赖时同时更新 `package.json` 和 `pnpm-lock.yaml`。
- 不混用 npm、Yarn 和 pnpm 生成锁文件；本项目以 pnpm 为准。
- 保持文件为 UTF-8 编码，避免中文乱码。

## 完成标准

完成任务前应确认：

1. 改动符合现有目录和架构。
2. 中英文文案保持同步。
3. 桌面端和移动端布局没有明显退化。
4. 明暗主题均可正常使用。
5. 没有引入新的 TypeScript 或构建错误。
6. 文档与实际行为一致。

