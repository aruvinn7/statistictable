import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'

export type SelectOption = { value: string; label: string }

type Props = {
  label: string
  value: string
  options: SelectOption[]
  onChange: (value: string) => void
  variant?: 'field' | 'compact'
}

export function SelectMenu({ label, value, options, onChange, variant = 'field' }: Props) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const baseId = useId().replace(/:/g, '')
  const listId = `${baseId}-listbox`

  const selectedIndex = Math.max(0, options.findIndex(o => o.value === value))
  const selected = options[selectedIndex] ?? options[0]

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open || active < 0) return
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)
    node?.scrollIntoView?.({ block: 'nearest' })
  }, [open, active])

  const openMenu = (index = selectedIndex) => {
    setActive(index)
    setOpen(true)
  }

  const choose = (index: number) => {
    const option = options[index]
    if (!option) return
    onChange(option.value)
    setOpen(false)
    triggerRef.current?.focus()
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const last = options.length - 1
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openMenu(event.key === 'ArrowDown' ? selectedIndex : last)
      } else {
        setActive(current => {
          const next = event.key === 'ArrowDown' ? current + 1 : current - 1
          return next < 0 ? last : next > last ? 0 : next
        })
      }
      return
    }
    if (event.key === 'Home' || event.key === 'End') {
      if (!open) return
      event.preventDefault()
      setActive(event.key === 'Home' ? 0 : last)
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      if (!open) openMenu()
      else choose(active)
      return
    }
    if (event.key === 'Escape') {
      if (!open) return
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    if (event.key === 'Tab') setOpen(false)
  }

  return <div className={`select-menu select-menu--${variant}`} ref={rootRef}>
    <button
      type="button"
      ref={triggerRef}
      className="select-trigger"
      role="combobox"
      aria-label={label}
      aria-haspopup="listbox"
      aria-expanded={open}
      aria-controls={open ? listId : undefined}
      aria-activedescendant={open && active >= 0 ? `${baseId}-option-${active}` : undefined}
      onClick={() => open ? setOpen(false) : openMenu()}
      onKeyDown={onKeyDown}
    >
      <span>{selected?.label}</span>
      <ChevronDown className="select-chevron" size={16} aria-hidden="true" />
    </button>
    {open && <div
      ref={listRef}
      className="select-popover"
      id={listId}
      role="listbox"
      aria-label={label}
      tabIndex={-1}
    >
      {options.map((option, index) => <div
        key={option.value}
        id={`${baseId}-option-${index}`}
        data-index={index}
        data-active={index === active}
        className="select-option"
        role="option"
        aria-selected={option.value === value}
        onMouseEnter={() => setActive(index)}
        onMouseDown={event => event.preventDefault()}
        onClick={() => choose(index)}
      >
        <span>{option.label}</span>
        {option.value === value && <Check size={14} aria-hidden="true" />}
      </div>)}
    </div>}
  </div>
}
