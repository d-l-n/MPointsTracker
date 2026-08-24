import { useEffect, useState, type CSSProperties } from "react";

import { createInviteLink, subscribeHostInvites, type AcceptedInvite } from "../../lib/inviteService";
import type { TranslationFn } from "../../types";

interface InviteUser {
  uid?: string | null;
  displayName?: string | null;
  email?: string | null;
}

interface InviteLinkModalProps {
  user: InviteUser;
  onClose: () => void;
  t?: TranslationFn;
}

const headerStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const closeButtonStyle: CSSProperties = {
  background: "none",
  border: "none",
  color: "var(--tx3)",
  cursor: "pointer",
  fontSize: "1.2rem",
  lineHeight: 1,
};

const descriptionStyle: CSSProperties = {
  fontSize: ".82rem",
  color: "var(--tx2)",
  lineHeight: 1.5,
  marginTop: 12,
};

const textareaStyle: CSSProperties = {
  width: "100%",
  minHeight: 96,
  resize: "none",
  marginTop: 14,
  borderRadius: "var(--rsm)",
  border: "1px solid var(--bo2)",
  background: "var(--bg3)",
  color: "var(--tx)",
  padding: "12px",
  fontSize: ".78rem",
  lineHeight: 1.4,
};

const errorStyle: CSSProperties = {
  marginTop: 10,
  fontSize: ".75rem",
  color: "#ff6b6b",
};

const expiryStyle: CSSProperties = {
  marginTop: 10,
  fontSize: ".72rem",
  color: "var(--tx3)",
};

const joinedSectionStyle: CSSProperties = {
  marginTop: 14,
  paddingTop: 12,
  borderTop: "1px solid var(--bo2)",
};

const joinedTitleStyle: CSSProperties = {
  fontSize: ".7rem",
  color: "var(--tx3)",
  letterSpacing: 1,
  textTransform: "uppercase",
};

const joinedNameStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  marginTop: 6,
  fontSize: ".82rem",
  color: "#52B788",
  fontWeight: 600,
};

const actionsStyle: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 8,
  marginTop: 16,
};

function InviteLinkModal({ user, onClose, t = ((key: string) => key) as TranslationFn }: InviteLinkModalProps) {
  const [link, setLink] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [joined, setJoined] = useState<AcceptedInvite[]>([]);

  // Live feed: quiénes aceptaron los invites del host mientras el modal
  // está abierto. Errores dejan la lista vacía (best-effort).
  useEffect(() => {
    if (!user.uid) return;
    return subscribeHostInvites(user.uid, (invites) => {
      const acceptances = invites
        .map((invite) => invite.acceptedBy)
        .filter((entry): entry is AcceptedInvite => Boolean(entry?.uid))
        .sort((a, b) => b.acceptedAt - a.acceptedAt);
      setJoined(acceptances);
    });
  }, [user.uid]);

  useEffect(() => {
    let mounted = true;

    Promise.resolve()
      .then(() => createInviteLink(user))
      .then((nextLink) => {
        if (!mounted) return;
        setLink(nextLink);
        setLoading(false);
      })
      .catch(() => {
        if (!mounted) return;
        setError(t("inviteCreateError"));
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [t, user]);

  const handleCopy = async () => {
    if (!link) return;

    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setError(t("inviteCreateError"));
    }
  };

  const handleShare = async () => {
    if (!link) return;

    const shareApi = navigator as Navigator & {
      share?: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
    };

    if (!shareApi.share) {
      await handleCopy();
      return;
    }

    try {
      await shareApi.share({
        title: t("inviteShareTitle"),
        text: t("inviteShareText"),
        url: link,
      });
    } catch {
      // ignore cancel and OS-level share errors
    }
  };

  return (
    <div className="usearch-root">
      <button type="button" className="usearch-overlay" onClick={onClose} aria-label={t("cancel")} style={{ position: "absolute", inset: 0, border: 0, padding: 0 }} />
      <div className="usearch-sheet" style={{ position: "relative", zIndex: 701 }} role="dialog" aria-modal="true" aria-labelledby="invite-title">
        <div style={headerStyle}>
          <span id="invite-title" className="usearch-title">{t("inviteTitle")}</span>
          <button onClick={onClose} style={closeButtonStyle} aria-label={t("closeMenu")}>
            ✕
          </button>
        </div>

        <div style={descriptionStyle}>{t("inviteDesc")}</div>

        <textarea readOnly value={loading ? t("inviteGenerating") : link} style={textareaStyle} aria-label={t("inviteTitle")} autoFocus />

        {error && <div style={errorStyle}>{error}</div>}

        <div style={expiryStyle}>{t("inviteExpiry")}</div>

        {joined.length > 0 && (
          <div style={joinedSectionStyle}>
            <div style={joinedTitleStyle}>{t("inviteJoinedTitle")}</div>
            {joined.map((entry) => (
              <div key={`${entry.uid}-${entry.acceptedAt}`} style={joinedNameStyle}>
                <span aria-hidden="true">✓</span> {entry.displayName}
              </div>
            ))}
          </div>
        )}

        <div style={actionsStyle}>
          <button className="btnsec" onClick={handleCopy} disabled={loading || !link}>
            {copied ? t("inviteCopied") : t("inviteCopy")}
          </button>
          <button className="btnpri" onClick={handleShare} disabled={loading || !link}>
            {t("inviteShare")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InviteLinkModal;
