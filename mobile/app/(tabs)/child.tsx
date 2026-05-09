import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  getChildProfiles, 
  saveChildProfile, 
  ChildProfile,
  getWaterIntake,
  saveWaterIntake,
  getGrowthLogs,
  GrowthLog
} from '../../lib/meal-data';
import { useAuth } from '../../hooks/useAuth';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../../constants/theme';

const { width } = Dimensions.get('window');

// ─── Avatar image pools ─────────────────────────────────────────────────────
const BOY_AVATARS = [
  require('../../assets/homepage/child/boy0.png'),
  require('../../assets/homepage/child/boy1.png'),
  require('../../assets/homepage/child/boy2.png'),
  require('../../assets/homepage/child/boy4.png'),
];
const GIRL_AVATARS = [
  require('../../assets/homepage/child/girl1.png'),
  require('../../assets/homepage/child/girl2.png'),
  require('../../assets/homepage/child/girl3.png'),
];

function isGirlProfile(p: ChildProfile): boolean {
  return p.gender === 'girl';
}
function getAvatar(gender: 'boy' | 'girl' | undefined, idx: number): number {
  if (gender === 'girl') return GIRL_AVATARS[idx % GIRL_AVATARS.length];
  return BOY_AVATARS[idx % BOY_AVATARS.length];
}
function getHeroColor(gender: 'boy' | 'girl' | undefined): string {
  return gender === 'girl' ? '#FFD6E8' : '#B8E8D0';
}
function getAccentColor(gender: 'boy' | 'girl' | undefined): string {
  return gender === 'girl' ? '#E8559A' : '#5DC98A';
}

