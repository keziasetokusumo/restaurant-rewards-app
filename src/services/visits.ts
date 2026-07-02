// In-memory record of restaurants the user has paid at.
// In production this would be persisted to AsyncStorage / backend.

const visitedIds = new Set<string>();

export const visitsService = {
  record(restaurantId: string) {
    visitedIds.add(restaurantId);
  },
  hasVisited(restaurantId: string): boolean {
    return visitedIds.has(restaurantId);
  },
  getAll(): string[] {
    return Array.from(visitedIds);
  },
};
