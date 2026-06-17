import { Board } from "../entities/Board";
import { Arrow } from "../entities/Arrow";

export interface LoadedLevel {
  board: Board;
  arrows: Arrow[];
}
export interface ILoadedLevelRepository {
  getLoadedLevel(levelId: string): Promise<LoadedLevel>;
}