var _ = require('lodash');

function makeNode(baseConceptUri, primaryEdge) {
  var startConceptUri = primaryEdge.start;
  var endConceptUri = primaryEdge.end;

  return {
    vector: {
      rel: primaryEdge.rel,
      start: normalizeURI(startConceptUri),
      end: normalizeURI(endConceptUri)
    },
    newConcept: normalizeURI(notX(baseConceptUri, [startConceptUri, endConceptUri]))
  };
}

// Assumes either pair[0] == x or pair[1] === x.
function notX(x, pair) {
  return (pair[0] === x) ? pair[1] : pair[0];
}

function normalizeURI(uri) {
  var parts = uri.split('/');
  if (parts.length > 4) {
    parts = parts.slice(0, 4);
  }
  return parts.join('/');
}


module.exports = makeNode;
