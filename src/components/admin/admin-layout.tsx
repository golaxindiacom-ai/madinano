"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardClass, selectClass } from "@/components/admin/course-form-styles";

export const adminPageClass = "space-y-4 sm:space-y-6";

export const adminKpiGridClass =
  "grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4";

export const adminPageActionsClass = "flex w-full flex-wrap items-center gap-2 sm:w-auto";

export const adminFilterBarClass =
  "flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center";

export const adminFilterSelectClass = cn(
  selectClass,
  "mt-0 w-full min-w-0 sm:w-auto sm:min-w-[140px]",
);

export const adminTableCardClass = "overflow-x-auto rounded-xl border border-border bg-card md:rounded-2xl";

export const adminTableInCardClass = cn(cardClass, "overflow-x-auto p-0 sm:p-0");

export const adminTabBarClass =
  "flex gap-1 overflow-x-auto border-b border-border px-2 sm:px-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden";

export const adminModalOverlayClass =
  "fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4";

export const adminModalPanelClass =
  "max-h-[92vh] w-full overflow-y-auto rounded-t-2xl bg-card p-4 shadow-2xl sm:max-w-lg sm:rounded-2xl sm:p-6";

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-ink sm:text-2xl">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {actions ? <div className={adminPageActionsClass}>{actions}</div> : null}
    </div>
  );
}

export function AdminDesktopTable({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("hidden md:block", adminTableCardClass, className)}>
      {children}
    </div>
  );
}

export function AdminMobileList({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("space-y-3 md:hidden", className)}>{children}</div>;
}

export function AdminMobileCard({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  const Tag = onClick ? "button" : "div";
  return (
    <Tag
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={cn(
        "w-full rounded-xl border border-border bg-card p-4 text-left shadow-sm",
        onClick && "transition hover:bg-muted/20 active:bg-muted/40",
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function AdminMobileRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-t border-border/60 py-2 text-sm first:border-t-0 first:pt-0">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right font-medium text-ink">{children}</span>
    </div>
  );
}

export function AdminMobileActions({ children }: { children: ReactNode }) {
  return <div className="mt-3 flex flex-wrap gap-2 border-t border-border/60 pt-3">{children}</div>;
}

export function AdminLoadingState({ message = "Loading..." }: { message?: string }) {
  return <div className="py-10 text-center text-sm text-muted-foreground">{message}</div>;
}

export function AdminEmptyState({ message = "No records found" }: { message?: string }) {
  return <div className="py-12 text-center text-sm text-muted-foreground">{message}</div>;
}

export function AdminDetailDrawer({
  title,
  subtitle,
  onClose,
  children,
  header,
  tabs,
  footer,
  className,
}: {
  title?: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  header?: ReactNode;
  tabs?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-[1px]"
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "flex h-full w-full max-w-lg flex-col overflow-hidden bg-card shadow-2xl sm:max-w-xl",
          className,
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {header ?? (
          <div className="flex items-start justify-between gap-3 border-b border-border p-4 sm:p-5">
            <div className="min-w-0">
              {title ? <h2 className="truncate text-lg font-bold text-ink">{title}</h2> : null}
              {subtitle ? <p className="truncate text-sm text-muted-foreground">{subtitle}</p> : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-border hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {tabs}

        <div className="flex-1 overflow-y-auto p-4 sm:p-5">{children}</div>

        {footer ? <div className="border-t border-border p-4 sm:p-5">{footer}</div> : null}
      </div>
    </div>
  );
}

export function AdminModal({
  onClose,
  children,
  className,
}: {
  onClose: () => void;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={adminModalOverlayClass} onClick={onClose}>
      <div className={cn(adminModalPanelClass, className)} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
