import { point, booleanPointInPolygon, buffer } from '@turf/turf';

// 1. The Scanning Algorithm (Haversine Geofence & Anti-Spoof)
export function checkGeofence(taskLat, taskLng, workerLat, workerLng, maxAllowedDistanceMeters = 50.0) {
    if (!taskLat || !taskLng || !workerLat || !workerLng) {
        return { isValid: false, distanceMeters: null, error: "Missing coordinates" };
    }

    const R = 6371e3; // Earth radius in meters
    const toRadians = (degrees) => degrees * Math.PI / 180;

    const lat1 = toRadians(taskLat);
    const lat2 = toRadians(workerLat);
    const deltaLat = toRadians(workerLat - taskLat);
    const deltaLng = toRadians(workerLng - taskLng);

    const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceMeters = Math.round((R * c + Number.EPSILON) * 100) / 100;

    return {
        isValid: distanceMeters <= maxAllowedDistanceMeters,
        distanceMeters
    };
}

// 2. The Finance Algorithm (Inter-Agency Ledger)
export function calculateFinance(distanceKm, tonnage, machineryHours) {
    const BASE_DISPATCH_FEE = 1200.00;
    const TIPPING_RATE_PER_TONNE = 350.00;
    const DIESEL_BURN_RATE_PER_KM = 85.00;
    const EQUIPMENT_RATE_PER_HOUR = 1100.00;

    const safeDistanceKm = Math.max(0, distanceKm || 0);
    const safeTonnage = Math.max(0, tonnage || 0);
    const safeMachineryHours = Math.max(0, machineryHours || 0);

    const tippingFee = safeTonnage * TIPPING_RATE_PER_TONNE;
    const fuelFee = (safeDistanceKm * 2) * DIESEL_BURN_RATE_PER_KM;
    const machineryFee = safeMachineryHours * EQUIPMENT_RATE_PER_HOUR;

    const totalCost = BASE_DISPATCH_FEE + tippingFee + fuelFee + machineryFee;

    return Math.round((totalCost + Number.EPSILON) * 100) / 100;
}

// 3. The Routing Algorithm (Topology & Load Balancing)
// Requires [longitude, latitude] for Turf.js!
export function calculateRouting(incidentLat, incidentLng, zonesGeoJSON, zonalCapacities) {
    try {
        const incidentPoint = point([incidentLng, incidentLat]); // GeoJSON is [lng, lat]

        let homeZoneId = null;
        let inBuffer = false;

        // Find core zone
        for (const feature of zonesGeoJSON.features) {
            if (booleanPointInPolygon(incidentPoint, feature)) {
                homeZoneId = feature.properties.zone_id;
                break;
            }
        }

        // If not in core zone, check buffer zones
        if (!homeZoneId) {
            for (const feature of zonesGeoJSON.features) {
                const bufferedPolygon = buffer(feature, 0.5, { units: 'kilometers' }); // 500m buffer
                if (booleanPointInPolygon(incidentPoint, bufferedPolygon)) {
                    homeZoneId = feature.properties.zone_id;
                    inBuffer = true;
                    break;
                }
            }
        }

        // If entirely out of bounds, return null
        if (!homeZoneId) {
             return { targetZoneId: null, homeZoneId: null, isSpillover: false, error: 'Out of bounds' };
        }

        const homeCapacity = zonalCapacities[homeZoneId] || 0;

        // Normal routing
        if (!inBuffer || homeCapacity <= 100.0) {
            return { targetZoneId: homeZoneId, homeZoneId, isSpillover: false, calculatedCapacity: homeCapacity };
        }

        // Spillover routing (over 100% and in buffer)
        let bestSpilloverZone = null;
        let lowestCapacity = Infinity;

        // Find neighbor with lowest capacity under 85%
        for (const [zoneId, capacity] of Object.entries(zonalCapacities)) {
            if (zoneId !== homeZoneId && capacity < 85.0 && capacity < lowestCapacity) {
                lowestCapacity = capacity;
                bestSpilloverZone = zoneId;
            }
        }

        if (bestSpilloverZone) {
            return { targetZoneId: bestSpilloverZone, homeZoneId, isSpillover: true, calculatedCapacity: lowestCapacity };
        }

        // Fallback: everyone overloaded
        return { targetZoneId: homeZoneId, homeZoneId, isSpillover: false, calculatedCapacity: homeCapacity, reason: 'All neighbors overloaded' };

    } catch (error) {
        console.error("Routing error:", error);
        return { targetZoneId: null, homeZoneId: null, isSpillover: false, error: error.message };
    }
}


// 4. The Severity Ranker (Processing Metadata)
export function calculateSeverity(category, description, distanceToArterialMeters = 500) {
    let baseScore = 2; // Default

    switch (category) {
        case 'CD_DEBRIS':
        case 'DRAINAGE_CLOG':
            baseScore = 4;
            break;
        case 'POTHOLE':
            baseScore = 3;
            break;
        case 'OVERFLOWING_BIN':
            baseScore = 2;
            break;
        case 'STREETLIGHT_OUT':
            baseScore = 1;
            break;
    }

    let modifier = 0;
    const descLower = description?.toLowerCase() || "";

    // High-risk keywords
    const highRiskKeywords = ['school', 'hospital', 'accident', 'collapse', 'chemical', 'hazard', 'sewage', 'fire', 'medical', 'blocked'];
    if (highRiskKeywords.some(kw => descLower.includes(kw))) {
        modifier += 1;
    }

    // Low-risk keywords
    const lowRiskKeywords = ['flickering', 'small', 'corner', 'dust'];
    if (lowRiskKeywords.some(kw => descLower.includes(kw))) {
        modifier -= 1;
    }

    // Arterial proximity
    if (distanceToArterialMeters <= 100) {
        modifier += 1;
    }

    let finalScore = baseScore + modifier;
    // Clamp between 1 and 5
    return Math.max(1, Math.min(5, finalScore));
}
