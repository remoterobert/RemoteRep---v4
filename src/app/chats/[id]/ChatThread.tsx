"use client";

import { useEffect, useRef, useState } from "react";
import {
  PaperAirplaneIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { createClient } from "@/lib/supabase/client";
import { sendMessage } from "./actions";

export type Message = {
  id: string;
  chat_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  edited_at: string | null;
  deleted_at: string | null;
};

export function ChatThread({
  chatId,
  currentUserId,
  initialMessages,
  nameByUserId,
  icebreakers,
  otherName,
  iAmHiring,
}: {
  chatId: string;
  currentUserId: string;
  initialMessages: Message[];
  nameByUserId: Record<string, string>;
  icebreakers: string[];
  otherName: string;
  iAmHiring: boolean;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const seenIds = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`chat:${chatId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const m = payload.new as Message;
          if (seenIds.current.has(m.id)) return;
          seenIds.current.add(m.id);
          setMessages((prev) => [...prev, m]);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  // How many messages *I* have sent — used to decide whether to show
  // the coaching helper. As soon as the user has engaged with 2+
  // messages of their own we get out of their way.
  const myMessageCount = messages.filter(
    (m) => m.author_user_id === currentUserId,
  ).length;
  const showIcebreakers = myMessageCount < 2;

  const coachingHeadline = iAmHiring
    ? `Introduce your team to ${otherName}`
    : `${otherName} reached out — introduce yourself`;
  const coachingSubtext = iAmHiring
    ? "Share what your team does, why the role is exciting, and propose a time to connect. Response rates jump dramatically when you name a specific time in the first message."
    : "Say hi, mention what caught your interest, and ask what would help them evaluate you as a fit. Fast replies win.";

  const conversationStale =
    myMessageCount === 0 &&
    messages.length > 0 &&
    Date.now() - new Date(messages[messages.length - 1]?.created_at ?? 0).getTime() > 5 * 60 * 1000;

  return (
    <>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-light-grey italic mb-2">
              No messages yet.
            </p>
            <p className="text-xs text-light-grey">
              Say hi — first message often sets the tone for the whole
              conversation.
            </p>
          </div>
        )}
        {messages.map((m) => {
          const mine = m.author_user_id === currentUserId;
          return (
            <div
              key={m.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={
                  mine
                    ? "max-w-[75%] rounded-2xl rounded-br-sm bg-primary text-white px-3 py-2 shadow-sm"
                    : "max-w-[75%] rounded-2xl rounded-bl-sm bg-zinc-100 dark:bg-zinc-800 text-dark-foreground dark:text-white px-3 py-2 shadow-sm"
                }
              >
                {!mine && (
                  <div className="text-[10px] font-semibold text-light-grey mb-0.5">
                    {nameByUserId[m.author_user_id] ?? "Them"}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {m.body}
                </p>
                <div
                  className={`text-[10px] mt-1 ${mine ? "text-white/70" : "text-light-grey"}`}
                >
                  {new Date(m.created_at).toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Coaching / icebreakers — shown while user hasn't started replying */}
      {showIcebreakers && (
        <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/50 px-4 lg:px-6 py-3 shrink-0">
          <div className="flex items-start gap-2 mb-2">
            <SparklesIcon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
            <div className="text-xs">
              <p className="font-semibold text-dark-foreground dark:text-white">
                {coachingHeadline}
              </p>
              <p className="text-light-grey mt-0.5">{coachingSubtext}</p>
              {conversationStale && (
                <p className="text-invited mt-1">
                  ⏱ They&apos;ve been waiting — a fast reply now increases your
                  chances significantly.
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {icebreakers.map((text) => (
              <button
                key={text}
                type="button"
                onClick={() => {
                  setDraft(text);
                  textareaRef.current?.focus();
                }}
                className="text-xs rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-white px-3 py-1 transition-colors"
              >
                {text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Send box */}
      <SendBox
        chatId={chatId}
        draft={draft}
        setDraft={setDraft}
        textareaRef={textareaRef}
      />
    </>
  );
}

function SendBox({
  chatId,
  draft,
  setDraft,
  textareaRef,
}: {
  chatId: string;
  draft: string;
  setDraft: (v: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        setPending(true);
        try {
          await sendMessage(fd);
          setDraft("");
        } finally {
          setPending(false);
        }
      }}
      className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-end gap-2 bg-white dark:bg-dark-background shrink-0"
    >
      <input type="hidden" name="chat_id" value={chatId} />
      <textarea
        ref={textareaRef}
        name="body"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder="Type a message…"
        rows={1}
        maxLength={5000}
        required
        disabled={pending}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            if (draft.trim().length > 0 && !pending) {
              e.currentTarget.form?.requestSubmit();
            }
          }
        }}
        className="flex-1 resize-none rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm min-h-[36px] max-h-32 disabled:opacity-60"
      />
      <button
        type="submit"
        disabled={pending || draft.trim().length === 0}
        aria-label="Send"
        className="rounded bg-primary text-white h-9 w-9 flex items-center justify-center hover:opacity-90 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <PaperAirplaneIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
