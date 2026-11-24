const Parser = require('rss-parser');
const { stripHtml } = require('./util');

const parser = new Parser({
  timeout: 20000,
  customFields: {
    item: [['media:content', 'mediaContent'], ['media:thumbnail', 'mediaThumb'], ['content:encoded', 'contentEncoded']]
  }
});

function findImage(it) {
  if (it.enclosure && it.enclosure.url && /image/i.test(it.enclosure.type || 'image')) return it.enclosure.url;
  if (it.mediaContent && it.mediaContent.$ && it.mediaContent.$.url) return it.mediaContent.$.url;
  if (it.mediaThumb && it.mediaThumb.$ && it.mediaThumb.$.url) return it.mediaThumb.$.url;
  const m = (it.contentEncoded || it.content || '').match(/<img[^>]+src=["']([^"']+)["']/i);
  return m ? m[1] : null;
}

// Newest first return karta hai
async function fetchRss(auto) {
  if (!auto.url) throw new Error('RSS URL missing');
  const feed = await parser.parseURL(auto.url);
  return (feed.items || [])
    .map((it) => ({
      guid: it.guid || it.link || it.title,
      title: (it.title || '').trim(),
      link: it.link || '',
      image: findImage(it),
      summary: stripHtml(it.contentSnippet || it.contentEncoded || it.content || '').slice(0, 600)
    }))
    .filter((i) => i.guid && i.link);
}

module.exports = { fetchRss };
