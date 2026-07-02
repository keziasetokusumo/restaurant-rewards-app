import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import Card from '../components/Card';
import { colors, radius, spacing, typography } from '../theme';
import { restaurantsService } from '../services/restaurants';
import { preferencesService } from '../services/preferences';
import { getRecommendations, DishRecommendation } from '../services/recommendations';
import { MenuItem, Restaurant, ReviewHighlight } from '../types';
import { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'RestaurantDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── helpers ──────────────────────────────────────────────────────────────────

const PRICE_LABEL = ['', 'Rp', 'Rp Rp', 'Rp Rp Rp', 'Rp Rp Rp Rp'] as const;

const CUISINE_CONFIG: Record<string, { emoji: string; bg: string }> = {
  'Padang':          { emoji: '🍛', bg: '#A84E2A' },
  'Coffee & Snacks': { emoji: '☕', bg: '#6B4C2F' },
  'Indonesian':      { emoji: '🍢', bg: '#9E622A' },
  'Noodles':         { emoji: '🍜', bg: '#A87220' },
  'Street Food':     { emoji: '🍳', bg: '#3D6B45' },
};
const DEFAULT_CONFIG = { emoji: '🍽️', bg: colors.primary } as const;

function formatIDR(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

function todayIsWeekend(): boolean {
  const d = new Date().getDay();
  return d === 0 || d === 6;
}

function isOpenNow(hours: Restaurant['hours']): boolean {
  const raw = todayIsWeekend() ? hours.weekends : hours.weekdays;
  const [openStr, closeStr] = raw.split('–');
  if (!openStr || !closeStr) return false;
  const toMins = (t: string) => {
    const [h, m] = t.trim().split(':').map(Number);
    return h * 60 + (m ?? 0);
  };
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const openMins = toMins(openStr);
  const closeMins = toMins(closeStr);
  if (closeMins < openMins) return nowMins >= openMins || nowMins < closeMins;
  return nowMins >= openMins && nowMins < closeMins;
}

function openDirections(lat: number, lng: number, name: string) {
  const label = encodeURIComponent(name);
  const nativeUrl = Platform.OS === 'ios'
    ? `maps:0,0?q=${label}@${lat},${lng}`
    : `geo:${lat},${lng}?q=${lat},${lng}(${label})`;
  Linking.canOpenURL(nativeUrl).then((ok) => {
    Linking.openURL(ok ? nativeUrl : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
  });
}

const DAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_FULL  = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function generateDates(count: number) {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const short = i === 0 ? 'Today' : `${DAY_SHORT[d.getDay()]} ${d.getDate()}`;
    const full = `${DAY_SHORT[d.getDay()]} ${d.getDate()} ${MON_SHORT[d.getMonth()]}`;
    return { key: d.toISOString().slice(0, 10), short, full: i === 0 ? `Today, ${full}` : full, date: d };
  });
}

function generateTimeSlots(hours: Restaurant['hours'], date: Date): string[] {
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const raw = isWeekend ? hours.weekends : hours.weekdays;
  const [openStr, closeStr] = raw.split('–');
  if (!openStr || !closeStr) return [];
  const toMins = (t: string) => {
    const [h, m] = t.trim().split(':').map(Number);
    return h * 60 + (m ?? 0);
  };
  const openMins = toMins(openStr);
  let closeMins = toMins(closeStr);
  if (closeMins < openMins) closeMins += 24 * 60;
  const slots: string[] = [];
  let cur = openMins + 30;
  while (cur <= closeMins - 60) {
    const h = Math.floor(cur / 60) % 24;
    slots.push(`${String(h).padStart(2, '0')}:00`);
    cur += 60;
  }
  return slots;
}

// ── sub-components ────────────────────────────────────────────────────────────

function SectionHeading({ title }: { title: string }) {
  return <Text style={[typography.h2, { color: colors.ink }]}>{title}</Text>;
}

function StarRating({ value, size = 13 }: { value: number; size?: number }) {
  const full = Math.floor(value);
  const stars = Array.from({ length: 5 }, (_, i) => i < full ? '★' : '☆');
  return (
    <Text style={{ fontSize: size, color: colors.accent, letterSpacing: 1 }}>
      {stars.join('')}
    </Text>
  );
}

// ── Photo gallery ─────────────────────────────────────────────────────────────

function PhotoGallery({ photos }: { photos: Restaurant['photos'] }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.galleryContent}
    >
      {photos.map((photo) => (
        <View key={photo.id} style={[styles.photoTile, { backgroundColor: photo.bg }]}>
          <Text style={styles.photoEmoji}>{photo.emoji}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ── Quick actions ─────────────────────────────────────────────────────────────

type QuickActionsProps = {
  onReserve: () => void;
  onMenu: () => void;
  onDirections: () => void;
};

function QuickActions({ onReserve, onMenu, onDirections }: QuickActionsProps) {
  return (
    <View style={qaStyles.row}>
      <Pressable
        style={({ pressed }) => [qaStyles.action, pressed && { opacity: 0.75 }]}
        onPress={onReserve}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Reserve a table"
      >
        <View style={qaStyles.iconBox}>
          <Ionicons name="calendar-outline" size={22} color={colors.primary} />
        </View>
        <Text style={[typography.caption, { color: colors.ink, marginTop: spacing.xs }]}>Reserve</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [qaStyles.action, pressed && { opacity: 0.75 }]}
        onPress={onMenu}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="View full menu"
      >
        <View style={qaStyles.iconBox}>
          <Ionicons name="restaurant-outline" size={22} color={colors.primary} />
        </View>
        <Text style={[typography.caption, { color: colors.ink, marginTop: spacing.xs }]}>Menu</Text>
      </Pressable>
      <Pressable
        style={({ pressed }) => [qaStyles.action, pressed && { opacity: 0.75 }]}
        onPress={onDirections}
        hitSlop={4}
        accessibilityRole="button"
        accessibilityLabel="Get directions"
      >
        <View style={qaStyles.iconBox}>
          <Ionicons name="navigate-outline" size={22} color={colors.primary} />
        </View>
        <Text style={[typography.caption, { color: colors.ink, marginTop: spacing.xs }]}>Directions</Text>
      </Pressable>
    </View>
  );
}

const qaStyles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  action: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ── Menu Modal ────────────────────────────────────────────────────────────────

function MenuModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[sheetStyles.root, { paddingTop: insets.top > 0 ? insets.top : spacing.lg }]}>
        <View style={sheetStyles.header}>
          <View>
            <Text style={[typography.h2, { color: colors.ink }]}>Menu</Text>
            <Text style={[typography.body, { color: colors.inkMuted }]}>{restaurant.name}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={sheetStyles.closeBtn} accessibilityLabel="Close menu">
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.md }}
        >
          <View style={menuSheetStyles.card}>
            {restaurant.menuHighlights.map((item, i) => (
              <React.Fragment key={item.id}>
                {i > 0 && <View style={styles.divider} />}
                <View style={menuSheetStyles.row}>
                  <View style={{ flex: 1, gap: spacing.xs }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flexWrap: 'wrap' }}>
                      <Text style={[typography.label, { color: colors.ink }]}>{item.name}</Text>
                      {item.isPopular && (
                        <View style={styles.popularBadge}>
                          <Text style={[typography.caption, { color: colors.primary }]}>🔥 Popular</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[typography.body, { color: colors.inkMuted }]}>{item.description}</Text>
                  </View>
                  <Text style={[typography.label, { color: colors.ink, marginLeft: spacing.md }]}>
                    {formatIDR(item.priceIdr)}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <Text style={[typography.caption, { color: colors.inkFaint, textAlign: 'center' }]}>
            Prices may vary. Full menu available at the restaurant.
          </Text>
        </ScrollView>
      </View>
    </Modal>
  );
}

const menuSheetStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
});

