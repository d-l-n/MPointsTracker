import { useState, type KeyboardEvent } from "react";
import { type PlayerGroup, type TranslationFn } from "../../types";
import {
  SectionLabel,
  getMemberName,
  type GroupDraftPlayer,
  type LinkModalState,
  primaryActionStyle,
} from "./shared";
import ConfirmModal from "../ui/ConfirmModal";
import UserSearchModal from "../auth/UserSearchModal";
import type { LinkedProfile } from "./shared";
import { Users } from "reicon-react";

export interface PlayerGroupsSectionProps {
  playerGroups: PlayerGroup[];
  savePlayerGroups?: (groups: PlayerGroup[]) => Promise<void> | void;
  showToast?: (msg: string, duration?: number) => void;
  t: TranslationFn;
}

export default function PlayerGroupsSection({
  playerGroups,
  savePlayerGroups,
  showToast,
  t,
}: PlayerGroupsSectionProps) {
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupPlayers, setNewGroupPlayers] = useState<GroupDraftPlayer[]>([]);
  const [newPlayerInput, setNewPlayerInput] = useState("");
  const [expandedGroup, setExpandedGroup] = useState<number | null>(null);
  const [showLinkModal, setShowLinkModal] = useState<LinkModalState | null>(null);
  const [confirmDeleteGroup, setConfirmDeleteGroup] = useState<number | null>(null);

  const isDuplicateGroup = (newPlayers: GroupDraftPlayer[]) => {
    const newNames = new Set(newPlayers.map((player) => player.name.toLowerCase().trim()));
    return playerGroups.some((group) => {
      const existingNames = new Set((group.players || []).map((player) => getMemberName(player).toLowerCase().trim()));
      if (existingNames.size !== newNames.size) {
        return false;
      }
      for (const name of newNames) {
        if (!existingNames.has(name)) {
          return false;
        }
      }
      return true;
    });
  };

  const handleGroupToggle = (groupIndex: number) => {
    setExpandedGroup(expandedGroup === groupIndex ? null : groupIndex);
  };

  const handleGroupKeyDown = (event: KeyboardEvent<HTMLDivElement>, groupIndex: number) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      handleGroupToggle(groupIndex);
    }
  };

  return (
    <>
      <SectionLabel label={t("playerGroupsTitle")} icon={<Users size={14} />} />
      <div className="about-card" style={{ marginBottom: "14px", padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 18px 10px" }}>
          {playerGroups.length === 0
            ? <div style={{ fontSize: ".78rem", color: "var(--tx3)", marginBottom: 10 }}>{t("noGroupsSaved")}</div>
            : playerGroups.map((group, groupIndex) => (
              <div key={groupIndex} style={{ borderBottom: "1px solid var(--bo)", paddingBottom: 8, marginBottom: 8 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}
                  onClick={() => handleGroupToggle(groupIndex)}
                  onKeyDown={(event) => handleGroupKeyDown(event, groupIndex)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={expandedGroup === groupIndex}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: ".85rem", fontWeight: 700, color: "var(--tx)" }}>{group.name}</div>
                    <div style={{ fontSize: ".72rem", color: "var(--tx3)", marginTop: 2 }}>
                      {(group.players || []).map((player) => getMemberName(player)).join(", ")}
                    </div>
                  </div>
                  <span style={{ fontSize: ".7rem", color: "var(--tx3)" }}>{expandedGroup === groupIndex ? "▲" : "▼"}</span>
                  <button
                    onClick={(event) => {
                      event.stopPropagation();
                      setConfirmDeleteGroup(groupIndex);
                    }}
                    aria-label={t("deleteGroupConfirm")}
                    style={{ background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", fontSize: ".68rem", fontWeight: 700, padding: "4px" }}
                  >
                    {t("delete")}
                  </button>
                </div>
                {expandedGroup === groupIndex && (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 8, paddingLeft: 4 }}>
                    {(group.players || []).map((player, playerIndex) => {
                      const name = getMemberName(player);
                      const uid = typeof player === "string" ? null : (player.uid ?? null);
                      return (
                        <div key={playerIndex} style={{ display: "flex", alignItems: "center", gap: 8, borderRadius: "var(--rxs)", padding: "4px 6px" }}>
                          <div style={{ flex: 1, fontSize: ".82rem", color: uid ? "var(--gc)" : "var(--tx)", fontWeight: uid ? 700 : 400 }}>
                            {name}
                            {uid && <span style={{ fontSize: ".65rem", color: "var(--gc)", marginLeft: 4, fontWeight: 600 }}>{t("linkedBadge")}</span>}
                          </div>
                          <button
                            onClick={() => {
                              if (uid) {
                                savePlayerGroups?.(playerGroups.map((currentGroup, currentGroupIndex) => (
                                  currentGroupIndex !== groupIndex
                                    ? currentGroup
                                    : {
                                        ...currentGroup,
                                        players: (currentGroup.players || []).map((currentPlayer, currentPlayerIndex) => (
                                          currentPlayerIndex !== playerIndex
                                            ? currentPlayer
                                            : getMemberName(currentPlayer)
                                        )),
                                      }
                                )));
                              } else {
                                setShowLinkModal({ groupIdx: groupIndex, playerIdx: playerIndex, name });
                              }
                            }}
                            style={{ fontSize: ".68rem", padding: "3px 8px", borderRadius: "var(--rxs)", border: "1px solid " + (uid ? "rgba(255,68,68,.4)" : "var(--bo2)"), background: "none", cursor: "pointer", color: uid ? "#ff6b6b" : "var(--gc,#006D77)", fontWeight: 600, flexShrink: 0 }}
                          >
                            {uid ? t("unlinkPlayer") : t("linkPlayer")}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 10 }}>
            <div className="inp-group">
              <label id="new-group-name-label" htmlFor="new-group-name" className="inp-label">{t("groupNamePlaceholder")}</label>
              <input
                id="new-group-name"
                className="inp"
                placeholder={t("groupNamePlaceholder")}
                value={newGroupName}
                onChange={(event) => setNewGroupName(event.target.value)}
                aria-labelledby="new-group-name-label"
              />
            </div>
            {newGroupPlayers.map((player, playerIndex) => (
              <div key={playerIndex} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--glass)", border: "1px solid var(--glass-border)", borderRadius: "var(--rxs)", padding: "6px 10px" }}>
                <span style={{ flex: 1, fontSize: ".82rem", color: "var(--tx)", fontWeight: player.uid ? 700 : 400 }}>
                  {player.name}
                  {player.uid && <span style={{ fontSize: ".65rem", color: "#52B788", marginLeft: 4 }}>{t("linkedBadge")}</span>}
                </span>
                <button
                  onClick={() => {
                    if (player.uid) {
                      setNewGroupPlayers((players) => players.map((currentPlayer, currentPlayerIndex) => (
                        currentPlayerIndex !== playerIndex ? currentPlayer : { name: currentPlayer.name, uid: null }
                      )));
                    } else {
                      setShowLinkModal({ groupIdx: null, playerIdx: playerIndex, name: player.name });
                    }
                  }}
                  style={{ fontSize: ".65rem", padding: "2px 7px", borderRadius: "var(--rxs)", border: "1px solid " + (player.uid ? "rgba(255,68,68,.4)" : "color-mix(in srgb,#006D77 40%,transparent)"), background: "none", cursor: "pointer", color: player.uid ? "#ff6b6b" : "var(--gc,#006D77)", fontWeight: 600 }}
                >
                  {player.uid ? t("unlinkPlayer") : t("linkPlayer")}
                </button>
                <button
                  onClick={() => setNewGroupPlayers((players) => players.filter((_, currentPlayerIndex) => currentPlayerIndex !== playerIndex))}
                  aria-label={`${t("delete")} ${player.name}`}
                  style={{ background: "none", border: "none", color: "var(--tx3)", cursor: "pointer", fontSize: ".9rem" }}
                >
                  ✕
                </button>
              </div>
            ))}
            <div className="inp-group">
              <label id="new-group-player-label" htmlFor="new-group-player" className="inp-label">{t("playerNamePlaceholder")}</label>
              <input
                id="new-group-player"
                className="inp"
                placeholder={t("playerNamePlaceholder")}
                value={newPlayerInput}
                onChange={(event) => setNewPlayerInput(event.target.value)}
                aria-labelledby="new-group-player-label"
                onKeyDown={(event) => {
                  if (event.key === "Enter" && newPlayerInput.trim()) {
                    setNewGroupPlayers((players) => [...players, { name: newPlayerInput.trim(), uid: null }]);
                    setNewPlayerInput("");
                  }
                }}
              />
            </div>
            {newPlayerInput.trim() && (
              <button
                className="btndash"
                onClick={() => {
                  setNewGroupPlayers((players) => [...players, { name: newPlayerInput.trim(), uid: null }]);
                  setNewPlayerInput("");
                }}
              >
                + {newPlayerInput.trim()}
              </button>
            )}
            <button
              className="btnpri"
              style={primaryActionStyle}
              disabled={!newGroupName.trim() || newGroupPlayers.length === 0}
              onClick={() => {
                if (isDuplicateGroup(newGroupPlayers)) {
                  showToast?.(t("duplicateGroup"));
                  return;
                }
                savePlayerGroups?.([...playerGroups, { name: newGroupName.trim(), players: newGroupPlayers }]);
                setNewGroupName("");
                setNewGroupPlayers([]);
                setNewPlayerInput("");
              }}
            >
              {t("saveGroupBtn")}
            </button>
          </div>
        </div>
      </div>

      {confirmDeleteGroup !== null && (
        <ConfirmModal
          title={t("deleteGroupTitle")}
          msg={playerGroups[confirmDeleteGroup]?.name || ""}
          confirmLabel={t("deleteGroupConfirm")}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            savePlayerGroups?.(playerGroups.filter((_, groupIndex) => groupIndex !== confirmDeleteGroup));
            setConfirmDeleteGroup(null);
          }}
          onCancel={() => setConfirmDeleteGroup(null)}
        />
      )}
      {showLinkModal && (
        <UserSearchModal
          t={t}
          knownNames={[]}
          onClose={() => setShowLinkModal(null)}
          onLink={(linked: LinkedProfile) => {
            const { groupIdx, playerIdx } = showLinkModal;
            if (groupIdx !== null) {
              savePlayerGroups?.(playerGroups.map((group, groupIndex) => (
                groupIndex !== groupIdx
                  ? group
                  : {
                      ...group,
                      players: (group.players || []).map((player, currentPlayerIndex) => {
                        if (currentPlayerIndex !== playerIdx) {
                          return player;
                        }
                        const name = getMemberName(player);
                        return linked.uid ? { name, uid: linked.uid } : name;
                      }),
                    }
              )));
            } else {
              setNewGroupPlayers((players) => players.map((player, currentPlayerIndex) => (
                currentPlayerIndex === playerIdx ? { name: player.name, uid: linked.uid || null } : player
              )));
            }
            setShowLinkModal(null);
          }}
        />
      )}
    </>
  );
}
