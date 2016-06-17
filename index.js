var _ = require('lodash');
var request = require('request');
var ensureHttp = require('ensure-http');

module.exports = function (sails, swagger) {

    _.each(_.keys(swagger.paths), function (path) {

        var pathDef = swagger.paths[path];

        _.each(_.keys(pathDef), function (vertex) {

            var vertexDef = pathDef[vertex];

            var route = vertex.toUpperCase() + ' ' + ( swagger.basePath || '' ) + '' + path;

            route = route.replace(/{/g, ':').replace(/}/g, '');

            console.log('Binding...' + route);

            sails.router.bind(route, function (req, res, next) {

                var targetUrlTemplate = ensureHttp(swagger.host + ( swagger.basePath || '' ) + path);
                var templateFn = _.template(targetUrlTemplate, {
                    interpolate: /{([\s\S]+?)}/g
                });

                var params = req.allParams();

                var targetUrl = templateFn(params);

                var reqOut = {url: targetUrl, method: vertex, body: ( req.body || null ), json: true};
                request(reqOut, function (err, message, body) {

                    if (!err) {
                        res
                            .status(message.statusCode)
                            .send(body);
                    }
                    else {
                        res.error(err);
                    }
                })
            })
        })
    })
}
