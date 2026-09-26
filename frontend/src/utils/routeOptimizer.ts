/**
 * Civic Mesh — Balanced Shift Tour Optimizer (TSP with Urgency & Priority Weights)
 * 
 * Mathematically balances spatial proximity (minimizing driving distance and fuel)
 * with civic urgency (prioritizing critical, emergency, and near-deadline tasks).
 * Uses a Priority-Biased Greedy Nearest Neighbor construction followed by
 * a constrained 2-Opt local search refinement.
 */

import { CivicIssue } from '../types';

export interface RouteStop {
  stopNumber: number;
  issue: CivicIssue;
  distanceFromPreviousKm: number;
  transitMinutes: number;
  cumulativeMinutes: number;
  isUrgentPriority: boolean;
}

export interface ShiftTourOptimizationResult {
  orderedTasks: CivicIssue[];
  stops: RouteStop[];
  totalDistanceKm: number;
  totalEstimatedMinutes: number;
  savedDistanceKm: number;
  savedMinutes: number;
  efficiencyGainPercent: number;
}

/**
 * Calculates Haversine distance in kilometers between two GPS coordinates.
 */
export function calculateHaversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Estimates travel time in minutes based on Mysuru urban speed (28 km/h)
 * plus standard depot dispatch / setup buffer.
 */
export function estimateTransitMinutes(distanceKm: number): number {
  // 28 km/h = ~0.467 km/min
  return Math.max(2, Math.round((distanceKm / 28) * 60) + 2);
}

/**
 * Optimizes the shift tour for a field worker starting from originCoords.
 * Balances physical proximity against civic importance and SLA deadlines.
 */
