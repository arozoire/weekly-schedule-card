export function getSchedules(hass, entityId) {
  if (!hass || !entityId) return [];
  return Object.values(hass.states).filter(s =>
    s.entity_id.startsWith('switch.schedule_') &&
    s.attributes.entities?.includes(entityId)
  );
}

export async function waitForNewSchedule(hass, beforeIds) {
  for (let i = 0; i < 6; i++) {
    await new Promise(r => setTimeout(r, 500));
    const newId = Object.keys(hass.states).find(k => k.startsWith('switch.schedule_') && !beforeIds.has(k));
    if (newId) return newId;
  }
  return null;
}
