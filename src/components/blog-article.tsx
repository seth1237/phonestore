import Image from "next/image";
import { FacebookIcon, LinkedinIcon } from "./icons";
import type { BlogPost } from "@/lib/types";

function RichText({ text, strong = [] }: { text: string; strong?: string[] }) {
  if (!strong.length) return <>{text}</>;
  const pattern = new RegExp(`(${strong.map((item) => item.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "g");
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, index) =>
        strong.includes(part) ? <strong key={`${part}-${index}`}>{part}</strong> : <span key={`${part}-${index}`}>{part}</span>,
      )}
    </>
  );
}

export function BlogArticle({ post, cover }: { post: BlogPost; cover: string }) {
  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/blog/${post.slug}`;

  return (
    <article className="flex h-full w-full max-w-[1440px] flex-col items-start justify-center space-y-[1.5rem] rounded-2xl p-4 font-rubik lg:p-10">
      <header className="flex w-full flex-col items-center justify-between space-y-10 px-4 pt-5 lg:px-0">
        <div className="flex w-full flex-col items-center justify-start pb-7 lg:w-1/2 lg:pb-0">
          <div className="flex flex-row items-center justify-center space-x-2 rounded-2xl bg-secondary-soft px-3 py-1.5 text-xs font-medium text-secondary">
            <p className="rounded-2xl bg-white px-2 py-0.5 font-medium">{post.kicker}</p>
          </div>
          <h1 className="my-4 max-w-lg text-center text-2xl font-bold">{post.title}</h1>
        </div>
        <Image
          src={cover}
          alt={post.coverAlt}
          width={1200}
          height={700}
          priority
          className="h-[60vh] w-full overflow-hidden object-cover object-center"
        />
      </header>
      <section className="article w-full px-4 pt-10 pb-10 text-justify text-lg leading-[2.8rem] lg:px-[15.5rem]">
        {post.blocks.map((block, index) => {
          if (block.type === "paragraph") {
            return (
              <p key={index} className="mb-6">
                <RichText text={block.text} strong={block.strong} />
              </p>
            );
          }
          if (!block.src) return null;
          return (
            <Image
              key={index}
              src={block.src}
              alt={block.alt}
              width={900}
              height={700}
              className="my-6 h-auto w-full rounded-md object-cover"
            />
          );
        })}
      </section>
      <footer className="w-full px-4 lg:px-[15.7rem]">
        <div className="mx-auto mt-12 flex w-full flex-col items-center justify-between space-y-6 border-t-2 border-black pt-8 pb-10 md:flex-row md:space-y-0">
          <p className="text-base font-semibold text-black">Share this post</p>
          <div className="flex flex-row items-center space-x-3">
            <a
              className="cursor-pointer rounded-lg border-2 border-black p-2.5"
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on X"
            >
              <span className="block text-sm font-bold">X</span>
            </a>
            <a
              className="cursor-pointer rounded-lg border-2 border-black p-2.5"
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on Facebook"
            >
              <FacebookIcon size={18} />
            </a>
            <a
              className="cursor-pointer rounded-lg border-2 border-black p-2.5"
              href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(shareUrl)}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Share on LinkedIn"
            >
              <LinkedinIcon size={18} />
            </a>
          </div>
        </div>
      </footer>
    </article>
  );
}
