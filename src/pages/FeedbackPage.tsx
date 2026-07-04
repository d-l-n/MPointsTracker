import React, { useState, type CSSProperties } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";


import { fbDb } from "../lib/firebase";
import type { TranslationFn } from "../types";

const FEEDBACK_MAX_CHARS = 800;

const FB_TYPE_IDS = [
  { id: "bug", emoji: "🐛", color: "#E63946" },
  { id: "suggestion", emoji: "💡", color: "#FF8C00" },
  { id: "new_game", emoji: "🎮", color: "#9B59B6" },
  { id: "general", emoji: "💬", color: "#52B788" },
] as const;

interface FeedbackUser {
  displayName?: string | null;
  email?: string | null;
}

interface FeedbackPageProps {
  user?: FeedbackUser | null;
  showToast?: (message: string) => void;
  t?: TranslationFn;
}

interface FeedbackPayload {
  type: string;
  message: string;
  userName?: string | null;
  userEmail?: string | null;
}

async function submitFeedback({ type, message, userName, userEmail }: FeedbackPayload) {
  try {
    await addDoc(collection(fbDb, "feedback"), {
      type,
      message,
      userName: userName || "Anónimo",
      userEmail: userEmail || null,
      createdAt: serverTimestamp(),
    });
    return true;
  } catch {
    return false;
  }
}

function FeedbackPage({ user, showToast, t = ((key: string) => key) as TranslationFn }: FeedbackPageProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const feedbackTypes = FB_TYPE_IDS.map((type) => ({
    ...type,
    name: t(`fbTypes.${type.id}.name`),
    desc: t(`fbTypes.${type.id}.desc`),
  }));
  const selectedType = feedbackTypes.find((type) => type.id === selected);
  const charsLeft = FEEDBACK_MAX_CHARS - message.length;
  const canSend = Boolean(selected) && message.trim().length >= 5 && message.length <= FEEDBACK_MAX_CHARS;

  const handleSend = async () => {
    if (!canSend || !selected) return;
    setSending(true);
    const ok = await submitFeedback({
      type: selected,
      message: message.trim(),
      userName: user?.displayName || null,
      userEmail: user?.email || null,
    });
    setSending(false);
    if (ok) {
      setSent(true);
    } else {
      showToast?.(t("sendError"));
    }
  };

  if (sent) {
    return (
      <div className="fb-page">
        <div className="fb-sent">
          <div className="fb-sent-ico">✅</div>
          <div className="fb-sent-title">{t("sent")}</div>
          <div className="fb-sent-sub">
            {t("sentMsg")}
            <br />
            {t("sentSub")}
          </div>
          <button
            className="btnpri"
            style={{ width: "auto", padding: "10px 28px", marginTop: "8px" }}
            onClick={() => {
              setSent(false);
              setSelected(null);
              setMessage("");
            }}
          >
            {t("sendAnother")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fb-page">
      <div className="sec">
        <div className="fb-types">
          {feedbackTypes.map((type) => (
            <button
              key={type.id}
              className={`fb-type-btn${selected === type.id ? " selected" : ""}`}
              style={{ "--fb-color": type.color } as CSSProperties}
              onClick={() => setSelected(type.id)}
            >
              <span className="fb-type-ico">{type.emoji}</span>
              <div className="fb-type-info">
                <div className="fb-type-name" style={{ color: selected === type.id ? type.color : "var(--tx)" }}>
                  {type.name}
                </div>
                <div className="fb-type-desc">{type.desc}</div>
              </div>
              <span className="fb-type-check">✓</span>
            </button>
          ))}
        </div>
      </div>
      {selected ? (
        <div className="fb-form">
          <div>
            <span className="flbl">{t("messageLabel")}</span>
            <textarea
              className="fb-textarea"
              id="feedback-message"
              name="feedback-message"
              placeholder={
                selected === "bug"
                  ? t("feedbackPlaceholder_bug")
                  : selected === "suggestion"
                    ? t("feedbackPlaceholder_suggestion")
                    : selected === "new_game"
                      ? t("feedbackPlaceholder_new_game")
                      : t("feedbackPlaceholder_general")
              }
              value={message}
              onChange={(event) => setMessage(event.target.value.slice(0, FEEDBACK_MAX_CHARS))}
              aria-label={t("messageLabel")}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 4 }}>
              <span
                style={{
                  fontSize: ".68rem",
                  color: charsLeft < 50 ? "#ff4444" : "var(--tx3)",
                  fontWeight: charsLeft < 50 ? 700 : 500,
                }}
              >
                {charsLeft} {t("charLimit")}
              </span>
            </div>
          </div>
          <div className="fb-meta">
            {user ? (
              <>
                {t("sendingAs")} <strong>{user.displayName}</strong> ({user.email})
              </>
            ) : (
              <>
                {t("sendingAs")} <strong>{t("anonymous")}</strong> {t("loginToContact")}
              </>
            )}
          </div>
          <button className="btnpri" onClick={handleSend} disabled={!canSend || sending} style={{ "--gc": selectedType?.color || "#888" } as CSSProperties}>
            {sending ? t("sending") : t("send")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default FeedbackPage;
