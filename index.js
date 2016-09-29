var _ = require('lodash');
var uuid = require('uuid');
var request = require('request');


var NAME = 'nx-sails-swagger-api';

module.exports = function (sails, swagger) {

    if(!swagger) {
        console.error('[API NOT LOADED] A reference to a Swagger document is required parameter to '+ NAME);
        return;
    }

    _.each(_.keys(swagger.paths), function (path) {

        var pathDef = swagger.paths[path];

        _.each(_.keys(pathDef), function (vertex) {

            var vertexDef = pathDef[vertex];

            var route = vertex.toUpperCase() + ' ' + ( swagger.basePath || '' ) + '' + path;

            route = route.replace(/{/g, ':').replace(/}/g, '');

            console.log('Binding...' + route);

            sails.router.bind(route, function (req, res, next) {

                var protocol = _.startsWith(swagger.host, 'http') ? '' : 'http://';
                var targetUrlTemplate = protocol + swagger.host + ( swagger.basePath || '' ) + path;
                var templateFn = _.template(targetUrlTemplate, {
                    interpolate: /{([\s\S]+?)}/g
                });

                var params = req.allParams();

                var targetUrl = templateFn(params);

                var headers = req.headers;

                _.unset(headers, 'cookie');
                _.unset(headers, 'host');
                _.unset(headers, 'user-agent');
                _.unset(headers, 'referer');

                var reqOut = {
                    url: targetUrl,
                    method: vertex,
                    body: ( req.body || null ),
                    qs: req.transport != 'socket.io' ? req.query : req.body,
                    json: true
                    ,
                    headers: headers
                };

                request(reqOut, function (err, message, body) {

                    console.log('*************************');
                    console.log(''+ vertex +' '+ targetUrl);
                    console.log('-------------------------');
                    console.dir(headers);
                    console.log('=========================');
                    console.dir(body);

                    if (params && body && !params.id && !_.isArray(body)) {
                        body.id = body.id || uuid.v4();
                        body = [body];
                    }
                    else if (_.isArray(body)) {
                        _.each(body, function (item) {
                            item.id = item.id || uuid.v4();
                        });
                    }

                    if (!err) {
                        res
                            .status(message.statusCode)
                            .send(body);
                    }
                    else {
                        res.serverError(err);
                    }
                })
            })
        })
    })
};
