"use client";

import { X } from "lucide-react";
import { Accordion as RAccordion, Dialog as RDialog, DropdownMenu as RMenu, Popover as RPopover, Tabs as RTabs, Tooltip as RTooltip } from "radix-ui";
import { ChevronDown } from "lucide-react";
import { useState, type ComponentPropsWithoutRef, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

/* ———————————————————————————— Dialog ———————————————————————————— */

export const Dialog = RDialog.Root;
export const DialogTrigger = RDialog.Trigger;
export const DialogClose = RDialog.Close;

export function DialogContent({
  title,
  description,
  children,
  footer,
  className,
  size = "md",
  hideClose,
  eyebrow,
}: {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  hideClose?: boolean;
  eyebrow?: ReactNode;
}) {
  const width = { sm: "max-w-md", md: "max-w-lg", lg: "max-w-2xl", xl: "max-w-4xl" }[size];
  return (
    <RDialog.Portal>
      <RDialog.Overlay className="fixed inset-0 z-50 bg-navy-950/45 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
      <RDialog.Content
        className={cn(
          "fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-lg focus:outline-none data-[state=open]:animate-scale-in",
          width,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-6 pb-4 pt-5">
          <div className="min-w-0 space-y-1">
            {eyebrow && <div className="kicker">{eyebrow}</div>}
            <RDialog.Title className="font-display text-lg font-semibold text-ink-strong">{title}</RDialog.Title>
            {description ? (
              <RDialog.Description className="text-sm leading-relaxed text-muted">{description}</RDialog.Description>
            ) : (
              <RDialog.Description className="sr-only">{typeof title === "string" ? title : "Dialog"}</RDialog.Description>
            )}
          </div>
          {!hideClose && (
            <RDialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close dialog" className="-mr-2 -mt-1">
                <X />
              </Button>
            </RDialog.Close>
          )}
        </div>
        {children && <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>}
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line bg-surface-2 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </RDialog.Content>
    </RDialog.Portal>
  );
}

/**
 * Yes/No confirmation before moving or submitting a file (TOR 1.4 "confirmation signal").
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  confirmLabel = "Yes, continue",
  cancelLabel = "No, go back",
  onConfirm,
  tone = "primary",
  loading,
  confirmDisabled,
  eyebrow,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  tone?: "primary" | "danger" | "navy";
  loading?: boolean;
  confirmDisabled?: boolean;
  eyebrow?: ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={(o) => !loading && onOpenChange(o)}>
      <DialogContent
        size="sm"
        title={title}
        description={description}
        eyebrow={eyebrow}
        footer={
          <>
            <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
              {cancelLabel}
            </Button>
            <Button variant={tone === "danger" ? "danger" : tone === "navy" ? "navy" : "primary"} onClick={onConfirm} loading={loading} disabled={confirmDisabled}>
              {confirmLabel}
            </Button>
          </>
        }
      >
        {children}
      </DialogContent>
    </Dialog>
  );
}

/* ———————————————————————————— Sheet (side drawer) ———————————————————————————— */

export function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  side = "right",
  className,
  footer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  side?: "right" | "left";
  className?: string;
  footer?: ReactNode;
}) {
  return (
    <RDialog.Root open={open} onOpenChange={onOpenChange}>
      <RDialog.Portal>
        <RDialog.Overlay className="fixed inset-0 z-50 bg-navy-950/40 data-[state=open]:animate-fade-in" />
        <RDialog.Content
          className={cn(
            "fixed inset-y-0 z-50 flex w-[min(28rem,100vw)] flex-col bg-surface shadow-lg focus:outline-none data-[state=open]:animate-slide-in-right",
            side === "right" ? "right-0 border-l border-line" : "left-0 border-r border-line",
            className,
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
            <div>
              <RDialog.Title className="font-display text-base font-semibold text-ink-strong">{title}</RDialog.Title>
              {description ? <RDialog.Description className="mt-0.5 text-sm text-muted">{description}</RDialog.Description> : <RDialog.Description className="sr-only">{String(title)}</RDialog.Description>}
            </div>
            <RDialog.Close asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Close panel">
                <X />
              </Button>
            </RDialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
          {footer && <div className="border-t border-line bg-surface-2 px-5 py-3">{footer}</div>}
        </RDialog.Content>
      </RDialog.Portal>
    </RDialog.Root>
  );
}

/* ———————————————————————————— Tooltip ———————————————————————————— */

export function Tooltip({ content, children, side = "top" }: { content: ReactNode; children: ReactNode; side?: "top" | "bottom" | "left" | "right" }) {
  return (
    <RTooltip.Provider delayDuration={250}>
      <RTooltip.Root>
        <RTooltip.Trigger asChild>{children}</RTooltip.Trigger>
        <RTooltip.Portal>
          <RTooltip.Content
            side={side}
            sideOffset={6}
            className="z-50 max-w-xs rounded-md bg-navy-900 px-2.5 py-1.5 text-xs leading-relaxed text-on-dark shadow-md data-[state=delayed-open]:animate-fade-in"
          >
            {content}
            <RTooltip.Arrow className="fill-navy-900" />
          </RTooltip.Content>
        </RTooltip.Portal>
      </RTooltip.Root>
    </RTooltip.Provider>
  );
}

/* ———————————————————————————— Popover ———————————————————————————— */

export function Popover({ trigger, children, align = "end", className }: { trigger: ReactNode; children: ReactNode; align?: "start" | "center" | "end"; className?: string }) {
  return (
    <RPopover.Root>
      <RPopover.Trigger asChild>{trigger}</RPopover.Trigger>
      <RPopover.Portal>
        <RPopover.Content
          align={align}
          sideOffset={8}
          className={cn("z-50 w-80 rounded-lg border border-line bg-surface shadow-lg focus:outline-none data-[state=open]:animate-scale-in", className)}
        >
          {children}
        </RPopover.Content>
      </RPopover.Portal>
    </RPopover.Root>
  );
}

/* ———————————————————————————— Dropdown menu ———————————————————————————— */

export const Menu = RMenu.Root;
export const MenuTrigger = RMenu.Trigger;

export function MenuContent({ children, align = "end", className }: { children: ReactNode; align?: "start" | "end"; className?: string }) {
  return (
    <RMenu.Portal>
      <RMenu.Content
        align={align}
        sideOffset={6}
        className={cn("z-50 min-w-52 rounded-lg border border-line bg-surface p-1 shadow-lg data-[state=open]:animate-scale-in", className)}
      >
        {children}
      </RMenu.Content>
    </RMenu.Portal>
  );
}

export function MenuItem({ className, destructive, ...props }: ComponentPropsWithoutRef<typeof RMenu.Item> & { destructive?: boolean }) {
  return (
    <RMenu.Item
      className={cn(
        "flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm text-ink outline-none data-[disabled]:pointer-events-none data-[highlighted]:bg-surface-3 data-[disabled]:opacity-50 [&_svg]:size-4 [&_svg]:text-muted",
        destructive && "text-danger-700 data-[highlighted]:bg-danger-100 [&_svg]:text-danger-600",
        className,
      )}
      {...props}
    />
  );
}

export const MenuSeparator = () => <RMenu.Separator className="my-1 h-px bg-line" />;
export const MenuLabel = ({ children }: { children: ReactNode }) => (
  <RMenu.Label className="px-2.5 pb-1 pt-2 font-mono text-[0.625rem] uppercase tracking-wider text-subtle">{children}</RMenu.Label>
);

/* ———————————————————————————— Tabs ———————————————————————————— */

export const Tabs = RTabs.Root;
export const TabsContent = ({ className, ...p }: ComponentPropsWithoutRef<typeof RTabs.Content>) => (
  <RTabs.Content className={cn("focus-visible:outline-none", className)} {...p} />
);

export function TabsList({ className, children, variant = "line" }: { className?: string; children: ReactNode; variant?: "line" | "pill" }) {
  return (
    <RTabs.List
      className={cn(
        "scrollbar-thin flex overflow-x-auto",
        variant === "line" ? "gap-5 border-b border-line" : "gap-1 rounded-lg bg-surface-3/70 p-1",
        className,
      )}
    >
      {children}
    </RTabs.List>
  );
}

export function TabsTrigger({ className, variant = "line", ...p }: ComponentPropsWithoutRef<typeof RTabs.Trigger> & { variant?: "line" | "pill" }) {
  return (
    <RTabs.Trigger
      className={cn(
        "inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[0.8125rem] font-medium text-muted transition-colors hover:text-ink-strong [&_svg]:size-4",
        variant === "line"
          ? "-mb-px border-b-2 border-transparent px-0.5 pb-2.5 pt-1 data-[state=active]:border-teal-600 data-[state=active]:text-ink-strong"
          : "h-8 rounded-md px-3 data-[state=active]:bg-surface data-[state=active]:text-ink-strong data-[state=active]:shadow-sm",
        className,
      )}
      {...p}
    />
  );
}

/* ———————————————————————————— Accordion ———————————————————————————— */

export function Accordion({ items, className }: { items: Array<{ id: string; q: ReactNode; a: ReactNode }>; className?: string }) {
  return (
    <RAccordion.Root type="single" collapsible className={cn("divide-y divide-line border-y border-line", className)}>
      {items.map((it) => (
        <RAccordion.Item key={it.id} value={it.id}>
          <RAccordion.Header>
            <RAccordion.Trigger className="group flex w-full items-center justify-between gap-6 py-5 text-left font-display text-[1.0625rem] font-semibold text-ink-strong transition-colors hover:text-teal-700">
              {it.q}
              <span className="grid size-8 shrink-0 place-items-center rounded-full border border-line transition-transform group-data-[state=open]:rotate-180 group-data-[state=open]:border-teal-600 group-data-[state=open]:text-teal-700">
                <ChevronDown className="size-4" aria-hidden />
              </span>
            </RAccordion.Trigger>
          </RAccordion.Header>
          <RAccordion.Content className="overflow-hidden data-[state=open]:animate-fade-in">
            <p className="max-w-3xl pb-6 pr-12 text-[0.9375rem] leading-relaxed text-muted">{it.a}</p>
          </RAccordion.Content>
        </RAccordion.Item>
      ))}
    </RAccordion.Root>
  );
}

/** Small hook for dialog state with a pending flag. */
export function useDialog() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return { open, setOpen, busy, setBusy };
}
