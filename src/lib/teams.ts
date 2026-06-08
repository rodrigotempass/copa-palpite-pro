// Lista de seleções com código ISO para bandeiras (flagcdn.com)
export const TEAMS: { code: string; name: string }[] = [
  { code: "ar", name: "Argentina" },
  { code: "au", name: "Austrália" },
  { code: "at", name: "Áustria" },
  { code: "be", name: "Bélgica" },
  { code: "br", name: "Brasil" },
  { code: "ca", name: "Canadá" },
  { code: "cl", name: "Chile" },
  { code: "co", name: "Colômbia" },
  { code: "kr", name: "Coreia do Sul" },
  { code: "ci", name: "Costa do Marfim" },
  { code: "cr", name: "Costa Rica" },
  { code: "hr", name: "Croácia" },
  { code: "dk", name: "Dinamarca" },
  { code: "ec", name: "Equador" },
  { code: "eg", name: "Egito" },
  { code: "es", name: "Espanha" },
  { code: "us", name: "Estados Unidos" },
  { code: "fr", name: "França" },
  { code: "gh", name: "Gana" },
  { code: "nl", name: "Holanda" },
  { code: "ir", name: "Irã" },
  { code: "it", name: "Itália" },
  { code: "jp", name: "Japão" },
  { code: "ma", name: "Marrocos" },
  { code: "mx", name: "México" },
  { code: "ng", name: "Nigéria" },
  { code: "no", name: "Noruega" },
  { code: "ny", name: "Nova Zelândia" },
  { code: "py", name: "Paraguai" },
  { code: "pe", name: "Peru" },
  { code: "pl", name: "Polônia" },
  { code: "pt", name: "Portugal" },
  { code: "qa", name: "Catar" },
  { code: "gb-eng", name: "Inglaterra" },
  { code: "de", name: "Alemanha" },
  { code: "sa", name: "Arábia Saudita" },
  { code: "sn", name: "Senegal" },
  { code: "rs", name: "Sérvia" },
  { code: "ch", name: "Suíça" },
  { code: "tn", name: "Tunísia" },
  { code: "tr", name: "Turquia" },
  { code: "ua", name: "Ucrânia" },
  { code: "uy", name: "Uruguai" },
  { code: "ve", name: "Venezuela" },
];

export function flagUrl(code: string | null | undefined, size: 40 | 80 | 160 = 80) {
  if (!code) return "";
  return `https://flagcdn.com/w${size}/${code.toLowerCase()}.png`;
}

export function teamName(code: string | null | undefined) {
  if (!code) return "";
  return TEAMS.find((t) => t.code === code)?.name ?? code.toUpperCase();
}

export const FASE_LABEL: Record<string, string> = {
  grupos: "Fase de Grupos",
  dezesseis_avos: "16-avos de Final",
  oitavas: "Oitavas de Final",
  quartas: "Quartas de Final",
  semis: "Semifinais",
  final: "Final",
};

export const FASES_ORDER = ["grupos", "dezesseis_avos", "oitavas", "quartas", "semis", "final"] as const;
