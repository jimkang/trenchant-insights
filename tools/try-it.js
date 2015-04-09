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

async.series(
  [
    buildPrimaryNodes,
    storeJudgeableNodes,
    storeOppositesOfJudgeables,
    // addJudgeableProperties,
    // searchRootConnectedNodesForOppositesOfJudgeables,
    // getJudgeableEdges,
    // getPrimaryEdgeEndJudgmentPaths,
    searchRootConnectedChildrenForOpposites,
    logConceptInfo
  ],
  conclude
);

var searchState = {
  rootConceptUri: rootConceptUri,
  judgeableNodes: undefined,
  rootConnectedNodes: undefined,
  nodesForOppositeConcepts: {},
  oppositePairs: [],
  rootNodesCache: {},
  oppositeNodesCache: {}
};

function buildPrimaryNodes(done) {
  async.waterfall(
    [
      lookUpRootConcept,
      getEdgesFromConcept,
      buildRootConnectedNodes
    ],
    done
  );
}

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

function storeJudgeableNodes(done) {
  searchState.judgeableNodes = searchState.rootConnectedNodes
    .filter(nodeIsJudgeable);
  callBackOnNextTick(done);
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

function searchRootConnectedChildrenForOpposites(done) {
  var childIndex = 0;
  var currentChildURI;

  function runGetChildren() {
    currentChildURI = searchState.rootConnectedNodes[childIndex].newConcept;
    conceptNet.lookup(currentChildURI, lookupOpts, checkEdgesForMatches);
  }

  function checkEdgesForMatches(error, childConcept) {
    if (error) {
      done(error);
    }
    else {
      var makeChildNode = _.curry(makeNode)(currentChildURI);
      var nonNegativeEdges = edgeFilters.filterNegativesOutOfEdges(
        childConcept.edges
      );
      var childNodes = nonNegativeEdges.map(makeChildNode);
      var childConceptURIs = _.pluck(childNodes, 'newConcept');
      // console.log('childConceptURIs', childConceptURIs);

      for (var i = 0; i < childConceptURIs.length; ++i) {
        var uri = childConceptURIs[i];
        if (uri in searchState.nodesForOppositeConcepts) {
          var rootConnectedNode = searchState.nodesForOppositeConcepts[uri];
          rootConnectedURI = rootConnectedNode.newConcept;
          if (rootConnectedURI === currentChildURI) {
            continue;
          }
          var oppositeNode = searchState.oppositeNodesCache[uri];
          searchState.oppositePairs.push([
            rootConnectedNode,
            [
              searchState.rootConnectedNodes[childIndex],
              childNodes[i],
              oppositeNode
            ]
          ]);
        }
      }

      childIndex += 1;
      if (childIndex < searchState.rootConnectedNodes.length) {
        callBackOnNextTick(runGetChildren);
      }
      else {
        done(error);
      }
    }
  }

  runGetChildren();
}


function pathEndIsJudgeable(path) {
  return path.length > 1 && edgeFilters.relationIsJudgeable(path[1].vector.rel);
}

function nodeIsJudgeable(node) {
  return edgeFilters.relationIsJudgeable(node.vector.rel);
}

function buildRootConnectedNodes(primaryEdges, done) {
  var makeNodeWithRoot = _.curry(makeNode)(rootConceptUri);
  var filteredPrimaries = edgeFilters.filterNegativesOutOfEdges(primaryEdges);
  searchState.rootConnectedNodes = filteredPrimaries.map(makeNodeWithRoot);
  var cacheRootNode = _.curry(cacheNode)(searchState.rootNodesCache);
  searchState.rootConnectedNodes.forEach(cacheRootNode);
  callBackOnNextTick(done, null, searchState.rootConnectedNodes);
}

function storeOppositesOfJudgeables(done) {
  async.eachLimit(searchState.judgeableNodes, 4, storeOppositeOfNode, done);

  function storeOppositeOfNode(node, storeDone) {
    conceptNet.lookup(node.newConcept, lookupOpts, lookupDone);

    function lookupDone(error, childConcept) {
      if (error) {
        storeDone(error);
      }
      else {
        var oppositeEdges = edgeFilters.filterToOpposites(childConcept.edges);
        oppositeEdges.forEach(storeOpposite);
        storeDone(error);
      }
    }

    function storeOpposite(edge) {
      var oppositeNode = makeNode(node.newConcept, edge);
      if (node.newConcept !== oppositeNode.newConcept) {
        cacheNode(searchState.oppositeNodesCache, oppositeNode);
        searchState.nodesForOppositeConcepts[oppositeNode.newConcept] = node;
      }
    }    
  }
}

function cacheNode(cache, node) {
  cache[node.newConcept] = node;
}

function logConceptInfo(info) {
  // info.forEach(logEdge);
  // console.log(_.pluck(info, 'end'));
  // console.log(_.pluck(info, 'edges'));
  // console.log(JSON.stringify(info, null, '  '));
  // console.log('Path count:', info.length);
  // console.log('oppositeNodesCache', JSON.stringify(searchState.oppositeNodesCache, null, '  '));

  console.log('oppositePairs:', JSON.stringify(searchState.oppositePairs, null, '  '));
}

function logEdge(edge) {
  // console.log(edge.start, edge.rel, edge.end);
}

function conclude(error) {
  if (error) {
    console.log(error);
  }
}
