import { useEffect, useId, useState } from "react";
import type { SyntheticEvent } from "react";

function renderFamilyLayers(family: string) {
  switch (family) {
    case "uno":
      return (
        <>
          <rect x="14" y="20" width="96" height="140" rx="18" transform="rotate(-18 62 90)" fill="var(--hero-layer-1)" />
          <ellipse cx="56" cy="86" rx="26" ry="16" fill="var(--hero-bg-start)" opacity=".55" />
          <rect x="106" y="16" width="106" height="146" rx="20" transform="rotate(5 159 89)" fill="var(--hero-layer-2)" />
          <ellipse cx="162" cy="86" rx="30" ry="18" fill="var(--hero-bg-start)" opacity=".55" />
          <rect x="216" y="30" width="88" height="134" rx="16" transform="rotate(-6 260 97)" fill="var(--hero-shadow)" opacity=".28" />
          <ellipse cx="254" cy="94" rx="24" ry="14" fill="var(--hero-bg-start)" opacity=".35" />
        </>
      );
    case "playful":
      return (
        <>
          <circle cx="54" cy="62" r="46" fill="var(--hero-layer-1)" />
          <rect x="102" y="32" width="74" height="74" rx="18" transform="rotate(22 139 69)" fill="var(--hero-highlight)" opacity=".55" />
          <circle cx="216" cy="50" r="34" fill="var(--hero-layer-2)" />
          <circle cx="270" cy="126" r="36" fill="var(--hero-highlight)" opacity=".35" />
        </>
      );
    case "board":
      return (
        <>
          <rect x="12" y="10" width="146" height="160" rx="16" fill="var(--hero-layer-1)" />
          <path d="M12 44h146M12 76h146M12 108h146M12 140h146M46 10v160M80 10v160M114 10v160" stroke="var(--hero-line)" strokeWidth="3" opacity=".45" />
          <path d="M176 16 Q218 16 246 48 Q274 80 254 118 Q234 150 190 158" stroke="var(--hero-highlight)" strokeWidth="9" fill="none" strokeLinecap="round" />
          <circle cx="176" cy="16" r="9" fill="var(--hero-shadow)" />
        </>
      );
    case "casino":
      return (
        <>
          <circle cx="68" cy="84" r="62" fill="var(--hero-layer-1)" />
          <circle cx="68" cy="84" r="40" fill="none" stroke="var(--hero-line)" strokeWidth="6" />
          <circle cx="68" cy="84" r="20" fill="var(--hero-highlight)" opacity=".45" />
          <circle cx="68" cy="84" r="7" fill="var(--hero-line)" opacity=".35" />
          <rect x="152" y="18" width="124" height="144" rx="14" transform="rotate(7 214 90)" fill="var(--hero-layer-2)" />
        </>
      );
    case "dice":
      return (
        <>
          <rect x="20" y="14" width="112" height="112" rx="22" transform="rotate(-14 76 70)" fill="var(--hero-layer-1)" />
          <circle cx="44" cy="40" r="8" fill="var(--hero-line)" />
          <circle cx="108" cy="100" r="8" fill="var(--hero-line)" />
          <circle cx="44" cy="100" r="8" fill="var(--hero-line)" />
          <circle cx="108" cy="40" r="8" fill="var(--hero-line)" />
          <circle cx="76" cy="70" r="8" fill="var(--hero-line)" />
          <rect x="156" y="32" width="126" height="126" rx="26" transform="rotate(16 219 95)" fill="var(--hero-layer-2)" />
          <circle cx="180" cy="58" r="9" fill="var(--hero-highlight)" />
          <circle cx="258" cy="132" r="9" fill="var(--hero-highlight)" />
          <circle cx="258" cy="58" r="9" fill="var(--hero-highlight)" />
          <circle cx="180" cy="132" r="9" fill="var(--hero-highlight)" />
          <circle cx="219" cy="95" r="9" fill="var(--hero-highlight)" opacity=".55" />
        </>
      );
    case "cards":
    default:
      return (
        <>
          <rect x="16" y="12" width="98" height="156" rx="16" transform="rotate(-22 65 90)" fill="var(--hero-layer-1)" />
          <rect x="94" y="14" width="108" height="156" rx="18" transform="rotate(-3 148 92)" fill="var(--hero-layer-2)" />
          <rect x="188" y="24" width="102" height="148" rx="16" transform="rotate(18 239 98)" fill="var(--hero-highlight)" opacity=".45" />
          <path d="M30 116 Q96 72 200 90" stroke="var(--hero-line)" strokeWidth="8" strokeLinecap="round" fill="none" />
        </>
      );
  }
}

