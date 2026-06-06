import { useState, type ChangeEvent, type CSSProperties } from "react";

interface PlayerInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  knownNames?: string[];
}

const containerStyle: CSSProperties = {
  flex: 1,
};

export default function PlayerInput({ value, onChange, placeholder, knownNames = [] }: PlayerInputProps) {
  const [focused, setFocused] = useState(false);
  const suggestions = knownNames.filter((name) => name.toLowerCase().includes(value.toLowerCase()) && name !== value);
  const show = focused && value.length > 0 && suggestions.length > 0;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="autocomplete" style={containerStyle}>
      <input
        className="inp"
        placeholder={placeholder}
        value={value}
        data-testid="player-input"
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />
      {show && (
        <div className="ac-dropdown">
          {suggestions.slice(0, 5).map((name) => (
            <div key={name} className="ac-item" onMouseDown={() => onChange(name)}>
              {name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
