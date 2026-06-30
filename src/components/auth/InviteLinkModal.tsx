import { useEffect, useState, type CSSProperties } from "react";

import { createInviteLink } from "../../lib/inviteService";
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
    <div style={{ position: "fixed", inset: 0, zIndex: 700, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
      <div className="usearch-overlay" inert onClick={onClose} style={{ position: "absolute", inset: 0 }} />
      <div className="usearch-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="invite-title">
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
