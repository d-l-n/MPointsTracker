import { useMemo, useState, type CSSProperties } from "react";

import { mkId } from "../../lib/storage";
import type { PlayerGroup, PlayerGroupMember, TranslationFn } from "../../types";
import ConfirmModal from "./ConfirmModal";

interface GroupPickerPlayer {
  id: string;
  name: string;
}

interface LinkedGroupPlayer {
  uid: string;
  name: string;
  playerId: string;
}

interface StoredGroup extends PlayerGroup {
  players: PlayerGroupMember[];
}

const GROUP_STORAGE_KEY = "bgt_last_group_v1";

function getLastGroup(gameId: string): StoredGroup | null {
  try {
    const all = JSON.parse(localStorage.getItem(GROUP_STORAGE_KEY) || "{}") as Record<string, StoredGroup>;
    return all[gameId] || null;
  } catch {
    return null;
  }
}

function saveLastGroup(gameId: string, group: StoredGroup): void {
  try {
    const all = JSON.parse(localStorage.getItem(GROUP_STORAGE_KEY) || "{}") as Record<string, StoredGroup>;
    all[gameId] = { name: group.name, players: group.players };
    localStorage.setItem(GROUP_STORAGE_KEY, JSON.stringify(all));
  } catch { /* storage unavailable */ }
}

interface GroupPickerProps {
  playerGroups?: StoredGroup[];
  onLoad: (players: GroupPickerPlayer[], linkedPlayers: LinkedGroupPlayer[]) => void;
  maxPlayers?: number;
  t?: TranslationFn;
  gameId?: string;
  maxGroupSize?: number;
  onDiscard?: () => void;
  hasPlayers?: boolean;
}

function getMemberName(member: PlayerGroupMember): string {
  return typeof member === "string" ? member : member.name;
}

function getMemberUid(member: PlayerGroupMember): string | null {
  return typeof member === "string" ? null : member.uid || null;
}

