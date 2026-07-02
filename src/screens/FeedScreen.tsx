import React, { useCallback, useEffect, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '../theme';
import { restaurantsService } from '../services/restaurants';
import { visitsService } from '../services/visits';
import { Restaurant } from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────

type FeedUser = { name: string; avatarColor: string };

type FeedPost = {
  id: string;
  user: FeedUser;
  restaurantName: string;
  restaurantArea: string;
  foodEmoji: string;
  foodBg: string;
  rating: number;
  caption: string;
  likeCount: number;
  commentCount: number;
  minutesAgo: number;
  liked: boolean;
};

// ── Mock data ──────────────────────────────────────────────────────────────────

const MOCK_POSTS: FeedPost[] = [
  {
    id: 'f1',
    user: { name: 'Rina Susanti', avatarColor: '#E8976A' },
    restaurantName: 'Warung Sambal Ijo',
    restaurantArea: 'Kemang',
    foodEmoji: '🍛',
    foodBg: '#A84E2A',
    rating: 5,
    caption: 'Rendangnya LUAR BIASA! Dagingnya super empuk dan bumbunya meresap sempurna. Wajib coba kalau lagi di Kemang 🔥',
    likeCount: 24,
    commentCount: 3,
    minutesAgo: 120,
    liked: false,
  },
  {
    id: 'f2',
    user: { name: 'Dito Pratama', avatarColor: '#6A9EE8' },
    restaurantName: 'Kopi Tuku Corner',
    restaurantArea: 'Cipete',
    foodEmoji: '☕',
    foodBg: '#6B4C2F',
    rating: 4,
    caption: 'Morning vibes di Tuku! Kopi susu sama pisang bakar — combo sempurna buat mulai hari 💻☀️',
    likeCount: 18,
    commentCount: 5,
    minutesAgo: 200,
    liked: true,
  },
  {
    id: 'f3',
    user: { name: 'Ayuna Kirana', avatarColor: '#8BC47A' },
    restaurantName: 'Sate Khas Senayan',
    restaurantArea: 'Senayan',
    foodEmoji: '🍢',
    foodBg: '#9E622A',
    rating: 5,
    caption: 'Udah 5 tahun jadi langganan sini. Sate kambing bakar arang batok kelapanya emang nggak ada tandingannya 🙌',
    likeCount: 41,
    commentCount: 9,
    minutesAgo: 420,
    liked: false,
  },
  {
    id: 'f4',
    user: { name: 'Bagas Nugroho', avatarColor: '#C47ABA' },
    restaurantName: 'Bakmi Gang Kelinci',
    restaurantArea: 'Menteng',
    foodEmoji: '🍜',
    foodBg: '#A87220',
    rating: 4,
    caption: 'Antriannya panjang tapi worth it banget! Bakmi goreng special-nya kenyal dan aromanya harum 🍜',
    likeCount: 12,
    commentCount: 2,
    minutesAgo: 600,
    liked: false,
  },
  {
    id: 'f5',
    user: { name: 'Sella Maharani', avatarColor: '#E86A6A' },
    restaurantName: 'Nasi Goreng Kambing Kebon Sirih',
    restaurantArea: 'Kebon Sirih',
    foodEmoji: '🍳',
    foodBg: '#3D6B45',
    rating: 5,
    caption: 'Late night makan di Pak Udin — nasi goreng kambingnya bikin nagih. Enak banget apalagi pas ujan 🌙',
    likeCount: 33,
    commentCount: 7,
    minutesAgo: 900,
    liked: false,
  },
];

const CUISINE_EMOJI: Record<string, string> = {
  'Padang': '🍛',
  'Coffee & Snacks': '☕',
  'Indonesian': '🍢',
  'Noodles': '🍜',
  'Street Food': '🍳',
};

function formatTime(minutesAgo: number): string {
  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  if (minutesAgo < 1440) return `${Math.floor(minutesAgo / 60)}h ago`;
  return `${Math.floor(minutesAgo / 1440)}d ago`;
}

// ── Avatar ─────────────────────────────────────────────────────────────────────

function Avatar({ name, color, size = 38 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: colors.white, fontSize: Math.round(size * 0.38), fontWeight: '700' }}>
        {initials}
      </Text>
    </View>
  );
}

// ── Star display / picker ──────────────────────────────────────────────────────

