type Prefs = {
  dietary: string[];
  cuisines: string[];
};

let stored: Prefs = { dietary: [], cuisines: [] };

export const preferencesService = {
  get(): Prefs {
    return stored;
  },
  set(dietary: string[], cuisines: string[]): void {
    stored = { dietary, cuisines };
  },
  hasAny(): boolean {
    return stored.dietary.length > 0 || stored.cuisines.length > 0;
  },
};
