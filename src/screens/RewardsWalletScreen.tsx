import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';
import { rewardsService } from '../services/rewards';
import { Reward } from '../types';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MOCK_POINTS = 1240;

export default function RewardsWalletScreen() {
  const navigation = useNavigation<Nav>();
  const [rewards, setRewards] = useState<Reward[] | null>(null);

  useEffect(() => {
    rewardsService.getCatalog().then(setRewards);
  }, []);

  return (
    <ScreenContainer>
      <Card>
        <Text style={[typography.caption, { color: colors.inkMuted }]}>YOUR POINTS</Text>
        <Text style={{ fontSize: 40, fontWeight: '700', color: colors.accent }}>
          {MOCK_POINTS.toLocaleString('id-ID')}
        </Text>
        <Text style={[typography.body, { color: colors.inkMuted }]}>points available to redeem</Text>
      </Card>

      <Text style={[typography.h2, { color: colors.ink }]}>Available rewards</Text>

      {rewards === null ? (
        <Text style={[typography.body, { color: colors.inkFaint }]}>Loading…</Text>
      ) : (
        rewards.map((r) => (
          <Card key={r.id}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[typography.h2, { color: colors.ink }]}>{r.title}</Text>
                <Text style={[typography.body, { color: colors.inkMuted }]}>{r.description}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: spacing.sm }}>
                <Text style={[typography.label, { color: colors.accent }]}>{r.pointsCost} pts</Text>
                <Button
                  label="Redeem"
                  disabled={MOCK_POINTS < r.pointsCost}
                  onPress={() => navigation.navigate('Redeem', { rewardId: r.id })}
                />
              </View>
            </View>
          </Card>
        ))
      )}
    </ScreenContainer>
  );
}
