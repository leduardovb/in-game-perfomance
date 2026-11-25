import type { Game, LolRole, TrainingTemplate } from "./types";

/** LoL steps shared by every role: VOD review and warm-up match. */
const lolReviewStep = {
  id: "vod-review",
  title: "VOD review",
  description: "Assista à última partida. Anote cada morte e o que poderia ter feito diferente.",
  durationMinutes: 15,
};

const lolWarmupStep = {
  id: "warmup-match",
  title: "Aquecimento",
  description: "Uma partida normal ou ARAM só para aquecer antes das ranqueadas.",
  durationMinutes: 10,
};

const LOL_TEMPLATES: Record<LolRole, TrainingTemplate> = {
  mid: {
    id: "lol-mid-v1",
    game: "lol",
    role: "mid",
    name: "Mid lane",
    defaultMatchesTarget: 3,
    steps: [
      {
        id: "last-hit",
        title: "Last hit na Practice Tool",
        description: "10 minutos sem itens de dano extra. Meta: 80+ CS aos 10 min.",
        durationMinutes: 10,
      },
      {
        id: "champion-mechanics",
        title: "Combos e trocas",
        description: "Treine os combos do seu campeão principal e trocas curtas contra o boneco.",
        durationMinutes: 15,
      },
      {
        id: "matchup-waves",
        title: "Matchup e controle de wave",
        description: "Estude o matchup mais difícil da semana: níveis de poder, freeze, slow push e roams.",
        durationMinutes: 10,
      },
      lolReviewStep,
      lolWarmupStep,
    ],
  },
  top: {
    id: "lol-top-v1",
    game: "lol",
    role: "top",
    name: "Top lane",
    defaultMatchesTarget: 3,
    steps: [
      {
        id: "last-hit",
        title: "Last hit sob torre",
        description: "Practice Tool: farm sob torre e last hit com wave grande. Meta: 75+ CS aos 10 min.",
        durationMinutes: 10,
      },
      {
        id: "champion-mechanics",
        title: "Trocas e all-in",
        description: "Treine trocas com spacing e o all-in de nível 2/3 do seu campeão.",
        durationMinutes: 15,
      },
      {
        id: "matchup-waves",
        title: "Matchup e teleporte",
        description: "Estude o matchup da semana e quando usar o teleporte para a botlane.",
        durationMinutes: 10,
      },
      lolReviewStep,
      lolWarmupStep,
    ],
  },
  jungle: {
    id: "lol-jungle-v1",
    game: "lol",
    role: "jungle",
    name: "Jungle",
    defaultMatchesTarget: 3,
    steps: [
      {
        id: "full-clear",
        title: "Full clear",
        description: "Practice Tool: repita o full clear do seu campeão. Meta: abaixo de 3:30.",
        durationMinutes: 15,
      },
      {
        id: "pathing",
        title: "Rotas e ganks",
        description: "Planeje a rota inicial pelos matchups de rota e os pontos de gank de nível 3.",
        durationMinutes: 10,
      },
      {
        id: "objectives",
        title: "Objetivos",
        description: "Revise o timing de dragão, arauto e vastilarvas, e o smite no momento certo.",
        durationMinutes: 10,
      },
      lolReviewStep,
      lolWarmupStep,
    ],
  },
  adc: {
    id: "lol-adc-v1",
    game: "lol",
    role: "adc",
    name: "ADC",
    defaultMatchesTarget: 3,
    steps: [
      {
        id: "last-hit",
        title: "Last hit",
        description: "Practice Tool sem itens de dano extra. Meta: 85+ CS aos 10 min.",
        durationMinutes: 10,
      },
      {
        id: "kiting",
        title: "Kiting",
        description: "Treine attack-move e orb walk contra o boneco, mantendo distância máxima.",
        durationMinutes: 15,
      },
      {
        id: "lane-2v2",
        title: "Fase de rota 2v2",
        description: "Estude níveis de poder da dupla rival e quando trocar com o seu suporte.",
        durationMinutes: 10,
      },
      lolReviewStep,
      lolWarmupStep,
    ],
  },
  support: {
    id: "lol-support-v1",
    game: "lol",
    role: "support",
    name: "Suporte",
    defaultMatchesTarget: 3,
    steps: [
      {
        id: "champion-mechanics",
        title: "Habilidades de engage",
        description: "Treine skillshots e o engage do seu campeão contra o boneco em movimento.",
        durationMinutes: 10,
      },
      {
        id: "vision",
        title: "Visão",
        description: "Revise os pontos de sentinela para cada objetivo e quando usar o sweeper.",
        durationMinutes: 15,
      },
      {
        id: "roaming",
        title: "Roams",
        description: "Estude quando sair da rota para ajudar o mid e o jungle sem perder a wave.",
        durationMinutes: 10,
      },
      lolReviewStep,
      lolWarmupStep,
    ],
  },
};

const CS2_TEMPLATE: TrainingTemplate = {
  id: "cs2-general-v1",
  game: "cs2",
  role: null,
  name: "Geral",
  defaultMatchesTarget: 2,
  steps: [
    {
      id: "aim-static",
      title: "Mira estática",
      description: "aim_botz ou Aim Lab: foco em colocar a mira na altura da cabeça.",
      durationMinutes: 10,
    },
    {
      id: "deathmatch",
      title: "Deathmatch",
      description: "Deathmatch focando em counter-strafe antes de cada tiro.",
      durationMinutes: 15,
    },
    {
      id: "utility",
      title: "Utilitários",
      description: "Treine smokes e flashes de um mapa do seu pool.",
      durationMinutes: 10,
    },
    {
      id: "prefire-movement",
      title: "Prefire e movimentação",
      description: "Mapas de prefire ou movimentação (jiggle peek, wide peek).",
      durationMinutes: 10,
    },
    {
      id: "review",
      title: "Review",
      description: "Assista a demo da última partida ou jogue retakes.",
      durationMinutes: 15,
    },
  ],
};

export const DEFAULT_LOL_ROLE: LolRole = "mid";

export function getTemplate(game: Game, role: LolRole | null): TrainingTemplate {
  if (game === "cs2") return CS2_TEMPLATE;
  return LOL_TEMPLATES[role ?? DEFAULT_LOL_ROLE];
}

export function listLolTemplates(): TrainingTemplate[] {
  return Object.values(LOL_TEMPLATES);
}

export function totalDurationMinutes(template: Pick<TrainingTemplate, "steps">): number {
  return template.steps.reduce((sum, step) => sum + step.durationMinutes, 0);
}
