import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import SettingsPage from "./SettingsPage";

const defaultContextValue = {
  user: { uid: "u1", displayName: "Ana", email: "ana@example.com" },
  t: (key) => ({
    signOut: "Cerrar sesion",
    signOutConfirmTitle: "Cerrar sesion?",
    signOutDataQuestion: "Que queres hacer con tus datos locales?",
    signOutKeepData: "Mantener datos",
    signOutClearData: "Limpiar datos",
    signOutClearDataTitle: "Limpiar datos locales?",
    signOutClearDataMsg: "Se borraran todas las partidas guardadas.",
    cancel: "Cancelar",
    myQR: "Mi codigo QR",
    qrCodeHint: "Mostra este codigo para vincularme",
    status: "Estado",
    nameLabel: "Nombre visible",
    totalMatches: "Partidas guardadas",
    profileWins: "Victorias",
    profileWinrate: "Win Rate",
    profileStreak: "Racha max.",
    viewProfile: "Ver perfil",
    deleteAccountBtn: "Eliminar cuenta",
    deleteAccountTitle: "Eliminar cuenta?",
    deleteAccountMsg: "Esta accion es permanente.",
    deleteAccountConfirm: "Eliminar para siempre",
    deleting: "Eliminando...",
    settingsPrefs: "Preferencias",
    settingsPrefsDesc: "Pantalla e idioma",
    settingsAbout: "Acerca de",
    settingsAboutDesc: "Version y reportes",
    connected: "Conectado",
    cloudAndDevice: "Nube + dispositivo",
    editName: "Editar",
  }[key] || key),
  showToast: vi.fn(),
  playerGroups: [],
  spotifyEnabled: false,
  spotifyPosition: "center",
  saveSpotifyPreference: vi.fn(),
  saveSpotifyPosition: vi.fn(),
};

let mockContextValue = { ...defaultContextValue };

vi.mock("../context/AppContext", () => ({
  useAppContext: () => mockContextValue,
}));

vi.mock("../lib/firebase", () => ({
  fbAuth: {},
  fbDb: {},
}));

vi.mock("firebase/auth", () => ({
  updateProfile: vi.fn(),
}));

vi.mock("firebase/firestore", () => ({
  deleteDoc: vi.fn(() => Promise.resolve()),
  doc: vi.fn(() => ({})),
}));

vi.mock("../services/userService", () => ({
  saveUserProfile: vi.fn(),
}));

vi.mock("../components/auth/UserQRCode", () => ({
  default: () => <div data-testid="user-qr" />,
}));

vi.mock("../components/auth/UserSearchModal", () => ({
  default: () => <div data-testid="user-search" />,
}));

function renderSettingsPage(overrides = {}) {
  const props = {
    data: {},
    onSignOut: vi.fn(),
    onViewProfile: null,
    subPage: null,
    ...overrides,
  };
  const result = render(
    <SettingsPage
      data={props.data}
      onSignOut={props.onSignOut}
      onSignIn={vi.fn()}
      onViewProfile={props.onViewProfile}
      lang="es"
      onLangChange={vi.fn()}
      wakeLockEnabled={false}
      onToggleWakeLock={vi.fn()}
      hapticEnabled={true}
      onToggleHaptic={vi.fn()}
      oledEnabled={false}
      onToggleOled={vi.fn()}
      dark={false}
      themeMode="system"
      onThemeMode={vi.fn()}
      themeAccentMode="default"
      onThemeAccentMode={vi.fn()}
      themeCustomAccent="#006d77"
      onThemeCustomAccent={vi.fn()}
      reduceEffects={false}
      onToggleReduceEffects={vi.fn()}
      onSubPage={vi.fn()}
      subPage={props.subPage}
    />,
  );
  return { ...result, props };
}

