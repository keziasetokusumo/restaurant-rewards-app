import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import ScreenContainer from '../components/ScreenContainer';
import Card from '../components/Card';
import Button from '../components/Button';
import { colors, spacing, typography } from '../theme';
import { paymentsService } from '../services/payments';
import { PaymentMethod } from '../types';

export default function WalletPaymentMethodsScreen() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [linking, setLinking] = useState(false);

  const load = () => paymentsService.getMethods().then(setMethods);
  useEffect(() => {
    load();
  }, []);

  async function linkDemoCard() {
    setLinking(true);
    await paymentsService.linkCard({ number: '4111 1111 1111 7788', expiry: '12/28', cvc: '123' });
    await load();
    setLinking(false);
  }

  return (
    <ScreenContainer>
      <Text style={[typography.body, { color: colors.inkMuted }]}>
        Link a card or bank account to fund QRIS payments and top-ups.
      </Text>
      {methods.map((m) => (
        <Card key={m.id}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={[typography.bodyLg, { color: colors.ink }]}>{m.label}</Text>
            {m.isDefault && <Text style={[typography.caption, { color: colors.reward }]}>DEFAULT</Text>}
          </View>
        </Card>
      ))}
      <View style={{ gap: spacing.sm }}>
        <Button label="Link a card" loading={linking} onPress={linkDemoCard} />
        <Button label="Link a bank account" variant="secondary" onPress={() => { /* TODO: bank-link flow */ }} />
      </View>
    </ScreenContainer>
  );
}
