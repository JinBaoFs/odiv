// next.config.ts
import type { NextConfig } from "next"
import createMDX from "@next/mdx"
import rehypeHighlight from "rehype-highlight"
import createNextIntlPlugin from "next-intl/plugin"

// next-intl 插件
const withNextIntl = createNextIntlPlugin("./i18n/request.ts")

// 直接在 createMDX 里写 options
const withMDX = createMDX({
  extension: /\.mdx?$/,
  options: {
    remarkPlugins: [],
    rehypePlugins: [rehypeHighlight],
  },
})

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    typedRoutes: true,
  },
  pageExtensions: ["js", "jsx", "ts", "tsx", "mdx"],
}

export default withNextIntl(withMDX(nextConfig))