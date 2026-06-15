import { Outlet, useSearchParams } from 'react-router-dom'
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { AppSidebar } from '@/components/AppSidebar'
import { MindMapProvider } from '@/components/mindmap/context'
import { ModeToggle } from '@/components/mode-toggle'

export default function Layout() {
  const [searchParams] = useSearchParams()
  const projectId = searchParams.get('project') || 'p1'

  return (
    <MindMapProvider projectId={projectId}>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden relative">
          <header className="h-14 flex items-center justify-between px-4 border-b shrink-0 bg-background/80 backdrop-blur-sm absolute top-0 w-full z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
              <div className="w-px h-4 bg-border mx-2" />
              <h1 className="font-medium text-sm text-foreground">
                Mind Map Creator
              </h1>
            </div>
            <ModeToggle />
          </header>
          <main className="flex-1 w-full h-full relative mt-14 overflow-hidden">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </MindMapProvider>
  )
}