// ── Reservation Modal ─────────────────────────────────────────────────────────

const RESERVATION_DATES = generateDates(7);

function ReservationModal({ restaurant, onClose }: { restaurant: Restaurant; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const [selectedDateKey, setSelectedDateKey] = useState(RESERVATION_DATES[0].key);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [partySize, setPartySize] = useState(2);
  const [confirmed, setConfirmed] = useState(false);

  const selectedDate = RESERVATION_DATES.find((d) => d.key === selectedDateKey)!;
  const timeSlots = generateTimeSlots(restaurant.hours, selectedDate.date);

  const handleDateChange = (key: string) => {
    setSelectedDateKey(key);
    setSelectedTime(null);
  };

  if (confirmed) {
    return (
      <Modal
        visible
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <View style={[sheetStyles.root, resStyles.successRoot, { paddingBottom: insets.bottom + spacing.xl, paddingTop: insets.top > 0 ? insets.top + spacing.xl : spacing.xl * 2 }]}>
          <View style={resStyles.successCircle}>
            <Ionicons name="checkmark" size={38} color={colors.reward} />
          </View>
          <Text style={[typography.h1, { color: colors.ink, textAlign: 'center', marginTop: spacing.lg }]}>
            Reservation Confirmed!
          </Text>
          <Text style={[typography.bodyLg, { color: colors.inkMuted, textAlign: 'center', marginTop: spacing.xs }]}>
            {restaurant.name}
          </Text>

          <View style={resStyles.summaryCard}>
            <View style={resStyles.summaryRow}>
              <Text style={[typography.body, { color: colors.inkMuted }]}>Date</Text>
              <Text style={[typography.label, { color: colors.ink }]}>{selectedDate.full}</Text>
            </View>
            <View style={styles.divider} />
            <View style={resStyles.summaryRow}>
              <Text style={[typography.body, { color: colors.inkMuted }]}>Time</Text>
              <Text style={[typography.label, { color: colors.ink }]}>{selectedTime}</Text>
            </View>
            <View style={styles.divider} />
            <View style={resStyles.summaryRow}>
              <Text style={[typography.body, { color: colors.inkMuted }]}>Party</Text>
              <Text style={[typography.label, { color: colors.ink }]}>
                {partySize} {partySize === 1 ? 'guest' : 'guests'}
              </Text>
            </View>
          </View>

          <View style={resStyles.rewardNote}>
            <Text style={{ fontSize: 20 }}>⭐</Text>
            <Text style={[typography.body, { color: colors.reward, flex: 1 }]}>
              Scan QRIS when you arrive to earn {restaurant.rewardRate}% cashback on your meal.
            </Text>
          </View>

          <View style={{ alignSelf: 'stretch', marginTop: spacing.xl }}>
            <Button label="Done" onPress={onClose} />
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[sheetStyles.root, { paddingTop: insets.top > 0 ? insets.top : spacing.lg }]}>
        <View style={sheetStyles.header}>
          <View>
            <Text style={[typography.h2, { color: colors.ink }]}>Reserve a Table</Text>
            <Text style={[typography.body, { color: colors.inkMuted }]}>{restaurant.name}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={sheetStyles.closeBtn} accessibilityLabel="Close reservation">
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.lg, paddingBottom: insets.bottom + spacing.xl, gap: spacing.xl }}
        >
          {/* Date */}
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label, { color: colors.ink }]}>Date</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -spacing.lg }}
              contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
            >
              {RESERVATION_DATES.map((d) => {
                const active = selectedDateKey === d.key;
                return (
                  <Pressable
                    key={d.key}
                    onPress={() => handleDateChange(d.key)}
                    style={[resStyles.chip, active && resStyles.chipActive]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: active }}
                  >
                    <Text style={[typography.body, { color: active ? colors.white : colors.ink }]}>
                      {d.short}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Time */}
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label, { color: colors.ink }]}>Time</Text>
            {timeSlots.length === 0 ? (
              <Text style={[typography.body, { color: colors.inkMuted }]}>No slots available for this day.</Text>
            ) : (
              <View style={resStyles.timeGrid}>
                {timeSlots.map((slot) => {
                  const active = selectedTime === slot;
                  return (
                    <Pressable
                      key={slot}
                      onPress={() => setSelectedTime(slot)}
                      style={[resStyles.chip, resStyles.timeChip, active && resStyles.chipActive]}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                    >
                      <Text style={[typography.body, { color: active ? colors.white : colors.ink }]}>
                        {slot}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          {/* Party size */}
          <View style={{ gap: spacing.sm }}>
            <Text style={[typography.label, { color: colors.ink }]}>Party size</Text>
            <View style={resStyles.stepper}>
              <Pressable
                onPress={() => setPartySize((n) => Math.max(1, n - 1))}
                style={[resStyles.stepBtn, partySize <= 1 && { opacity: 0.35 }]}
                disabled={partySize <= 1}
                hitSlop={12}
                accessibilityLabel="Decrease party size"
              >
                <Ionicons name="remove" size={20} color={colors.ink} />
              </Pressable>
              <Text style={[typography.h2, { color: colors.ink, minWidth: 44, textAlign: 'center' }]}>
                {partySize}
              </Text>
              <Pressable
                onPress={() => setPartySize((n) => Math.min(10, n + 1))}
                style={[resStyles.stepBtn, partySize >= 10 && { opacity: 0.35 }]}
                disabled={partySize >= 10}
                hitSlop={12}
                accessibilityLabel="Increase party size"
              >
                <Ionicons name="add" size={20} color={colors.ink} />
              </Pressable>
            </View>
            <Text style={[typography.caption, { color: colors.inkMuted }]}>
              {partySize} {partySize === 1 ? 'guest' : 'guests'} · For groups larger than 10, call ahead
            </Text>
          </View>

          <Button
            label="Confirm Reservation"
            onPress={() => setConfirmed(true)}
            disabled={!selectedTime}
          />
        </ScrollView>
      </View>
    </Modal>
  );
}

// ── No-reservation sheet ──────────────────────────────────────────────────────

type NoReservationSheetProps = {
  restaurant: Restaurant;
  onClose: () => void;
};

function NoReservationSheet({ restaurant, onClose }: NoReservationSheetProps) {
  const insets = useSafeAreaInsets();

  const openWhatsApp = () => {
    if (!restaurant.whatsappNumber) return;
    const text = encodeURIComponent(
      `Halo ${restaurant.name}, saya ingin membuat reservasi meja. Boleh dibantu?`
    );
    Linking.openURL(`https://wa.me/${restaurant.whatsappNumber}?text=${text}`);
  };

  const openMapsSearch = () => {
    const query = encodeURIComponent(`${restaurant.name} ${restaurant.address}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${query}`);
  };

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="formSheet"
      onRequestClose={onClose}
    >
      <View style={[noResStyles.root, { paddingBottom: insets.bottom + spacing.xl }]}>
        {/* Handle bar */}
        <View style={noResStyles.handle} />

        <View style={noResStyles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[typography.h2, { color: colors.ink }]}>Make a Reservation</Text>
            <Text style={[typography.body, { color: colors.inkMuted }]} numberOfLines={1}>
              {restaurant.name}
            </Text>
          </View>
          <Pressable onPress={onClose} hitSlop={12} style={sheetStyles.closeBtn} accessibilityLabel="Close">
            <Ionicons name="close" size={22} color={colors.ink} />
          </Pressable>
        </View>

        <View style={noResStyles.body}>
          <Text style={[typography.body, { color: colors.inkMuted }]}>
            This restaurant doesn't have online reservations yet. You can search for availability or reach them directly.
          </Text>

          <Pressable
            style={({ pressed }) => [noResStyles.option, pressed && { opacity: 0.75 }]}
            onPress={openMapsSearch}
            accessibilityRole="link"
            accessibilityLabel="Find table on Google Maps"
          >
            <View style={[noResStyles.optionIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="search-outline" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: colors.ink }]}>Find a table online</Text>
              <Text style={[typography.caption, { color: colors.inkMuted }]}>
                Search Google Maps for availability
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </Pressable>

          {restaurant.whatsappNumber && (
            <Pressable
              style={({ pressed }) => [noResStyles.option, pressed && { opacity: 0.75 }]}
              onPress={openWhatsApp}
              accessibilityRole="link"
              accessibilityLabel="Message restaurant on WhatsApp"
            >
              <View style={[noResStyles.optionIcon, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontSize: 22 }}>💬</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[typography.label, { color: colors.ink }]}>Message on WhatsApp</Text>
                <Text style={[typography.caption, { color: colors.inkMuted }]}>
                  Chat directly with the restaurant
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const noResStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.line,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.lg,
  },
  body: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.md,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// Shared modal sheet styles
const sheetStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    marginBottom: spacing.md,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});

const resStyles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  timeChip: {
    minWidth: 72,
    alignItems: 'center',
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  stepBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Success state
  successRoot: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    justifyContent: 'flex-start',
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.rewardSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    alignSelf: 'stretch',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    marginTop: spacing.xl,
    gap: 0,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  rewardNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.rewardSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    alignSelf: 'stretch',
    marginTop: spacing.lg,
  },
});