function Stars({ value, size = 16, onChange }: { value: number; size?: number; onChange?: (v: number) => void }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange?.(n)} hitSlop={6} disabled={!onChange}>
          <Text style={{ fontSize: size, color: n <= value ? colors.accent : colors.line }}>★</Text>
        </Pressable>
      ))}
    </View>
  );
}

// ── Post card ──────────────────────────────────────────────────────────────────

function PostCard({ post, onToggleLike }: { post: FeedPost; onToggleLike: (id: string) => void }) {
  return (
    <View style={cardStyles.root}>
      {/* Header */}
      <View style={cardStyles.header}>
        <Avatar name={post.user.name} color={post.user.avatarColor} />
        <View style={{ flex: 1 }}>
          <Text style={[typography.label, { color: colors.ink }]}>{post.user.name}</Text>
          <Text style={[typography.caption, { color: colors.inkMuted }]} numberOfLines={1}>
            at {post.restaurantName} · {post.restaurantArea}
          </Text>
        </View>
        <Text style={[typography.caption, { color: colors.inkFaint }]}>{formatTime(post.minutesAgo)}</Text>
      </View>

      {/* Photo */}
      <View style={[cardStyles.photo, { backgroundColor: post.foodBg }]}>
        <Text style={cardStyles.photoEmoji}>{post.foodEmoji}</Text>
      </View>

      {/* Rating + caption */}
      <View style={cardStyles.body}>
        <Stars value={post.rating} size={18} />
        {post.caption.length > 0 && (
          <Text style={[typography.body, { color: colors.ink, lineHeight: 22 }]}>{post.caption}</Text>
        )}
      </View>

      {/* Actions */}
      <View style={cardStyles.actions}>
        <Pressable
          style={({ pressed }) => [cardStyles.action, pressed && { opacity: 0.7 }]}
          onPress={() => onToggleLike(post.id)}
          hitSlop={8}
        >
          <Ionicons name={post.liked ? 'heart' : 'heart-outline'} size={20} color={post.liked ? '#FF6B6B' : colors.inkMuted} />
          <Text style={[typography.caption, { color: post.liked ? '#FF6B6B' : colors.inkMuted }]}>
            {post.likeCount}
          </Text>
        </Pressable>
        <View style={cardStyles.action}>
          <Ionicons name="chatbubble-outline" size={18} color={colors.inkMuted} />
          <Text style={[typography.caption, { color: colors.inkMuted }]}>{post.commentCount}</Text>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  root: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
  },
  photo: {
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 80 },
  body: {
    padding: spacing.md,
    gap: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.lg,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});

// ── New post sheet ─────────────────────────────────────────────────────────────

type NewPostDraft = Omit<FeedPost, 'id' | 'likeCount' | 'commentCount' | 'minutesAgo' | 'liked'>;

