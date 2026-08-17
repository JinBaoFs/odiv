import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { Link } from "@/i18n/navigation"
import { formatPostFullDate } from "@/lib/date"
import { getMdxPost } from "@/lib/mdx-posts"
import { siteConfig } from "@/config/site"
import {
  absoluteUrl,
  createMetadata,
  localizedPath,
  normalizeLocale,
} from "@/lib/metadata"
import "./page.scss"

type Props = {
  params: Promise<{ locale: string; slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: localeParam, slug } = await params
  const locale = normalizeLocale(localeParam)

  try {
    const { metadata } = await getMdxPost(locale, slug)

    return createMetadata({
      title: metadata.title,
      description: metadata.description,
      locale,
      path: `/blog/${slug}`,
      image: metadata.cover,
      type: "article",
      publishedTime: metadata.date,
      modifiedTime: metadata.updatedAt ?? metadata.date,
      tags: metadata.tags,
    })
  } catch {
    notFound()
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { locale: localeParam, slug } = await params
  const locale = normalizeLocale(localeParam)

  try {
    const { metadata, Content } = await getMdxPost(locale, slug)
    const articleUrl = absoluteUrl(localizedPath(locale, `/blog/${slug}`))
    const blogUrl = absoluteUrl(localizedPath(locale, "/blog"))
    const imageUrl = metadata.cover ? absoluteUrl(metadata.cover) : undefined
    const jsonLd = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "BlogPosting",
          "@id": `${articleUrl}#article`,
          headline: metadata.title,
          description: metadata.description,
          url: articleUrl,
          mainEntityOfPage: articleUrl,
          datePublished: metadata.date,
          dateModified: metadata.updatedAt ?? metadata.date,
          inLanguage: locale === "zh" ? "zh-CN" : "en-US",
          keywords: metadata.tags?.join(", "),
          image: imageUrl,
          author: {
            "@type": "Person",
            "@id": `${siteConfig.url}/#person`,
            name: siteConfig.author,
            url: absoluteUrl(localizedPath(locale, "/about")),
          },
          publisher: {
            "@type": "Person",
            "@id": `${siteConfig.url}/#person`,
            name: siteConfig.author,
          },
        },
        {
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: locale === "zh" ? "首页" : "Home",
              item: absoluteUrl(localizedPath(locale)),
            },
            {
              "@type": "ListItem",
              position: 2,
              name: locale === "zh" ? "博客" : "Blog",
              item: blogUrl,
            },
            {
              "@type": "ListItem",
              position: 3,
              name: metadata.title,
              item: articleUrl,
            },
          ],
        },
      ],
    }

    return (
      <main className="container overflow-hidden">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
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
