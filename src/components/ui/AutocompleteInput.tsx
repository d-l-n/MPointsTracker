import { type ChangeEvent, type CSSProperties, useId } from "react";

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
  id: idProp,
}: AutocompleteInputProps) {
  const generatedId = useId();
  const id = idProp ?? generatedId;
  const listId = `${id}-list`;
  const suggestions = rawSuggestions.filter(
    (suggestion) =>
      suggestion.toLowerCase().includes(value.toLowerCase()) && suggestion !== value
  );

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className={label ? "inp-group autocomplete" : "autocomplete"} style={containerStyle}>
      {label && <label htmlFor={id} className="inp-label">{label}</label>}
      <input
        id={id}
        className={className}
        style={style}
        placeholder={placeholder}
        value={value}
        onChange={handleChange}
        list={listId}
      />
      <datalist id={listId}>
        {suggestions.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </div>
  );
}
