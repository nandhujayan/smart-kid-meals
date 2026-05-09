import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ActivityIndicator, Alert, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { analyzeMealImage, ImageAnalysisResult } from '../lib/image-analysis';

const { width, height } = Dimensions.get('window');

export default function ScannerScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [scanning, setScanning] = useState(false);
  interface ScannedResult extends ImageAnalysisResult {
    photoUri: string;
  }
  const [scannedResult, setScannedResult] = useState<ScannedResult | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Request permission on mount
  useEffect(() => {
    if (permission && !permission.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleScan = async () => {
    if (!permission || !permission.granted) {
      const result = await requestPermission();
      if (!result || !result.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please grant camera permission in your device settings to scan meals.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {} }
          ]
        );
        return;
      }
    }

    setScanning(true);
    
    // Take a photo
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.7,
        base64: true,
      });
      
      if (photo?.base64) {
        // Real AI image analysis
        try {
          setAnalysisError(null);
          const result = await analyzeMealImage(photo.base64);
          setScannedResult({
            ...result,
            photoUri: photo.uri,
          });
        } catch (err: any) {
          console.error('AI analysis error:', err);
          setAnalysisError('Could not analyze image. Please try again.');
          Alert.alert('Analysis Failed', 'Unable to analyze this meal. Try a clearer photo with good lighting.');
        } finally {
          setScanning(false);
        }
      } else {
        setScanning(false);
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
      }
    } catch (error) {
      console.error('Camera error:', error);
      setScanning(false);
      Alert.alert('Error', 'Failed to capture photo. Please try again.');
    }
  };

  const handleAddToPlan = () => {
    // Save the scanned meal and go back
    router.replace('/(tabs)/meals' as any);
  };

  // Permission loading or denied state
  if (!permission || !permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Text style={styles.permissionIcon}>📷</Text>
          <Text style={styles.permissionTitle}>Camera Access Needed</Text>
          <Text style={styles.permissionText}>
            Smart Kid Meals needs camera access to scan and identify your meals.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.backBtnAlt} 
            onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')}
          >
            <Text style={styles.backBtnAltText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.canGoBack() ? navigation.goBack() : router.replace('/(tabs)/meals')}>
          <Text style={styles.backText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Meal Scanner</Text>
        <View style={{ width: 44 }} />
      </View>

      {/* Camera Viewfinder Area */}
      <View style={styles.viewfinderContainer}>
        {scannedResult?.photoUri && scannedResult.photoUri ? (
          // Show captured photo
          <View style={styles.photoPreviewContainer}>
            <Image source={{ uri: scannedResult.photoUri || '' }} style={styles.photoPreview} />
          </View>
        ) : (
          // Live camera view
          <CameraView 
            style={styles.camera} 
            ref={cameraRef}
            facing="back"
            mode="picture"
          >
            {!scanning && <Text style={styles.cameraHint}>Point at your meal</Text>}
            {scanning && (
              <View style={styles.scanningOverlay}>
                <ActivityIndicator size="large" color="#4ADE80" />
                <Text style={styles.scanningText}>AI is analyzing...</Text>
              </View>
            )}
          </CameraView>
        )}

        {/* Viewfinder Brackets */}
        <View style={[styles.bracket, styles.topLeftBracket]} />
        <View style={[styles.bracket, styles.topRightBracket]} />
        <View style={[styles.bracket, styles.bottomLeftBracket]} />
        <View style={[styles.bracket, styles.bottomRightBracket]} />
      </View>

      {/* Action Area / Results */}
      <View style={styles.bottomArea}>
        {!scannedResult ? (
          <TouchableOpacity 
            style={[styles.captureBtn, scanning && styles.captureBtnDisabled]} 
            onPress={handleScan}
            disabled={scanning}
          >
            <View style={styles.captureBtnInner} />
          </TouchableOpacity>
        ) : (
          <View style={styles.resultCard}>
            {scannedResult.confidence === 'low' && (
              <View style={styles.confidenceWarning}>
                <Text style={styles.confidenceWarningText}>⚠️ Low confidence - estimates may be inaccurate</Text>
              </View>
            )}
            
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>Identified Meal</Text>
              <Text style={styles.resultName}>{scannedResult.mealName}</Text>
              {scannedResult.description && (
                <Text style={styles.resultDescription}>{scannedResult.description}</Text>
              )}
            </View>

            <View style={styles.macrosRow}>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Calories</Text>
                <Text style={styles.macroVal}>{scannedResult.calories}</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroVal}>{scannedResult.protein}g</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Carbs</Text>
                <Text style={styles.macroVal}>{scannedResult.carbs}g</Text>
              </View>
              <View style={styles.macroBox}>
                <Text style={styles.macroLabel}>Fats</Text>
                <Text style={styles.macroVal}>{scannedResult.fats}g</Text>
              </View>
            </View>

            <TouchableOpacity style={styles.addButton} onPress={handleAddToPlan}>
              <Text style={styles.addButtonText}>Add to Plan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.retakeButton} onPress={() => setScannedResult(null)}>
              <Text style={styles.retakeButtonText}>Scan Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },

  viewfinderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 30,
    marginVertical: 40,
    position: 'relative',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
  photoPreviewContainer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
    overflow: 'hidden',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scanningOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  scanningText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 12,
  },
  mockCameraBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#1F2937',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraHint: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  cameraEmoji: {
    fontSize: 100,
  },
  // Permission styles
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  permissionIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  permissionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  permissionButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
  },
  permissionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  backBtnAlt: {
    paddingVertical: 8,
  },
  backBtnAltText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '600',
  },

  bracket: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#4ADE80',
  },
  topLeftBracket: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 16,
  },
  topRightBracket: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 16,
  },
  bottomLeftBracket: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 16,
  },
  bottomRightBracket: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 16,
  },

  bottomArea: {
    minHeight: 200,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  captureBtn: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureBtnDisabled: {
    opacity: 0.5,
  },
  captureBtnInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
  },

  resultCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resultTitle: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  resultName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#111827',
  },
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 24,
  },
  macroBox: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  macroLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '700',
  },
  macroVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginTop: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  confidenceWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  confidenceWarningText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  addButton: {
    width: '100%',
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  retakeButton: {
    paddingVertical: 8,
  },
  retakeButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '600',
  },
});
