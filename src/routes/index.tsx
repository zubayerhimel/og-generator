import { useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ControlPanel } from "@/components/studio/ControlPanel";
import { ExportDialog } from "@/components/studio/ExportDialog";
import { Preview } from "@/components/studio/Preview";
import { PreviewTester } from "@/components/studio/PreviewTester";
import { defaultState, type OGState } from "@/lib/og-types";
import { isLocalUrl, parseMeta, scrapeUrl, type ScrapedMeta } from "@/lib/scrape.functions";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "OG Studio — Open Graph image generator" },
      {
        name: "description",
        content:
          "Paste any URL, pull its metadata, customize a template and export a 1200×630 social preview image.",
      },
      { property: "og:title", content: "OG Studio — Open Graph image generator" },
      {
        property: "og:description",
        content: "Fetch metadata from any URL and export a polished social preview image.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
});

function Index() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<OGState>(defaultState);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scrape = useServerFn(scrapeUrl);

  const update = (patch: Partial<OGState>) => setState((s) => ({ ...s, ...patch }));

  const applyMeta = (meta: ScrapedMeta) => {
    update({
      title: meta.title || state.title,
      description: meta.description || state.description,
      badge: meta.siteName ? meta.siteName.toUpperCase().slice(0, 24) : state.badge,
      domain: meta.domain || state.domain,
      logoUrl: meta.logo ?? state.logoUrl,
      imageUrl: meta.image ?? state.imageUrl,
    });
    toast.success("Metadata loaded");
  };

  const fetchLocally = async (raw: string) => {
    const target = raw.startsWith("http") ? raw : `http://${raw}`;
    const res = await fetch(target, { mode: "cors" });
    const html = await res.text();
    applyMeta(parseMeta(html, target));
  };

  const handleFetch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      if (isLocalUrl(url)) {
        await fetchLocally(url).catch(() => {
          throw new Error("CORS");
        });
      } else {
        applyMeta(await scrape({ data: { url } }));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("LOCAL_URL") || msg === "CORS") {
        toast.error("Local dev server blocked the request", {
          description:
            "Add Access-Control-Allow-Origin: * to your dev server, or expose it with `npx localtunnel --port 3000` and paste the public URL.",
          duration: 9000,
        });
      } else {
        toast.error("Couldn't fetch that URL", {
          description: msg || "Enter the details manually below.",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto min-h-screen w-full max-w-[1500px] px-5 py-8 lg:px-10">
      <Toaster position="top-center" />
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-semibold">OG Studio</h1>
            <p className="text-xs text-muted-foreground">
              Metadata in, share-ready image out.
            </p>
          </div>
        </div>
        <ExportDialog canvasRef={canvasRef} state={state} />
      </header>

      <section className="mt-8 rounded-2xl border border-border bg-card/70 p-4 shadow-[var(--shadow-panel)] backdrop-blur">
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleFetch()}
            placeholder="https://your-site.com  or  localhost:3000"
            className="h-11 flex-1"
            aria-label="URL to fetch metadata from"
          />
          <Button onClick={handleFetch} disabled={loading} className="h-11 sm:w-40">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            {loading ? "Fetching" : "Fetch metadata"}
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Localhost URLs are fetched straight from your browser — enable CORS on your dev
          server or tunnel it with <code>npx localtunnel --port 3000</code>.
        </p>
      </section>

      <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="lg:sticky lg:top-8 lg:self-start">
          <Preview state={state} canvasRef={canvasRef} />
        </div>
        <aside className="rounded-2xl border border-border bg-card/70 p-5 shadow-[var(--shadow-panel)] backdrop-blur">
          <ControlPanel state={state} update={update} />
        </aside>
      </div>

      <PreviewTester />
    </main>
  );
}
