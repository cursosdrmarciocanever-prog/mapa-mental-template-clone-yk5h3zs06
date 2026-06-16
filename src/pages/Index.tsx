import { useSearchParams } from 'react-router-dom'
import { MindMapCanvas } from '@/components/mindmap/Canvas'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NodeSearch } from '@/components/mindmap/NodeSearch'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMemo, useState, useEffect } from 'react'

export default function Index() {
  const [searchParams, setSearchParams] = useSearchParams()
  const projectParam = searchParams.get('project')

  // Isolated Side Effects: Decouple the initial paint from map rendering
  const [isMounting, setIsMounting] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounting(false), 50)
    return () => clearTimeout(timer)
  }, [])

  const currentTab = useMemo(() => {
    if (projectParam === 'profissionais') return 'profissionais'
    return 'pessoais'
  }, [projectParam])

  const handleTabChange = (value: string) => {
    setSearchParams(new URLSearchParams({ project: value }), { replace: true })
  }

  return (
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

      <div className="flex-1 relative overflow-hidden bg-muted/10">
        {!isMounting && (
          <ErrorBoundary
            key={`eb-${currentTab}`}
            fallback={
              <div className="flex w-full h-full min-h-[400px] items-center justify-center bg-background p-6">
                <div className="text-center p-8 bg-destructive/5 rounded-xl border border-destructive/20 max-w-md shadow-sm">
                  <div className="flex justify-center mb-4">
                    <div className="bg-destructive/10 p-3 rounded-full">
                      <AlertCircle className="w-8 h-8 text-destructive" />
                    </div>
                  </div>
                  <h2 className="text-xl font-bold mb-2 text-destructive">
                    Map Rendering Error
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    We encountered an error while trying to render this mind
                    map. Your layout and other projects are still accessible.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => window.location.reload()}
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Reload Page
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        localStorage.removeItem(`mindmap-data-v3-${currentTab}`)
                        window.location.reload()
                      }}
                    >
                      Reset Project Data
                    </Button>
                  </div>
                </div>
              </div>
            }
          >
            <MindMapCanvas />
          </ErrorBoundary>
        )}
      </div>
    </div>
  )
}
