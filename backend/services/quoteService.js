const haversine = require('haversine-distance');

function calculateBaseFareByDistance(meters) {
  // Updated slabs per latest request
  if (meters <= 500) return 45;        // 0–500 m
  if (meters <= 1000) return 40;       // 500–1000 m
  if (meters <= 2000) return 30;       // 1000–2000 m
  if (meters <= 3000) return 30;       // 2000–3000 m
  return 30;                           // >3000 m
}

function calculateTimeAdjustment(actualMinutes = 0, freeMinutes = 20, ratePerMinute = 1) {
  const over = Math.max(0, Math.round(actualMinutes) - freeMinutes);
  return over * ratePerMinute;
}

async function compute({ userLat, userLng, pointLat, pointLng, etaMinutes = 0, surgePeak = false, surgeRain = false, surgeFestival = false }) {
  let distanceMeters = 0;
  if (
    typeof userLat === 'number' && typeof userLng === 'number' &&
    typeof pointLat === 'number' && typeof pointLng === 'number'
  ) {
    try {
      distanceMeters = haversine({ lat: pointLat, lon: pointLng }, { lat: userLat, lon: userLng });
    } catch (e) {
      distanceMeters = 0;
    }
  }
  const baseFare = calculateBaseFareByDistance(distanceMeters);
  const timeAdj = calculateTimeAdjustment(etaMinutes);
  let surgePercent = 0; const surgeReasons = [];
  if (surgePeak) { surgePercent += 0.3; surgeReasons.push('peak'); }
  if (surgeRain) { surgePercent += 0.2; surgeReasons.push('rain'); }
  if (surgeFestival) { surgePercent += 0.2; surgeReasons.push('festival'); }
  // If any delivery boy has surge enabled recently, apply +20%
  try {
    const DeliveryBoy = require('../models/DeliveryBoy');
    const windowMs = 30 * 60 * 1000; // 30 minutes
    const anySurge = await DeliveryBoy.exists({ 'surge.enabled': true, 'surge.lastToggledAt': { $gte: new Date(Date.now() - windowMs) } });
    if (anySurge) { surgePercent += 0.2; surgeReasons.push('driver_surge'); }
  } catch {}
  const preSurge = baseFare + timeAdj;
  const finalFee = Math.max(0, Math.round(preSurge * (1 + surgePercent)));
  return {
    deliveryFee: finalFee,
    feeBreakdown: {
      baseFare,
      distanceMeters: Math.round(distanceMeters),
      timeMinutes: etaMinutes || 0,
      timeFreeMinutes: 20,
      timeAdjustment: timeAdj,
      surgePercent,
      surgeReasons,
      finalFee,
    }
  };
}

// Express handler
async function quoteDeliveryFee(req, res) {
  try {
    const { userLocation, selectedDeliveryPoint, etaMinutes = 0, surgePeak = false, surgeRain = false, surgeFestival = false } = req.body || {};
    const userLat = userLocation?.latitude;
    const userLng = userLocation?.longitude;
    const pointLat = selectedDeliveryPoint?.latitude;
    const pointLng = selectedDeliveryPoint?.longitude;
    if (
      typeof userLat !== 'number' || typeof userLng !== 'number' ||
      typeof pointLat !== 'number' || typeof pointLng !== 'number'
    ) {
      return res.status(400).json({ message: 'userLocation and selectedDeliveryPoint with latitude/longitude are required' });
    }
    const result = await compute({ userLat, userLng, pointLat, pointLng, etaMinutes, surgePeak, surgeRain, surgeFestival });
    return res.json(result);
  } catch (e) {
    return res.status(500).json({ message: 'Failed to compute quote', error: e.message });
  }
}

module.exports = { quoteDeliveryFee, compute };


