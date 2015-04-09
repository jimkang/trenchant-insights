var multilevelCacheTools = require('multilevel-cache-tools');

function createCachedConceptNet(conceptNet) {
  var memoizedLookup = multilevelCacheTools.client.memoize({
    fn: conceptNet.lookup.bind(conceptNet),
    port: 5678
  });

  return {
    lookup: memoizedLookup
  };
}

module.exports = createCachedConceptNet;
