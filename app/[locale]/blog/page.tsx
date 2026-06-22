// app/blog/page.tsx
import Link from "next/link"
import { getTranslations, getLocale } from 'next-intl/server';
import type { Locale } from "@/lib/mdx-posts"
import { listMdxPosts } from "@/lib/mdx-posts"
import { Iconfont } from '@/components/icon-font';
import type { Route } from "next"

export default async function BlogListPage() {
  const t = await getTranslations('Blog');
  const desc = t('description');
  const locale = await getLocale() as Locale;
  const posts = await listMdxPosts(locale);
  return (
    <main className="container">
      <div className="o-title">
        <Iconfont name="icon-blog" size={42} tx={-8}/>
        <h1 className="o-title-text">{t('title')}</h1>
      </div>
      <div
        className="o-desc mt-2"
        dangerouslySetInnerHTML={{__html: desc}}
      />
      <ul className="space-y-4 mt-8">
        {posts.map((meta) => (
          <li key={meta.slug}>
            <Link
              href={`/blog/${meta.slug}` as Route}
              className="text-lg font-semibold"
            >
              {meta.title}
            </Link>
            <div className="text-sm text03">
              {new Date(meta.date).toLocaleDateString("zh-CN")}
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}