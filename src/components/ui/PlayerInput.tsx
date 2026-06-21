import { memo, useId, useState, type ChangeEvent, type CSSProperties } from "react";

interface PlayerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  knownNames?: string[];
  label?: string;
  id?: string;
}

const containerStyle: CSSProperties = {
  flex: 1,
};

function PlayerInput({ value, onChange, placeholder, knownNames = [], label, id: explicitId }: PlayerInputProps) {
  const generatedId = useId();
  const inputId = explicitId || generatedId;
  const [focused, setFocused] = useState(false);
  const suggestions = knownNames.filter((name) => name.toLowerCase().includes(value.toLowerCase()) && name !== value);
  const show = focused && value.length > 0 && suggestions.length > 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={label ? "inp-group autocomplete" : "autocomplete"} style={containerStyle}>
      {label && <label htmlFor={inputId} className="inp-label">{label}</label>}
      <input
        id={inputId}
        className="inp"
        placeholder={placeholder}
        value={value}
        data-testid="player-input"
        onChange={handleChange}
        aria-label={label || placeholder}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {show && (
        <div className="ac-dropdown">
          {suggestions.slice(0, 5).map((name) => (
            <button type="button" key={name} className="ac-item" onMouseDown={(e) => { e.preventDefault(); onChange(name); }} style={{ width: "100%", textAlign: "left", background: "none", border: "none", fontFamily: "inherit", cursor: "pointer" }}>
              {name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default memo(PlayerInput)
