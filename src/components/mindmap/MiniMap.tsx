import { useMindMap } from './context'

export const MiniMap = () => {
  const { state } = useMindMap()
  const scale = 0.05

  return (
    <div className="absolute bottom-6 right-6 w-52 h-36 bg-background/95 backdrop-blur border shadow-xl rounded-xl overflow-hidden z-50 pointer-events-none">
      <div className="relative w-full h-full bg-muted/20">
        {state.nodes.map((node) => (
          <div
            key={node.id}
            className="absolute bg-primary/60 rounded-sm"
            style={{
              left: 20 + node.position.x * scale,
              top: 20 + node.position.y * scale,
              width: Math.max((node.width || 120) * scale, 4),
              height: Math.max((node.height || 40) * scale, 2),
            }}
          />
        ))}
        {/* Viewport Indicator */}
        <div
          className="absolute border-2 border-primary/30 bg-primary/5"
          style={{
            left: 20 + state.viewport.x * scale * -1,
            top: 20 + state.viewport.y * scale * -1,
            width: (window.innerWidth * scale) / state.viewport.scale,
            height: (window.innerHeight * scale) / state.viewport.scale,
          }}
        />
      </div>
    </div>
  )
}
