// lib/mdx-posts.ts
import fs from "node:fs/promises"
import path from "node:path"
import type { ComponentType } from "react"

// 和 MDX 文件里导出的 metadata 对应
export type MdxPostMetadata = {
  title: string
  description: string
  date: string
  updatedAt?: string
  slug: string
  tags?: string[]
  cover?: string
  draft?: boolean
}

// 详情页用：带上 MDX 组件
export type MdxPost = {
  metadata: MdxPostMetadata
  Content: ComponentType
}

// 计算 content/posts 目录路径
const postsDir = path.join(process.cwd(), "content/posts")

// 工具：从文件名推 slug（去掉 .mdx 后缀）
function fileNameToSlug(fileName: string) {
  return fileName.replace(/\.mdx$/, "")
}

// 工具：读取目录里的所有 .mdx 文件名
async function getMdxFileNames(): Promise<string[]> {
  const files = await fs.readdir(postsDir)
  return files.filter((file) => file.endsWith(".mdx"))
}

/**
 * 列表页用：
 *  - 返回所有文章的 metadata（不含正文）
 *  - 按 date 从新到旧排序
 *  - 过滤掉 draft: true 的文章
 */
export async function listMdxPosts(): Promise<MdxPostMetadata[]> {
  const fileNames = await getMdxFileNames()

  const posts: MdxPostMetadata[] = []

  for (const fileName of fileNames) {
    const slugFromFile = fileNameToSlug(fileName)

    // IMPORTANT: 这里的相对路径基于 lib/ 在项目根
    const mod = await import(`../content/posts/${slugFromFile}.mdx`)
    const meta = mod.metadata as MdxPostMetadata

    const finalSlug = meta.slug ?? slugFromFile

    posts.push({
      ...meta,
      slug: finalSlug,
      tags: meta.tags ?? [],
    })
  }

  return posts
    .filter((p) => !p.draft)
    .sort((a, b) => +new Date(b.date) - +new Date(a.date))
}

/**
 * 详情页用：
 *  - 根据 slug 加载对应的 MDX
 *  - 返回 metadata + 默认导出的 MDX 组件
 */
export async function getMdxPost(slug: string): Promise<MdxPost> {
  if (!slug) {
    throw new Error("getMdxPost: slug is required")
  }

  // 这里假定 slug 就是文件名（不带 .mdx）
  const mod = await import(`../content/posts/${slug}.mdx`)

  if (!mod?.metadata || !mod?.default) {
    throw new Error(`MDX ${slug} 缺少 metadata 或默认导出`)
  }

  return {
    metadata: mod.metadata as MdxPostMetadata,
    Content: mod.default as ComponentType,
  }
}

/**
 * generateStaticParams / sitemap 等会用到：
 *  - 返回所有 slug 列表
 */
export async function getAllSlugs(): Promise<string[]> {
  const fileNames = await getMdxFileNames()

  // 如果你希望用 metadata.slug，则额外 import 一次
  const slugs: string[] = []

  for (const fileName of fileNames) {
    const slugFromFile = fileNameToSlug(fileName)
    const mod = await import(`../content/posts/${slugFromFile}.mdx`)
    const meta = mod.metadata as MdxPostMetadata
    slugs.push(meta.slug ?? slugFromFile)
  }

  // 去重一下，防止 metadata.slug 和文件名冲突
  return Array.from(new Set(slugs))
}