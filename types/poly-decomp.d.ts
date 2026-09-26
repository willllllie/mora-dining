declare module "poly-decomp" {
  const decomp: {
    decomp: (polygon: number[][]) => number[][][];
    quickDecomp: (polygon: number[][]) => number[][][];
    isSimple: (polygon: number[][]) => boolean;
    removeCollinearPoints: (polygon: number[][], thresholdAngle?: number) => number;
    removeDuplicatePoints: (polygon: number[][], precision?: number) => void;
    makeCCW: (polygon: number[][]) => boolean;
  };

  export default decomp;
}
