// lib/metadata.ts
import type { Metadata } from "next"
import { siteConfig } from "@/config/site"

// 你可以按需要调整入参结构
type SeoInput = {
  title: string
  description: string
  path: string        // 相对路径，比如 "/"、"/blog"
  image?: string      // OG 图，默认用一张全站默认图
}

export function createMetadata({
  title,
  description,
  path,
  image = "/og/default.png",
}: SeoInput): Metadata {
  const url = ``

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: siteConfig.title,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  }
}