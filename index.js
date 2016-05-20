var _ = require('lodash');
var request = require('request');
var ensureHttp = require('ensure-http');

module.exports = function(sails, swagger) {

  _.each(_.keys(swagger.paths), function(path) {

    var pathDef = swagger.paths[path];

    _.each(_.keys(pathDef), function(vertex) {

      var vertexDef = pathDef[vertex];

      var route = vertex.toUpperCase() +' '+ ( swagger.basePath || '' ) +''+ path;

      sails.router.bind(route, function(req, res, next) {

        var targetUrl = ensureHttp(swagger.host + ( swagger.basePath || '' ) + path);

        var req = { url: targetUrl, method: vertex, body: ( req.body || null ), json: true };
        request(req, function(err, message, body) {

          res.ok(body);
        })
      })
    })
  })
}
