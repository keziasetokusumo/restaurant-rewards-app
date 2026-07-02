export type TabParamList = {
  Home: undefined;
  Feed: undefined;
  Pay: undefined;
  Rewards: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Onboarding: undefined;
  Tabs: undefined;
  RestaurantDetail: { id: string };
  RestaurantPay: { restaurantId: string; restaurantName: string; rewardRate: number };
  Redeem: { rewardId: string };
  WalletPaymentMethods: undefined;
  Gastronomes: { initialTab?: 'following' | 'followers' };
};
