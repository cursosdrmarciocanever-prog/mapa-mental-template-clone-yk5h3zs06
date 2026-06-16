import { useRef, useState, useCallback, useEffect, useMemo } from 'react'
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

  const rAF = useRef<number>(undefined)

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

  const visibleNodes = useMemo(() => {
    if (!state?.nodes || !Array.isArray(state.nodes)) return []
    const nodesById = new Map(state.nodes.filter(Boolean).map((n) => [n.id, n]))

    const isVisible = (id: string): boolean => {
      const node = nodesById.get(id)
      if (!node) return false
      if (!node.parentId) return true
      const parent = nodesById.get(node.parentId)
      if (!parent) return true
      if (parent.collapsed) return false
      return isVisible(node.parentId)
    }

    return state.nodes.filter((n) => n && isVisible(n.id))
  }, [state?.nodes])

  const visibleEdges = useMemo(() => {
    if (!state?.edges || !Array.isArray(state.edges)) return []
    const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
    return state.edges.filter(
      (e) => e && visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target),
    )
  }, [state?.edges, visibleNodes])

  useEffect(() => {
    return () => {
      if (rAF.current) cancelAnimationFrame(rAF.current)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!state || state.editingNodeId) return

      const selectedNode = Array.isArray(state.nodes)
        ? state.nodes.find((n) => n && n.selected)
        : null
      if (!selectedNode) return

      if (e.key === 'Tab') {
        e.preventDefault()
        if (typeof addSiblingNode === 'function') {
          addSiblingNode(selectedNode.id)
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault()
        if (typeof addNode === 'function') {
          addNode(selectedNode.id)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [state?.nodes, state?.editingNodeId, addSiblingNode, addNode])

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    if (!state || typeof zoom !== 'function') return
    const factor = e.deltaY > 0 ? 0.95 : 1.05
    const rect = containerRef.current?.getBoundingClientRect()
    if (rect) {
      zoom(factor, { x: e.clientX - rect.left, y: e.clientY - rect.top })
    } else {
      zoom(factor)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return

    const target = e.target as HTMLElement
    const nodeElement = target.closest('[data-node-id]') as HTMLElement

    setIsDragging(true)

    if (nodeElement && state && Array.isArray(state.nodes)) {
      const nodeId = nodeElement.dataset.nodeId
      if (nodeId) {
        const node = state.nodes.find((n) => n && n.id === nodeId)
        if (node && node.position) {
          dragRef.current = {
            type: 'node',
            nodeId,
            startX: e.clientX,
            startY: e.clientY,
            initialNodePos: { ...node.position },
            lastX: e.clientX,
            lastY: e.clientY,
          }

          nodeElement.style.transition = 'none'

          if (typeof selectNode === 'function') {
            selectNode(nodeId)
          }
          return
        }
      }
    }

    dragRef.current = {
      type: 'pan',
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
    }
    if (typeof selectNode === 'function') {
      selectNode(null)
    }
  }

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!dragRef.current || !state) return

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

          const nodeEl = containerRef.current?.querySelector(
            `[data-node-id="${nodeId}"]`,
          ) as HTMLElement
          if (nodeEl) {
            nodeEl.style.left = `${newX}px`
            nodeEl.style.top = `${newY}px`
          }

          const connectedEdges = Array.isArray(state.edges)
            ? state.edges.filter(
                (edge) =>
                  edge && (edge.source === nodeId || edge.target === nodeId),
              )
            : []

          connectedEdges.forEach((edge) => {
            const isSource = edge.source === nodeId
            const otherNodeId = isSource ? edge.target : edge.source
            const otherNode = Array.isArray(state.nodes)
              ? state.nodes.find((n) => n && n.id === otherNodeId)
              : null

            if (otherNode) {
              const currentNode = Array.isArray(state.nodes)
                ? state.nodes.find((n) => n && n.id === nodeId)
                : null
              if (!currentNode) return

              const draggedNodeStub = {
                ...currentNode,
                position: { x: newX, y: newY },
              }

              const sourceNode = isSource ? draggedNodeStub : otherNode
              const targetNode = isSource ? otherNode : draggedNodeStub

              if (typeof getEdgePath === 'function') {
                const newPath = getEdgePath(sourceNode, targetNode)

                const edgeGroup = containerRef.current?.querySelector(
                  `g[data-edge-id="${edge.id}"]`,
                )
                if (edgeGroup) {
                  const paths = edgeGroup.querySelectorAll('path')
                  paths.forEach((p) => p.setAttribute('d', newPath))
                }
              }
            }
          })
        } else {
          const dx = clientX - dragRef.current.lastX
          const dy = clientY - dragRef.current.lastY
          dragRef.current.lastX = clientX
          dragRef.current.lastY = clientY

          if (typeof pan === 'function') {
            pan(dx, dy)
          }
        }
      })
    },
    [state?.edges, state?.nodes, state?.viewport?.scale, pan],
  )

  const handleMouseUp = (e: React.MouseEvent) => {
    if (rAF.current) {
      cancelAnimationFrame(rAF.current)
      rAF.current = undefined
    }

    if (dragRef.current?.type === 'node' && state) {
      const { startX, startY, initialNodePos, nodeId } = dragRef.current
      if (initialNodePos && nodeId) {
        const scale = state.viewport?.scale || 1
        const dx = (e.clientX - startX) / scale
        const dy = (e.clientY - startY) / scale

        const nodeEl = containerRef.current?.querySelector(
          `[data-node-id="${nodeId}"]`,
        ) as HTMLElement
        if (nodeEl) {
          nodeEl.style.transition = ''
        }

        if (typeof moveNode === 'function') {
          moveNode(nodeId, {
            x: initialNodePos.x + dx,
            y: initialNodePos.y + dy,
          })
        }
      }
    }

    setIsDragging(false)
    dragRef.current = null
  }

  if (!state) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-background">
        <p className="text-muted-foreground animate-pulse">
          Carregando mapa mental...
        </p>
      </div>
    )
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
          {visibleEdges.map((edge) => {
            const sourceNode = visibleNodes.find((n) => n.id === edge.source)
            const targetNode = visibleNodes.find((n) => n.id === edge.target)
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

        {visibleNodes.map((node) => {
          return <Node key={node.id} node={node} />
        })}
      </div>

      <MindMapControls
        showMiniMap={showMiniMap}
        toggleMiniMap={() => setShowMiniMap(!showMiniMap)}
      />
      {showMiniMap && <MiniMap />}

      <NodeConfigurationDialog />
      <DocumentViewSheet />

      {(!Array.isArray(state.nodes) || state.nodes.length === 0) && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
          <div className="bg-card p-8 rounded-xl shadow-lg border border-border text-center pointer-events-auto max-w-sm">
            <h3 className="text-xl font-bold mb-2 text-card-foreground">
              Empty Workflow
            </h3>
            <p className="text-muted-foreground mb-6">
              Start by creating your first trigger node.
            </p>
            <Button
              onClick={() => typeof addNode === 'function' && addNode(null)}
            >
              Add Trigger
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
