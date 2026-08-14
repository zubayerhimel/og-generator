import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle, CheckCircle2, Loader2, ScanSearch, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { auditUrl, type AuditResult, type CheckStatus } from "@/lib/audit.functions";

const ICONS: Record<CheckStatus, typeof CheckCircle2> = {
  pass: CheckCircle2,
  warn: AlertTriangle,
  fail: XCircle,
};

const TONE: Record<CheckStatus, string> = {
  pass: "text-[hsl(var(--accent))]",
  warn: "text-yellow-400",
  fail: "text-destructive",
};

export function PreviewTester() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const audit = useServerFn(auditUrl);

  const run = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      setResult(await audit({ data: { url } }));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg.includes("LOCAL_URL")
          ? "Localhost can't be tested — expose it with a tunnel first"
          : "Couldn't test that URL",
        { description: msg.includes("LOCAL_URL") ? undefined : msg || "Try again." },
      );
    } finally {
      setLoading(false);
    }
  };

  const failures = result?.checks.filter((c) => c.status === "fail").length ?? 0;

  return (
    <section className="mt-8 rounded-2xl border border-border bg-card/70 p-5 shadow-[var(--shadow-panel)] backdrop-blur">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold">Social preview tester</h2>
          <p className="text-xs text-muted-foreground">
            Check whether a live page exposes correct Open Graph and Twitter tags.
          </p>
        </div>
        {result ? (
          <span className="rounded-full border border-border px-3 py-1 text-xs tabular-nums">
            Score {result.score}/100 · {failures} missing
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
          placeholder="https://your-site.com/page"
          className="h-11 flex-1"
          aria-label="URL to test social tags for"
        />
        <Button
          onClick={run}
          disabled={loading}
          variant="secondary"
          className="h-11 sm:w-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <ScanSearch className="h-4 w-4" />
          )}
          {loading ? "Testing" : "Test tags"}
        </Button>
      </div>

      {result ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <div className="overflow-hidden rounded-xl border border-border bg-secondary/40">
            {result.image ? (
              <img
                src={result.image}
                alt={`Social preview image for ${result.domain}`}
                className="aspect-[1.91/1] w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="flex aspect-[1.91/1] items-center justify-center text-xs text-muted-foreground">
                No preview image found
              </div>
            )}
            <div className="space-y-1 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">
                {result.domain}
              </p>
              <p className="line-clamp-2 text-sm font-medium">
                {result.title || "No title detected"}
              </p>
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {result.description || "No description detected"}
              </p>
            </div>
          </div>

          <ul className="space-y-2">
            {result.checks.map((c) => {
              const Icon = ICONS[c.status];
              return (
                <li
                  key={c.key}
                  className="flex gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2"
                >
                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${TONE[c.status]}`} />
                  <div className="min-w-0">
                    <p className="font-mono text-xs">{c.label}</p>
                    <p className="truncate text-sm">{c.value ?? "—"}</p>
                    <p className="text-xs text-muted-foreground">{c.note}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
