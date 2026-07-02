import React, { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { colors, radius, spacing, typography } from '../theme';
import { userService } from '../services/user';
import { restaurantsService } from '../services/restaurants';
import { preferencesService } from '../services/preferences';
import { FavouriteSpot, Gastronome, Restaurant, UserProfile } from '../types';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

function formatIDR(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

const CUISINE_CONFIG: Record<string, { emoji: string; bg: string }> = {
  'Padang':          { emoji: '🍛', bg: '#A84E2A' },
  'Coffee & Snacks': { emoji: '☕', bg: '#6B4C2F' },
  'Indonesian':      { emoji: '🍢', bg: '#9E622A' },
  'Noodles':         { emoji: '🍜', bg: '#A87220' },
  'Street Food':     { emoji: '🍳', bg: '#3D6B45' },
};
const DEFAULT_CONFIG = { emoji: '🍽️', bg: colors.primary };

// ── Avatar ────────────────────────────────────────────────────────────────────

function Avatar({ initials, color }: { initials: string; color: string }) {
  function handleEditPress() {
    Alert.alert('Change photo', 'Photo upload is coming soon.');
  }

  return (
    <View style={styles.avatarWrapper}>
      <View style={[styles.avatarCircle, { backgroundColor: color }]}>
        <Text style={styles.avatarInitials}>{initials}</Text>
      </View>
      <Pressable
        onPress={handleEditPress}
        hitSlop={8}
        style={styles.avatarEditBadge}
      >
        <Ionicons name="camera" size={14} color={colors.white} />
      </Pressable>
    </View>
  );
}

// ── Wallet card ───────────────────────────────────────────────────────────────

function WalletCard({
  wallet,
  onTopUp,
}: {
  wallet: UserProfile['wallet'];
  onTopUp: () => void;
}) {
  return (
    <View style={styles.walletCard}>
      {/* Header row */}
      <View style={styles.walletHeader}>
        <View style={{ gap: spacing.xs }}>
          <Text style={[typography.caption, { color: colors.inkMuted, letterSpacing: 0.6 }]}>
            WALLET BALANCE
          </Text>
          <Text style={styles.walletTotal}>{formatIDR(wallet.total)}</Text>
        </View>
        <Button label="Top up" variant="secondary" onPress={onTopUp} />
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Breakdown */}
      <View style={{ gap: spacing.sm }}>
        <View style={styles.walletRow}>
          <View style={styles.walletRowLeft}>
            <View style={[styles.walletDot, { backgroundColor: colors.rewardSoft }]}>
              <Text style={{ fontSize: 14 }}>💰</Text>
            </View>
            <Text style={[typography.body, { color: colors.inkMuted }]}>Cashback earned</Text>
          </View>
          <Text style={[typography.label, { color: colors.reward }]}>
            {formatIDR(wallet.cashbackEarned)}
          </Text>
        </View>

        <View style={styles.walletRow}>
          <View style={styles.walletRowLeft}>
            <View style={[styles.walletDot, { backgroundColor: colors.primarySoft }]}>
              <Text style={{ fontSize: 14 }}>⬆️</Text>
            </View>
            <Text style={[typography.body, { color: colors.inkMuted }]}>Topped up</Text>
          </View>
          <Text style={[typography.label, { color: colors.ink }]}>
            {formatIDR(wallet.toppedUp)}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ── Favourite spot row ────────────────────────────────────────────────────────

function FavSpotRow({
  restaurant,
  visitCount,
  lastVisitedLabel,
  onPress,
}: {
  restaurant: Restaurant;
  visitCount: number;
  lastVisitedLabel: string;
  onPress: () => void;
}) {
  const config = CUISINE_CONFIG[restaurant.cuisine] ?? DEFAULT_CONFIG;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.favRow, pressed && { opacity: 0.75 }]}
    >
      {/* Emoji circle */}
      <View style={[styles.favEmoji, { backgroundColor: config.bg }]}>
        <Text style={{ fontSize: 22 }}>{config.emoji}</Text>
      </View>

      {/* Text */}
      <View style={styles.favBody}>
        <Text style={[typography.label, { color: colors.ink }]} numberOfLines={1}>
          {restaurant.name}
        </Text>
        <Text style={[typography.caption, { color: colors.inkMuted }]}>
          {restaurant.cuisine} · {restaurant.area} · {lastVisitedLabel}
        </Text>
      </View>

      {/* Visit count + chevron */}
      <View style={styles.favRight}>
        <View style={styles.visitBadge}>
          <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
            {visitCount}×
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />
      </View>
    </Pressable>
  );
}

