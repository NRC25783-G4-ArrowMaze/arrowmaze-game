interface I18nDict {
  [key: string]: string | I18nDict;
}

const ES: I18nDict = {
  c3: {
    title: 'Selecciona un nivel',
    locked: {
      notice: 'Completa los niveles previos para desbloquear',
    },
    status: {
      blocked: 'Bloqueado',
      available: 'Disponible',
      completed: 'Completado',
    },
  },
};

function getNestedValue(obj: I18nDict, path: string): string {
  const parts = path.split('.');
  let current: any = obj;
  for (const part of parts) {
    current = current?.[part];
    if (current === undefined) return path;
  }
  return typeof current === 'string' ? current : path;
}

export function t(key: string): string {
  return getNestedValue(ES, key);
}
