import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog-article";
import { getPost, getSite } from "@/lib/api";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.title,
    alternates: { canonical: `/blog/${post.slug}` },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [post, site] = await Promise.all([getPost(slug), getSite()]);
  if (!post) notFound();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-5 lg:py-8">
      <BlogArticle post={post} cover={site.cover} />
    </div>
  );
}
