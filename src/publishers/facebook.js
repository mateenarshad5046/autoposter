const { http, FORM, form } = require('../util');

module.exports = {
  name: 'facebook',
  defaultTemplate: '{title}',
  maxLen: 60000,
  configured: () => !!(process.env.FACEBOOK_PAGE_ID && process.env.FACEBOOK_PAGE_TOKEN),
  async publish({ item, text }) {
    const v = process.env.GRAPH_API_VERSION || 'v24.0';
    const d = await http(`https://graph.facebook.com/${v}/${process.env.FACEBOOK_PAGE_ID}/feed`, {
      method: 'POST',
      headers: FORM,
      body: form({ message: text, link: item.link, access_token: process.env.FACEBOOK_PAGE_TOKEN })
    });
    return d.id;
  }
};
