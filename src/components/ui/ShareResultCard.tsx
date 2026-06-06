import { useCallback, useState, type CSSProperties } from "react";

import { getGameName } from "../../data/games";
import { formatUnoRosterSummary } from "../../lib/unoRosterSummary";
import type { GameDefinition, Match, PlayerResult, TranslationFn } from "../../types";

interface ShareTheme {
  mode: "light" | "dark" | "oled";
  background: { start: string; end: string };
  glow: string;
  text: string;
  textMuted: string;
  textSoft: string;
  headerFill: string;
  headerStroke: string;
  cardFill: string;
  cardStroke: string;
  winnerFillStart: string;
  winnerFillEnd: string;
  winnerStroke: string;
  footer: string;
  positive: string;
  negative: string;
}

interface ShareMatchPlayer extends PlayerResult {
  net?: number;
}

interface ShareMatch extends Match {
  players?: ShareMatchPlayer[];
  gameName?: string;
  gameEmoji?: string;
  rounds?: number;
}

interface ShareResultButtonProps {
  match: ShareMatch;
  game?: GameDefinition | null;
  t?: TranslationFn;
}

declare global {
  interface Navigator {
    canShare?: (data?: ShareData) => boolean;
    share?: (data?: ShareData) => Promise<void>;
  }
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

export function resolveShareTheme(themeMode = "dark", gameColor = "#006D77"): ShareTheme {
  const mode = themeMode === "oled" ? "oled" : themeMode === "light" ? "light" : "dark";
  if (mode === "light") {
    return {
      mode,
      background: { start: "#f5f7ff", end: "#dfe8ff" },
      glow: `${gameColor}22`,
      text: "#101426",
      textMuted: "#40506f",
      textSoft: "#6a7694",
      headerFill: "rgba(255,255,255,0.84)",
      headerStroke: `${gameColor}22`,
      cardFill: "rgba(255,255,255,0.78)",
      cardStroke: "rgba(104,116,148,0.14)",
      winnerFillStart: `${gameColor}20`,
      winnerFillEnd: `${gameColor}10`,
      winnerStroke: `${gameColor}38`,
      footer: "rgba(40,52,82,0.42)",
      positive: "#1f8f65",
      negative: "#c2374a",
    };
  }

  if (mode === "oled") {
    return {
      mode,
      background: { start: "#010101", end: "#05060b" },
      glow: `${gameColor}26`,
      text: "#f7f8ff",
      textMuted: "rgba(247,248,255,0.76)",
      textSoft: "rgba(247,248,255,0.5)",
      headerFill: "rgba(10,10,14,0.96)",
      headerStroke: `${gameColor}18`,
      cardFill: "rgba(9,10,14,0.96)",
      cardStroke: "rgba(255,255,255,0.05)",
      winnerFillStart: `${gameColor}24`,
      winnerFillEnd: `${gameColor}0c`,
      winnerStroke: `${gameColor}3c`,
      footer: "rgba(247,248,255,0.26)",
      positive: "#52b788",
      negative: "#E63946",
    };
  }

  return {
    mode,
    background: { start: "#0f1118", end: "#181b28" },
    glow: `${gameColor}28`,
    text: "#ffffff",
    textMuted: "rgba(255,255,255,0.78)",
    textSoft: "rgba(255,255,255,0.5)",
    headerFill: "rgba(255,255,255,0.05)",
    headerStroke: `${gameColor}26`,
    cardFill: "rgba(255,255,255,0.04)",
    cardStroke: "rgba(255,255,255,0.06)",
    winnerFillStart: `${gameColor}24`,
    winnerFillEnd: `${gameColor}0a`,
    winnerStroke: `${gameColor}44`,
    footer: "rgba(255,255,255,0.22)",
    positive: "#52b788",
    negative: "#E63946",
  };
}

export function buildShareResultText(match: ShareMatch): string {
  const parts = [
    match.winner ? `🏆 ${match.winner}` : "",
    formatUnoRosterSummary(match) || "",
  ].filter(Boolean);
  return parts.join("\n");
}

export async function generateResultImage(
  match: ShareMatch,
  game?: GameDefinition | null,
  themeMode = "dark",
  t: TranslationFn = ((key: string) => key) as TranslationFn,
): Promise<Blob | null> {
  const W = 640;
  const H = 480;
  const canvas = document.createElement("canvas");
  canvas.width = W * 2;
  canvas.height = H * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  ctx.scale(2, 2);

  const gameColor = game?.color || "#006D77";
  const gameName = match.gameName || (game ? getGameName(game.id, t) : "Partida");
  const gameEmoji = match.gameEmoji || game?.emoji || "🎮";
  const palette = resolveShareTheme(themeMode, gameColor);

  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, palette.background.start);
  bg.addColorStop(1, palette.background.end);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  const glow = ctx.createRadialGradient(W * 0.5, 80, 0, W * 0.5, 80, 280);
  glow.addColorStop(0, palette.glow);
  glow.addColorStop(1, "transparent");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  drawRoundedRect(ctx, 20, 18, W - 40, 64, 14);
  ctx.fillStyle = palette.headerFill;
  ctx.fill();
  ctx.strokeStyle = palette.headerStroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.font = "bold 26px 'Segoe UI Emoji', sans-serif";
  ctx.fillStyle = palette.text;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText(gameEmoji, 36, 50);

  ctx.font = "bold 22px 'Bebas Neue', 'Arial Narrow', sans-serif";
  ctx.fillStyle = gameColor;
  ctx.fillText(gameName.toUpperCase(), 72, 50);

  if ((match.rounds || 0) > 0) {
    const badge = `${match.rounds} RDS`;
    ctx.font = "bold 11px 'Google Sans', Arial, sans-serif";
    const bw = ctx.measureText(badge).width + 18;
    drawRoundedRect(ctx, W - 26 - bw, 35, bw, 30, 8);
    ctx.fillStyle = palette.winnerFillStart;
    ctx.fill();
    ctx.strokeStyle = palette.winnerStroke;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = gameColor;
    ctx.textAlign = "center";
    ctx.fillText(badge, W - 26 - bw / 2, 50);
  }

  const players = [...(match.players || [])].sort((a, b) => {
    if (match.winner && a.name === match.winner) return -1;
    if (match.winner && b.name === match.winner) return 1;
    return (b.score ?? 0) - (a.score ?? 0);
  });

  const cardH = 64;
  const cardGap = 10;
  const cardY0 = 102;
  const maxCards = Math.min(players.length, 5);

  players.slice(0, maxCards).forEach((player, index) => {
    const y = cardY0 + index * (cardH + cardGap);
    const isWin = player.name === match.winner;
    const medals = ["🥇", "🥈", "🥉"];

    drawRoundedRect(ctx, 20, y, W - 40, cardH, 12);
    if (isWin) {
      const cardBg = ctx.createLinearGradient(20, y, W - 20, y);
      cardBg.addColorStop(0, palette.winnerFillStart);
      cardBg.addColorStop(1, palette.winnerFillEnd);
      ctx.fillStyle = cardBg;
    } else {
      ctx.fillStyle = palette.cardFill;
    }
    ctx.fill();
    ctx.strokeStyle = isWin ? palette.winnerStroke : palette.cardStroke;
    ctx.lineWidth = isWin ? 1.5 : 1;
    ctx.stroke();

    if (isWin) {
      drawRoundedRect(ctx, 20, y, 4, cardH, 2);
      ctx.fillStyle = gameColor;
      ctx.fill();
    }

    ctx.font = "20px 'Segoe UI Emoji', sans-serif";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(medals[index] || `${index + 1}`, 34, y + cardH / 2);

    ctx.font = isWin ? "bold 17px 'Google Sans', Arial, sans-serif" : "16px 'Google Sans', Arial, sans-serif";
    ctx.fillStyle = isWin ? palette.text : palette.textMuted;
    let name = player.name || "";
    while (name.length > 1 && ctx.measureText(name).width > W - 200) {
      name = name.slice(0, -1);
    }
    if (name !== player.name) name += "…";
    ctx.fillText(name, 70, y + cardH / 2 - ((player.score ?? null) != null ? 8 : 0));

    if ((player.score ?? null) != null) {
      ctx.font = "bold 12px 'Google Sans', Arial, sans-serif";
      ctx.fillStyle = isWin ? gameColor : "rgba(255,255,255,0.45)";
      ctx.fillText(`${player.score} pts`, 70, y + cardH / 2 + 10);
    }

    if ((player.net ?? null) != null && player.net !== 0) {
      const netStr = `${player.net > 0 ? "+" : ""}$${Math.abs(player.net).toFixed(2)}`;
      ctx.font = "bold 13px 'Google Sans', Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = player.net > 0 ? palette.positive : palette.negative;
      ctx.fillText(netStr, W - 30, y + cardH / 2);
    } else if ((player.score ?? null) != null) {
      ctx.font = isWin ? "bold 22px 'Google Sans', Arial, sans-serif" : "18px 'Google Sans', Arial, sans-serif";
      ctx.textAlign = "right";
      ctx.fillStyle = isWin ? palette.text : palette.textSoft;
      ctx.fillText(String(player.score), W - 30, y + cardH / 2);
    }
  });

  const footerY = cardY0 + maxCards * (cardH + cardGap) + 12;
  ctx.font = "11px 'Google Sans', Arial, sans-serif";
  ctx.fillStyle = palette.footer;
  ctx.textAlign = "center";
  ctx.fillText("MPoints Tracker", W / 2, Math.max(footerY, H - 22));

  return new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
}

