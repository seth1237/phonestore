"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

const SLIDES = ["/bg.png", "/bg1.png"];
const INTERVAL_MS = 5000;

export function HeroSlideshow() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActive((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-y-0 right-0 hidden h-full w-[65%] lg:block"
    >
      {SLIDES.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt=""
          fill
          sizes="(min-width: 1024px) 65vw, 0px"
          priority={index === 0}
          className={`object-cover object-right transition-opacity duration-1000 ease-in-out motion-reduce:transition-none ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}