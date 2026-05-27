export const PALETTE=['#F44336','#E91E63','#9C27B0','#673AB7','#3F51B5','#2196F3','#03A9F4','#00BCD4','#009688','#4CAF50','#8BC34A','#CDDC39','#FFEB3B','#FFC107','#FF9800','#FF5722','#795548','#9E9E9E','#607D8B','#000000','#FFFFFF','#FF80AB','#69F0AE','#40C4FF'];

export function parseTime(t) { const [h, m] = t.split(':').map(Number); return h * 60 + (m || 0); }
export function minutesToPercent(m) { return (m / 1440) * 100; }
export function minutesToTime(m) { return `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; }
export function snapToGrid(m, snap) { return Math.round(m / snap) * snap; }

export function magneticSnap(m, pts, snap) {
  const thr = snap * 2;
  let closest = null, dist = thr;
  for (const pt of pts) { const d = Math.abs(m - pt); if (d < dist) { dist = d; closest = pt; } }
  return closest !== null ? closest : snapToGrid(m, snap);
}

export function getDayIndex(day) {
  return { mon:0,tue:1,wed:2,thu:3,fri:4,sat:5,sun:6,monday:0,tuesday:1,wednesday:2,thursday:3,friday:4,saturday:5,sunday:6,daily:-1,workday:-2,weekend:-3 }[day.toLowerCase()] ?? -1;
}

export function getDayKey(i) { return ['mon','tue','wed','thu','fri','sat','sun'][i]; }

export function appliesToDay(weekdays, dayIndex) {
  return weekdays.some(wd => {
    const idx = getDayIndex(wd);
    if (idx === -1) return true;
    if (idx === -2) return dayIndex < 5;
    if (idx === -3) return dayIndex >= 5;
    return idx === dayIndex;
  });
}
