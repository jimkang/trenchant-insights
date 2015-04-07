var ConceptNet = require('concept-net');
var async = require('async');
var _ = require('lodash');
var callBackOnNextTick = require('conform-async').callBackOnNextTick;
var edgeFilters = require('../edge-filters');
// var queue = require('queue-async');

var cmdOpts = require('nomnom').parse();

var rootConceptName = cmdOpts[0];

if (!rootConceptName) {
  process.exit();
}

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
  conceptNet.lookup('/c/en/' + rootConceptName, lookupOpts, done);
}

function getJudgeableEdges(concept, done) {
  var filtered = edgeFilters.filterToJudgeableEdges(
    concept.edges, '/c/en/' + rootConceptName
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
        composeJudgementPath(primaryEdge, secondaryConcept.edges)
      );
    }
  }
}

function composeJudgementPath(primaryEdge, secondaryEdges) {
  var startConceptUri = primaryEdge.start;
  var endConceptUri = primaryEdge.end;

  var tertiaryJudgeableEdges = edgeFilters.filterToJudgeableEdges(
    secondaryEdges, endConceptUri
  );
  tertiaryJudgeableEdges = edgeFilters.filterConceptOutOfEdges(
    secondaryEdges, '/c/en/' + rootConceptName
  );

  return [
    {
      root: rootConceptName,
      rel: primaryEdge.rel,
      start: startConceptUri,
      end: endConceptUri
    },
    {
      conceptUri: endConceptUri,
      judgeableEdges: tertiaryJudgeableEdges
    }
  ];
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
