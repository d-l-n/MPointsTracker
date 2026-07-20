import { useState, useRef, useEffect, useCallback, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "reicon-react";

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  placeholder?: string;
  label?: string;
  native?: boolean;
  id?: string;
  className?: string;
  testId?: string;
}

export default function Dropdown({
  value,
  onChange,
  options,
  placeholder,
  label,
  native,
  id,
  className = "",
  testId,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerId = id || `dd-${value || "pl"}`;

  const selected = options.find((o) => o.value === value);

  const MENU_GAP = 4;
  const MENU_MAX_HEIGHT = 220;

  const fitMenu = useCallback((rect: DOMRect) => {
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const openUp = spaceBelow < MENU_MAX_HEIGHT && spaceAbove > spaceBelow;

    setMenuStyle({
      position: "fixed",
      top: openUp ? undefined : rect.bottom + MENU_GAP,
      bottom: openUp ? window.innerHeight - rect.top + MENU_GAP : undefined,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  const measureAndOpen = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) fitMenu(rect);
    setOpen(true);
  }, [fitMenu]);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIdx(-1);
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        listRef.current?.contains(e.target as Node)
      ) return;
      close();
    };

    const reposition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
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
  }, [open, close, fitMenu]);

  useEffect(() => {
    if (!open || focusedIdx < 0) return;
    listRef.current?.querySelectorAll(".dropdown-option")[focusedIdx]?.scrollIntoView({ block: "nearest" });
  }, [focusedIdx, open]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) {
        if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
          e.preventDefault();
          setFocusedIdx(0);
          measureAndOpen();
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
          setFocusedIdx((prev) => (prev < options.length - 1 ? prev + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setFocusedIdx((prev) => (prev > 0 ? prev - 1 : options.length - 1));
          break;
        case "Enter":
          e.preventDefault();
          if (focusedIdx >= 0 && focusedIdx < options.length) {
            onChange(options[focusedIdx].value);
            close();
          }
          break;
        case " ":
          e.preventDefault();
          if (focusedIdx >= 0 && focusedIdx < options.length) {
            onChange(options[focusedIdx].value);
            close();
          }
          break;
        case "Home":
          e.preventDefault();
          setFocusedIdx(0);
          break;
        case "End":
          e.preventDefault();
          setFocusedIdx(options.length - 1);
          break;
      }
    },
    [open, focusedIdx, options, onChange, measureAndOpen, close]
  );

  if (native) {
    return (
      <div className={label ? "inp-group" : ""}>
        {label && <label htmlFor={triggerId} className="inp-label">{label}</label>}
        <select
          id={triggerId}
          className={`inp ${className}`.trim()}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          data-testid={testId}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className={label ? "inp-group" : ""}>
      {label && <label htmlFor={triggerId} className="inp-label">{label}</label>}
      <div
        className={`dropdown ${className}`.trim()}
        data-testid={testId}
        onKeyDown={handleKeyDown}
      >
        <button
          ref={triggerRef}
          id={triggerId}
          type="button"
          className="dropdown-trigger"
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label || placeholder}
          onClick={() => open ? close() : measureAndOpen()}
        >
          <span className="dropdown-trigger-label">
            {selected ? selected.label : placeholder || ""}
          </span>
          <ChevronDown size={14} />
        </button>
      </div>
      {open && createPortal(
        <div
          ref={listRef}
          className="dropdown-menu"
          style={menuStyle}
          role="listbox"
          onMouseDown={(e) => e.preventDefault()}
        >
          {options.length === 0 ? (
            <div className="dropdown-option dropdown-option--empty">
              No options
            </div>
          ) : (
            options.map((opt, idx) => (
              <button
                key={opt.value}
                type="button"
                className={`dropdown-option${idx === focusedIdx ? " dropdown-option--focused" : ""}${opt.value === value ? " dropdown-option--selected" : ""}`}
                role="option"
                aria-selected={opt.value === value}
                onMouseEnter={() => setFocusedIdx(idx)}
                onMouseDown={() => {
                  onChange(opt.value);
                  close();
                }}
              >
                {opt.label}
              </button>
            ))
          )}
        </div>,
        document.body
      )}
    </div>
  );
}
