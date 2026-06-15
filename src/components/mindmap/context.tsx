import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react'
import {
  MindMapNode,
  MindMapEdge,
  MindMapState,
  MindMapContextType,
  Viewport,
  Position,
} from '@/lib/types'

const MindMapContext = createContext<MindMapContextType | null>(null)

const INITIAL_STATE: MindMapState = {
  nodes: [
    {
      id: 'root',
      label: 'Start Trigger',
      subtitle: 'Workflow entry point',
      description: 'This is the starting point of your workflow.',
      icon: 'zap',
      position: {
        x: window.innerWidth / 2 - 100,
        y: window.innerHeight / 2 - 40,
      },
      width: 200,
      height: 80,
    },
  ],
  edges: [],
  viewport: { x: 0, y: 0, scale: 1 },
  editingNodeId: null,
  configuringNodeId: null,
  documentViewNodeId: null,
}

const STORAGE_KEY = 'mindmap-data-v3'

const ICONS = [
  'activity',
  'box',
  'database',
  'cloud',
  'mail',
  'file-text',
  'settings',
  'globe',
  'cpu',
]
const getRandomIcon = () => ICONS[Math.floor(Math.random() * ICONS.length)]

// Helper to create a new node object (DRY)
const createNewNode = (
  nodes: MindMapNode[],
  parentId: string | null,
): { node: MindMapNode; edge?: MindMapEdge } => {
  const parent = nodes.find((n) => n.id === parentId)
  const newNodeId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `node-${Date.now()}`

  let position = { x: 0, y: 0 }
  if (parent) {
    const siblings = nodes.filter((n) => n.parentId === parentId)
    position = {
      x: parent.position.x + (parent.width || 200) + 150, // Increased spacing for n8n style
      y: parent.position.y + siblings.length * 100 - 20,
    }
  } else {
    position = { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  }

  const newNode: MindMapNode = {
    id: newNodeId,
    label: parentId ? 'New Action' : 'New Trigger',
    subtitle: 'Configure this step',
    icon: getRandomIcon(),
    position,
    parentId: parentId || undefined,
    width: 200,
    height: 80,
    selected: true, // Auto-select
    taskModeEnabled: parent?.taskModeEnabled, // Inherit task mode from parent
  }

  const newEdge: MindMapEdge | undefined = parentId
    ? { id: `e-${parentId}-${newNodeId}`, source: parentId, target: newNodeId }
    : undefined

  return { node: newNode, edge: newEdge }
}

export const MindMapProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<MindMapState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Automatically hydrate state, but reset ephemeral UI states (editing, configuring)
        return {
          ...parsed,
          editingNodeId: null,
          configuringNodeId: null,
          documentViewNodeId: null,
        }
      }
      return INITIAL_STATE
    } catch (error) {
      console.error('Failed to load mindmap state from local storage:', error)
      return INITIAL_STATE
    }
  })

  // Real-time updates with debounce to avoid performance issues during rapid interactions like panning
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save mindmap state to local storage:', error)
      }
    }, 500) // 500ms debounce ensures we capture changes without thrashing storage

    return () => clearTimeout(timeoutId)
  }, [state])

  const setEditingNodeId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, editingNodeId: id }))
  }, [])

  const setConfiguringNodeId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, configuringNodeId: id }))
  }, [])

  const setDocumentViewNodeId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, documentViewNodeId: id }))
  }, [])

  const addNode = useCallback((parentId: string | null) => {
    setState((prev) => {
      const { node, edge } = createNewNode(prev.nodes, parentId)

      const updatedNodes = prev.nodes
        .map((n) => ({ ...n, selected: false }))
        .concat(node)

      return {
        ...prev,
        nodes: updatedNodes,
        edges: edge ? [...prev.edges, edge] : prev.edges,
        editingNodeId: node.id,
      }
    })
  }, [])

  const addSiblingNode = useCallback((nodeId: string) => {
    setState((prev) => {
      const referenceNode = prev.nodes.find((n) => n.id === nodeId)
      if (!referenceNode) return prev

      const parentId = referenceNode.parentId || null

      const { node, edge } = createNewNode(prev.nodes, parentId)

      const updatedNodes = prev.nodes
        .map((n) => ({ ...n, selected: false }))
        .concat(node)

      return {
        ...prev,
        nodes: updatedNodes,
        edges: edge ? [...prev.edges, edge] : prev.edges,
        editingNodeId: node.id,
      }
    })
  }, [])

  const updateNodeLabel = useCallback((id: string, label: string) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, label } : n)),
    }))
  }, [])

  const updateNodeDescription = useCallback(
    (id: string, description: string) => {
      setState((prev) => ({
        ...prev,
        nodes: prev.nodes.map((n) => (n.id === id ? { ...n, description } : n)),
      }))
    },
    [],
  )

  const updateNodeDimensions = useCallback(
    (id: string, width: number, height: number) => {
      setState((prev) => {
        const node = prev.nodes.find((n) => n.id === id)
        // Prevent unnecessary updates if dimensions haven't significantly changed
        if (
          node &&
          Math.abs((node.width || 0) - width) < 1 &&
          Math.abs((node.height || 0) - height) < 1
        ) {
          return prev
        }
        return {
          ...prev,
          nodes: prev.nodes.map((n) =>
            n.id === id ? { ...n, width, height } : n,
          ),
        }
      })
    },
    [],
  )

  const deleteNode = useCallback((id: string) => {
    setState((prev) => {
      if (id === 'root') return prev

      const nodesToDelete = new Set<string>([id])
      let changed = true
      // Recursively find all children to delete
      while (changed) {
        changed = false
        prev.nodes.forEach((n) => {
          if (
            n.parentId &&
            nodesToDelete.has(n.parentId) &&
            !nodesToDelete.has(n.id)
          ) {
            nodesToDelete.add(n.id)
            changed = true
          }
        })
      }

      const isDeletingEditingNode =
        prev.editingNodeId && nodesToDelete.has(prev.editingNodeId)
      const isDeletingConfiguringNode =
        prev.configuringNodeId && nodesToDelete.has(prev.configuringNodeId)
      const isDeletingDocumentNode =
        prev.documentViewNodeId && nodesToDelete.has(prev.documentViewNodeId)

      return {
        ...prev,
        nodes: prev.nodes.filter((n) => !nodesToDelete.has(n.id)),
        edges: prev.edges.filter(
          (e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target),
        ),
        editingNodeId: isDeletingEditingNode ? null : prev.editingNodeId,
        configuringNodeId: isDeletingConfiguringNode
          ? null
          : prev.configuringNodeId,
        documentViewNodeId: isDeletingDocumentNode
          ? null
          : prev.documentViewNodeId,
      }
    })
  }, [])

  const moveNode = useCallback((id: string, position: Position) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, position } : n)),
    }))
  }, [])

  const selectNode = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => ({ ...n, selected: n.id === id })),
    }))
  }, [])

  const setViewport = useCallback((viewport: Viewport) => {
    setState((prev) => ({ ...prev, viewport }))
  }, [])

  const pan = useCallback((dx: number, dy: number) => {
    setState((prev) => ({
      ...prev,
      viewport: {
        ...prev.viewport,
        x: prev.viewport.x + dx,
        y: prev.viewport.y + dy,
      },
    }))
  }, [])

  const zoom = useCallback(
    (factor: number, center?: { x: number; y: number }) => {
      setState((prev) => {
        const currentZoom = prev.viewport.scale
        const newZoom = Math.min(Math.max(currentZoom * factor, 0.1), 4)

        if (center) {
          const scaleChange = newZoom / currentZoom
          const newX = center.x - (center.x - prev.viewport.x) * scaleChange
          const newY = center.y - (center.y - prev.viewport.y) * scaleChange
          return {
            ...prev,
            viewport: { x: newX, y: newY, scale: newZoom },
          }
        }

        return {
          ...prev,
          viewport: { ...prev.viewport, scale: newZoom },
        }
      })
    },
    [],
  )

  const fitView = useCallback(() => {
    setState((prev) => ({ ...prev, viewport: { x: 0, y: 0, scale: 1 } }))
  }, [])

  const centerView = useCallback(() => {
    setState((prev) => ({ ...prev, viewport: { x: 0, y: 0, scale: 1 } }))
  }, [])

  const focusNode = useCallback((id: string) => {
    setState((prev) => {
      const node = prev.nodes.find((n) => n.id === id)
      if (!node) return prev

      const scale = prev.viewport.scale
      const centerX = window.innerWidth / 2
      const centerY = window.innerHeight / 2

      const nodeCenterX = node.position.x + (node.width || 200) / 2
      const nodeCenterY = node.position.y + (node.height || 80) / 2

      const newX = centerX - nodeCenterX * scale
      const newY = centerY - nodeCenterY * scale

      return {
        ...prev,
        viewport: { ...prev.viewport, x: newX, y: newY },
      }
    })
  }, [])

  const toggleTaskMode = useCallback((id: string, enabled: boolean) => {
    setState((prev) => {
      // Find all descendants to enable/disable task mode for the whole branch
      const nodesToUpdate = new Set<string>([id])
      let changed = true
      while (changed) {
        changed = false
        prev.nodes.forEach((n) => {
          if (
            n.parentId &&
            nodesToUpdate.has(n.parentId) &&
            !nodesToUpdate.has(n.id)
          ) {
            nodesToUpdate.add(n.id)
            changed = true
          }
        })
      }

      return {
        ...prev,
        nodes: prev.nodes.map((n) =>
          nodesToUpdate.has(n.id) ? { ...n, taskModeEnabled: enabled } : n,
        ),
      }
    })
  }, [])

  const toggleNodeChecked = useCallback((id: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === id ? { ...n, checked } : n)),
    }))
  }, [])

  return (
    <MindMapContext.Provider
      value={{
        state,
        addNode,
        addSiblingNode,
        setEditingNodeId,
        setConfiguringNodeId,
        setDocumentViewNodeId,
        updateNodeLabel,
        updateNodeDescription,
        updateNodeDimensions,
        deleteNode,
        moveNode,
        selectNode,
        setViewport,
        pan,
        zoom,
        fitView,
        centerView,
        focusNode,
        toggleTaskMode,
        toggleNodeChecked,
      }}
    >
      {children}
    </MindMapContext.Provider>
  )
}

export const useMindMap = () => {
  const context = useContext(MindMapContext)
  if (!context)
    throw new Error('useMindMap must be used within a MindMapProvider')
  return context
}
