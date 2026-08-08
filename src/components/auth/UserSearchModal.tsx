import React, { useState, type KeyboardEvent } from "react";
import { doc, getDoc } from "firebase/firestore";

import { fbDb, fbAuth } from "../../lib/firebase";
import { normalizePublicProfile, searchUsersByName } from "../../services/userService";
import QRScanner from "./QRScanner";
import type { PublicProfile, TranslationFn } from "../../types";

interface SearchResult extends PublicProfile {
  uid: string | null;
  _local?: boolean;
}

interface QRPayload {
  uid?: string | null;
  name?: string;
}

interface UserSearchModalProps {
  onLink: (value: { uid: string | null; name: string }) => void;
  onClose: () => void;
  t: TranslationFn;
  knownNames?: string[];
}

function UserSearchModal({ onLink, onClose, t, knownNames = [] }: UserSearchModalProps) {
  const [method, setMethod] = useState<"name" | "qr">("name");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showScanner, setShowScanner] = useState(false);

  const search = async () => {
    const q = query.trim();
    if (!q) return;
    setLoading(true);
    setError("");
    setResults(null);

    try {
      const currentUser = fbAuth.currentUser;
      if (!currentUser) throw new Error("not-authenticated");

      // Server-side prefix query on the normalized searchName field — capped with
      // limit() so we never read the whole users collection.
      const matches = await searchUsersByName(q, currentUser.uid, 8);
      setResults(matches.map(({ uid, profile }) => ({ uid, ...profile })));
    } catch {
      if (knownNames.length > 0) {
        // Same prefix criterion as the cloud query (searchName) for consistency.
        const term = q.trim().toLowerCase();
        const localMatches: SearchResult[] = knownNames
          .filter((name) => name.trim().toLowerCase().startsWith(term))
          .slice(0, 8)
          .map((name) => ({ uid: null, displayName: name, photoURL: null, lastLogin: null, email: null, _local: true }));
        setResults(localMatches);
        if (localMatches.length === 0) setError(t("searchErrLocal"));
      } else {
        setResults([]);
        setError(t("searchErrConnect"));
      }
    }
    setLoading(false);
  };

  const handleKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") search();
  };

  const handleSelect = (user: SearchResult) => {
    if (user._local) {
      onLink({ uid: null, name: user.displayName || "" });
    } else {
      onLink({ uid: user.uid, name: user.displayName || user.email?.split("@")[0] || (user.uid || "").slice(0, 8) });
    }
    onClose();
  };

  const handleScan = async (data: QRPayload) => {
    setShowScanner(false);
    if (!data.uid) return;
    try {
      const snap = await getDoc(doc(fbDb, "users", data.uid));
      const profile = normalizePublicProfile(snap.data());
      onLink({ uid: data.uid, name: profile.displayName || data.name || data.uid.slice(0, 8) });
    } catch {
      onLink({ uid: data.uid, name: data.name || data.uid.slice(0, 8) });
    }
    onClose();
  };

  if (showScanner) {
    return <QRScanner onScan={handleScan} onClose={() => setShowScanner(false)} t={t} />;
  }

  return (
    <div className="usearch-root">
      <button type="button" className="usearch-overlay" onClick={onClose} data-testid="user-search-backdrop" aria-label={t("cancel")} style={{ position: "absolute", inset: 0, border: 0, padding: 0 }} />
      <div className="usearch-sheet" style={{ position: "relative", zIndex: 701 }} role="dialog" aria-modal="true" aria-labelledby="usearch-title">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span id="usearch-title" className="usearch-title">{t("searchTitle")}</span>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--tx3)", cursor: "pointer", fontSize: "1.2rem", lineHeight: 1 }} aria-label={t("cancel")}>
            ✕
          </button>
        </div>

        <div className="usearch-methods">
          {[
            { id: "name", icon: "👤", label: t("searchByName") },
            { id: "qr", icon: "📷", label: t("searchByQR") },
          ].map((methodOption) => (
            <button
              key={methodOption.id}
              className={`usearch-method-btn${method === methodOption.id ? " active" : ""}`}
              onClick={() => {
                setMethod(methodOption.id as "name" | "qr");
                setResults(null);
                setError("");
                setQuery("");
                if (methodOption.id === "qr") setShowScanner(true);
              }}
            >
              {methodOption.icon} {methodOption.label}
            </button>
          ))}
        </div>

        {method !== "qr" ? (
          <>
            <div className="usearch-inp-row">
              <input
                className="usearch-inp"
                id="user-search"
                name="user-search"
                placeholder={t("playerN")}
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setResults(null);
                }}
                onKeyDown={handleKey}
                autoFocus
              />
              <button className="usearch-btn" onClick={search} disabled={loading}>
                {loading ? "…" : t("searchBtn")}
              </button>
            </div>
            {error ? <span className="usearch-error">{error}</span> : null}
          </>
        ) : null}

        {results !== null ? (
          results.length === 0 && !error ? (
            <div className="usearch-empty">
              {t("noResults")} &quot;{query}&quot;
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 260, overflowY: "auto" }}>
              {results.map((user, index) => {
                const initials = (user.displayName || user.email || "?")
                  .split(" ")
                  .map((word) => word[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase();
                return (
                  <button type="button" key={user.uid || index} className="usearch-result" onClick={() => handleSelect(user)}>
                    {user.photoURL ? (
                      <img src={user.photoURL} className="usearch-avatar" alt={user.displayName || ""} style={{ objectFit: "cover" }} referrerPolicy="no-referrer" />
                    ) : (
                      <div className="usearch-avatar">{initials}</div>
                    )}
                    <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
                      <div className="usearch-name">{user.displayName || t("noName")}</div>
                      {user.email ? <div className="usearch-email">{user.email}</div> : null}
                      {user._local ? <div className="usearch-email">{t("localPlayer")}</div> : null}
                    </div>
                    <span style={{ fontSize: ".75rem", color: "var(--gc,#006D77)", fontWeight: 700 }}>
                      {user._local ? t("addBtn") : t("linkBtn")} →
                    </span>
                  </button>
                );
              })}
            </div>
          )
        ) : null}

        {results === null && method !== "qr" && !loading ? (
          <div style={{ fontSize: ".72rem", color: "var(--tx3)", lineHeight: 1.4, textAlign: "center" }}>
            {fbAuth.currentUser ? t("searchHintLoggedIn") : t("searchHintGuest")}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default UserSearchModal;
