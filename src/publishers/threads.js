const { http, FORM, form, sleep } = require('../util');

const BASE = 'https://graph.threads.net/v1.0';

module.exports = {
  name: 'threads',
  defaultTemplate: '{title}',
  maxLen: 500,
  configured: () => !!(process.env.THREADS_USER_ID && process.env.THREADS_ACCESS_TOKEN),
  async publish({ item, text }) {
    const uid = process.env.THREADS_USER_ID;
    const t = process.env.THREADS_ACCESS_TOKEN;
    const c = await http(`${BASE}/${uid}/threads`, {
      method: 'POST', headers: FORM,
      body: form({ media_type: 'TEXT', text, link_attachment: item.link, access_token: t })
    });
    await sleep(4000); // Meta recommend karta hai publish se pehle intezar
    const p = await http(`${BASE}/${uid}/threads_publish`, {
      method: 'POST', headers: FORM,
      body: form({ creation_id: c.id, access_token: t })
    });
    return p.id;
  }
};