// ── Dining stats strip ────────────────────────────────────────────────────────

function DiningStats({
  checkIns,
  places,
}: {
  checkIns: number;
  places: number;
}) {
  return (
    <View style={statStyles.strip}>
      <View style={statStyles.cell}>
        <Text style={statStyles.value}>{checkIns}</Text>
        <Text style={statStyles.label}>Check-ins</Text>
      </View>
      <View style={statStyles.divider} />
      <View style={statStyles.cell}>
        <Text style={statStyles.value}>{places}</Text>
        <Text style={statStyles.label}>Places tried</Text>
      </View>
    </View>
  );
}

const statStyles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignSelf: 'stretch',
    marginTop: spacing.xs,
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  divider: {
    width: 1,
    height: 32,
    backgroundColor: colors.line,
    marginHorizontal: spacing.md,
  },
  value: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  label: {
    fontSize: 12,
    color: colors.inkMuted,
    letterSpacing: 0.2,
  },
});

// ── Dining preferences ────────────────────────────────────────────────────────

const DIETARY_OPTIONS: { label: string; emoji: string }[] = [
  { label: 'Halal',        emoji: '✅' },
  { label: 'Vegetarian',   emoji: '🥦' },
  { label: 'Vegan',        emoji: '🌱' },
  { label: 'Gluten-free',  emoji: '🌾' },
  { label: 'Dairy-free',   emoji: '🥛' },
  { label: 'No pork',      emoji: '🚫' },
  { label: 'No shellfish', emoji: '🦞' },
  { label: 'No nuts',      emoji: '🥜' },
];

const CUISINE_OPTIONS: { label: string; emoji: string }[] = [
  { label: 'Indonesian',      emoji: '🍢' },
  { label: 'Padang',          emoji: '🍛' },
  { label: 'Noodles',         emoji: '🍜' },
  { label: 'Street Food',     emoji: '🍳' },
  { label: 'Coffee & Snacks', emoji: '☕' },
  { label: 'Japanese',        emoji: '🍱' },
  { label: 'Western',         emoji: '🍔' },
  { label: 'Seafood',         emoji: '🐟' },
  { label: 'Grilled',         emoji: '🔥' },
  { label: 'Desserts',        emoji: '🍨' },
];

