import { useEffect, useState, useRef } from 'react'
import { useMindMap } from './context'
import { MindMapNode } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

// Extended list of icons for selection
const AVAILABLE_ICONS = [
  'Zap',
  'Activity',
  'Box',
  'Database',
  'Cloud',
  'Mail',
  'FileText',
  'Settings',
  'Globe',
  'Cpu',
  'Bell',
  'Calendar',
  'Camera',
  'Check',
  'Heart',
  'Home',
  'Image',
  'Map',
  'MessageCircle',
  'Music',
  'Phone',
  'Play',
  'Search',
  'Star',
  'Sun',
  'Moon',
  'Truck',
  'User',
  'Video',
  'Wifi',
]

const PREDEFINED_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#f59e0b', // amber
  '#84cc16', // lime
  '#22c55e', // green
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#3b82f6', // blue
  '#6366f1', // indigo
  '#8b5cf6', // violet
  '#d946ef', // fuchsia
  '#f43f5e', // rose
  '#64748b', // slate
]

export const NodeConfigurationDialog = () => {
  const {
    state,
    setConfiguringNodeId,
    updateNodeDescription,
    updateNodeAppearance,
    toggleTaskMode,
  } = useMindMap()
  const [description, setDescription] = useState('')
  const [isTaskMode, setIsTaskMode] = useState(false)
  const [selectedIcon, setSelectedIcon] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')

  // activeNode holds the node data to display even while closing for smooth animation
  const [activeNode, setActiveNode] = useState<MindMapNode | null>(null)

  const configuringNodeId = state.configuringNodeId
  const prevConfiguringNodeId = useRef<string | null>(null)

  // Determine if dialog should be open
  const isOpen = !!configuringNodeId

  useEffect(() => {
    // Check if we are opening a new node or switching to a different one
    // This prevents overwriting local state when other parts of the mindmap update (e.g. resize)
    const isOpening =
      configuringNodeId && configuringNodeId !== prevConfiguringNodeId.current

    if (isOpening) {
      const node = state.nodes.find((n) => n.id === configuringNodeId)
      if (node) {
        setActiveNode(node)
        setDescription(node.description || '')
        setIsTaskMode(node.taskModeEnabled || false)

        // Legacy mapper
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

        setSelectedIcon(
          node.icon ? LegacyIconMap[node.icon] || node.icon : 'Zap',
        )
        setSelectedColor(node.color || '')
      }
    }

    prevConfiguringNodeId.current = configuringNodeId
  }, [configuringNodeId, state.nodes])

  const handleClose = () => {
    setConfiguringNodeId(null)
    // We don't clear activeNode here to allow the dialog to animate out with content
  }

  const handleSave = () => {
    if (activeNode) {
      updateNodeDescription(activeNode.id, description)
      updateNodeAppearance(activeNode.id, selectedIcon, selectedColor)
      toggleTaskMode(activeNode.id, isTaskMode)
    }
    handleClose()
  }

  // If no node has been active yet, don't render anything
  if (!activeNode) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[525px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>Configure Node</DialogTitle>
          <DialogDescription>
            Customize the selected node settings.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="grid gap-6 py-4 pr-4">
            <div className="grid gap-2">
              <Label>Node Color</Label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedColor('')}
                  className={cn(
                    'w-8 h-8 rounded-full border-2 flex items-center justify-center bg-secondary text-secondary-foreground',
                    selectedColor === ''
                      ? 'border-foreground'
                      : 'border-transparent hover:border-muted-foreground',
                  )}
                  title="Default"
                >
                  <LucideIcons.Ban className="w-4 h-4" />
                </button>
                {PREDEFINED_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      'w-8 h-8 rounded-full border-2',
                      selectedColor === color
                        ? 'border-foreground shadow-sm'
                        : 'border-transparent hover:border-muted-foreground hover:scale-110 transition-transform',
                    )}
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Icon</Label>
              <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                {AVAILABLE_ICONS.map((iconName) => {
                  const IconComp = (LucideIcons as any)[
                    iconName
                  ] as React.ComponentType<{ className?: string }>
                  if (!IconComp) return null

                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setSelectedIcon(iconName)}
                      className={cn(
                        'p-2 rounded-md border flex items-center justify-center transition-colors',
                        selectedIcon === iconName
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background border-border hover:bg-muted',
                      )}
                      title={iconName}
                    >
                      <IconComp className="w-5 h-5" />
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Enter node description..."
                className="min-h-[100px] resize-none"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base" htmlFor="task-mode">
                  Modo Task
                </Label>
                <div className="text-sm text-muted-foreground">
                  Enable checklist mode for this branch.
                </div>
              </div>
              <Switch
                id="task-mode"
                checked={isTaskMode}
                onCheckedChange={setIsTaskMode}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-6 pt-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
