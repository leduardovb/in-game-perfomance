"use client";

import { useActionState, useState } from "react";
import { LOL_ROLE_LABELS, type Game } from "@/lib/games";
import { startTrainingAction, type StartTrainingState } from "@/modules/training/actions";
import { DEFAULT_LOL_ROLE, totalDurationMinutes } from "@/modules/training/domain/templates";
import { MAX_MATCHES_TARGET, MIN_MATCHES_TARGET, type TrainingTemplate } from "@/modules/training/domain/types";

const initialState: StartTrainingState = { error: null };

type Props = {
  game: Game;
  /** One per LoL role, or a single CS2 template. */
  templates: TrainingTemplate[];
};

export function StartTrainingForm({ game, templates }: Props) {
  const [state, formAction, pending] = useActionState(startTrainingAction, initialState);
  const [templateId, setTemplateId] = useState(
    () => (templates.find((template) => template.role === DEFAULT_LOL_ROLE) ?? templates[0]).id,
  );
  const template = templates.find((candidate) => candidate.id === templateId) ?? templates[0];

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="game" value={game} />
      {template.role && <input type="hidden" name="role" value={template.role} />}

      {templates.length > 1 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-2 text-sm font-medium">Rota</legend>
          <div className="flex flex-wrap gap-2">
            {templates.map((candidate) => (
              <button
                key={candidate.id}
                type="button"
                aria-pressed={candidate.id === template.id}
                onClick={() => setTemplateId(candidate.id)}
                className="rounded-full border border-border px-3 py-1.5 text-sm aria-pressed:border-accent aria-pressed:bg-accent aria-pressed:text-accent-foreground"
              >
                {candidate.role ? LOL_ROLE_LABELS[candidate.role] : candidate.name}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-sm font-medium">
          {template.steps.length} etapas · {totalDurationMinutes(template)} min
        </h2>
        <ol className="flex flex-col gap-2">
          {template.steps.map((step) => (
            <li key={step.id} className="rounded-xl border border-border bg-surface p-3">
              <div className="flex justify-between gap-2 text-sm font-medium">
                <span>{step.title}</span>
                <span className="text-muted">{step.durationMinutes} min</span>
              </div>
              <p className="mt-1 text-sm text-muted">{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        Partidas depois do treino
        <input
          key={template.id}
          name="matchesTarget"
          type="number"
          inputMode="numeric"
          min={MIN_MATCHES_TARGET}
          max={MAX_MATCHES_TARGET}
          defaultValue={template.defaultMatchesTarget}
          required
          className="w-20 rounded-lg border border-border bg-surface px-3 py-2 text-right outline-none focus:border-accent"
        />
      </label>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-accent px-4 py-3 font-medium text-accent-foreground disabled:opacity-60"
      >
        {pending ? "Iniciando…" : "Iniciar treino de hoje"}
      </button>
    </form>
  );
}
