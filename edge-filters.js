var truncateURIToBareConcept = require('./truncate-uri-to-bare-concept');

function filterToJudgeableEdges(edges, rootConceptUri) {
  var judgeables = edges.filter(edgeIsJudgeable);
  return judgeables.filter(isAEdgeStartsWithRoot);

  function isAEdgeStartsWithRoot(edge) {
    // if (edge.rel === '/r/IsA') {
    //   console.log('IsA start:', edge.start, 'end:', edge.end);
    // }
    return edge.rel !== '/r/IsA' || edge.start === rootConceptUri;
  }
}

var judgeableRelTypes = [
  'IsA',
  'UsedFor',
  'CapableOf',
  'Causes',
  'HasProperty',
  'MotivatedByGoal',
  'Desires',
  'CreatedBy'
]
.map(prefixWithRelPath);

function prefixWithRelPath(rel) {
  return '/r/' + rel;
}

function edgeIsJudgeable(edge) {
  return edge.rel && relationIsJudgeable(edge.rel);
}

function relationIsJudgeable(rel) {
  return judgeableRelTypes.indexOf(rel) !== -1;
}

function filterConceptOutOfEdges(edges, conceptUri) {
  return edges.filter(edgeDoesNotHaveConceptInStartOrEnd);

  function edgeDoesNotHaveConceptInStartOrEnd(edge) {
    return truncateURIToBareConcept(edge.start) !== conceptUri &&
      truncateURIToBareConcept(edge.end) !== conceptUri;
  }
}

var opposingRelTypes = [
  'Antonym'
]
.map(prefixWithRelPath);

var falseAntonyms = [
  ['eat', 'drink'],
  ['age', 'young']
]
.map(prefixPairWithConceptPath);

falseAntonyms = falseAntonyms.concat(falseAntonyms.map(reversePair));
falseAntonyms = falseAntonyms.map(JSON.stringify);

// console.log('falseAntonyms', falseAntonyms);

function reversePair(pair) {
  return [pair[1], pair[0]];
}

function prefixPairWithConceptPath(pair) {
  return pair.map(prefixWithConceptPath);
}

function prefixWithConceptPath(name) {
  return '/c/en/' + name;
}

function filterToOpposites(edges) {
  return edges.filter(edgeIsAnOpposite);
}

function edgeIsAnOpposite(edge) {
  var isAnOpposite = (opposingRelTypes.indexOf(edge.rel) !== -1);

  if (isAnOpposite) {
    var pairKey = JSON.stringify([
      truncateURIToBareConcept(edge.start),
      truncateURIToBareConcept(edge.end)
    ]);

    isAnOpposite = (falseAntonyms.indexOf(pairKey) === -1);
  }

  return isAnOpposite;
}

function filterNegativesOutOfEdges(edges, conceptUri) {
  return edges.filter(edgeIsNotANegative);
}

function edgeIsNotANegative(edge) {
  return edge.rel.indexOf('/r/Not') !== 0;
}

// function filterOutDeadEnds(edges) {
//   return edges.filter(edgeIsNotADeadEnd)
// }

module.exports = {
  filterToJudgeableEdges: filterToJudgeableEdges,
  filterConceptOutOfEdges: filterConceptOutOfEdges,
  relationIsJudgeable: relationIsJudgeable,
  filterToOpposites: filterToOpposites,
  filterNegativesOutOfEdges: filterNegativesOutOfEdges
};
