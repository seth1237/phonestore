import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog-article";
import { getPost, getSite } from "@/lib/api";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [post, site] = await Promise.all([getPost(slug), getSite()]);
  if (!post) return { title: "Blog" };
  return {
    title: post.title,
    description: post.title,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.title,
      url: absoluteSiteUrl(`/blog/${post.slug}`),
      images: [{ url: site.cover, alt: post.coverAlt }],
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.title,
      images: [site.cover],
    },
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
