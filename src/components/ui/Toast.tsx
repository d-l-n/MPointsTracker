interface ToastProps {
  msg: string;
  show: boolean;
  actionLabel?: string;
  onAction?: () => void;
}

export default function Toast({ msg, show, actionLabel, onAction }: ToastProps) {
  return (
    <div className={`toast${show ? " show" : ""}`} aria-live="polite" data-testid="toast-root">
      <span className="toast-msg">{msg}</span>
      {actionLabel && onAction && (
        <button className="toast-action" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  );
}
