const publishers = {
  facebook: require('./facebook'),
  instagram: require('./instagram'),
  threads: require('./threads'),
  pinterest: require('./pinterest')
};

function configuredMap() {
  const out = {};
  for (const [k, p] of Object.entries(publishers)) out[k] = !!p.configured();
  return out;
}

module.exports = { publishers, configuredMap };
