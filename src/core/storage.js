export async function wsGet(hass) {
  const result = await hass.connection.sendMessagePromise({
    type: 'frontend/get_user_data',
    key: 'weekly_schedule_card',
  });
  return result?.value || { groups: [], profiles: [], activeProfiles: [] };
}

export async function wsSet(hass, data) {
  await hass.connection.sendMessagePromise({
    type: 'frontend/set_user_data',
    key: 'weekly_schedule_card',
    value: data,
  });
}
