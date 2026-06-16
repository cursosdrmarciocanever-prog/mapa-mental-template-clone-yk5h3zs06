import { useSearchParams } from 'react-router-dom'
import { MindMapCanvas } from '@/components/mindmap/Canvas'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NodeSearch } from '@/components/mindmap/NodeSearch'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MindMapProvider } from '@/components/mindmap/context'

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams()
  const currentTab = searchParams.get('project') || 'pessoais'

  const handleTabChange = (value: string) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('project', value)
    setSearchParams(newParams)
  }

  return (
    <MindMapProvider key={currentTab} projectId={currentTab}>
      <div className="flex flex-col w-full h-full absolute inset-0 bg-background">
        <div className="flex-none p-3 px-4 border-b bg-background/95 backdrop-blur z-20 flex items-center justify-between shadow-sm">
          <Tabs
            value={currentTab}
            onValueChange={handleTabChange}
            className="w-[400px]"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pessoais">Projetos Pessoais</TabsTrigger>
              <TabsTrigger value="profissionais">
                Projetos Profissionais
              </TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="w-72">
            <NodeSearch />
          </div>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <ErrorBoundary
            key={currentTab}
            fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-background z-50">
                <div className="text-center p-8 bg-card rounded-xl border max-w-md shadow-sm">
                  <div className="flex justify-center mb-4">
                    <div className="bg-destructive/10 p-3 rounded-full">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-2">
                    Something went wrong
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    We encountered an error while loading the mindmap. This
                    might be due to corrupted saved data or an unhandled state.
                  </p>
                  <Button
                    onClick={() => {
                      localStorage.removeItem(`mindmap-data-v3-${currentTab}`)
                      window.location.reload()
                    }}
                  >
                    Reset Project Data
                  </Button>
                </div>
              </div>
            }
          >
            <MindMapCanvas />
          </ErrorBoundary>
        </div>
      </div>
    </MindMapProvider>
  )
}
