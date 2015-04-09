var _ = require('lodash');
var truncateURIToBareConcept = require('./truncate-uri-to-bare-concept');

function makeNode(baseConceptUri, primaryEdge) {
  var startConceptUri = primaryEdge.start;
  var endConceptUri = primaryEdge.end;

  return {
    vector: {
      rel: primaryEdge.rel,
      start: truncateURIToBareConcept(startConceptUri),
      end: truncateURIToBareConcept(endConceptUri),
      surfaceText: primaryEdge.surfaceText
    },
    newConcept: truncateURIToBareConcept(
      notX(baseConceptUri, [startConceptUri, endConceptUri])
    )
  };
}

// Assumes either pair[0] == x or pair[1] === x.
function notX(x, pair) {
  return (pair[0] === x) ? pair[1] : pair[0];
}

module.exports = makeNode;
