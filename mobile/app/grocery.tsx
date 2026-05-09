import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Share,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Colors, Spacing, Radius, FontSize, FontWeight, Shadow } from '../constants/theme';
import { getSavedWeeklyPlan, combineGroceryLists, GroceryList, Meal } from '../lib/meal-data';

export default function GroceryListScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [groceries, setGroceries] = useState<GroceryList | null>(null);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadGroceries();
  }, []);

  const loadGroceries = async () => {
    setLoading(true);
    const plan = await getSavedWeeklyPlan();
    if (plan && plan.length > 0) {
      // Extract all meals from the plan
      const allMeals: Meal[] = [];
      plan.forEach(day => {
        if (day.breakfast) allMeals.push(day.breakfast);
        if (day.lunch) allMeals.push(day.lunch);
        if (day.dinner) allMeals.push(day.dinner);
      });
      
      const combined = combineGroceryLists(allMeals);
      setGroceries(combined);
    }
    setLoading(false);
  };

  const toggleItem = (item: string) => {
    setCheckedItems(prev => ({ ...prev, [item]: !prev[item] }));
  };

  const clearAllChecked = () => {
    if (Object.keys(checkedItems).length === 0) return;
    Alert.alert(
      'Clear Checked Items?',
      'This will uncheck all items in your list.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Clear', style: 'destructive', onPress: () => setCheckedItems({}) }
      ]
    );
  };

  const shareGroceryList = async () => {
    if (!groceries) return;
    
    const formatCategory = (title: string, items: string[]) => {
      if (items.length === 0) return '';
      const checkboxes = items.map(item => `${checkedItems[item] ? '✓' : '☐'} ${item}`).join('\n');
      return `**${title}**\n${checkboxes}\n`;
    };
    
    const message = `🛒 Smart Kid Meals - Grocery List\n\n` +
      formatCategory('Vegetables & Fruits', groceries.vegetables) +
      formatCategory('Dairy & Eggs', groceries.dairy) +
      formatCategory('Proteins & Meat', groceries.proteins) +
      formatCategory('Grains & Carbs', groceries.grains) +
      formatCategory('Pantry & Others', groceries.others);
    
    try {
      await Share.share({ message });
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const totalItems = groceries ? Object.values(groceries).flat().length : 0;
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;
  const progress = totalItems > 0 ? Math.round((checkedCount / totalItems) * 100) : 0;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading grocery list...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderCategory = (title: string, emoji: string, items: string[]) => {
    if (!items || items.length === 0) return null;
    
    return (
      <View style={styles.categoryCard} key={title}>
        <Text style={styles.categoryTitle}>{emoji} {title}</Text>
        {items.map((item, idx) => {
          const isChecked = checkedItems[item];
          return (
            <TouchableOpacity 
              key={idx} 
              style={styles.itemRow} 
              onPress={() => toggleItem(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                {isChecked && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text style={[styles.itemText, isChecked && styles.itemTextChecked]}>
                {item}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Grocery List</Text>
        <TouchableOpacity style={styles.shareBtn} onPress={shareGroceryList}>
          <Text style={styles.shareBtnText}>📤</Text>
        </TouchableOpacity>
      </View>
      
      {/* Progress Bar */}
      {groceries && totalItems > 0 && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{checkedCount}/{totalItems} items ({progress}%)</Text>
          {checkedCount > 0 && (
            <TouchableOpacity onPress={clearAllChecked} style={styles.clearBtn}>
              <Text style={styles.clearBtnText}>Clear checked</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {!groceries || Object.values(groceries).flat().length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>🛒</Text>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySub}>Generate a weekly plan first to populate your grocery list automatically.</Text>
          <TouchableOpacity 
            style={styles.actionBtn} 
            onPress={() => router.push('/planner' as any)}
          >
            <Text style={styles.actionBtnText}>Go to Planner</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {totalItems === 0 ? (
            <View style={styles.allEmptyContainer}>
              <Text style={styles.allEmptyEmoji}>📝</Text>
              <Text style={styles.allEmptyTitle}>No items needed</Text>
              <Text style={styles.allEmptySub}>Your meal plan doesn't require any groceries.</Text>
            </View>
          ) : (
            <>
              <Text style={styles.summaryText}>Based on your active 7-day meal plan.</Text>
              
              {renderCategory('Vegetables & Fruits', '🥦', groceries.vegetables)}
              {renderCategory('Dairy & Eggs', '🥚', groceries.dairy)}
              {renderCategory('Proteins & Meat', '🥩', groceries.proteins)}
              {renderCategory('Grains & Carbs', '🌾', groceries.grains)}
              {renderCategory('Pantry & Others', '🥫', groceries.others)}
              
              <View style={{ height: Spacing.xl }} />
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: Spacing.md, fontSize: FontSize.md, color: Colors.textSecondary },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.card,
    borderBottomWidth: 1,
    borderColor: Colors.border,
  },
  backBtn: { padding: 8, marginLeft: -8, width: 60 },
  backBtnText: { color: Colors.primary, fontWeight: FontWeight.semibold, fontSize: FontSize.md },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text },
  shareBtn: { padding: 8, marginRight: -8, width: 60, alignItems: 'flex-end' },
  shareBtnText: { fontSize: 20 },
  
  // Progress Bar
  progressContainer: {
    backgroundColor: Colors.card,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderColor: Colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeight.medium,
    minWidth: 100,
  },
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: Radius.full,
  },
  clearBtnText: {
    fontSize: FontSize.xs,
    color: '#DC2626',
    fontWeight: FontWeight.semibold,
  },
  
  // Empty States
  allEmptyContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  allEmptyEmoji: { fontSize: 48, marginBottom: Spacing.md },
  allEmptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 4 },
  allEmptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center' },

  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  emptyEmoji: { fontSize: 64, marginBottom: Spacing.md },
  emptyTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.xl },
  actionBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 14, borderRadius: Radius.full },
  actionBtnText: { color: '#fff', fontSize: FontSize.md, fontWeight: FontWeight.bold },

  scroll: { padding: Spacing.lg },
  summaryText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginBottom: Spacing.lg },

  categoryCard: {
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  categoryTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.text, marginBottom: Spacing.sm },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderColor: 'rgba(0,0,0,0.05)' },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  checkboxChecked: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  itemText: { fontSize: FontSize.md, color: Colors.text, flex: 1 },
  itemTextChecked: { color: Colors.textMuted, textDecorationLine: 'line-through' },
});
