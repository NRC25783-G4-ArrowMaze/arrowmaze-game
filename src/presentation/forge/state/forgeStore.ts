import { create } from 'zustand'
import type { Scene } from '../../game/scene'
import * as sceneOps from './sceneOps'

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

export const useForgeStore = create<ForgeState>((set) => {
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

    // Mutaciones (usando sceneOps)
    addCell: (col, row) => {
      commit((scene) => sceneOps.addCell(scene, col, row))
    },
    removeCell: (cellId) => {
      commit((scene) => sceneOps.removeCell(scene, cellId))
    },
    toggleConnection: (cellIdA, cellIdB) => {
      commit((scene) => {
        const result = sceneOps.toggleConnection(scene, cellIdA, cellIdB)
        return result ?? scene
      })
    },
    placeHead: (cellId) => {
      commit((scene) => {
        const result = sceneOps.placeHead(scene, cellId)
        return result ?? scene
      })
    },
    rotateHead: (arrowId) => {
      commit((scene) => sceneOps.rotateHead(scene, arrowId))
    },
    extendArrow: (arrowId, cellId) => {
      commit((scene) => {
        const result = sceneOps.extendArrow(scene, arrowId, cellId)
        return result ?? scene
      })
    },
    retractArrow: (arrowId) => {
      commit((scene) => sceneOps.retractArrow(scene, arrowId))
    },
    deleteArrow: (arrowId) => {
      commit((scene) => sceneOps.deleteArrow(scene, arrowId))
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
        const prev = s.history.past[s.history.past.length - 1]
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
        const next = s.history.future[0]
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
