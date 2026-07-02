import { Text, View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function OnboardingScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.xxl, paddingBottom: insets.bottom + spacing.xl }]}>
      <View style={styles.hero}>
        <Text style={styles.emoji}>🍜</Text>
        <Text style={[typography.h1, { color: colors.ink, textAlign: 'center' }]}>
          Discover local eats,{'\n'}earn every visit
        </Text>
        <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center' }]}>
          Find the best warungs, kopitiams, and restaurants near you — and get rewarded for trying something new.
        </Text>
      </View>

      <View style={styles.actions}>
        <Button label="Get started" onPress={() => navigation.replace('Tabs')} />
        <Text style={[typography.caption, { color: colors.inkFaint, textAlign: 'center' }]}>
          By continuing you agree to our Terms & Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  emoji: {
    fontSize: 72,
  },
  actions: {
    gap: spacing.md,
  },
});
