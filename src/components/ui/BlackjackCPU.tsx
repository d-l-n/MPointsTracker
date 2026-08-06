// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useAppContext } from "../../context/AppContext";

/* ══════════════════════════════════════════════════════════════════════════
   🃏  BLACKJACK VS CPU  —  Easter Egg v5
   - Fondo sólido para legibilidad en ambos temas
   - ThemeToggle integrado: pide cambios al hook de tema de la app
   - Las CSS variables se inyectan según el tema detectado al montar
══════════════════════════════════════════════════════════════════════════ */

type Suit = "♠" | "♥" | "♦" | "♣";
type Value = "A" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10" | "J" | "Q" | "K";
type ResultKind = "win" | "lose" | "push" | "bj" | "bust";
interface CardData {
  v: Value;
  s: Suit;
  id: string;
}

const SUITS: Suit[]  = ["♠","♥","♦","♣"];
const VALUES: Value[] = ["A","2","3","4","5","6","7","8","9","10","J","Q","K"];
const CARD_N: Record<Value, number> = {A:11,"2":2,"3":3,"4":4,"5":5,"6":6,"7":7,"8":8,"9":9,"10":10,J:10,Q:10,K:10};
const RED_S: Set<Suit>  = new Set<Suit>(["♥","♦"]);
const NUM_DECKS = 6;
const RESHUFFLE_AT = Math.floor(NUM_DECKS * 52 * 0.30);

function makeDeck(): CardData[] {
  const d: CardData[]=[];
  for (let n=0;n<NUM_DECKS;n++)
    for (const s of SUITS)
      for (const v of VALUES)
        d.push({v,s,id:`${n}-${v}-${s}-${Math.random()}`});
  return d;
}
function shuffle<T>(arr: T[]): T[] {
  const a=[...arr];
  for (let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}
  return a;
}
function handVal(cards: CardData[]): number {
  let t=0,a=0;
  for (const c of cards){t+=CARD_N[c.v];if(c.v==="A")a++;}
  while(t>21&&a-->0) t-=10;
  return t;
}
function isBJ(c: CardData[]): boolean   { return c.length===2&&handVal(c)===21; }
function isBust(c: CardData[]): boolean { return handVal(c)>21; }
function isPair(c: CardData[]): boolean { return c.length===2&&CARD_N[c[0].v]===CARD_N[c[1].v]; }
function isSoft17(c: CardData[]): boolean {
  let t=0,a=0;
  for(const x of c){t+=CARD_N[x.v];if(x.v==="A")a++;}
  return a>0&&t===17;
}

interface BjStats { wins: number; losses: number; pushes: number; bjs: number; }
interface HistItem { icon: string; label: string; detail: string; net: number; }
interface SavedState { chips?: number; stats?: BjStats; hist?: HistItem[]; }

const SK="bj_cpu_v2";
function loadSaved(): SavedState | null {try{return JSON.parse(localStorage.getItem(SK) ?? "null")||null;}catch{return null;}}
function doSave(s: SavedState){try{localStorage.setItem(SK,JSON.stringify(s));}catch{/* ignore */}}

/* ── Detectar y solicitar cambios de tema desde el portal ──────────────── */
const THEME_MODE_CHANGE_EVENT = "bgt:theme-mode-change";
function getThemeRoot() { return document.documentElement; }
function isDarkTheme() {
  const root = getThemeRoot();
  const activeTheme = root?.dataset?.theme;
  if (activeTheme) return activeTheme === "dark" || activeTheme === "oled";
  return root?.classList.contains("dark") ?? false;
}
function requestAppThemeMode(mode: "light" | "dark") {
  window.dispatchEvent(new CustomEvent(THEME_MODE_CHANGE_EVENT, { detail: mode }));
}

/* ── Tokens de tema para el portal (fuera del .app) ───────────────────── */
interface ThemeTokens {
  modalBg: string; panelBg: string; panelBorder: string; panelShadow: string;
  tx: string; tx2: string; tx3: string; bo: string; gc: string;
  tabActiveBg: string; tabInactiveColor: string; overlayBg: string;
}
function getThemeTokens(dark: boolean): ThemeTokens {
  if (dark) {
    return {
      modalBg:     "rgba(5, 18, 20, 0.97)",
      panelBg:     "rgba(10, 34, 38, 0.92)",
      panelBorder: "rgba(0, 109, 119, 0.38)",
      panelShadow: "0 2px 16px rgba(0,0,0,0.6)",
      tx:          "#e7fbfd",
      tx2:         "#a8cdd1",
      tx3:         "#6f9ea4",
      bo:          "rgba(255,255,255,0.08)",
      gc:          "#006D77",
      tabActiveBg: "#006D77",
      tabInactiveColor: "#a8cdd1",
      overlayBg:   "rgba(0,0,0,0.82)",
    };
  }
  return {
    modalBg:     "rgba(232, 248, 250, 0.99)",
    panelBg:     "rgba(255, 255, 255, 0.82)",
    panelBorder: "rgba(0, 109, 119, 0.30)",
    panelShadow: "0 2px 12px rgba(0,109,119,0.12)",
    tx:          "#102f34",
    tx2:         "#315d63",
    tx3:         "#6f8f94",
    bo:          "rgba(0,0,0,0.08)",
    gc:          "#006D77",
    tabActiveBg: "#006D77",
    tabInactiveColor: "#315d63",
    overlayBg:   "rgba(0,50,58,0.65)",
  };
}

