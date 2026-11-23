"use client";

import { ArrowRight, Check, Inbox, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ChartFrame, SERIES, STATUS, VBarChart } from "@/components/charts/charts";
import { Logo, LogoMark } from "@/components/brand/logo";
import { DrawingSheet } from "@/components/domain/drawing-sheet";
import { FileDrop, FileRow } from "@/components/domain/file-drop";
import { SiteMap } from "@/components/domain/site-map";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Breadcrumbs, KeyValues, Metric, Panel, Stepper, Tag, Timeline } from "@/components/ui/display";
import { Callout, EmptyState, ProgressBar, SimulatedTag, Skeleton, Spinner } from "@/components/ui/feedback";
import { Checkbox, ChoiceCard, Field, Input, RadioGroup, SegmentedControl, Select, Switch, Textarea } from "@/components/ui/form";
import { Accordion, ConfirmDialog, Tabs, TabsContent, TabsList, TabsTrigger, Tooltip } from "@/components/ui/overlay";
import { toast } from "@/components/ui/toast";

const COLORS: Array<[string, string, string]> = [
  ["Navy 900", "#14263D", "Structure, primary dark surfaces"],
  ["Slate", "#304A68", "Secondary structure, icons"],
  ["Teal 600", "#167D8D", "Action, progress, focus"],
  ["Amber 500", "#E7A23B", "Attention, “your plot”, demo labels"],
  ["Canvas", "#F4F7FA", "Workspace background"],
  ["Surface", "#FFFFFF", "Panels, forms"],
  ["Ink", "#253244", "Body text (12.6:1 on white)"],
  ["Muted", "#5A6A7E", "Secondary text (5.6:1 on white)"],
];

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className="scroll-mt-24 border-t border-line py-12">
      <h2 id={`${id}-t`} className="mb-6 font-display text-xl font-semibold text-ink-strong">
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  const [seg, setSeg] = useState<"a" | "b" | "c">("a");
  const [confirm, setConfirm] = useState(false);
  const [sw, setSw] = useState(true);
  return (
    <div className="min-h-dvh bg-canvas">
      <header className="on-dark border-b border-navy-950 bg-navy-900 text-on-dark">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Logo onDark subtitle="Design system" />
          <Link href="/" className="text-sm text-on-dark-muted hover:text-white">
            Public portal →
          </Link>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-6xl px-6 pb-24 pt-12">
        <p className="kicker">ECPS design system · v0.1</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-[-0.025em] text-ink-strong">Government trust, architectural precision, product craft.</h1>
        <p className="mt-4 max-w-2xl text-muted">Tokens and components used across the public portal, applicant workspace and RAJUK internal workspace. See DESIGN_SYSTEM.md for rationale and accessibility notes.</p>
        <nav aria-label="Sections" className="mt-8 flex flex-wrap gap-2 text-sm">
          {["colour", "type", "buttons", "forms", "status", "data", "feedback", "domain"].map((s) => (
            <a key={s} href={`#${s}`} className="rounded-full border border-line bg-surface px-3 py-1 capitalize text-ink hover:border-teal-600">
              {s}
            </a>
          ))}
        </nav>

        <Section id="colour" title="Colour">
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {COLORS.map(([n, hex, use]) => (
              <li key={n} className="overflow-hidden rounded-lg border border-line bg-surface">
                <div className="h-16" style={{ background: hex }} />
                <div className="p-3">
                  <p className="text-sm font-semibold text-ink-strong">{n}</p>
                  <p className="ref text-xs text-muted">{hex}</p>
                  <p className="mt-1 text-xs text-muted">{use}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm font-medium text-ink-strong">Chart palette (validated: lightness band, chroma, CVD ΔE ≥ 8, contrast ≥ 3:1)</p>
          <div className="mt-2 flex gap-2">
            {[...SERIES, STATUS.critical].map((c) => (
              <span key={c} className="ref flex items-center gap-2 rounded-md border border-line bg-surface px-2 py-1 text-xs">
                <span className="size-3 rounded-sm" style={{ background: c }} /> {c}
              </span>
            ))}
          </div>
        </Section>

        <Section id="type" title="Typography">
          <div className="space-y-4">
            <p className="font-display text-5xl font-semibold tracking-[-0.03em] text-ink-strong">Manrope display 48</p>
            <p className="font-display text-2xl font-semibold text-ink-strong">Manrope heading 24</p>
            <p className="max-w-prose text-[0.9375rem] leading-relaxed text-ink">Inter body 15/24 — interface text is set for long reading sessions with comfortable line length and tabular figures where numbers align.</p>
            <p className="ref text-sm text-ink-strong">IBM Plex Mono · CP-26-Z4-01491 · RS Dag 1681</p>
            <p lang="bn" className="text-lg text-ink-strong">
              নোটো সান্স বাংলা — প্লট থেকে অনুমোদন পর্যন্ত একটি স্পষ্ট পথ।
            </p>
            <p className="kicker">Kicker · section index</p>
          </div>
        </Section>

        <Section id="buttons" title="Buttons & actions">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="navy">Navy</Button>
            <Button variant="accent">Accent</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="subtle">Subtle</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="danger-outline">Danger outline</Button>
            <Button loading>Loading</Button>
            <Button disabled>Disabled</Button>
            <Button size="sm">
              Small <ArrowRight />
            </Button>
            <Tooltip content="Icon buttons always carry an accessible name">
              <Button variant="secondary" size="icon" aria-label="Search">
                <Search />
              </Button>
            </Tooltip>
            <Button variant="secondary" onClick={() => setConfirm(true)}>
              Yes/No confirmation
            </Button>
            <Button variant="secondary" onClick={() => toast.success("Saved", "Toasts announce politely to screen readers.")}>
              Toast
            </Button>
          </div>
        </Section>

        <Section id="forms" title="Forms">
          <div className="grid gap-6 md:grid-cols-2">
            <Field label="Text field" hint="Hint text explains format." required>
              {(a) => <Input {...a} placeholder="Placeholder" />}
            </Field>
            <Field label="With error" error="Enter an 11-digit mobile number starting with 01." required>
              {(a) => <Input {...a} defaultValue="0170" />}
            </Field>
            <Field label="Select" optional>
              {(a) => (
                <Select {...a}>
                  <option>Zone 4</option>
                </Select>
              )}
            </Field>
            <Field label="Search">{(a) => <Input {...a} leading={<Search />} placeholder="Search" />}</Field>
            <Field label="Textarea" className="md:col-span-2">
              {(a) => <Textarea {...a} rows={3} />}
            </Field>
            <div className="flex flex-wrap items-center gap-6">
              <label className="flex items-center gap-2 text-sm">
                <Checkbox defaultChecked /> Checkbox
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Switch checked={sw} onCheckedChange={setSw} aria-label="Switch" /> Switch
              </label>
              <SegmentedControl label="Segmented" value={seg} onChange={setSeg} options={[{ value: "a", label: "Mine", count: 3 }, { value: "b", label: "Zone" }, { value: "c", label: "All" }]} />
            </div>
            <RadioGroup defaultValue="x" className="grid gap-2" aria-label="Choice cards">
              <ChoiceCard value="x" title="Choice card" description="Radio option with explanation." />
              <ChoiceCard value="y" title="Another option" meta={<Badge tone="warning">New</Badge>} />
            </RadioGroup>
            <div className="space-y-2">
              <FileDrop label="Upload control" sampleName="sample.pdf" onUploaded={(f) => toast.success(`Uploaded ${f.name}`)} />
              <FileRow name="ground_floor_sheet.pdf" sizeKb={940} meta="v2" status="verified" onRemove={() => undefined} />
            </div>
          </div>
        </Section>

        <Section id="status" title="Status & identity">
          <div className="flex flex-wrap items-center gap-2">
            {(["neutral", "info", "progress", "warning", "danger", "success", "accent"] as const).map((t) => (
              <Badge key={t} tone={t}>
                {t}
              </Badge>
            ))}
            <Tag>CP</Tag>
            <SimulatedTag />
            <Avatar name="Nusrat Jahan Chowdhury" />
            <Avatar name="Md. Rafiqul Islam" size="sm" />
          </div>
          <p className="mt-3 text-sm text-muted">Badge dots differ in shape by tone (circle, half, diamond, square) so status never relies on colour alone.</p>
        </Section>

        <Section id="data" title="Data display">
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Panel" description="Section container with header">
              <KeyValues items={[{ k: "Zone", v: "Zone 4" }, { k: "RS dag", v: "1681", mono: true }, { k: "Plot area", v: "401 m²" }, { k: "Road", v: "12 m" }]} />
            </Panel>
            <div className="grid grid-cols-2 gap-3">
              <Metric label="In my tray" value={3} icon={Inbox} />
              <Metric label="Over limit" value={2} tone="danger" hint="Escalated" />
            </div>
            <ChartFrame title="Chart frame" series={[{ key: "a", label: "Within" }, { key: "b", label: "Over", color: STATUS.critical }]} table={{ columns: ["Stage", "Within", "Over"], rows: [["FD", 2, 0], ["BI", 3, 1], ["AO", 2, 1]] }} height={200}>
              <VBarChart data={[{ s: "FD", a: 2, b: 0 }, { s: "BI", a: 3, b: 1 }, { s: "AO", a: 2, b: 1 }]} xKey="s" stacked series={[{ key: "a", label: "Within" }, { key: "b", label: "Over", color: STATUS.critical }]} />
            </ChartFrame>
            <Panel title="Timeline & stepper">
              <div className="grid gap-6 sm:grid-cols-2">
                <Timeline items={[{ id: "1", title: "Forwarded → AO", meta: "today", tone: "current" }, { id: "2", title: "Inspection", meta: "2 d", body: "Site verified.", tone: "success" }, { id: "3", title: "Received", meta: "5 d" }]} />
                <Stepper current={1} steps={[{ id: "a", label: "Property", state: "complete" }, { id: "b", label: "Owners", state: "current" }, { id: "c", label: "Documents", state: "upcoming" }]} />
              </div>
            </Panel>
          </div>
          <Tabs defaultValue="t1" className="mt-6">
            <TabsList>
              <TabsTrigger value="t1">Tab one</TabsTrigger>
              <TabsTrigger value="t2">Tab two</TabsTrigger>
            </TabsList>
            <TabsContent value="t1" className="pt-4 text-sm text-muted">
              Line tabs for page sections.
            </TabsContent>
            <TabsContent value="t2" className="pt-4 text-sm text-muted">
              Second panel.
            </TabsContent>
          </Tabs>
          <Breadcrumbs className="mt-6" items={[{ label: "Inbox", href: "#" }, { label: "CP-26-Z4-01491" }]} />
        </Section>

        <Section id="feedback" title="Feedback, loading & empty states">
          <div className="grid gap-4 md:grid-cols-2">
            <Callout tone="info" title="Info">Neutral guidance.</Callout>
            <Callout tone="success" title="Success">Action completed.</Callout>
            <Callout tone="warning" title="Warning">Needs attention.</Callout>
            <Callout tone="danger" title="Error">Something failed.</Callout>
            <Callout tone="demo" title="Demonstration">Explicitly simulated behaviour.</Callout>
            <div className="space-y-3 rounded-lg border border-line bg-surface p-4">
              <ProgressBar value={0.62} label="Progress" />
              <div className="flex items-center gap-3">
                <Spinner className="text-teal-600" label="Loading" /> <Skeleton className="h-4 flex-1" />
              </div>
            </div>
            <EmptyState icon={Check} title="Empty state" body="Explains why nothing is shown and what to do next." className="md:col-span-2" />
          </div>
          <Accordion className="mt-6" items={[{ id: "a", q: "Accordion question", a: "Answer text with comfortable measure." }]} />
        </Section>

        <Section id="domain" title="Domain components">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="overflow-hidden rounded-lg border border-line">
              <DrawingSheet kind="site" title="Site plan" page={1} total={6} appRef="CP-26-Z4-01491" project="Ten-storey residential building, Dhanmondi R/A" version={3} storeys={10} signatures={[{ slot: 1, name: "Nasima Begum", designation: "AAO", date: "21 Nov 2026", serial: "DEMO-0418" }]} previewSlot={2} previewName="Md. Rafiqul Islam · AO" />
            </div>
            <SiteMap lat={23.7461} lng={90.3742} height={260} />
          </div>
          <div className="mt-6 flex items-center gap-4">
            <LogoMark className="size-14" />
            <p className="max-w-md text-sm text-muted">The RAJUK emblem is used exactly as supplied (public/brand/rajuk-logo.png). Its white areas are transparent, so it always sits on a white disc to stay correct on navy and dark surfaces.</p>
          </div>
        </Section>
      </main>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} eyebrow="CP-26-Z4-01491" title="Forward to Authorized Officer?" description="You will no longer hold this file." confirmLabel="Yes, forward" onConfirm={() => setConfirm(false)} />
    </div>
  );
}
