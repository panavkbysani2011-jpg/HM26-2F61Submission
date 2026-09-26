/**
 * Civic Mesh — Perceptual Visual Duplicate Hashing Engine (dHash)
 * 
 * Computes a 64-bit gradient hash of civic grievance photos in-browser
 * using HTML5 Canvas. Enables immediate detection of duplicate photo submissions
 * without requiring external machine learning APIs or cloud compute.
 */

import { CivicIssue } from '../types';

/**
 * Computes a 64-bit difference hash (dHash) from an image data URL.
 * Resizes the image to 9x8 grayscale, evaluates horizontal gradient direction,
 * and encodes the resulting 64 bits into a 16-character hex string.
 */
export async function computePerceptualHash(imageDataUrl: string): Promise<string> {
  if (typeof window === 'undefined' || !imageDataUrl || !imageDataUrl.startsWith('data:image')) {
    return '';
  }

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = 9;
          canvas.height = 8;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          if (!ctx) {
            resolve('');
            return;
          }

          ctx.drawImage(img, 0, 0, 9, 8);
          const imgData = ctx.getImageData(0, 0, 9, 8).data;

          // Convert to grayscale luminance matrix (8 rows x 9 columns)
          const gray: number[][] = [];
          for (let y = 0; y < 8; y++) {
            const row: number[] = [];
            for (let x = 0; x < 9; x++) {
              const idx = (y * 9 + x) * 4;
              const r = imgData[idx];
              const g = imgData[idx + 1];
              const b = imgData[idx + 2];
              // Rec. 601 Luma formula
              const luma = 0.299 * r + 0.587 * g + 0.114 * b;
              row.push(luma);
            }
            gray.push(row);
          }

          // Compute horizontal gradient bits: 1 if left pixel > right pixel, else 0
          let binaryStr = '';
          for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
              binaryStr += gray[y][x] > gray[y][x + 1] ? '1' : '0';
            }
          }

          // Convert 64-bit binary string into 16-character hex string
          let hexHash = '';
          for (let i = 0; i < 64; i += 4) {
            const nibble = binaryStr.substring(i, i + 4);
            hexHash += parseInt(nibble, 2).toString(16);
          }

          resolve(hexHash);
        } catch {
          resolve('');
        }
      };

      img.onerror = () => resolve('');
      img.src = imageDataUrl;
    } catch {
      resolve('');
    }
  });
}

/**
 * Computes the Hamming distance (number of bit differences) between two 64-bit hex hashes.
 * Distance 0 = Exact visual match.
 * Distance 1-8 = High visual similarity (angle/lighting variation).
 * Distance 9-12 = Moderate visual correlation.
 * Distance > 12 = Distinct scenes.
 */
export function computeHammingDistance(hash1: string, hash2: string): number {
  if (!hash1 || !hash2 || hash1.length !== 16 || hash2.length !== 16) {
    return 64;
  }

  let distance = 0;
  for (let i = 0; i < 16; i++) {
    const val1 = parseInt(hash1[i], 16);
    const val2 = parseInt(hash2[i], 16);
    if (isNaN(val1) || isNaN(val2)) return 64;

    let xor = val1 ^ val2;
    // Count set bits in 4-bit nibble
    while (xor > 0) {
      distance += xor & 1;
      xor >>= 1;
    }
  }

  return distance;
}

/**
 * Checks for visual duplicates among active issues within a local spatial radius (default 150m).
 */
export function findVisualDuplicate(
  newHash: string,
  newCoords: { lat: number; lng: number } | undefined,
  existingIssues: CivicIssue[],
  maxDistanceMeters: number = 150
): { matchedIssue: CivicIssue; similarityPercent: number } | null {
  if (!newHash || newHash.length !== 16) return null;

  let bestMatch: CivicIssue | null = null;
  let minDistance = 64;

  for (const issue of existingIssues) {
    if (['resolved', 'closed', 'quarantined'].includes(issue.status)) continue;
    if (!issue.dHash) continue;

    // Check spatial proximity if coordinates exist
    if (newCoords && issue.coordinates?.lat && issue.coordinates?.lng) {
      const R = 6371000; // Earth radius in meters
      const dLat = ((issue.coordinates.lat - newCoords.lat) * Math.PI) / 180;
      const dLng = ((issue.coordinates.lng - newCoords.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((newCoords.lat * Math.PI) / 180) *
          Math.cos((issue.coordinates.lat * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distMeters = R * c;

      if (distMeters > maxDistanceMeters) continue;
    }

    const dist = computeHammingDistance(newHash, issue.dHash);
    if (dist <= 12 && dist < minDistance) {
      minDistance = dist;
      bestMatch = issue;
    }
  }

  if (bestMatch && minDistance <= 12) {
    const similarityPercent = Math.round((1 - minDistance / 64) * 100);
    return {
      matchedIssue: bestMatch,
      similarityPercent,
    };
  }

  return null;
}
