import { useRef, useCallback } from 'react';
import { View } from 'react-native';

interface ElementMeasurement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const useElementMeasurement = () => {
  const measureElement = useCallback(async (
    ref: React.RefObject<View>,
    offset: { x?: number; y?: number } = {}
  ): Promise<ElementMeasurement | null> => {
    return new Promise((resolve) => {
      if (!ref.current) {
        console.warn('⚠️ Ref not ready for measurement');
        resolve(null);
        return;
      }

      ref.current.measure((fx, fy, width, height, px, py) => {
        const measurement = {
          x: px + (offset.x || 0),
          y: py + (offset.y || 0),
          width: width,
          height: height,
        };
        console.log('📍 Element measured:', measurement);
        resolve(measurement);
      });
    });
  }, []);

  return { measureElement };
};

