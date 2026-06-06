interface PillSwitchProps {
  enabled: boolean;
  onToggle: (value: boolean) => void;
  testId?: string;
  ariaLabel: string;
}

export default function PillSwitch({
  enabled,
  onToggle,
  testId,
  ariaLabel,
}: PillSwitchProps) {
  return (
    <button
      className="pill-switch"
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={ariaLabel}
      data-testid={testId}
      onClick={() => onToggle(!enabled)}
    >
      <span className="pill-switch-thumb" aria-hidden="true" />
    </button>
  );
}
