import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  FONTS,
  PRESETS,
  TEMPLATES,
  type OGState,
  type Preset,
} from "@/lib/og-types";

type Props = {
  state: OGState;
  update: (patch: Partial<OGState>) => void;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-10 cursor-pointer rounded-md border border-border bg-transparent p-1"
          aria-label={label}
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="h-9" />
      </div>
    </Field>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
          {label}
        </Label>
        <span className="text-xs tabular-nums text-muted-foreground">
          {value}
          {suffix ?? ""}
        </span>
      </div>
      <Slider
        value={[value]}
        min={min}
        max={max}
        step={step}
        onValueChange={(v) => onChange(v[0] ?? value)}
      />
    </div>
  );
}

export function ControlPanel({ state, update }: Props) {
  const onUpload = (key: "logoUrl" | "imageUrl") => (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update({ [key]: String(reader.result) } as Partial<OGState>);
    reader.readAsDataURL(file);
  };

  return (
    <Tabs defaultValue="content" className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="style">Style</TabsTrigger>
        <TabsTrigger value="media">Media</TabsTrigger>
        <TabsTrigger value="templates">Presets</TabsTrigger>
      </TabsList>

      <TabsContent value="content" className="mt-5 space-y-5">
        <Field label="Title">
          <Textarea
            value={state.title}
            rows={3}
            onChange={(e) => update({ title: e.target.value })}
          />
        </Field>
        <Field label="Description">
          <Textarea
            value={state.description}
            rows={3}
            onChange={(e) => update({ description: e.target.value })}
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Badge">
            <Input value={state.badge} onChange={(e) => update({ badge: e.target.value })} />
          </Field>
          <Field label="Domain">
            <Input
              value={state.domain}
              onChange={(e) => update({ domain: e.target.value })}
            />
          </Field>
        </div>
      </TabsContent>

      <TabsContent value="style" className="mt-5 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <ColorField
            label="Gradient from"
            value={state.bgFrom}
            onChange={(v) => update({ bgFrom: v })}
          />
          <ColorField
            label="Gradient to"
            value={state.bgTo}
            onChange={(v) => update({ bgTo: v })}
          />
          <ColorField
            label="Text"
            value={state.textColor}
            onChange={(v) => update({ textColor: v })}
          />
          <ColorField
            label="Accent"
            value={state.accent}
            onChange={(v) => update({ accent: v })}
          />
        </div>
        <SliderField
          label="Gradient angle"
          value={state.bgAngle}
          min={0}
          max={360}
          suffix="°"
          onChange={(v) => update({ bgAngle: v })}
        />
        <Field label="Font">
          <Select value={state.font} onValueChange={(v) => update({ font: v })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((f) => (
                <SelectItem key={f.value} value={f.value}>
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <SliderField
          label="Title size"
          value={state.titleSize}
          min={36}
          max={110}
          onChange={(v) => update({ titleSize: v })}
        />
        <SliderField
          label="Description size"
          value={state.descSize}
          min={16}
          max={48}
          onChange={(v) => update({ descSize: v })}
        />
        <SliderField
          label="Padding"
          value={state.padding}
          min={40}
          max={140}
          onChange={(v) => update({ padding: v })}
        />
        <div className="grid grid-cols-2 gap-4">
          <Field label="Alignment">
            <Select
              value={state.align}
              onValueChange={(v) => update({ align: v as OGState["align"] })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="left">Left</SelectItem>
                <SelectItem value="center">Center</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          <Field label="Size preset">
            <Select
              value={state.preset}
              onValueChange={(v) => update({ preset: v as Preset })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRESETS).map(([k, p]) => (
                  <SelectItem key={k} value={k}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <Label className="text-sm">Accent bar</Label>
          <Switch
            checked={state.showAccentBar}
            onCheckedChange={(v) => update({ showAccentBar: v })}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3 py-2">
          <Label className="text-sm">Film grain</Label>
          <Switch
            checked={state.showGrain}
            onCheckedChange={(v) => update({ showGrain: v })}
          />
        </div>
      </TabsContent>

      <TabsContent value="media" className="mt-5 space-y-5">
        <Field label="Image mode">
          <Select
            value={state.imageMode}
            onValueChange={(v) => update({ imageMode: v as OGState["imageMode"] })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No image</SelectItem>
              <SelectItem value="cover">Full-bleed background</SelectItem>
              <SelectItem value="side">Side panel</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field label="Image URL">
          <Input
            placeholder="https://…"
            value={state.imageUrl?.startsWith("data:") ? "" : (state.imageUrl ?? "")}
            onChange={(e) => update({ imageUrl: e.target.value || null })}
          />
        </Field>
        <Field label="Upload image">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => onUpload("imageUrl")(e.target.files?.[0])}
          />
        </Field>
        <SliderField
          label="Overlay darkness"
          value={Math.round(state.overlay * 100)}
          min={0}
          max={90}
          suffix="%"
          onChange={(v) => update({ overlay: v / 100 })}
        />
        <Field label="Logo URL">
          <Input
            placeholder="https://…/favicon.png"
            value={state.logoUrl?.startsWith("data:") ? "" : (state.logoUrl ?? "")}
            onChange={(e) => update({ logoUrl: e.target.value || null })}
          />
        </Field>
        <Field label="Upload logo">
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => onUpload("logoUrl")(e.target.files?.[0])}
          />
        </Field>
        <Button
          variant="secondary"
          onClick={() => update({ imageUrl: null, logoUrl: null, imageMode: "none" })}
        >
          Clear media
        </Button>
      </TabsContent>

      <TabsContent value="templates" className="mt-5">
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              onClick={() => update(t.patch)}
              className="group overflow-hidden rounded-xl border border-border text-left transition-colors hover:border-primary"
            >
              <div
                className="h-20 w-full"
                style={{
                  background: `linear-gradient(135deg, ${t.patch.bgFrom ?? state.bgFrom}, ${
                    t.patch.bgTo ?? state.bgTo
                  })`,
                }}
              />
              <div className="bg-secondary/50 px-3 py-2 text-sm">{t.name}</div>
            </button>
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}