/* ── Card ──────────────────────────────────────────────────────────────── */
interface CardProps { card?: CardData; hidden?: boolean; animate?: boolean; }
function Card({card,hidden=false,animate=false}: CardProps) {
  const [vis,setVis]=useState(!animate);
  useEffect(()=>{
    if(animate){const t=setTimeout(()=>setVis(true),80);return()=>clearTimeout(t);}
  },[animate]);

  const base={
    width:54,height:78,borderRadius:8,flexShrink:0,
    boxShadow:"0 4px 14px rgba(0,0,0,.35), 0 1px 0 rgba(255,255,255,.15) inset",
    transition:animate?"opacity .2s ease, transform .2s ease":"none",
    opacity:vis?1:0,
    transform:vis?"translateY(0) scale(1)":"translateY(-10px) scale(.92)",
    userSelect:"none",
  };
  if (hidden) return (
    <div style={{...base,
      background:"linear-gradient(145deg,#006D77 0%,#003C43 100%)",
      border:"1.5px solid rgba(0,109,119,0.4)",
      display:"flex",alignItems:"center",justifyContent:"center",fontSize:"1.3rem"}}>🃏</div>
  );
  const red=RED_S.has(card.s);
  const col=red?"#c0392b":"#111";
  return (
    <div style={{...base,background:"#fff",border:"1.5px solid #d0d0d0",
      display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"5px 6px"}}>
      <span style={{fontSize:".7rem",fontWeight:900,color:col,lineHeight:1}}>{card.v}</span>
      <span style={{fontSize:"1.15rem",color:col,textAlign:"center",lineHeight:1}}>{card.s}</span>
      <span style={{fontSize:".7rem",fontWeight:900,color:col,lineHeight:1,alignSelf:"flex-end",transform:"rotate(180deg)"}}>{card.v}</span>
    </div>
  );
}

/* ── HandArea ──────────────────────────────────────────────────────────── */
interface HandAreaProps {
  cards: CardData[];
  hideSecond?: boolean;
  label?: string;
  bet?: number;
  active?: boolean;
  result?: ResultKind | null;
  tk: ThemeTokens;
  t?: (key: string) => string;
}
function HandArea({cards,hideSecond=false,label,bet=0,active=false,result=null,tk,t = (key) => key}: HandAreaProps) {
  const val=hideSecond?handVal([cards[0]]):handVal(cards);
  const bust=!hideSecond&&val>21;
  const bj=isBJ(cards)&&!hideSecond;
  const RC={win:"#52b788",lose:"#e63946",push:tk.tx3,bj:"#f4c430",bust:"#e63946"};
  const RL={win:t("bjCpuRLWin"),lose:t("bjCpuRLLose"),push:t("bjCpuRLPush"),bj:t("bjCpuRLBj"),bust:t("bjCpuRLBust")};
  const rc=result?RC[result]:null;
  return (
    <div style={{
      marginBottom:10,padding:"10px 14px",borderRadius:14,
      background: active
        ? `color-mix(in srgb,${tk.gc} 12%,${tk.panelBg})`
        : tk.panelBg,
      border: active
        ? `1.5px solid color-mix(in srgb,${tk.gc} 55%,${tk.panelBorder})`
        : `1px solid ${tk.panelBorder}`,
      boxShadow: active
        ? `${tk.panelShadow}, 0 0 0 1px color-mix(in srgb,${tk.gc} 18%,transparent)`
        : tk.panelShadow,
      transition:"border .2s,background .2s",
    }}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:".58rem",fontWeight:800,letterSpacing:"2.5px",color:tk.tx3,textTransform:"uppercase"}}>{label}</span>
          {active&&<span style={{width:7,height:7,borderRadius:"50%",background:tk.gc,display:"inline-block",
            boxShadow:`0 0 8px ${tk.gc}`}}/>}
          {bet>0&&<span style={{fontSize:".65rem",color:"#f4c430",fontWeight:700}}>💰 {bet}</span>}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          {!hideSecond&&cards.length>0&&(
            <span style={{fontSize:"1rem",fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,
              color:bust?"#e63946":bj?"#f4c430":rc||tk.tx}}>
              {val}{bj?" 🎉":""}{bust?" 💥":""}
            </span>
          )}
          {result&&(
            <span style={{fontSize:".6rem",fontWeight:800,letterSpacing:"1px",color:rc,
              padding:"2px 8px",borderRadius:6,
              background:`color-mix(in srgb,${rc} 20%,${tk.panelBg})`,
              border:`1px solid color-mix(in srgb,${rc} 50%,transparent)`}}>
              {RL[result]||result}
            </span>
          )}
        </div>
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",minHeight:78}}>
        {cards.map((c,i)=>(
          <Card key={c.id||i} card={c} hidden={hideSecond&&i===1}
            animate={i===cards.length-1&&cards.length>0}/>
        ))}
      </div>
    </div>
  );
}

/* ── Chip ──────────────────────────────────────────────────────────────── */
const CHIPS=[
  {v:5,color:"#e63946"},{v:10,color:"#2196f3"},{v:25,color:"#52b788"},
  {v:50,color:"#9c27b0"},{v:100,color:"#ff9800"},{v:500,color:"#f4c430"},
];
interface Chip { v: number; color: string; }
interface ChipBtnProps { chip: Chip; disabled?: boolean; onClick?: () => void; }
function ChipBtn({chip,disabled,onClick}: ChipBtnProps) {
  return (
    <button onClick={onClick} disabled={disabled} style={{
      width:52,height:52,borderRadius:"50%",cursor:disabled?"not-allowed":"pointer",flexShrink:0,
      border:`3px solid ${chip.color}`,
      background:`radial-gradient(circle at 38% 35%,color-mix(in srgb,${chip.color} 40%,#fff),color-mix(in srgb,${chip.color} 55%,#111))`,
      color:"#fff",fontWeight:900,fontSize:chip.v>=100?".65rem":".78rem",
      boxShadow:`0 3px 10px color-mix(in srgb,${chip.color} 45%,transparent),inset 0 1px 0 rgba(255,255,255,.3)`,
      opacity:disabled?.3:1,transition:"transform .12s,opacity .15s",
      textShadow:"0 1px 3px rgba(0,0,0,.55)",
    }}
      onMouseEnter={e=>!disabled&&(e.currentTarget.style.transform="scale(1.12)")}
      onMouseLeave={e=>(e.currentTarget.style.transform="scale(1)")}>
      {chip.v>=1000?`${chip.v/1000}k`:chip.v}
    </button>
  );
}

