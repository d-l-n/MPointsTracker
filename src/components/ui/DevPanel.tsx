import { useState, useEffect, useCallback, useRef, useMemo, useSyncExternalStore } from 'react'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import { getDevSimState, setDevSimState, resetDevSimState, subscribeDevSim } from '../../lib/dev-simulation'
import type { ThemeMode, TranslationFn } from '../../types'

const TABS = ['state', 'vars', 'triggers', 'scenarios', 'components'] as const
type DevTab = typeof TABS[number]

const TAB_META: Record<DevTab, { label: string; icon: string }> = {
  state: { label: 'State', icon: '◈' },
  vars: { label: 'Vars', icon: '◎' },
  triggers: { label: 'Triggers', icon: '↯' },
  scenarios: { label: 'Scenarios', icon: '⬡' },
  components: { label: 'Components', icon: '?' },
}

interface DevPanelProps {
  user: { uid: string; email?: string | null; displayName?: string | null; photoURL?: string | null; isAnonymous?: boolean } | null | undefined
  dark: boolean
  lang: string
  nav: string
  matchCount: number
  themeMode: ThemeMode
  debugLogs: { msg: string; type: string; id: number }[]
  showDebug: boolean
  setShowDebug: (v: boolean | ((c: boolean) => boolean)) => void
}

const DEV_BTN_STORAGE = 'mp_dev_panel_open'

