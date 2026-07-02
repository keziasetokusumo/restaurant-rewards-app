import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Button from '../components/Button';
import { colors, radius, spacing, typography } from '../theme';
import { paymentsService } from '../services/payments';
import { visitsService } from '../services/visits';

// ── Constants ──────────────────────────────────────────────────────────────────

const MOCK_MERCHANT = {
  id: 'r1',
  name: 'Warung Sambal Ijo',
  rewardRate: 5,
};

type PayMethod = 'qr' | 'bill' | 'amount';
type FlowState = 'input' | 'confirm' | 'processing' | 'success' | 'failed';

function formatIDR(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function parseIDR(raw: string): number {
  return parseInt(raw.replace(/[^\d]/g, ''), 10) || 0;
}

// ── Method tabs ────────────────────────────────────────────────────────────────

const METHODS: { id: PayMethod; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'qr',     label: 'Scan QR',   icon: 'qr-code-outline' },
  { id: 'bill',   label: 'Bill No.',  icon: 'receipt-outline' },
  { id: 'amount', label: 'Enter amt', icon: 'keypad-outline' },
];

function MethodTabs({ active, onChange }: { active: PayMethod; onChange: (m: PayMethod) => void }) {
  return (
    <View style={styles.tabs}>
      {METHODS.map((m) => {
        const selected = m.id === active;
        return (
          <Pressable
            key={m.id}
            style={[styles.tab, selected && styles.tabActive]}
            onPress={() => onChange(m.id)}
            hitSlop={4}
          >
            <Ionicons name={m.icon} size={16} color={selected ? colors.primary : colors.inkFaint} />
            <Text style={[typography.caption, { color: selected ? colors.primary : colors.inkFaint, fontWeight: selected ? '700' : '500' }]}>
              {m.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── QR Scanner mock ────────────────────────────────────────────────────────────

const VIEWFINDER = 220;

function QRScanner({ onScanned }: { onScanned: (amount: number) => void }) {
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'done'>('idle');
  const scanLine = useRef(new Animated.Value(0)).current;

  function startScan() {
    setScanState('scanning');
    scanLine.setValue(0);
    Animated.loop(
      Animated.timing(scanLine, { toValue: 1, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
    ).start();
    setTimeout(() => {
      setScanState('done');
      const amount = (85 + Math.floor(Math.random() * 20) * 5) * 1000;
      onScanned(amount);
    }, 2500);
  }

  const scanLineY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, VIEWFINDER] });

  return (
    <View style={styles.qrSection}>
      <Pressable
        onPress={scanState === 'idle' ? startScan : undefined}
        style={[styles.viewfinder, scanState !== 'idle' && { borderColor: colors.primary }]}
      >
        {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => (
          <View
            key={pos}
            style={[
              styles.corner,
              pos.includes('t') ? { top: -2 } : { bottom: -2 },
              pos.includes('l') ? { left: -2 } : { right: -2 },
              { borderColor: scanState !== 'idle' ? colors.primary : colors.inkMuted },
            ]}
          />
        ))}

        {scanState === 'idle' && (
          <View style={styles.qrIdle}>
            <Text style={{ fontSize: 48 }}>⬛</Text>
            <Text style={[typography.caption, { color: colors.inkFaint, textAlign: 'center' }]}>
              Tap to start scanning
            </Text>
          </View>
        )}

        {scanState === 'scanning' && (
          <>
            <Text style={[typography.caption, { color: colors.primary, textAlign: 'center' }]}>Scanning…</Text>
            <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanLineY }] }]} />
          </>
        )}

        {scanState === 'done' && (
          <View style={styles.qrIdle}>
            <Text style={{ fontSize: 40 }}>✅</Text>
            <Text style={[typography.caption, { color: colors.reward, textAlign: 'center' }]}>QR code detected</Text>
          </View>
        )}
      </Pressable>

      <Text style={[typography.body, { color: colors.inkMuted, textAlign: 'center' }]}>
        Point your camera at the QRIS code at {MOCK_MERCHANT.name}
      </Text>
    </View>
  );
}

// ── Bill number lookup ─────────────────────────────────────────────────────────

