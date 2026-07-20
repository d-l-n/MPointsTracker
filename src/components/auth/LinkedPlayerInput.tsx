import { memo, useEffect, useState, type CSSProperties } from "react";

import { useAppContext } from "../../context/AppContext";
import { Link, Search, UserHand, X, LinkOff } from "reicon-react";
import type { PendingInvite, TranslationFn } from "../../types";
import Tooltip from "../ui/Tooltip";
import PlayerInput from "../ui/PlayerInput";
import InviteLinkModal from "./InviteLinkModal";
import UserSearchModal from "./UserSearchModal";

interface LinkTarget {
  uid: string | null;
  name: string;
}

interface LinkedPlayerInputProps {
  value: string;
  linkedUid?: string | null;
  linkedName?: string | null;
  onChange: (value: string) => void;
  onLink: (value: LinkTarget) => void;
  onUnlink: () => void;
  placeholder?: string;
  knownNames?: string[];
  t: TranslationFn;
  allLinkedUids?: Array<string | null | undefined>;
  label?: string;
  id?: string;
}

interface CurrentUser {
  uid: string;
  displayName?: string | null;
  email?: string | null;
}

interface ClaimedInvite {
  uid: string;
  displayName: string;
}

const baseButtonStyle: CSSProperties = {
  flexShrink: 0,
  width: 36,
  height: 36,
  borderRadius: "var(--rxs)",
  border: "1.5px solid var(--bo2)",
  background: "var(--bg3)",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "1rem",
  lineHeight: 1,
  padding: 0,
  color: "var(--tx2)",
};

const linkedChipStyle: CSSProperties = {
  background: "var(--glass)",
  border: "1px solid color-mix(in srgb,#52B788 35%,transparent)",
  borderRadius: "var(--rxs)",
  padding: "9px 12px",
  display: "flex",
  alignItems: "center",
  gap: 8,
  minWidth: 0,
};

const linkedNameStyle: CSSProperties = {
  fontSize: ".85rem",
  color: "var(--tx)",
  fontWeight: 600,
  flex: 1,
  overflow: "hidden",
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const selfButtonStyle: CSSProperties = {
  flexShrink: 0,
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  padding: "0 10px",
  height: 36,
  borderRadius: "var(--rxs)",
  border: "1.5px solid var(--bo2)",
  background: "var(--bg3)",
  color: "var(--tx2)",
  fontSize: ".72rem",
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "'Google Sans',sans-serif",
  whiteSpace: "nowrap",
};

// Reads the current user from AppContext instead of creating an
// individual onAuthStateChanged listener per instance (Bug 26).
// With 6 players in a match this was creating 6 simultaneous Firebase listeners.
function LinkedPlayerInput({
  value,
  linkedUid,
  linkedName,
  onChange,
  onLink,
  onUnlink,
  placeholder,
  knownNames = [],
  t,
  allLinkedUids = [],
  label,
  id,
}: LinkedPlayerInputProps) {
  const [showSearch, setShowSearch] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const { user, pendingInvite, claimPendingInvite } = useAppContext();

  const currentUser = user as CurrentUser | null | undefined;
  const currentPendingInvite = pendingInvite as PendingInvite | null | undefined;
  const claimInvite = claimPendingInvite as (() => ClaimedInvite | null | undefined) | undefined;

  const selfName =
    currentUser?.displayName ||
    localStorage.getItem("bgt_guest_name") ||
    currentUser?.email?.split("@")[0] ||
    "";

  const selfAlreadyLinked = Boolean(
    currentUser &&
      linkedUid !== currentUser.uid &&
      allLinkedUids.filter((uid) => uid === currentUser.uid).length > 0,
  );

  useEffect(() => {
    if (!currentPendingInvite?.uid || linkedUid || value.trim()) return;
    if (allLinkedUids.includes(currentPendingInvite.uid)) return;

    const claimedInvite = claimInvite?.();
    if (!claimedInvite) return;

    onLink({ uid: claimedInvite.uid, name: claimedInvite.displayName });
  }, [allLinkedUids, claimInvite, currentPendingInvite, linkedUid, onLink, value]);

  return (
    <>
      {showSearch && <UserSearchModal onLink={onLink} onClose={() => setShowSearch(false)} t={t} knownNames={knownNames} />}
      {showInvite && currentUser && <InviteLinkModal user={currentUser} onClose={() => setShowInvite(false)} t={t} />}
      <div className={label ? "inp-group" : ""} style={{ width: "100%", minWidth: 0 }}>
        {label && id && <label htmlFor={id} className="inp-label">{label}</label>}
        <div style={{ display: "flex", gap: 6, alignItems: "center", width: "100%", minWidth: 0 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {linkedUid ? (
            <div data-testid="linked-player-chip" style={linkedChipStyle}>
              <span style={linkedNameStyle}><Link size={16} /> {linkedName}</span>
              <span className="player-tag linked" style={{ flexShrink: 0 }}>
                {t("linkedPlayer")}
              </span>
            </div>
          ) : (
            <PlayerInput value={value} onChange={onChange} placeholder={placeholder} knownNames={knownNames} id={id} />
          )}
        </div>
        {!linkedUid && (
          <Tooltip text={t("searchBtnTitle")}>
            <button onClick={() => setShowSearch(true)} style={baseButtonStyle} aria-label={t("searchBtnTitle")}>
              <Search size={16} />
            </button>
          </Tooltip>
        )}
        {!linkedUid && currentUser && (
          <Tooltip text={t("inviteLinkBtn")}>
            <button data-testid="invite-link-button" onClick={() => setShowInvite(true)} style={baseButtonStyle} aria-label={t("inviteLinkBtn")}>
              <Link size={16} />
            </button>
          </Tooltip>
        )}
        {linkedUid && (
          <Tooltip text={t("unlinkTitle")}>
            <button
              onClick={onUnlink}
              style={{ ...baseButtonStyle, border: "1.5px solid rgba(255,68,68,.4)", background: "rgba(255,68,68,.12)", color: "#ff6b6b" }}
              aria-label={t("unlinkTitle")}
            >
              <LinkOff size={18} />
            </button>
          </Tooltip>
        )}
        {!linkedUid && currentUser && !selfAlreadyLinked && selfName && (
          <button
            onClick={() => onLink({ uid: currentUser.uid, name: selfName })}
            style={selfButtonStyle}
            title={`${t("addMeAs")} ${selfName}`}
            aria-label={`${t("addMeAs")} ${selfName}`}
          >
            <UserHand size={16} /> {t("selfBtn")}
          </button>
        )}
        </div>
      </div>
    </>
  );
}

export default memo(LinkedPlayerInput)
