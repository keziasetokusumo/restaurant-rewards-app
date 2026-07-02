import { Reward } from '../types';

const MOCK: Reward[] = [
  { id: 'rw1', title: 'Free Es Teh', description: 'On any order at partner warungs', pointsCost: 200 },
  { id: 'rw2', title: 'Rp 25.000 off', description: 'Minimum spend Rp 100.000', pointsCost: 500 },
  { id: 'rw3', title: 'Free dessert', description: 'Try something new at a featured partner', pointsCost: 350, restaurantId: 'r4' },
];

export const rewardsService = {
  async getCatalog(): Promise<Reward[]> {
    await delay(250);
    return [...MOCK].sort((a, b) => a.pointsCost - b.pointsCost);
  },
};

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
