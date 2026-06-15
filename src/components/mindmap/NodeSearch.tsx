import { useState, useEffect, useRef } from 'react'
import { useMindMap } from './context'
import { Input } from '@/components/ui/input'
import { Search, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NodeSearch() {
  const { state, focusNode, setHighlightedNodeId } = useMindMap()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const nodes = state.nodes || []

  const results =
    query.trim() === ''
      ? []
      : nodes.filter(
          (n) =>
            n.label.toLowerCase().includes(query.toLowerCase()) ||
            (n.description &&
              n.description.toLowerCase().includes(query.toLowerCase())) ||
            (n.subtitle &&
              n.subtitle.toLowerCase().includes(query.toLowerCase())),
        )

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (nodeId: string) => {
    focusNode(nodeId)
    setHighlightedNodeId(nodeId)
    setIsOpen(false)
    setQuery('')
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search nodes..."
          className="pl-9 pr-8"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1 h-7 w-7 text-muted-foreground hover:text-foreground"
            onClick={() => {
              setQuery('')
              setIsOpen(false)
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && query.trim() !== '' && (
        <div className="absolute top-full mt-1 w-full bg-popover border border-border rounded-md shadow-md z-50 max-h-60 overflow-y-auto">
          {results.length > 0 ? (
            <ul className="py-1">
              {results.map((node) => (
                <li key={node.id}>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-muted text-sm flex flex-col items-start gap-1 transition-colors"
                    onClick={() => handleSelect(node.id)}
                  >
                    <span className="font-medium text-foreground">
                      {node.label}
                    </span>
                    {node.subtitle && (
                      <span className="text-xs text-muted-foreground truncate w-full">
                        {node.subtitle}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
