import { MoreHorizontalIcon } from "lucide-react";
import type { ComponentType, ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";

/**
 * A secondary header action. Crowded ones collapse into an overflow menu
 * ("Lainnya" on desktop, "Aksi" on mobile) so the header stays scannable.
 */
export type PageHeaderAction = {
  /** Visible, Bahasa Indonesia label. Also used as the React key. */
  label: string;
  icon?: ComponentType<{ className?: string }>;
  onClick?: () => void;
  disabled?: boolean;
};

type Props = {
  title: string;
  description?: ReactNode;
  /** Breadcrumb / eyebrow rendered above the title. */
  breadcrumb?: ReactNode;
  /** Inline metadata beside the title, e.g. a StatusBadge. */
  meta?: ReactNode;
  /** The single, highest-emphasis action (already a Button/Link node). */
  primaryAction?: ReactNode;
  /** Secondary actions; the overflow collapses into a menu. */
  secondaryActions?: PageHeaderAction[];
  /** Float the primary action as a bottom-right FAB on mobile. */
  stickyOnMobile?: boolean;
  /**
   * @deprecated Prefer `primaryAction` + `secondaryActions`. Escape hatch for
   * arbitrary right-aligned nodes (e.g. a composed detail-page action cluster)
   * that do not fit the structured props.
   */
  actions?: ReactNode;
};

// Secondary actions kept inline on desktop before overflowing into the menu.
const INLINE_SECONDARY_LIMIT = 2;

export function PageHeader({
  title,
  description,
  breadcrumb,
  meta,
  primaryAction,
  secondaryActions,
  stickyOnMobile = false,
  actions,
}: Props) {
  const hasStructured = Boolean(primaryAction || secondaryActions?.length);

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        {breadcrumb ? <div className="mb-1">{breadcrumb}</div> : null}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 className="font-bold text-2xl tracking-tight">{title}</h1>
          {meta ? <div className="flex items-center gap-2">{meta}</div> : null}
        </div>
        {description ? (
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
      {hasStructured ? (
        <HeaderActions
          primaryAction={primaryAction}
          secondaryActions={secondaryActions ?? []}
          stickyOnMobile={stickyOnMobile}
        />
      ) : null}
    </div>
  );
}

type HeaderActionsProps = {
  primaryAction: ReactNode;
  secondaryActions: PageHeaderAction[];
  stickyOnMobile: boolean;
};

function HeaderActions({
  primaryAction,
  secondaryActions,
  stickyOnMobile,
}: HeaderActionsProps) {
  const isMobile = useIsMobile();
  // On mobile every secondary action collapses into the overflow menu so the
  // header never wraps; on desktop a couple stay inline before overflowing.
  const inline = isMobile
    ? []
    : secondaryActions.slice(0, INLINE_SECONDARY_LIMIT);
  const overflow = isMobile
    ? secondaryActions
    : secondaryActions.slice(INLINE_SECONDARY_LIMIT);
  const showFab = isMobile && stickyOnMobile && Boolean(primaryAction);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {inline.map((action) => (
        <ActionButton key={action.label} action={action} />
      ))}
      {overflow.length > 0 ? (
        <ActionMenu actions={overflow} label={isMobile ? "Aksi" : "Lainnya"} />
      ) : null}
      {primaryAction && !showFab ? primaryAction : null}
      {showFab ? (
        <div className="fixed right-4 bottom-4 z-30 [&_button]:shadow-lg [&_button]:shadow-primary/20">
          {primaryAction}
        </div>
      ) : null}
    </div>
  );
}

function ActionButton({ action }: { action: PageHeaderAction }) {
  const Icon = action.icon;
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={action.onClick}
      disabled={action.disabled}
    >
      {Icon ? <Icon className="size-4" /> : null}
      {action.label}
    </Button>
  );
}

function ActionMenu({
  actions,
  label,
}: {
  actions: PageHeaderAction[];
  label: string;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <MoreHorizontalIcon className="size-4" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <DropdownMenuItem
              key={action.label}
              onSelect={() => action.onClick?.()}
              disabled={action.disabled ?? false}
            >
              {Icon ? <Icon className="size-4" /> : null}
              {action.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
