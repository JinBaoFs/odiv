"use client"

import { useMemo, useState } from "react"
import type { MdxPostMetadata, Locale } from "@/lib/mdx-posts"
import { formatPostDate, getDateYear } from "@/lib/date"
import { Link } from "@/i18n/navigation"

type BlogListProps = {
  posts: MdxPostMetadata[]
  locale: Locale
  initialQuery?: string
  labels: {
    search: string
    searchLabel: string
    posts: string
    noResults: string
  }
}

function fuzzyMatch(value: string, query: string): boolean {
  const source = value.toLocaleLowerCase().replace(/\s+/g, " ")
  const target = query.toLocaleLowerCase().trim()
  if (!target || source.includes(target)) return true

  let queryIndex = 0
  for (const character of source) {
    if (character === target[queryIndex]) queryIndex += 1
    if (queryIndex === target.length) return true
  }
  return false
}

export function BlogList({ posts, locale, initialQuery = "", labels }: BlogListProps) {
  const [query, setQuery] = useState(initialQuery)

  const groups = useMemo(() => {
    const words = query.trim().split(/\s+/).filter(Boolean)
    const filteredPosts = posts.filter((post) => {
      const searchableText = [post.title, post.description, ...(post.tags ?? [])].join(" ")
      return words.every((word) => fuzzyMatch(searchableText, word))
    })
    const groupedPosts = new Map<number, MdxPostMetadata[]>()

    filteredPosts.forEach((post) => {
      const year = getDateYear(post.date)
      groupedPosts.set(year, [...(groupedPosts.get(year) ?? []), post])
    })

    return [...groupedPosts.entries()]
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, yearPosts]) => ({ year, posts: yearPosts }))
  }, [posts, query])

  return (
    <>
      <div className="blog-search">
        <svg aria-hidden="true" className="blog-search-icon" viewBox="0 0 24 24" fill="none">
          <path
            d="m21 21-4.35-4.35m2.35-5.15a7.5 7.5 0 1 1-15 0 7.5 7.5 0 0 1 15 0Z"
            stroke="currentColor"
            strokeLinecap="round"
            strokeWidth="1.8"
          />
        </svg>
        <label className="srOnly" htmlFor="blog-search-input">{labels.searchLabel}</label>
        <input
          id="blog-search-input"
          className="blog-search-input"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={labels.search}
          autoComplete="off"
        />
      </div>

      {groups.length > 0 ? (
        <div className="blog-groups" aria-live="polite">
          {groups.map((group) => (
            <section className="blog-year-group" key={group.year}>
              <div className="blog-year-heading">
                <h2>{group.year}</h2>
                <span>{group.posts.length} {labels.posts}</span>
              </div>
              <ul className="blog-post-list">
                {group.posts.map((post) => (
                  <li className="blog-post" key={post.slug}>
                    <time dateTime={post.date}>{formatPostDate(post.date, locale)}</time>
                    <Link href={`/blog/${post.slug}`} className="blog-post-title">
                      {post.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <p className="blog-empty" role="status">{labels.noResults}</p>
      )}
    </>
  )
}
