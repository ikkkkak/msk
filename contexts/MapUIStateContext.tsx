/**
 * Map UI State Controller
 * Centralized, deterministic state management for Map + Bottom Sheet + Property Card
 * 
 * Architecture:
 * - Single source of truth for all UI state
 * - Instant state transitions (no animation dependencies)
 * - Deterministic behavior (always in valid state)
 */

import React, { createContext, useContext, useCallback, useRef, useState, useMemo } from 'react';
import { logAction, logElapsedSinceTap } from '../utils/debugMarkerTap';

export type BottomSheetState = 'expanded' | 'collapsed' | 'hidden';

export interface MapUIState {
  // Active marker selection
  activeMarkerId: number | null;
  
  // Property card visibility
  cardVisible: boolean;
  cardProperty: any | null;
  
  // Bottom sheet state
  bottomSheetState: BottomSheetState;
  
  // Previous sheet state (for restoration)
  previousSheetState: BottomSheetState;
}

interface MapUIStateContextValue {
  state: MapUIState;
  
  // Actions - all synchronous, instant
  selectMarker: (markerId: number, property: any) => void;
  dismissCard: () => void;
  setBottomSheetState: (state: BottomSheetState) => void;
  handleMapInteraction: () => void;
  
  // Getters
  isCardVisible: () => boolean;
  getActiveMarkerId: () => number | null;
  getBottomSheetState: () => BottomSheetState;
}

const initialState: MapUIState = {
  activeMarkerId: null,
  cardVisible: false,
  cardProperty: null,
  bottomSheetState: 'expanded',
  previousSheetState: 'expanded',
};

const MapUIStateContext = createContext<MapUIStateContextValue | null>(null);

export const MapUIStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<MapUIState>(initialState);
  
  /**
   * Select marker - INSTANT state transition
   * Rules:
   * - Show card immediately
   * - Collapse bottom sheet immediately
   * - Store previous sheet state for restoration
   */
  const selectMarker = useCallback((markerId: number, property: any) => {
    logAction("MapUIState selectMarker called", { markerId });
    logElapsedSinceTap("MapUIState selectMarker");
    setState(prev => {
      const newState = {
        activeMarkerId: markerId,
        cardVisible: true,
        cardProperty: property,
        previousSheetState: prev.bottomSheetState,
        bottomSheetState: 'collapsed' as BottomSheetState,
      };
      return newState;
    });
  }, []);
  
  /**
   * Dismiss card - INSTANT state transition
   * Rules:
   * - Hide card immediately
   * - Restore bottom sheet to previous state
   * - Clear active marker
   */
  const dismissCard = useCallback(() => {
    setState(prev => ({
      activeMarkerId: null,
      cardVisible: false,
      cardProperty: null,
      bottomSheetState: prev.previousSheetState, // Restore previous state
      previousSheetState: prev.previousSheetState,
    }));
  }, []);
  
  /**
   * Set bottom sheet state - INSTANT
   * Only allowed when card is not visible
   */
  const setBottomSheetState = useCallback((newState: BottomSheetState) => {
    setState(prev => {
      // If card is visible, don't allow sheet state changes
      if (prev.cardVisible) {
        return prev;
      }
      
      return {
        ...prev,
        bottomSheetState: newState,
        previousSheetState: prev.bottomSheetState,
      };
    });
  }, []);
  
  /**
   * Handle map interaction (pan/zoom/tap)
   * Rules:
   * - If card is visible, dismiss it immediately
   * - Sheet state remains unchanged
   */
  const handleMapInteraction = useCallback(() => {
    setState(prev => {
      if (!prev.cardVisible) {
        return prev; // No card visible, no action needed
      }
      
      // Dismiss card, restore sheet
      return {
        activeMarkerId: null,
        cardVisible: false,
        cardProperty: null,
        bottomSheetState: prev.previousSheetState,
        previousSheetState: prev.previousSheetState,
      };
    });
  }, []);
  
  // Getters for convenience
  const isCardVisible = useCallback(() => state.cardVisible, [state.cardVisible]);
  const getActiveMarkerId = useCallback(() => state.activeMarkerId, [state.activeMarkerId]);
  const getBottomSheetState = useCallback(() => state.bottomSheetState, [state.bottomSheetState]);
  
  const value = useMemo<MapUIStateContextValue>(() => ({
    state,
    selectMarker,
    dismissCard,
    setBottomSheetState,
    handleMapInteraction,
    isCardVisible,
    getActiveMarkerId,
    getBottomSheetState,
  }), [
    state,
    selectMarker,
    dismissCard,
    setBottomSheetState,
    handleMapInteraction,
    isCardVisible,
    getActiveMarkerId,
    getBottomSheetState,
  ]);
  
  return (
    <MapUIStateContext.Provider value={value}>
      {children}
    </MapUIStateContext.Provider>
  );
};

export const useMapUIState = (): MapUIStateContextValue => {
  const context = useContext(MapUIStateContext);
  if (!context) {
    throw new Error('useMapUIState must be used within MapUIStateProvider');
  }
  return context;
};
