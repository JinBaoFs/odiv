// app/blog/[slug]/page.tsx
import { notFound } from "next/navigation"
import { getMdxPost } from "@/lib/mdx-posts"

type Props = {
  params: Promise<{ slug: string }>
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params

  try {
    const { metadata, Content } = await getMdxPost(slug)

    return (
      <main className="container">
        <article className="prose max-w-none">
          <h1>{metadata.title}</h1>
          <p className="text-sm">
            {new Date(metadata.date).toLocaleDateString("zh-CN")}
          </p>
          <Content />
        </article>
      </main>
    )
  } catch (error) {
    notFound()
  }
}