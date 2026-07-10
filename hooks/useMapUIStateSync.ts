/**
 * Hook to sync centralized MapUIState with Bottom Sheet indices
 * Provides deterministic mapping between state and sheet positions
 */

import { useEffect, useRef } from 'react';
import { BottomSheetState, useMapUIState } from '../contexts/MapUIStateContext';

/**
 * Maps BottomSheetState to sheet index
 * - 'expanded' = index 1 (40% - default)
 * - 'collapsed' = index 0 (1% - minimal)
 * - 'hidden' = index -1 (fully hidden)
 */
export const useMapUIStateSync = (
  sheetRef: React.RefObject<any>,
  activeTab: 'rent' | 'sell'
) => {
  const { state } = useMapUIState();
  const isUpdatingRef = useRef(false);
  
  useEffect(() => {
    if (!sheetRef.current || isUpdatingRef.current) {
      return;
    }
    
    const targetIndex = state.bottomSheetState === 'expanded' ? 1 : 
                        state.bottomSheetState === 'collapsed' ? 0 : -1;
    
    // Get current index from sheet
    const currentIndex = sheetRef.current.getCurrentIndex?.() ?? 1;
    
    // Only update if different
    if (currentIndex !== targetIndex) {
      isUpdatingRef.current = true;
      sheetRef.current.snapToIndex(targetIndex);
      
      // Reset flag after animation completes (or immediately if instant)
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 100);
    }
  }, [state.bottomSheetState, sheetRef, activeTab]);
  
  return {
    sheetIndex: state.bottomSheetState === 'expanded' ? 1 : 
                state.bottomSheetState === 'collapsed' ? 0 : -1,
    cardVisible: state.cardVisible,
  };
};