function renderGameSignals(gameId?: string) {
  switch (gameId) {
    case "uno":
      return (
        <>
          <rect x="208" y="36" width="74" height="56" rx="28" fill="var(--hero-signal)" />
          <rect x="212" y="40" width="66" height="48" rx="22" fill="none" stroke="var(--hero-highlight)" strokeWidth="3" />
          <rect x="215" y="43" width="60" height="42" rx="18" fill="var(--hero-signal)" />
          <text x="244" y="76" textAnchor="middle" fill="var(--hero-highlight)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="34" fontStyle="italic" letterSpacing="2">UNO</text>
        </>
      );
    case "uno_no_mercy":
      return (
        <>
          <rect x="208" y="36" width="74" height="56" rx="28" fill="var(--hero-signal)" />
          <rect x="212" y="40" width="66" height="48" rx="22" fill="none" stroke="var(--hero-highlight)" strokeWidth="3" />
          <circle cx="244" cy="64" r="18" fill="var(--hero-highlight)" />
          <circle cx="244" cy="64" r="14" fill="var(--hero-signal)" />
          <path d="M236 56 L252 72 M252 56 L236 72" stroke="var(--hero-highlight)" strokeWidth="4" strokeLinecap="round" />
          <text x="244" y="116" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11" letterSpacing="1" opacity=".7">NO MERCY</text>
        </>
      );
    case "uno_flip":
      return (
        <>
          <rect x="208" y="36" width="74" height="56" rx="28" fill="var(--hero-signal)" />
          <rect x="212" y="40" width="66" height="48" rx="22" fill="none" stroke="var(--hero-highlight)" strokeWidth="3" />
          <path d="M232 50 Q244 38 256 50" stroke="var(--hero-highlight)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <polygon points="256,44 260,50 252,50" fill="var(--hero-highlight)" />
          <path d="M256 78 Q244 90 232 78" stroke="var(--hero-highlight)" strokeWidth="5" fill="none" strokeLinecap="round" />
          <polygon points="232,84 228,78 236,78" fill="var(--hero-highlight)" />
          <text x="244" y="112" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontWeight="800" fontSize="11" letterSpacing="1" opacity=".7">FLIP</text>
        </>
      );
    case "uno_dos":
      return (
        <>
          <circle cx="244" cy="68" r="30" fill="var(--hero-signal)" />
          <circle cx="244" cy="68" r="24" fill="none" stroke="var(--hero-highlight)" strokeWidth="4" />
          <text x="244" y="78" textAnchor="middle" fill="var(--hero-highlight)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="32" fontStyle="italic">DOS</text>
        </>
      );
    case "truco":
      return (
        <>
          <rect x="204" y="30" width="72" height="108" rx="8" fill="none" stroke="var(--hero-signal)" strokeWidth="3" />
          <rect x="208" y="34" width="64" height="100" rx="6" fill="var(--hero-signal)" opacity=".15" />
          <text x="216" y="50" textAnchor="middle" fill="var(--hero-signal)" fontFamily="serif" fontWeight="700" fontSize="14">1</text>
          <text x="276" y="134" textAnchor="middle" fill="var(--hero-signal)" fontFamily="serif" fontWeight="700" fontSize="14" transform="rotate(180 276 134)">1</text>
          <g transform="translate(240, 78)" fill="none" stroke="var(--hero-signal)" strokeWidth="3">
            <path d="M-18 0 L18 0 M0-18 L0 18" />
            <circle cx="-12" cy="-12" r="5" />
            <circle cx="12" cy="-12" r="5" />
            <circle cx="-12" cy="12" r="5" />
            <circle cx="12" cy="12" r="5" />
          </g>
        </>
      );
    case "chin":
      return (
        <>
          <circle cx="220" cy="70" r="22" fill="none" stroke="var(--hero-signal)" strokeWidth="4" />
          <circle cx="268" cy="70" r="22" fill="none" stroke="var(--hero-signal)" strokeWidth="4" />
          <line x1="220" y1="52" x2="228" y2="60" stroke="var(--hero-signal)" strokeWidth="3" strokeLinecap="round" />
          <line x1="224" y1="52" x2="232" y2="60" stroke="var(--hero-signal)" strokeWidth="3" strokeLinecap="round" />
          <line x1="256" y1="52" x2="264" y2="60" stroke="var(--hero-signal)" strokeWidth="3" strokeLinecap="round" />
          <line x1="260" y1="52" x2="268" y2="60" stroke="var(--hero-signal)" strokeWidth="3" strokeLinecap="round" />
          <path d="M228 74 Q236 82 244 82 Q252 82 260 74" stroke="var(--hero-signal)" strokeWidth="3" fill="none" strokeLinecap="round" />
          <text x="222" y="112" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="10" opacity=".7">1vs1</text>
        </>
      );
    case "chancho":
      return (
        <>
          <ellipse cx="244" cy="72" rx="30" ry="24" fill="var(--hero-signal)" opacity=".2" />
          <ellipse cx="244" cy="72" rx="30" ry="24" fill="none" stroke="var(--hero-signal)" strokeWidth="4" />
          <circle cx="232" cy="64" r="5" fill="var(--hero-signal)" />
          <circle cx="256" cy="64" r="5" fill="var(--hero-signal)" />
          <circle cx="244" cy="70" r="2" fill="var(--hero-signal)" />
          <ellipse cx="244" cy="78" rx="8" ry="5" fill="var(--hero-signal)" />
          <path d="M218 56 Q208 44 216 36" stroke="var(--hero-signal)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M270 56 Q280 44 272 36" stroke="var(--hero-signal)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d="M230 92 Q244 100 258 92" stroke="var(--hero-shadow)" strokeWidth="3" fill="none" strokeLinecap="round" opacity=".5" />
          <text x="222" y="118" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" opacity=".6">CHANCHO</text>
        </>
      );
    case "chinchon":
    case "rummy":
    case "burako":
    case "canasta":
      return (
        <>
          <rect x="200" y="38" width="40" height="56" rx="4" fill="var(--hero-signal)" opacity=".9" transform="rotate(-10 220 66)" />
          <rect x="228" y="34" width="40" height="56" rx="4" fill="var(--hero-signal)" opacity=".75" transform="rotate(-2 248 62)" />
          <rect x="256" y="30" width="40" height="56" rx="4" fill="var(--hero-signal)" opacity=".6" transform="rotate(8 276 58)" />
          <text x="248" y="42" textAnchor="middle" fill="var(--hero-highlight)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8">Q</text>
          <text x="248" y="86" textAnchor="middle" fill="var(--hero-highlight)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8">K</text>
          <text x="276" y="82" textAnchor="middle" fill="var(--hero-highlight)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8">7</text>
        </>
      );
    case "sushi_do":
      return (
        <>
          <ellipse cx="236" cy="78" rx="28" ry="16" fill="var(--hero-highlight)" opacity=".9" />
          <rect x="214" y="70" width="44" height="4" rx="2" fill="var(--hero-shadow)" opacity=".3" />
          <rect x="214" y="80" width="44" height="4" rx="2" fill="var(--hero-shadow)" opacity=".3" />
          <ellipse cx="222" cy="72" rx="4" ry="6" fill="var(--hero-signal)" opacity=".6" />
          <ellipse cx="250" cy="72" rx="4" ry="6" fill="var(--hero-signal)" opacity=".6" />
          <ellipse cx="236" cy="86" rx="4" ry="3" fill="var(--hero-signal)" opacity=".4" />
          <rect x="256" y="58" width="4" height="44" rx="2" fill="var(--hero-shadow)" opacity=".6" />
          <rect x="262" y="56" width="3" height="40" rx="1.5" fill="var(--hero-shadow)" opacity=".5" />
        </>
      );
    case "ajedrez":
      return (
        <>
          <rect x="226" y="40" width="36" height="36" rx="4" fill="var(--hero-signal)" opacity=".15" />
          <path d="M235 36 L244 30 L253 36 L250 42 C250 46 253 52 253 58 L260 96 L228 96 L235 58 C235 52 238 46 238 42 Z" fill="var(--hero-signal)" />
          <rect x="222" y="98" width="44" height="8" rx="3" fill="var(--hero-signal)" />
          <rect x="228" y="106" width="32" height="12" rx="3" fill="var(--hero-shadow)" opacity=".5" />
          <circle cx="244" cy="46" r="3" fill="var(--hero-highlight)" opacity=".5" />
        </>
      );
    case "esquinados":
      return (
        <>
          <rect x="218" y="42" width="26" height="26" rx="4" fill="var(--hero-signal)" opacity=".9" />
          <rect x="254" y="42" width="26" height="26" rx="4" fill="var(--hero-highlight)" opacity=".9" />
          <rect x="218" y="82" width="26" height="26" rx="4" fill="var(--hero-highlight)" opacity=".65" />
          <rect x="254" y="82" width="26" height="26" rx="4" fill="var(--hero-signal)" opacity=".65" />
          <text x="231" y="58" textAnchor="middle" fill="var(--hero-bg-start)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10">1</text>
          <text x="267" y="58" textAnchor="middle" fill="var(--hero-bg-start)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10">2</text>
          <text x="231" y="98" textAnchor="middle" fill="var(--hero-bg-start)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10">3</text>
          <text x="267" y="98" textAnchor="middle" fill="var(--hero-bg-start)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10">4</text>
        </>
      );
    case "monopoly":
      return (
        <>
          <rect x="204" y="40" width="80" height="64" rx="8" fill="var(--hero-signal)" />
          <rect x="208" y="44" width="72" height="14" rx="3" fill="var(--hero-highlight)" opacity=".9" />
          <text x="244" y="55" textAnchor="middle" fill="var(--hero-signal)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10" letterSpacing="1">MONOPOLY</text>
          <rect x="234" y="64" width="20" height="18" rx="2" fill="var(--hero-highlight)" opacity=".8" />
          <polygon points="234,64 244,56 254,64" fill="var(--hero-highlight)" opacity=".8" />
          <rect x="260" y="66" width="14" height="16" rx="2" fill="var(--hero-highlight)" opacity=".6" />
          <polygon points="260,66 267,58 274,66" fill="var(--hero-highlight)" opacity=".6" />
          <rect x="214" y="84" width="14" height="16" rx="2" fill="var(--hero-highlight)" opacity=".5" />
          <polygon points="214,84 221,76 228,84" fill="var(--hero-highlight)" opacity=".5" />
          <rect x="244" y="88" width="20" height="12" rx="2" fill="var(--hero-highlight)" opacity=".7" />
          <polygon points="244,88 254,80 264,88" fill="var(--hero-highlight)" opacity=".7" />
        </>
      );
    case "life":
      return (
        <>
          <rect x="160" y="100" width="120" height="28" rx="14" fill="var(--hero-signal)" opacity=".15" />
          <path d="M170 114 L184 114 L196 90 L216 114 L230 90 L244 114 L258 90 L270 114 L286 114" stroke="var(--hero-signal)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="258" y="56" width="28" height="22" rx="6" fill="var(--hero-signal)" />
          <rect x="262" y="60" width="20" height="14" rx="3" fill="var(--hero-highlight)" />
          <rect x="270" y="66" width="8" height="4" rx="1" fill="var(--hero-shadow)" opacity=".5" />
          <circle cx="262" cy="82" r="5" fill="var(--hero-shadow)" />
          <circle cx="282" cy="82" r="5" fill="var(--hero-shadow)" />
        </>
      );
    case "poker":
      return (
        <>
          <circle cx="240" cy="78" r="30" fill="none" stroke="var(--hero-signal)" strokeWidth="5" />
          <circle cx="240" cy="78" r="22" fill="none" stroke="var(--hero-signal)" strokeWidth="1.5" strokeDasharray="4 3" />
          <path d="M240 56 L258 78 L240 100 L222 78 Z" fill="var(--hero-highlight)" opacity=".85" />
          <circle cx="240" cy="78" r="4" fill="var(--hero-shadow)" opacity=".6" />
        </>
      );
    case "blackjack":
      return (
        <>
          <rect x="210" y="34" width="28" height="44" rx="4" fill="var(--hero-highlight)" opacity=".9" />
          <text x="218" y="46" textAnchor="middle" fill="var(--hero-signal)" fontFamily="serif" fontWeight="700" fontSize="12">A</text>
          <text x="218" y="74" textAnchor="middle" fill="var(--hero-signal)" fontFamily="serif" fontSize="14">♠</text>
          <rect x="244" y="34" width="28" height="44" rx="4" fill="var(--hero-signal)" opacity=".8" />
          <text x="252" y="46" textAnchor="middle" fill="var(--hero-highlight)" fontFamily="serif" fontWeight="700" fontSize="12">J</text>
          <rect x="248" y="52" width="8" height="12" rx="3" fill="var(--hero-highlight)" transform="rotate(30 252 58)" />
          <circle cx="258" cy="68" r="4" fill="var(--hero-highlight)" />
        </>
      );
    case "generala":
      return (
        <>
          <rect x="204" y="40" width="72" height="72" rx="12" fill="none" stroke="var(--hero-signal)" strokeWidth="4" />
          <circle cx="220" cy="52" r="6" fill="var(--hero-signal)" />
          <circle cx="260" cy="52" r="6" fill="var(--hero-signal)" />
          <circle cx="240" cy="76" r="6" fill="var(--hero-highlight)" />
          <circle cx="220" cy="100" r="6" fill="var(--hero-signal)" />
          <circle cx="260" cy="100" r="6" fill="var(--hero-signal)" />
          <text x="244" y="128" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9" opacity=".6">GENERALA</text>
        </>
      );
    case "racha_perdida":
      return (
        <>
          <path d="M196 60 L210 68 L224 56 L240 72 L254 62 L268 72 L282 64" stroke="var(--hero-signal)" strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="196" cy="60" r="6" fill="var(--hero-signal)" />
          <path d="M278 86 L282 64 L294 74" stroke="var(--hero-shadow)" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".6" />
          <path d="M268 72 L276 80" stroke="var(--hero-shadow)" strokeWidth="5" fill="none" strokeLinecap="round" opacity=".6" />
          <text x="220" y="112" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8" opacity=".5">RACHA PERDIDA</text>
        </>
      );
    case "portion_counter":
      return (
        <>
          <circle cx="240" cy="74" r="34" fill="none" stroke="var(--hero-signal)" strokeWidth="4" />
          <path d="M240 40 A34 34 0 0 1 274 74 L240 74 Z" fill="var(--hero-signal)" opacity=".65" />
          <path d="M240 40 L240 74 L274 74" fill="none" stroke="var(--hero-shadow)" strokeWidth="2" opacity=".4" />
          <circle cx="240" cy="74" r="10" fill="var(--hero-highlight)" />
          <text x="240" y="78" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="10">½</text>
          <line x1="206" y1="74" x2="274" y2="74" stroke="var(--hero-shadow)" strokeWidth="2" opacity=".3" />
          <line x1="240" y1="40" x2="240" y2="108" stroke="var(--hero-shadow)" strokeWidth="2" opacity=".3" />
        </>
      );
    case "basta_dym":
      return (
        <>
          <rect x="204" y="36" width="72" height="72" rx="8" fill="var(--hero-signal)" opacity=".1" />
          <rect x="204" y="36" width="72" height="72" rx="8" fill="none" stroke="var(--hero-signal)" strokeWidth="3" />
          <line x1="228" y1="36" x2="228" y2="108" stroke="var(--hero-shadow)" strokeWidth="2" opacity=".4" />
          <line x1="252" y1="36" x2="252" y2="108" stroke="var(--hero-shadow)" strokeWidth="2" opacity=".4" />
          <line x1="204" y1="60" x2="276" y2="60" stroke="var(--hero-shadow)" strokeWidth="2" opacity=".4" />
          <line x1="204" y1="84" x2="276" y2="84" stroke="var(--hero-shadow)" strokeWidth="2" opacity=".4" />
          <text x="216" y="52" textAnchor="middle" fill="var(--hero-signal)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9">A</text>
          <text x="216" y="76" textAnchor="middle" fill="var(--hero-signal)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9">B</text>
          <text x="216" y="100" textAnchor="middle" fill="var(--hero-signal)" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="9">C</text>
          <text x="240" y="52" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontSize="8" opacity=".6">País</text>
          <text x="240" y="76" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontSize="8" opacity=".6">Color</text>
          <text x="240" y="100" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontSize="8" opacity=".6">Fruta</text>
          <text x="264" y="52" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontSize="7" opacity=".5">___</text>
          <text x="264" y="76" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontSize="7" opacity=".5">___</text>
          <text x="264" y="100" textAnchor="middle" fill="var(--hero-shadow)" fontFamily="Arial, sans-serif" fontSize="7" opacity=".5">___</text>
          <path d="M214 116 L240 108 L266 116" stroke="var(--hero-highlight)" strokeWidth="2" fill="none" strokeLinecap="round" opacity=".5" />
        </>
      );
    case "custom":
      return (
        <>
          <rect x="206" y="40" width="68" height="68" rx="10" fill="none" stroke="var(--hero-signal)" strokeWidth="3" />
          <rect x="214" y="48" width="52" height="4" rx="2" fill="var(--hero-shadow)" opacity=".5" />
          <circle cx="242" cy="50" r="8" fill="var(--hero-signal)" />
          <rect x="214" y="64" width="52" height="4" rx="2" fill="var(--hero-shadow)" opacity=".5" />
          <circle cx="226" cy="66" r="8" fill="var(--hero-highlight)" />
          <rect x="214" y="80" width="52" height="4" rx="2" fill="var(--hero-shadow)" opacity=".5" />
          <circle cx="256" cy="82" r="8" fill="var(--hero-signal)" />
        </>
      );
    default:
      return null;
  }
}