export function ShareResultButton({ match, game, t = ((key: string) => key) as TranslationFn }: ShareResultButtonProps) {
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (sharing) return;
    setSharing(true);
    try {
      const themeMode =
        document.documentElement?.getAttribute("data-theme") ||
        (document.body.classList.contains("light") ? "light" : document.body.classList.contains("oled") ? "oled" : "dark");
      const blob = await generateResultImage(match, game, themeMode, t);
      if (!blob) return;
      const gameName = match.gameName || (game ? getGameName(game.id, t) : "Partida");
      const shareText = buildShareResultText(match);
      const fileName = `mpoints_${gameName.replace(/\s+/g, "_").toLowerCase()}_${Date.now()}.png`;
      const file = new File([blob], fileName, { type: "image/png" });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share?.({
          files: [file],
          title: `${gameName} — MPoints`,
          text: shareText,
        });
      } else {
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
      }
    } catch (errorValue) {
      if (!(errorValue instanceof DOMException && errorValue.name === "AbortError")) {
        console.error("Share error:", errorValue);
      }
    } finally {
      setSharing(false);
    }
  }, [game, match, sharing, t]);

  return (
    <button
      onClick={handleShare}
      disabled={sharing}
      style={
        {
          display: "flex",
          alignItems: "center",
          gap: 7,
          padding: "8px 14px",
          borderRadius: "var(--rxs)",
          border: "1.5px solid color-mix(in srgb,var(--gc) 40%,transparent)",
          background: "color-mix(in srgb,var(--gc) 12%,transparent)",
          color: "var(--gc)",
          cursor: sharing ? "default" : "pointer",
          fontFamily: "'Google Sans', sans-serif",
          fontSize: ".76rem",
          fontWeight: 800,
          flexShrink: 0,
          opacity: sharing ? 0.6 : 1,
          transition: "var(--t)",
        } as CSSProperties
      }
    >
      {sharing ? "⏳" : "📤"}
      {t("shareResult") || "Compartir"}
    </button>
  );
}

export default ShareResultButton;
