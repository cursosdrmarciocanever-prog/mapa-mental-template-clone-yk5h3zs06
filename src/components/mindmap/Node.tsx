import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { MindMapNode } from '@/lib/types'
import { useMindMap } from './context'
import { cn } from '@/lib/utils'
import { Plus, Trash2, Settings, FileText as FileTextIcon } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'

type NodeProps = {
  node: MindMapNode
}

// Fallback legacy map
const LegacyIconMap: Record<string, string> = {
  zap: 'Zap',
  activity: 'Activity',
  box: 'Box',
  database: 'Database',
  cloud: 'Cloud',
  mail: 'Mail',
  'file-text': 'FileText',
  settings: 'Settings',
  globe: 'Globe',
  cpu: 'Cpu',
}

export const Node = ({ node }: NodeProps) => {
  const {
    state,
    updateNodeLabel,
    addNode,
    deleteNode,
    updateNodeDimensions,
    setEditingNodeId,
    setConfiguringNodeId,
    setDocumentViewNodeId,
    toggleNodeChecked,
  } = useMindMap()
  const [label, setLabel] = useState(node.label)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const nodeRef = useRef<HTMLDivElement>(null)

  const isEditing = state.editingNodeId === node.id
  const isRoot = node.id === 'root'
  const isTaskMode = node.taskModeEnabled
  const isChecked = node.checked && isTaskMode
  const isHighlighted = state.highlightedNodeId === node.id

  const iconName = node.icon ? LegacyIconMap[node.icon] || node.icon : 'Zap'
  const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Zap

  // Sync state label when node prop changes (e.g. undo/redo or external update)
  useEffect(() => {
    setLabel(node.label)
  }, [node.label])

  // Resize Observer to update node dimensions in context
  useLayoutEffect(() => {
    if (!nodeRef.current) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        // Use offsetWidth/Height to get the full border-box size including borders
        const element = entry.target as HTMLElement
        const width = element.offsetWidth
        const height = element.offsetHeight

        updateNodeDimensions(node.id, width, height)
      }
    })

    observer.observe(nodeRef.current)
    return () => observer.disconnect()
  }, [node.id, updateNodeDimensions])

  // Focus textarea when editing starts
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus()
      // Set cursor to end
      const len = textareaRef.current.value.length
      textareaRef.current.setSelectionRange(len, len)
    }
  }, [isEditing])

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingNodeId(node.id)
  }

  const handleBlur = () => {
    setEditingNodeId(null)
    if (label.trim()) {
      updateNodeLabel(node.id, label)
    } else {
      setLabel(node.label)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter to finish, Shift+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleBlur()
    }
  }

  const handleAddChild = (e: React.MouseEvent) => {
    e.stopPropagation()
    addNode(node.id)
  }

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    deleteNode(node.id)
  }

  const handleConfigure = (e: React.MouseEvent) => {
    e.stopPropagation()
    setConfiguringNodeId(node.id)
  }

  const handleOpenDocument = (e: React.MouseEvent) => {
    e.stopPropagation()
    setDocumentViewNodeId(node.id)
  }

  const handleCheckedChange = (checked: boolean) => {
    toggleNodeChecked(node.id, checked)
  }

  const stopPropagation = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={nodeRef}
      className={cn(
        'absolute flex flex-col rounded-xl shadow-sm border group animate-in zoom-in-50',
        'transition-all duration-200 ease-out',
        isChecked
          ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800'
          : 'bg-card hover:border-ring/50 hover:shadow-md',
        isHighlighted
          ? 'ring-4 ring-yellow-400/80 dark:ring-yellow-500/80 border-yellow-500 dark:border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)] z-40'
          : node.selected
            ? 'ring-2 ring-primary border-primary z-30 shadow-md'
            : 'border-border z-10',
        'cursor-grab active:cursor-grabbing',
      )}
      style={{
        left: node.position.x,
        top: node.position.y,
        borderColor: node.color && !node.selected ? node.color : undefined,
        backgroundColor:
          node.color && !isChecked ? `${node.color}1A` : undefined,
      }}
      onDoubleClick={handleDoubleClick}
      data-node-id={node.id}
    >
      <div className="flex flex-row items-stretch p-3 gap-3 min-w-[200px] max-w-lg">
        {/* Icon Area */}
        <div
          className={cn(
            'shrink-0 flex items-center justify-center w-10 h-10 rounded-lg',
            !node.color &&
              (isRoot
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'),
          )}
          style={{
            backgroundColor: node.color ? node.color : undefined,
            color: node.color ? '#ffffff' : undefined,
          }}
        >
          <IconComponent className="w-5 h-5" />
        </div>

        {/* Content Area */}
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          {/* Title - Editable */}
          <div className="relative">
            {isEditing ? (
              <div className="grid place-items-start w-full">
                {/* 
                   This invisible div mirrors the content to force the container to grow.
                   It must match the textarea styling EXACTLY.
                 */}
                <div
                  className="invisible whitespace-pre-wrap break-words text-sm font-bold text-card-foreground px-1 py-0.5 border border-transparent w-full"
                  aria-hidden="true"
                >
                  {label + ' '}
                </div>

                <textarea
                  ref={textareaRef}
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  onBlur={handleBlur}
                  onKeyDown={handleKeyDown}
                  onMouseDown={stopPropagation}
                  className="absolute inset-0 w-full h-full resize-none overflow-hidden bg-transparent outline-none text-sm font-bold text-card-foreground px-1 py-0.5"
                  spellCheck={false}
                />
              </div>
            ) : (
              <div
                className={cn(
                  'text-sm font-bold px-1 py-0.5 whitespace-pre-wrap break-words',
                  isChecked
                    ? 'line-through text-muted-foreground'
                    : 'text-card-foreground',
                )}
              >
                {node.label}
              </div>
            )}
          </div>

          {/* Subtitle */}
          <div className="text-xs text-muted-foreground px-1 mt-0.5 truncate select-none">
            {node.subtitle || 'Step Description'}
          </div>

          {/* Description Area */}
          {node.description && (
            <div
              className={cn(
                'text-xs px-1 mt-2 pt-2 border-t border-border whitespace-pre-wrap break-words leading-relaxed',
                isChecked
                  ? 'line-through text-muted-foreground/60'
                  : 'text-muted-foreground/90',
              )}
            >
              {node.description}
            </div>
          )}
        </div>

        {/* Action Menu / Configure Button */}
        <div className="shrink-0 flex flex-col gap-1 items-start opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleConfigure}
            onMouseDown={stopPropagation}
            title="Configure this step"
          >
            <Settings className="w-4 h-4" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={handleOpenDocument}
            onMouseDown={stopPropagation}
            title="Open Document View"
          >
            <FileTextIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Connection Points (Hover Buttons) */}
      <div
        className={cn(
          'absolute -right-3 top-1/2 -translate-y-1/2 flex flex-col gap-1 transition-all duration-200',
          'opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0',
        )}
      >
        <Button
          size="icon"
          className="h-6 w-6 rounded-full shadow-md border border-background"
          onClick={handleAddChild}
          onMouseDown={stopPropagation}
          title="Add Next Step"
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Task Mode Checkbox (Top-Right) */}
      {isTaskMode && (
        <div
          className={cn(
            'absolute -top-3 -right-2 z-20 flex items-center justify-center',
            'h-6 w-6 rounded-full shadow-md border border-background bg-background',
            'animate-in fade-in zoom-in-50 duration-200',
          )}
          onMouseDown={stopPropagation}
          onDoubleClick={stopPropagation}
        >
          <Checkbox
            checked={!!node.checked}
            onCheckedChange={handleCheckedChange}
            className="h-full w-full rounded-full flex items-center justify-center data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />
        </div>
      )}

      {/* Delete Button (Bottom-Right) */}
      {!isRoot && (
        <div
          className={cn(
            'absolute -bottom-3 -right-2 transition-all duration-200 z-20',
            'opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0',
          )}
        >
          <Button
            size="icon"
            variant="destructive"
            className="h-6 w-6 rounded-full shadow-md border border-background"
            onClick={handleDelete}
            onMouseDown={stopPropagation}
            title="Remove Step"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  )
}
