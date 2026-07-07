import { Capacitor } from '@capacitor/core';

/**
 * initWebSqlite — Bootstrap del web store de @capacitor-community/sqlite.
 *
 * En plataforma 'web' el plugin no tiene puente nativo: delega en el custom
 * element <jeep-sqlite> (sql.js + wasm, persistido en IndexedDB). Ese elemento
 * debe estar definido y montado en el DOM, y el store inicializado, ANTES de
 * abrir cualquier conexión — por eso se invoca en main.tsx antes de montar la
 * App (y fuera del ciclo React: inmune al doble-effect de StrictMode).
 *
 * En Android/iOS es un no-op: el plugin nativo no necesita nada de esto. Los
 * imports son dinámicos para que ni Jest ni el bundle nativo carguen jeep-sqlite.
 *
 * El wasm se sirve desde /assets/sql-wasm.wasm (public/assets), la ruta por
 * defecto que espera jeep-sqlite.
 */
export async function initSqliteWebStore(): Promise<void> {
  if (Capacitor.getPlatform() !== 'web') return;

  const { defineCustomElements } = await import('jeep-sqlite/loader');
  defineCustomElements(window);

  if (document.querySelector('jeep-sqlite') === null) {
    document.body.appendChild(document.createElement('jeep-sqlite'));
  }
  await customElements.whenDefined('jeep-sqlite');

  const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');
  await new SQLiteConnection(CapacitorSQLite).initWebStore();
}
