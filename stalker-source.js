
const Stalker = require('./stalker-manager');

async function fetchStalkerItems(config, cache) {
  const portal = config.stalker && config.stalker.baseUrl;
  const mac = (config.stalker && config.stalker.mac) || '00:1A:79:00:00:00';
  if (!portal) return [];
  const cacheKey = `stalker:${portal}:${mac}`;
  const cached = cache && cache.get && cache.get(cacheKey);
  if (cached) return cached;

  const { axios, token, channels } = await Stalker.loadPortal({ baseUrl: portal, mac });
  const items = channels.map(ch => ({
    id: `stalker:${ch.id}`,
    name: ch.name,
    group_title: ch.group || 'TV',
    tvg_logo: ch.logo || null,
    url: null,
    type: 'stalker',
    stalker: { cmd: ch.cmd, id: ch.id },
    raw: ch
  }));

  if (cache && cache.set) cache.set(cacheKey, items, 60 * 15);
  return items;
}

module.exports = { fetchStalkerItems };
