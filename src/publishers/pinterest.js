const { http, FORM, form, ogImage, truncate } = require('../util');

const base = () => process.env.PINTEREST_API_BASE || 'https://api.pinterest.com/v5';
let cached;

async function getToken() {
  if (cached) return cached;
  const { PINTEREST_REFRESH_TOKEN: r, PINTEREST_APP_ID: id, PINTEREST_APP_SECRET: sec } = process.env;
  if (r && id && sec) {
    try {
      const d = await http(base() + '/oauth/token', {
        method: 'POST',
        headers: { ...FORM, Authorization: 'Basic ' + Buffer.from(id + ':' + sec).toString('base64') },
        body: form({ grant_type: 'refresh_token', refresh_token: r })
      });
      cached = d.access_token;
      return cached;
    } catch (e) {
      if (!process.env.PINTEREST_ACCESS_TOKEN) throw e;
    }
  }
  cached = process.env.PINTEREST_ACCESS_TOKEN;
  return cached;
}

module.exports = {
  name: 'pinterest',
  defaultTemplate: '{summary}',
  maxLen: 500,
  configured: () => {
    const e = process.env;
    return !!(e.PINTEREST_BOARD_ID && (e.PINTEREST_ACCESS_TOKEN || (e.PINTEREST_REFRESH_TOKEN && e.PINTEREST_APP_ID && e.PINTEREST_APP_SECRET)));
  },
  async publish({ item, text }) {
    const image = item.image || (await ogImage(item.link));
    if (!image) throw new Error('Is article mein image nahi mili (Pinterest ko image chahiye)');
    const d = await http(base() + '/pins', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + (await getToken()), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        board_id: process.env.PINTEREST_BOARD_ID,
        title: truncate(item.title, 100),
        description: text || truncate(item.title, 500),
        link: item.link,
        media_source: { source_type: 'image_url', url: image }
      })
    });
    return String(d.id);
  }
};
