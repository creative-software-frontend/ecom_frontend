import {
  Undo2,
  Redo2,
  Bold,
  Italic,
  Strikethrough,
  Quote,
  List,
  ListOrdered,
  Link2,
  Eraser,
  ChevronDown,
} from "lucide-react"

/* ================================================================
   Toolbar commands (subset of document.execCommand).
   `formatBlock` receives values like "h2", "p", "blockquote".
   The parent normalizes to "<h2>" form before calling execCommand.
   NOTE: execCommand is deprecated but still supported in all major
   browsers. Migrate to TipTap when a richer editor becomes necessary.
   ================================================================ */

export type ToolbarCommand =
  | "undo"
  | "redo"
  | "bold"
  | "italic"
  | "strikeThrough"
  | "insertUnorderedList"
  | "insertOrderedList"
  | "formatBlock"
  | "createLink"
  | "removeFormat"

function ToolbarButton({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="flex h-7 w-7 items-center justify-center rounded text-(--text-primary) transition-colors hover:bg-(--bg-surface)"
    >
      {children}
    </button>
  )
}

export function RichTextToolbar({
  onCommand,
}: {
  onCommand: (command: ToolbarCommand, value?: string) => void
}) {
  return (
    <div className="flex flex-wrap items-center gap-1 rounded-md border border-(--border-light) bg-(--bg-surface-hover) p-1">
      <ToolbarButton onClick={() => onCommand("undo")} label="Undo">
        <Undo2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => onCommand("redo")} label="Redo">
        <Redo2 className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-(--border-light)" />

      {/* Heading dropdown */}
      <div className="relative">
        <select
          onChange={(e) => onCommand("formatBlock", e.target.value)}
          defaultValue=""
          className="h-7 cursor-pointer appearance-none rounded border-0 bg-transparent pr-6 pl-2 text-xs font-medium text-(--text-primary) outline-none hover:bg-(--bg-surface)"
        >
          <option value="" disabled>
            Paragraph
          </option>
          <option value="p">Paragraph</option>
          <option value="h2">Heading 2</option>
          <option value="h3">Heading 3</option>
        </select>
        <ChevronDown className="pointer-events-none absolute top-1/2 right-1 size-3 -translate-y-1/2 text-(--text-muted)" />
      </div>

      <div className="mx-1 h-4 w-px bg-(--border-light)" />

      <ToolbarButton onClick={() => onCommand("bold")} label="Bold">
        <Bold className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton onClick={() => onCommand("italic")} label="Italic">
        <Italic className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand("strikeThrough")}
        label="Strikethrough"
      >
        <Strikethrough className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-(--border-light)" />

      <ToolbarButton
        onClick={() => onCommand("formatBlock", "blockquote")}
        label="Quote"
      >
        <Quote className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand("insertUnorderedList")}
        label="Bullet list"
      >
        <List className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand("insertOrderedList")}
        label="Numbered list"
      >
        <ListOrdered className="size-3.5" />
      </ToolbarButton>

      <div className="mx-1 h-4 w-px bg-(--border-light)" />

      <ToolbarButton
        onClick={() => {
          // Prompt for URL — simple but effective for admin use.
          const url = window.prompt("Enter link URL:")
          if (url) onCommand("createLink", url)
        }}
        label="Insert link"
      >
        <Link2 className="size-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => onCommand("removeFormat")}
        label="Clear formatting"
      >
        <Eraser className="size-3.5" />
      </ToolbarButton>
    </div>
  )
}
