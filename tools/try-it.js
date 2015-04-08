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
        composeJudgementPath(primaryEdge, secondaryConcept.edges)
      );
    }
  }
}

function composeJudgementPath(primaryEdge, secondaryEdges) {
  var startConceptUri = primaryEdge.start;
  var endConceptUri = primaryEdge.end;

  var secondaryJudgeableEdges = edgeFilters.filterToJudgeableEdges(
    secondaryEdges, endConceptUri
  );
  secondaryJudgeableEdges = edgeFilters.filterConceptOutOfEdges(
    secondaryEdges, rootConceptUri
  );

  var pathBase = [
    {
      newConcept: rootConceptUri
    },
    {
      vector: {
        rel: primaryEdge.rel,
        start: startConceptUri,
        end: endConceptUri
      },
      newConcept: notX(rootConceptUri, [startConceptUri, endConceptUri])
    }
  ];

  var paths = secondaryJudgeableEdges.map(addToPath);
  function addToPath(secondaryEdge) {
    var path = _.cloneDeep(pathBase);
    var pathNode = {
      vector: _.pick(secondaryEdge, 'start', 'rel', 'end'),
      newConcept: notX(
        pathBase[1].newConcept, [secondaryEdge.start, secondaryEdge.end]
      )
    };
    path.push(pathNode);
    return path;
  }

  return paths;
}

// Assumes either pair[0] == x or pair[1] === x.
function notX(x, pair) {
  return (pair[0] === x) ? pair[1] : pair[0];
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
