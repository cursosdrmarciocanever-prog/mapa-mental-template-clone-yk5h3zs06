/* General utility functions (exposes cn and getEdgePath) */
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { MindMapNode } from './types'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Calculates the SVG path for an edge between two nodes
 * @param source - The source node
 * @param target - The target node
 * @returns The SVG path string (Cubic Bezier)
 */
export function getEdgePath(
  source: Partial<MindMapNode> & { position: { x: number; y: number } },
  target: Partial<MindMapNode> & { position: { x: number; y: number } },
) {
  const sW = source.width || 120
  const sH = source.height || 40
  const tW = target.width || 120
  const tH = target.height || 40

  const sx = source.position.x + sW
  const sy = source.position.y + sH / 2
  const tx = target.position.x
  const ty = target.position.y + tH / 2

  const deltaX = Math.abs(tx - sx)
  const controlPointOffset = Math.max(deltaX * 0.5, 50)

  const c1x = sx + controlPointOffset
  const c1y = sy
  const c2x = tx - controlPointOffset
  const c2y = ty

  return `M ${sx} ${sy} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}`
}
