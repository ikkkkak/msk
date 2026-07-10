/**
 * Lightweight QR for share cards — uses qrcode core only (no browser/canvas path).
 */
import React, { useMemo } from "react";
import Svg, { G, Path, Rect } from "react-native-svg";

// Metro-safe: avoid qrcode's browser.js (canvas) entry.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const QRCodeCore = require("qrcode/lib/core/qrcode");

type Matrix = number[][];

function genMatrix(value: string, errorCorrectionLevel = "M"): Matrix {
  const modules = QRCodeCore.create(value, { errorCorrectionLevel }).modules;
  const arr = Array.prototype.slice.call(modules.data, 0) as number[];
  const sqrt = Math.sqrt(arr.length);
  return arr.reduce<Matrix>((rows, key, index) => {
    if (index % sqrt === 0) {
      rows.push([key]);
    } else {
      rows[rows.length - 1].push(key);
    }
    return rows;
  }, []);
}

function matrixToPath(matrix: Matrix, size: number) {
  const cellSize = size / matrix.length;
  let path = "";
  matrix.forEach((row, i) => {
    let needDraw = false;
    row.forEach((column, j) => {
      if (column) {
        if (!needDraw) {
          path += `M${cellSize * j} ${cellSize / 2 + cellSize * i} `;
          needDraw = true;
        }
        if (needDraw && j === row.length - 1) {
          path += `L${cellSize * (j + 1)} ${cellSize / 2 + cellSize * i} `;
        }
      } else if (needDraw) {
        path += `L${cellSize * j} ${cellSize / 2 + cellSize * i} `;
        needDraw = false;
      }
    });
  });
  return { cellSize, path };
}

type Props = {
  value: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
};

export function ShareQrCode({
  value,
  size = 96,
  color = "#111827",
  backgroundColor = "#FFFFFF",
}: Props) {
  const { path, cellSize } = useMemo(() => {
    try {
      const matrix = genMatrix(value);
      return matrixToPath(matrix, size);
    } catch {
      return { path: "", cellSize: 1 };
    }
  }, [value, size]);

  if (!path) return null;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Rect x={0} y={0} width={size} height={size} fill={backgroundColor} />
      <G>
        <Path
          d={path}
          stroke={color}
          strokeWidth={cellSize}
          strokeLinecap="butt"
        />
      </G>
    </Svg>
  );
}

export default ShareQrCode;
