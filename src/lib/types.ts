export type Position = {
  x: number
  y: number
}

export type MindMapNode = {
  id: string
  label: string
  subtitle?: string
  description?: string
  icon?: string
  position: Position
  parentId?: string
  width?: number
  height?: number
  selected?: boolean
  taskModeEnabled?: boolean
  checked?: boolean
}

export type MindMapEdge = {
  id: string
  source: string
  target: string
}

export type Viewport = {
  x: number
  y: number
  scale: number
}

export type MindMapState = {
  nodes: MindMapNode[]
  edges: MindMapEdge[]
  viewport: Viewport
  editingNodeId: string | null
  configuringNodeId: string | null
  documentViewNodeId: string | null
}

export type MindMapContextType = {
  state: MindMapState
  addNode: (parentId: string | null) => void
  addSiblingNode: (nodeId: string) => void
  setEditingNodeId: (id: string | null) => void
  setConfiguringNodeId: (id: string | null) => void
  setDocumentViewNodeId: (id: string | null) => void
  updateNodeLabel: (id: string, label: string) => void
  updateNodeDescription: (id: string, description: string) => void
  updateNodeDimensions: (id: string, width: number, height: number) => void
  deleteNode: (id: string) => void
  moveNode: (id: string, position: Position) => void
  selectNode: (id: string | null) => void
  setViewport: (viewport: Viewport) => void
  pan: (dx: number, dy: number) => void
  zoom: (factor: number, center?: { x: number; y: number }) => void
  fitView: () => void
  centerView: () => void
  focusNode: (id: string) => void
  toggleTaskMode: (id: string, enabled: boolean) => void
  toggleNodeChecked: (id: string, checked: boolean) => void
}