export default function DevPanel({ user, dark, lang, nav, matchCount, themeMode, debugLogs, showDebug, setShowDebug }: DevPanelProps) {
  const [open, setOpen] = useState(() => sessionStorage.getItem(DEV_BTN_STORAGE) === '1')
  const [tab, setTab] = useState<DevTab>('state')
  const isOnline = useOnlineStatus()
  const [copied, setCopied] = useState<string | null>(null)
  const [varSearch, setVarSearch] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const [errorCount, setErrorCount] = useState(0)
  const sim = useSyncExternalStore(subscribeDevSim, getDevSimState)

  useEffect(() => {
    sessionStorage.setItem(DEV_BTN_STORAGE, open ? '1' : '0')
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'd' && e.shiftKey && !e.repeat) {
        e.preventDefault()
        setOpen(o => !o)
      }
      if (e.key === 'Escape' && open) setOpen(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open])

  useEffect(() => {
    if (tab === 'vars') searchRef.current?.focus()
  }, [tab])

  const copy = useCallback((label: string, val: string) => {
    navigator.clipboard.writeText(val)
    setCopied(label)
    setTimeout(() => setCopied(null), 1200)
  }, [])

  const handleForceError = useCallback(() => {
    setErrorCount(n => n + 1)
    throw new Error(`[DevPanel] Forced test error #${errorCount + 1}`)
  }, [errorCount])

  const handleClearCache = useCallback(() => {
    const keys: string[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i)
      if (k) keys.push(k)
    }
    keys.forEach(k => localStorage.removeItem(k))
    window.location.reload()
  }, [])

  const handleSWUpdate = useCallback(() => {
    window.dispatchEvent(new CustomEvent('sw-update-available'))
  }, [])

  const tabIndex = TABS.indexOf(tab)
  const tabWidth = `${100 / TABS.length}%`
  const location = window.location

  const stateVars = useMemo(() => [
    { label: 'Route', value: location.pathname + location.search },
    { label: 'Nav', value: nav },
    { label: 'User Auth', value: user ? user.uid.slice(0, 8) + '…' : 'none' },
    { label: 'Theme', value: dark ? 'dark' : 'light' },
    { label: 'Theme Mode', value: themeMode },
    { label: 'Language', value: lang },
    { label: 'Online', value: isOnline },
    { label: 'Matches', value: matchCount },
    { label: 'Debug logs', value: debugLogs.length },
  ], [location.pathname, location.search, nav, user, dark, themeMode, lang, isOnline, matchCount, debugLogs.length])

  const debugVars = useMemo(() => [
    { label: 'MODE', value: import.meta.env.MODE },
    { label: 'DEV', value: import.meta.env.DEV },
    { label: 'PROD', value: import.meta.env.PROD },
    { label: 'User email', value: user?.email ?? null },
    { label: 'User ID', value: user?.uid ?? null },
    { label: 'Display name', value: user?.displayName ?? null },
    { label: 'Window size', value: `${window.innerWidth}x${window.innerHeight}` },
    { label: 'User agent', value: navigator.userAgent },
  ], [user])

  const filteredVars = useMemo(() => {
    if (!varSearch.trim()) return debugVars
    const q = varSearch.toLowerCase()
    return debugVars.filter(v =>
      v.label.toLowerCase().includes(q) ||
      String(v.value ?? '').toLowerCase().includes(q)
    )
  }, [debugVars, varSearch])

  const activeSimCount = [
    sim.simulateEmptyState,
    sim.simulateHighVolume,
    sim.simulateLatencyMs > 0,
    sim.simulateFailureRate > 0,
    sim.firestoreError !== null,
  ].filter(Boolean).length

  return (
    <>
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="dev-panel-trigger"
          aria-label="Open DevPanel (Shift+D)"
          title="Open DevPanel (Shift+D)"
        >
          <span className="dev-panel-trigger-icon">
            {activeSimCount > 0 ? '⬡' : '⬡'}
          </span>
          <span>DEV</span>
          {activeSimCount > 0 && (
            <span className="dev-panel-badge">{activeSimCount}</span>
          )}
        </button>
      )}

      {open && (
        <>
          <button type="button" className="dev-panel-overlay" onClick={() => setOpen(false)} aria-label="Close DevPanel" />
          <div className="dev-panel">
            <div className="dev-panel-header">
              <div className="dev-panel-header-left">
                <span className="dev-panel-header-icon">⬡</span>
                <span className="dev-panel-header-title">DevPanel</span>
                {activeSimCount > 0 && (
                  <span className="dev-panel-header-badge">{activeSimCount} sims</span>
                )}
              </div>
              <div className="dev-panel-header-right">
                <span className="dev-panel-header-mode">{import.meta.env.MODE}</span>
                <button onClick={() => setOpen(false)} className="dev-panel-close" aria-label="Close DevPanel">✕</button>
              </div>
            </div>

            <div className="dev-panel-tabs">
              <div className="dev-panel-tab-indicator" style={{ width: tabWidth, left: `calc(${tabIndex} * ${tabWidth})` }} />
              {TABS.map(t => {
                const meta = TAB_META[t]
                const active = tab === t
                return (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={`dev-panel-tab${active ? ' dev-panel-tab--active' : ''}`}
                  >
                    <span className="dev-panel-tab-icon">{meta.icon}</span>
                    {meta.label}
                  </button>
                )
              })}
            </div>

            <div className="dev-panel-body">
              {tab === 'state' && (
                <div className="dev-panel-section">
                  <div className="dev-panel-section-title">Runtime State</div>
                  <div className="dev-panel-var-list">
                    {stateVars.map(v => (
                      <DevVarRow key={v.label} label={v.label} value={v.value} copied={copied} onCopy={copy} />
                    ))}
                  </div>
                </div>
              )}

              {tab === 'vars' && (
                <div className="dev-panel-section">
                  <div className="dev-panel-section-title">Environment</div>
                  <div className="dev-panel-search">
                    <input
                      ref={searchRef}
                      type="text"
                      value={varSearch}
                      onChange={e => setVarSearch(e.target.value)}
                      placeholder="Filter variables…"
                      aria-label="Filter variables"
                      className="dev-panel-search-input"
                    />
                    {varSearch && (
                      <button onClick={() => setVarSearch('')} className="dev-panel-search-clear" aria-label="Clear search">✕</button>
                    )}
                  </div>
                  <div className="dev-panel-var-count">{filteredVars.length} / {debugVars.length}</div>
                  <div className="dev-panel-var-list">
                    {filteredVars.map(v => (
                      <DevVarRow key={v.label} label={v.label} value={v.value} copied={copied} onCopy={copy} />
                    ))}
                    {filteredVars.length === 0 && (
                      <div className="dev-panel-empty">No variables match &ldquo;{varSearch}&rdquo;</div>
                    )}
                  </div>
                </div>
              )}

              {tab === 'triggers' && (
                <div className="dev-panel-section">
                  <div className="dev-panel-section-title">Debug Actions</div>
                  <div className="dev-panel-action-grid">
                    <DevActionBtn label="SW Update" desc="Dispatch update event" onClick={handleSWUpdate} />
                    <DevActionBtn label="Force Error" desc={`Throw test error #${errorCount + 1}`} onClick={handleForceError} />
                    <DevActionBtn label="Clear Cache" desc="localStorage.clear() + reload" onClick={handleClearCache} />
                    <DevActionBtn label="Hard Reload" desc="window.location.reload()" onClick={() => window.location.reload()} />
                    <DevActionBtn label="Ping Test" desc="console.log + toast" onClick={() => console.log('[DevPanel] ping')} />
                    <DevActionBtn label="Debug Panel" desc={showDebug ? 'Close debug panel' : 'Open debug panel (7-tap)'} onClick={() => setShowDebug(v => !v)} />
                  </div>
                  <div className="dev-panel-info-box">
                    <div className="dev-panel-info-title">Quick Info</div>
                    <div className="dev-panel-info-grid">
                      <span><b>Route:</b> {location.pathname}</span>
                      <span><b>UID:</b> {(user?.uid ?? '—').slice(0, 12)}</span>
                      <span><b>Theme:</b> {dark ? 'dark' : 'light'}</span>
                      <span><b>Lang:</b> {lang}</span>
                      <span className="dev-panel-info-span2">
                        <b>Online:</b>{' '}
                        <span className={isOnline ? 'dev-panel-text-green' : 'dev-panel-text-red'}>
                          {isOnline ? '● connected' : '● offline'}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {tab === 'scenarios' && (
                <ScenarioContent sim={sim} updateSim={setDevSimState} resetSim={resetDevSimState} activeCount={activeSimCount} />
              )}

              {tab === 'components' && <ComponentsTab />}
            </div>

            <div className="dev-panel-footer">
              <span className="dev-panel-footer-brand">
                <span className="dev-panel-footer-dot" />
                MPoints Tracker
                <kbd className="dev-panel-footer-kbd">⇧D</kbd>
              </span>
              {activeSimCount > 0 && (
                <button onClick={resetDevSimState} className="dev-panel-footer-reset">Reset sims</button>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}

function DevVarRow({ label, value, copied, onCopy }: {
  label: string
  value: string | number | boolean | null | undefined
  copied: string | null
  onCopy: (l: string, v: string) => void
}) {
  const display = formatVal(value)
  return (
    <div className="dev-panel-var-row">
      <div className="dev-panel-var-label">
        <div className="dev-panel-var-name">{label}</div>
        <div className={`dev-panel-var-value ${getValueColor(value)}`}>{display}</div>
      </div>
      <button onClick={() => onCopy(label, String(value ?? ''))} className="dev-panel-var-copy" title="Copy value">
        {copied === label ? <span className="dev-panel-text-green">✓</span> : 'C'}
      </button>
    </div>
  )
}

function DevActionBtn({ label, desc, onClick }: { label: string; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="dev-panel-action-btn">
      <div className="dev-panel-action-label">{label}</div>
      <div className="dev-panel-action-desc">{desc}</div>
    </button>
  )
}

function ScenarioContent({ sim, updateSim, resetSim, activeCount }: {
  sim: ReturnType<typeof getDevSimState>
  updateSim: typeof setDevSimState
  resetSim: typeof resetDevSimState
  activeCount: number
}) {
  return (
    <div className="dev-panel-section">
      {activeCount > 0 && (
        <div className="dev-panel-active-banner">
          <div className="dev-panel-active-header">
            <span className="dev-panel-active-title">
              <span className="dev-panel-active-dot" />
              {activeCount} active simulation{activeCount > 1 ? 's' : ''}
            </span>
            <button onClick={resetSim} className="dev-panel-active-reset">Reset All</button>
          </div>
        </div>
      )}

      <DevScenarioSection icon="👤" title="User Type">
        <DevToggle label="Empty state" desc="No matches, test zero state" active={sim.simulateEmptyState} onToggle={() => updateSim({ simulateEmptyState: !sim.simulateEmptyState, simulateHighVolume: false })} />
        <DevToggle label="Power user" desc="~200+ matches, test performance" active={sim.simulateHighVolume} onToggle={() => updateSim({ simulateHighVolume: !sim.simulateHighVolume, simulateEmptyState: false })} />
      </DevScenarioSection>

      <DevScenarioSection icon="🌐" title="Network">
        <DevSlider label="Latency" value={sim.simulateLatencyMs} max={5000} step={100} onChange={v => updateSim({ simulateLatencyMs: v })} format={v => v > 0 ? `${v}ms` : 'off'} />
        <DevSlider label="Failures" value={sim.simulateFailureRate * 100} max={75} step={5} onChange={v => updateSim({ simulateFailureRate: v / 100 })} format={v => v > 0 ? `${Math.round(v)}%` : 'off'} />
      </DevScenarioSection>

      <DevScenarioSection icon="❌" title="Error Simulation">
        <DevChipSelector
          label="Firestore"
          options={[
            { value: 'permission-denied', label: 'Permission' },
            { value: 'unavailable', label: 'Unavailable' },
            { value: null, label: 'None' },
          ]}
          selected={sim.firestoreError}
          onChange={v => updateSim({ firestoreError: v as 'permission-denied' | 'unavailable' | null })}
        />
      </DevScenarioSection>
    </div>
  )
}

function DevScenarioSection({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div className="dev-panel-scenario-section">
      <div className="dev-panel-scenario-title">
        <span className="dev-panel-scenario-icon">{icon}</span>
        {title}
      </div>
      {children}
    </div>
  )
}

function DevToggle({ label, desc, active, onToggle }: { label: string; desc: string; active: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className={`dev-panel-toggle${active ? ' dev-panel-toggle--active' : ''}`}>
      <span className={`dev-panel-toggle-check${active ? ' dev-panel-toggle-check--on' : ''}`}>
        {active && '✓'}
      </span>
      <div className="dev-panel-toggle-text">
        <div className="dev-panel-toggle-label">{label}</div>
        <div className="dev-panel-toggle-desc">{desc}</div>
      </div>
    </button>
  )
}

function DevSlider({ label, value, max, step, onChange, format }: {
  label: string; value: number; max: number; step: number; onChange: (v: number) => void; format: (v: number) => string
}) {
  const pct = (value / max) * 100
  return (
    <div className="dev-panel-slider-group">
      <div className="dev-panel-slider-header">
        <span className="dev-panel-slider-label">{label}</span>
        <span className={`dev-panel-slider-value${value > 0 ? ' dev-panel-slider-value--on' : ''}`}>{format(value)}</span>
      </div>
      <div className="dev-panel-slider-track">
        <div className="dev-panel-slider-fill" style={{ width: `${pct}%` }} />
        <input type="range" aria-label={label} min={0} max={max} step={step} value={value} onChange={e => onChange(Number(e.target.value))} className="dev-panel-slider-input" />
        <div className="dev-panel-slider-knob" style={{ left: `calc(${pct}% - 8px)` }} />
      </div>
    </div>
  )
}

function DevChipSelector<T extends string | null>({ label, options, selected, onChange }: {
  label: string
  options: readonly { value: T; label: string }[]
  selected: T
  onChange: (v: T) => void
}) {
  return (
    <div className="dev-panel-chip-group">
      <span className="dev-panel-chip-label">{label}</span>
      <div className="dev-panel-chip-row">
        {options.map(opt => (
          <button key={opt.label} onClick={() => onChange(opt.value)} className={`dev-panel-chip${selected === opt.value ? ' dev-panel-chip--active' : ''}`}>
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const COMPONENT_GROUPS = [
  {
    title: 'Layout & Shell',
    items: [
      { name: 'AppLayout', file: 'src/components/ui/AppLayout.tsx', desc: 'Main layout shell, renders all views' },
      { name: 'AppShell', file: 'src/components/ui/AppShell.tsx', desc: 'Outer wrapper — bg, toast, dev indicator' },
      { name: 'AppHeader', file: 'src/components/ui/AppHeader.tsx', desc: 'Page header bar' },
      { name: 'OfflineBanner', file: 'src/components/ui/OfflineBanner.tsx', desc: 'Offline connectivity warning' },
      { name: 'InstallBanner', file: 'src/components/ui/InstallBanner.tsx', desc: 'PWA install prompt' },
      { name: 'ScrollToTop', file: 'src/components/ui/ScrollToTop.tsx', desc: 'Auto scroll to top on nav' },
      { name: 'ReloadButton', file: 'src/components/ui/ReloadButton.tsx', desc: 'Data reload / sync button' },
      { name: 'SyncDot', file: 'src/components/ui/SyncDot.tsx', desc: 'Sync status indicator dot' },
    ],
  },
  {
    title: 'UI Primitives',
    items: [
      { name: 'Toast', file: 'src/components/ui/Toast.tsx', desc: 'Toast notification' },
      { name: 'ThemeToggle', file: 'src/components/ui/ThemeToggle.tsx', desc: 'Light/dark theme toggle' },
      { name: 'UserAvatar', file: 'src/components/ui/UserAvatar.tsx', desc: 'User profile avatar' },
      { name: 'PillSwitch', file: 'src/components/ui/PillSwitch.tsx', desc: 'Toggle pill control' },
      { name: 'Tooltip', file: 'src/components/ui/Tooltip.tsx', desc: 'Tooltip component' },
      { name: 'ConfirmModal', file: 'src/components/ui/ConfirmModal.tsx', desc: 'Confirmation dialog modal' },
      { name: 'OnboardingModal', file: 'src/components/ui/OnboardingModal.tsx', desc: 'First-launch onboarding' },
      { name: 'Dropdown', file: 'src/components/ui/Dropdown.tsx', desc: 'Dropdown menu' },
      { name: 'PlayerInput', file: 'src/components/ui/PlayerInput.tsx', desc: 'Player name input' },
      { name: 'SaveGroupButton', file: 'src/components/ui/SaveGroupButton.tsx', desc: 'Save player group button' },
      { name: 'GroupPicker', file: 'src/components/ui/GroupPicker.tsx', desc: 'Player group selector' },
      { name: 'AutocompleteInput', file: 'src/components/ui/AutocompleteInput.tsx', desc: 'Autocomplete text input' },
    ],
  },
  {
    title: 'Screens & Pages',
    items: [
      { name: 'SplashScreen', file: 'src/components/ui/SplashScreen.tsx', desc: 'First-visit splash screen' },
      { name: 'BootShell', file: 'src/components/ui/BootShell.tsx', desc: 'Loading / boot state' },
      { name: 'HomeTab', file: 'src/components/home/HomeTab.tsx', desc: 'Home screen with game list' },
      { name: 'HomeGameHero', file: 'src/components/home/HomeGameHero.tsx', desc: 'Game hero on home' },
      { name: 'EmailAuthScreen', file: 'src/components/auth/EmailAuthScreen.tsx', desc: 'Login/signup screen' },
    ],
  },
  {
    title: 'Games',
    items: [
      { name: 'GameDetail', file: 'src/pages/GameDetail.tsx', desc: 'Game detail / scoring screen' },
      { name: 'EditMatchModal', file: 'src/components/ui/EditMatchModal.tsx', desc: 'Edit existing match' },
      { name: 'EarlyFinishModal', file: 'src/components/ui/EarlyFinishModal.tsx', desc: 'Early finish dialog' },
      { name: 'ShareResultCard', file: 'src/components/ui/ShareResultCard.tsx', desc: 'Share match result card' },
      { name: 'SpotifyMiniPlayer', file: 'src/components/ui/SpotifyMiniPlayer.tsx', desc: 'Spotify mini player' },
    ],
  },
  {
    title: 'Pages',
    items: [
      { name: 'RulesPage', file: 'src/pages/RulesPage.tsx', desc: 'Game rules and scoring' },
      { name: 'ChampsPage', file: 'src/pages/ChampsPage.tsx', desc: 'Champions / hall of fame' },
      { name: 'SettingsPage', file: 'src/pages/SettingsPage.tsx', desc: 'Settings and profile' },
      { name: 'AdminPage', file: 'src/pages/AdminPage.tsx', desc: 'Admin panel (reports, users)' },
      { name: 'GlobalHistoryPage', file: 'src/pages/GlobalHistoryPage.tsx', desc: 'Global match history' },
      { name: 'StatsTab', file: 'src/pages/StatsTab.tsx', desc: 'Statistics tab' },
    ],
  },
  {
    title: 'Hooks & Services',
    items: [
      { name: 'useAuth', file: 'src/hooks/useAuth.ts', desc: 'Firebase Auth management' },
      { name: 'useMatches', file: 'src/hooks/useMatches.ts', desc: 'Match CRUD + cloud sync' },
      { name: 'useGameSession', file: 'src/hooks/useGameSession.ts', desc: 'Active game session state' },
      { name: 'useTheme', file: 'src/hooks/useTheme.ts', desc: 'Theme management' },
      { name: 'useOnlineStatus', file: 'src/hooks/useOnlineStatus.ts', desc: 'Online/offline detection' },
      { name: 'useToast', file: 'src/hooks/useToast.ts', desc: 'Toast notification state' },
      { name: 'useNavigation', file: 'src/hooks/useNavigation.tsx', desc: 'Navigation state management' },
      { name: 'matchService', file: 'src/services/matchService.ts', desc: 'Firestore match operations' },
      { name: 'userService', file: 'src/services/userService.ts', desc: 'Firestore user operations' },
      { name: 'authService', file: 'src/services/authService.ts', desc: 'Firebase Auth service calls' },
    ],
  },
]

function ComponentsTab() {
  return (
    <div className="dev-panel-section">
      <div className="dev-panel-section-title">Components</div>
      <p className="dev-panel-section-desc">
        UI components, pages, hooks, and services. Use these names when reporting issues or requesting changes.
      </p>
      <div className="dev-panel-comp-list">
        {COMPONENT_GROUPS.map(group => (
          <div key={group.title}>
            <div className="dev-panel-comp-group-title">{group.title}</div>
            {group.items.map(item => (
              <div key={item.name} className="dev-panel-comp-item">
                <div className="dev-panel-comp-name">{item.name}</div>
                <div className="dev-panel-comp-desc">{item.desc}</div>
                <div className="dev-panel-comp-file">{item.file}</div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function formatVal(v: string | number | boolean | null | undefined): string {
  if (v === null) return 'null'
  if (v === undefined) return 'undefined'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (typeof v === 'number') return String(v)
  if (v.length > 100) return v.slice(0, 97) + '…'
  return v || '—'
}

function getValueColor(v: string | number | boolean | null | undefined): string {
  if (v === null || v === undefined) return 'dev-panel-value-null'
  if (typeof v === 'boolean') return 'dev-panel-value-bool'
  if (typeof v === 'number') return 'dev-panel-value-num'
  if (typeof v === 'string') {
    if (v.startsWith('http') || v.startsWith('/')) return 'dev-panel-value-url'
  }
  return ''
}
