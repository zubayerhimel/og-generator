import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { download } from "@/lib/render-og";
import { PRESETS, type OGState } from "@/lib/og-types";
import {
  FRAMEWORKS,
  PLACEMENT,
  buildSnippet,
  type FrameworkId,
} from "@/lib/meta-snippets";

const FORMATS = [
  { id: "png", label: "PNG", hint: "Best quality" },
  { id: "jpeg", label: "JPG", hint: "Smallest file" },
  { id: "webp", label: "WebP", hint: "Modern" },
] as const;

export function ExportDialog({
  canvasRef,
  state,
}: {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  state: OGState;
}) {
  const [format, setFormat] = useState<"png" | "jpeg" | "webp">("png");
  const [framework, setFramework] = useState<FrameworkId>("html");
  const { w, h } = PRESETS[state.preset];

  const snippet = buildSnippet(framework, state, format);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg">Export image</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Export your OG image</DialogTitle>
          <DialogDescription>
            Rendered at {w}×{h}. Pick a format and download.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Format
            </Label>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {FORMATS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  className={`rounded-lg border px-3 py-2 text-left transition-colors ${
                    format === f.id
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="text-sm font-medium">{f.label}</div>
                  <div className="text-xs text-muted-foreground">{f.hint}</div>
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Framework
            </Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {FRAMEWORKS.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFramework(f.id)}
                  title={f.hint}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                    framework === f.id
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-muted-foreground"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{PLACEMENT[framework]}</p>
          </div>
          <pre className="max-h-60 overflow-auto rounded-lg border border-border bg-secondary/50 p-3 text-xs text-muted-foreground">
            {snippet}
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button
              onClick={() => {
                const canvas = canvasRef.current;
                if (!canvas) return;
                download(canvas, format);
                toast.success("Image downloaded");
              }}
            >
              Download {format.toUpperCase()}
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await navigator.clipboard.writeText(snippet);
                toast.success("Meta tags copied");
              }}
            >
              Copy meta tags
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}