describe("SettingsPage", () => {
  beforeEach(() => {
    mockContextValue = {
      ...defaultContextValue,
      showToast: vi.fn(),
      saveSpotifyPreference: vi.fn(),
      saveSpotifyPosition: vi.fn(),
    };
  });

  test("renders account actions as aligned settings rows", () => {
    renderSettingsPage();

    const signOutButton = screen.getByRole("button", { name: /cerrar sesion/i });
    const deleteButton = screen.getByRole("button", { name: /eliminar cuenta/i });
    const accountActions = screen.getByTestId("settings-account-actions");

    expect(accountActions).toHaveClass("settings-account-actions");
    expect(accountActions).toContainElement(signOutButton);
    expect(accountActions).toContainElement(deleteButton);
    expect(signOutButton).toHaveClass("settings-account-action");
    expect(deleteButton).toHaveClass("settings-account-action");
    expect(deleteButton).toHaveClass("settings-account-action--danger");
    expect(signOutButton.querySelector(".settings-signout-icon")).not.toBeInTheDocument();
    expect(signOutButton).toHaveTextContent("Cerrar sesion");
  });

  test("asks for confirmation before signing out from settings", () => {
    const onSignOut = vi.fn();
    renderSettingsPage({ onSignOut });

    fireEvent.click(screen.getByRole("button", { name: /cerrar sesion/i }));

    expect(onSignOut).not.toHaveBeenCalled();
    expect(screen.getByText("Cerrar sesion?")).toBeInTheDocument();
    expect(screen.getByText("Que queres hacer con tus datos locales?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /mantener datos/i }));

    expect(onSignOut).toHaveBeenCalledWith(false);
  });

  test("renders the profile dashboard with QR, stats, account deletion, and the view profile shortcut", () => {
    const onViewProfile = vi.fn();
    renderSettingsPage({
      data: {
        uno: [
          { id: "m1", date: "2026-01-01", players: [{ name: "Ana" }, { name: "Beto" }], winner: "Ana" },
          { id: "m2", date: "2026-01-02", players: [{ name: "Ana" }, { name: "Beto" }], winner: "Beto" },
        ],
      },
      onViewProfile,
    });

    const qrPanel = screen.getByTestId("settings-profile-qr-panel");
    const statsGrid = screen.getByTestId("settings-profile-stats");

    expect(qrPanel).toContainElement(screen.getByTestId("user-qr"));
    expect(qrPanel.compareDocumentPosition(statsGrid) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText("Mi codigo QR")).toBeInTheDocument();
    expect(screen.getByText("Victorias")).toBeInTheDocument();
    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ver perfil/i }));
    expect(onViewProfile).toHaveBeenCalledWith("u1");
    expect(screen.getByRole("button", { name: /eliminar cuenta/i })).toBeInTheDocument();
  });

  test("does not render the position selector when Spotify is disabled", () => {
    mockContextValue.spotifyEnabled = false;
    renderSettingsPage({ subPage: "prefs" });

    const selector = screen.queryByTestId("spotify-position-select");
    expect(selector).toBeNull();
  });

  test("renders the position selector when Spotify is enabled", () => {
    mockContextValue.spotifyEnabled = true;
    mockContextValue.spotifyPosition = "center";
    mockContextValue.saveSpotifyPosition = vi.fn();
    renderSettingsPage({ subPage: "prefs" });

    const selector = screen.getByTestId("spotify-position-select");
    expect(selector).toBeInTheDocument();
  });

  test("calls saveSpotifyPosition when a new position is selected", () => {
    const saveSpotifyPosition = vi.fn();
    mockContextValue.spotifyEnabled = true;
    mockContextValue.spotifyPosition = "center";
    mockContextValue.saveSpotifyPosition = saveSpotifyPosition;
    renderSettingsPage({ subPage: "prefs" });

    const selector = screen.getByTestId("spotify-position-select");
    const trigger = selector.querySelector("button");
    expect(trigger).not.toBeNull();
    if (trigger) fireEvent.click(trigger);

    const leftOption = screen.getByRole("option", { name: /left/i });
    fireEvent.mouseDown(leftOption);

    expect(saveSpotifyPosition).toHaveBeenCalledWith("left");
  });
});