interface HomeGameHeroProps {
  family: string;
  state?: "idle" | "active" | "recent";
  title: string;
  gameId?: string;
  tone?: string;
  coverImage?: string;
}

export default function HomeGameHero({ family, state = "idle", title, gameId, tone, coverImage }: HomeGameHeroProps) {
  const heroId = useId().replace(/:/g, "");
  const [coverState, setCoverState] = useState<"idle" | "loaded" | "error">(
    coverImage ? "idle" : "error",
  );

  useEffect(() => {
    setCoverState(coverImage ? "idle" : "error");
  }, [coverImage]);

  if (coverImage && coverState !== "error") {
    return (
      <div
        className={`home-card-hero home-card-hero--${state} home-card-hero--has-cover${coverState === "loaded" ? " is-loaded" : ""}`}
        data-hero-family={family}
        data-hero-game={gameId}
        data-hero-tone={tone || "classic"}
        aria-hidden="true"
      >
        <div className="home-card-hero-placeholder" />
        <img
          className="home-card-hero-cover"
          src={coverImage}
          alt=""
          loading="eager"
          decoding="async"
          onLoad={() => setCoverState("loaded")}
          onError={(event: SyntheticEvent<HTMLImageElement>) => {
            event.currentTarget.style.display = "none";
            setCoverState("error");
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={`home-card-hero home-card-hero--${state}`}
      data-hero-family={family}
      data-hero-game={gameId}
      data-hero-tone={tone || "classic"}
      aria-hidden="true"
    >
      <svg viewBox="0 0 320 180" role="img" aria-label={title}>
        <defs>
          <linearGradient id={`hero-fade-${family}-${heroId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--hero-bg-start)" />
            <stop offset="100%" stopColor="var(--hero-bg-end)" />
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="320" height="180" rx="24" fill={`url(#hero-fade-${family}-${heroId})`} />
        {renderFamilyLayers(family)}
        {renderGameSignals(gameId)}
      </svg>
    </div>
  );
}
