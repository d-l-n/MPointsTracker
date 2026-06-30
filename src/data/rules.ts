type RulesSection = {
  title: string;
  text: string;
};

type RuleEntry = {
  id: string;
  name: string;
  emoji: string;
  color: string;
  sections: RulesSection[];
};

import RULES_DATA_RAW from "./rules.json" with { type: "json" };

const RULES_DATA: RuleEntry[] = RULES_DATA_RAW;

function getRulesData(t: (key: string) => string): RuleEntry[] {
  const TM = {
    "Blackjack": "rsBlackjack",
    "Bonificaciones de color": "rsColorBonus",
    "Cartas de acción": "rsActionCards",
    "Cartas especiales": "rsSpecialCards",
    "Chinchón": "rsChinchon",
    "Combinaciones": "rsCombos",
    "Comodines": "rsJokers",
    "Cómo cortar": "rsHowToClose",
    "Cómo jugar": "rsHowToPlay",
    "Cómo se juega": "rsHowToPlay2",
    "Desarrollo": "rsHandDev",
    "Doble generala": "rsDoubleGenerala",
    "Duración": "rsDuration",
    "El Envido": "rsEnvido",
    "El Showdown": "rsShowdown",
    "El Truco": "rsTruco",
    "El concepto Flip": "rsFlipConcept",
    "El crupier": "rsDealer",
    "El pozo": "rsThePot",
    "Fin de la ronda": "rsEndOfRound",
    "Fin del juego": "rsEndOfGame",
    "Final del turno": "rsEndOfTurn",
    "Generala servida": "rsServedGenerala",
    "Jerarquía de cartas": "rsCardRanking",
    "Jerarquía de manos": "rsHandRanking",
    "La Flor": "rsFlor",
    "Lado Claro — Cartas de acción": "rsLightSide",
    "Lado Oscuro — Cartas de acción": "rsDarkSide",
    "Las cartas": "rsCards",
    "Las letras": "rsLetters",
    "Materiales": "rsEquipment",
    "Números": "rsNumbers",
    "Objetivo": "rsObjective",
    "Preparación": "rsPrep",
    "Puntuación": "rsScoring",
    "Puntuación por ronda": "rsRoundScoring",
    "Regla DOS": "rsDosRule",
    "Reglas de la casa": "rsHouseRules",
    "Reglas especiales": "rsSpecialRules",
    "Resultados": "rsResults",
    "Rondas de apuesta": "rsBettingRounds",
    "Rummy": "rsRummy",
    "Seguimiento": "rsTracking",
    "Seguimiento en la app": "rsTracking",
    "Las piezas": "rsPieces",
    "Jaque y jaque mate": "rsCheckMate",
    "Tablas (empate)": "rsDraws",
    "Tipos de pareja": "rsPairTypes",
    "Táctica": "rsTactics",
    "Valor de las cartas": "rsHandValue",
    "Variante Texas Hold'em": "rsTexasHoldem",
    "Variante sin fichas": "rsNoTokens",
    "Variantes comunes": "rsCommonVariants",
    "Canastas": "rsCanastas",
    // Racha Perdida
    "¿Qué es una racha?": "rsWhatIsStreak",
    "Cómo registrar": "rsHowToRegister",
    "Penitencias": "rsPenalties",
    "Stats": "rsStats2",
    "Nota": "rsNote",
  };
  return RULES_DATA.map((game) => ({
    ...game,
    name: t(`gn_${game.id}`) || game.name,
    sections: game.sections.map((s, i) => ({
      ...s,
      title: TM[s.title] ? t(TM[s.title]) || s.title : s.title,
      text: t(`r_${game.id}_${i}`) || s.text,
    })),
  }));
}

export { RULES_DATA, getRulesData };