function ToggleChip({
  label,
  emoji,
  selected,
  onToggle,
}: {
  label: string;
  emoji: string;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      hitSlop={4}
      style={[prefStyles.chip, selected && prefStyles.chipSelected]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <Text style={{ fontSize: 13 }}>{emoji}</Text>
      <Text style={[typography.caption, { color: selected ? colors.white : colors.inkMuted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function DiningPrefsSection({
  dietary,
  cuisines,
  onToggleDietary,
  onToggleCuisine,
}: {
  dietary: string[];
  cuisines: string[];
  onToggleDietary: (label: string) => void;
  onToggleCuisine: (label: string) => void;
}) {
  return (
    <View style={styles.section}>
      <Text style={[typography.h2, { color: colors.ink }]}>Dining preferences</Text>
      <View style={prefStyles.card}>
        <View style={prefStyles.group}>
          <Text style={[typography.label, { color: colors.ink }]}>Dietary restrictions</Text>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>
            We'll flag partner restaurants that meet your needs.
          </Text>
          <View style={prefStyles.chipRow}>
            {DIETARY_OPTIONS.map(({ label, emoji }) => (
              <ToggleChip
                key={label}
                label={label}
                emoji={emoji}
                selected={dietary.includes(label)}
                onToggle={() => onToggleDietary(label)}
              />
            ))}
          </View>
        </View>

        <View style={styles.divider} />

        <View style={prefStyles.group}>
          <Text style={[typography.label, { color: colors.ink }]}>Preferred cuisines</Text>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>
            We'll prioritise these when surfacing new restaurants to you.
          </Text>
          <View style={prefStyles.chipRow}>
            {CUISINE_OPTIONS.map(({ label, emoji }) => (
              <ToggleChip
                key={label}
                label={label}
                emoji={emoji}
                selected={cuisines.includes(label)}
                onToggle={() => onToggleCuisine(label)}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const prefStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  group: { gap: spacing.sm },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
});

// ── Settings row ──────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.settingsRow, pressed && { opacity: 0.7 }]}
    >
      <Ionicons name={icon} size={20} color={danger ? colors.danger : colors.inkMuted} />
      <Text
        style={[
          typography.body,
          { flex: 1, color: danger ? colors.danger : colors.ink },
        ]}
      >
        {label}
      </Text>
      {!danger && <Ionicons name="chevron-forward" size={16} color={colors.inkFaint} />}
    </Pressable>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [allRestaurants, setAllRestaurants] = useState<Restaurant[]>([]);
  const [following, setFollowing] = useState<Gastronome[]>([]);
  const [dietaryPrefs, setDietaryPrefs] = useState<string[]>([]);
  const [cuisinePrefs, setCuisinePrefs] = useState<string[]>([]);

  function handleToggleDietary(item: string) {
    const next = dietaryPrefs.includes(item)
      ? dietaryPrefs.filter((x) => x !== item)
      : [...dietaryPrefs, item];
    setDietaryPrefs(next);
    preferencesService.set(next, cuisinePrefs);
  }

  function handleToggleCuisine(item: string) {
    const next = cuisinePrefs.includes(item)
      ? cuisinePrefs.filter((x) => x !== item)
      : [...cuisinePrefs, item];
    setCuisinePrefs(next);
    preferencesService.set(dietaryPrefs, next);
  }

  useEffect(() => {
    Promise.all([
      userService.getProfile(),
      restaurantsService.getNearby(),
      userService.getConnections(),
    ]).then(([p, r, { following: f }]) => {
      setProfile(p);
      setAllRestaurants(r);
      setFollowing(f);
    });
  }, []);

  const enrichedSpots: Array<{ spot: FavouriteSpot; restaurant: Restaurant }> =
    profile?.favouriteSpots
      .map((spot) => {
        const restaurant = allRestaurants.find((r) => r.id === spot.restaurantId);
        return restaurant ? { spot, restaurant } : null;
      })
      .filter((x): x is { spot: FavouriteSpot; restaurant: Restaurant } => x !== null) ?? [];

  if (!profile) {
    return (
      <View style={[styles.root, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={[typography.body, { color: colors.inkFaint }]}>Loading…</Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xxxl },
        ]}
      >

        {/* ── Identity ── */}
        <View style={styles.identitySection}>
          <Avatar initials={profile.initials} color={profile.avatarColor} />
          <View style={{ gap: spacing.xs, alignItems: 'center' }}>
            <Text style={[typography.h1, { color: colors.ink, textAlign: 'center' }]}>
              {profile.name}
            </Text>
            <Text style={[typography.body, { color: colors.inkMuted }]}>
              Member since {profile.memberSince} · {profile.city}
            </Text>
            <View style={styles.pointsBadge}>
              <Text style={{ fontSize: 14 }}>⭐</Text>
              <Text style={[typography.label, { color: colors.accent }]}>
                {profile.pointsBalance.toLocaleString('id-ID')} pts
              </Text>
            </View>
            {/* Social stats */}
            <View style={styles.socialStats}>
              <Pressable
                onPress={() => navigation.navigate('Gastronomes', { initialTab: 'following' })}
                style={({ pressed }) => [styles.statPill, pressed && { opacity: 0.7 }]}
              >
                <Text style={[typography.label, { color: colors.ink }]}>
                  {profile.followingCount}
                </Text>
                <Text style={[typography.caption, { color: colors.inkMuted }]}> Following</Text>
              </Pressable>
              <View style={styles.statDot} />
              <Pressable
                onPress={() => navigation.navigate('Gastronomes', { initialTab: 'followers' })}
                style={({ pressed }) => [styles.statPill, pressed && { opacity: 0.7 }]}
              >
                <Text style={[typography.label, { color: colors.ink }]}>
                  {profile.followersCount}
                </Text>
                <Text style={[typography.caption, { color: colors.inkMuted }]}> Followers</Text>
              </Pressable>
            </View>
            {/* Dining activity stats */}
            <DiningStats
              checkIns={profile.totalCheckIns}
              places={profile.uniquePlacesDined}
            />
          </View>
        </View>

        {/* ── Wallet ── */}
        <View style={styles.section}>
          <WalletCard
            wallet={profile.wallet}
            onTopUp={() => navigation.navigate('WalletPaymentMethods')}
          />
        </View>

        {/* ── Gastronomes strip ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[typography.h2, { color: colors.ink }]}>Gastronomes</Text>
            <Pressable
              onPress={() => navigation.navigate('Gastronomes', { initialTab: 'following' })}
              hitSlop={8}
            >
              <Text style={[typography.caption, { color: colors.primary, fontWeight: '700' }]}>
                See all
              </Text>
            </Pressable>
          </View>

          {following.length === 0 ? (
            <View style={styles.emptySpots}>
              <Text style={{ fontSize: 32 }}>🍴</Text>
              <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center' }]}>
                Follow other food lovers to see where they're dining.
              </Text>
            </View>
          ) : (
            <FlatList
              data={following}
              keyExtractor={(g) => g.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gastronomeStrip}
              ItemSeparatorComponent={() => <View style={{ width: spacing.md }} />}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => navigation.navigate('Gastronomes', { initialTab: 'following' })}
                  style={({ pressed }) => [styles.gastronomeChip, pressed && { opacity: 0.7 }]}
                >
                  <View style={[styles.chipAvatar, { backgroundColor: item.avatarColor }]}>
                    <Text style={styles.chipInitials}>{item.initials}</Text>
                  </View>
                  <Text
                    style={[typography.caption, { color: colors.inkMuted, textAlign: 'center' }]}
                    numberOfLines={1}
                  >
                    {item.name.split(' ')[0]}
                  </Text>
                </Pressable>
              )}
            />
          )}
        </View>

        {/* ── Favourite spots ── */}
        <View style={styles.section}>
          <Text style={[typography.h2, { color: colors.ink }]}>Favourite spots</Text>

          {enrichedSpots.length === 0 ? (
            <View style={styles.emptySpots}>
              <Text style={{ fontSize: 32 }}>🗺️</Text>
              <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center' }]}>
                Dine at a partner restaurant and it'll show up here.
              </Text>
            </View>
          ) : (
            <View style={styles.favList}>
              {enrichedSpots.map(({ spot, restaurant }, i) => (
                <React.Fragment key={restaurant.id}>
                  {i > 0 && <View style={styles.divider} />}
                  <FavSpotRow
                    restaurant={restaurant}
                    visitCount={spot.visitCount}
                    lastVisitedLabel={spot.lastVisitedLabel}
                    onPress={() => navigation.navigate('RestaurantDetail', { id: restaurant.id })}
                  />
                </React.Fragment>
              ))}
            </View>
          )}
        </View>

        {/* ── Dining preferences ── */}
        <DiningPrefsSection
          dietary={dietaryPrefs}
          cuisines={cuisinePrefs}
          onToggleDietary={handleToggleDietary}
          onToggleCuisine={handleToggleCuisine}
        />

        {/* ── Settings ── */}
        <View style={styles.section}>
          <Text style={[typography.h2, { color: colors.ink }]}>Account</Text>
          <View style={styles.settingsList}>
            <SettingsRow
              icon="card-outline"
              label="Payment methods"
              onPress={() => navigation.navigate('WalletPaymentMethods')}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="language-outline"
              label="Language"
              onPress={() => Alert.alert('Language', 'Bahasa Indonesia / English — coming soon.')}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="notifications-outline"
              label="Notifications"
              onPress={() => Alert.alert('Notifications', 'Notification settings coming soon.')}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="help-circle-outline"
              label="Help & support"
              onPress={() => Alert.alert('Help', 'Support coming soon.')}
            />
            <View style={styles.divider} />
            <SettingsRow
              icon="log-out-outline"
              label="Sign out"
              onPress={() => Alert.alert('Sign out', 'Are you sure?', [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign out', style: 'destructive', onPress: () => {} },
              ])}
              danger
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  scroll: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },

  // Identity
  identitySection: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatarWrapper: { position: 'relative', width: 88, height: 88 },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 1,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  pointsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.rewardSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  // Wallet card
  walletCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  walletTotal: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.ink,
    letterSpacing: -0.5,
  },
  walletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  walletRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  walletDot: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Favourite spots
  favList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  favRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  favEmoji: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  favBody: { flex: 1, gap: 3 },
  favRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  visitBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  emptySpots: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
  },

  // Settings
  settingsList: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    minHeight: 52,
  },

  // Social stats
  socialStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  statPill: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  statDot: {
    width: 3,
    height: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.inkFaint,
  },

  // Gastronome strip
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gastronomeStrip: {
    paddingVertical: spacing.xs,
  },
  gastronomeChip: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 56,
  },
  chipAvatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipInitials: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    letterSpacing: 0.5,
  },

  // Shared
  section: { gap: spacing.md },
  divider: { height: 1, backgroundColor: colors.line },
});
