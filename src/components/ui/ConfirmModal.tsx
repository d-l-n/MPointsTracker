import React, { useEffect } from "react";

import { getGlobalT } from "../../data/translations";
import { useFocusTrap } from "../../hooks/useFocusTrap";

interface ConfirmModalProps {
  title?: React.ReactNode;
  msg?: React.ReactNode;
  confirmLabel?: string | null;
  cancelLabel?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
  secondaryLabel?: string | null;
  onSecondaryAction?: () => void;
  onOverlayClick?: () => void;
  confirmTestId?: string;
  cancelTestId?: string;
  secondaryTestId?: string;
  confirmTone?: string;
  secondaryTone?: string;
}

function ConfirmModal({
  title,
  msg,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  secondaryLabel,
  onSecondaryAction,
  onOverlayClick,
  confirmTestId,
  cancelTestId,
  secondaryTestId,
  confirmTone,
  secondaryTone,
}: ConfirmModalProps) {
  const confirmText = confirmLabel ?? getGlobalT()("delete");
  const cancelText = cancelLabel ?? getGlobalT()("cancel");
  const secondaryText = secondaryLabel ?? null;
  const dialogRef = useFocusTrap();

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") (onOverlayClick ?? onCancel)();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel, onOverlayClick]);

  return (
    <div className="modal-overlay" onClick={onOverlayClick ?? onCancel} aria-hidden="true">
      <div
        ref={dialogRef as React.RefObject<HTMLDivElement>}
        className="modal-box"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div id="confirm-modal-title" className="modal-title">{title}</div>
        <div className="modal-msg">{msg}</div>
        <div className={`modal-actions${onSecondaryAction ? " modal-actions--stacked" : ""}`}>
          {onSecondaryAction ? (
            <>
              <button className={`modal-confirm${confirmTone === "danger" ? " is-danger" : ""}`} data-testid={confirmTestId} onClick={onConfirm}>
                {confirmText}
              </button>
              {secondaryText && (
                <button
                  className={`modal-secondary${secondaryTone === "danger" ? " is-danger" : ""}`}
                  data-testid={secondaryTestId}
                  onClick={onSecondaryAction}
                >
                  {secondaryText}
                </button>
              )}
              <button className="modal-cancel" data-testid={cancelTestId} onClick={onCancel}>
                {cancelText}
              </button>
            </>
          ) : (
            <>
              <button className="modal-cancel" data-testid={cancelTestId} onClick={onCancel}>
                {cancelText}
              </button>
              <button className={`modal-confirm${confirmTone === "danger" ? " is-danger" : ""}`} data-testid={confirmTestId} onClick={onConfirm}>
                {confirmText}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
