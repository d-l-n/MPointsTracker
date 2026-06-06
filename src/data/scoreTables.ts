interface ScoreTableRow {
  label: string;
  key: string;
  mult: number | null;
}

interface ScoreTableSide {
  label: string;
  rows: ScoreTableRow[];
}

type ScoreTableInput = Record<string, string | number | undefined>;

interface ScoreTable {
  rows?: ScoreTableRow[];
  sides?: ScoreTableSide[];
  calc: (input: ScoreTableInput) => number;
  mercyBonus?: number;
}

const parsePoints = (value: string | number | undefined): number => parseInt(String(value ?? 0), 10) || 0;

export const SCORE_TABLES: Record<string, ScoreTable> = {
  uno_classic: {
    rows: [
      { label: "Números (0–9)", key: "numbers", mult: null },
      { label: "Acción (Skip/Rev/+2)", key: "actions", mult: 20 },
      { label: "Wild / Wild +4", key: "wilds", mult: 50 },
    ],
    calc: ({ numbers = 0, actions = 0, wilds = 0 }) =>
      parsePoints(numbers) + parsePoints(actions) * 20 + parsePoints(wilds) * 50,
  },
  uno_nomercy: {
    rows: [
      { label: "Números (0–9)", key: "numbers", mult: null },
      { label: "Acción (Salta/Rev/+2/+4/Tira/Salta todos)", key: "actions", mult: 20 },
      { label: "Comodín (+6/+10/Rev+4/Ruleta)", key: "wilds", mult: 50 },
    ],
    calc: ({ numbers = 0, actions = 0, wilds = 0 }) =>
      parsePoints(numbers) + parsePoints(actions) * 20 + parsePoints(wilds) * 50,
    mercyBonus: 250,
  },
  uno_flip: {
    sides: [
      {
        label: "Lado Claro",
        rows: [
          { label: "Números (1–9)", key: "numbers", mult: null },
          { label: "Draw One (+1)", key: "draw_one", mult: 10 },
          { label: "Reversa / Salta / Flip", key: "actions_light", mult: 20 },
          { label: "Wild (Comodín)", key: "wilds_light", mult: 40 },
          { label: "Wild Draw Two (+2)", key: "wild_draw2", mult: 50 },
        ],
      },
      {
        label: "Lado Oscuro",
        rows: [
          { label: "Draw Five (+5) / Reversa / Flip", key: "actions_dark", mult: 20 },
          { label: "Skip Everyone", key: "skip_everyone", mult: 30 },
          { label: "Wild (Comodín)", key: "wilds_dark", mult: 40 },
          { label: "Wild Draw Color", key: "wild_drawcolor", mult: 60 },
        ],
      },
    ],
    calc: ({
      numbers = 0,
      draw_one = 0,
      actions_light = 0,
      skip_everyone = 0,
      actions_dark = 0,
      wilds_light = 0,
      wilds_dark = 0,
      wild_draw2 = 0,
      wild_drawcolor = 0,
    }) =>
      parsePoints(numbers)
      + parsePoints(draw_one) * 10
      + parsePoints(actions_light) * 20
      + parsePoints(skip_everyone) * 30
      + parsePoints(actions_dark) * 20
      + parsePoints(wilds_light) * 40
      + parsePoints(wilds_dark) * 40
      + parsePoints(wild_draw2) * 50
      + parsePoints(wild_drawcolor) * 60,
  },
  uno_dos: {
    rows: [
      { label: "Números (1, 3–10)", key: "numbers", mult: null },
      { label: "Wild DOS™ (vale 2 de cualquier color)", key: "wild_dos", mult: 20 },
      { label: "Wild # (vale 1–10 del color de la carta)", key: "wild_num", mult: 40 },
    ],
    calc: ({ numbers = 0, wild_dos = 0, wild_num = 0 }) =>
      parsePoints(numbers) + parsePoints(wild_dos) * 20 + parsePoints(wild_num) * 40,
  },
};
