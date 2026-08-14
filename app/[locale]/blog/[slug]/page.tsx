import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { formatPostFullDate } from "@/lib/date"
import { getMdxPost } from "@/lib/mdx-posts"
import type { Locale } from "@/lib/mdx-posts"
import { getLocale } from "next-intl/server"
import "./page.scss"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const locale = (await getLocale()) as Locale

  try {
    const { metadata, Content } = await getMdxPost(locale, slug)

    return (
      <main className="container overflow-hidden">
        <article className="prose max-w-none">
          <header className="blog-post-header">
            <time className="blog-post-date" dateTime={metadata.date}>
              {formatPostFullDate(metadata.date, locale)}
            </time>
            <h1>{metadata.title}</h1>
            {metadata.tags && metadata.tags.length > 0 ? (
              <ul className="blog-post-tags" aria-label={locale === "zh" ? "文章标签" : "Post tags"}>
                {metadata.tags.map((tag) => (
                  <li key={tag}>
                    <Link href={{ pathname: "/blog", query: { tag } }}>{tag}</Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </header>
          <div className="blog-post-content">
            <Content />
          </div>
        </article>
      </main>
    )
  } catch {
    notFound()
  }
}
