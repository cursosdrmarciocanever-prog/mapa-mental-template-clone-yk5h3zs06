import { MindMapProvider } from '@/components/mindmap/context'
import { MindMapCanvas } from '@/components/mindmap/Canvas'
import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { Separator } from '@/components/ui/separator'
import { ModeToggle } from '@/components/mode-toggle'
import { NodeSearch } from '@/components/mindmap/NodeSearch'

const Index = () => {
  return (
    <MindMapProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4 bg-background/80 backdrop-blur z-40 sticky top-0 transition-colors duration-200">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 h-4 hidden sm:block"
            />
            <h1 className="font-semibold text-sm md:text-base flex-1 truncate hidden sm:block">
              React Flow Mindmap
            </h1>
            <div className="flex-1 sm:flex-none flex items-center justify-end gap-2">
              <NodeSearch />
              <ModeToggle />
            </div>
          </header>
          <main className="flex-1 relative overflow-hidden h-[calc(100svh-3.5rem)]">
            <MindMapCanvas />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </MindMapProvider>
  )
}

export default Index