// ── AI dish recommendations ───────────────────────────────────────────────────

type RecStatus = 'idle' | 'loading' | 'done' | 'error';

function RecommendedDishes({
  restaurantId,
  menuItems,
}: {
  restaurantId: string;
  menuItems: MenuItem[];
}) {
  const [status, setStatus] = useState<RecStatus>('idle');
  const [recs, setRecs] = useState<DishRecommendation[]>([]);

  const hasPrefs = preferencesService.hasAny();
  const prefs = preferencesService.get();

  useEffect(() => {
    if (!hasPrefs) return;
    setStatus('loading');
    getRecommendations(restaurantId, menuItems, prefs.dietary, prefs.cuisines)
      .then((data) => {
        setRecs(data);
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, [restaurantId]);

  if (!hasPrefs) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text style={{ fontSize: 18 }}>✨</Text>
        <SectionHeading title="Recommended for you" />
      </View>

      {status === 'loading' && (
        <View style={recStyles.card}>
          <ActivityIndicator color={colors.primary} size="small" />
          <Text style={[typography.body, { color: colors.inkMuted }]}>
            Personalising your picks…
          </Text>
        </View>
      )}

      {status === 'error' && (
        <View style={recStyles.card}>
          <Text style={[typography.body, { color: colors.inkMuted }]}>
            Couldn't load recommendations right now.
          </Text>
        </View>
      )}

      {status === 'done' && recs.length === 0 && (
        <View style={recStyles.card}>
          <Text style={[typography.body, { color: colors.inkMuted }]}>
            No dishes on the highlighted menu closely match your preferences — feel free to explore the full menu.
          </Text>
        </View>
      )}

      {status === 'done' && recs.length > 0 && (
        <View style={recStyles.dishList}>
          {recs.map((rec, i) => (
            <React.Fragment key={rec.dishName}>
              {i > 0 && <View style={{ height: 1, backgroundColor: colors.line }} />}
              <View style={recStyles.dishRow}>
                <View style={recStyles.dishIcon}>
                  <Text style={{ fontSize: 20 }}>🍽️</Text>
                </View>
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <Text style={[typography.label, { color: colors.ink }]}>{rec.dishName}</Text>
                  <Text style={[typography.body, { color: colors.inkMuted }]}>{rec.reason}</Text>
                </View>
              </View>
            </React.Fragment>
          ))}
        </View>
      )}
    </View>
  );
}

const recStyles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  dishList: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    gap: 0,
  },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  dishIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});

