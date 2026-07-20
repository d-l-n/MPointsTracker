import { memo, useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type CSSProperties, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";

interface PlayerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  knownNames?: string[];
  label?: string;
  id?: string;
}

function highlightMatch(text: string, query: string) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <strong>{text.slice(idx, idx + query.length)}</strong>
      {text.slice(idx + query.length)}
    </>
  );
}

function PlayerInput({ value, onChange, placeholder, knownNames = [], label, id: explicitId }: PlayerInputProps) {
  const generatedId = useId();
  const inputId = explicitId || generatedId;
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<CSSProperties>({});
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const suggestions = knownNames.filter((name) => name.toLowerCase().includes(value.toLowerCase()) && name !== value);
  const show = open && value.length > 0 && suggestions.length > 0;

  const fitMenu = useCallback((rect: DOMRect) => {
    const gap = 4;
    const maxH = 220;
    const below = window.innerHeight - rect.bottom - gap;
    const above = rect.top - gap;
    const openUp = below < maxH && above > below;

    setMenuStyle({
      position: "fixed",
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? window.innerHeight - rect.top + gap : undefined,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  const measure = useCallback(() => {
    const rect = inputRef.current?.getBoundingClientRect();
    if (rect) fitMenu(rect);
  }, [fitMenu]);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIdx(-1);
  }, []);

  const selectName = useCallback((name: string) => {
    onChange(name);
    close();
    inputRef.current?.focus();
  }, [onChange, close]);

  useEffect(() => {
    if (!show) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputRef.current?.contains(e.target as Node) ||
        listRef.current?.contains(e.target as Node)
      ) return;
      close();
    };

    const reposition = () => {
      const rect = inputRef.current?.getBoundingClientRect();
      if (rect) fitMenu(rect);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [show, close, fitMenu]);

  useEffect(() => {
    if (!show || focusedIdx < 0) return;
    listRef.current?.querySelectorAll(".ac-item")[focusedIdx]?.scrollIntoView({ block: "nearest" });
  }, [focusedIdx, show]);

  useEffect(() => {
    if (!open && document.activeElement === inputRef.current && value.length > 0 && suggestions.length > 0) {
      measure();
      setOpen(true);
    }
  }, [value, open, suggestions.length, measure]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!show) {
        if (e.key === "ArrowDown") {
          e.preventDefault();
          setOpen(true);
          setFocusedIdx(0);
        }
        return;
      }

      switch (e.key) {
        case "Escape":
          e.preventDefault();
          close();
          break;
        case "ArrowDown":
          e.preventDefault();
          setFocusedIdx((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIdx((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIdx >= 0 && focusedIdx < suggestions.length) {
            selectName(suggestions[focusedIdx]);
          }
          break;
        case "Tab":
          if (focusedIdx >= 0 && focusedIdx < suggestions.length) {
            selectName(suggestions[focusedIdx]);
          } else {
            close();
          }
          break;
      }
    },
    [show, focusedIdx, suggestions, close, selectName],
  );

  return (
    <div className={label ? "inp-group autocomplete" : "autocomplete"} style={{ flex: 1 }}>
      {label && <label htmlFor={inputId} className="inp-label">{label}</label>}
      <input
        ref={inputRef}
        id={inputId}
        className="inp"
        placeholder={placeholder}
        value={value}
        data-testid="player-input"
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => { measure(); setOpen(true); }}
        onKeyDown={handleKeyDown}
        aria-label={label || placeholder}
        aria-expanded={show}
        aria-haspopup="listbox"
        autoComplete="off"
      />
      {show && createPortal(
        <div
          ref={listRef}
          className="ac-dropdown"
          style={menuStyle}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {suggestions.slice(0, 5).map((name, idx) => (
            <button
              type="button"
              key={name}
              className={`ac-item${idx === focusedIdx ? " ac-item--focused" : ""}`}
              role="option"
              aria-selected={idx === focusedIdx}
              onMouseEnter={() => setFocusedIdx(idx)}
              onMouseDown={() => selectName(name)}
            >
              {highlightMatch(name, value)}
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}

export default memo(PlayerInput)