export default function ChildScreen() {
  const { user } = useAuth();
  const [profiles, setProfiles] = useState<ChildProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profile, setProfile] = useState<ChildProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<'boy' | 'girl'>('boy');
  const [ageMonths, setAgeMonths] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Hydration state
  const [waterIntake, setWaterIntake] = useState(0);
  
  // Growth state
  const [growthLogs, setGrowthLogs] = useState<GrowthLog[]>([]);

  useEffect(() => {
    if (user) loadAllData();
  }, [user]);

  const loadAllData = async () => {
    setLoading(true);
    const data = await getChildProfiles();
    setProfiles(data || []);
    if (data && data.length > 0) {
      const targetProfile = activeProfileId 
        ? (data.find(p => p.id === activeProfileId) || data[0]) 
        : data[0];
      await switchProfile(targetProfile);
    } else {
      setProfile(null);
      setEditing(true);
    }
    setLoading(false);
  };

  const switchProfile = async (p: ChildProfile) => {
    setActiveProfileId(p.id);
    setProfile(p);
    setName(p.name);
    setGender(p.gender ?? 'boy');
    setAgeMonths(p.age);
    setWeight(p.weight || '');
    setHeight(p.height || '');
    setEditing(false);
    
    const intake = await getWaterIntake(p.id);
    setWaterIntake(intake);
    const logs = await getGrowthLogs(p.id);
    setGrowthLogs(logs.reverse().slice(0, 5));
  };

  const handleAddChild = () => {
    setActiveProfileId(null);
    setProfile(null);
    setName('');
    setGender('boy');
    setAgeMonths('');
    setWeight('');
    setHeight('');
    setEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!name || !ageMonths) {
      Alert.alert('Missing Info', 'Please fill in name and age.');
      return;
    }
    setSaving(true);
    
    const newProfile: ChildProfile = {
      id: profile?.id || Date.now().toString(),
      name,
      gender,
      age: ageMonths,
      diet: profile?.diet || 'none',
      allergies: profile?.allergies || [],
      goal: profile?.goal || 'healthy',
      weight,
      height
    };

    await saveChildProfile(newProfile);

    // If it's a new profile, make sure it's selected after saving
    if (!profile) setActiveProfileId(newProfile.id);

    await loadAllData();
    setSaving(false);
    setEditing(false);
  };

  const handleAddLiquid = async (amount: number) => {
    if (!profile) return;
    const newIntake = waterIntake + amount;
    setWaterIntake(newIntake);
    await saveWaterIntake(profile.id, amount);
  };

  const ageDisplay = (monthsStr: string) => {
    const months = parseInt(monthsStr) || 0;
    if (months < 12) return `${months} months`;
    const y = Math.floor(months / 12);
    const m = months % 12;
    return m > 0 ? `${y} yr ${m} mo` : `${y} year${y > 1 ? 's' : ''}`;
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#5DC98A" />
      </View>
    );
  }

  const profileIdx = profiles.findIndex(p => p.id === activeProfileId);
  const activeIdx  = profileIdx >= 0 ? profileIdx : 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Children</Text>
          <Text style={styles.headerSub}>Manage your kids' profiles</Text>
        </View>

        {/* ── Profile switcher row ── */}
        {profiles.length > 0 && !editing && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.switcherRow}>
            {profiles.map((p, i) => {
              const isActive = activeProfileId === p.id;
              const accent   = getAccentColor(p.gender);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.switcherCard, isActive && { borderColor: accent, borderWidth: 2.5 }]}
                  onPress={() => switchProfile(p)}
                  activeOpacity={0.85}
                >
                  <View style={[styles.switcherAvatarWrap, { backgroundColor: p.gender === 'girl' ? '#FFD6E8' : '#B8E8D0' }]}>
                    <Image source={getAvatar(p.gender, i)} style={styles.switcherAvatar} resizeMode="contain" />
                  </View>
                  <Text style={[styles.switcherName, isActive && { color: accent }]} numberOfLines={1}>{p.name}</Text>
                  {isActive && <View style={[styles.switcherDot, { backgroundColor: accent }]} />}
                </TouchableOpacity>
              );
            })}
            <TouchableOpacity style={styles.addCard} onPress={handleAddChild}>
              <View style={styles.addCardIcon}><Text style={styles.addCardPlus}>+</Text></View>
              <Text style={styles.addCardText}>Add{'\n'}Child</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {profile && !editing ? (
          <View>
            {/* ── Hero Profile Card ── */}
            <View style={[styles.heroCard, { backgroundColor: getHeroColor(profile.gender) }]}>
              {/* Big avatar */}
              <View style={styles.heroAvatarWrap}>
                <Image
                  source={getAvatar(profile.gender, activeIdx)}
                  style={styles.heroAvatar}
                  resizeMode="contain"
                />
              </View>

              {/* Info overlay */}
              <View style={styles.heroInfo}>
                <Text style={styles.heroName}>{profile.name}</Text>
                <Text style={styles.heroAge}>{ageDisplay(profile.age)} old</Text>
                <View style={styles.heroBadge}>
                  <Text style={[styles.heroBadgeTxt, { color: getAccentColor(profile.gender) }]}>
                    {profile.gender === 'girl' ? '👧 Girl' : '👦 Boy'}
                  </Text>
                </View>
              </View>

              {/* Edit button */}
              <TouchableOpacity
                style={[styles.heroEditBtn, { backgroundColor: getAccentColor(profile.gender) }]}
                onPress={() => setEditing(true)}
                activeOpacity={0.85}
              >
                <Text style={styles.heroEditTxt}>✏️ Edit</Text>
              </TouchableOpacity>
            </View>

            {/* ── Stats row ── */}
            {(profile.weight || profile.height) && (
              <View style={styles.statsRow}>
                {profile.weight ? (
                  <View style={[styles.statCard, { backgroundColor: '#EEF9F3' }]}>
                    <Text style={styles.statEmoji}>⚖️</Text>
                    <Text style={[styles.statValue, { color: '#3EA86A' }]}>{profile.weight}</Text>
                    <Text style={styles.statUnit}>kg</Text>
                    <Text style={styles.statLabel}>Weight</Text>
                  </View>
                ) : null}
                {profile.height ? (
                  <View style={[styles.statCard, { backgroundColor: '#EEF3FF' }]}>
                    <Text style={styles.statEmoji}>📏</Text>
                    <Text style={[styles.statValue, { color: '#5C6BC0' }]}>{profile.height}</Text>
                    <Text style={styles.statUnit}>cm</Text>
                    <Text style={styles.statLabel}>Height</Text>
                  </View>
                ) : null}
                <View style={[styles.statCard, { backgroundColor: '#FFF8EC' }]}>
                  <Text style={styles.statEmoji}>🎂</Text>
                  <Text style={[styles.statValue, { color: '#E65100' }]}>
                    {Math.floor((parseInt(profile.age) || 0) / 12)}
                  </Text>
                  <Text style={styles.statUnit}>yrs</Text>
                  <Text style={styles.statLabel}>Age</Text>
                </View>
              </View>
            )}

            {/* ── Allergies ── */}
            {profile.allergies && profile.allergies.length > 0 && (
              <View style={styles.allergyBox}>
                <Text style={styles.allergyTitle}>⚠️  Allergies</Text>
                <View style={styles.allergyTags}>
                  {profile.allergies.map((a, i) => (
                    <View key={i} style={styles.allergyTag}>
                      <Text style={styles.allergyTagTxt}>{a}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* ── Hydration tracker ── */}
            <View style={[styles.trackerCard, { backgroundColor: '#E0F7FA' }]}>
              <View style={styles.trackerTop}>
                <View>
                  <Text style={styles.trackerTitle}>{parseInt(profile.age) < 12 ? '🍼 Milk Intake' : '💧 Hydration'}</Text>
                  <Text style={styles.trackerSub}>Goal: {parseInt(profile.age) < 12 ? '800 ml' : '1500 ml'} today</Text>
                </View>
                <Text style={styles.trackerAmount}>{waterIntake} <Text style={styles.trackerUnit}>ml</Text></Text>
              </View>
              {/* Progress bar */}
              <View style={styles.waterBarTrack}>
                <View style={[styles.waterBarFill, {
                  width: `${Math.min(100, (waterIntake / (parseInt(profile.age) < 12 ? 800 : 1500)) * 100)}%`,
                }]} />
              </View>
              <TouchableOpacity
                style={styles.addWaterBtn}
                onPress={() => handleAddLiquid(parseInt(profile.age) < 12 ? 50 : 100)}
                activeOpacity={0.8}
              >
                <Text style={styles.addWaterTxt}>+ Add {parseInt(profile.age) < 12 ? '50ml' : '100ml'}</Text>
              </TouchableOpacity>
            </View>

            {/* ── Growth History ── */}
            <View style={styles.trackerCard}>
              <Text style={styles.trackerTitle}>📈 Growth History</Text>
              <Text style={styles.trackerSub}>Recent weight & height logs</Text>
              {growthLogs.length > 0 ? (
                <View style={styles.logsWrap}>
                  {growthLogs.map((log) => (
                    <View key={log.id} style={styles.logRow}>
                      <Text style={styles.logDate}>{new Date(log.logged_at).toLocaleDateString()}</Text>
                      <View style={styles.logValues}>
                        {log.weight > 0 && <View style={styles.logBadge}><Text style={styles.logBadgeTxt}>{log.weight} kg</Text></View>}
                        {log.height > 0 && <View style={[styles.logBadge, { backgroundColor: '#E8F5E9' }]}><Text style={[styles.logBadgeTxt, { color: '#2E7D32' }]}>{log.height} cm</Text></View>}
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyLog}>No growth logs yet. Edit profile to add weight & height.</Text>
              )}
            </View>
          </View>

        ) : (
          /* ── Add / Edit Form ── */
          <View style={styles.form}>
            {/* Preview avatar */}
            <View style={[styles.formAvatarPreview, { backgroundColor: gender === 'girl' ? '#FFD6E8' : '#B8E8D0' }]}>
              <Image source={getAvatar(gender, activeIdx)} style={styles.formAvatarImg} resizeMode="contain" />
            </View>

            <Text style={styles.formTitle}>{profile ? `Edit ${profile.name}'s Profile` : 'Add Your Child'}</Text>

            {/* Gender picker */}
            <View style={styles.field}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'boy' && styles.genderBtnActiveBoy]}
                  onPress={() => setGender('boy')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.genderBtnIcon}>👦</Text>
                  <Text style={[styles.genderBtnTxt, gender === 'boy' && { color: '#5DC98A' }]}>Boy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === 'girl' && styles.genderBtnActiveGirl]}
                  onPress={() => setGender('girl')}
                  activeOpacity={0.85}
                >
                  <Text style={styles.genderBtnIcon}>👧</Text>
                  <Text style={[styles.genderBtnTxt, gender === 'girl' && { color: '#E8559A' }]}>Girl</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Child's Name</Text>
              <TextInput
                style={[styles.input, { borderColor: gender === 'girl' ? '#F9A8D4' : '#86EFAC' }]}
                value={name}
                onChangeText={setName}
                placeholder="Enter name"
                placeholderTextColor="#A0AEC0"
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Age (in months)</Text>
              <TextInput
                style={styles.input}
                value={ageMonths}
                onChangeText={setAgeMonths}
                placeholder="e.g. 72 for 6 years"
                placeholderTextColor="#A0AEC0"
                keyboardType="numeric"
              />
            </View>

            <View style={styles.fieldRow}>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Weight (kg)</Text>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="e.g. 22"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Height (cm)</Text>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="e.g. 115"
                  placeholderTextColor="#A0AEC0"
                  keyboardType="numeric"
                />
              </View>
            </View>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: getAccentColor(gender) }, saving && styles.saveBtnDisabled]}
                onPress={handleSaveProfile}
                disabled={saving}
                activeOpacity={0.85}
              >
                {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Profile</Text>}
              </TouchableOpacity>
              {profiles.length > 0 && (
                <TouchableOpacity style={styles.cancelBtn} onPress={async () => {
                  if (activeProfileId) { setEditing(false); }
                  else { await switchProfile(profiles[0]); }
                }}>
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe:      { flex: 1, backgroundColor: '#F7F8F5' },
  container: { flex: 1, backgroundColor: '#F7F8F5' },
  loader:    { flex: 1, justifyContent: 'center', alignItems: 'center' },

  // Header
  header:      { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerTitle: { fontSize: 28, fontWeight: '900', color: '#1A2330' },
  headerSub:   { fontSize: 13, color: '#8896A8', marginTop: 3 },

  // Child switcher horizontal scroll
  switcherRow: { paddingHorizontal: 20, paddingVertical: 16, gap: 12 },
  switcherCard: {
    width: 80, alignItems: 'center', gap: 6,
    borderRadius: 20, padding: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    borderWidth: 2, borderColor: 'transparent',
  },
  switcherAvatarWrap: {
    width: 56, height: 56, borderRadius: 28, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'center',
  },
  switcherAvatar:  { width: 56, height: 56 },
  switcherName:    { fontSize: 11, fontWeight: '700', color: '#4A5568', textAlign: 'center' },
  switcherDot:     { width: 6, height: 6, borderRadius: 3 },
  addCard: {
    width: 80, alignItems: 'center', gap: 6,
    borderRadius: 20, padding: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
    borderWidth: 1.5, borderColor: '#5DC98A', borderStyle: 'dashed',
  },
  addCardIcon: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#F0FBF5',
    alignItems: 'center', justifyContent: 'center',
  },
  addCardPlus: { fontSize: 28, fontWeight: '300', color: '#5DC98A', lineHeight: 32 },
  addCardText: { fontSize: 11, fontWeight: '700', color: '#5DC98A', textAlign: 'center' },

  // Hero card
  heroCard: {
    marginHorizontal: 16, marginBottom: 16,
    borderRadius: 32, overflow: 'hidden',
    minHeight: 200,
    flexDirection: 'row', alignItems: 'flex-end',
    paddingLeft: 20, paddingBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12, shadowRadius: 20, elevation: 8,
  },
  heroAvatarWrap: {
    width: 160, height: 180,
    position: 'absolute', right: 0, bottom: 0,
  },
  heroAvatar: { width: 160, height: 180 },
  heroInfo:   { flex: 1, paddingRight: 160 },
  heroName:   { fontSize: 26, fontWeight: '900', color: '#1A2330' },
  heroAge:    { fontSize: 13, fontWeight: '600', color: 'rgba(26,35,48,0.60)', marginTop: 4 },
  heroBadge:  {
    alignSelf: 'flex-start', marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.75)',
    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4,
  },
  heroBadgeTxt:  { fontSize: 12, fontWeight: '800' },
  heroEditBtn: {
    position: 'absolute', top: 16, right: 16,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
  },
  heroEditTxt: { fontSize: 13, fontWeight: '800', color: '#fff' },

  // Stats
  statsRow: {
    flexDirection: 'row', gap: 10,
    marginHorizontal: 16, marginBottom: 16,
  },
  statCard: {
    flex: 1, borderRadius: 20, padding: 16,
    alignItems: 'center', gap: 2,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 22, fontWeight: '900' },
  statUnit:  { fontSize: 11, fontWeight: '700', color: '#8896A8' },
  statLabel: { fontSize: 10, color: '#8896A8', fontWeight: '600' },

  // Allergies
  allergyBox: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#FEF3C7', borderRadius: 20,
    padding: 16,
  },
  allergyTitle: { fontSize: 13, fontWeight: '800', color: '#92400E', marginBottom: 8 },
  allergyTags:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  allergyTag:   { backgroundColor: '#FDE68A', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  allergyTagTxt:{ fontSize: 12, fontWeight: '700', color: '#78350F' },

  // Tracker cards
  trackerCard: {
    marginHorizontal: 16, marginBottom: 16,
    backgroundColor: '#FFFFFF', borderRadius: 24,
    padding: 18,
    shadowColor: '#000', shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07, shadowRadius: 12, elevation: 3,
  },
  trackerTop:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  trackerTitle:  { fontSize: 15, fontWeight: '800', color: '#1A2330' },
  trackerSub:    { fontSize: 11, color: '#8896A8', marginTop: 2 },
  trackerAmount: { fontSize: 26, fontWeight: '900', color: '#0369A1' },
  trackerUnit:   { fontSize: 14, fontWeight: '600', color: '#8896A8' },
  waterBarTrack: { height: 8, backgroundColor: 'rgba(0,0,0,0.07)', borderRadius: 4, marginBottom: 14 },
  waterBarFill:  { height: 8, backgroundColor: '#0EA5E9', borderRadius: 4 },
  addWaterBtn: {
    backgroundColor: '#0EA5E9', borderRadius: 12,
    paddingVertical: 10, alignItems: 'center',
  },
  addWaterTxt: { color: '#fff', fontWeight: '800', fontSize: 13 },

  // Growth log
  logsWrap:   { marginTop: 12, gap: 8 },
  logRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 6, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  logDate:    { fontSize: 12, color: '#8896A8', fontWeight: '600' },
  logValues:  { flexDirection: 'row', gap: 6 },
  logBadge:   { backgroundColor: '#EEF3FF', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  logBadgeTxt:{ fontSize: 12, fontWeight: '700', color: '#3949AB' },
  emptyLog:   { fontSize: 12, color: '#8896A8', fontStyle: 'italic', marginTop: 8 },

  // Form
  form: {
    margin: 16, backgroundColor: '#FFFFFF',
    borderRadius: 24, padding: 24,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08, shadowRadius: 16, elevation: 5,
  },
  formAvatarPreview: {
    alignSelf: 'center', borderRadius: 60, marginBottom: 16,
    width: 120, height: 120, overflow: 'hidden',
    alignItems: 'center', justifyContent: 'flex-end',
  },
  formAvatarImg:  { width: 110, height: 110, position: 'absolute', bottom: 0 },
  formAvatarHint: { fontSize: 10, fontWeight: '700', color: 'rgba(26,35,48,0.5)', paddingBottom: 6, zIndex: 1 },
  formTitle:   { fontSize: 20, fontWeight: '900', color: '#1A2330', marginBottom: 20 },
  field:       { marginBottom: 14 },
  fieldRow:    { flexDirection: 'row', gap: 12 },
  label:       { fontSize: 12, fontWeight: '700', color: '#4A5568', marginBottom: 6, letterSpacing: 0.3 },
  input: {
    backgroundColor: '#F7F8F5', borderRadius: 14,
    borderWidth: 1.5, borderColor: '#E2E8F0',
    paddingHorizontal: 14, paddingVertical: 13,
    fontSize: 15, color: '#1A2330',
  },
  genderRow: { flexDirection: 'row', gap: 12 },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, borderRadius: 14,
    backgroundColor: '#F7F8F5', borderWidth: 2, borderColor: '#E2E8F0',
  },
  genderBtnActiveBoy:  { backgroundColor: '#F0FBF5', borderColor: '#5DC98A' },
  genderBtnActiveGirl: { backgroundColor: '#FFF0F7', borderColor: '#E8559A' },
  genderBtnIcon: { fontSize: 22 },
  genderBtnTxt:  { fontSize: 15, fontWeight: '800', color: '#8896A8' },

  actions:       { gap: 10, marginTop: 8 },
  saveBtn:       { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText:   { color: '#fff', fontWeight: '900', fontSize: 15 },
  cancelBtn:     { backgroundColor: '#F7F8F5', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  cancelBtnText: { color: '#4A5568', fontWeight: '700', fontSize: 14 },
});
