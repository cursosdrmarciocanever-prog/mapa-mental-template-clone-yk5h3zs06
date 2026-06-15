import { ChevronRight } from 'lucide-react'
import { MindMapNode } from '@/lib/types'
import { useMindMap } from '@/components/mindmap/context'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarMenuAction,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'

interface MindMapTreeProps {
  nodes: MindMapNode[]
}

export const SidebarTree = ({ nodes }: MindMapTreeProps) => {
  return (
    <>
      <MindMapTreeList nodes={nodes} parentId={undefined} level={0} />
    </>
  )
}

interface MindMapTreeListProps {
  nodes: MindMapNode[]
  parentId?: string
  level: number
}

const MindMapTreeList = ({ nodes, parentId, level }: MindMapTreeListProps) => {
  const items = nodes.filter(
    (n) => n.parentId === parentId || (!n.parentId && !parentId),
  )

  if (items.length === 0) return null

  return (
    <>
      {items.map((node) => (
        <MindMapTreeItem
          key={node.id}
          node={node}
          allNodes={nodes}
          level={level}
        />
      ))}
    </>
  )
}

interface MindMapTreeItemProps {
  node: MindMapNode
  allNodes: MindMapNode[]
  level: number
}

const MindMapTreeItem = ({ node, allNodes, level }: MindMapTreeItemProps) => {
  const { selectNode, focusNode } = useMindMap()
  const hasChildren = allNodes.some((n) => n.parentId === node.id)

  const handleNodeClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    selectNode(node.id)
    focusNode(node.id)
  }

  // Root level items
  if (level === 0) {
    return (
      <SidebarMenuItem>
        <Collapsible className="group/collapsible">
          <SidebarMenuButton
            onClick={handleNodeClick}
            isActive={node.selected}
            className="group-data-[collapsible=icon]:!p-2"
          >
            <span className="truncate">{node.label}</span>
          </SidebarMenuButton>

          {hasChildren && (
            <CollapsibleTrigger asChild>
              <SidebarMenuAction className="transition-transform group-data-[state=open]/collapsible:rotate-90">
                <ChevronRight />
                <span className="sr-only">Toggle</span>
              </SidebarMenuAction>
            </CollapsibleTrigger>
          )}

          {hasChildren && (
            <CollapsibleContent>
              <SidebarMenuSub>
                <MindMapTreeList
                  nodes={allNodes}
                  parentId={node.id}
                  level={level + 1}
                />
              </SidebarMenuSub>
            </CollapsibleContent>
          )}
        </Collapsible>
      </SidebarMenuItem>
    )
  }

  // Nested items (Level 1+)
  return (
    <SidebarMenuSubItem className="relative">
      <Collapsible className="group/collapsible">
        <div className="flex items-center w-full relative">
          <SidebarMenuSubButton
            onClick={handleNodeClick}
            isActive={node.selected}
            className={cn('flex-1', hasChildren && 'pr-8')} // Add padding for trigger space
          >
            <span className="truncate">{node.label}</span>
          </SidebarMenuSubButton>

          {hasChildren && (
            <CollapsibleTrigger asChild>
              <button className="absolute right-0 top-1/2 -translate-y-1/2 flex h-5 w-5 items-center justify-center rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground outline-none ring-sidebar-ring focus-visible:ring-2 transition-transform group-data-[state=open]/collapsible:rotate-90">
                <ChevronRight className="h-3.5 w-3.5" />
                <span className="sr-only">Toggle</span>
              </button>
            </CollapsibleTrigger>
          )}
        </div>

        {hasChildren && (
          <CollapsibleContent>
            <SidebarMenuSub className="mr-0 border-l border-sidebar-border ml-3.5">
              <MindMapTreeList
                nodes={allNodes}
                parentId={node.id}
                level={level + 1}
              />
            </SidebarMenuSub>
          </CollapsibleContent>
        )}
      </Collapsible>
    </SidebarMenuSubItem>
  )
}