export default function GroupPicker({
  playerGroups = [],
  onLoad,
  maxPlayers = 10,
  t = ((key: string) => key) as TranslationFn,
  gameId,
  maxGroupSize,
  onDiscard,
  hasPlayers,
}: GroupPickerProps) {
  const [open, setOpen] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  const lastGroup = useMemo(() => {
    if (!gameId) return null;
    const saved = getLastGroup(gameId) as StoredGroup | null;
    if (!saved) return null;
    const match = playerGroups.find((group) => group.name === saved.name) || null;
    if (!match) return null;
    if (maxGroupSize && (match.players || []).length > maxGroupSize) return null;
    return match;
  }, [gameId, maxGroupSize, playerGroups]);

  if (!playerGroups.length) return null;

  const buildLoadArgs = (group: StoredGroup): [GroupPickerPlayer[], LinkedGroupPlayer[]] => {
    const rawPlayers = group.players || [];
    const players = rawPlayers.slice(0, maxPlayers).map((member) => ({
      id: mkId(),
      name: getMemberName(member),
    }));
    const linked = players
      .map((player, index) => {
        const uid = getMemberUid(rawPlayers[index]);
        return uid ? { uid, name: player.name, playerId: player.id } : null;
      })
      .filter((value): value is LinkedGroupPlayer => Boolean(value));
    return [players, linked];
  };

  const handleLoad = (group: StoredGroup) => {
    const [players, linked] = buildLoadArgs(group);
    if (gameId) saveLastGroup(gameId, group);
    onLoad(players, linked);
    setOpen(false);
  };

  const visibleGroups = maxGroupSize
    ? playerGroups.filter((group) => (group.players || []).length <= maxGroupSize)
    : playerGroups;

  const cardButtonStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 12px",
    background: "var(--glass)",
    backdropFilter: "var(--blur)",
    WebkitBackdropFilter: "var(--blur)",
    border: "1px solid var(--glass-border)",
    borderRadius: "var(--rxs)",
    cursor: "pointer",
    color: "var(--tx2)",
    fontFamily: "'Google Sans', sans-serif",
    fontSize: ".78rem",
    fontWeight: 600,
  };

  return (
    <div style={{ marginTop: 12, marginBottom: 12 }}>
      {lastGroup && (
        <button
          onClick={() => handleLoad(lastGroup)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "9px 12px",
            marginBottom: 8,
            background: "color-mix(in srgb,var(--gc,#006D77) 10%,var(--glass))",
            backdropFilter: "var(--blur)",
            WebkitBackdropFilter: "var(--blur)",
            border: "1px solid color-mix(in srgb,var(--gc,#006D77) 35%,transparent)",
            borderRadius: "var(--rxs)",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: ".7rem", color: "var(--gc,#006D77)", fontWeight: 700, letterSpacing: ".5px" }}>
              {t("lastGroupBtn")}
            </div>
            <div style={{ fontSize: ".84rem", fontWeight: 700, color: "var(--tx)", letterSpacing: ".2px", marginTop: 1 }}>
              {lastGroup.name}
            </div>
            <div
              style={{
                fontSize: ".65rem",
                color: "var(--tx3)",
                marginTop: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {(lastGroup.players || []).map(getMemberName).join(", ")}
            </div>
          </div>
          <span style={{ fontSize: ".75rem", color: "var(--gc,#006D77)", fontWeight: 700, flexShrink: 0 }}>›</span>
        </button>
      )}

      <button onClick={() => setOpen((current) => !current)} style={cardButtonStyle}>
        <span style={{ flex: 1, textAlign: "left" }}>{t("groupLoaderBtn")}</span>
        <span style={{ fontSize: ".7rem", color: "var(--tx3)" }}>{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div
          style={{
            marginTop: 6,
            display: "flex",
            flexDirection: "column",
            gap: 6,
            padding: "10px 12px",
            background: "var(--glass)",
            backdropFilter: "var(--blur)",
            WebkitBackdropFilter: "var(--blur)",
            border: "1px solid var(--glass-border)",
            borderRadius: "var(--rxs)",
          }}
        >
          {visibleGroups.map((group, index) => {
            const names = (group.players || []).map(getMemberName);
            const linkedCount = (group.players || []).filter((member) => Boolean(getMemberUid(member))).length;
            return (
              <button
                key={group.name || index}
                onClick={() => handleLoad(group)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 12px",
                  background: "var(--bg3)",
                  border: "1px solid var(--bo2)",
                  borderRadius: "var(--rxs)",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: ".84rem", letterSpacing: ".2px", color: "var(--tx)", fontWeight: 700 }}>{group.name}</div>
                  <div
                    style={{
                      fontSize: ".7rem",
                      color: "var(--tx3)",
                      marginTop: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {names.slice(0, 5).join(", ")}
                    {names.length > 5 ? ` +${names.length - 5}` : ""}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 3, flexShrink: 0 }}>
                  <span style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--gc, #006D77)" }}>
                    {names.length} {t("groupPlayers")}
                  </span>
                  {linkedCount > 0 && (
                    <span style={{ fontSize: ".62rem", color: "#52B788", fontWeight: 600 }}>
                      {linkedCount} {t("groupLinked")}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {hasPlayers && onDiscard && (
        <button
          className="danger-soft-btn"
          onClick={() => setShowDiscardConfirm(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            width: "100%",
            padding: "9px 12px",
            marginTop: 8,
            textAlign: "left",
          }}
        >
          <span style={{ fontSize: "1rem" }}>✕</span>
          <span style={{ flex: 1, textAlign: "left" }}>{t("discardPlayers")}</span>
        </button>
      )}

      {showDiscardConfirm && (
        <ConfirmModal
          title={t("discardPlayers")}
          msg={t("discardPlayersMsg")}
          confirmLabel={t("discard")}
          cancelLabel={t("cancel")}
          confirmTone="danger"
          onConfirm={() => {
            onDiscard?.();
            setShowDiscardConfirm(false);
          }}
          onCancel={() => setShowDiscardConfirm(false)}
        />
      )}
    </div>
  );
}
