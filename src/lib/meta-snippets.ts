import { PRESETS, type OGState } from "@/lib/og-types";

export type FrameworkId =
  | "html"
  | "vite"
  | "nextjs"
  | "tanstack"
  | "nuxt"
  | "astro"
  | "sveltekit"
  | "remix";

export const FRAMEWORKS: { id: FrameworkId; label: string; hint: string }[] = [
  { id: "html", label: "HTML", hint: "Plain <head>" },
  { id: "vite", label: "Vite", hint: "index.html" },
  { id: "nextjs", label: "Next.js", hint: "App Router metadata" },
  { id: "tanstack", label: "TanStack Start", hint: "route head()" },
  { id: "nuxt", label: "Nuxt", hint: "useSeoMeta" },
  { id: "astro", label: "Astro", hint: "Layout head" },
  { id: "sveltekit", label: "SvelteKit", hint: "svelte:head" },
  { id: "remix", label: "Remix", hint: "meta export" },
];

const esc = (s: string) => s.replace(/"/g, "&quot;");
const js = (s: string) => JSON.stringify(s);

export function buildSnippet(
  framework: FrameworkId,
  state: OGState,
  format: "png" | "jpeg" | "webp",
): string {
  const { w, h } = PRESETS[state.preset];
  const ext = format === "jpeg" ? "jpg" : format;
  const site = state.domain?.trim() || "your-site.com";
  const origin = site.startsWith("http") ? site.replace(/\/$/, "") : `https://${site}`;
  const image = `${origin}/og-image.${ext}`;
  const title = state.title;
  const desc = state.description;
  const type = `image/${format === "jpeg" ? "jpeg" : format}`;

  switch (framework) {
    case "html":
    case "vite":
    case "astro":
      return `<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />

<meta property="og:type" content="website" />
<meta property="og:url" content="${origin}/" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(desc)}" />
<meta property="og:image" content="${image}" />
<meta property="og:image:type" content="${type}" />
<meta property="og:image:width" content="${w}" />
<meta property="og:image:height" content="${h}" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(desc)}" />
<meta name="twitter:image" content="${image}" />`;

    case "nextjs":
      return `// app/layout.tsx (or app/page.tsx)
import type { Metadata } from "next";

export const metadata: Metadata = {
  metadataBase: new URL(${js(origin)}),
  title: ${js(title)},
  description: ${js(desc)},
  openGraph: {
    type: "website",
    url: "/",
    title: ${js(title)},
    description: ${js(desc)},
    images: [{ url: ${js(`/og-image.${ext}`)}, width: ${w}, height: ${h} }],
  },
  twitter: {
    card: "summary_large_image",
    title: ${js(title)},
    description: ${js(desc)},
    images: [${js(`/og-image.${ext}`)}],
  },
};`;

    case "tanstack":
      return `// src/routes/index.tsx
export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: ${js(title)} },
      { name: "description", content: ${js(desc)} },
      { property: "og:type", content: "website" },
      { property: "og:url", content: ${js(`${origin}/`)} },
      { property: "og:title", content: ${js(title)} },
      { property: "og:description", content: ${js(desc)} },
      { property: "og:image", content: ${js(image)} },
      { property: "og:image:width", content: "${w}" },
      { property: "og:image:height", content: "${h}" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: ${js(image)} },
    ],
    links: [{ rel: "canonical", href: ${js(`${origin}/`)} }],
  }),
});`;

    case "nuxt":
      return `<script setup lang="ts">
useSeoMeta({
  title: ${js(title)},
  description: ${js(desc)},
  ogType: "website",
  ogUrl: ${js(`${origin}/`)},
  ogTitle: ${js(title)},
  ogDescription: ${js(desc)},
  ogImage: ${js(image)},
  ogImageWidth: ${w},
  ogImageHeight: ${h},
  twitterCard: "summary_large_image",
  twitterImage: ${js(image)},
});
</script>`;

    case "sveltekit":
      return `<svelte:head>
  <title>${esc(title)}</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${origin}/" />
  <meta property="og:title" content="${esc(title)}" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta property="og:image" content="${image}" />
  <meta property="og:image:width" content="${w}" />
  <meta property="og:image:height" content="${h}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:image" content="${image}" />
</svelte:head>`;

    case "remix":
      return `// app/routes/_index.tsx
import type { MetaFunction } from "@remix-run/node";

export const meta: MetaFunction = () => [
  { title: ${js(title)} },
  { name: "description", content: ${js(desc)} },
  { property: "og:type", content: "website" },
  { property: "og:url", content: ${js(`${origin}/`)} },
  { property: "og:title", content: ${js(title)} },
  { property: "og:description", content: ${js(desc)} },
  { property: "og:image", content: ${js(image)} },
  { property: "og:image:width", content: "${w}" },
  { property: "og:image:height", content: "${h}" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: ${js(image)} },
];`;
  }
}

export const PLACEMENT: Record<FrameworkId, string> = {
  html: "Paste inside <head> of your page.",
  vite: "Paste inside <head> of index.html.",
  nextjs: "Export from app/layout.tsx or a page for per-page tags.",
  tanstack: "Add to the route's head() option.",
  nuxt: "Place in the page's <script setup> block.",
  astro: "Paste inside <head> of your layout .astro file.",
  sveltekit: "Add to the top level of your +page.svelte.",
  remix: "Export a meta function from the route module.",
};