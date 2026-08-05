import { getTranslations, getLocale } from "next-intl/server"
import type { Locale } from "@/lib/mdx-posts"
import { listMdxPosts } from "@/lib/mdx-posts"
import { Iconfont } from "@/components/icon-font"
import { BlogList } from "./blog-list"
import "./page.scss"

type Props = {
  searchParams: Promise<{ tag?: string | string[] }>
}

export default async function BlogListPage({ searchParams }: Props) {
  const t = await getTranslations("Blog")
  const desc = t("description")
  const locale = (await getLocale()) as Locale
  const posts = await listMdxPosts(locale)
  const params = await searchParams
  const tag = Array.isArray(params.tag) ? params.tag[0] : params.tag
  return (
    <main className="container">
      <div className="o-title">
        <Iconfont name="icon-blog" size={42} tx={-8}/>
        <h1 className="o-title-text">{t("title")}</h1>
      </div>
      <div
        className="o-desc mt-2"
        dangerouslySetInnerHTML={{__html: desc}}
      />
      <BlogList
        posts={posts}
        locale={locale}
        initialQuery={tag ?? ""}
        labels={{
          search: t("searchPlaceholder"),
          searchLabel: t("searchLabel"),
          posts: t("posts"),
          noResults: t("noResults"),
        }}
      />
    </main>
  )
}
