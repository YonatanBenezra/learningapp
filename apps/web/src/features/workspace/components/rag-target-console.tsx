"use client";

import { useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/utils";
import { ragLabApi, ragLabErrorMessage } from "../rag-lab/rag-lab-api";
import type { RagTargetReply } from "../rag-lab/rag-lab-types";

type Turn = {
  id: number;
  message: string;
  reply: RagTargetReply | null;
  error: string | null;
  pending: boolean;
};

/**
 * Transcripts per exercise, kept in memory (not persisted) so they survive lab
 * tab switches, mobile step switches and going to Submission to paste the flag.
 */
const transcripts = new Map<string, Turn[]>();
const listeners = new Set<() => void>();
const NO_TURNS: Turn[] = [];
let nextTurnId = 1;

function readTranscript(slug: string): Turn[] {
  return transcripts.get(slug) ?? NO_TURNS;
}

function updateTranscript(slug: string, update: (turns: Turn[]) => Turn[]) {
  transcripts.set(slug, update(readTranscript(slug)));
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Chat with a red team exercise's vulnerable bot. The bot runs server-side;
 * nothing here is graded. Submit the flag you extract from the Submission tab.
 */
export function RagTargetConsole({
  slug,
  botName = "Target bot",
}: {
  slug: string;
  botName?: string;
}) {
  const [message, setMessage] = useState("");
  const turns = useSyncExternalStore(
    subscribe,
    () => readTranscript(slug),
    () => NO_TURNS,
  );
  const sending = turns.some((turn) => turn.pending);

  async function send() {
    const text = message.trim();
    if (!text || sending) {
      return;
    }
    const id = nextTurnId++;
    setMessage("");
    updateTranscript(slug, (prev) => [
      ...prev,
      { id, message: text, reply: null, error: null, pending: true },
    ]);
    let settled: Pick<Turn, "reply" | "error">;
    try {
      settled = { reply: await ragLabApi.target(slug, text), error: null };
    } catch (caught: unknown) {
      settled = {
        reply: null,
        error: ragLabErrorMessage(caught, "The target did not answer."),
      };
    }
    updateTranscript(slug, (prev) =>
      prev.map((turn) => (turn.id === id ? { ...turn, ...settled, pending: false } : turn)),
    );
  }

  return (
    <section className="lp-rag-lab-pane lp-rt-console" aria-label="Target bot">
      <div className="lp-rt-head">
        <p className="lp-rt-intro">
          You are talking to <strong>{botName}</strong>, the deliberately vulnerable bot for this
          level. Find the flag (<code>AIWARSS{"{…}"}</code>) and submit it from the Submission
          tab.{" "}
          <strong>It has no memory:</strong> each message is answered on its own, so put
          everything it needs in one message.
        </p>
        {turns.length > 0 ? (
          <button
            type="button"
            className="lp-rt-clear"
            disabled={sending}
            onClick={() => updateTranscript(slug, () => NO_TURNS)}
          >
            Clear
          </button>
        ) : null}
      </div>
      <ol className="lp-rt-log" aria-live="polite">
        {turns.length === 0 ? (
          <li className="lp-rt-empty">No messages yet. Start with an ordinary question.</li>
        ) : null}
        {turns.map((turn) => (
          <li key={turn.id} className="lp-rt-turn">
            <p className="lp-rt-you">
              <span>You</span>
              {turn.message}
            </p>
            {turn.pending ? (
              <p className="lp-rt-empty" aria-busy="true">
                {botName} is typing…
              </p>
            ) : turn.error ? (
              <p className="lp-rag-lab-error" role="alert">
                {turn.error}
              </p>
            ) : turn.reply ? (
              <div className={cn("lp-rt-bot", turn.reply.blocked && "is-blocked")}>
                <span>{turn.reply.blocked ? "Filter" : botName}</span>
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
