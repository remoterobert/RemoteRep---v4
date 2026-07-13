"use client";

import { useEffect, useRef, useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";

/**
 * TEMPORARY placeholder. A fully client-side, mock "support" conversation
 * shown on the /chats index when the user is browsing. It demonstrates how
 * chats work by letting the user actually type and receive canned replies —
 * no database, no server actions, nothing real is sent. Swap this out for the
 * real AI support assistant when it's ready.
 */

type DemoMsg = { id: number; from: "support" | "me"; body: string };

const SUPPORT_NAME = "RemoteRep Support";

export function SupportChatDemo({ iAmHiring }: { iAmHiring: boolean }) {
  const nextStep = iAmHiring
    ? "browse candidates and invite someone who fits"
    : "respond to a company's invitation";

  const initialMessages: DemoMsg[] = [
    {
      id: 1,
      from: "support",
      body: "👋 Welcome to RemoteRep! I'm your support assistant.",
    },
    {
      id: 2,
      from: "support",
      body: "This is exactly what a conversation looks like. When you connect with someone, you'll chat right here.",
    },
    {
      id: 3,
      from: "support",
      body: "Go ahead — type a message below and press send to try it out.",
    },
  ];

  const cannedReplies = [
    "Nice — that's all there is to it! Real conversations work exactly the same way.",
    `Once you ${nextStep}, a real chat opens here automatically and you'll pick up right where you leave off.`,
    "Send a message anytime and the other person is notified instantly. Quick replies make the best impression.",
    "I'm a friendly placeholder for now — a smarter AI assistant is coming soon to answer your questions for real.",
  ];

  const [messages, setMessages] = useState<DemoMsg[]>(initialMessages);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  const replyIdx = useRef(0);
  const nextId = useRef(100);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, typing]);

  // Clear any pending reply timers if the user navigates away mid-reply.
  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  function send() {
    const text = draft.trim();
    if (!text || typing) return;

    setMessages((prev) => [
      ...prev,
      { id: nextId.current++, from: "me", body: text },
    ]);
    setDraft("");
    setTyping(true);

    const t = setTimeout(() => {
      const reply = cannedReplies[replyIdx.current % cannedReplies.length];
      replyIdx.current += 1;
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        { id: nextId.current++, from: "support", body: reply },
      ]);
    }, 900);
    timers.current.push(t);
  }

  return (
    <>
      {/* Message list */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-3">
        {messages.map((m) => {
          const mine = m.from === "me";
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
                  <div className="text-[10px] font-semibold text-primary mb-0.5">
                    {SUPPORT_NAME}
                  </div>
                )}
                <p className="text-sm whitespace-pre-wrap break-words">
                  {m.body}
                </p>
              </div>
            </div>
          );
        })}

        {typing && (
          <div className="flex justify-start">
            <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-zinc-100 dark:bg-zinc-800 px-3 py-2.5 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-light-grey animate-bounce [animation-delay:-0.3s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-light-grey animate-bounce [animation-delay:-0.15s]" />
                <span className="h-1.5 w-1.5 rounded-full bg-light-grey animate-bounce" />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send();
        }}
        className="border-t border-zinc-200 dark:border-zinc-800 p-3 flex items-end gap-2 bg-white dark:bg-dark-background shrink-0"
      >
        <textarea
          name="body"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Type a message…"
          rows={1}
          maxLength={5000}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          className="flex-1 resize-none rounded border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm min-h-[36px] max-h-32"
        />
        <button
          type="submit"
          disabled={draft.trim().length === 0 || typing}
          aria-label="Send"
          className="rounded bg-primary text-white h-9 w-9 flex items-center justify-center hover:opacity-90 shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <PaperAirplaneIcon className="h-4 w-4" />
        </button>
      </form>
    </>
  );
}
