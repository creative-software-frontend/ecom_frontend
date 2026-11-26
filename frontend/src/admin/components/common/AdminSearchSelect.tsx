import { useMemo, useRef, useState } from "react"
import { Combobox } from "@base-ui/react/combobox"
import { Check, ChevronDown, Search } from "lucide-react"

export type AdminSearchSelectOption = {
  value: string
  label: string
}

type AdminSearchSelectProps = {
  id: string
  name?: string
  value: string
  options: readonly AdminSearchSelectOption[]
  onValueChange: (value: string) => void
  placeholder: string
  searchPlaceholder?: string
  emptyMessage?: string
  disabled?: boolean
  required?: boolean
}

export function AdminSearchSelect({
  id,
  name,
  value,
  options,
  onValueChange,
  placeholder,
  searchPlaceholder = "Search options",
  emptyMessage = "No matching options.",
  disabled = false,
  required = false,
}: AdminSearchSelectProps) {
  const [query, setQuery] = useState("")
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  const items = useMemo(
    () => options.map((option) => ({ ...option })),
    [options]
  )
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    if (!normalizedQuery) return items
    return items.filter((option) =>
      option.label.toLocaleLowerCase().includes(normalizedQuery)
    )
  }, [items, query])
  const selectedLabel = options.find((option) => option.value === value)?.label

  return (
    <Combobox.Root
      items={items}
      filteredItems={filteredItems}
      value={value || null}
      inputValue={query}
      onInputValueChange={setQuery}
      onOpenChange={(open) => {
        setQuery("")
        if (open) {
          setPortalContainer(
            triggerRef.current?.closest<HTMLElement>(".admin-root") ?? null
          )
        }
      }}
      onValueChange={(nextValue) => {
        onValueChange(nextValue ?? "")
        setQuery("")
      }}
      name={name}
      required={required}
      itemToStringLabel={(selectedValue) =>
        options.find((option) => option.value === selectedValue)?.label ?? ""
      }
      disabled={disabled}
    >
      <Combobox.Trigger
        ref={triggerRef}
        id={id}
        type="button"
        className="flex h-9 w-full cursor-pointer items-center justify-between rounded-md border border-(--border-light) bg-(--bg-surface) px-2.5 text-left text-xs text-(--text-primary) outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Combobox.Value>
          {selectedLabel ?? (
            <span className="text-(--text-muted)">{placeholder}</span>
          )}
        </Combobox.Value>
        <ChevronDown
          aria-hidden="true"
          className="ml-2 size-3.5 shrink-0 text-(--text-muted)"
        />
      </Combobox.Trigger>

      <Combobox.Portal container={portalContainer}>
        <Combobox.Positioner
          align="start"
          sideOffset={4}
          className="z-60 w-(--anchor-width)"
        >
          <Combobox.Popup
            initialFocus={inputRef}
            className="flex max-h-72 w-full flex-col overflow-hidden rounded-md border border-(--border-light) bg-(--bg-surface) text-(--text-primary) shadow-lg"
          >
            <div className="flex h-9 shrink-0 items-center gap-2 border-b border-(--border-light) px-2.5">
              <Search
                aria-hidden="true"
                className="size-3.5 shrink-0 text-(--text-muted)"
              />
              <Combobox.Input
                ref={inputRef}
                aria-label={searchPlaceholder}
                placeholder={searchPlaceholder}
                className="h-full min-w-0 flex-1 bg-transparent text-xs text-(--text-primary) outline-none placeholder:text-(--text-muted)"
              />
            </div>
            <Combobox.List className="min-h-0 overflow-y-auto py-1">
              {filteredItems.map((option) => (
                <Combobox.Item
                  key={option.value}
                  value={option.value}
                  className="flex min-h-8 cursor-pointer items-center justify-between gap-2 px-2.5 py-2 text-xs outline-none data-highlighted:bg-(--bg-surface-hover)"
                >
                  <span className="min-w-0 flex-1 truncate">
                    {option.label}
                  </span>
                  {option.value === value ? (
                    <Check
                      aria-hidden="true"
                      className="size-3.5 shrink-0 text-(--primary)"
                    />
                  ) : null}
                </Combobox.Item>
              ))}
            </Combobox.List>
            <Combobox.Empty className="px-2.5 py-3 text-xs text-(--text-muted)">
              {emptyMessage}
            </Combobox.Empty>
          </Combobox.Popup>
        </Combobox.Positioner>
      </Combobox.Portal>
    </Combobox.Root>
  )
}
