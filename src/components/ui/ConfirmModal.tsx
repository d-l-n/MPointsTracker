import React from "react";

import { getGlobalT } from "../../data/translations";

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
  return (
    <div className="modal-overlay" onClick={onOverlayClick ?? onCancel}>
      <div className="modal-box" onClick={(event) => event.stopPropagation()}>
        <div className="modal-title">{title}</div>
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
