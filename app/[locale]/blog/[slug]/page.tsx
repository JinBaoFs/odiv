// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation"
import { getMdxPost } from "@/lib/mdx-posts"
import type { Locale } from "@/lib/mdx-posts"
import { getLocale } from 'next-intl/server';

type Props = {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const locale = await getLocale() as Locale;

  try {
    const { metadata, Content } = await getMdxPost(locale, slug)

    return (
      <main className="container">
        <article className="prose max-w-none">
          <h1 className="mb-0">{metadata.title}</h1>
          <p className="text-sm text03">
            {new Date(metadata.date).toLocaleDateString(locale === "zh" ? "zh-CN" : "en-US",)}
          </p>
          <Content />
        </article>
      </main>
    )
  } catch (error) {
    notFound()
  }
}