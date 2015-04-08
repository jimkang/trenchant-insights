var ConceptNet = require('concept-net');
var async = require('async');
var _ = require('lodash');
var callBackOnNextTick = require('conform-async').callBackOnNextTick;
var edgeFilters = require('../edge-filters');
var composePaths = require('../compose-paths');
// var queue = require('queue-async');

var cmdOpts = require('nomnom').parse();

var rootConceptName = cmdOpts[0];

if (!rootConceptName) {
  process.exit();
}

var rootConceptUri = '/c/en/' + rootConceptName;
var conceptNet = new ConceptNet('conceptnet5.media.mit.edu', 80, '5.3');

var lookupOpts = {
  filter: 'core',
  limit: 100
};

async.waterfall(
  [
    lookUpRootConcept,
    getJudgeableEdges,
    getPrimaryEdgeEndJudgmentPaths,
    logConceptInfo    
  ],
  conclude
);

function lookUpRootConcept(done) {
  conceptNet.lookup(rootConceptUri, lookupOpts, done);
}

function getJudgeableEdges(concept, done) {
  var filtered = edgeFilters.filterToJudgeableEdges(
    concept.edges, rootConceptUri
  );
  callBackOnNextTick(done, null, filtered);
}

function getPrimaryEdgeEndJudgmentPaths(primaryEdges, done) {
  async.mapLimit(primaryEdges, 4, getPrimaryEdgeEndJudgmentPath, done);
}

function getPrimaryEdgeEndJudgmentPath(primaryEdge, done) {
  conceptNet.lookup(primaryEdge.end, lookupOpts, lookupDone);

  function lookupDone(error, secondaryConcept) {
    if (error) {
      done(error);
    }
    else {
      done(
        error,
        composePaths(rootConceptUri, primaryEdge, secondaryConcept.edges)
      );
    }
  }
}

function logConceptInfo(info) {
  // info.forEach(logEdge);
  // console.log(_.pluck(info, 'end'));
  // console.log(_.pluck(info, 'edges'));
  console.log(JSON.stringify(info, null, '  '));
}

function logEdge(edge) {
  // console.log(edge.start, edge.rel, edge.end);
}

function conclude(error) {
  if (error) {
    console.log(error);
  }
}
