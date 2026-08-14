// mdx-components.tsx
import type { MDXComponents } from "mdx/types"

const components: MDXComponents = {
  // 统一控制 MDX 里的 h1 样式
  h1: (props) => (
    <h1 className="mt-8 text-3xl font-bold" {...props} />
  ),
  // Markdown 图片没有静态导入信息，无法自动为 next/image 提供宽高。
  // 使用原生图片元素保留图片自身比例，并由 .prose img 负责响应式尺寸。
  img: (props) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img loading="lazy" decoding="async" {...props} />
  ),
  // MDX 正文中的链接统一在新窗口打开，并隔离来源页面上下文。
  a: (props) => (
    <a {...props} target="_blank" rel="noopener noreferrer" />
  ),
}

export function useMDXComponents(): MDXComponents {
  return components
}
