// Lista centralizada de fisioterapeutas da Equipe Cheila Meinertz
export const therapists = [
  "Ana Paula Falcão",
  "Cheila Meinertz",
  "Daniela Wentts",
  "Elenice Brun",
  "Gabi Ritter",
  "Grazi Nichelle",
  "Kamilly Souza",
  "Tassiane Suterio",
] as const;

export type Therapist = typeof therapists[number];

// Helper para usar em filtros (inclui "TODAS")
export const therapistsWithAll = ["TODAS", ...therapists] as const;

// Percentuais de comissão por fisioterapeuta (pode ser configurado)
export const therapistCommissions: Record<string, number> = {
  "Ana Paula Falcão": 40,
  "Cheila Meinertz": 40,
  "Daniela Wentts": 40,
  "Elenice Brun": 40,
  "Gabi Ritter": 40,
  "Grazi Nichelle": 40,
  "Kamilly Souza": 40,
  "Tassiane Suterio": 40,
};
