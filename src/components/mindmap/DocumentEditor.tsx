import { useMemo, useEffect, useRef, useState } from 'react'
import { useMindMap } from './context'
import { MindMapNode } from '@/lib/types'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { ChevronRight } from 'lucide-react'

interface DocumentEditorProps {
  nodeId: string
}

// Helper component for auto-resizing textareas to mimic Notion-like editing
const AutoTextarea = ({
  value,
  onChange,
  className,
  placeholder,
}: {
  value: string
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  className?: string
  placeholder?: string
}) => {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      className={cn('resize-none overflow-hidden', className)}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
    />
  )
}

const RecursiveNodeItem = ({ nodeId }: { nodeId: string }) => {
  const { state, updateNodeLabel, updateNodeDescription } = useMindMap()
  const node = state.nodes.find((n) => n.id === nodeId)
  const [isOpen, setIsOpen] = useState(false)

  // Find direct children for this node
  const children = useMemo(() => {
    return state.nodes
      .filter((n) => n.parentId === nodeId)
      .sort((a, b) => a.position.y - b.position.y)
  }, [state.nodes, nodeId])

  if (!node) return null

  const hasChildren = children.length > 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="w-full">
      <div className="flex items-start gap-1 py-1 group/item">
        {/* Toggle Trigger */}
        <div className="shrink-0 mt-1">
          {hasChildren ? (
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0 hover:bg-muted text-muted-foreground"
              >
                <ChevronRight
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isOpen && 'rotate-90',
                  )}
                />
                <span className="sr-only">Toggle</span>
              </Button>
            </CollapsibleTrigger>
          ) : (
            <div className="h-6 w-6 flex items-center justify-center">
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/30" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-1">
          {/* Node Title (H3 equivalent) */}
          <input
            className="w-full text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-foreground min-h-[1.75rem] py-0.5"
            value={node.label}
            onChange={(e) => updateNodeLabel(node.id, e.target.value)}
            placeholder="Untitled Section"
          />

          {/* Node Body (Description + Children) */}
          {hasChildren ? (
            <CollapsibleContent className="data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down overflow-hidden">
              <div className="flex flex-col gap-2">
                <AutoTextarea
                  className="w-full text-base leading-relaxed bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-muted-foreground resize-none font-sans"
                  value={node.description || ''}
                  onChange={(e) =>
                    updateNodeDescription(node.id, e.target.value)
                  }
                  placeholder="Add details..."
                />
                <div className="flex flex-col gap-2 pl-2 border-l border-border/50 ml-1">
                  {children.map((child) => (
                    <RecursiveNodeItem key={child.id} nodeId={child.id} />
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          ) : (
            <div className="flex flex-col gap-2">
              <AutoTextarea
                className="w-full text-base leading-relaxed bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-muted-foreground resize-none font-sans"
                value={node.description || ''}
                onChange={(e) => updateNodeDescription(node.id, e.target.value)}
                placeholder="Add details..."
              />
            </div>
          )}
        </div>
      </div>
    </Collapsible>
  )
}

export const DocumentEditor = ({ nodeId }: DocumentEditorProps) => {
  const { state, updateNodeLabel, updateNodeDescription } = useMindMap()
  const node = state.nodes.find((n) => n.id === nodeId)

  // Identify if this is a topic root (no parent) to enable full recursive view
  const isTopicRoot = node && !node.parentId

  // Direct children for standard view (non-root) OR root view entry point
  const directChildren = useMemo(() => {
    return state.nodes
      .filter((n) => n.parentId === nodeId)
      .sort((a, b) => a.position.y - b.position.y)
  }, [state.nodes, nodeId])

  if (!node) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8">
        <p>Node not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl mx-auto py-8 px-6 animate-in fade-in duration-300">
      {/* Root/Page Title (H1) */}
      <input
        className="w-full text-4xl font-bold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-foreground"
        value={node.label}
        onChange={(e) => updateNodeLabel(node.id, e.target.value)}
        placeholder="Untitled Page"
      />

      {/* Page Description */}
      <AutoTextarea
        className="w-full min-h-[50px] text-lg leading-relaxed bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-foreground/90 font-serif"
        value={node.description || ''}
        onChange={(e) => updateNodeDescription(node.id, e.target.value)}
        placeholder="Add a description..."
      />

      <Separator className="my-2" />

      {isTopicRoot ? (
        /* Topic Root View: Recursive Toggle List */
        <div className="flex flex-col gap-1 pb-20">
          {directChildren.length === 0 ? (
            <p className="text-muted-foreground italic text-sm mt-4">
              No items yet. Add nodes to the mindmap to populate this document.
            </p>
          ) : (
            directChildren.map((child) => (
              <RecursiveNodeItem key={child.id} nodeId={child.id} />
            ))
          )}
        </div>
      ) : (
        /* Standard View: Only shows immediate sub-items (Flat list) */
        <div className="flex flex-col gap-4">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Sub-items
          </h2>
          {directChildren.length === 0 ? (
            <p className="text-muted-foreground italic text-sm">
              No sub-items yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4 pl-4 border-l-2 border-border/50">
              {directChildren.map((child) => (
                <ChildItem
                  key={child.id}
                  node={child}
                  onUpdate={(val) => updateNodeLabel(child.id, val)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const ChildItem = ({
  node,
  onUpdate,
}: {
  node: MindMapNode
  onUpdate: (val: string) => void
}) => (
  <div className="flex items-start gap-2 group relative">
    <div className="mt-2.5 h-2 w-2 rounded-full bg-primary/40 shrink-0" />
    <input
      className={cn(
        'w-full text-xl font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/40 text-foreground transition-colors',
        'focus:text-primary',
      )}
      value={node.label}
      onChange={(e) => onUpdate(e.target.value)}
      placeholder="Untitled Item"
    />
  </div>
)
