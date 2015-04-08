var ConceptNet = require('concept-net');
var async = require('async');
var _ = require('lodash');
var callBackOnNextTick = require('conform-async').callBackOnNextTick;
var edgeFilters = require('../edge-filters');
var makeNode = require('../make-node');
// var queue = require('queue-async');
var createOppositeGetter = require('../opposite-getter').create;

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

var oppositeGetter = createOppositeGetter({
  conceptNet: conceptNet,
  lookupOpts: lookupOpts
});

async.waterfall(
  [
    lookUpRootConcept,
    getEdgesFromConcept,
    buildRootConnectedNodes,
    // buildPathsFromPrimaryEdges,
    storeJudgeableNodes,
    addJudgeableProperties,
    searchRootConnectedNodesForOppositesOfJudgeables,
    // getJudgeableEdges,
    // getPrimaryEdgeEndJudgmentPaths,
    logConceptInfo    
  ],
  conclude
);

var searchState = {
  rootConceptUri: rootConceptUri,
  judgeableNodes: undefined,
  rootConnectedNodes: undefined
};

function lookUpRootConcept(done) {
  conceptNet.lookup(rootConceptUri, lookupOpts, done);
}

function getEdgesFromConcept(concept, done) {
  callBackOnNextTick(done, null, concept.edges);
}

function getJudgeableEdges(primaryEdges, done) {
  var filtered = edgeFilters.filterToJudgeableEdges(
    concept.edges, rootConceptUri
  );
  callBackOnNextTick(done, null, filtered);
}

function storeJudgeableNodes(nodes, done) {
  searchState.judgeableNodes = nodes.filter(nodeIsJudgeable);
  callBackOnNextTick(done, null, searchState.judgeableNodes);
}

// Passes back paths.
// function storeAsRootConnectedNodes(paths, done) {
//   searchState.rootConnectedNodes = paths.map(getLast);
//   callBackOnNextTick(done, null, paths);
// }

function getLast(array) {
  if (array && array.length > 0) {
    return array[array.length - 1];
  }
}

function searchRootConnectedNodesForOppositesOfJudgeables(judgeables, done) {
  var judgeableConcepts = _.pluck(_.flatten(_.pluck(judgeables, 'judgeableNodes')), 'newConcept');
  console.log('judgeableConcepts', judgeableConcepts);
  var rootConnectedIndex = 0;

  function runGetOpposites() {
    oppositeGetter.getOpposites(
      searchState.rootConnectedNodes[rootConnectedIndex],
      checkOppositesForMatches
    );
  }

  function checkOppositesForMatches(error, opposingNodes) {
    if (error) {
      done(error);
    }
    else {
      var opposingConcepts = _.pluck(opposingNodes, 'newConcept');
      console.log('opposingConcepts', opposingConcepts);
      var matches = _.intersection(judgeableConcepts, opposingConcepts);      

      if (matches.length > 0) {
        debugger;
        done(error, matches); // TODO more context.
      }
      else {
        rootConnectedIndex += 1;
        if (rootConnectedIndex < searchState.rootConnectedNodes.length) {
          callBackOnNextTick(runGetOpposites);
        }
        else {
          done(error);
        }
      }
    }
  }

  runGetOpposites();
}


function pathEndIsJudgeable(path) {
  return path.length > 1 && edgeFilters.relationIsJudgeable(path[1].vector.rel);
}

function nodeIsJudgeable(node) {
  return edgeFilters.relationIsJudgeable(node.vector.rel);
}

function buildRootConnectedNodes(primaryEdges, done) {
  var madeNodeWithRoot = _.curry(makeNode)(rootConceptUri);
  searchState.rootConnectedNodes = primaryEdges.map(madeNodeWithRoot);
  callBackOnNextTick(done, null, searchState.rootConnectedNodes);
}

function addJudgeableProperties(judgeableNodes, done) {
  async.mapLimit(judgeableNodes, 4, addJudgeablePropertiesToNode, done);
}

function addJudgeablePropertiesToNode(node, done) {
  conceptNet.lookup(node.newConcept, lookupOpts, lookupDone);

  function lookupDone(error, childConcept) {
    if (error) {
      done(error);
    }
    else {
      var judgeableEdges = edgeFilters.filterToJudgeableEdges(
        childConcept.edges
      );
      var makeChildNode = _.curry(makeNode)(node.newConcept);
      node.judgeableNodes = judgeableEdges.map(makeChildNode);
      done(error, node);
    }
  }
}

function buildPathsFromPrimaryEdges(primaryEdges, done) {
  async.mapLimit(primaryEdges, 4, buildPathsFromPrimaryEdge, done);
}

function buildPathsFromPrimaryEdge(primaryEdge, done) {
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
  console.log('Path count:', info.length);
  console.log('Search state:', JSON.stringify(searchState, null, '  '));
}

function logEdge(edge) {
  // console.log(edge.start, edge.rel, edge.end);
}

function conclude(error) {
  if (error) {
    console.log(error);
  }
}
