"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  BookmarkIcon,
  EnvelopeIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
  CheckBadgeIcon,
} from "@heroicons/react/24/outline";
import {
  moveApplication,
  convertBookmarkToInvite,
  convertBookmarkToApply,
  type KanbanStatus,
} from "./actions";

// Six visible columns + two "closed" (rejected, withdrawn) revealed via toggle.
export const KANBAN_COLUMNS = [
  { id: "bookmarked" as const, label: "Bookmarked", icon: BookmarkIcon },
  { id: "invited" as const, label: "Invited", icon: EnvelopeIcon },
  { id: "applied" as const, label: "Applied", icon: PaperAirplaneIcon },
  { id: "interviewing" as const, label: "Interviewing", icon: ChatBubbleLeftRightIcon },
  { id: "shortlisted" as const, label: "Shortlisted", icon: StarIcon },
  { id: "hired" as const, label: "Hired", icon: CheckBadgeIcon },
];
export const CLOSED_COLUMNS = [
  { id: "withdrawn" as const, label: "Withdrawn", icon: BookmarkIcon },
  { id: "rejected" as const, label: "Rejected", icon: BookmarkIcon },
];

export type ColumnId =
  | "bookmarked"
  | "invited"
  | "applied"
  | "interviewing"
  | "shortlisted"
  | "hired"
  | "withdrawn"
  | "rejected";

export type KanbanCardData = {
  // Stable dnd id (unique across the board):
  //   - Bookmarks:  bm:<owner_user_id>:<target_id>
  //   - Applications: app:<application_id>
  id: string;
  columnId: ColumnId;
  title: string;
  subtitle?: string;
  href?: string;
  chatHref?: string;
  avatarInitials?: string;
  // Kind determines how a drag transition maps to a server call.
  kind: "application" | "bookmark_candidate" | "bookmark_listing";
  applicationId?: string;
  bookmarkTargetId?: string;
};

export type ViewerRole = "hiring" | "candidate";

export function Kanban({
  cards,
  viewerRole,
  showClosed,
}: {
  cards: KanbanCardData[];
  viewerRole: ViewerRole;
  showClosed: boolean;
}) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [items, setItems] = useState<KanbanCardData[]>(cards);
  const [flash, setFlash] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  // Keep local state in sync when server-side props change (revalidatePath re-renders).
  if (cards !== items && JSON.stringify(cards.map((c) => c.id + c.columnId)) !==
    JSON.stringify(items.map((c) => c.id + c.columnId))) {
    setItems(cards);
  }

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
  );

  const visibleColumns = showClosed
    ? [...KANBAN_COLUMNS, ...CLOSED_COLUMNS]
    : KANBAN_COLUMNS;

  const cardsByColumn = new Map<ColumnId, KanbanCardData[]>();
  for (const col of visibleColumns) {
    cardsByColumn.set(col.id, []);
  }
  for (const c of items) {
    if (cardsByColumn.has(c.columnId)) {
      cardsByColumn.get(c.columnId)!.push(c);
    }
  }

  const activeCard = items.find((c) => c.id === activeCardId) ?? null;

  function onDragStart(e: DragStartEvent) {
    setActiveCardId(String(e.active.id));
  }

  async function onDragEnd(e: DragEndEvent) {
    setActiveCardId(null);
    const cardId = String(e.active.id);
    const targetColumn = e.over?.id as ColumnId | undefined;
    if (!targetColumn) return;
    const card = items.find((c) => c.id === cardId);
    if (!card) return;
    if (card.columnId === targetColumn) return;

    // Guard: bookmarks can only convert to a real stage via specific
    // transitions. Anything else is disallowed.
    if (card.kind === "bookmark_candidate") {
      if (targetColumn !== "invited") {
        setFlash("Drag a bookmarked candidate to Invited to send an invitation.");
        return;
      }
    }
    if (card.kind === "bookmark_listing") {
      if (targetColumn !== "applied") {
        setFlash("Drag a bookmarked listing to Applied to apply.");
        return;
      }
    }
    // Guard: applications can't move back into Bookmarked.
    if (card.kind === "application" && targetColumn === "bookmarked") {
      setFlash("Applications can't be moved back to Bookmarked.");
      return;
    }

    // Optimistic update
    const prev = items;
    setItems((cur) =>
      cur.map((c) => (c.id === cardId ? { ...c, columnId: targetColumn } : c)),
    );

    startTransition(async () => {
      let result: { ok: true } | { ok: false; error: string };
      if (card.kind === "application" && card.applicationId) {
        result = await moveApplication(
          card.applicationId,
          targetColumn as KanbanStatus,
        );
      } else if (
        card.kind === "bookmark_candidate" &&
        card.bookmarkTargetId
      ) {
        result = await convertBookmarkToInvite(card.bookmarkTargetId);
      } else if (card.kind === "bookmark_listing" && card.bookmarkTargetId) {
        result = await convertBookmarkToApply(card.bookmarkTargetId);
      } else {
        result = { ok: false, error: "Card missing required id" };
      }

      if (!result.ok) {
        setItems(prev);
        setFlash(result.error);
      }
    });
  }

  return (
    <div>
      {flash && (
        <div className="mb-3 rounded border border-warning/40 bg-warning/5 p-2 text-xs text-warning flex items-center justify-between gap-2">
          <span>{flash}</span>
          <button
            type="button"
            onClick={() => setFlash(null)}
            className="text-warning/70 hover:text-warning"
          >
            Dismiss
          </button>
        </div>
      )}
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6 xl:grid-cols-6">
          {visibleColumns.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              icon={col.icon}
              cards={cardsByColumn.get(col.id) ?? []}
              viewerRole={viewerRole}
            />
          ))}
        </div>
        <DragOverlay>
          {activeCard ? <CardBody card={activeCard} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}

