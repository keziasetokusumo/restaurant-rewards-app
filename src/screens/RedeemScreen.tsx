import { useEffect, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { useNavigation } from '@react-navigation/native';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';
import { rewardsService } from '../services/rewards';
import { Reward } from '../types';
import { RootStackParamList } from '../navigation/types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type Route = RouteProp<RootStackParamList, 'Redeem'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RedeemScreen() {
  const { params } = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const [reward, setReward] = useState<Reward | null>(null);
  const [redeemed, setRedeemed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    rewardsService.getCatalog().then((list) => {
      setReward(list.find((r) => r.id === params.rewardId) ?? null);
    });
  }, [params.rewardId]);

  async function handleRedeem() {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setLoading(false);
    setRedeemed(true);
  }

  if (redeemed) {
    return (
      <ScreenContainer scroll={false}>
        <View style={styles.center}>
          <Text style={{ fontSize: 64 }}>🎁</Text>
          <Text style={[typography.h1, { color: colors.ink, textAlign: 'center' }]}>Reward redeemed!</Text>
          <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center' }]}>
            Show this screen to the restaurant to claim your reward.
          </Text>
          {reward && (
            <Card>
              <Text style={[typography.h2, { color: colors.ink, textAlign: 'center' }]}>{reward.title}</Text>
              <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center' }]}>{reward.description}</Text>
            </Card>
          )}
          <Button label="Done" onPress={() => navigation.goBack()} />
        </View>
      </ScreenContainer>
    );
  }

  if (!reward) {
    return (
      <ScreenContainer>
        <Text style={[typography.body, { color: colors.inkFaint }]}>Loading…</Text>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <Card>
        <Text style={[typography.h2, { color: colors.ink }]}>{reward.title}</Text>
        <Text style={[typography.body, { color: colors.inkMuted }]}>{reward.description}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Text style={[typography.label, { color: colors.accent }]}>{reward.pointsCost} pts</Text>
          <Text style={[typography.body, { color: colors.inkFaint }]}>will be deducted</Text>
        </View>
      </Card>

      <Button label="Confirm redeem" loading={loading} onPress={handleRedeem} />
      <Button label="Cancel" variant="secondary" onPress={() => navigation.goBack()} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
});
