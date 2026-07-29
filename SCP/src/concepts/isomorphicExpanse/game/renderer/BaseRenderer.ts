import type { GameState, Position } from '../engine/types'

export interface IRenderer {
  render(state: GameState): void
  resize(width: number, height: number): void
  screenToWorld(screenX: number, screenY: number): Position | null
  readonly viewMode: 'overhead' | 'isometric' | 'personal_space'
}
