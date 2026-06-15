import { useMindMap } from './context'
import { Button } from '@/components/ui/button'
import { Minus, Plus, Maximize, Map } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export const MindMapControls = ({
  showMiniMap,
  toggleMiniMap,
}: {
  showMiniMap: boolean
  toggleMiniMap: () => void
}) => {
  const { zoom, fitView } = useMindMap()

  return (
    <div className="absolute bottom-6 left-6 flex flex-col gap-2 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 p-2 rounded-xl border shadow-xl z-50">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => zoom(1.2)}>
            <Plus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Aumentar Zoom</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => zoom(0.8)}>
            <Minus className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Diminuir Zoom</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="icon" onClick={() => fitView()}>
            <Maximize className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Ajustar à Tela</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={showMiniMap ? 'secondary' : 'ghost'}
            size="icon"
            onClick={toggleMiniMap}
            className={cn(showMiniMap && 'bg-secondary')}
          >
            <Map className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right">Mini Mapa</TooltipContent>
      </Tooltip>
    </div>
  )
}
