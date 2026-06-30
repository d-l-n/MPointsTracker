import { useEffect, useRef, useState, type CSSProperties } from "react";

import type { PlayerGroup, PlayerGroupMember, TranslationFn } from "../../types";

interface PlayerEntry {
  id: string;
  name: string;
}

interface LinkedPlayerEntry {
  uid?: string | null;
  name: string;
  playerId: string;
}

interface SaveGroupButtonProps {
  players?: PlayerEntry[];
  linkedPlayers?: LinkedPlayerEntry[];
  playerGroups?: PlayerGroup[];
  onSave: (groups: PlayerGroup[]) => void;
  t?: TranslationFn;
}

const savedStateStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  padding: "8px 12px",
  marginTop: 8,
  background: "color-mix(in srgb,#52B788 12%,transparent)",
  border: "1px solid color-mix(in srgb,#52B788 35%,transparent)",
  borderRadius: "var(--rxs)",
  fontSize: ".78rem",
  color: "#52B788",
  fontWeight: 700,
};

export default function SaveGroupButton({
  players = [],
  linkedPlayers = [],
  playerGroups = [],
  onSave,
  t = ((key: string) => key) as TranslationFn,
}: SaveGroupButtonProps) {
  const [open, setOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [saved, setSaved] = useState(false);
  const savedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    };
  }, []);

  const named = players.filter((player) => player.name?.trim());
  if (named.length < 2) return null;

  const handleSave = () => {
    const name = groupName.trim();
    if (!name) return;

    const groupPlayers: PlayerGroupMember[] = named.map((player) => {
      const linked = linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === player.id);
      return linked?.uid ? { name: player.name, uid: linked.uid } : player.name;
    });

    const newGroup: PlayerGroup = { name, players: groupPlayers };
    const updated = [...playerGroups.filter((group) => group.name !== name), newGroup];
    onSave(updated);
    setSaved(true);
    if (savedTimerRef.current) clearTimeout(savedTimerRef.current);
    savedTimerRef.current = setTimeout(() => {
      setSaved(false);
      setOpen(false);
      setGroupName("");
      savedTimerRef.current = null;
    }, 1800);
  };

  if (saved) {
    return <div style={savedStateStyle}>{t("saveGroupSaved")}</div>;
  }

  if (!open) {
    return (
      <button
        className="btndash"
        style={{ marginTop: 8, color: "var(--gc, #006D77)", borderColor: "color-mix(in srgb,var(--gc,#006D77) 40%,transparent)" }}
        onClick={() => {
          setOpen(true);
          setGroupName("");
        }}
      >
        {t("saveGroupAs")}
      </button>
    );
  }

  return (
    <div
      style={{
        marginTop: 8,
        padding: "12px",
        background: "var(--glass)",
        backdropFilter: "var(--blur)",
        WebkitBackdropFilter: "var(--blur)",
        border: "1px solid var(--glass-border)",
        borderRadius: "var(--rxs)",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div style={{ fontSize: ".68rem", fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase", color: "var(--tx3)" }}>
        {t("saveGroupLabel")} {named.length} {t("groupPlayers")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
        {named.map((player, index) => {
          const linked = linkedPlayers.find((linkedPlayer) => linkedPlayer.playerId === player.id);
          return (
            <span
              key={player.id || index}
              style={{
                fontSize: ".72rem",
                padding: "3px 9px",
                borderRadius: 12,
                background: linked?.uid ? "color-mix(in srgb,#52B788 15%,transparent)" : "var(--bg3)",
                border: `1px solid ${linked?.uid ? "color-mix(in srgb,#52B788 35%,transparent)" : "var(--bo)"}`,
                color: linked?.uid ? "#52B788" : "var(--tx2)",
                fontWeight: linked?.uid ? 700 : 400,
              }}
            >
              {player.name}
            </span>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="inp"
          style={{ flex: 1 }}
          placeholder={t("saveGroupNamePlaceholder")}
          aria-label={t("saveGroupNamePlaceholder")}
          value={groupName}
          autoFocus
          onChange={(event) => setGroupName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") handleSave();
            if (event.key === "Escape") setOpen(false);
          }}
        />
        <button
          className="btnpri"
          style={{ "--gc": "#006D77", padding: "0 16px", fontFamily: "'Google Sans',sans-serif", fontSize: ".82rem", letterSpacing: "1px", fontWeight: 700, width: "auto" } as CSSProperties & Record<"--gc", string>}
          disabled={!groupName.trim()}
          onClick={handleSave}
        >
          {t("saveGroupSaveBtn")}
        </button>
        <button className="btnsec" style={{ padding: "0 12px" }} onClick={() => setOpen(false)} aria-label={t("cancel")}>
          ✕
        </button>
      </div>
    </div>
  );
}