// ── Reward card ───────────────────────────────────────────────────────────────

function RewardCard({ restaurant }: { restaurant: Restaurant }) {
  const exampleSpend = 100000;
  const cashbackAmount = Math.round(exampleSpend * restaurant.rewardRate / 100);

  return (
    <View style={styles.rewardCard}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text style={[typography.caption, { color: colors.reward, letterSpacing: 0.6 }]}>
            CASHBACK ON EVERY VISIT
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, marginTop: spacing.xs }}>
            <Text style={styles.rewardRate}>{restaurant.rewardRate}%</Text>
            <Text style={[typography.body, { color: colors.inkMuted }]}>cashback</Text>
          </View>
        </View>
        <View style={styles.rewardIconBox}>
          <Text style={{ fontSize: 28 }}>⭐</Text>
        </View>
      </View>

      <View style={styles.pointsPreview}>
        <Text style={[typography.caption, { color: colors.reward }]}>
          {formatIDR(exampleSpend)} spend → get back {formatIDR(cashbackAmount)}
        </Text>
      </View>

      <Text style={[typography.body, { color: colors.inkMuted }]}>
        Scan QRIS at checkout to earn cashback automatically.
      </Text>

      {restaurant.isNewToUser && (
        <View style={styles.bonusBanner}>
          <Text style={{ fontSize: 18 }}>✨</Text>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[typography.label, { color: colors.reward }]}>First visit bonus</Text>
            <Text style={[typography.body, { color: colors.inkMuted }]}>
              Earn extra cashback the first time you dine here.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Popular dishes ────────────────────────────────────────────────────────────

function MenuHighlights({ items, onViewAll }: { items: MenuItem[]; onViewAll: () => void }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeading title="Popular dishes" />
        <Pressable onPress={onViewAll} hitSlop={8}>
          <Text style={[typography.body, { color: colors.primary }]}>Full menu</Text>
        </Pressable>
      </View>
      <View style={styles.menuCard}>
        {items.map((item, i) => (
          <React.Fragment key={item.id}>
            {i > 0 && <View style={styles.divider} />}
            <View style={styles.menuRow}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
                  <Text style={[typography.label, { color: colors.ink }]}>{item.name}</Text>
                  {item.isPopular && (
                    <View style={styles.popularBadge}>
                      <Text style={[typography.caption, { color: colors.primary }]}>🔥 Fav</Text>
                    </View>
                  )}
                </View>
                <Text style={[typography.body, { color: colors.inkMuted }]} numberOfLines={2}>
                  {item.description}
                </Text>
              </View>
              <Text style={[typography.label, { color: colors.ink, marginLeft: spacing.md }]}>
                {formatIDR(item.priceIdr)}
              </Text>
            </View>
          </React.Fragment>
        ))}
      </View>
    </View>
  );
}

