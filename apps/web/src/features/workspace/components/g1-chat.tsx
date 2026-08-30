"use client";

import { FormEvent, useState } from "react";
import { simulationsApi, type G1Turn } from "../simulations-api";

type G1ChatProps = {
  disabled?: boolean;
};

export function G1Chat({ disabled }: G1ChatProps) {
  const [level, setLevel] = useState(1);
  const [message, setMessage] = useState("");
  const [turns, setTurns] = useState<G1Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!message.trim() || disabled) {
      return;
    }
    setPending(true);
    setError(null);
    try {
      const turn = await simulationsApi.g1Turn(level, message.trim());
      setTurns((current) => [...current, turn]);
      setMessage("");
    } catch (caught: unknown) {
      setError(caught instanceof Error ? caught.message : "Turn failed");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="lp-ws-chat">
      <div className="lp-ws-pane-head">
        <h2 className="lp-ws-pane-title">Live concierge</h2>
        <p className="lp-ws-pane-lead">
          Chat against a level, then submit the winning prompt below.
        </p>
      </div>
      <div className="lp-ws-chat-body">
        <label className="lp-field">
          <span className="lp-field-label">Level</span>
          <span className="lp-ws-select">
            <select
              value={level}
              onChange={(event) => setLevel(Number(event.target.value))}
              className="lp-field-input"
            >
              <option value={1}>1 — no defence</option>
              <option value={2}>2 — hardened prompt</option>
              <option value={3}>3 — output filter</option>
            </select>
          </span>
        </label>
        <ol className="lp-ws-chat-log">
          {turns.map((turn, index) => (
            <li
              key={`${turn.level}-${index}`}
              className={`lp-ws-chat-turn${turn.won ? " is-won" : ""}`}
            >
              <p>
                <span className="lp-ws-chat-level">L{turn.level}</span>
                {turn.reply}
              </p>
              {turn.won ? (
                <p className="lp-ws-chat-win">
                  Canary extracted via {turn.encoding}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
        <form className="lp-ws-chat-compose" onSubmit={(event) => void onSubmit(event)}>
          <input
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            disabled={disabled || pending}
            className="lp-field-input"
            placeholder="Message the concierge"
          />
          <button
            type="submit"
            disabled={disabled || pending || !message.trim()}
            className="lp-btn lp-btn-primary"
          >
            {pending ? "Sending…" : "Send"}
          </button>
        </form>
        {error ? <p className="lp-ws-error">{error}</p> : null}
      </div>
    </section>
  );
}
