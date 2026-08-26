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
    <section className="border-b p-4">
      <h2 className="font-medium">Live concierge</h2>
      <p className="mt-1 text-sm opacity-70">
        Chat against a level, then submit the winning prompt below.
      </p>
      <label className="mt-3 block text-sm">
        Level
        <select
          value={level}
          onChange={(event) => setLevel(Number(event.target.value))}
          className="mt-1 block border px-2 py-1"
        >
          <option value={1}>1 — no defence</option>
          <option value={2}>2 — hardened prompt</option>
          <option value={3}>3 — output filter</option>
        </select>
      </label>
      <ol className="mt-3 max-h-48 space-y-2 overflow-y-auto text-sm">
        {turns.map((turn, index) => (
          <li key={`${turn.level}-${index}`} className="border p-2">
            <p>L{turn.level}: {turn.reply}</p>
            {turn.won ? (
              <p className="mt-1 text-xs uppercase">Canary extracted via {turn.encoding}</p>
            ) : null}
          </li>
        ))}
      </ol>
      <form className="mt-3 flex gap-2" onSubmit={(event) => void onSubmit(event)}>
        <input
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          disabled={disabled || pending}
          className="flex-1 border px-2 py-1 text-sm"
          placeholder="Message the concierge"
        />
        <button
          type="submit"
          disabled={disabled || pending || !message.trim()}
          className="border px-3 py-1 text-sm"
        >
          {pending ? "Sending…" : "Send"}
        </button>
      </form>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </section>
  );
}
