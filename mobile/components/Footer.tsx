import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

const ACTIVE   = '#5DC98A';
const INACTIVE = '#A0AEC0';

const TABS = [
  { label: 'Home',   route: '/',       icon: 'home'    },
  { label: 'Meals',  route: '/meals',  icon: 'meals'   },
  { label: 'Child',  route: '/child',  icon: 'child'   },
  { label: 'Profile',route: '/settings',icon: 'profile'},
] as const;

function NavIcon({ icon, color }: { icon: string; color: string }) {
  switch (icon) {
    case 'home':
      return (
        <View style={ic.shape}>
          <View style={[ic.homeRoof, { borderBottomColor: color }]} />
          <View style={[ic.homeBody, { borderColor: color }]}>
            <View style={[ic.homeDoor, { borderColor: color }]} />
          </View>
        </View>
      );
    case 'meals':
      return (
        <View style={ic.shape}>
          <View style={[ic.doc, { borderColor: color }]}>
            <View style={[ic.docLine, { backgroundColor: color, width: '80%' as any }]} />
            <View style={[ic.docLine, { backgroundColor: color, width: '60%' as any }]} />
            <View style={[ic.docLine, { backgroundColor: color, width: '70%' as any }]} />
          </View>
        </View>
      );
    case 'child':
      return (
        <View style={ic.shape}>
          <View style={[ic.childHead, { borderColor: color }]} />
          <View style={[ic.childBody, { backgroundColor: color }]} />
          <View style={ic.childLegs}>
            <View style={[ic.childLeg, { backgroundColor: color }]} />
            <View style={[ic.childLeg, { backgroundColor: color }]} />
          </View>
        </View>
      );
    case 'profile':
      return (
        <View style={ic.shape}>
          <View style={[ic.profHead, { borderColor: color }]} />
          <View style={[ic.profBody, { borderColor: color }]} />
        </View>
      );
    default: return null;
  }
}

export default function Footer() {
  const router   = useRouter();
  const pathname = usePathname();

  return (
    <View style={st.bar}>
      {TABS.map(tab => {
        const active = pathname === tab.route || (tab.route !== '/' && pathname.startsWith(tab.route));
        const color  = active ? ACTIVE : INACTIVE;
        return (
          <TouchableOpacity
            key={tab.route}
            style={[st.item, active && st.itemActive]}
            onPress={() => router.push(tab.route as any)}
            activeOpacity={0.75}
          >
            <View style={[st.iconWrap, active && st.iconWrapActive]}>
              <NavIcon icon={tab.icon} color={color} />
            </View>
            <Text style={[st.label, { color }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const ic = StyleSheet.create({
  shape:     { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  homeRoof:  { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10, borderBottomWidth: 9, borderLeftColor: 'transparent', borderRightColor: 'transparent', marginBottom: 0 },
  homeBody:  { width: 15, height: 10, borderWidth: 2, borderTopWidth: 0, borderRadius: 2, alignItems: 'center', justifyContent: 'flex-end' },
  homeDoor:  { width: 5, height: 6, borderWidth: 1.5, borderBottomWidth: 0, borderRadius: 1 },
  doc:       { width: 17, height: 21, borderWidth: 2, borderRadius: 3, paddingHorizontal: 3, paddingTop: 4, gap: 3, alignItems: 'flex-start' },
  docLine:   { height: 2, borderRadius: 1 },
  childHead: { width: 10, height: 10, borderRadius: 5, borderWidth: 2, marginBottom: 1 },
  childBody: { width: 13, height: 6, borderRadius: 3, marginBottom: 1 },
  childLegs: { flexDirection: 'row', gap: 3 },
  childLeg:  { width: 4, height: 5, borderRadius: 2 },
  profHead:  { width: 11, height: 11, borderRadius: 6, borderWidth: 2.5, marginBottom: 2 },
  profBody:  { width: 17, height: 9, borderRadius: 9, borderWidth: 2.5, borderBottomWidth: 0 },
});

const st = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopColor: '#ECEEF0',
    borderTopWidth: 1,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 10,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  itemActive: {},
  iconWrap: {
    width: 40,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: ACTIVE + '18',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
});