/* ── HistEntry ─────────────────────────────────────────────────────────── */
interface HistEntryProps { e: HistItem; tk: ThemeTokens; }
function HistEntry({e,tk}: HistEntryProps) {
  const col=e.net>0?"#52b788":e.net<0?"#e63946":tk.tx3;
  return (
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
      padding:"8px 0",borderBottom:`1px solid ${tk.bo}`}}>
      <div style={{display:"flex",gap:8,alignItems:"center"}}>
        <span style={{fontSize:"1rem"}}>{e.icon}</span>
        <div>
          <div style={{fontSize:".75rem",fontWeight:700,color:tk.tx}}>{e.label}</div>
          <div style={{fontSize:".62rem",color:tk.tx3}}>{e.detail}</div>
        </div>
      </div>
      <span style={{fontSize:".82rem",fontWeight:900,color:col}}>{e.net>0?`+${e.net}`:e.net}</span>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   MAIN
══════════════════════════════════════════════════════════════════════════ */
interface BlackjackCPUProps { onClose: () => void; }
function BlackjackCPU({onClose}: BlackjackCPUProps) {
  const { t } = useAppContext();
  const saved=loadSaved();
  const deckRef=useRef<CardData[] | null>(null);
  if (deckRef.current === null) {
    deckRef.current = shuffle(makeDeck());
  }

  // ── Tema propio: lee html[data-theme] y escucha cambios del hook global ─
  const [dark, setDark] = useState(isDarkTheme);
  useEffect(() => {
    const el = getThemeRoot();
    if (!el) return;
    const obs = new MutationObserver(() => setDark(isDarkTheme()));
    obs.observe(el, { attributes: true, attributeFilter: ["class", "data-theme"] });
    return () => obs.disconnect();
  }, []);
  const tk = getThemeTokens(dark);
  const handleToggleTheme = useCallback(() => {
    requestAppThemeMode(dark ? "light" : "dark");
  }, [dark]);

  const [chips,   setChips]  = useState(saved?.chips  ?? 500);
  const [stats,   setStats]  = useState(saved?.stats  ?? {wins:0,losses:0,pushes:0,bjs:0});
  const [hist,    setHist]   = useState(saved?.hist   ?? []);
  const [tab,     setTab]    = useState("game");

  const [phase,        setPhase]       = useState("bet");
  const [bet,          setBet]         = useState(0);
  const [dealer,       setDealer]      = useState([]);
  const [hand,         setHand]        = useState([]);
  const [splitHand,    setSplitHand]   = useState([]);
  const [activeHand,   setActiveHand]  = useState("main");
  const [handResult,   setHandResult]  = useState(null);
  const [splitResult,  setSplitResult] = useState(null);
  const [doubled,      setDoubled]     = useState(false);
  const [splitDoubled, setSplitDoubled]= useState(false);
  const [deckCount,    setDeckCount]   = useState(1);

  useEffect(()=>{doSave({chips,stats,hist:hist.slice(0,50)});},[chips,stats,hist]);

  const addHist=useCallback((e)=>{
    setHist(h=>[{...e,ts:Date.now()},...h].slice(0,50));
  },[]);

  const drawCards=useCallback((n=1)=>{
    if(deckRef.current.length-n<RESHUFFLE_AT) deckRef.current=shuffle(makeDeck());
    const drawn=deckRef.current.splice(0,n);
    setDeckCount(deckRef.current.length);
    return drawn;
  },[]);

  const deal=useCallback(()=>{
    if(bet===0) return;
    setChips(c=>c-bet);
    const cards=drawCards(4);
    const p=[cards[0],cards[2]]; const d=[cards[1],cards[3]];
    setHand(p);setDealer(d);
    setSplitHand([]);setHandResult(null);setSplitResult(null);
    setDoubled(false);setSplitDoubled(false);setActiveHand("main");
    if(isBJ(p)){
      if(isBJ(d)){setChips(c=>c+bet);setHandResult("push");setStats(s=>({...s,pushes:s.pushes+1}));addHist({icon:"🤝",label:t("bjCpuHistBothBj"),detail:t("bjCpuHistBet").replace("{n}",bet),net:0});}
      else{setChips(c=>c+Math.floor(bet*2.5));setHandResult("bj");setStats(s=>({...s,bjs:s.bjs+1}));addHist({icon:"🃏",label:t("bjCpuHistBjWon"),detail:t("bjCpuHistBet").replace("{n}",bet),net:Math.floor(bet*1.5)});}
      setPhase("result");return;
    }
    if(d[0].v==="A"&&chips-bet>=Math.floor(bet/2)){setPhase("insurance");}
    else{setPhase("playing");}
  },[bet,chips,drawCards,addHist,t]);

  const resolveInsurance=useCallback((take)=>{
    const ins=take?Math.floor(bet/2):0;
    if(ins>0) setChips(c=>c-ins);
    if(isBJ(dealer)){
      if(ins>0){setChips(c=>c+ins*3);addHist({icon:"🛡️",label:t("bjCpuHistInsWon"),detail:t("bjCpuHistDealerBj"),net:ins*2});}
      setHandResult("lose");setStats(s=>({...s,losses:s.losses+1}));
      addHist({icon:"💔",label:t("bjCpuHistDealerBj"),detail:t("bjCpuHistBet").replace("{n}",bet),net:-bet});
      setPhase("result");
    } else {
      if(ins>0) addHist({icon:"🛡️",label:t("bjCpuHistInsLost"),detail:t("bjCpuHistDealerNoBj"),net:-ins});
      setPhase("playing");
    }
  },[bet,dealer,addHist,t]);

  const runDealer=useCallback((mainH,splitH,mainBet,spBet,mainDbl,spDbl)=>{
    let dl=[...dealer];
    while(handVal(dl)<17||isSoft17(dl)) dl.push(...drawCards(1));
    setDealer(dl);
    const dv=handVal(dl),dbust=dv>21;
    const resolve=(h,ab)=>{
      const pv=handVal(h);
      if(pv>21)          return {res:"bust",net:-ab};
      if(dbust||pv>dv)   return {res:"win", net:ab};
      if(pv<dv)          return {res:"lose",net:-ab};
      return             {res:"push",net:0};
    };
    const mBet=mainDbl?mainBet*2:mainBet;
    const {res:mRes,net:mNet}=resolve(mainH,mBet);
    setHandResult(mRes);
    if(mNet>0){setChips(c=>c+mBet*2);setStats(s=>({...s,wins:s.wins+1}));}
    else if(mNet===0){setChips(c=>c+mBet);setStats(s=>({...s,pushes:s.pushes+1}));}
    else setStats(s=>({...s,losses:s.losses+1}));
    addHist({icon:mNet>0?"🎉":mNet<0?"😔":"🤝",label:mNet>0?t("bjCpuHistWin"):mNet<0?t("bjCpuHistLoss"):t("bjCpuHistDraw"),detail:t("bjCpuHistBet").replace("{n}",mBet),net:mNet});
    if(splitH.length>0){
      const sBet=spDbl?spBet*2:spBet;
      const {res:sRes,net:sNet}=resolve(splitH,sBet);
      setSplitResult(sRes);
      if(sNet>0){setChips(c=>c+sBet*2);setStats(s=>({...s,wins:s.wins+1}));}
      else if(sNet===0){setChips(c=>c+sBet);setStats(s=>({...s,pushes:s.pushes+1}));}
      else setStats(s=>({...s,losses:s.losses+1}));
      addHist({icon:sNet>0?"🎉":sNet<0?"😔":"🤝",label:(sNet>0?t("bjCpuHistWin"):sNet<0?t("bjCpuHistLoss"):t("bjCpuHistDraw"))+t("bjCpuHistSplit"),detail:t("bjCpuHistBet").replace("{n}",sBet),net:sNet});
    }
    setPhase("result");
  },[dealer,drawCards,addHist,t]);

  const hit=useCallback(()=>{
    const [card]=drawCards(1);
    if(activeHand==="main"){
      const nH=[...hand,card];setHand(nH);
      if(isBust(nH)){setHandResult("bust");setStats(s=>({...s,losses:s.losses+1}));
        if(splitHand.length>0&&splitResult===null)setActiveHand("split");
        else runDealer(nH,splitHand,bet,bet,doubled,splitDoubled);}
      else if(handVal(nH)===21){
        if(splitHand.length>0&&splitResult===null)setActiveHand("split");
        else runDealer(nH,splitHand,bet,bet,doubled,splitDoubled);}
    } else {
      const nS=[...splitHand,card];setSplitHand(nS);
      if(isBust(nS)){setSplitResult("bust");setStats(s=>({...s,losses:s.losses+1}));runDealer(hand,nS,bet,bet,doubled,splitDoubled);}
      else if(handVal(nS)===21) runDealer(hand,nS,bet,bet,doubled,splitDoubled);
    }
  },[activeHand,hand,splitHand,splitResult,bet,doubled,splitDoubled,drawCards,runDealer]);

  const stand=useCallback(()=>{
    if(activeHand==="main"&&splitHand.length>0&&splitResult===null)setActiveHand("split");
    else runDealer(hand,splitHand,bet,bet,doubled,splitDoubled);
  },[activeHand,hand,splitHand,splitResult,bet,doubled,splitDoubled,runDealer]);

  const doDouble=useCallback(()=>{
    if(chips<bet) return;
    setChips(c=>c-bet);
    const [card]=drawCards(1);
    if(activeHand==="main"){
      const nH=[...hand,card];setHand(nH);setDoubled(true);
      if(isBust(nH)){setHandResult("bust");setStats(s=>({...s,losses:s.losses+1}));}
      if(splitHand.length>0&&splitResult===null)setActiveHand("split");
      else runDealer(nH,splitHand,bet,bet,true,splitDoubled);
    } else {
      const nS=[...splitHand,card];setSplitHand(nS);setSplitDoubled(true);
      if(isBust(nS)){setSplitResult("bust");setStats(s=>({...s,losses:s.losses+1}));}
      runDealer(hand,nS,bet,bet,doubled,true);
    }
  },[chips,bet,activeHand,hand,splitHand,splitResult,doubled,splitDoubled,drawCards,runDealer]);

  const doSplit=useCallback(()=>{
    if(!isPair(hand)||chips<bet) return;
    setChips(c=>c-bet);
    const [c1,c2]=hand;
    const [e1]=drawCards(1);const [e2]=drawCards(1);
    setHand([c1,e1]);setSplitHand([c2,e2]);setActiveHand("main");
  },[hand,chips,bet,drawCards]);

  const newRound=()=>{
    setBet(0);setHand([]);setDealer([]);setSplitHand([]);
    setHandResult(null);setSplitResult(null);
    setDoubled(false);setSplitDoubled(false);setActiveHand("main");
    if(chips<=0) setChips(100);
    setPhase("bet");
  };

  const addChip=(v)=>{
    if(phase!=="bet") return;
    if(chips<=0){
      setChips(100);
      if(v<=100) setBet(b=>b+v);
      return;
    }
    if(chips-bet<v) return;
    setBet(b=>b+v);
  };
  const clearBet=()=>setBet(0);
  const allIn=()=>{ if(phase!=="bet") return; setBet(chips); };
  const repeatBet=()=>{
    if(phase!=="bet"||hist.length===0) return;
    const m=hist[0]?.detail?.match(/bet (\d+)/);
    if(m){const v=parseInt(m[1]);if(v<=chips)setBet(v);}
  };

  const pv=hand.length?handVal(hand):null;
  const sv=splitHand.length?handVal(splitHand):null;
  const canHit  = phase==="playing"&&(activeHand==="main"?(pv!==null&&pv<21):(sv!==null&&sv<21));
  const canSplit = phase==="playing"&&splitHand.length===0&&isPair(hand)&&chips>=bet&&hand.length===2;
  const canDbl   = phase==="playing"&&(activeHand==="main"?hand.length===2:splitHand.length===2)&&chips>=bet;
  const totalG   = stats.wins+stats.losses+stats.pushes+stats.bjs;
  const winPct   = totalG>0?Math.round(((stats.wins+stats.bjs)/totalG)*100):0;
  const deckPct  = Math.round((deckCount/(NUM_DECKS*52))*100);

  const rslts = {
    win:  {text:t("bjCpuResultWin"),  sub:"",               color:"#52b788", icon:"🎉"},
    lose: {text:t("bjCpuResultLose"),  sub:"",               color:"#e63946", icon:"😔"},
    push: {text:t("bjCpuResultPush"),  sub:t("bjCpuResultPushSub"),color:"#888",   icon:"🤝"},
    bj:   {text:t("bjCpuResultBj"),    sub:t("bjCpuResultBjSub"),  color:"#f4c430",icon:"🃏🎉"},
    bust: {text:t("bjCpuResultBust"),  sub:t("bjCpuResultBustSub"),color:"#e63946",icon:"💥"},
  };

  /* ── Estilos reutilizables con tokens del tema ── */
  const panelStyle = {
    background: tk.panelBg,
    border: `1px solid ${tk.panelBorder}`,
    boxShadow: tk.panelShadow,
    borderRadius: 12,
  };

  const btnSecondary = {
    border: `1px solid ${tk.panelBorder}`,
    background: tk.panelBg,
    color: tk.tx2,
  };

  return ReactDOM.createPortal(
    <div style={{
      position:"fixed",inset:0,zIndex:10000,
      background: tk.overlayBg,
      backdropFilter:"blur(8px)",WebkitBackdropFilter:"blur(8px)",
      display:"flex",alignItems:"center",justifyContent:"center",padding:"12px",
    }}
      onClick={e=>e.target===e.currentTarget&&onClose()}
      onKeyDown={e=>{if(e.key==="Escape")onClose();}}>

      {/* Modal */}
      <div style={{
        background: tk.modalBg,
        borderRadius:22,
        width:"100%",maxWidth:450,
        maxHeight:"94dvh",overflowY:"auto",
        border: `1px solid ${tk.panelBorder}`,
        boxShadow: `0 32px 96px rgba(0,0,0,.5), 0 8px 32px rgba(0,0,0,.3)`,
        position:"relative",
        fontFamily:"'Google Sans', sans-serif",
        color: tk.tx,
      }}>

        {/* Franja accent top */}
        <div style={{
          height:4,borderRadius:"22px 22px 0 0",
          background:`linear-gradient(90deg,${tk.gc},color-mix(in srgb,${tk.gc} 60%,#38bdf8),${tk.gc})`,
        }}/>

        <div style={{padding:"14px 16px 22px"}}>

          {/* ── Header ── */}
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div>
              <div style={{
                fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.9rem",
                letterSpacing:"4px",color:tk.gc,lineHeight:1,
                textShadow: dark ? "0 0 24px rgba(0,109,119,0.5)" : "0 2px 8px rgba(0,109,119,0.25)",
              }}>
                {t("bjCpuTitle")}
              </div>
              <div style={{fontSize:".56rem",color:tk.tx3,letterSpacing:"2.5px",fontWeight:700,marginTop:2}}>
                {t("bjCpuSubtitle").replace("{n}", NUM_DECKS)}
              </div>
            </div>

            <div style={{display:"flex",alignItems:"center",gap:8}}>
              {/* Fichas */}
              <div style={{...panelStyle,textAlign:"right",padding:"6px 12px"}}>
                <div style={{fontSize:".5rem",color:tk.tx3,letterSpacing:"1px",fontWeight:700}}>{t("bjCpuChips")}</div>
                <div style={{fontSize:"1.05rem",fontWeight:900,color:"#f4c430",
                  fontFamily:"'Bebas Neue',sans-serif",lineHeight:1.1,
                  textShadow:"0 1px 8px rgba(244,196,48,.4)"}}>
                  💰 {chips.toLocaleString()}
                </div>
              </div>

              {/* Theme toggle */}
              <button
                onClick={handleToggleTheme}
                title={dark ? t("themeToggleLight") : t("themeToggleDark")}
                aria-label={dark ? t("themeToggleLight") : t("themeToggleDark")}
                style={{
                  width:34,height:34,borderRadius:"50%",
                  border:`1.5px solid ${tk.panelBorder}`,
                  background: tk.panelBg,
                  cursor:"pointer",fontSize:"1rem",
                  display:"flex",alignItems:"center",justifyContent:"center",
                  color:tk.tx,flexShrink:0,
                  boxShadow: tk.panelShadow,
                  transition:"background .2s,border .2s",
                }}>
                {dark ? "🌙" : "☀️"}
              </button>

              {/* Close */}
              <button onClick={onClose} aria-label={t("cancel")} style={{
                width:34,height:34,borderRadius:"50%",
                border:`1px solid ${tk.panelBorder}`,
                background: tk.panelBg,
                cursor:"pointer",fontSize:"1rem",
                display:"flex",alignItems:"center",justifyContent:"center",
                color:tk.tx2,flexShrink:0,
                boxShadow: tk.panelShadow,
              }}>✕</button>
            </div>
          </div>

          {/* ── Tabs ── */}
          <div style={{
            display:"flex",gap:3,marginBottom:14,
            background: dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.06)",
            borderRadius:12,padding:4,
            border:`1px solid ${tk.panelBorder}`,
          }}>
            {[["game",t("bjCpuTabGame")],["stats",t("bjCpuTabStats")],["hist",t("bjCpuTabHistory")]].map(([k,lbl])=>(
              <button key={k} onClick={()=>setTab(k)} style={{
                flex:1,padding:"7px 4px",borderRadius:9,border:"none",cursor:"pointer",
                background: tab===k ? tk.tabActiveBg : "transparent",
                color: tab===k ? "#fff" : tk.tabInactiveColor,
                fontSize:".66rem",fontWeight:700,letterSpacing:".5px",transition:"all .15s",
                display:"flex",flexDirection:"column",alignItems:"center",gap:3,
              }}>
                <span>{lbl}</span>
              </button>
            ))}
          </div>

          {/* ═══ STATS ═══ */}
          {tab==="stats"&&(
            <div>
              <div style={{textAlign:"center",padding:"16px 0 14px",
                borderBottom:`1px solid ${tk.bo}`,marginBottom:14}}>
                <div style={{fontSize:"2.6rem",fontWeight:900,color:"#f4c430",
                  fontFamily:"'Bebas Neue',sans-serif",letterSpacing:3,
                  textShadow:"0 0 28px rgba(244,196,48,.35)"}}>
                  💰 {chips.toLocaleString()}
                </div>
                <div style={{fontSize:".62rem",color:tk.tx3,marginTop:2,letterSpacing:"1px"}}>{t("bjCpuAvailableChips")}</div>
              </div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                {[["🎉",stats.wins+stats.bjs,t("bjCpuStatsWon"),"#52b788"],["💔",stats.losses,t("bjCpuStatsLost"),"#e63946"],
                  ["🤝",stats.pushes,t("bjCpuStatsPush"),tk.tx2],["🃏",stats.bjs,t("bjCpuStatsBj"),"#f4c430"],
                  ["📊",`${winPct}%`,t("bjCpuStatsWinRate"),winPct>=50?"#52b788":"#e63946"],["🎲",totalG,t("bjCpuStatsMatches"),tk.tx],
                ].map(([ico,val,lbl,col])=>(
                  <div key={lbl} style={{...panelStyle,padding:"10px 6px",textAlign:"center"}}>
                    <div style={{fontSize:"1rem"}}>{ico}</div>
                    <div style={{fontSize:"1.15rem",fontWeight:900,color:col,fontFamily:"'Bebas Neue',sans-serif"}}>{val}</div>
                    <div style={{fontSize:".58rem",color:tk.tx3,fontWeight:600,marginTop:1}}>{lbl}</div>
                  </div>
                ))}
              </div>
              {/* Deck counter */}
              <div style={{...panelStyle,padding:"10px 14px",marginBottom:10}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:".65rem",color:tk.tx3,fontWeight:700}}>{t("bjCpuDeckRemaining")}</span>
                  <span style={{fontSize:".75rem",fontWeight:800,color:tk.tx}}>{deckCount} {t("bjCpuCards")} ({deckPct}%)</span>
                </div>
                <div style={{height:6,borderRadius:99,background:tk.bo,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${deckPct}%`,background:tk.gc,transition:"width .5s",borderRadius:99}}/>
                </div>
                <div style={{fontSize:".56rem",color:tk.tx3,marginTop:4}}>{t("bjCpuReshuffle")}</div>
              </div>
              <button onClick={()=>{setStats({wins:0,losses:0,pushes:0,bjs:0});setHist([]);setChips(500);newRound();}}
                style={{width:"100%",padding:"10px",borderRadius:10,cursor:"pointer",
                  ...btnSecondary,
                  fontSize:".78rem",fontWeight:700}}>
                {t("bjCpuReset")}
              </button>
            </div>
          )}

          {/* ═══ HISTORIAL ═══ */}
          {tab==="hist"&&(
            <div>
              {hist.length===0
                ? <div style={{textAlign:"center",padding:"48px 0",color:tk.tx3,fontSize:".82rem"}}>
                    {t("bjCpuNoHistory")}
                  </div>
                : hist.map((e,i)=><HistEntry key={`${e.ts}-${i}`} e={e} tk={tk}/>)
              }
            </div>
          )}

          {/* ═══ JUEGO ═══ */}
          {tab==="game"&&(<> 

            {/* En juego badge */}
            {(phase==="playing"||phase==="result")&&bet>0&&(
              <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
                <div style={{
                  ...panelStyle,
                  background:`color-mix(in srgb,${tk.gc} 14%,${tk.panelBg})`,
                  border:`1.5px solid color-mix(in srgb,${tk.gc} 38%,${tk.panelBorder})`,
                  padding:"6px 20px",textAlign:"center",
                }}>
                  <span style={{fontSize:".56rem",color:tk.tx3,fontWeight:700,letterSpacing:"1px",display:"block"}}>{t("bjCpuInPlay")}</span>
                  <span style={{fontSize:"1.1rem",fontWeight:900,color:tk.gc,
                    fontFamily:"'Bebas Neue',sans-serif"}}>
                    💵 {(doubled?bet*2:bet)+(splitHand.length?bet:0)}
                  </span>
                </div>
              </div>
            )}

            {/* Dealer */}
            {dealer.length>0&&(
              <HandArea cards={dealer} hideSecond={phase==="playing"||phase==="insurance"} label={t("bjCpuDealer")} tk={tk} t={t}/>
            )}

            {/* Manos jugador */}
            {hand.length>0&&(
              <HandArea cards={hand} label={splitHand.length>0?t("bjCpuHand1"):t("bjCpuYourHand")}
                bet={doubled?bet*2:bet} active={activeHand==="main"&&phase==="playing"}
                result={handResult} tk={tk} t={t}/>
            )}
            {splitHand.length>0&&(
              <HandArea cards={splitHand} label={t("bjCpuHand2Split")}
                bet={splitDoubled?bet*2:bet} active={activeHand==="split"&&phase==="playing"}
                result={splitResult} tk={tk} t={t}/>
            )}

            {/* ── INSURANCE ── */}
            {phase==="insurance"&&(
              <div style={{
                ...panelStyle,
                background:`color-mix(in srgb,#f4a261 10%,${tk.panelBg})`,
                border:`1.5px solid color-mix(in srgb,#f4a261 38%,${tk.panelBorder})`,
                padding:"16px",marginBottom:12,
              }}>
                <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.1rem",
                  letterSpacing:"2px",color:"#f4a261",marginBottom:6}}>{t("bjCpuInsurance")}</div>
                <div style={{fontSize:".72rem",color:tk.tx2,marginBottom:14,lineHeight:1.7}}>
                  {t("bjCpuInsuranceDesc").split("{n}")[0]}<strong style={{color:tk.tx}}>{Math.floor(bet/2)}</strong>{t("bjCpuInsuranceDesc").split("{n}")[1]}
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>resolveInsurance(true)} style={{
                    flex:1,padding:"12px",borderRadius:11,cursor:"pointer",
                    border:"1.5px solid #f4a261",
                    background:`color-mix(in srgb,#f4a261 16%,${tk.panelBg})`,
                    color:"#f4a261",fontFamily:"'Bebas Neue',sans-serif",
                    fontSize:"1rem",letterSpacing:"2px",fontWeight:800,
                  }}>
                    {t("bjCpuInsuranceBtn").replace("{n}", Math.floor(bet/2))}
                  </button>
                  <button onClick={()=>resolveInsurance(false)} style={{
                    flex:1,padding:"12px",borderRadius:11,cursor:"pointer",
                    ...btnSecondary,
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:"2px",fontWeight:800,
                  }}>
                    {t("bjCpuInsuranceNo")}
                  </button>
                </div>
              </div>
            )}

            {/* ── BET PHASE ── */}
            {phase==="bet"&&(
              <div>
                {/* Apuesta actual */}
                <div style={{textAlign:"center",marginBottom:14,padding:"14px",
                  ...panelStyle}}>
                  <div style={{fontSize:".58rem",fontWeight:800,letterSpacing:"2px",color:tk.tx3,marginBottom:4}}>
                    {t("bjCpuYourBet")}
                  </div>
                  <div style={{
                    fontFamily:"'Bebas Neue',sans-serif",fontSize:"2.2rem",letterSpacing:3,lineHeight:1,
                    color:bet>0?tk.gc:tk.tx3,
                    textShadow:bet>0?(dark?"0 0 20px rgba(0,109,119,0.5)":"0 2px 8px rgba(0,109,119,0.2)"):"none",
                    transition:"color .2s",
                  }}>
                    {bet>0?`💵 ${bet}`:"— —"}
                  </div>
                </div>

                {/* Chips */}
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12,justifyContent:"center"}}>
                  {CHIPS.filter(c=>chips===0 ? c.v<=100 : c.v<=chips).map(chip=>(
                    <ChipBtn key={chip.v} chip={chip}
                      disabled={chips>0 && chips-bet<chip.v}
                      onClick={()=>addChip(chip.v)}/>
                  ))}
                </div>

                {/* Controles rápidos */}
                <div style={{display:"flex",gap:6,marginBottom:12}}>
                  <button onClick={clearBet} disabled={bet===0} style={{
                    flex:1,padding:"10px",borderRadius:10,
                    cursor:bet>0?"pointer":"not-allowed",
                    ...btnSecondary,
                    fontSize:".78rem",fontWeight:700,opacity:bet>0?1:.35,
                  }}>
                    {t("bjCpuClear")}
                  </button>
                  <button onClick={repeatBet} disabled={hist.length===0} style={{
                    flex:1,padding:"10px",borderRadius:10,
                    cursor:hist.length>0?"pointer":"not-allowed",
                    ...btnSecondary,
                    fontSize:".78rem",fontWeight:700,opacity:hist.length>0?1:.35,
                  }}>
                    {t("bjCpuRepeat")}
                  </button>
                  <button onClick={allIn} style={{
                    flex:1,padding:"10px",borderRadius:10,cursor:"pointer",
                    border:"1.5px solid #f4a261",
                    background:`color-mix(in srgb,#f4a261 14%,${tk.panelBg})`,
                    color:"#f4a261",fontSize:".78rem",fontWeight:700,
                  }}>
                    {t("bjCpuAllIn")}
                  </button>
                </div>

                {/* Repartir */}
                <button onClick={deal} disabled={bet===0} className="btnpri" style={{
                  "--gc":tk.gc,
                  opacity:bet>0?1:.4,
                  fontSize:"1.25rem",letterSpacing:"3px",
                }}>
                  {bet>0 ? t("bjCpuDeal").replace("{n}", bet) : t("bjCpuChooseBet")}
                </button>

                {chips<=0&&<div style={{textAlign:"center",marginTop:8,fontSize:".75rem",color:tk.tx3}}>{t("bjCpuNoChips")}</div>}

                {/* Rules */}
                <div style={{
                  marginTop:14,fontSize:".62rem",color:tk.tx3,lineHeight:2,
                  borderTop:`1px solid ${tk.bo}`,paddingTop:12,
                  display:"flex",flexWrap:"wrap",justifyContent:"center",
                  gap:"0 18px",textAlign:"center",
                }}>
                  <span>{t("bjCpuRuleBj")}</span>
                  <span>{t("bjCpuRuleDealer")}</span>
                  <span>{t("bjCpuRuleSplit")}</span>
                  <span>{t("bjCpuRuleDouble")}</span>
                  <span>{t("bjCpuRuleIns")}</span>
                  <span>{t("bjCpuRuleDecks").replace("{n}", NUM_DECKS)}</span>
                </div>
              </div>
            )}

            {/* ── PLAYING PHASE ── */}
            {phase==="playing"&&(
              <div>
                {splitHand.length>0&&(
                  <div style={{textAlign:"center",marginBottom:10,fontSize:".65rem",
                    color:tk.gc,fontWeight:700,letterSpacing:"1px",
                    display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
                    <span style={{width:7,height:7,borderRadius:"50%",background:tk.gc,
                      display:"inline-block",boxShadow:`0 0 8px ${tk.gc}`}}/>
                    {activeHand==="main"?t("bjCpuPlayingHand1"):t("bjCpuPlayingHand2")}
                    <span style={{width:7,height:7,borderRadius:"50%",background:tk.gc,
                      display:"inline-block",boxShadow:`0 0 8px ${tk.gc}`}}/>
                  </div>
                )}

                {/* HIT + STAND */}
                <div style={{display:"flex",gap:8,marginBottom:8}}>
                  <button onClick={hit} disabled={!canHit} style={{
                    flex:1,padding:"14px 8px",borderRadius:12,border:"none",cursor:"pointer",
                    background:canHit?tk.gc:"rgba(128,128,128,0.2)",
                    color:"#fff",fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.15rem",letterSpacing:"2.5px",
                    opacity:canHit?1:.3,transition:"all .15s",
                    boxShadow:canHit?`0 4px 16px color-mix(in srgb,${tk.gc} 45%,transparent)`:"none",
                  }}>
                    {t("bjCpuHit")}
                  </button>
                  <button onClick={stand} style={{
                    flex:1,padding:"14px 8px",borderRadius:12,cursor:"pointer",
                    border:`2px solid ${tk.panelBorder}`,
                    background: tk.panelBg,
                    color:tk.tx,fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.15rem",letterSpacing:"2.5px",
                    boxShadow: tk.panelShadow,
                  }}>
                    {t("bjCpuStand")}
                  </button>
                </div>

                {/* DOUBLE + SPLIT */}
                {(canDbl||canSplit)&&(
                  <div style={{display:"flex",gap:8}}>
                    {canDbl&&(
                      <button onClick={doDouble} style={{
                        flex:canSplit&&activeHand==="main"?"1 1 50%":"1",
                        minWidth:80,padding:"12px 8px",borderRadius:12,cursor:"pointer",
                        border:"1.5px solid #f4a261",
                        background:`color-mix(in srgb,#f4a261 14%,${tk.panelBg})`,
                        color:"#f4a261",fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:"2px",
                      }}>
                        {t("bjCpuDouble")}
                      </button>
                    )}
                    {canSplit&&activeHand==="main"&&(
                      <button onClick={doSplit} style={{
                        flex:canDbl?"1 1 50%":"1",
                        minWidth:80,padding:"12px 8px",borderRadius:12,cursor:"pointer",
                        border:"1.5px solid #38bdf8",
                        background:`color-mix(in srgb,#38bdf8 14%,${tk.panelBg})`,
                        color:"#38bdf8",fontFamily:"'Bebas Neue',sans-serif",fontSize:"1rem",letterSpacing:"2px",
                      }}>
                        {t("bjCpuSplit")}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── RESULT ── */}
            {phase==="result"&&handResult&&(()=>{
              const r=rslts[handResult]||rslts.lose;
              const mBet=doubled?bet*2:bet;
              const net=handResult==="bj"?Math.floor(bet*1.5)
                :handResult==="win"?mBet
                :handResult==="push"?0:-mBet;
              return (
                <div>
                  <div style={{textAlign:"center",padding:"18px 14px",borderRadius:14,marginBottom:12,
                    background:`color-mix(in srgb,${r.color} 12%,${tk.panelBg})`,
                    border:`1.5px solid color-mix(in srgb,${r.color} 48%,${tk.panelBorder})`,
                    boxShadow:`${tk.panelShadow},0 0 28px color-mix(in srgb,${r.color} 14%,transparent)`}}>
                    <div style={{fontSize:"2.2rem",lineHeight:1,marginBottom:6}}>{r.icon}</div>
                    <div style={{fontFamily:"'Bebas Neue',sans-serif",fontSize:"1.9rem",
                      letterSpacing:"4px",color:r.color,
                      textShadow: dark ? `0 0 24px color-mix(in srgb,${r.color} 50%,transparent)` : "none",
                    }}>{r.text}</div>
                    {r.sub&&<div style={{fontSize:".7rem",color:tk.tx3,marginTop:4}}>{r.sub}</div>}
                    <div style={{fontSize:"1.2rem",fontWeight:900,color:r.color,marginTop:8,
                      fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>
                      {net>0?`+${net}`:net===0?"±0":`${net}`} {t("bjCpuResultChips")}
                    </div>
                  </div>
                  <button onClick={newRound} className="btnpri" style={{"--gc":tk.gc,fontSize:"1.2rem",letterSpacing:"3px"}}>
                    {chips>0?t("bjCpuResultNewRound"):t("bjCpuResultRebuy")}
                  </button>
                </div>
              );
            })()}

          </>)}
        </div>
      </div>
    </div>,
    document.body
  );
}



export default BlackjackCPU;


