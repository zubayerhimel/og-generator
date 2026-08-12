import { useEffect, useRef } from "react";
import { PRESETS, type OGState } from "@/lib/og-types";
import { renderOG } from "@/lib/render-og";

export function Preview({
  state,
  canvasRef,
}: {
  state: OGState;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const { w, h } = PRESETS[state.preset];

  useEffect(() => {
    let cancelled = false;
    const draw = async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      try {
        await document.fonts.ready;
      } catch {
        /* noop */
      }
      if (!cancelled) await renderOG(canvas, state);
    };
    void draw();
    return () => {
      cancelled = true;
    };
  }, [state, canvasRef]);

  return (
    <div ref={wrapRef} className="w-full">
      <div
        className="relative w-full overflow-hidden rounded-2xl border border-border bg-secondary shadow-[var(--shadow-panel)]"
        style={{ aspectRatio: `${w} / ${h}` }}
      >
        <canvas ref={canvasRef} className="h-full w-full" />
      </div>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        Live render at {w}×{h} — exports at full resolution
      </p>
    </div>
  );
}