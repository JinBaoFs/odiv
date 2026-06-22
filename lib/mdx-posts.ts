// lib/mdx-posts.ts
import fs from "node:fs/promises"
import path from "node:path"
import type { ComponentType } from "react"

export type Locale = "zh" | "en"

export type MdxPostMetadata = {
  title: string
  description: string
  date: string
  updatedAt?: string
  slug: string
  lang: Locale
  tags?: string[]
  cover?: string
  draft?: boolean
}

export type MdxPost = {
  metadata: MdxPostMetadata
  Content: ComponentType
}

function postsDirForLocale(locale: Locale) {
  return path.join(process.cwd(), "content", "posts", locale)
}

async function getMdxFileNames(locale: Locale): Promise<string[]> {
  const dir = postsDirForLocale(locale)
  const files = await fs.readdir(dir)
  return files.filter((file) => file.endsWith(".mdx"))
}

function fileNameToSlug(fileName: string) {
  return fileName.replace(/\.mdx$/, "")
}

// 列表：按 locale 返回该语言下所有文章 meta
export async function listMdxPosts(locale: Locale): Promise<MdxPostMetadata[]> {
  const fileNames = await getMdxFileNames(locale)
  const dir = postsDirForLocale(locale)

  const posts: MdxPostMetadata[] = []

  for (const fileName of fileNames) {
    const slugFromFile = fileNameToSlug(fileName)
    const mod = await import(
      // 注意这里路径从 lib/ 到 content/posts/locale
      `../content/posts/${locale}/${slugFromFile}.mdx`
    )
    const meta = mod.metadata as MdxPostMetadata

    posts.push({
      ...meta,
      slug: meta.slug ?? slugFromFile,
      lang: meta.lang ?? locale,
      tags: meta.tags ?? [],
    })
  }

  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

// 详情：按 locale + slug 找一篇文章
export async function getMdxPost(
  locale: Locale,
  slug: string,
): Promise<MdxPost> {
  if (!slug) {
    throw new Error("getMdxPost: slug is required")
  }

  const mod = await import(
    `../content/posts/${locale}/${slug}.mdx`
  )

  if (!mod?.metadata || !mod?.default) {
    throw new Error(`MDX ${locale}/${slug} 缺少 metadata 或默认导出`)
  }

  const meta = mod.metadata as MdxPostMetadata

  return {
    metadata: {
      ...meta,
      slug: meta.slug ?? slug,
      lang: meta.lang ?? locale,
      tags: meta.tags ?? [],
    },
    Content: mod.default as ComponentType,
  }
}