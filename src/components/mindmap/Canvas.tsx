import { useRef, useState, useCallback, useEffect } from 'react'
import { useMindMap } from './context'
import { Node } from './Node'
import { Edge } from './Edge'
import { MindMapControls } from './Controls'
import { MiniMap } from './MiniMap'
import { NodeConfigurationDialog } from './NodeConfigurationDialog'
import { DocumentViewSheet } from './DocumentViewSheet'
import { cn, getEdgePath } from '@/lib/utils'
import { Button } from '@/components/ui/button'

export const MindMapCanvas = () => {
  const { state, pan, zoom, moveNode, selectNode, addNode, addSiblingNode } =
    useMindMap()
  const containerRef = useRef<HTMLDivElement>(null)

  // Ref for Animation Frame to throttle mouse move events
  const rAF = useRef<number>(undefined)

  // Ref for handling drag logic without re-renders
  const dragRef = useRef<{
    type: 'node' | 'pan'
    nodeId?: string
    startX: number
    startY: number
    initialNodePos?: { x: number; y: number }
    lastX: number
    lastY: number
  } | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [showMiniMap, setShowMiniMap] = useState(true)

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rAF.current) cancelAnimationFrame(rAF.current)
    }
  }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // If editing text, do not trigger creation shortcuts (except specifically handled in Node)
      if (state.editingNodeId) return

      const selectedNode = (state.nodes || []).find((n) => n.selected)
      if (!selectedNode) return

      // Sibling Creation
      if (e.key === 'Tab') {
        e.preventDefault()
        addSiblingNode(selectedNode.id)
      }

      // Child Creation
      if (e.key === 'Enter') {
        e.preventDefault()
        addNode(selectedNode.id) // addNode adds child to the ID passed
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state.nodes, state.editingNodeId, addSiblingNode, addNode])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    // More natural zoom feel
    const factor = e.deltaY > 0 ? 0.95 : 1.05
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      zoom(factor, { x: e.clientX - rect.left, y: e.clientY - rect.top })
    } else {
      zoom(factor)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only handle left click
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    const nodeElement = target.closest('[data-node-id]') as HTMLElement

    setIsDragging(true)

    if (nodeElement) {
      const nodeId = nodeElement.dataset.nodeId
      if (nodeId) {
        const node = (state.nodes || []).find((n) => n.id === nodeId)
        if (node) {
          dragRef.current = {
            type: 'node',
            nodeId,
            startX: e.clientX,
            startY: e.clientY,
            initialNodePos: { ...node.position },
            lastX: e.clientX,
            lastY: e.clientY,
          }

          // Disable transition on the node during drag for instant response
          nodeElement.style.transition = 'none'

          selectNode(nodeId)
          return
        }
      }
    }

    // Clicked on empty canvas (Pan mode)
    dragRef.current = {
      type: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
    }
    selectNode(null)
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current) return

      // Extract primitive values to use in the rAF closure
      const clientX = e.clientX
      const clientY = e.clientY

      if (rAF.current) {
        cancelAnimationFrame(rAF.current)
      }

      rAF.current = requestAnimationFrame(() => {
        if (!dragRef.current) return

        if (dragRef.current.type === 'node') {
          const { startX, startY, initialNodePos, nodeId } = dragRef.current
          if (!initialNodePos || !nodeId) return

          const scale = state.viewport?.scale || 1
          const dx = (clientX - startX) / scale
          const dy = (clientY - startY) / scale

          const newX = initialNodePos.x + dx
          const newY = initialNodePos.y + dy

          // 1. Direct DOM update for Node Position
          const nodeEl = containerRef.current?.querySelector(
            `[data-node-id="${nodeId}"]`,
          ) as HTMLElement
          if (nodeEl) {
            nodeEl.style.left = `${newX}px`
            nodeEl.style.top = `${newY}px`
          }

          // 2. Direct DOM update for Connected Edges
          const connectedEdges = (state.edges || []).filter(
            (edge) => edge.source === nodeId || edge.target === nodeId,
          )

          connectedEdges.forEach((edge) => {
            const isSource = edge.source === nodeId
            const otherNodeId = isSource ? edge.target : edge.source
            const otherNode = (state.nodes || []).find(
              (n) => n.id === otherNodeId,
            )

            if (otherNode) {
              // Create a temporary node object with the new position for calculation
              const currentNode = (state.nodes || []).find(
                (n) => n.id === nodeId,
              )
              if (!currentNode) return

              const draggedNodeStub = {
                ...currentNode,
                position: { x: newX, y: newY },
              }

              const sourceNode = isSource ? draggedNodeStub : otherNode
              const targetNode = isSource ? otherNode : draggedNodeStub

              const newPath = getEdgePath(sourceNode, targetNode)

              // Update all paths within the edge group (both background and foreground)
              const edgeGroup = containerRef.current?.querySelector(
                `g[data-edge-id="${edge.id}"]`,
              )
              if (edgeGroup) {
                const paths = edgeGroup.querySelectorAll('path')
                paths.forEach((p) => p.setAttribute('d', newPath))
              }
            }
          })
        } else {
          // Pan Logic
          const dx = clientX - dragRef.current.lastX
          const dy = clientY - dragRef.current.lastY
          dragRef.current.lastX = clientX
          dragRef.current.lastY = clientY

          pan(dx, dy)
        }
      })
    },
    [state.edges, state.nodes, state.viewport.scale, pan],
  )

  const handleMouseUp = (e: React.MouseEvent) => {
    if (rAF.current) {
      cancelAnimationFrame(rAF.current)
      rAF.current = undefined
    }

    if (dragRef.current?.type === 'node') {
      const { startX, startY, initialNodePos, nodeId } = dragRef.current
      if (initialNodePos && nodeId) {
        const scale = state.viewport?.scale || 1
        const dx = (e.clientX - startX) / scale
        const dy = (e.clientY - startY) / scale

        // Restore transition style
        const nodeEl = containerRef.current?.querySelector(
          `[data-node-id="${nodeId}"]`,
        ) as HTMLElement
        if (nodeEl) {
          nodeEl.style.transition = ''
        }

        // Commit final position to state
        moveNode(nodeId, {
          x: initialNodePos.x + dx,
          y: initialNodePos.y + dy,
        })
      }
    }

    setIsDragging(false)
    dragRef.current = null
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative w-full h-full overflow-hidden bg-background bg-dot-pattern select-none',
        isDragging ? 'cursor-grabbing' : 'cursor-grab',
        'transition-colors duration-200',
      )}
      style={{
        backgroundPosition: `${state.viewport?.x || 0}px ${state.viewport?.y || 0}px`,
        backgroundSize: `${20 * (state.viewport?.scale || 1)}px ${20 * (state.viewport?.scale || 1)}px`,
      }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div
        className="absolute origin-top-left w-full h-full transition-transform duration-75 ease-out will-change-transform"
        style={{
          transform: `translate(${state.viewport?.x || 0}px, ${state.viewport?.y || 0}px) scale(${state.viewport?.scale || 1})`,
        }}
      >
        <svg
          className="absolute top-0 left-0 overflow-visible pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          {(state.edges || []).map((edge) => {
            const sourceNode = (state.nodes || []).find(
              (n) => n.id === edge.source,
            )
            const targetNode = (state.nodes || []).find(
              (n) => n.id === edge.target,
            )
            if (!sourceNode || !targetNode) return null
            return (
              <Edge
                key={edge.id}
                edge={edge}
                sourceNode={sourceNode}
                targetNode={targetNode}
              />
            )
          })}
        </svg>

        {(state.nodes || []).map((node) => (
          <Node key={node.id} node={node} />
        ))}
      </div>

      <MindMapControls
        showMiniMap={showMiniMap}
        toggleMiniMap={() => setShowMiniMap(!showMiniMap)}
      />
      {showMiniMap && <MiniMap />}

      <NodeConfigurationDialog />
      <DocumentViewSheet />

      {(!state.nodes || state.nodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border text-center pointer-events-auto max-w-sm">
            <h3 className="text-xl font-bold mb-2 text-card-foreground">
              Empty Workflow
            </h3>
            <p className="text-muted-foreground mb-6">
              Start by creating your first trigger node.
            </p>
            <Button onClick={() => addNode(null)}>Add Trigger</Button>
          </div>
        </div>
      )}
    </div>
  )
}
