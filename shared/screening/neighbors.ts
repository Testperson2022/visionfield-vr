/**
 * Eksplicit nabo-tabel for 24-2 testgrid.
 *
 * Definerer ortogonale naboer (6° afstand) for hvert punkt.
 * Diagonale naboer (~8.5°) er listet separat.
 *
 * Bruges af cluster-detektion til at finde sammenhængende defekter.
 * Ref: Krav F — "hvordan naboer defineres i gridet"
 */

// Ortogonale naboer: punkter der er præcis 6° væk horisontalt eller vertikalt
export const ORTHOGONAL_NEIGHBORS: Record<number, number[]> = {
  0: [1, 10],           // (-27,3) → (-21,3), (-27,9)
  1: [0, 2, 11],        // (-21,3)
  2: [1, 3, 12],
  3: [2, 4, 13],
  4: [3, 5, 14],
  5: [4, 6, 15],
  6: [5, 7],            // (9,3) — 16 er blind spot
  7: [6, 8, 17],
  8: [7, 9, 18],
  9: [8, 19],
  10: [0, 11, 20],      // (-27,9)
  11: [1, 10, 12, 20],
  12: [2, 11, 13, 21],
  13: [3, 12, 14, 22],
  14: [4, 13, 15, 23],
  15: [5, 14, 24],       // (3,9)
  // 16 = blind spot OD — ingen naboer i analyse
  17: [7, 18, 26],
  18: [8, 17, 19, 27],
  19: [9, 18],
  20: [11, 21, 28],     // (-21,15)
  21: [12, 20, 22, 29],
  22: [13, 21, 23, 30],
  23: [14, 22, 24, 31],
  24: [15, 23, 25],
  25: [24, 26],          // (9,15) — 16 er under dette
  26: [17, 25, 27],
  27: [18, 26],
  28: [20, 29],         // (-21,21)
  29: [21, 28, 30],
  30: [22, 29, 31],
  31: [23, 30],
  // Inferior halvdel
  32: [40],              // (3,-21)
  33: [41],
  34: [42],
  35: [43],
  36: [37, 45],         // (-21,-15)
  37: [36, 38, 46],
  38: [37, 39, 47],
  39: [38, 40, 48],
  40: [32, 39, 41, 49],
  41: [33, 40, 42],
  42: [34, 41, 43, 51],
  43: [35, 42, 52],
  44: [45],              // (-27,-9)
  45: [36, 44, 46],
  46: [37, 45, 47],
  47: [38, 46, 48],
  48: [39, 47, 49],
  49: [40, 48],          // (3,-9) — 50 er blind spot
  // 50 = blind spot OS
  51: [42, 52],
  52: [43, 51, 53],
  53: [52],
};

// Diagonale naboer: ~8.5° afstand (√(6²+6²))
export const DIAGONAL_NEIGHBORS: Record<number, number[]> = {
  0: [11],              // (-27,3) → (-21,9)
  1: [10, 12],
  2: [11, 13],
  3: [12, 14],
  4: [13, 15],
  5: [14],               // blind spot blokerer
  // ... forenklet — fuldt sæt bør genereres programmatisk
};

/** Hent alle naboer for et punkt */
export function getNeighborIds(pointId: number, includeDiagonal: boolean = false): number[] {
  const ortho = ORTHOGONAL_NEIGHBORS[pointId] ?? [];
  if (!includeDiagonal) return ortho;
  const diag = DIAGONAL_NEIGHBORS[pointId] ?? [];
  return [...new Set([...ortho, ...diag])];
}
