// stalker-manager.js (top)
const axiosBase = require('axios');
const { CookieJar } = require('tough-cookie');
const { wrapper } = require('axios-cookiejar-support');

// ...
function buildClient(baseUrl, mac) {
  const jar = new CookieJar();
  const axios = wrapper(axiosBase.create({
    baseURL: baseUrl.replace(/\/$/, '') + '/server/load.php',
    timeout: 15000,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (QtEmbedded; U; Linux; C) AppleWebKit/533.3',
      'X-User-Agent': 'Model: MAG254; Link: Ethernet',
      'Accept': 'application/json, text/javascript, */*; q=0.01',
      'Referer': baseUrl.replace(/\/$/, '') + '/c/',
    }
  }));

  axios.defaults.jar = jar; // tell axios-cookiejar-support to use our jar

  // Seed cookies for the portal
  jar.setCookieSync(`mac=${mac.toUpperCase()}; Path=/;`, new URL(baseUrl).origin);
  jar.setCookieSync(`stb_lang=en; Path=/;`, new URL(baseUrl).origin);

  return axios;
}


async function handshake(axios) {
  const res = await axios.get('', { params: { type: 'stb', action: 'handshake', prehash: 0 }});
  if (!res.data || !res.data.token) throw new Error('Stalker handshake failed');
  return res.data.token;
}

async function getProfile(axios, token) {
  const res = await axios.get('', { params: { type: 'stb', action: 'get_profile' },
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
}

async function getAllChannels(axios, token) {
  const res = await axios.get('', { params: { type: 'itv', action: 'get_all_channels', force_ch_link_check: 0 },
    headers: { Authorization: `Bearer ${token}` }
  });
  const js = res.data && (res.data.js || res.data);
  const items = (js && (js.data || js.js || js)) || [];
  return Array.isArray(items) ? items : [];
}

async function createLink(axios, token, cmd) {
  const res = await axios.get('', { params: { type: 'itv', action: 'create_link', cmd },
    headers: { Authorization: `Bearer ${token}` }
  });
  const js = res.data && (res.data.js || res.data);
  const link = js && (js.cmd || js.url || js.link || js);
  if (!link) throw new Error('No stream link returned');
  return String(link).split(' ').pop();
}

async function getShortEpg(axios, token, channelId, period = 24) {
  const res = await axios.get('', { params: { type: 'itv', action: 'get_short_epg', ch_id: channelId, period },
    headers: { Authorization: `Bearer ${token}` }
  });
  const js = res.data && (res.data.js || res.data);
  const epg = (js && (js.data || js.epg || js)) || [];
  return Array.isArray(epg) ? epg : [];
}

function normalizeChannel(ch) {
  return {
    id: String(ch.id || ch.ch_id || ch.number || ch.uid || ch.name),
    name: String(ch.name || ch.title || 'Channel'),
    logo: ch.logo || ch.logo_30x30 || ch.logo_80x80 || ch.logo_140x140 || null,
    group: ch.tv_genre_title || ch.cat || ch.category || 'TV',
    cmd: ch.cmd || ch.stream_url || ch.url || null,
    raw: ch
  };
}

async function loadPortal({ baseUrl, mac }) {
  const axios = buildClient(baseUrl, mac);
  const token = await handshake(axios);
  await getProfile(axios, token);
  const channels = (await getAllChannels(axios, token)).map(normalizeChannel);
  return { axios, token, channels };
}

module.exports = {
  buildClient,
  handshake,
  getProfile,
  getAllChannels,
  createLink,
  getShortEpg,
  normalizeChannel,
  loadPortal
};
