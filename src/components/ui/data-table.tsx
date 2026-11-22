"use client";

import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type Row,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { EmptyState } from "./feedback";

export interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T, unknown>[];
  caption: string;
  initialSort?: SortingState;
  onRowClick?: (row: T) => void;
  rowClassName?: (row: T) => string | undefined;
  /** Alternative card rendering for small screens. */
  mobileCard?: (row: T) => ReactNode;
  pageSize?: number;
  empty?: ReactNode;
  dense?: boolean;
  stickyHeader?: boolean;
  className?: string;
  maxHeight?: string;
}

export function DataTable<T>({
  data,
  columns,
  caption,
  initialSort = [],
  onRowClick,
  rowClassName,
  mobileCard,
  pageSize,
  empty,
  dense,
  stickyHeader = true,
  className,
  maxHeight,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSort);
  // TanStack Table returns non-memoisable functions by design; the React Compiler lint does not apply here.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    ...(pageSize ? { getPaginationRowModel: getPaginationRowModel(), initialState: { pagination: { pageSize } } } : {}),
  });

  const rows = table.getRowModel().rows;

  if (data.length === 0) {
    return <div className={className}>{empty ?? <EmptyState title="No records" body="Nothing matches the current filters." />}</div>;
  }

  const handleKey = (e: React.KeyboardEvent, row: Row<T>) => {
    if (onRowClick && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      onRowClick(row.original);
    }
  };

  return (
    <div className={className}>
      {mobileCard && <ul className="space-y-2 md:hidden">{rows.map((r) => <li key={r.id}>{mobileCard(r.original)}</li>)}</ul>}
      <div className={cn("scrollbar-thin overflow-auto rounded-lg border border-line bg-surface", mobileCard && "hidden md:block")} style={maxHeight ? { maxHeight } : undefined}>
        <table className="w-full border-collapse text-left text-[0.8125rem]">
          <caption className="sr-only">{caption}</caption>
          <thead className={cn(stickyHeader && "sticky top-0 z-10")}>
            {table.getHeaderGroups().map((hg) => (
              <tr key={hg.id} className="bg-surface-2 shadow-[inset_0_-1px_0_var(--color-line)]">
                {hg.headers.map((h) => {
                  const sortable = h.column.getCanSort();
                  const dir = h.column.getIsSorted();
                  const meta = h.column.columnDef.meta as { align?: "right"; className?: string } | undefined;
                  return (
                    <th
                      key={h.id}
                      scope="col"
                      aria-sort={dir === "asc" ? "ascending" : dir === "desc" ? "descending" : sortable ? "none" : undefined}
                      className={cn("whitespace-nowrap px-3 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted first:pl-4 last:pr-4", meta?.align === "right" && "text-right", meta?.className)}
                      style={{ width: h.getSize() !== 150 ? h.getSize() : undefined }}
                    >
                      {h.isPlaceholder ? null : sortable ? (
                        <button type="button" onClick={h.column.getToggleSortingHandler()} className={cn("inline-flex items-center gap-1 rounded uppercase hover:text-ink-strong", meta?.align === "right" && "flex-row-reverse")}>
                          {flexRender(h.column.columnDef.header, h.getContext())}
                          {dir === "asc" ? <ArrowUp className="size-3" /> : dir === "desc" ? <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
                        </button>
                      ) : (
                        flexRender(h.column.columnDef.header, h.getContext())
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                tabIndex={onRowClick ? 0 : undefined}
                onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                onKeyDown={(e) => handleKey(e, row)}
                className={cn(
                  "border-t border-line/80 transition-colors first:border-t-0",
                  onRowClick && "cursor-pointer hover:bg-teal-50/40 focus-visible:bg-teal-50/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal-600",
                  rowClassName?.(row.original),
                )}
              >
                {row.getVisibleCells().map((cell) => {
                  const meta = cell.column.columnDef.meta as { align?: "right"; className?: string } | undefined;
                  return (
                    <td key={cell.id} className={cn("px-3 align-middle first:pl-4 last:pr-4", dense ? "py-2" : "py-3", meta?.align === "right" && "text-right", meta?.className)}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pageSize && table.getPageCount() > 1 && (
        <div className="mt-3 flex items-center justify-between text-xs text-muted">
          <span className="tabular">
            Showing {table.getState().pagination.pageIndex * pageSize + 1}–{Math.min((table.getState().pagination.pageIndex + 1) * pageSize, data.length)} of {data.length}
          </span>
          <div className="flex gap-1">
            <Button variant="secondary" size="icon-sm" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} aria-label="Previous page">
              <ChevronLeft />
            </Button>
            <Button variant="secondary" size="icon-sm" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} aria-label="Next page">
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