function Column({
  id,
  label,
  icon: Icon,
  cards,
  viewerRole,
}: {
  id: ColumnId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  cards: KanbanCardData[];
  viewerRole: ViewerRole;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`rounded-xl border border-border bg-surface-2 p-2 min-h-[300px] transition-colors ${
        isOver ? "bg-primary/[0.04] border-primary/40" : ""
      }`}
    >
      <div className="flex items-center justify-between px-1.5 pb-2 mb-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider font-bold text-light-grey">
          <Icon className="h-3.5 w-3.5" />
          {label}
        </div>
        <span className="text-[11px] text-light-grey tabular-nums">
          {cards.length}
        </span>
      </div>
      <div className="space-y-2">
        {cards.length === 0 ? (
          <div className="text-[11px] text-light-grey italic px-2 py-4 text-center">
            {emptyLabel(id, viewerRole)}
          </div>
        ) : (
          cards.map((c) => <Card key={c.id} card={c} />)
        )}
      </div>
    </div>
  );
}

function emptyLabel(col: ColumnId, viewer: ViewerRole): string {
  if (col === "bookmarked") {
    return viewer === "hiring"
      ? "No bookmarked candidates."
      : "No bookmarked listings.";
  }
  if (col === "invited") {
    return viewer === "hiring" ? "No pending invites." : "No invitations.";
  }
  if (col === "applied") return "Nothing here yet.";
  if (col === "hired") return "No hires yet.";
  return "Empty.";
}

function Card({ card }: { card: KanbanCardData }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: card.id });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <CardBody card={card} />
    </div>
  );
}

function CardBody({
  card,
  isDragging,
}: {
  card: KanbanCardData;
  isDragging?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border border-border bg-surface-3 p-2.5 cursor-grab active:cursor-grabbing shadow-sm ${
        isDragging ? "shadow-xl ring-1 ring-primary/40 rotate-1" : ""
      }`}
    >
      <div className="flex items-start gap-2">
        {card.avatarInitials && (
          <div className="h-7 w-7 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
            {card.avatarInitials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold truncate leading-tight">
            {card.title}
          </div>
          {card.subtitle && (
            <div className="text-[10px] text-light-grey truncate mt-0.5">
              {card.subtitle}
            </div>
          )}
        </div>
      </div>
      {(card.href || card.chatHref) && (
        <div className="flex gap-1 mt-2 pt-2 border-t border-border/50 text-[10px]">
          {card.href && (
            <Link
              href={card.href}
              className="text-primary hover:opacity-80 transition-opacity"
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              View
            </Link>
          )}
          {card.chatHref && (
            <>
              <span className="text-light-grey">·</span>
              <Link
                href={card.chatHref}
                className="text-primary hover:opacity-80 transition-opacity"
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
              >
                Chat
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
