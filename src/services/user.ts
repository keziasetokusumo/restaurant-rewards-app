import { Gastronome, UserProfile } from '../types';

const MOCK_PROFILE: UserProfile = {
  name: 'Kezia S.',
  initials: 'KS',
  avatarColor: '#E4451E',
  memberSince: 'March 2024',
  city: 'Jakarta',
  pointsBalance: 1240,
  followingCount: 12,
  followersCount: 47,
  totalCheckIns: 38,
  uniquePlacesDined: 14,
  wallet: {
    total: 187500,
    cashbackEarned: 87500,
    toppedUp: 100000,
  },
  favouriteSpots: [
    { restaurantId: 'r2', visitCount: 12, lastVisitedLabel: '2 days ago' },
    { restaurantId: 'r1', visitCount: 8,  lastVisitedLabel: 'Last week' },
    { restaurantId: 'r3', visitCount: 3,  lastVisitedLabel: 'Last month' },
  ],
};

// Mutable in-memory state so toggleFollow reflects immediately
let gastronomes: Gastronome[] = [
  { id: 'g1', name: 'Anya R.',   initials: 'AR', avatarColor: '#1E9E6A', city: 'Jakarta',   pointsBalance: 3840, isFollowing: true  },
  { id: 'g2', name: 'Budi S.',   initials: 'BS', avatarColor: '#F2B33D', city: 'Bandung',   pointsBalance: 920,  isFollowing: true  },
  { id: 'g3', name: 'Citra M.',  initials: 'CM', avatarColor: '#7C4DFF', city: 'Jakarta',   pointsBalance: 5210, isFollowing: true  },
  { id: 'g4', name: 'Dito P.',   initials: 'DP', avatarColor: '#0097A7', city: 'Surabaya',  pointsBalance: 2100, isFollowing: true  },
  { id: 'g5', name: 'Ela W.',    initials: 'EW', avatarColor: '#E4451E', city: 'Jakarta',   pointsBalance: 410,  isFollowing: true  },
  { id: 'g6', name: 'Farhan T.', initials: 'FT', avatarColor: '#558B2F', city: 'Yogyakarta',pointsBalance: 1680, isFollowing: true  },
  { id: 'g7', name: 'Gita N.',   initials: 'GN', avatarColor: '#AD1457', city: 'Jakarta',   pointsBalance: 780,  isFollowing: false },
  { id: 'g8', name: 'Hendra K.', initials: 'HK', avatarColor: '#4527A0', city: 'Bali',      pointsBalance: 6300, isFollowing: false },
  { id: 'g9', name: 'Indah L.',  initials: 'IL', avatarColor: '#00695C', city: 'Medan',     pointsBalance: 290,  isFollowing: false },
];

// g1–g6 follow the current user; g7–g9 also follow but aren't followed back
const FOLLOWER_IDS = new Set(['g1', 'g2', 'g3', 'g4', 'g7', 'g8', 'g9']);

export const userService = {
  async getProfile(): Promise<UserProfile> {
    await delay(200);
    const following = gastronomes.filter((g) => g.isFollowing);
    return {
      ...MOCK_PROFILE,
      wallet: { ...MOCK_PROFILE.wallet },
      favouriteSpots: [...MOCK_PROFILE.favouriteSpots],
      followingCount: following.length,
      followersCount: FOLLOWER_IDS.size,
    };
  },

  async getConnections(): Promise<{ following: Gastronome[]; followers: Gastronome[] }> {
    await delay(150);
    const following = gastronomes.filter((g) => g.isFollowing);
    const followers = gastronomes.filter((g) => FOLLOWER_IDS.has(g.id));
    return { following, followers };
  },

  async toggleFollow(id: string): Promise<Gastronome> {
    await delay(100);
    const g = gastronomes.find((x) => x.id === id);
    if (!g) throw new Error(`Gastronome ${id} not found`);
    g.isFollowing = !g.isFollowing;
    return { ...g };
  },
};

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}