// ── Reviews ───────────────────────────────────────────────────────────────────

function ReviewHighlights({ reviews, reviewCount }: { reviews: ReviewHighlight[]; reviewCount: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? reviews : reviews.slice(0, 2);

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeading title="What people say" />
        {reviews.length > 2 && (
          <Pressable onPress={() => setExpanded((x) => !x)} hitSlop={8}>
            <Text style={[typography.body, { color: colors.primary }]}>
              {expanded ? 'Less' : `See all ${reviewCount.toLocaleString('id-ID')}`}
            </Text>
          </Pressable>
        )}
      </View>
      {visible.map((review) => (
        <Card key={review.id}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={[typography.label, { color: colors.ink }]}>{review.author}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
              <StarRating value={review.rating} />
              <Text style={[typography.caption, { color: colors.inkMuted }]}>
                {review.rating.toFixed(1)}
              </Text>
            </View>
          </View>
          <Text style={[typography.body, { color: colors.inkMuted }]}>{review.text}</Text>
        </Card>
      ))}
    </View>
  );
}

// ── Hours ─────────────────────────────────────────────────────────────────────

function HoursSection({ hours }: { hours: Restaurant['hours'] }) {
  const [expanded, setExpanded] = useState(false);
  const todayIndex = new Date().getDay(); // 0 = Sun … 6 = Sat
  const open = isOpenNow(hours);

  const allDays = DAY_FULL.map((name, i) => ({
    name,
    hours: (i === 0 || i === 6) ? hours.weekends : hours.weekdays,
    isToday: i === todayIndex,
  }));

  const todayEntry = allDays[todayIndex];

  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <SectionHeading title="Hours" />
        <Pressable onPress={() => setExpanded((x) => !x)} hitSlop={8}>
          <Text style={[typography.body, { color: colors.primary }]}>
            {expanded ? 'Less' : 'See all'}
          </Text>
        </Pressable>
      </View>
      <Card>
        {/* Today — always visible */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[typography.label, { color: colors.ink }]}>Today</Text>
          <Text style={[typography.label, { color: open ? colors.reward : colors.inkMuted }]}>
            {todayEntry.hours}
          </Text>
        </View>

        {expanded && (
          <>
            <View style={styles.divider} />
            {allDays.map((day, i) => (
              <React.Fragment key={day.name}>
                {i > 0 && <View style={styles.divider} />}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs }}>
                  <Text style={[
                    typography.body,
                    { color: day.isToday ? colors.ink : colors.inkMuted },
                    day.isToday && { fontWeight: '600' },
                  ]}>
                    {day.name}{day.isToday ? ' · Today' : ''}
                  </Text>
                  <Text style={[
                    typography.body,
                    { color: day.isToday ? (open ? colors.reward : colors.inkMuted) : colors.inkFaint },
                    day.isToday && { fontWeight: '600' },
                  ]}>
                    {day.hours}
                  </Text>
                </View>
              </React.Fragment>
            ))}
          </>
        )}
      </Card>
    </View>
  );
}

