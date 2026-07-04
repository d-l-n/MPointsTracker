export type GameId =
  | "uno"
  | "uno_no_mercy"
  | "uno_flip"
  | "uno_dos"
  | "truco"
  | "chancho"
  | "esquinados"
  | "chin"
  | "chinchon"
  | "rummy"
  | "poker"
  | "blackjack"
  | "burako"
  | "generala"
  | "ajedrez"
  | "racha_perdida"
  | "sushi_do"
  | "portion_counter"
  | "basta_dym"
  | "sushi"
  | "pizza"
  | "hamburguesa"
  | "pancho"
  | "empanadas"
  | "facturas"
  | "sanguchitos"
  | "cookies"
  | "otros_porciones"
  | "monopoly"
  | "life"
  | "custom"
  | "canasta";

export interface PlayerResult {
  name: string;
  score?: number;
  uid?: string;
  winner?: boolean;
}

export interface Match {
  id?: string;
  date: string | number | Date;
  players: PlayerResult[];
  winner?: string | null;
  _gameId?: GameId | string;
  game?: GameId | string;
  rounds?: number;
  duration?: number;
  inactivePlayers?: string[];
  rosterEvents?: UnoRosterEvent[];
}

export interface GameDefinition {
  id: GameId;
  name: string;
  emoji: string;
  color: string;
  type: string;
  winScore?: number;
  tagline?: string;
  coverImage?: string;
  hiddenFromCatalog?: boolean;
}

export interface PlayerStats {
  name: string;
  wins: number;
  played: number;
  winrate: number;
  streak: {
    current: number;
    max: number;
  };
}

export type ThemeMode = "light" | "dark" | "system";

export type ThemeAccentMode = "default" | "monet";

export type ActiveTheme = "light" | "dark" | "oled";

export type DynamicThemeSource = "android-dynamic-color";

export interface DynamicThemeRoles {
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  secondary: string;
  onSecondary: string;
  secondaryContainer: string;
  onSecondaryContainer: string;
  tertiary: string;
  onTertiary: string;
  tertiaryContainer: string;
  onTertiaryContainer: string;
  surface: string;
  surfaceVariant: string;
  onSurface: string;
  onSurfaceVariant: string;
  outline: string;
  error: string;
  onError: string;
}

export interface DynamicThemeContract {
  source: DynamicThemeSource;
  roles: DynamicThemeRoles;
  version?: string | number;
  updatedAt?: number;
}

export type TranslationFn = (key: string) => string;

export interface LinkedPlayer {
  uid?: string | null;
  name?: string;
  playerId?: string;
}

export interface ToastState {
  msg: string;
  show: boolean;
}

export interface DraftRecord {
  _savedAt?: number;
  [key: string]: unknown;
}

export type UnoRosterRetentionMode = "keep-record" | "remove-safe";

export interface UnoRosterEvent {
  type: "join" | "leave";
  playerId: string;
  playerName: string;
  effectiveRound: number;
  retentionMode?: UnoRosterRetentionMode;
}

export type DraftStore = Record<string, DraftRecord>;

export type AppStorageData = Record<string, unknown> & {
  __theme?: boolean;
};

export type MatchStore = Record<string, Match[] | unknown> & {
  __theme?: boolean;
};

export type PlayerGroupMember =
  | string
  | {
      name: string;
      uid?: string | null;
    };

export interface PlayerGroup {
  name: string;
  players: PlayerGroupMember[];
}

export interface PublicProfile {
  displayName: string | null;
  photoURL: string | null;
  lastLogin: number | null;
  email: string | null;
}

export interface PublicGameStats {
  played: number;
  wins: number;
  winrate: number;
}

export interface PublicStatsSummary {
  totalMatches: number;
  totalWins: number;
  winrate: number;
  byGame: Record<string, PublicGameStats>;
}

export type SpotifyPosition = "center" | "left" | "right" | "draggable";

export interface UserDataDoc {
  data?: string;
  playerGroups?: string;
  spotifyEnabled?: string | boolean;
  spotifyPosition?: SpotifyPosition;
  updatedAt?: number;
  [key: string]: unknown;
}

export interface LegacyUserDoc extends UserDataDoc {
  profile?: {
    displayName?: string | null;
    photoURL?: string | null;
    email?: string | null;
    lastLogin?: number | null;
  };
}

export interface SharedMatchRecipient {
  uid?: string | null;
  name?: string;
  playerIndex?: number;
  playerId?: string;
}

export interface PendingInvite {
  uid: string;
  displayName: string;
  photoURL: string | null;
}

export interface DebugLogEntry {
  msg: string;
  type: string;
  id: number;
}

export interface AppContextValue {
  user: unknown;
  dark: boolean;
  lang: string;
  t: TranslationFn;
  showToast: (msg: string, duration?: number) => void;
  data: MatchStore;
  playerGroups: PlayerGroup[];
  savePlayerGroups: (groups: PlayerGroup[]) => Promise<void> | void;
  spotifyEnabled: boolean;
  spotifyPosition: SpotifyPosition;
  saveSpotifyPreference: (enabled: boolean) => Promise<void> | void;
  saveSpotifyPosition: (pos: SpotifyPosition) => Promise<void> | void;
  knownNames: string[];
  getMatches: (id: string) => Match[];
  addMatch: (gid: string, match: Match & Record<string, unknown>) => void;
  delMatch: (gid: string, matchId: string) => void;
  editMatch: (gid: string, match: Match & Record<string, unknown>) => void;
  pendingInvite?: unknown;
  claimPendingInvite?: (...args: unknown[]) => unknown;
}
