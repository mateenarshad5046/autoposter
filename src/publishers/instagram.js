const { http, FORM, form, ogImage, sleep } = require('../util');

const token = () => process.env.INSTAGRAM_ACCESS_TOKEN || process.env.FACEBOOK_PAGE_TOKEN;

module.exports = {
  name: 'instagram',
  defaultTemplate: '{title}\n\n{summary}\n\nRead more: {link}',
  maxLen: 2200,
  configured: () => !!(process.env.INSTAGRAM_USER_ID && token()),
  async publish({ item, text }) {
    const v = process.env.GRAPH_API_VERSION || 'v24.0';
    const base = `https://graph.facebook.com/${v}`;
    const uid = process.env.INSTAGRAM_USER_ID;
    const image = item.image || (await ogImage(item.link));
    if (!image) throw new Error('Is article mein image nahi mili (Instagram ko image chahiye)');

    const c = await http(`${base}/${uid}/media`, {
      method: 'POST', headers: FORM,
      body: form({ image_url: image, caption: text, access_token: token() })
    });
    for (let i = 0; i < 10; i++) {
      const s = await http(`${base}/${c.id}?fields=status_code&access_token=${encodeURIComponent(token())}`);
      if (s.status_code === 'FINISHED') break;
      if (s.status_code === 'ERROR' || s.status_code === 'EXPIRED') throw new Error('Instagram media processing failed: ' + s.status_code);
      await sleep(3000);
    }
    const p = await http(`${base}/${uid}/media_publish`, {
      method: 'POST', headers: FORM,
      body: form({ creation_id: c.id, access_token: token() })
    });
    return p.id;
  }
};
