/**
 * Server-side price calculation — mirrors the frontend calculatePrice logic.
 * Given a parking space and a time range, returns the cheapest total price.
 *
 * @param {string|Date} startTime
 * @param {string|Date} endTime
 * @param {{ pricePerHour: number, pricePerDay: number, pricePerMonth: number }} parkingSpace
 * @returns {number} total price in CAD (dollars, not cents)
 */
const calculatePrice = (startTime, endTime, parkingSpace) => {
    const start = new Date(startTime);
    const end = new Date(endTime);
    const totalMs = end - start;

    if (totalMs <= 0) return 0;

    const totalMinutes = totalMs / (1000 * 60);
    let hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes > 0) hours += 1; // round up to next hour

    const totalDays = totalMs / (1000 * 60 * 60 * 24);
    const days = Math.ceil(totalDays);
    const months = Math.ceil(days / 30);

    const ph = (parkingSpace.pricePerHour != null && parkingSpace.pricePerHour > 0)
        ? parkingSpace.pricePerHour : null;
    const pd = (parkingSpace.pricePerDay != null && parkingSpace.pricePerDay > 0)
        ? parkingSpace.pricePerDay : null;
    const pm = (parkingSpace.pricePerMonth != null && parkingSpace.pricePerMonth > 0)
        ? parkingSpace.pricePerMonth : null;

    const hourlyTotal  = ph != null ? hours  * ph : null;
    const dailyTotal   = pd != null ? days   * pd : null;
    const monthlyTotal = pm != null ? months * pm : null;

    const candidates = [hourlyTotal, dailyTotal, monthlyTotal].filter(v => v != null);

    if (candidates.length === 0) return 0;

    // Add platform fee (4% + $0.30) to match frontend stripePrice calculation
    const base = Math.min(...candidates);
    const withFee = base + base * 0.04 + 0.30;

    // Round to 2 decimal places to avoid floating point issues
    return Math.round(withFee * 100) / 100;
};

export { calculatePrice };
