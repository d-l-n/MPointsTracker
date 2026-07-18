import { useState, useRef, useEffect } from "react";
import { type TranslationFn } from "../../types";
import {
  SettingsRow,
  ProfileStatCard,
  compactSaveStyle,
  type AppUser,
  type SettingsSubPage,
} from "./shared";
import UserAvatar from "../ui/UserAvatar";
import UserQRCode from "../auth/UserQRCode";
import ConfirmModal from "../ui/ConfirmModal";
import { fbAuth, fbDb } from "../../lib/firebase";
import { updateProfile } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { saveUserProfile } from "../../services/userService";

export interface AccountSectionProps {
  user: AppUser | null;
  displayName: string;
  onSignOut: (keepLocal?: boolean) => void;
  onSignIn: (mode: "google" | "signin") => void;
  onViewProfile?: ((uid: string) => void) | null;
  onSubPage: (subPage: SettingsSubPage) => void;
  totalMatches: number;
  quickWins: number;
  quickWinrate: number;
  quickStreak: number;
  statusPrimary: string;
  statusSecondary: string;
  showToast?: (msg: string, duration?: number) => void;
  t: TranslationFn;
}

export default function AccountSection({
  user,
  displayName,
  onSignOut,
  onSignIn,
  onViewProfile,
  onSubPage,
  totalMatches,
  quickWins,
  quickWinrate,
  quickStreak,
  statusPrimary,
  statusSecondary,
  showToast,
  t,
}: AccountSectionProps) {
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(displayName);
  const [savingName, setSavingName] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [confirmClearData, setConfirmClearData] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!editingName) return;
    nameInputRef.current?.focus();
  }, [editingName]);

  const handleSaveName = async () => {
    const currentUser = fbAuth.currentUser;
    if (!nameVal.trim() || !currentUser || !user?.uid) return;
    setSavingName(true);
    try {
      await updateProfile(currentUser, { displayName: nameVal.trim() });
      await currentUser.reload();
      await saveUserProfile(user.uid, {
        displayName: nameVal.trim(),
        photoURL: user.photoURL ?? null,
        email: user.email ?? null,
      });
      showToast?.(t("nameSaved"));
      setEditingName(false);
    } catch {
      showToast?.(t("errSaveName"));
    }
    setSavingName(false);
  };

  const handleSaveGuestName = () => {
    if (!nameVal.trim()) return;
    localStorage.setItem("bgt_guest_name", nameVal.trim());
    showToast?.(t("nameSaved"));
    setEditingName(false);
  };

  const handleDeleteAccount = async () => {
    if (!user?.uid) return;
    setDeletingAccount(true);
    try {
      const authUser = fbAuth.currentUser;
      if (authUser?.delete) {
        await authUser.delete();
      } else if (typeof user.delete === "function") {
        await user.delete();
      }
      await Promise.allSettled([
        deleteDoc(doc(fbDb, "users", user.uid)),
        deleteDoc(doc(fbDb, "userdata", user.uid)),
      ]);
      localStorage.clear();
      showToast?.(t("accountDeleted"));
    } catch (errorValue) {
      const code = typeof errorValue === "object" && errorValue && "code" in errorValue ? (errorValue as { code?: string }).code : undefined;
      showToast?.(code === "auth/requires-recent-login" ? t("errDeleteAccountReauth") : t("errDeleteAccount"));
    }
    setDeletingAccount(false);
    setConfirmDeleteAccount(false);
  };

  return (
    <div className="page settings-profile-dashboard">
      <div className="settings-profile-identity about-card">
        <div className="settings-profile-avatar-wrap">
          {user ? <UserAvatar user={user} /> : <div className="user-avatar-placeholder">{(displayName || "?").slice(0, 2).toUpperCase()}</div>}
        </div>
        <div className="settings-profile-identity-copy">
          <div className="settings-profile-name">
            {displayName || <span className="settings-profile-name-empty">{t("noNamePlaceholder")}</span>}
          </div>
          <div className="settings-profile-status">
            <span>{statusPrimary}</span>
            <span>{statusSecondary}</span>
          </div>
        </div>
        <div className="settings-profile-actions">
          <button
            className="btnsec settings-profile-edit-btn"
            onClick={() => {
              setNameVal(displayName);
              setEditingName(true);
            }}
          >
            {t("editName")}
          </button>
          {user?.uid && onViewProfile && (
            <button
              className="btnsec settings-profile-view-btn"
              aria-label={t("viewProfile")}
              onClick={() => onViewProfile(user.uid)}
            >
              {t("viewProfile")}
            </button>
          )}
        </div>
      </div>

      {editingName && (
        <div className="about-card settings-profile-edit-card">
          <div className="about-row" style={{ alignItems: "center" }}>
            <span className="about-label">{t("nameLabel")}</span>
            <div style={{ display: "flex", gap: 8, flex: 1, justifyContent: "flex-end" }}>
              <input
                className="inp"
                id="edit-name"
                name="edit-name"
                ref={nameInputRef}
                aria-label={t("namePlaceholder")}
                value={nameVal}
                onChange={(event) => setNameVal(event.target.value)}
                placeholder={t("namePlaceholder")}
                style={{ flex: 1, maxWidth: 180 }}
              />
              <button
                className="btnpri account-selected"
                style={compactSaveStyle}
                disabled={savingName || !nameVal.trim()}
                onClick={user ? handleSaveName : handleSaveGuestName}
              >
                {savingName ? "..." : t("save")}
              </button>
              <button
                className="btnsec"
                aria-label={t("cancel")}
                onClick={() => {
                  setEditingName(false);
                  setNameVal(displayName);
                }}
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {user && (
        <div className="settings-profile-qr-panel about-card" data-testid="settings-profile-qr-panel">
          <div className="settings-profile-qr-title">{t("myQR")}</div>
          <div className="settings-profile-qr-body">
            <UserQRCode uid={user.uid} displayName={user.displayName} t={t} />
          </div>
        </div>
      )}

      <div className="settings-profile-stats" data-testid="settings-profile-stats">
        <ProfileStatCard label={t("totalMatches")} value={totalMatches} />
        <ProfileStatCard label={t("profileWins")} value={quickWins} accent="#52B788" />
        <ProfileStatCard label={t("profileWinrate")} value={`${quickWinrate}%`} accent="#f59e0b" />
        <ProfileStatCard label={t("profileStreak")} value={quickStreak} accent="#e63946" />
      </div>

      {!user && (
        <div style={{ display: "flex", gap: 8, marginBottom: "14px" }}>
          <button
            className="about-action-btn"
            style={{ color: "#4285f4", borderColor: "color-mix(in srgb,#4285f4 40%,transparent)", margin: 0, flex: 1 }}
            onClick={() => onSignIn("google")}
          >
            <img
              className="about-action-icon"
              src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
              alt=""
              aria-hidden="true"
            />
            <span>{t("settingsLoginGoogleShort")}</span>
          </button>
          <button
            className="about-action-btn"
            style={{ color: "#006D77", borderColor: "color-mix(in srgb,#006D77 40%,transparent)", margin: 0, flex: 1 }}
            onClick={() => onSignIn("signin")}
          >
            <span aria-hidden="true">✉️</span>
            <span>{t("settingsLoginEmailShort")}</span>
          </button>
        </div>
      )}

      <SettingsRow title={t("settingsPrefs")} desc={t("settingsPrefsDesc")} onClick={() => onSubPage("prefs")} testId="settings-row-prefs" />
      <SettingsRow title={t("settingsAbout")} desc={t("settingsAboutDesc")} onClick={() => onSubPage("about")} />

      {user && (
        <div className="about-card settings-account-actions" data-testid="settings-account-actions">
          <button
            className="settings-account-action"
            onClick={() => setConfirmSignOut(true)}
          >
            <span className="settings-account-action-copy">
              <span className="settings-account-action-title">{t("signOut")}</span>
            </span>
            <span className="settings-account-action-chevron">›</span>
          </button>
          <button
            className="settings-account-action settings-account-action--danger"
            data-testid="settings-delete-account"
            onClick={() => setConfirmDeleteAccount(true)}
          >
            <span className="settings-account-action-copy">
              <span className="settings-account-action-title">{t("deleteAccountBtn")}</span>
            </span>
            <span className="settings-account-action-chevron">›</span>
          </button>
        </div>
      )}

      {confirmSignOut && (
        <ConfirmModal
          title={t("signOutConfirmTitle")}
          msg={t("signOutDataQuestion")}
          confirmLabel={t("signOutKeepData")}
          cancelLabel={t("signOutClearData")}
          onConfirm={() => {
            setConfirmSignOut(false);
            onSignOut(false);
          }}
          onCancel={() => {
            setConfirmSignOut(false);
            setConfirmClearData(true);
          }}
          onOverlayClick={() => setConfirmSignOut(false)}
        />
      )}
      {confirmClearData && (
        <ConfirmModal
          title={t("signOutClearDataTitle")}
          msg={t("signOutClearDataMsg")}
          confirmLabel={t("signOutClearData")}
          cancelLabel={t("cancel")}
          onConfirm={() => {
            setConfirmClearData(false);
            onSignOut(true);
          }}
          onCancel={() => setConfirmClearData(false)}
        />
      )}
      {confirmDeleteAccount && (
        <ConfirmModal
          title={t("deleteAccountTitle")}
          msg={`${t("deleteAccountMsg")} (${user?.email})`}
          confirmLabel={deletingAccount ? t("deleting") : t("deleteAccountConfirm")}
          cancelLabel={t("cancel")}
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDeleteAccount(false)}
        />
      )}
    </div>
  );
}