// ── About ─────────────────────────────────────────────────────────────────────

function AboutSection({ restaurant, onDirections }: { restaurant: Restaurant; onDirections: () => void }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeading title="About" />
      <Card>
        <Text style={[typography.bodyLg, { color: colors.ink }]}>{restaurant.description}</Text>
        <View style={styles.divider} />
        <Pressable
          onPress={onDirections}
          style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, opacity: pressed ? 0.7 : 1 })}
          accessibilityRole="link"
          accessibilityLabel={`Get directions to ${restaurant.address}`}
        >
          <Text style={{ fontSize: 16, lineHeight: 22 }}>📍</Text>
          <Text style={[typography.body, { color: colors.primary, flex: 1, textDecorationLine: 'underline' }]}>
            {restaurant.address}
          </Text>
        </Pressable>
      </Card>
    </View>
  );
}

// ── Amenity tags ──────────────────────────────────────────────────────────────

function TagsRow({ tags }: { tags: string[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {tags.map((tag) => (
        <View key={tag} style={styles.tag}>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>{tag}</Text>
        </View>
      ))}
    </View>
  );
}

// ── Also nearby ───────────────────────────────────────────────────────────────

type NearbyCardProps = {
  restaurant: Restaurant;
  onPress: () => void;
};

function NearbyCard({ restaurant: r, onPress }: NearbyCardProps) {
  const config = CUISINE_CONFIG[r.cuisine] ?? DEFAULT_CONFIG;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.nearbyCard, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.nearbyHero, { backgroundColor: config.bg }]}>
        <Text style={{ fontSize: 36 }}>{config.emoji}</Text>
        {r.isNewToUser && (
          <View style={styles.nearbyNewBadge}>
            <Text style={[typography.caption, { color: colors.reward, fontSize: 10 }]}>NEW</Text>
          </View>
        )}
      </View>
      <View style={styles.nearbyBody}>
        <Text style={[typography.label, { color: colors.ink }]} numberOfLines={1}>{r.name}</Text>
        <Text style={[typography.caption, { color: colors.inkMuted }]} numberOfLines={1}>
          {r.cuisine} · {r.distanceKm} km
        </Text>
        <Text style={[typography.caption, { color: colors.accent }]}>
          ★ {r.rating.toFixed(1)} · {r.rewardRate}% cashback
        </Text>
      </View>
    </Pressable>
  );
}

