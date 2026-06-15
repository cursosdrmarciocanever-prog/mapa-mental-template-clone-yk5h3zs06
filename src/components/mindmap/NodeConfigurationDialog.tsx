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

export const NodeConfigurationDialog = () => {
  const { state, setConfiguringNodeId, updateNodeDescription, toggleTaskMode } =
    useMindMap()
  const [description, setDescription] = useState('')
  const [isTaskMode, setIsTaskMode] = useState(false)
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
      toggleTaskMode(activeNode.id, isTaskMode)
    }
    handleClose()
  }

  // If no node has been active yet, don't render anything
  if (!activeNode) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Configure Node</DialogTitle>
          <DialogDescription>
            Customize the selected node settings.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Enter node description..."
              className="min-h-[150px] resize-none"
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
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
