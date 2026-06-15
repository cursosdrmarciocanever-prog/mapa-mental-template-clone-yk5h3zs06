import { useState, useRef, useEffect } from 'react'
import { useMindMap } from './context'
import { Input } from '@/components/ui/input'
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function NodeSearch() {
  const { state, focusNode, setHighlightedNodeId } = useMindMap()
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleOutsideClick)
    return () => document.removeEventListener('mousedown', handleOutsideClick)
  }, [])

  const filteredNodes = state.nodes.filter((n) => {
    const s = search.toLowerCase()
    return (
      n.label.toLowerCase().includes(s) ||
      n.description?.toLowerCase().includes(s) ||
      n.subtitle?.toLowerCase().includes(s)
    )
  })

  const handleSelect = (id: string) => {
    focusNode(id)
    setHighlightedNodeId(id)
    setOpen(false)
  }

  const handleClear = () => {
    setSearch('')
    setOpen(false)
    setHighlightedNodeId(null)
    inputRef.current?.focus()
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full max-w-[200px] md:max-w-[300px]"
    >
      <div className="relative group">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground transition-colors group-hover:text-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search nodes..."
          className="pl-9 pr-9 bg-background/50 h-9 transition-colors hover:bg-background focus:bg-background"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setOpen(e.target.value.length > 0)
          }}
          onFocus={() => {
            if (search.length > 0) setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              handleClear()
            }
          }}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-0.5 top-0.5 h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-transparent"
            onClick={handleClear}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Clear search</span>
          </Button>
        )}
      </div>

      {open && search && (
        <div className="absolute top-full right-0 sm:right-auto sm:left-0 mt-2 w-[calc(100vw-3rem)] sm:w-[350px] rounded-md border bg-popover text-popover-foreground shadow-md outline-none z-[100] animate-in fade-in-0 zoom-in-95 origin-top-right sm:origin-top-left">
          <Command shouldFilter={false}>
            <CommandList className="max-h-[350px] overflow-y-auto p-1">
              {filteredNodes.length === 0 ? (
                <div className="py-6 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
                  <Search className="h-8 w-8 text-muted-foreground/50" />
                  <p>No nodes found.</p>
                </div>
              ) : (
                <CommandGroup heading="Results">
                  {filteredNodes.map((node) => (
                    <CommandItem
                      key={node.id}
                      value={node.id}
                      onSelect={() => handleSelect(node.id)}
                      className={cn(
                        'cursor-pointer my-1',
                        state.highlightedNodeId === node.id &&
                          'bg-accent/50 text-accent-foreground',
                      )}
                    >
                      <div className="flex flex-col gap-1 overflow-hidden w-full">
                        <span className="font-medium truncate leading-none">
                          {node.label}
                        </span>
                        {node.subtitle && (
                          <span className="text-xs text-muted-foreground truncate leading-none mt-1">
                            {node.subtitle}
                          </span>
                        )}
                        {node.description && (
                          <span className="text-xs text-muted-foreground/80 line-clamp-1 mt-0.5">
                            {node.description}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </div>
      )}
    </div>
  )
}