function NewPostSheet({ onClose, onSubmit }: { onClose: () => void; onSubmit: (draft: NewPostDraft) => void }) {
  const insets = useSafeAreaInsets();
  const [visitedRestaurants, setVisitedRestaurants] = useState<Restaurant[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selected, setSelected] = useState<Restaurant | null>(null);
  const [rating, setRating] = useState(0);
  const [caption, setCaption] = useState('');

  useEffect(() => {
    const visitedIds = new Set(visitsService.getAll());
    restaurantsService.getNearby().then((all) => {
      setVisitedRestaurants(all.filter((r) => visitedIds.has(r.id)));
      setLoaded(true);
    });
  }, []);

  const allRestaurants = visitedRestaurants;

  const canSubmit = selected !== null && rating > 0;

  const handleSubmit = () => {
    if (!selected) return;
    onSubmit({
      user: { name: 'You', avatarColor: colors.primary },
      restaurantName: selected.name,
      restaurantArea: selected.area,
      foodEmoji: CUISINE_EMOJI[selected.cuisine] ?? '🍽️',
      foodBg: selected.photos[0]?.bg ?? colors.primary,
      rating,
      caption: caption.trim(),
    });
    onClose();
  };

  const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[sheetStyles.root, { paddingTop: insets.top > 0 ? insets.top : spacing.lg }]}>
        <View style={sheetStyles.header}>
          <Text style={[typography.h2, { color: colors.ink }]}>Share your experience</Text>
          <Pressable onPress={onClose} hitSlop={12} style={sheetStyles.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.xl }}
        >
          {/* Restaurant picker */}
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label, { color: colors.ink }]}>Where did you dine?</Text>
            {loaded && allRestaurants.length === 0 ? (
              <View style={sheetStyles.emptyVisits}>
                <Text style={{ fontSize: 36 }}>🍽️</Text>
                <Text style={[typography.label, { color: colors.ink, textAlign: 'center' }]}>
                  No verified visits yet
                </Text>
                <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center' }]}>
                  Pay at a partner restaurant to leave a review. Your visit is verified automatically at checkout.
                </Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -spacing.lg }}
                contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
              >
                {allRestaurants.map((r) => {
                  const isSelected = selected?.id === r.id;
                  return (
                    <Pressable
                      key={r.id}
                      onPress={() => setSelected(r)}
                      style={[sheetStyles.restChip, isSelected && sheetStyles.restChipActive]}
                    >
                      <Text style={{ fontSize: 22 }}>{CUISINE_EMOJI[r.cuisine] ?? '🍽️'}</Text>
                      <View>
                        <Text
                          style={[typography.label, { color: isSelected ? colors.white : colors.ink }]}
                          numberOfLines={1}
                        >
                          {r.name}
                        </Text>
                        <Text style={[typography.caption, { color: isSelected ? 'rgba(255,255,255,0.7)' : colors.inkMuted }]}>
                          {r.area}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Rating */}
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label, { color: colors.ink }]}>Your rating</Text>
            <Stars value={rating} size={38} onChange={setRating} />
            {rating > 0 && (
              <Text style={[typography.body, { color: colors.inkMuted }]}>{RATING_LABELS[rating]}</Text>
            )}
          </View>

          {/* Caption */}
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label, { color: colors.ink }]}>Add a comment <Text style={{ color: colors.inkFaint, fontWeight: '400' }}>(optional)</Text></Text>
            <TextInput
              style={sheetStyles.captionInput}
              placeholder="What did you love about it?"
              placeholderTextColor={colors.inkFaint}
              value={caption}
              onChangeText={setCaption}
              multiline
              textAlignVertical="top"
              maxLength={280}
            />
            <Text style={[typography.caption, { color: colors.inkFaint, textAlign: 'right' }]}>
              {caption.length}/280
            </Text>
          </View>

          {/* Submit */}
          <Pressable
            style={[sheetStyles.submitBtn, !canSubmit && { opacity: 0.4 }]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={[typography.label, { color: colors.white, fontSize: 14 }]}>Share with friends</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const sheetStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.sm,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    maxWidth: 200,
  },
  restChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyVisits: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xl,
  },
  captionInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
    ...typography.body,
    color: colors.ink,
    minHeight: 110,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
  },
});

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function FeedScreen() {
  const insets = useSafeAreaInsets();
  const [posts, setPosts] = useState<FeedPost[]>(MOCK_POSTS);
  const [showNewPost, setShowNewPost] = useState(false);

  const toggleLike = useCallback((id: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, liked: !p.liked, likeCount: p.liked ? p.likeCount - 1 : p.likeCount + 1 }
          : p,
      ),
    );
  }, []);

  const handleNewPost = useCallback((draft: NewPostDraft) => {
    setPosts((prev) => [{ ...draft, id: `f${Date.now()}`, likeCount: 0, commentCount: 0, minutesAgo: 0, liked: false }, ...prev]);
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[feedStyles.header, { paddingTop: insets.top + spacing.md }]}>
        <View>
          <Text style={[typography.label, { color: colors.primary }]}>SOCIAL</Text>
          <Text style={[typography.h1, { color: colors.ink }]}>Friends' feed</Text>
        </View>
        <Pressable
          style={feedStyles.addBtn}
          onPress={() => setShowNewPost(true)}
          hitSlop={8}
          accessibilityLabel="Post a dining experience"
          accessibilityRole="button"
        >
          <Ionicons name="add" size={22} color={colors.white} />
        </Pressable>
      </View>

      <FlatList
        data={posts}
        keyExtractor={(p) => p.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: insets.bottom + 100 }}
        renderItem={({ item }) => <PostCard post={item} onToggleLike={toggleLike} />}
        ListEmptyComponent={
          <Text style={[typography.body, { color: colors.inkFaint, textAlign: 'center', marginTop: spacing.xl }]}>
            No posts yet — be the first to share!
          </Text>
        }
      />

      {showNewPost && <NewPostSheet onClose={() => setShowNewPost(false)} onSubmit={handleNewPost} />}
    </View>
  );
}

const feedStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
});
