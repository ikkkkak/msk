/**
 * Simplified Map Controls - Just Icons, No Text
 * Two main buttons: Draw Area & Map Type
 */

import React, { useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// ============================================
// TYPES
// ============================================
interface MapControlsProps {
  // Map type
  mapType?: 'standard' | 'satellite' | 'hybrid' | 'terrain';
  onToggleMapType?: () => void;
  
  // Drawing mode
  isDrawing?: boolean;
  onToggleDrawing?: () => void;
  
  // Position
  position?: 'top-right' | 'center-right' | 'bottom-right';
  
  // Visibility
  visible?: boolean;
}

interface DrawingControlsProps {
  isDrawing: boolean;
  onStopDrawing: () => void;
  onUndoPoint: () => void;
  onClearPolygon: () => void;
  onApplyPolygon: () => void;
  polygonPointsCount: number;
}

// ============================================
// ICON BUTTON
// ============================================
const IconButton: React.FC<{
  icon: string;
  onPress: () => void;
  isActive?: boolean;
  size?: number;
}> = ({ icon, onPress, isActive = false, size = 44 }) => {
  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  return (
    <TouchableOpacity
      style={[
        styles.iconButton,
        { width: size, height: size },
        isActive && styles.iconButtonActive,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <MaterialIcons
        name={icon as any}
        size={20}
        color={isActive ? '#FFFFFF' : '#222222'}
      />
    </TouchableOpacity>
  );
};

// ============================================
// DRAWING CONTROLS (When Drawing is Active)
// ============================================
export const DrawingControls: React.FC<DrawingControlsProps> = ({
  isDrawing,
  onStopDrawing,
  onUndoPoint,
  onClearPolygon,
  onApplyPolygon,
  polygonPointsCount,
}) => {
  if (!isDrawing) return null;

  return (
    <View style={styles.drawingBar}>
      {/* Undo */}
      {polygonPointsCount > 0 && (
        <TouchableOpacity
          style={styles.drawingBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onUndoPoint();
          }}
        >
          <MaterialIcons name="undo" size={20} color="#222222" />
        </TouchableOpacity>
      )}

      {/* Clear */}
      {polygonPointsCount > 0 && (
        <TouchableOpacity
          style={styles.drawingBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onClearPolygon();
          }}
        >
          <MaterialIcons name="delete-outline" size={20} color="#222222" />
        </TouchableOpacity>
      )}

      {/* Apply */}
      {polygonPointsCount >= 3 && (
        <TouchableOpacity
          style={[styles.drawingBtn, styles.applyBtn]}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onApplyPolygon();
          }}
        >
          <MaterialIcons name="check" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Exit */}
      <TouchableOpacity
        style={styles.drawingBtn}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onStopDrawing();
        }}
      >
        <MaterialIcons name="close" size={20} color="#222222" />
      </TouchableOpacity>
    </View>
  );
};

// ============================================
// MAIN MAP CONTROLS (Simplified)
// ============================================
export const MapControls: React.FC<MapControlsProps> = ({
  mapType = 'standard',
  onToggleMapType,
  isDrawing = false,
  onToggleDrawing,
  position = 'center-right',
  visible = true,
}) => {
  if (!visible) return null;

  const getPositionStyle = () => {
    switch (position) {
      case 'top-right':
        return { top: 100, right: 12 };
      case 'bottom-right':
        return { bottom: 140, right: 12 };
      case 'center-right':
      default:
        return { top: '35%' as any, right: 12 };
    }
  };

  const getMapTypeIcon = () => {
    switch (mapType) {
      case 'satellite':
      case 'hybrid':
        return 'satellite';
      case 'terrain':
        return 'terrain';
      default:
        return 'layers';
    }
  };

  return (
    <View style={[styles.container, getPositionStyle()]}>
      {/* Draw Button */}
      {onToggleDrawing && (
        <IconButton
          icon="edit"
          onPress={onToggleDrawing}
          isActive={isDrawing}
        />
      )}

      {/* Map Type Button */}
      {onToggleMapType && (
        <IconButton
          icon={getMapTypeIcon()}
          onPress={onToggleMapType}
          isActive={mapType !== 'standard'}
        />
      )}
    </View>
  );
};

// ============================================
// STYLES
// ============================================
const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 10,
    gap: 8,
  },

  iconButton: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },

  iconButtonActive: {
    backgroundColor: '#222222',
  },

  // Drawing Bar
  drawingBar: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    zIndex: 100,
  },

  drawingBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },

  applyBtn: {
    backgroundColor: '#10B981',
  },
});

// Legacy exports for compatibility
export const MapControlButton = IconButton;
export const MapControlGroup = ({ children, style }: any) => (
  <View style={[styles.container, style]}>{children}</View>
);
export const ZoneToggleButton = ({ showZones, onToggle }: any) => (
  <IconButton icon={showZones ? 'layers' : 'layers-clear'} onPress={onToggle} isActive={showZones} />
);
export const MapTypeToggle = ({ mapType, onToggle }: any) => (
  <IconButton icon={mapType === 'satellite' ? 'satellite' : 'layers'} onPress={onToggle} />
);
export const ThreeDToggle = ({ is3DEnabled, onToggle }: any) => (
  <IconButton icon="3d-rotation" onPress={onToggle} isActive={is3DEnabled} />
);
export const SearchAreaButton = ({ onPress, visible = true }: any) => {
  if (!visible) return null;
  return (
    <View style={{ position: 'absolute', bottom: 32, left: 0, right: 0, alignItems: 'center', zIndex: 50 }}>
      <TouchableOpacity
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#222222',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderRadius: 24,
          gap: 8,
        }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onPress();
        }}
        activeOpacity={0.9}
      >
        <MaterialIcons name="refresh" size={18} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
};

export default MapControls;
