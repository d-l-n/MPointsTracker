import { useState, useRef, useCallback, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface TooltipProps {
  text: string;
  children: ReactNode;
  delay?: number;
}

export default function Tooltip({ text, children, delay = 300 }: TooltipProps) {
  const [show, setShow] = useState(false);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const targetRef = useRef<HTMLSpanElement>(null);

  const position = useCallback(() => {
    const rect = targetRef.current?.getBoundingClientRect();
    if (!rect) return;
    setStyle({
      position: "fixed",
      bottom: window.innerHeight - rect.top + 6,
      left: rect.left + rect.width / 2,
      zIndex: 99999,
    });
  }, []);

  const handleEnter = useCallback(() => {
    timerRef.current = setTimeout(() => {
      position();
      setShow(true);
    }, delay);
  }, [delay, position]);

  const handleLeave = useCallback(() => {
    clearTimeout(timerRef.current);
    setShow(false);
  }, []);

  return (
    <span
      ref={targetRef}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onFocus={handleEnter}
      onBlur={handleLeave}
      style={{ display: "inline-flex" }}
      title={text}
    >
      {children}
      {show && createPortal(
        <div className="tooltip" style={style} role="tooltip">
          {text}
        </div>,
        document.body
      )}
    </span>
  );
}
