// Placeholders: {title} {link} {summary} {feed}
function render(tpl, item, auto) {
  const map = { title: item.title, link: item.link, summary: item.summary, feed: auto.name };
  return String(tpl)
    .replace(/\{(title|link|summary|feed)\}/g, (_, k) => map[k] || '')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
module.exports = { render };