function BillLookup({ onResolved }: { onResolved: (amount: number, label: string) => void }) {
  const [billNumber, setBillNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleLookup() {
    if (!billNumber.trim()) { setError('Enter your bill or check number.'); return; }
    setError('');
    setLoading(true);
    try {
      const { amount, tableLabel } = await paymentsService.lookupBill(billNumber.trim(), MOCK_MERCHANT.id);
      onResolved(amount, tableLabel);
    } catch {
      setError('Could not find that bill. Check the number and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.inputSection}>
      <Text style={[typography.label, { color: colors.ink }]}>Bill or check number</Text>
      <Text style={[typography.body, { color: colors.inkMuted }]}>
        Find this on your printed receipt or ask your server.
      </Text>
      <TextInput
        style={styles.textInput}
        value={billNumber}
        onChangeText={setBillNumber}
        placeholder="e.g. T-05 or A42"
        placeholderTextColor={colors.inkFaint}
        autoCapitalize="characters"
        returnKeyType="search"
        onSubmitEditing={handleLookup}
      />
      {!!error && <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>}
      <Button label="Look up bill" loading={loading} onPress={handleLookup} />
    </View>
  );
}

// ── Manual amount entry ────────────────────────────────────────────────────────

function AmountEntry({ onConfirm }: { onConfirm: (amount: number) => void }) {
  const [raw, setRaw] = useState('');
  const [error, setError] = useState('');
  const amount = parseIDR(raw);
  const cashback = Math.round(amount * MOCK_MERCHANT.rewardRate / 100);

  function handleChange(text: string) {
    setRaw(text.replace(/[^\d]/g, ''));
    setError('');
  }

  function handleNext() {
    if (amount < 1000) { setError('Minimum payment is Rp 1.000.'); return; }
    onConfirm(amount);
  }

  return (
    <View style={styles.inputSection}>
      <Text style={[typography.label, { color: colors.ink }]}>Bill amount</Text>
      <Text style={[typography.body, { color: colors.inkMuted }]}>
        Enter the total from your receipt or bill.
      </Text>

      <View style={styles.amountRow}>
        <Text style={[typography.label, { color: colors.inkFaint, marginRight: spacing.xs }]}>Rp</Text>
        <TextInput
          style={styles.amountInput}
          value={raw ? parseInt(raw, 10).toLocaleString('id-ID') : ''}
          onChangeText={handleChange}
          keyboardType="number-pad"
          placeholder="0"
          placeholderTextColor={colors.inkFaint}
          returnKeyType="done"
        />
      </View>

      {amount >= 1000 && (
        <View style={styles.cashbackPreview}>
          <Text style={{ fontSize: 16 }}>⭐</Text>
          <Text style={[typography.body, { color: colors.reward }]}>
            You'll get back{' '}
            <Text style={{ fontWeight: '700' }}>{formatIDR(cashback)}</Text>
            {' '}cashback
          </Text>
        </View>
      )}

      {!!error && <Text style={[typography.caption, { color: colors.danger }]}>{error}</Text>}
      <Button label="Review payment" onPress={handleNext} disabled={amount < 1000} />
    </View>
  );
}

// ── Confirm card ───────────────────────────────────────────────────────────────

function ConfirmCard({
  amount,
  label,
  loading,
  onPay,
  onBack,
}: {
  amount: number;
  label: string;
  loading: boolean;
  onPay: () => void;
  onBack: () => void;
}) {
  const cashback = Math.round(amount * MOCK_MERCHANT.rewardRate / 100);

  return (
    <View style={styles.confirmWrapper}>
      <View style={styles.confirmCard}>
        <View style={styles.confirmRow}>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>MERCHANT</Text>
          <Text style={[typography.label, { color: colors.ink }]}>{MOCK_MERCHANT.name}</Text>
        </View>

        {!!label && (
          <View style={[styles.confirmRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md }]}>
            <Text style={[typography.caption, { color: colors.inkMuted }]}>REFERENCE</Text>
            <Text style={[typography.label, { color: colors.ink }]}>{label}</Text>
          </View>
        )}

        <View style={[styles.confirmRow, { borderTopWidth: 1, borderTopColor: colors.line, paddingTop: spacing.md }]}>
          <Text style={[typography.caption, { color: colors.inkMuted }]}>TOTAL</Text>
          <Text style={{ fontSize: 36, fontWeight: '700', color: colors.ink }}>{formatIDR(amount)}</Text>
        </View>

        <View style={styles.cashbackPreview}>
          <Text style={{ fontSize: 18 }}>⭐</Text>
          <Text style={[typography.body, { color: colors.reward }]}>
            Get back{' '}
            <Text style={{ fontWeight: '700' }}>{formatIDR(cashback)}</Text>
            {' '}· {MOCK_MERCHANT.rewardRate}% cashback
          </Text>
        </View>
      </View>

      <View style={{ gap: spacing.sm }}>
        <Button label="Confirm & pay" loading={loading} onPress={onPay} />
        <Pressable onPress={onBack} style={styles.backLink} hitSlop={8}>
          <Text style={[typography.body, { color: colors.inkMuted }]}>← Change amount</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Success ────────────────────────────────────────────────────────────────────

function SuccessView({ amount, cashbackEarned, onDone }: { amount: number; cashbackEarned: number; onDone: () => void }) {
  return (
    <View style={styles.successRoot}>
      <Text style={{ fontSize: 72 }}>🎉</Text>
      <Text style={[typography.h1, { color: colors.ink, textAlign: 'center' }]}>Payment sent!</Text>
      <Text style={[typography.bodyLg, { color: colors.inkMuted, textAlign: 'center' }]}>
        {formatIDR(amount)} paid to {MOCK_MERCHANT.name}
      </Text>
      <View style={styles.cashbackBanner}>
        <Text style={{ fontSize: 28 }}>⭐</Text>
        <View>
          <Text style={[typography.h2, { color: colors.reward }]}>
            +{formatIDR(cashbackEarned)} cashback
          </Text>
          <Text style={[typography.body, { color: colors.inkMuted }]}>Added to your rewards wallet</Text>
        </View>
      </View>
      <Button label="Done" onPress={onDone} />
    </View>
  );
}

// ── Screen ─────────────────────────────────────────────────────────────────────

export default function PayScreen() {
  const insets = useSafeAreaInsets();
  const [method, setMethod] = useState<PayMethod>('qr');
  const [flowState, setFlowState] = useState<FlowState>('input');
  const [pendingAmount, setPendingAmount] = useState(0);
  const [pendingLabel, setPendingLabel] = useState('');
  const [cashbackEarned, setCashbackEarned] = useState(0);

  useEffect(() => {
    if (flowState !== 'success') {
      setFlowState('input');
      setPendingAmount(0);
      setPendingLabel('');
    }
  }, [method]);

  async function handlePay() {
    setFlowState('processing');
    try {
      const result = await paymentsService.pay(pendingAmount, MOCK_MERCHANT.id, 'default');
      setCashbackEarned(Math.round(pendingAmount * MOCK_MERCHANT.rewardRate / 100));
      visitsService.record(MOCK_MERCHANT.id);
      setFlowState('success');
    } catch {
      setFlowState('failed');
    }
  }

  function reset() {
    setFlowState('input');
    setPendingAmount(0);
    setPendingLabel('');
    setMethod('qr');
  }

  if (flowState === 'success') {
    return (
      <View style={[styles.root, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <SuccessView amount={pendingAmount} cashbackEarned={cashbackEarned} onDone={reset} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <Text style={[typography.caption, { color: colors.primary }]}>SCAN & PAY</Text>
        <Text style={[typography.h1, { color: colors.ink }]}>QRIS</Text>
        <Text style={[typography.body, { color: colors.inkMuted }]}>{MOCK_MERCHANT.name}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {flowState === 'input' && <MethodTabs active={method} onChange={setMethod} />}

        {flowState === 'input' && method === 'qr' && (
          <QRScanner
            onScanned={(amount) => {
              setPendingAmount(amount);
              setPendingLabel('QRIS scan');
              setFlowState('confirm');
            }}
          />
        )}

        {flowState === 'input' && method === 'bill' && (
          <BillLookup
            onResolved={(amount, label) => {
              setPendingAmount(amount);
              setPendingLabel(label);
              setFlowState('confirm');
            }}
          />
        )}

        {flowState === 'input' && method === 'amount' && (
          <AmountEntry
            onConfirm={(amount) => {
              setPendingAmount(amount);
              setPendingLabel('');
              setFlowState('confirm');
            }}
          />
        )}

        {(flowState === 'confirm' || flowState === 'processing' || flowState === 'failed') && (
          <ConfirmCard
            amount={pendingAmount}
            label={pendingLabel}
            loading={flowState === 'processing'}
            onPay={handlePay}
            onBack={() => setFlowState('input')}
          />
        )}

        {flowState === 'failed' && (
          <Text style={[typography.body, { color: colors.danger, textAlign: 'center', marginTop: spacing.sm }]}>
            Payment failed — please try again.
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },

  header: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
    gap: 2,
  },

  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    gap: spacing.xl,
    flexGrow: 1,
  },

  // Method tabs
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  tabActive: { backgroundColor: colors.primarySoft },

  // QR scanner
  qrSection: { alignItems: 'center', gap: spacing.lg },
  viewfinder: {
    width: VIEWFINDER,
    height: VIEWFINDER,
    borderWidth: 2,
    borderColor: colors.line,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3,
    borderRadius: 2,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.primary,
    opacity: 0.8,
    top: 0,
  },
  qrIdle: { alignItems: 'center', gap: spacing.sm },

  // Bill + amount inputs
  inputSection: { gap: spacing.md },
  textInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.ink,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '700',
    color: colors.ink,
    paddingVertical: spacing.md,
  },
  cashbackPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.rewardSoft,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },

  // Confirm
  confirmWrapper: { gap: spacing.xl },
  confirmCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: spacing.lg,
    gap: spacing.md,
  },
  confirmRow: { gap: spacing.xs },
  backLink: { alignItems: 'center', paddingVertical: spacing.xs },

  // Success
  successRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
  },
  cashbackBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.rewardSoft,
    borderRadius: radius.lg,
    padding: spacing.lg,
    width: '100%',
  },
});
