
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
  return edge.rel && judgeableRelTypes.indexOf(edge.rel) !== -1;
}

function filterConceptOutOfEdges(edges, conceptUri) {
  return edges.filter(edgeDoesNotHaveConceptInStartOrEnd);

  function edgeDoesNotHaveConceptInStartOrEnd(edge) {
    return edge.start !== conceptUri && edge.end !== conceptUri;
  }
}

module.exports = {
  filterToJudgeableEdges: filterToJudgeableEdges,
  filterConceptOutOfEdges: filterConceptOutOfEdges
};