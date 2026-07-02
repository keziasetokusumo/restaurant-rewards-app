import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Dimensions,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Card from '../components/Card';
import { colors, radius, spacing, typography } from '../theme';
import {
  JAKARTA_AREA_COORDS,
  JAKARTA_AREA_SUGGESTIONS,
  restaurantsService,
} from '../services/restaurants';
import { Restaurant } from '../types';
import { RootStackParamList } from '../navigation/types';

// react-native-maps is native-only; import is guarded in render via Platform check
import MapView, { Marker } from 'react-native-maps';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type ViewMode = 'list' | 'map';

const SCREEN_WIDTH = Dimensions.get('window').width;
const MAP_CARD_WIDTH = Math.round(SCREEN_WIDTH * 0.8);
const MAP_CARD_STRIDE = MAP_CARD_WIDTH + spacing.md;

const JAKARTA_REGION = {
  latitude: -6.22,
  longitude: 106.815,
  latitudeDelta: 0.16,
  longitudeDelta: 0.16,
};

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [allRestaurants, setAllRestaurants] = useState<Restaurant[] | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const [committedLocation, setCommittedLocation] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);

  // Restaurant search/filter state
  const [restaurantQuery, setRestaurantQuery] = useState('');
  const [isRestaurantSearchFocused, setIsRestaurantSearchFocused] = useState(false);

  const mapRef = useRef<MapView>(null);
  const listRef = useRef<FlatList>(null);
  const restaurantsRef = useRef<Restaurant[] | null>(null);

  useEffect(() => {
    restaurantsService.getNearby().then((data) => {
      setAllRestaurants(data);
      restaurantsRef.current = data;
    });
  }, []);

  const suggestions = useMemo(() => {
    const q = locationQuery.trim().toLowerCase();
    if (!q) return JAKARTA_AREA_SUGGESTIONS;
    return JAKARTA_AREA_SUGGESTIONS.filter((a) => a.toLowerCase().includes(q));
  }, [locationQuery]);

  // Derived restaurant list — composes area filter + name/cuisine/tag search
  const restaurants = useMemo<Restaurant[] | null>(() => {
    if (!allRestaurants) return null;
    let result = allRestaurants;
    if (committedLocation) {
      const q = committedLocation.toLowerCase();
      result = result.filter((r) => r.area.toLowerCase().includes(q));
    }
    if (restaurantQuery.trim()) {
      const q = restaurantQuery.trim().toLowerCase();
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.cuisine.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return result;
  }, [allRestaurants, committedLocation, restaurantQuery]);

  // Keep restaurantsRef in sync with the displayed set (used for pin→list scroll)
  useEffect(() => {
    restaurantsRef.current = restaurants;
  }, [restaurants]);

  const panMapToArea = useCallback((area: string, filtered: Restaurant[]) => {
    const preset = JAKARTA_AREA_COORDS[area];
    if (preset) {
      mapRef.current?.animateToRegion(
        { latitude: preset.lat, longitude: preset.lng, latitudeDelta: 0.04, longitudeDelta: 0.04 },
        500,
      );
    } else if (filtered.length > 0) {
      const avgLat = filtered.reduce((s, r) => s + r.lat, 0) / filtered.length;
      const avgLng = filtered.reduce((s, r) => s + r.lng, 0) / filtered.length;
      mapRef.current?.animateToRegion(
        { latitude: avgLat, longitude: avgLng, latitudeDelta: 0.08, longitudeDelta: 0.08 },
        500,
      );
    }
  }, []);

  const handleSelectLocation = useCallback(
    (area: string) => {
      setLocationQuery(area);
      setCommittedLocation(area);
      setIsSearchFocused(false);
      setSelectedId(null);
      Keyboard.dismiss();
      if (allRestaurants) {
        const q = area.toLowerCase();
        const areaFiltered = allRestaurants.filter((r) => r.area.toLowerCase().includes(q));
        panMapToArea(area, areaFiltered);
      }
    },
    [allRestaurants, panMapToArea],
  );

  const handleClearLocation = useCallback(() => {
    setLocationQuery('');
    setCommittedLocation('');
    setIsSearchFocused(false);
    setSelectedId(null);
    Keyboard.dismiss();
    mapRef.current?.animateToRegion(JAKARTA_REGION, 500);
  }, []);

  const handleLocationTextChange = useCallback((text: string) => {
    setLocationQuery(text);
    if (!text.trim()) setCommittedLocation('');
  }, []);

  const handleClearRestaurantSearch = useCallback(() => {
    setRestaurantQuery('');
    setIsRestaurantSearchFocused(false);
    Keyboard.dismiss();
  }, []);

  const handleLocationSubmit = useCallback(() => {
    const q = locationQuery.trim();
    if (!q) { handleClearLocation(); return; }
    const exact = JAKARTA_AREA_SUGGESTIONS.find((a) => a.toLowerCase() === q.toLowerCase());
    handleSelectLocation(exact ?? (suggestions[0] ?? q));
  }, [locationQuery, suggestions, handleSelectLocation, handleClearLocation]);

  const isMapAvailable = Platform.OS !== 'web';

  // Pin tapped: highlight card and scroll the bottom list to it
  const onPinPress = useCallback((r: Restaurant) => {
    setSelectedId(r.id);
    mapRef.current?.animateToRegion(
      { latitude: r.lat, longitude: r.lng, latitudeDelta: 0.025, longitudeDelta: 0.025 },
      300,
    );
    const idx = restaurantsRef.current?.findIndex((x) => x.id === r.id) ?? -1;
    if (idx >= 0) listRef.current?.scrollToIndex({ index: idx, animated: true });
  }, []);

  // Bottom card scrolled into view: highlight the corresponding pin and pan map
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: any[] }) => {
    const r = viewableItems[0]?.item as Restaurant | undefined;
    if (!r) return;
    setSelectedId(r.id);
    mapRef.current?.animateToRegion(
      { latitude: r.lat, longitude: r.lng, latitudeDelta: 0.025, longitudeDelta: 0.025 },
      300,
    );
  }, []);

  const locationLabel = committedLocation ? committedLocation.toUpperCase() : 'JAKARTA';

  return (
    <View style={styles.root}>
      {/* ── Fixed header ── */}
      <View
        style={[styles.header, { paddingTop: insets.top + spacing.md }]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <Text style={[typography.label, { color: colors.primary }]}>NEARBY · {locationLabel}</Text>
        <View style={styles.headerRow}>
          <Text style={[typography.h1, { color: colors.ink }]}>Discover & earn</Text>
          {isMapAvailable && (
            <View style={styles.toggle}>
              <Pressable
                style={[styles.toggleBtn, viewMode === 'list' && styles.toggleBtnActive]}
                onPress={() => setViewMode('list')}
              >
                <Ionicons
                  name="list-outline"
                  size={15}
                  color={viewMode === 'list' ? colors.white : colors.inkMuted}
                />
                <Text style={[styles.toggleText, viewMode === 'list' && styles.toggleTextActive]}>
                  List
                </Text>
              </Pressable>
              <Pressable
                style={[styles.toggleBtn, viewMode === 'map' && styles.toggleBtnActive]}
                onPress={() => setViewMode('map')}
              >
                <Ionicons
                  name="map-outline"
                  size={15}
                  color={viewMode === 'map' ? colors.white : colors.inkMuted}
                />
                <Text style={[styles.toggleText, viewMode === 'map' && styles.toggleTextActive]}>
                  Map
                </Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* ── Location search bar ── */}
        <View style={[styles.searchBar, isSearchFocused && styles.searchBarFocused]}>
          <Ionicons
            name="location-outline"
            size={16}
            color={isSearchFocused ? colors.primary : colors.inkMuted}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search a neighborhood or area…"
            placeholderTextColor={colors.inkFaint}
            value={locationQuery}
            onChangeText={handleLocationTextChange}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 150)}
            onSubmitEditing={handleLocationSubmit}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="words"
          />
          {locationQuery.length > 0 && (
            <Pressable onPress={handleClearLocation} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.inkMuted} />
            </Pressable>
          )}
        </View>

        {/* ── Restaurant filter bar ── */}
        <View style={[styles.searchBar, isRestaurantSearchFocused && styles.searchBarFocused]}>
          <Ionicons
            name="search-outline"
            size={16}
            color={isRestaurantSearchFocused ? colors.primary : colors.inkMuted}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, cuisine, or tag…"
            placeholderTextColor={colors.inkFaint}
            value={restaurantQuery}
            onChangeText={setRestaurantQuery}
            onFocus={() => setIsRestaurantSearchFocused(true)}
            onBlur={() => setIsRestaurantSearchFocused(false)}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          {restaurantQuery.length > 0 && (
            <Pressable onPress={handleClearRestaurantSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.inkMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* ── Suggestions dropdown ── */}
      {isSearchFocused && suggestions.length > 0 && (
        <View style={[styles.suggestionsDropdown, { top: headerHeight }]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {suggestions.map((area, i) => (
              <Pressable
                key={area}
                style={[styles.suggestionRow, i === 0 && { borderTopWidth: 0 }]}
                onPress={() => handleSelectLocation(area)}
              >
                <Ionicons name="location-outline" size={14} color={colors.inkMuted} />
                <Text style={[typography.body, { color: colors.ink, flex: 1 }]}>{area}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── List view ── */}
      {(!isMapAvailable || viewMode === 'list') && (
        <FlatList
          data={restaurants ?? []}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + spacing.xl },
          ]}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={
            <Text style={[typography.body, { color: colors.inkFaint, marginTop: spacing.md }]}>
              {restaurants === null
                ? 'Finding spots near you…'
                : restaurantQuery.trim() && committedLocation
                ? `No results for "${restaurantQuery}" in ${committedLocation}.`
                : restaurantQuery.trim()
                ? `No restaurants match "${restaurantQuery}".`
                : committedLocation
                ? `No partner restaurants in ${committedLocation} yet.`
                : 'No spots found nearby.'}
            </Text>
          }
          renderItem={({ item: r }) => (
            <Card onPress={() => navigation.navigate('RestaurantDetail', { id: r.id })}>
              <View style={styles.cardRow}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={[typography.h2, { color: colors.ink }]}>{r.name}</Text>
                  <Text style={[typography.body, { color: colors.inkMuted }]}>
                    {r.cuisine} · {r.area} · {r.distanceKm} km
                  </Text>
                </View>
                {r.isNewToUser && <NewBadge label="NEW FOR YOU" />}
              </View>
              <View style={styles.metaRow}>
                <Text style={[typography.label, { color: colors.ink }]}>★ {r.rating.toFixed(1)}</Text>
                <Text style={[typography.label, { color: colors.accent }]}>
                  Earn {r.rewardRate}× points
                </Text>
              </View>
            </Card>
          )}
        />
      )}

      {/* ── Map view ── */}
      {isMapAvailable && viewMode === 'map' && (
        <View style={styles.mapContainer}>
          <MapView ref={mapRef} style={StyleSheet.absoluteFill} initialRegion={JAKARTA_REGION}>
            {(restaurants ?? []).map((r) => (
              <Marker
                key={r.id}
                coordinate={{ latitude: r.lat, longitude: r.lng }}
                onPress={() => onPinPress(r)}
                tracksViewChanges={false}
              >
                <PinMarker emoji={r.photos[0].emoji} isSelected={selectedId === r.id} />
              </Marker>
            ))}
          </MapView>

          {/* Loading state */}
          {restaurants === null && (
            <View style={styles.mapLoading}>
              <Text style={[typography.body, { color: colors.inkFaint }]}>
                Finding spots near you…
              </Text>
            </View>
          )}

          {/* Bottom horizontal card strip */}
          {restaurants !== null && (
            <View style={[styles.bottomStrip, { paddingBottom: insets.bottom + spacing.sm }]}>
              <FlatList
                ref={listRef}
                data={restaurants}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={(r) => r.id}
                contentContainerStyle={styles.bottomListContent}
                getItemLayout={(_, index) => ({
                  length: MAP_CARD_STRIDE,
                  offset: spacing.lg + MAP_CARD_STRIDE * index,
                  index,
                })}
                viewabilityConfig={viewabilityConfig}
                onViewableItemsChanged={onViewableItemsChanged}
                renderItem={({ item: r }) => (
                  <Pressable
                    style={[styles.mapCard, selectedId === r.id && styles.mapCardSelected]}
                    onPress={() => navigation.navigate('RestaurantDetail', { id: r.id })}
                  >
                    <View style={styles.cardRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <Text
                          style={[typography.h2, { color: colors.ink }]}
                          numberOfLines={1}
                        >
                          {r.name}
                        </Text>
                        <Text
                          style={[typography.body, { color: colors.inkMuted }]}
                          numberOfLines={1}
                        >
                          {r.cuisine} · {r.area} · {r.distanceKm} km
                        </Text>
                      </View>
                      {r.isNewToUser && <NewBadge label="NEW" />}
                    </View>
                    <View style={styles.metaRow}>
                      <Text style={[typography.label, { color: colors.ink }]}>
                        ★ {r.rating.toFixed(1)}
                      </Text>
                      <Text style={[typography.label, { color: colors.accent }]}>
                        Earn {r.rewardRate}× points
                      </Text>
                    </View>
                    <Text style={[typography.caption, { color: colors.primary }]}>
                      Tap to see details →
                    </Text>
                  </Pressable>
                )}
              />
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function PinMarker({ emoji, isSelected }: { emoji: string; isSelected: boolean }) {
  return (
    <View style={[styles.pin, isSelected && styles.pinSelected]}>
      <Text style={styles.pinEmoji}>{emoji}</Text>
    </View>
  );
}

function NewBadge({ label }: { label: string }) {
  return (
    <View style={styles.newBadge}>
      <Text style={[typography.caption, { color: colors.reward }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  // Header
  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  // Toggle pill
  toggle: {
    flexDirection: 'row',
    backgroundColor: colors.line,
    borderRadius: radius.pill,
    padding: 3,
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  toggleBtnActive: { backgroundColor: colors.primary },
  toggleText: { ...typography.caption, color: colors.inkMuted },
  toggleTextActive: { color: colors.white },

  // Shared card layout helpers
  cardRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  metaRow: { flexDirection: 'row', gap: spacing.md },
  newBadge: {
    backgroundColor: colors.rewardSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginLeft: spacing.sm,
    alignSelf: 'flex-start',
  },

  // List view
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },

  // Map view
  mapContainer: { flex: 1 },
  mapLoading: {
    position: 'absolute',
    bottom: spacing.xl,
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  // Bottom card strip
  bottomStrip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: spacing.sm,
  },
  bottomListContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  mapCard: {
    width: MAP_CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    padding: spacing.md,
    gap: spacing.xs,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  mapCardSelected: { borderColor: colors.primary },

  // Location search bar
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: spacing.sm,
    paddingVertical: Platform.OS === 'ios' ? spacing.sm : 4,
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  searchBarFocused: { borderColor: colors.primary },
  searchInput: {
    flex: 1,
    ...typography.body,
    color: colors.ink,
    padding: 0,
  },

  // Suggestions dropdown
  suggestionsDropdown: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 20,
    backgroundColor: colors.surface,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.line,
    maxHeight: 220,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  suggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },

  // Map pin marker
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 4,
    elevation: 4,
  },
  pinSelected: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    borderColor: colors.white,
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  pinEmoji: { fontSize: 20 },
});