export function optimizeShiftTour(
  originCoords: { lat: number; lng: number },
  tasks: CivicIssue[]
): ShiftTourOptimizationResult {
  if (tasks.length <= 1) {
    const singleDist = tasks.length === 1 && tasks[0].coordinates
      ? calculateHaversineKm(originCoords.lat, originCoords.lng, tasks[0].coordinates.lat, tasks[0].coordinates.lng)
      : 0;
    const singleTime = estimateTransitMinutes(singleDist);
    return {
      orderedTasks: [...tasks],
      stops: tasks.map((t, idx) => ({
        stopNumber: idx + 1,
        issue: t,
        distanceFromPreviousKm: Math.round(singleDist * 10) / 10,
        transitMinutes: singleTime,
        cumulativeMinutes: singleTime,
        isUrgentPriority: Boolean(t.isEmergencyOverride || (t.severityRank && t.severityRank >= 4)),
      })),
      totalDistanceKm: Math.round(singleDist * 10) / 10,
      totalEstimatedMinutes: singleTime,
      savedDistanceKm: 0,
      savedMinutes: 0,
      efficiencyGainPercent: 0,
    };
  }

  // Calculate original baseline distance
  let originalDist = 0;
  let prevPt = originCoords;
  for (const t of tasks) {
    if (t.coordinates) {
      originalDist += calculateHaversineKm(prevPt.lat, prevPt.lng, t.coordinates.lat, t.coordinates.lng);
      prevPt = t.coordinates;
    }
  }

  // Find maximum priority score across current tasks for normalization
  const maxPriority = Math.max(
    ...tasks.map((t) => (t.dynamicPriorityScore || (t.severityRank || 3) * 20))
  );

  // Step 1: Priority-Biased Greedy Nearest Neighbor Tour Construction
  const unvisited = [...tasks];
  const ordered: CivicIssue[] = [];
  let currentPos = originCoords;

  while (unvisited.length > 0) {
    let bestIdx = 0;
    let minCost = Infinity;

    for (let i = 0; i < unvisited.length; i++) {
      const candidate = unvisited[i];
      const coords = candidate.coordinates || originCoords;
      const physicalDist = calculateHaversineKm(currentPos.lat, currentPos.lng, coords.lat, coords.lng);

      // Urgency factor [0, 1]
      const priority = candidate.dynamicPriorityScore || (candidate.severityRank || 3) * 20;
      const urgencyRatio = maxPriority > 0 ? priority / maxPriority : 0.5;

      // Emergency / Overdue multiplier
      const isEmergency = candidate.isEmergencyOverride || (candidate.severityRank && candidate.severityRank === 5);
      const emergencyDiscount = isEmergency ? 0.35 : 0;

      // Weighted Cost: balance distance with urgency
      // High urgency tasks effectively appear "closer" to pull them earlier in the shift
      const cost = physicalDist * (1.0 - 0.40 * urgencyRatio - emergencyDiscount);

      if (cost < minCost) {
        minCost = cost;
        bestIdx = i;
      }
    }

    const nextStop = unvisited.splice(bestIdx, 1)[0];
    ordered.push(nextStop);
    if (nextStop.coordinates) {
      currentPos = nextStop.coordinates;
    }
  }

  // Step 2: Constrained 2-Opt Local Search Refinement
  // Swaps sub-tours to eliminate path crossings, while preventing critical tasks from being delayed
  let improved = true;
  let iterations = 0;
  while (improved && iterations < 40) {
    improved = false;
    iterations++;

    for (let i = 0; i < ordered.length - 1; i++) {
      for (let k = i + 1; k < ordered.length; k++) {
        // Protect critical emergency tasks: do not push a Rank-5 task from stop 0/1 back to the end
        const taskK = ordered[k];
        const taskI = ordered[i];
        if (taskK.isEmergencyOverride && i === 0 && k > 2) {
          continue;
        }

        // Compute current distance for segment
        const pA = i === 0 ? originCoords : (ordered[i - 1].coordinates || originCoords);
        const pB = ordered[i].coordinates || originCoords;
        const pC = ordered[k].coordinates || originCoords;
        const pD = k + 1 < ordered.length ? (ordered[k + 1].coordinates || originCoords) : pC;

        const currentDist =
          calculateHaversineKm(pA.lat, pA.lng, pB.lat, pB.lng) +
          calculateHaversineKm(pC.lat, pC.lng, pD.lat, pD.lng);

        const newDist =
          calculateHaversineKm(pA.lat, pA.lng, pC.lat, pC.lng) +
          calculateHaversineKm(pB.lat, pB.lng, pD.lat, pD.lng);

        if (newDist < currentDist - 0.05) {
          // Reverse sub-segment [i...k]
          const sub = ordered.slice(i, k + 1).reverse();
          ordered.splice(i, sub.length, ...sub);
          improved = true;
          break;
        }
      }
      if (improved) break;
    }
  }

  // Step 3: Compute Final Tour Distances, Times, and Stop Details
  let totalKm = 0;
  let totalMins = 0;
  let cursor = originCoords;

  const stops: RouteStop[] = ordered.map((task, idx) => {
    const coords = task.coordinates || cursor;
    const stepDist = calculateHaversineKm(cursor.lat, cursor.lng, coords.lat, coords.lng);
    const stepMins = estimateTransitMinutes(stepDist);

    totalKm += stepDist;
    totalMins += stepMins;
    cursor = coords;

    const isUrgent = Boolean(
      task.isEmergencyOverride ||
      (task.severityRank && task.severityRank >= 4) ||
      (task.dynamicPriorityScore && task.dynamicPriorityScore >= 80)
    );

    return {
      stopNumber: idx + 1,
      issue: task,
      distanceFromPreviousKm: Math.round(stepDist * 10) / 10,
      transitMinutes: stepMins,
      cumulativeMinutes: totalMins,
      isUrgentPriority: isUrgent,
    };
  });

  const roundedTotalKm = Math.round(totalKm * 10) / 10;
  const savedDist = Math.max(0, Math.round((originalDist - totalKm) * 10) / 10);
  const savedMins = Math.max(0, estimateTransitMinutes(originalDist) - totalMins);
  const efficiencyGain = originalDist > 0 ? Math.round((savedDist / originalDist) * 100) : 0;

  return {
    orderedTasks: ordered,
    stops,
    totalDistanceKm: roundedTotalKm,
    totalEstimatedMinutes: totalMins,
    savedDistanceKm: savedDist,
    savedMinutes: savedMins,
    efficiencyGainPercent: efficiencyGain,
  };
}
