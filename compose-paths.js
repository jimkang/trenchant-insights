var _ = require('lodash');
var edgeFilters = require('./edge-filters');

// function composePaths(rootConceptUri, primaryEdge, secondaryEdges) {
//   var startConceptUri = primaryEdge.start;
//   var endConceptUri = primaryEdge.end;

//   var pathBase = [
//     {
//       newConcept: rootConceptUri
//     },
//     {
//       vector: {
//         rel: primaryEdge.rel,
//         start: startConceptUri,
//         end: endConceptUri
//       },
//       newConcept: notX(rootConceptUri, [startConceptUri, endConceptUri])
//     }
//   ];

//   var paths;

//   if (secondaryEdges) {
//     secondaryEdges = edgeFilters.filterConceptOutOfEdges(
//       secondaryEdges, rootConceptUri
//     );

//     paths = secondaryEdges.map(addToPath);

//     function addToPath(secondaryEdge) {
//       var path = _.cloneDeep(pathBase);
//       var pathNode = {
//         vector: _.pick(secondaryEdge, 'start', 'rel', 'end'),
//         newConcept: notX(
//           pathBase[1].newConcept, [secondaryEdge.start, secondaryEdge.end]
//         )
//       };
//       path.push(pathNode);
//       return path;
//     }
//   }
//   else {
//     paths = [pathBase]
//   }

//   return paths;
// }


function composePath(rootConceptUri, primaryEdge) {
  var startConceptUri = primaryEdge.start;
  var endConceptUri = primaryEdge.end;

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
  return [pathBase];
}

// Assumes either pair[0] == x or pair[1] === x.
function notX(x, pair) {
  return (pair[0] === x) ? pair[1] : pair[0];
}

module.exports = composePaths;
