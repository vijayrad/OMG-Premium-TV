
const Stalker = require('./stalker-manager');

async function resolveStalker(item, config) {
  if (!item || item.type !== 'stalker') return null;
  const portal = config.stalker && config.stalker.baseUrl;
  const mac = (config.stalker && config.stalker.mac) || '00:1A:79:00:00:00';
  if (!portal || !item.stalker || !item.stalker.cmd) return null;
  const axios = Stalker.buildClient(portal, mac);
  const token = await Stalker.handshake(axios);
  const url = await Stalker.createLink(axios, token, item.stalker.cmd);
  return { url };
}

module.exports = { resolveStalker };
