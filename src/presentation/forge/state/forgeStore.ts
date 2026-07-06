import { create } from 'zustand'
import type { Scene } from '../../game/scene'

export type ToolMode = 'select' | 'cell' | 'connect' | 'arrowHead' | 'extend' | 'erase'

export interface ForgeState {
  // Edición
  scene: Scene
  gridCols: number
  gridRows: number

  // Herramientas y selección
  tool: ToolMode
  selectedArrowId: string | null
  pendingConnectFrom: string | null

  // Historial (undo/redo)
  history: { past: Scene[]; future: Scene[] }

  // Sesión autenticada
  session: { token: string | null; email: string | null }

  // Acciones
  setScene: (scene: Scene) => void
  setGridCols: (cols: number) => void
  setGridRows: (rows: number) => void
  setTool: (tool: ToolMode) => void
  selectArrow: (arrowId: string | null) => void
  setPendingConnectFrom: (cellId: string | null) => void
  setSession: (token: string | null, email: string | null) => void

  // Mutations (pasan por commit para historial)
  addCell: (col: number, row: number) => void
  removeCell: (cellId: string) => void
  toggleConnection: (cellIdA: string, cellIdB: string) => void
  placeHead: (cellId: string) => void
  rotateHead: (arrowId: string) => void
  extendArrow: (arrowId: string, cellId: string) => void
  retractArrow: (arrowId: string) => void
  deleteArrow: (arrowId: string) => void
  setLevelProps: (id?: string, name?: string, difficulty?: string, allowedMoves?: number) => void

  // Historial
  undo: () => void
  redo: () => void
}

const EMPTY_SCENE: Scene = {
  id: 'nuevo-nivel',
  allowedMoves: 10,
  cells: [],
  connections: [],
  arrows: [],
}

export const useForgeStore = create<ForgeState>((set, get) => {
  // Helper: aplica una mutación de Scene y gestiona historial
  const commit = (fn: (scene: Scene) => Scene) =>
    set((s) => {
      const next = fn(s.scene)
      return {
        scene: next,
        history: { past: [...s.history.past, s.scene], future: [] },
      }
    })

  return {
    // Estado inicial
    scene: EMPTY_SCENE,
    gridCols: 8,
    gridRows: 8,
    tool: 'select',
    selectedArrowId: null,
    pendingConnectFrom: null,
    history: { past: [], future: [] },
    session: { token: null, email: null },

    // Setters directos (no pasan por historial)
    setScene: (scene) => set({ scene }),
    setGridCols: (cols) => set({ gridCols: cols }),
    setGridRows: (rows) => set({ gridRows: rows }),
    setTool: (tool) => set({ tool }),
    selectArrow: (arrowId) => set({ selectedArrowId: arrowId }),
    setPendingConnectFrom: (cellId) => set({ pendingConnectFrom: cellId }),
    setSession: (token, email) => set({ session: { token, email } }),

    // Mutaciones (placeholder; se completarán cuando sceneOps esté implementado)
    addCell: (col, row) => {
      // TODO: implementar con sceneOps.addCell
      commit((scene) => scene)
    },
    removeCell: (cellId) => {
      // TODO: implementar con sceneOps.removeCell
      commit((scene) => scene)
    },
    toggleConnection: (cellIdA, cellIdB) => {
      // TODO: implementar con sceneOps.toggleConnection
      commit((scene) => scene)
    },
    placeHead: (cellId) => {
      // TODO: implementar con sceneOps.placeHead
      commit((scene) => scene)
    },
    rotateHead: (arrowId) => {
      // TODO: implementar con sceneOps.rotateHead
      commit((scene) => scene)
    },
    extendArrow: (arrowId, cellId) => {
      // TODO: implementar con sceneOps.extendArrow
      commit((scene) => scene)
    },
    retractArrow: (arrowId) => {
      // TODO: implementar con sceneOps.retractArrow
      commit((scene) => scene)
    },
    deleteArrow: (arrowId) => {
      // TODO: implementar con sceneOps.deleteArrow
      commit((scene) => scene)
    },
    setLevelProps: (id, name, difficulty, allowedMoves) => {
      commit((scene) => ({
        ...scene,
        ...(id !== undefined && { id }),
        ...(name !== undefined && { name }),
        ...(difficulty !== undefined && { difficulty }),
        ...(allowedMoves !== undefined && { allowedMoves }),
      }))
    },

    // Undo/Redo
    undo: () =>
      set((s) => {
        const prev = s.history.past.at(-1)
        if (!prev) return s
        return {
          scene: prev,
          history: {
            past: s.history.past.slice(0, -1),
            future: [s.scene, ...s.history.future],
          },
        }
      }),
    redo: () =>
      set((s) => {
        const next = s.history.future.at(0)
        if (!next) return s
        return {
          scene: next,
          history: {
            past: [...s.history.past, s.scene],
            future: s.history.future.slice(1),
          },
        }
      }),
  }
})
