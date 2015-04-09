function truncateURIToBareConcept(uri) {
  var parts = uri.split('/');
  if (parts.length > 4) {
    parts = parts.slice(0, 4);
  }
  return parts.join('/');
}

module.exports = truncateURIToBareConcept;
