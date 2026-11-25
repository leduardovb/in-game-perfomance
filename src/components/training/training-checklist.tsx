"use client";

import { useOptimistic, useState, useTransition } from "react";
import { ProgressBar } from "@/components/progress-bar";
import type { ActionResult } from "@/lib/action-result";
import { LOL_ROLE_LABELS } from "@/lib/games";
import { setMatchesPlayedAction, toggleStepAction } from "@/modules/training/actions";
import * as rules from "@/modules/training/domain/session";
import { MAX_MATCHES_TARGET, type TrainingSession } from "@/modules/training/domain/types";

type OptimisticChange = { type: "toggle"; stepId: string } | { type: "matches"; value: number };

function applyChange(session: TrainingSession, change: OptimisticChange): TrainingSession {
  return change.type === "toggle"
    ? rules.toggleStep(session, change.stepId)
    : rules.setMatchesPlayed(session, change.value);
}

export function TrainingChecklist({ session }: { session: TrainingSession }) {
  const [optimistic, applyOptimistic] = useOptimistic(session, applyChange);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const progress = rules.getProgress(optimistic);

  function run(change: OptimisticChange, action: () => Promise<ActionResult>) {
    setError(null);
    startTransition(async () => {
      applyOptimistic(change);
      const result = await action();
      // On failure the optimistic state is discarded when the transition ends.
      if (!result.ok) setError(result.error);
    });
  }

  const toggle = (stepId: string) =>
    run({ type: "toggle", stepId }, () => toggleStepAction({ sessionId: session.id, stepId }));

  const changeMatches = (value: number) =>
    run({ type: "matches", value }, () => setMatchesPlayedAction({ sessionId: session.id, matchesPlayed: value }));

  const done = new Set(optimistic.completedStepIds);

  return (
    <div className="flex flex-col gap-5">
      <section className="flex flex-col gap-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {progress.isComplete ? "Treino concluído 🎯" : `${Math.round(progress.ratio * 100)}% concluído`}
          </span>
          <span className="text-muted">
            {session.role && `${LOL_ROLE_LABELS[session.role]} · `}
            {progress.completedMinutes}/{progress.totalMinutes} min
          </span>
        </div>
        <ProgressBar ratio={progress.ratio} label="Progresso do treino de hoje" />
      </section>

      {error && (
        <p role="alert" className="rounded-lg border border-danger px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <ol className="flex flex-col gap-2">
        {optimistic.steps.map((step) => {
          const checked = done.has(step.id);
          return (
            <li key={step.id}>
              <label
                className={`flex cursor-pointer gap-3 rounded-xl border bg-surface p-3 transition-colors ${
                  checked ? "border-success" : "border-border"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(step.id)}
                  className="mt-0.5 size-5 shrink-0 accent-[var(--success)]"
                />
                <span className="flex flex-1 flex-col">
                  <span className="flex justify-between gap-2 text-sm font-medium">
                    <span className={checked ? "text-muted line-through" : ""}>{step.title}</span>
                    <span className="text-muted">{step.durationMinutes} min</span>
                  </span>
                  <span className="mt-1 text-sm text-muted">{step.description}</span>
                </span>
              </label>
            </li>
          );
        })}
      </ol>

      <section className="flex items-center justify-between gap-3 rounded-xl border border-border bg-surface p-3">
        <div>
          <h2 className="text-sm font-medium">Partidas</h2>
          <p className="text-sm text-muted">
            {optimistic.matchesPlayed} de {optimistic.matchesTarget}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <CounterButton
            label="Remover partida"
            disabled={optimistic.matchesPlayed === 0}
            onClick={() => changeMatches(optimistic.matchesPlayed - 1)}
          >
            −
          </CounterButton>
          <CounterButton
            label="Adicionar partida"
            disabled={optimistic.matchesPlayed >= MAX_MATCHES_TARGET}
            onClick={() => changeMatches(optimistic.matchesPlayed + 1)}
          >
            +
          </CounterButton>
        </div>
      </section>
    </div>
  );
}

type CounterButtonProps = {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: string;
};

function CounterButton({ label, disabled, onClick, children }: CounterButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="size-10 rounded-lg border border-border text-lg font-medium disabled:opacity-40"
    >
      {children}
    </button>
  );
}
