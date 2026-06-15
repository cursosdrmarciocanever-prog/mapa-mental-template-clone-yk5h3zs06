import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
} from '@/components/ui/sidebar'
import { useMindMap } from '@/components/mindmap/context'
import { FileDown, LayoutTemplate } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTree } from '@/components/mindmap/SidebarTree'

export function AppSidebar() {
  const { state, centerView } = useMindMap()

  const handleExport = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' +
      encodeURIComponent(JSON.stringify(state))
    const downloadAnchorNode = document.createElement('a')
    downloadAnchorNode.setAttribute('href', dataStr)
    downloadAnchorNode.setAttribute('download', 'mindmap.json')
    document.body.appendChild(downloadAnchorNode)
    downloadAnchorNode.click()
    downloadAnchorNode.remove()
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-4">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <LayoutTemplate className="w-5 h-5" />
          </div>
          <span className="font-bold text-lg">Mind Map</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tópicos ({state.nodes.length})</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarTree nodes={state.nodes} />
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator className="my-2" />

        <SidebarGroup>
          <SidebarGroupLabel>Ferramentas</SidebarGroupLabel>
          <SidebarGroupContent className="p-2 flex flex-col gap-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={handleExport}
            >
              <FileDown className="w-4 h-4" /> Exportar JSON
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={centerView}
            >
              <LayoutTemplate className="w-4 h-4" /> Centralizar Visão
            </Button>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup className="mt-auto">
          <SidebarGroupLabel>Instruções</SidebarGroupLabel>
          <SidebarGroupContent className="px-4 py-2 text-xs text-muted-foreground space-y-2 bg-muted/20 rounded-lg mx-2 border">
            <p>
              • <strong>Clique duplo</strong> para editar texto.
            </p>
            <p>
              • <strong>Arraste</strong> o fundo para mover.
            </p>
            <p>
              • Botão <strong>+</strong> adiciona novo nó.
            </p>
            <p>
              • <strong>Scroll</strong> para zoom in/out.
            </p>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
