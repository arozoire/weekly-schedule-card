export function detectDomain(entityId) {
  return entityId?.split('.')[0] || 'unknown';
}

export function domainIconMdi(entityId) {
  const map = {
    climate:      ['mdi:thermometer',      '#F44336'],
    switch:       ['mdi:toggle-switch',    '#2196F3'],
    light:        ['mdi:lightbulb',        '#FFC107'],
    fan:          ['mdi:fan',              '#00BCD4'],
    cover:        ['mdi:window-shutter',   '#9C27B0'],
    input_boolean:['mdi:checkbox-marked',  '#4CAF50'],
    media_player: ['mdi:television-play',  '#FF5722'],
  };
  const d = (entityId || '').split('.')[0];
  return map[d] || ['mdi:calendar-clock', '#607D8B'];
}

export function tempToColor(temp) {
  if (temp == null) return '#9E9E9E';
  const ratio = Math.min(1, Math.max(0, (temp - 10) / 15));
  return `rgb(${Math.round(33 + ratio * 211)},${Math.round(150 - ratio * 83)},${Math.round(243 - ratio * 189)})`;
}

export function blockColor(schedule, entityConf) {
  if (detectDomain(entityConf?.entity) === 'climate')
    return tempToColor(schedule.attributes.actions?.[0]?.data?.temperature ?? null);
  return entityConf?.color || '#9E9E9E';
}
