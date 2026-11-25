"use client";

import { useState, useTransition } from "react";
import { syncLolMatchesAction } from "@/modules/lol/actions";

export function SyncButton() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ text: string; isError: boolean } | null>(null);

  function sync() {
    setMessage(null);
    startTransition(async () => {
      const result = await syncLolMatchesAction();
      if (!result.ok) {
        setMessage({ text: result.error, isError: true });
        return;
      }
      const { added } = result.data;
      setMessage({
        text: added === 0 ? "Nenhuma partida nova." : `${added} ${added === 1 ? "partida nova" : "partidas novas"}.`,
        isError: false,
      });
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={sync}
        disabled={pending}
        className="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-foreground disabled:opacity-60"
      >
        {pending ? "Sincronizando…" : "Atualizar partidas"}
      </button>
      {message && (
        <p role={message.isError ? "alert" : "status"} className={`max-w-xs text-right text-xs ${message.isError ? "text-danger" : "text-muted"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
