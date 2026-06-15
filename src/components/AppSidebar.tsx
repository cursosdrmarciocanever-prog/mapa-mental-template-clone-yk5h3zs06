import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { SidebarTree } from '@/components/mindmap/SidebarTree'

const mockedPersonalProjects = [
  { id: 'p1', name: 'Planejamento de Férias' },
  { id: 'p2', name: 'Ideias de Livros' },
  { id: 'p3', name: 'Finanças Pessoais' },
]

const mockedProfessionalProjects = [
  { id: 'w1', name: 'Roadmap Q3' },
  { id: 'w2', name: 'Arquitetura do Sistema' },
  { id: 'w3', name: 'Reestruturação de Equipe' },
  { id: 'w4', name: 'Lançamento de Produto' },
]

export function AppSidebar() {
  const [search, setSearch] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()

  const activeTab = searchParams.get('tab') || 'pessoais'
  const activeProjectId =
    searchParams.get('project') || (activeTab === 'pessoais' ? 'p1' : 'w1')

  const handleTabChange = (tab: string) => {
    setSearchParams(
      (prev) => {
        prev.set('tab', tab)
        prev.set('project', tab === 'pessoais' ? 'p1' : 'w1')
        return prev
      },
      { replace: true },
    )
  }

  const handleProjectSelect = (projectId: string) => {
    setSearchParams((prev) => {
      prev.set('project', projectId)
      return prev
    })
  }

  const filterProjects = (projects: { id: string; name: string }[]) =>
    projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  const personal = filterProjects(mockedPersonalProjects)
  const professional = filterProjects(mockedProfessionalProjects)

  return (
    <Sidebar>
      <SidebarHeader className="border-b px-4 py-4">
        <h2 className="text-lg font-semibold tracking-tight">Meus Projetos</h2>
      </SidebarHeader>
      <SidebarContent className="flex flex-col gap-0 overflow-hidden">
        <div className="px-4 py-3 shrink-0">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Buscar projetos..."
              className="w-full bg-background pl-8 h-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full flex-1 flex flex-col min-h-0"
        >
          <div className="px-4 pb-2 shrink-0">
            <TabsList className="w-full h-auto grid grid-cols-2 p-1">
              <TabsTrigger
                value="pessoais"
                className="text-[10px] sm:text-xs py-1.5 px-1 whitespace-normal text-center leading-tight h-full"
              >
                Projetos Pessoais
              </TabsTrigger>
              <TabsTrigger
                value="profissionais"
                className="text-[10px] sm:text-xs py-1.5 px-1 whitespace-normal text-center leading-tight h-full"
              >
                Projetos Profissionais
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pessoais" className="m-0 flex-1 overflow-y-auto">
            <SidebarGroup>
              <SidebarGroupContent>
                {personal.length > 0 ? (
                  <SidebarMenu>
                    {personal.map((p) => (
                      <SidebarMenuItem key={p.id}>
                        <SidebarMenuButton
                          isActive={p.id === activeProjectId}
                          onClick={() => handleProjectSelect(p.id)}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="truncate">{p.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum projeto pessoal encontrado
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </TabsContent>

          <TabsContent
            value="profissionais"
            className="m-0 flex-1 overflow-y-auto"
          >
            <SidebarGroup>
              <SidebarGroupContent>
                {professional.length > 0 ? (
                  <SidebarMenu>
                    {professional.map((p) => (
                      <SidebarMenuItem key={p.id}>
                        <SidebarMenuButton
                          isActive={p.id === activeProjectId}
                          onClick={() => handleProjectSelect(p.id)}
                        >
                          <FileText className="h-4 w-4" />
                          <span className="truncate">{p.name}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                ) : (
                  <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                    Nenhum projeto profissional encontrado
                  </div>
                )}
              </SidebarGroupContent>
            </SidebarGroup>
          </TabsContent>
        </Tabs>

        <SidebarSeparator />

        <div className="p-4 shrink-0 max-h-[40%] overflow-y-auto bg-muted/10">
          <h3 className="mb-3 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Estrutura do Mapa
          </h3>
          <SidebarTree />
        </div>
      </SidebarContent>
    </Sidebar>
  )
}
