import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity,
  Animated, Dimensions
} from 'react-native';

const { height } = Dimensions.get('window');

interface QuickLogModalProps {
  visible: boolean;
  type: 'sleep' | 'water' | 'activity' | null;
  onClose: () => void;
  onLog: (value: number) => void;
}

export default function QuickLogModal({ visible, type, onClose, onLog }: QuickLogModalProps) {
  const [value, setValue] = useState(0);

  const getTitle = () => {
    switch (type) {
      case 'sleep': return 'Log Sleep';
      case 'water': return 'Add Water';
      case 'activity': return 'Log Activity';
      default: return '';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'sleep': return '🌙';
      case 'water': return '💧';
      case 'activity': return '🏃';
      default: return '';
    }
  };

  const getUnit = () => {
    switch (type) {
      case 'sleep': return 'hours';
      case 'water': return 'ml';
      case 'activity': return 'min';
      default: return '';
    }
  };

  const getQuickOptions = () => {
    switch (type) {
      case 'sleep': return [6, 7, 8, 9, 10];
      case 'water': return [250, 500, 750, 1000];
      case 'activity': return [15, 30, 45, 60];
      default: return [];
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />
        
        <View style={styles.container}>
          {/* Handle */}
          <View style={styles.handle} />
          
          {/* Icon & Title */}
          <Text style={styles.icon}>{getIcon()}</Text>
          <Text style={styles.title}>{getTitle()}</Text>
          
          {/* Current Value Display */}
          <View style={styles.valueDisplay}>
            <Text style={styles.valueText}>{value}</Text>
            <Text style={styles.unitText}>{getUnit()}</Text>
          </View>
          
          {/* Quick Select Buttons */}
          <View style={styles.quickOptions}>
            {getQuickOptions().map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.optionBtn,
                  value === opt && styles.optionBtnActive
                ]}
                onPress={() => setValue(opt)}
              >
                <Text style={[
                  styles.optionText,
                  value === opt && styles.optionTextActive
                ]}>
                  {type === 'water' ? `${opt}ml` : `${opt}`}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Log Button */}
          <TouchableOpacity
            style={[styles.logBtn, value === 0 && styles.logBtnDisabled]}
            disabled={value === 0}
            onPress={() => {
              onLog(value);
              setValue(0);
            }}
          >
            <Text style={styles.logBtnText}>✨ Log It!</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  backdrop: {
    flex: 1,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E5E7EB',
    alignSelf: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 48,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    color: '#1E293B',
    marginBottom: 24,
  },
  valueDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 24,
  },
  valueText: {
    fontSize: 48,
    fontWeight: '700',
    color: '#3B82F6',
  },
  unitText: {
    fontSize: 16,
    color: '#64748B',
    marginLeft: 8,
  },
  quickOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  optionBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    minWidth: 70,
  },
  optionBtnActive: {
    backgroundColor: '#3B82F6',
  },
  optionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
    textAlign: 'center',
  },
  optionTextActive: {
    color: '#FFFFFF',
  },
  logBtn: {
    backgroundColor: '#22C55E',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  logBtnDisabled: {
    backgroundColor: '#E5E7EB',
  },
  logBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  cancelText: {
    color: '#64748B',
    fontSize: 14,
  },
});
