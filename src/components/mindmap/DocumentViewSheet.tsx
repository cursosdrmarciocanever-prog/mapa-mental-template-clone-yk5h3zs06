import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { useMindMap } from './context'
import { DocumentEditor } from './DocumentEditor'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Copy, Check } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useState } from 'react'
import { MindMapNode } from '@/lib/types'

// Helper to escape HTML characters
const escapeHtml = (unsafe: string) => {
  if (!unsafe) return ''
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

// Helper to generate both HTML (Rich Text) and Plain Text clipboard data
const generateClipboardData = (nodeId: string, nodes: MindMapNode[]) => {
  const node = nodes.find((n) => n.id === nodeId)
  if (!node) return { html: '', text: '' }

  // Identify if this is a topic root (no parent) to use recursive copy
  const isTopicRoot = !node.parentId

  const getSortedChildren = (pId: string) => {
    return nodes
      .filter((n) => n.parentId === pId)
      .sort((a, b) => a.position.y - b.position.y)
  }

  // --- Plain Text Generator (Markdown-ish with indentation) ---
  let text = `# ${node.label}\n\n${node.description || ''}\n\n`

  const appendTextRecursive = (parentId: string, depth = 0) => {
    const children = getSortedChildren(parentId)
    let content = ''
    const indent = '  '.repeat(depth)
    for (const child of children) {
      content += `${indent}### ${child.label}\n`
      if (child.description) {
        content += `${indent}${child.description}\n`
      }
      content += '\n'
      content += appendTextRecursive(child.id, depth + 1)
    }
    return content
  }

  const appendTextFlat = (parentId: string) => {
    const children = getSortedChildren(parentId)
    let content = ''
    for (const child of children) {
      content += `### ${child.label}\n\n${child.description || ''}\n\n`
    }
    return content
  }

  // --- HTML Generator (Rich Text) ---
  let html = `<h1>${escapeHtml(node.label)}</h1>`
  if (node.description) {
    html += `<p>${escapeHtml(node.description)}</p>`
  }

  const appendHtmlRecursive = (parentId: string) => {
    const children = getSortedChildren(parentId)
    if (children.length === 0) return ''

    let content = '<ul>'
    for (const child of children) {
      content += '<li>'
      content += `<h3>${escapeHtml(child.label)}</h3>`
      if (child.description) {
        content += `<p>${escapeHtml(child.description)}</p>`
      }
      content += appendHtmlRecursive(child.id)
      content += '</li>'
    }
    content += '</ul>'
    return content
  }

  const appendHtmlFlat = (parentId: string) => {
    const children = getSortedChildren(parentId)
    let content = ''
    for (const child of children) {
      content += `<h3>${escapeHtml(child.label)}</h3>`
      if (child.description) {
        content += `<p>${escapeHtml(child.description)}</p>`
      }
      content += '<br/>'
    }
    return content
  }

  if (isTopicRoot) {
    text += appendTextRecursive(nodeId)
    html += appendHtmlRecursive(nodeId)
  } else {
    text += appendTextFlat(nodeId)
    html += appendHtmlFlat(nodeId)
  }

  return { html, text }
}

export const DocumentViewSheet = () => {
  const { state, setDocumentViewNodeId } = useMindMap()
  const { documentViewNodeId } = state
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const isOpen = !!documentViewNodeId

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setDocumentViewNodeId(null)
      setCopied(false)
    }
  }

  // Find the label of the current node for accessibility/title purposes, fallback to 'Document View'
  const currentNode = state.nodes.find((n) => n.id === documentViewNodeId)
  const title = currentNode ? currentNode.label : 'Document View'

  const handleCopy = async () => {
    if (!documentViewNodeId) return

    const { html, text } = generateClipboardData(
      documentViewNodeId,
      state.nodes,
    )

    try {
      // Use Clipboard API to write both HTML and Text
      // This allows pasting into Google Docs/Word (HTML) or Notepad (Text)
      if (typeof ClipboardItem !== 'undefined') {
        const clipboardItem = new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        })
        await navigator.clipboard.write([clipboardItem])
      } else {
        // Fallback for environments where ClipboardItem is not available
        await navigator.clipboard.writeText(text)
      }

      setCopied(true)
      toast({
        title: 'Content Copied',
        description:
          'Document content has been copied to clipboard as Rich Text.',
      })

      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error('Copy failed:', error)
      // Fallback if rich text copy fails (e.g. permission issues)
      try {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        toast({
          title: 'Copied as Text',
          description: 'Rich text copy failed, copied as plain text instead.',
        })
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        toast({
          title: 'Copy Failed',
          description: 'Could not copy content to clipboard.',
          variant: 'destructive',
        })
      }
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl md:max-w-2xl p-0 gap-0 overflow-hidden bg-card"
      >
        <SheetHeader className="px-6 py-4 border-b bg-background/50 backdrop-blur-sm z-10 flex flex-row items-center justify-between space-y-0">
          <div className="flex flex-col gap-1">
            <SheetTitle className="sr-only">{title}</SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              Document Mode - Changes are synced automatically
            </SheetDescription>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="mr-8 gap-2"
          >
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </SheetHeader>
        <ScrollArea className="h-full w-full">
          <div className="px-6 pb-20">
            {documentViewNodeId && (
              <DocumentEditor nodeId={documentViewNodeId} />
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  )
}
