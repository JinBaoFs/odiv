// mdx-components.tsx
import type { MDXComponents } from "mdx/types"
import Image, { type ImageProps } from "next/image"

const components: MDXComponents = {
  // 统一控制 MDX 里的 h1 样式
  h1: (props) => (
    <h1 className="mt-8 text-3xl font-bold" {...props} />
  ),
  // 让 MDX 里的 <img> 自动走 next/image
  img: (props) => (
    <Image
      sizes="100vw"
      style={{ width: "100%", height: "auto" }}
      {...(props as ImageProps)}
    />
  ),
}

export function useMDXComponents(): MDXComponents {
  return components
}