function AlsoNearby({
  restaurants,
  onPress,
}: {
  restaurants: Restaurant[];
  onPress: (id: string) => void;
}) {
  if (restaurants.length === 0) return null;
  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeading title="Also nearby" />
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -spacing.lg }}
        contentContainerStyle={{ paddingHorizontal: spacing.lg, gap: spacing.sm }}
      >
        {restaurants.map((r) => (
          <NearbyCard key={r.id} restaurant={r} onPress={() => onPress(r.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

// ── screen ────────────────────────────────────────────────────────────────────

export default function RestaurantDetailScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [nearby, setNearby] = useState<Restaurant[]>([]);
  const [saved, setSaved] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reserveOpen, setReserveOpen] = useState(false);
  const [noReserveOpen, setNoReserveOpen] = useState(false);

  useEffect(() => {
    restaurantsService.getById(params.id).then((r) => setRestaurant(r ?? null));
  }, [params.id]);

  useEffect(() => {
    restaurantsService
      .getNearby()
      .then((all) => setNearby(all.filter((r) => r.id !== params.id).slice(0, 4)));
  }, [params.id]);

  if (!restaurant) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={[typography.body, { color: colors.inkFaint }]}>Loading…</Text>
      </View>
    );
  }

  const config = CUISINE_CONFIG[restaurant.cuisine] ?? DEFAULT_CONFIG;
  const open = isOpenNow(restaurant.hours);
  const todayHours = todayIsWeekend() ? restaurant.hours.weekends : restaurant.hours.weekdays;

  const handleDirections = () => openDirections(restaurant.lat, restaurant.lng, restaurant.name);
  const handleReserve = () => {
    if (restaurant.hasReservations) {
      setReserveOpen(true);
    } else {
      setNoReserveOpen(true);
    }
  };

  return (
    <View style={styles.root}>
      <ScrollView
        bounces
        contentInsetAdjustmentBehavior="never"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={[styles.hero, { backgroundColor: config.bg }]}>
          <Text style={styles.heroEmoji}>{config.emoji}</Text>
        </View>

        {/* ── Photo gallery ── */}
        <PhotoGallery photos={restaurant.photos} />

        {/* ── Content ── */}
        <View style={styles.content}>

          {/* Identity */}
          <View style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm }}>
              <Text style={[typography.h1, { color: colors.ink, flex: 1 }]}>{restaurant.name}</Text>
              {restaurant.isNewToUser && (
                <View style={styles.newBadge}>
                  <Text style={[typography.caption, { color: colors.reward }]}>NEW FOR YOU</Text>
                </View>
              )}
            </View>

            <Text style={[typography.bodyLg, { color: colors.inkMuted }]}>
              {restaurant.cuisine} · {restaurant.area}
            </Text>

            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={[typography.label, { color: colors.accent }]}>★ {restaurant.rating.toFixed(1)}</Text>
                <Text style={[typography.body, { color: colors.inkMuted }]}>
                  ({restaurant.reviewCount.toLocaleString('id-ID')})
                </Text>
              </View>
              <Text style={[typography.body, { color: colors.inkMuted }]}>
                · {restaurant.distanceKm} km · {PRICE_LABEL[restaurant.priceLevel]}
              </Text>
              <View style={[styles.openBadge, { backgroundColor: open ? colors.rewardSoft : colors.primarySoft }]}>
                <Text style={[typography.caption, { color: open ? colors.reward : colors.primary }]}>
                  {open
                    ? `Open · closes ${todayHours.split('–')[1]}`
                    : `Closed · opens ${todayHours.split('–')[0]}`}
                </Text>
              </View>
            </View>
          </View>

          {/* Amenity tags */}
          <TagsRow tags={restaurant.tags} />

          {/* Reward */}
          <RewardCard restaurant={restaurant} />

          {/* AI picks */}
          <RecommendedDishes restaurantId={restaurant.id} menuItems={restaurant.menuHighlights} />

          {/* Quick actions */}
          <QuickActions
            onReserve={handleReserve}
            onMenu={() => setMenuOpen(true)}
            onDirections={handleDirections}
          />

          {/* Hours */}
          <HoursSection hours={restaurant.hours} />

          {/* About */}
          <AboutSection restaurant={restaurant} onDirections={handleDirections} />

          {/* Menu */}
          <MenuHighlights items={restaurant.menuHighlights} onViewAll={() => setMenuOpen(true)} />

          {/* Reviews */}
          <ReviewHighlights reviews={restaurant.reviewHighlights} reviewCount={restaurant.reviewCount} />

          {/* Also nearby */}
          <AlsoNearby
            restaurants={nearby}
            onPress={(id) => navigation.push('RestaurantDetail', { id })}
          />

        </View>
      </ScrollView>

      {/* ── Back button ── */}
      <Pressable
        style={[styles.heroButton, { top: insets.top + spacing.sm, left: spacing.lg }]}
        onPress={() => navigation.goBack()}
        hitSlop={8}
      >
        <View style={styles.heroButtonCircle}>
          <Ionicons name="chevron-back" size={22} color={colors.white} />
        </View>
      </Pressable>

      {/* ── Save button ── */}
      <Pressable
        style={[styles.heroButton, { top: insets.top + spacing.sm, right: spacing.lg }]}
        onPress={() => setSaved((s) => !s)}
        hitSlop={8}
      >
        <View style={styles.heroButtonCircle}>
          <Ionicons
            name={saved ? 'heart' : 'heart-outline'}
            size={20}
            color={saved ? '#FF6B6B' : colors.white}
          />
        </View>
      </Pressable>

      {/* ── Sticky CTA ── */}
      <View style={[styles.stickyBottom, { paddingBottom: insets.bottom + spacing.md }]}>
        <Button
          label={`Pay & get ${restaurant.rewardRate}% cashback`}
          onPress={() =>
            navigation.navigate('RestaurantPay', {
              restaurantId: restaurant.id,
              restaurantName: restaurant.name,
              rewardRate: restaurant.rewardRate,
            })
          }
        />
      </View>

      {/* ── Modals ── */}
      {menuOpen && <MenuModal restaurant={restaurant} onClose={() => setMenuOpen(false)} />}
      {reserveOpen && <ReservationModal restaurant={restaurant} onClose={() => setReserveOpen(false)} />}
      {noReserveOpen && <NoReservationSheet restaurant={restaurant} onClose={() => setNoReserveOpen(false)} />}
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Hero
  hero: { height: 240, alignItems: 'center', justifyContent: 'center' },
  heroEmoji: { fontSize: 88, lineHeight: 110 },

  // Floating hero buttons (back + save)
  heroButton: { position: 'absolute' },
  heroButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Photo gallery
  galleryContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  photoTile: {
    width: 120,
    height: 90,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoEmoji: { fontSize: 36 },

  // Content
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 108,
    gap: spacing.xl,
  },

  // Identity badges
  newBadge: {
    backgroundColor: colors.rewardSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginTop: spacing.xs,
  },
  openBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },

  // Reward card
  rewardCard: {
    backgroundColor: colors.rewardSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  rewardRate: { fontSize: 44, fontWeight: '700', color: colors.ink, lineHeight: 52 },
  rewardIconBox: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pointsPreview: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    alignSelf: 'flex-start',
  },
  bonusBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
  },

  // Menu
  menuCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.md,
  },
  popularBadge: {
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },

  // Shared
  divider: { height: 1, backgroundColor: colors.line },

  // Tags
  tag: {
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },

  // Also nearby
  nearbyCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  nearbyHero: {
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyBody: {
    padding: spacing.sm,
    gap: 3,
  },
  nearbyNewBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: colors.rewardSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
  },

  // Sticky CTA
  stickyBottom: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
