import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
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

const getInitialState = (): MindMapState => ({
  nodes: [
    {
      id: 'root',
      label: 'Start Trigger',
      subtitle: 'Workflow entry point',
      description: 'This is the starting point of your workflow.',
      icon: 'zap',
      position: {
        x: typeof window !== 'undefined' ? window.innerWidth / 2 - 100 : 400,
        y: typeof window !== 'undefined' ? window.innerHeight / 2 - 40 : 300,
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
  highlightedNodeId: null,
  edgeStyle: 'curved',
})

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

const createNewNode = (
  nodes: MindMapNode[],
  parentId: string | null,
): { node: MindMapNode; edge?: MindMapEdge } => {
  const safeNodes = Array.isArray(nodes) ? nodes : []
  const parent = safeNodes.find((n) => n.id === parentId)
  const newNodeId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `node-${Date.now()}`

  let position = { x: 0, y: 0 }
  if (parent) {
    const siblings = safeNodes.filter((n) => n.parentId === parentId)
    position = {
      x: (parent.position?.x || 0) + (parent.width || 200) + 150,
      y: (parent.position?.y || 0) + siblings.length * 100 - 20,
    }
  } else {
    position = {
      x: typeof window !== 'undefined' ? window.innerWidth / 2 : 500,
      y: typeof window !== 'undefined' ? window.innerHeight / 2 : 500,
    }
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
    selected: true,
    taskModeEnabled: parent?.taskModeEnabled,
  }

  const newEdge: MindMapEdge | undefined = parentId
    ? { id: `e-${parentId}-${newNodeId}`, source: parentId, target: newNodeId }
    : undefined

  return { node: newNode, edge: newEdge }
}

const parseStateFromStorage = (storageKey: string): MindMapState => {
  try {
    const stored = localStorage.getItem(storageKey)
    if (!stored) return getInitialState()

    const parsedData = JSON.parse(stored)
    const parsed =
      typeof parsedData === 'object' && parsedData !== null ? parsedData : {}
    const initial = getInitialState()

    let safeNodes = initial.nodes
    if (Array.isArray(parsed?.nodes)) {
      const filtered = parsed.nodes.filter(
        (n: any) =>
          n &&
          typeof n === 'object' &&
          typeof n.id === 'string' &&
          n.position &&
          typeof n.position.x === 'number' &&
          typeof n.position.y === 'number',
      )
      if (filtered.length > 0) safeNodes = filtered
    }

    let safeEdges = initial.edges
    if (Array.isArray(parsed?.edges)) {
      safeEdges = parsed.edges.filter(
        (e: any) =>
          e &&
          typeof e === 'object' &&
          typeof e.id === 'string' &&
          typeof e.source === 'string' &&
          typeof e.target === 'string',
      )
    }

    return {
      ...initial,
      ...parsed,
      nodes: safeNodes,
      edges: safeEdges,
      viewport:
        parsed?.viewport &&
        typeof parsed.viewport.x === 'number' &&
        typeof parsed.viewport.y === 'number' &&
        typeof parsed.viewport.scale === 'number'
          ? parsed.viewport
          : initial.viewport,
      edgeStyle:
        parsed?.edgeStyle === 'straight' || parsed?.edgeStyle === 'curved'
          ? parsed.edgeStyle
          : initial.edgeStyle,
      editingNodeId: null,
      configuringNodeId: null,
      documentViewNodeId: null,
      highlightedNodeId: null,
    }
  } catch (error) {
    console.warn(
      `Failed to parse state for ${storageKey}, using default state.`,
      error,
    )
    return getInitialState()
  }
}

export const MindMapProvider = ({
  children,
  projectId = 'default',
}: {
  children: ReactNode
  projectId?: string
}) => {
  const storageKey = `mindmap-data-v3-${projectId}`

  const [state, setState] = useState<MindMapState>(() =>
    parseStateFromStorage(storageKey),
  )

  // Handle cross-project switching safely
  useEffect(() => {
    setState(parseStateFromStorage(storageKey))
  }, [storageKey])

  // Persist state changes without blocking UI
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch (error) {
        console.error('Failed to save mindmap state to local storage:', error)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [state, storageKey])

  const setEditingNodeId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, editingNodeId: id }))
  }, [])

  const setConfiguringNodeId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, configuringNodeId: id }))
  }, [])

  const setDocumentViewNodeId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, documentViewNodeId: id }))
  }, [])

  const highlightTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const setHighlightedNodeId = useCallback((id: string | null) => {
    setState((prev) => ({ ...prev, highlightedNodeId: id }))

    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current)

    if (id) {
      highlightTimeoutRef.current = setTimeout(() => {
        setState((prev) => ({ ...prev, highlightedNodeId: null }))
      }, 3000)
    }
  }, [])

  const setEdgeStyle = useCallback((style: 'curved' | 'straight') => {
    setState((prev) => ({ ...prev, edgeStyle: style }))
  }, [])

  const addNode = useCallback((parentId: string | null) => {
    setState((prev) => {
      const { node, edge } = createNewNode(prev.nodes, parentId)
      const updatedNodes = (prev.nodes || [])
        .map((n) => ({ ...n, selected: false }))
        .concat(node)

      return {
        ...prev,
        nodes: updatedNodes,
        edges: edge ? [...(prev.edges || []), edge] : prev.edges || [],
        editingNodeId: node.id,
      }
    })
  }, [])

  const addSiblingNode = useCallback((nodeId: string) => {
    setState((prev) => {
      const referenceNode = (prev.nodes || []).find((n) => n.id === nodeId)
      if (!referenceNode) return prev

      const parentId = referenceNode.parentId || null
      const { node, edge } = createNewNode(prev.nodes, parentId)

      const updatedNodes = (prev.nodes || [])
        .map((n) => ({ ...n, selected: false }))
        .concat(node)

      return {
        ...prev,
        nodes: updatedNodes,
        edges: edge ? [...(prev.edges || []), edge] : prev.edges || [],
        editingNodeId: node.id,
      }
    })
  }, [])

  const updateNodeLabel = useCallback((id: string, label: string) => {
    setState((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) => (n.id === id ? { ...n, label } : n)),
    }))
  }, [])

  const updateNodeDescription = useCallback(
    (id: string, description: string) => {
      setState((prev) => ({
        ...prev,
        nodes: (prev.nodes || []).map((n) =>
          n.id === id ? { ...n, description } : n,
        ),
      }))
    },
    [],
  )

  const updateNodeAppearance = useCallback(
    (id: string, icon?: string, color?: string) => {
      setState((prev) => ({
        ...prev,
        nodes: (prev.nodes || []).map((n) =>
          n.id === id ? { ...n, icon, color } : n,
        ),
      }))
    },
    [],
  )

  const autoLayout = useCallback(() => {
    setState((prev) => {
      const dx = 350
      const dy = 120

      const safeNodes = prev.nodes || []
      const root = safeNodes.find((n) => !n.parentId)
      if (!root) return prev

      const childrenMap = new Map<string, string[]>()
      safeNodes.forEach((n) => {
        if (n.parentId) {
          if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, [])
          childrenMap.get(n.parentId)!.push(n.id)
        }
      })

      const heights = new Map<string, number>()
      const calculateHeight = (id: string) => {
        const children = childrenMap.get(id) || []
        if (children.length === 0) {
          heights.set(id, dy)
          return dy
        }
        const h = children.reduce(
          (sum, childId) => sum + calculateHeight(childId),
          0,
        )
        heights.set(id, h)
        return h
      }
      calculateHeight(root.id)

      const newNodes = [...safeNodes]
      const assignPositions = (id: string, x: number, startY: number) => {
        const nodeIndex = newNodes.findIndex((n) => n.id === id)
        if (nodeIndex !== -1) {
          newNodes[nodeIndex] = {
            ...newNodes[nodeIndex],
            position: { x, y: startY + (heights.get(id) || dy) / 2 - dy / 2 },
          }
        }

        let currentY = startY
        const children = childrenMap.get(id) || []
        children.forEach((childId) => {
          const childH = heights.get(childId) || dy
          assignPositions(childId, x + dx, currentY)
          currentY += childH
        })
      }

      assignPositions(
        root.id,
        root.position?.x || 0,
        (root.position?.y || 0) - (heights.get(root.id) || dy) / 2,
      )

      return { ...prev, nodes: newNodes }
    })
  }, [])

  const updateNodeDimensions = useCallback(
    (id: string, width: number, height: number) => {
      setState((prev) => {
        const node = (prev.nodes || []).find((n) => n.id === id)
        if (
          node &&
          Math.abs((node.width || 0) - width) < 1 &&
          Math.abs((node.height || 0) - height) < 1
        ) {
          return prev
        }
        return {
          ...prev,
          nodes: (prev.nodes || []).map((n) =>
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
      while (changed) {
        changed = false
        ;(prev.nodes || []).forEach((n) => {
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

      return {
        ...prev,
        nodes: (prev.nodes || []).filter((n) => !nodesToDelete.has(n.id)),
        edges: (prev.edges || []).filter(
          (e) => !nodesToDelete.has(e.source) && !nodesToDelete.has(e.target),
        ),
        editingNodeId:
          prev.editingNodeId && nodesToDelete.has(prev.editingNodeId)
            ? null
            : prev.editingNodeId,
        configuringNodeId:
          prev.configuringNodeId && nodesToDelete.has(prev.configuringNodeId)
            ? null
            : prev.configuringNodeId,
        documentViewNodeId:
          prev.documentViewNodeId && nodesToDelete.has(prev.documentViewNodeId)
            ? null
            : prev.documentViewNodeId,
        highlightedNodeId:
          prev.highlightedNodeId && nodesToDelete.has(prev.highlightedNodeId)
            ? null
            : prev.highlightedNodeId,
      }
    })
  }, [])

  const moveNode = useCallback((id: string, position: Position) => {
    setState((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) =>
        n.id === id ? { ...n, position } : n,
      ),
    }))
  }, [])

  const selectNode = useCallback((id: string | null) => {
    setState((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) => ({ ...n, selected: n.id === id })),
    }))
  }, [])

  const setViewport = useCallback((viewport: Viewport) => {
    setState((prev) => ({ ...prev, viewport }))
  }, [])

  const pan = useCallback((dx: number, dy: number) => {
    setState((prev) => {
      const currentViewport = prev.viewport || { x: 0, y: 0, scale: 1 }
      return {
        ...prev,
        viewport: {
          ...currentViewport,
          x: currentViewport.x + dx,
          y: currentViewport.y + dy,
        },
      }
    })
  }, [])

  const zoom = useCallback(
    (factor: number, center?: { x: number; y: number }) => {
      setState((prev) => {
        const currentViewport = prev.viewport || { x: 0, y: 0, scale: 1 }
        const currentZoom = currentViewport.scale
        const newZoom = Math.min(Math.max(currentZoom * factor, 0.1), 4)

        if (center) {
          const scaleChange = newZoom / currentZoom
          const newX = center.x - (center.x - currentViewport.x) * scaleChange
          const newY = center.y - (center.y - currentViewport.y) * scaleChange
          return {
            ...prev,
            viewport: { x: newX, y: newY, scale: newZoom },
          }
        }

        return {
          ...prev,
          viewport: { ...currentViewport, scale: newZoom },
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
      const node = (prev.nodes || []).find((n) => n.id === id)
      if (!node || !node.position) return prev

      const currentViewport = prev.viewport || { x: 0, y: 0, scale: 1 }
      const scale = currentViewport.scale
      const centerX =
        typeof window !== 'undefined' ? window.innerWidth / 2 : 500
      const centerY =
        typeof window !== 'undefined' ? window.innerHeight / 2 : 500

      const nodeCenterX = node.position.x + (node.width || 200) / 2
      const nodeCenterY = node.position.y + (node.height || 80) / 2

      const newX = centerX - nodeCenterX * scale
      const newY = centerY - nodeCenterY * scale

      return {
        ...prev,
        viewport: { ...currentViewport, x: newX, y: newY },
      }
    })
  }, [])

  const toggleTaskMode = useCallback((id: string, enabled: boolean) => {
    setState((prev) => {
      const nodesToUpdate = new Set<string>([id])
      let changed = true
      while (changed) {
        changed = false
        ;(prev.nodes || []).forEach((n) => {
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
        nodes: (prev.nodes || []).map((n) =>
          nodesToUpdate.has(n.id) ? { ...n, taskModeEnabled: enabled } : n,
        ),
      }
    })
  }, [])

  const toggleNodeChecked = useCallback((id: string, checked: boolean) => {
    setState((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) =>
        n.id === id ? { ...n, checked } : n,
      ),
    }))
  }, [])

  const toggleNodeCollapse = useCallback((id: string, collapsed: boolean) => {
    setState((prev) => ({
      ...prev,
      nodes: (prev.nodes || []).map((n) =>
        n.id === id ? { ...n, collapsed } : n,
      ),
    }))
  }, [])

  return (
    <MindMapContext.Provider
      value={{
        state,
        setEdgeStyle,
        addNode,
        addSiblingNode,
        setEditingNodeId,
        setConfiguringNodeId,
        setDocumentViewNodeId,
        setHighlightedNodeId,
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
        toggleNodeCollapse,
        autoLayout,
        updateNodeAppearance,
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
