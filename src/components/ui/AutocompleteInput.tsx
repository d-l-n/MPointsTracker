import { useState, type ChangeEvent, type CSSProperties } from "react";

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  suggestions?: string[];
  className?: string;
  style?: CSSProperties;
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
    <div className="autocomplete" style={containerStyle}>
      <input
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
            <div
              key={suggestion}
              className="ac-item"
              onMouseDown={() => selectSuggestion(suggestion)}
              onTouchStart={() => selectSuggestion(suggestion)}
            >
              {suggestion}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
