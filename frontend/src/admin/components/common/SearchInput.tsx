import type { ChangeEvent, CSSProperties } from "react"

type SearchInputProps = {
  label: string
  placeholder: string
  value: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
  id?: string
  labelClassName?: string
  inputClassName?: string
  inputStyle?: CSSProperties
}

export function SearchInput({
  label,
  placeholder,
  value,
  onChange,
  id,
  labelClassName,
  inputClassName,
  inputStyle,
}: SearchInputProps) {
  return (
    <label htmlFor={id} className={labelClassName}>
      <span>{label}</span>
      <input
        id={id}
        type="search"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={inputClassName}
        style={inputStyle}
      />
    </label>
  )
}
