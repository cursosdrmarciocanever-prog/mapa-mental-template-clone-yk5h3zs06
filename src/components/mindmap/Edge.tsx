import { MindMapEdge, MindMapNode } from '@/lib/types'
import { getEdgePath, cn } from '@/lib/utils'
import { useMindMap } from './context'

type EdgeProps = {
  edge: MindMapEdge
  sourceNode?: MindMapNode
  targetNode?: MindMapNode
}

export const Edge = ({ edge, sourceNode, targetNode }: EdgeProps) => {
  const { state } = useMindMap()
  if (!sourceNode || !targetNode) return null

  const pathParams = getEdgePath(sourceNode, targetNode, state.edgeStyle)

  return (
    <g data-edge-id={edge.id}>
      {/* Background stroke for better visibility over grid */}
      <path
        d={pathParams}
        fill="none"
        strokeWidth="4"
        className="stroke-background opacity-50 transition-colors duration-300"
      />
      {/* Main Connection Line */}
      <path
        id={`edge-path-${edge.id}`}
        d={pathParams}
        fill="none"
        strokeWidth="2"
        className={cn(
          'animate-fade-in transition-colors duration-300',
          // Darker stroke for light mode, Lighter stroke for dark mode to ensure contrast
          'stroke-slate-500 dark:stroke-slate-400',
        )}
        data-source-node={sourceNode.id}
        data-target-node={targetNode.id}
      />
    </g>
  )
}
