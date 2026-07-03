"use client";

import { useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
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
}: {
  chatId: string;
  currentUserId: string;
  initialMessages: Message[];
  nameByUserId: Record<string, string>;
}) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const seenIds = useRef<Set<string>>(new Set(initialMessages.map((m) => m.id)));

  // Realtime subscription
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

  // Auto-scroll to bottom when a message is added
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  return (
    <>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-sm text-light-grey italic py-8">
            No messages yet — send the first one.
          </p>
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
                    ? "max-w-[75%] rounded-2xl rounded-br-sm bg-primary text-white px-3 py-2"
                    : "max-w-[75%] rounded-2xl rounded-bl-sm bg-zinc-100 dark:bg-zinc-800 text-dark-foreground dark:text-white px-3 py-2"
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

      {/* Send box */}
      <SendBox chatId={chatId} />
    </>
  );
}

function SendBox({ chatId }: { chatId: string }) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action={async (fd) => {
        await sendMessage(fd);
        formRef.current?.reset();
      }}
      className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-end gap-2"
    >
      <input type="hidden" name="chat_id" value={chatId} />
      <textarea
        name="body"
        placeholder="Type a message…"
        rows={1}
        maxLength={5000}
        required
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        className="flex-1 resize-none rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm min-h-[36px] max-h-32"
      />
      <button
        type="submit"
        aria-label="Send"
        className="rounded bg-primary text-white h-9 w-9 flex items-center justify-center hover:opacity-90 shrink-0"
      >
        <PaperAirplaneIcon className="h-4 w-4" />
      </button>
    </form>
  );
}
