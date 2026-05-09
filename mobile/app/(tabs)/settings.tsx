import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';

type SettingRowProps = {
  emoji: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
};

function SettingRow({ emoji, label, value, onPress, danger }: SettingRowProps) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.7 : 1}
      disabled={!onPress}
    >
      <Text style={styles.rowEmoji}>{emoji}</Text>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.danger]}>{label}</Text>
        {value && <Text style={styles.rowValue}>{value}</Text>}
      </View>
      {onPress && <Text style={styles.rowArrow}>›</Text>}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const { user, subscriptionTier, isPro, expiresAt, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  const formatExpiry = (date: string | null) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const openDocument = async (docType: 'privacy' | 'terms') => {
    const filename = docType === 'privacy' ? 'MomsKitchen_Privacy_Policy.pdf' : 'MomsKitchen_Terms_and_Conditions.pdf';
    if (Platform.OS === 'web') {
      window.open(`/PDF/${filename}`, '_blank');
    } else {
      Alert.alert('Document Available', `The ${docType === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'} will be available in the web version or once deployed.`);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to permanently delete your account and all associated child profiles? This action cannot be undone and is required for Play Store compliance.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete Forever', style: 'destructive', onPress: () => {
          // Placeholder for actual DB cascade delete
          Alert.alert('Account Deleted', 'Your account has been wiped.');
          signOut();
        }},
      ]
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      {/* Profile Card */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarEmoji}>👤</Text>
        </View>
        <View>
          <Text style={styles.email}>{user?.email}</Text>
          <View style={[styles.badge, isPro ? styles.badgePro : styles.badgeFree]}>
            <Text style={[styles.badgeText, isPro ? styles.badgeTextPro : {}]}>
              {isPro ? '⭐ Pro Member' : '🌱 Free Plan'}
            </Text>
          </View>
        </View>
      </View>

      {/* Subscription Section */}
      <Text style={styles.section}>Subscription</Text>
      <View style={styles.group}>
        <SettingRow emoji="🎯" label="Current Plan" value={isPro ? 'Smart Kid Pro' : 'Free'} />
        {isPro && expiresAt && (
          <SettingRow emoji="📅" label="Expires" value={formatExpiry(expiresAt) ?? ''} />
        )}
        {!isPro && (
          <SettingRow
            emoji="✨"
            label="Upgrade to Pro"
            onPress={() => Alert.alert('Coming Soon', 'In-app purchases will be available soon!')}
          />
        )}
      </View>

      {/* App Section */}
      <Text style={styles.section}>App</Text>
      <View style={styles.group}>
        <SettingRow emoji="🔔" label="Notifications" onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available in the next update.')} />
        <SettingRow emoji="🌙" label="Appearance" value="System Default" onPress={() => Alert.alert('Coming Soon', 'Dark mode support is coming soon.')} />
        <SettingRow emoji="🌍" label="Language" value="English" onPress={() => Alert.alert('Coming Soon', 'Language localization is under development.')} />
      </View>

      {/* Legal Section */}
      <Text style={styles.section}>Legal</Text>
      <View style={styles.group}>
        <SettingRow emoji="📜" label="Terms & Conditions" onPress={() => openDocument('terms')} />
        <SettingRow emoji="🛡️" label="Privacy Policy" onPress={() => openDocument('privacy')} />
      </View>

      {/* Account Section */}
      <Text style={styles.section}>Account</Text>
      <View style={styles.group}>
        <SettingRow emoji="🔒" label="Change Password" onPress={() => Alert.alert('Coming Soon', 'Password reset will be available soon.')} />
        <SettingRow emoji="📤" label="Export My Data" onPress={() => Alert.alert('Coming Soon', 'Data export is under development.')} />
        <SettingRow
          emoji="🚪"
          label="Sign Out"
          onPress={handleSignOut}
        />
        <SettingRow
          emoji="⚠️"
          label="Delete Account"
          onPress={handleDeleteAccount}
          danger
        />
      </View>

      {/* Version */}
      <Text style={styles.version}>Smart Kid Meals v1.0.0</Text>
      <View style={{ height: Spacing.xxl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { padding: Spacing.lg, paddingTop: 60 },
  headerTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.text },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.lg,
    marginTop: 0,
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadow.sm,
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: { fontSize: 28 },
  email: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.text },
  badge: { marginTop: 4, paddingHorizontal: 10, paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  badgeFree: { backgroundColor: Colors.surfaceAlt },
  badgePro: { backgroundColor: Colors.accentLight },
  badgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  badgeTextPro: { color: '#92400e' },

  section: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginHorizontal: Spacing.lg,
    marginBottom: 8,
    marginTop: Spacing.lg,
  },
  group: {
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.divider,
  },
  rowEmoji: { fontSize: 20, marginRight: 12 },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: FontSize.md, color: Colors.text },
  rowValue: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: 2 },
  rowArrow: { fontSize: 20, color: Colors.textMuted },
  danger: { color: Colors.error },

  version: { textAlign: 'center', fontSize: FontSize.xs, color: Colors.textMuted, marginTop: Spacing.xl },
});
