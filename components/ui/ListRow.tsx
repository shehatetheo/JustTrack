import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Haptic } from '@/constants/motion';
import { HAIRLINE, MIN_TAP, Radii, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/contexts/ThemeContext';
import { AppIcon, type AppIconName } from './AppIcon';
import { ThemedText } from './ThemedText';

interface ListRowProps {
  title: string;
  icon?: AppIconName;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  showChevron?: boolean;
  isLast?: boolean;
  accessory?: React.ReactNode;
}

/** A list row in the dashboard manner: a small ink icon, the title, a trailing value, a chevron. Pressing lights the row. */
export function ListRow({
  title,
  icon,
  value,
  onPress,
  destructive = false,
  showChevron = true,
  isLast = false,
  accessory,
}: ListRowProps) {
  const { colors } = useAppTheme();
  const titleColor = destructive ? colors.textSecondary : colors.text;

  const body = (
    <>
      {icon ? (
        <View style={[styles.iconTile, { borderColor: colors.border }]}>
          <AppIcon name={icon} size={15} color={destructive ? colors.textSecondary : colors.accentText} weight="semibold" />
        </View>
      ) : null}
      <View
        style={[
          styles.content,
          !isLast && { borderBottomWidth: HAIRLINE, borderBottomColor: colors.border },
        ]}
      >
        <ThemedText variant="body" style={{ color: titleColor, flexShrink: 1 }}>
          {title}
        </ThemedText>
        <View style={styles.trailing}>
          {value ? (
            <ThemedText variant="body" color="secondary">
              {value}
            </ThemedText>
          ) : null}
          {accessory}
          {showChevron && onPress ? <AppIcon name="chevronRight" size={14} color={colors.textTertiary} weight="semibold" /> : null}
        </View>
      </View>
    </>
  );

  // A row with nothing to open is plain layout, so a switch inside it stays reachable.
  if (!onPress) return <View style={[styles.row, { backgroundColor: colors.surface }]}>{body}</View>;

  return (
    <Pressable
      onPress={() => {
        Haptic.tap();
        onPress();
      }}
      accessibilityRole="button"
      style={({ pressed }) => [styles.row, { backgroundColor: pressed ? colors.surfaceRaised : colors.surface }]}
    >
      {body}
    </Pressable>
  );
}

interface ListSectionProps {
  title?: string;
  footer?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function ListSection({ title, children, footer, style }: ListSectionProps) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.section, style]}>
      {title ? (
        <ThemedText variant="overline" color="tertiary" style={styles.sectionTitle}>
          {title.toUpperCase()}
        </ThemedText>
      ) : null}
      <View style={[styles.sectionBody, { backgroundColor: colors.surface, borderColor: colors.border }]}>{children}</View>
      {footer ? (
        <ThemedText variant="footnote" color="secondary" style={styles.sectionFooter}>
          {footer}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: Spacing.lg,
    minHeight: MIN_TAP + 4,
  },
  iconTile: {
    width: 30,
    height: 30,
    borderRadius: Radii.md,
    borderWidth: HAIRLINE,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingRight: Spacing.lg,
    minHeight: 48,
  },
  trailing: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  section: { marginTop: Spacing['2xl'] },
  sectionTitle: { marginBottom: Spacing.sm, marginLeft: Spacing.xs },
  sectionBody: {
    borderRadius: Radii.lg,
    overflow: 'hidden',
    borderWidth: HAIRLINE,
  },
  sectionFooter: { marginTop: Spacing.sm, marginHorizontal: Spacing.xs },
});
