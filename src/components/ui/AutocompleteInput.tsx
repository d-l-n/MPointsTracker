import { useState, type ChangeEvent, type CSSProperties } from "react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  style?: CSSProperties;
  label?: string;
  id?: string;
}

const containerStyle: CSSProperties = {
  flex: 1,
};

export default function AutocompleteInput({
  value,
  onChange,
  placeholder,
  suggestions: rawSuggestions = [],
  className = "inp",
  style,
  label,
  id,
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false);
  const suggestions = rawSuggestions.filter((suggestion) => suggestion.toLowerCase().includes(value.toLowerCase()) && suggestion !== value);
  const show = open && value.length > 0 && suggestions.length > 0;

  const selectSuggestion = (suggestion: string) => {
    onChange(suggestion);
    setOpen(false);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
    setOpen(true);
  };

  return (
    <div className={label ? "inp-group autocomplete" : "autocomplete"} style={containerStyle}>
      {label && id && <label htmlFor={id} className="inp-label">{label}</label>}
      <input
        id={id}
        className={className}
        style={style}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
      />
      {show && (
        <div className="ac-dropdown">
          {suggestions.map((suggestion) => (
            <button
              type="button"
              key={suggestion}
              className="ac-item"
              onMouseDown={(e) => { e.preventDefault(); selectSuggestion(suggestion); }}
              onTouchStart={(e) => { e.preventDefault(); selectSuggestion(suggestion); }}
              style={{ width: "100%", textAlign: "left", background: "none", border: "none", fontFamily: "inherit", cursor: "pointer" }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
