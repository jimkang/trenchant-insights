var edgeFilters = require('./edge-filters');
var makeNode = require('./make-node');
var _ = require('lodash');

function createOppositeGetter(opts) {
  var conceptNet = opts.conceptNet;
  var lookupOpts = opts.lookupOpts;

  function getOpposites(node, done) {
    conceptNet.lookup(node.newConcept, lookupOpts, filterForOpposites);

    function filterForOpposites(error, concept) {
      if (error) {
        done(error);
      }
      else {
        var opposingEdges = edgeFilters.filterToOpposites(concept.edges);
        var makeChildNode = _.curry(makeNode)(node.newConcept);
        var opposingNodes = opposingEdges.map(makeChildNode);
        done(error, opposingNodes);
      }
    }
  }

  return {
    getOpposites: getOpposites
  };
}

module.exports = {
  create: createOppositeGetter
};
