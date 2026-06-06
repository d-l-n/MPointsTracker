interface BootShellProps {
  stage: "splash" | "loading";
  copy: string;
  loadingLabel?: string;
}

const SKELETON_ROW_WIDTHS = ["72%", "88%", "61%"];

export default function BootShell({ stage, copy, loadingLabel }: BootShellProps) {
  return (
    <div className={`boot-shell boot-shell--${stage}`} data-testid="boot-shell" data-boot-stage={stage}>
      <div className="boot-shell-bg" aria-hidden="true">
        <span className="boot-orb boot-orb--violet" />
        <span className="boot-orb boot-orb--teal" />
        <span className="boot-grid" />
      </div>

      <section className="boot-card">
        <div className="boot-brand">
          <div className="boot-title">MPOINTS</div>
          <div className="boot-subtitle">TRACKER</div>
        </div>
        <p className="boot-copy">{copy}</p>

        <div className="boot-meter" aria-hidden="true">
          <span className="boot-meter-bar" />
        </div>

        <div className="boot-preview" aria-hidden="true">
          <div className="boot-preview-header">
            <span className="boot-chip" />
            <span className="boot-chip boot-chip--ghost" />
          </div>
          <div className="boot-preview-panel">
            {SKELETON_ROW_WIDTHS.map((width, index) => (
              <span
                key={width}
                className="boot-skeleton-row"
                data-testid="boot-skeleton-row"
                data-skeleton-index={index}
                style={{ width }}
              />
            ))}
          </div>
        </div>

        {loadingLabel ? (
          <div className="boot-loading-copy" data-testid="boot-loading-copy">
            {loadingLabel}
          </div>
        ) : null}
      </section>
    </div>
  );
}
