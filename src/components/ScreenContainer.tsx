import { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme';

type Props = { children: ReactNode; scroll?: boolean };

export default function ScreenContainer({ children, scroll = true }: Props) {
  const insets = useSafeAreaInsets();
  const pad = { paddingTop: insets.top + spacing.md, paddingBottom: insets.bottom + spacing.xl };
  if (scroll) {
    return (
      <ScrollView style={styles.fill} contentContainerStyle={[styles.content, pad]}>
        {children}
      </ScrollView>
    );
  }
  return <View style={[styles.fill, styles.content, pad]}>{children}</View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.lg, gap: spacing.lg },
});
