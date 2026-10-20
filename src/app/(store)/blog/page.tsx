import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BlogArticle } from "@/components/blog-article";
import { getPosts, getSite } from "@/lib/api";
import { absoluteSiteUrl } from "@/lib/site-url";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const [posts, site] = await Promise.all([getPosts(), getSite()]);
  const post = posts[0];
  return {
    title: post?.title || "Blog",
    description: post?.title || `Stories and product notes from ${site.name}.`,
    alternates: { canonical: "/blog" },
    openGraph: {
      title: post?.title || "Blog",
      description: `Stories and product notes from ${site.name}.`,
      url: absoluteSiteUrl("/blog"),
      images: [site.cover],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: post?.title || "Blog",
      description: `Stories and product notes from ${site.name}.`,
      images: [site.cover],
    },
  };
}

export default async function BlogPage() {
  const [posts, site] = await Promise.all([getPosts(), getSite()]);
  const post = posts[0];
  if (!post) notFound();
  return (
    <div className="flex h-full w-full flex-col items-center justify-center py-5 lg:py-8">
      <BlogArticle post={post} cover={site.cover} />
    </div>
  );
}
