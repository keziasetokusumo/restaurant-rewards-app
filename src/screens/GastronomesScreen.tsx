import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';
import { userService } from '../services/user';
import { Gastronome } from '../types';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'Gastronomes'>;

type Tab = 'following' | 'followers';

function getTier(pts: number): { label: string; color: string; bg: string } {
  if (pts >= 5000) return { label: 'Gastronome', color: '#B07A00', bg: '#FEF3D7' };
  if (pts >= 2000) return { label: 'Gourmand',   color: colors.reward, bg: colors.rewardSoft };
  if (pts >= 500)  return { label: 'Regular',    color: colors.inkMuted, bg: colors.line };
  return                  { label: 'Foodie',     color: colors.primary, bg: colors.primarySoft };
}

// ── Avatar circle ─────────────────────────────────────────────────────────────

function AvatarCircle({
  initials,
  color,
  size = 48,
}: {
  initials: string;
  color: string;
  size?: number;
}) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }]}>{initials}</Text>
    </View>
  );
}

// ── Gastronome row ────────────────────────────────────────────────────────────

function GastronomeRow({
  gastronome,
  onToggleFollow,
}: {
  gastronome: Gastronome;
  onToggleFollow: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const tier = getTier(gastronome.pointsBalance);

  async function handlePress() {
    if (loading) return;
    setLoading(true);
    await onToggleFollow(gastronome.id);
    setLoading(false);
  }

  return (
    <View style={styles.row}>
      <AvatarCircle initials={gastronome.initials} color={gastronome.avatarColor} />

      <View style={styles.rowBody}>
        <Text style={[typography.label, { color: colors.ink }]}>{gastronome.name}</Text>
        <View style={styles.rowMeta}>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>{gastronome.city}</Text>
          <View style={[styles.tierBadge, { backgroundColor: tier.bg }]}>
            <Text style={[typography.caption, { color: tier.color, fontWeight: '700' }]}>
              {tier.label}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        onPress={handlePress}
        style={[
          styles.followBtn,
          gastronome.isFollowing
            ? styles.followBtnActive
            : styles.followBtnIdle,
        ]}
        hitSlop={8}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={gastronome.isFollowing ? colors.inkMuted : colors.white}
          />
        ) : (
          <Text
            style={[
              typography.caption,
              {
                fontWeight: '700',
                color: gastronome.isFollowing ? colors.inkMuted : colors.white,
              },
            ]}
          >
            {gastronome.isFollowing ? 'Following' : 'Follow'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

// ── Tab bar ───────────────────────────────────────────────────────────────────

function TabBar({
  active,
  followingCount,
  followersCount,
  onChange,
}: {
  active: Tab;
  followingCount: number;
  followersCount: number;
  onChange: (t: Tab) => void;
}) {
  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: 'following', label: 'Following', count: followingCount },
    { key: 'followers', label: 'Followers', count: followersCount },
  ];

  return (
    <View style={styles.tabBar}>
      {tabs.map((t) => (
        <Pressable
          key={t.key}
          onPress={() => onChange(t.key)}
          style={[styles.tabItem, active === t.key && styles.tabItemActive]}
        >
          <Text
            style={[
              typography.label,
              { color: active === t.key ? colors.primary : colors.inkMuted },
            ]}
          >
            {t.count.toLocaleString('id-ID')} {t.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function GastronomesScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<Tab>(route.params?.initialTab ?? 'following');
  const [following, setFollowing] = useState<Gastronome[]>([]);
  const [followers, setFollowers] = useState<Gastronome[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    userService.getConnections().then(({ following: f, followers: r }) => {
      setFollowing(f);
      setFollowers(r);
      setLoading(false);
    });
  }, []);

  const handleToggleFollow = useCallback(async (id: string) => {
    const updated = await userService.toggleFollow(id);
    setFollowing((prev) =>
      updated.isFollowing
        ? prev.some((g) => g.id === id) ? prev.map((g) => (g.id === id ? updated : g)) : [...prev, updated]
        : prev.filter((g) => g.id !== id),
    );
    setFollowers((prev) => prev.map((g) => (g.id === id ? updated : g)));
  }, []);

  const list = activeTab === 'following' ? following : followers;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </Pressable>
        <Text style={[typography.h2, { color: colors.ink }]}>Gastronomes</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tab bar */}
      <TabBar
        active={activeTab}
        followingCount={following.length}
        followersCount={followers.length}
        onChange={setActiveTab}
      />

      {/* List */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={list}
          keyExtractor={(g) => g.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => (
            <GastronomeRow gastronome={item} onToggleFollow={handleToggleFollow} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={{ fontSize: 36 }}>
                {activeTab === 'following' ? '🍽️' : '👀'}
              </Text>
              <Text style={[typography.label, { color: colors.ink, textAlign: 'center' }]}>
                {activeTab === 'following'
                  ? "You're not following anyone yet"
                  : 'No followers yet'}
              </Text>
              <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center' }]}>
                {activeTab === 'following'
                  ? 'Find fellow food lovers and follow them to see where they dine.'
                  : 'Dine at more partner restaurants to grow your gastronome circle.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: colors.primary,
  },

  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    color: colors.white,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  rowBody: {
    flex: 1,
    gap: spacing.xs,
  },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tierBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },

  followBtn: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minWidth: 88,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
  },
  followBtnIdle: {
    backgroundColor: colors.primary,
  },
  followBtnActive: {
    backgroundColor: colors.line,
  },

  separator: {
    height: 1,
    backgroundColor: colors.line,
  },

  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xxxl,
    paddingHorizontal: spacing.xl,
  },
});
