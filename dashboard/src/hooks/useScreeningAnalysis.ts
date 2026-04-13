/**
 * Hook der kører screening engine på en testsession.
 * Transformerer backend-data til screening engine format.
 */
import { useMemo } from "react";
import { runScreeningAnalysis } from "../screening/engine";
import type { ScreeningResult } from "../screening/types";

// 24-2 grid koordinater for x/y lookup
const GRID_COORDS: Record<number, { x: number; y: number; bs?: boolean }> = {
  0:{x:-27,y:3},1:{x:-21,y:3},2:{x:-15,y:3},3:{x:-9,y:3},4:{x:-3,y:3},
  5:{x:3,y:3},6:{x:9,y:3},7:{x:15,y:3},8:{x:21,y:3},9:{x:27,y:3},
  10:{x:-27,y:9},11:{x:-21,y:9},12:{x:-15,y:9},13:{x:-9,y:9},14:{x:-3,y:9},
  15:{x:3,y:9},16:{x:9,y:9,bs:true},17:{x:15,y:9},18:{x:21,y:9},19:{x:27,y:9},
  20:{x:-21,y:15},21:{x:-15,y:15},22:{x:-9,y:15},23:{x:-3,y:15},
  24:{x:3,y:15},25:{x:9,y:15},26:{x:15,y:15},27:{x:21,y:15},
  28:{x:-21,y:21},29:{x:-15,y:21},30:{x:-9,y:21},31:{x:-3,y:21},
  32:{x:3,y:-21},33:{x:9,y:-21},34:{x:15,y:-21},35:{x:21,y:-21},
  36:{x:-21,y:-15},37:{x:-15,y:-15},38:{x:-9,y:-15},39:{x:-3,y:-15},
  40:{x:3,y:-15},41:{x:9,y:-15},42:{x:15,y:-15},43:{x:21,y:-15},
  44:{x:-27,y:-9},45:{x:-21,y:-9},46:{x:-15,y:-9},47:{x:-9,y:-9},48:{x:-3,y:-9},
  49:{x:3,y:-9},50:{x:9,y:-9,bs:true},51:{x:15,y:-9},52:{x:21,y:-9},53:{x:27,y:-9},
};

export function useScreeningAnalysis(session: any): ScreeningResult | null {
  return useMemo(() => {
    if (!session?.results_json?.point_results) return null;

    const results = session.results_json;
    const pointResults = results.point_results.map((p: any) => {
      const coord = GRID_COORDS[p.grid_point_id];
      return {
        grid_point_id: p.grid_point_id,
        threshold_db: p.threshold_db,
        total_deviation_db: p.total_deviation_db,
        pattern_deviation_db: p.pattern_deviation_db,
        x_deg: coord?.x ?? 0,
        y_deg: coord?.y ?? 0,
        is_blind_spot: coord?.bs ?? false,
      };
    });

    const qualityMetrics = {
      fpRate: session.false_positive_rate ?? 0,
      fnRate: session.false_negative_rate ?? 0,
      fixLossRate: session.fixation_loss_rate ?? 0,
      completionRate: pointResults.length / 52,
    };

    return runScreeningAnalysis(pointResults, qualityMetrics);
  }, [session]);
}
