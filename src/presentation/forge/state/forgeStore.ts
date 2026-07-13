import { create } from 'zustand'
import type { Scene } from '../../game/scene'
import * as sceneOps from './sceneOps'

export type ToolMode = 'select' | 'cell' | 'connect' | 'arrowHead' | 'extend' | 'erase'

/** Puerto elegido como primer extremo en modo 'connect'. */
export interface PendingConnect {
  cellId: string
  port: number
}

export interface ForgeState {
  // Edición
  scene: Scene
  gridCols: number
  gridRows: number

  // Herramientas y selección
  tool: ToolMode
  selectedArrowId: string | null
  pendingConnect: PendingConnect | null

  // Navegación de capas 3D
  activeLayer: number
  maxLayer: number

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
  setPendingConnect: (pending: PendingConnect | null) => void
  setSession: (token: string | null, email: string | null) => void
  setActiveLayer: (layer: number) => void

  // Mutations (pasan por commit para historial)
  addCell: (col: number, row: number, layer?: number, portCount?: number) => void
  removeCell: (cellId: string) => void
  connectPorts: (cellIdA: string, portA: number, cellIdB: string, portB: number) => void
  disconnectPort: (cellId: string, port: number) => void
  placeHead: (cellId: string) => void
  rotateHead: (arrowId: string) => void
  extendArrow: (arrowId: string, cellId: string) => void
  retractArrow: (arrowId: string) => void
  deleteArrow: (arrowId: string) => void
  setLevelProps: (updates: Partial<Scene>) => void
  loadScene: (newScene: Scene) => void

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
    pendingConnect: null,
    activeLayer: 0,
    maxLayer: 0,
    history: { past: [], future: [] },
    session: { token: null, email: null },

    // Setters directos (no pasan por historial)
    setScene: (scene) => set({ scene }),
    setGridCols: (cols) => set({ gridCols: cols }),
    setGridRows: (rows) => set({ gridRows: rows }),
    setTool: (tool) => set({ tool, pendingConnect: null }),
    selectArrow: (arrowId) => set({ selectedArrowId: arrowId }),
    setPendingConnect: (pending) => set({ pendingConnect: pending }),
    setSession: (token, email) => set({ session: { token, email } }),
    setActiveLayer: (layer) => set({ activeLayer: layer }),

    // Mutaciones (usando sceneOps)
    addCell: (col, row, layer = 0, portCount = 4) => {
      commit((scene) => sceneOps.addCell(scene, col, row, layer, portCount))
      // Recalcular maxLayer tras agregar la celda
      set((s) => ({
        maxLayer: s.scene.cells.reduce((m, c) => Math.max(m, c.layer ?? 0), 0),
      }))
    },
    removeCell: (cellId) => {
      commit((scene) => sceneOps.removeCell(scene, cellId))
      // Recalcular maxLayer: puede haber bajado si se eliminó la última celda de una capa
      set((s) => ({
        maxLayer: s.scene.cells.reduce((m, c) => Math.max(m, c.layer ?? 0), 0),
      }))
    },
    connectPorts: (cellIdA, portA, cellIdB, portB) => {
      commit((scene) => {
        const result = sceneOps.connectPorts(scene, cellIdA, portA, cellIdB, portB)
        return result ?? scene
      })
    },
    disconnectPort: (cellId, port) => {
      commit((scene) => sceneOps.disconnectPort(scene, cellId, port))
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
    setLevelProps: (updates) => {
      commit((scene) => ({ ...scene, ...updates }))
    },
    loadScene: (newScene) => {
      // Ajusta el lienzo al tamaño real del nivel cargado para que no se recorte
      // (los niveles grandes como el corazón llegan más allá de 8×8). Mínimo 8×8.
      const maxCol = newScene.cells.reduce((m, c) => Math.max(m, c.col), 0)
      const maxRow = newScene.cells.reduce((m, c) => Math.max(m, c.row), 0)
      const maxLayer = newScene.cells.reduce((m, c) => Math.max(m, c.layer ?? 0), 0)
      set({
        scene: newScene,
        gridCols: Math.max(8, maxCol + 1),
        gridRows: Math.max(8, maxRow + 1),
        maxLayer,
        activeLayer: 0,   // siempre arrancar en capa 0 al cargar
        history: { past: [], future: [] },
      })
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
