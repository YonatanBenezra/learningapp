"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ragLabApi } from "../rag-lab/rag-lab-api";
import type { RagTargetReply } from "../rag-lab/rag-lab-types";

type Turn = { message: string; reply: RagTargetReply | null; error: string | null };

/**
 * Chat with a red team exercise's vulnerable bot. The bot runs server-side;
 * nothing here is graded. Submit the flag you extract from the Submission tab.
 */
export function RagTargetConsole({ slug }: { slug: string }) {
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [sending, setSending] = useState(false);

  async function send() {
    const text = message.trim();
    if (!text || sending) {
      return;
    }
    setSending(true);
    setMessage("");
    try {
      const reply = await ragLabApi.target(slug, text);
      setTurns((prev) => [...prev, { message: text, reply, error: null }]);
    } catch (caught: unknown) {
      setTurns((prev) => [
        ...prev,
        {
          message: text,
          reply: null,
          error: caught instanceof Error ? caught.message : "The target did not answer.",
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <section className="lp-rag-lab-pane lp-rt-console" aria-label="Target bot">
      <p className="lp-rt-intro">
        You are talking to <strong>Acme Help</strong>, the deliberately vulnerable bot for this
        level. Find the flag (<code>LABPATH{"{…}"}</code>) and submit it from the Submission tab.
      </p>
      <ol className="lp-rt-log" aria-live="polite">
        {turns.length === 0 ? (
          <li className="lp-rt-empty">No messages yet. Start with an ordinary question.</li>
        ) : null}
        {turns.map((turn, index) => (
          <li key={index} className="lp-rt-turn">
            <p className="lp-rt-you">
              <span>You</span>
              {turn.message}
            </p>
            {turn.error ? (
              <p className="lp-rag-lab-error" role="alert">
                {turn.error}
              </p>
            ) : turn.reply ? (
              <div className={cn("lp-rt-bot", turn.reply.blocked && "is-blocked")}>
                <span>{turn.reply.blocked ? "Filter" : "Acme Help"}</span>
                <p>{turn.reply.reply}</p>
                {turn.reply.citations.length > 0 ? (
                  <p className="lp-rt-cites">
                    Sources: {turn.reply.citations.map((row) => row.docId).join(", ")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      <form
        className="lp-rt-form"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <input
          type="text"
          value={message}
          maxLength={1000}
          placeholder="Message the bot…"
          aria-label="Message to the target bot"
          onChange={(event) => setMessage(event.target.value)}
        />
        <button type="submit" disabled={sending || !message.trim()}>
          {sending ? "Sending…" : "Send"}
        </button>
      </form>
    </section>
  );
}
