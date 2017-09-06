/// <reference path="../stengg-typings/index.d.ts" />

import LoDashStatic = _.LoDashStatic;

const uuid = require('uuid');
const request = require('request');
var _: LoDashStatic = require('lodash');

const NAME = 'nx-sails-swagger-api';

module.exports = function (sails: any, swagger: any): void {

	if (!swagger) {
		throw new Error('[API NOT LOADED] A reference to a Swagger document is required parameter to ' + NAME);
	}
	else if (_.isString(swagger)) {
		throw new Error('[API NOT LOADED] ' + NAME + ' : ' + swagger);
	}

	_.each(_.keys(swagger.paths), function (path) {

		let pathDef: any = swagger.paths[path];

		_.each(_.keys(pathDef), function (vertex: any) {

			let vertexDef: any = pathDef[vertex];

			let route: any = vertex.toUpperCase() + ' ' + ( swagger.basePath || '' ) + '' + path;

			route = route.replace(/{/g, ':').replace(/}/g, '');

			console.log('Binding...' + route);

			sails.router.bind(route, function (req: any, res: any, next: Function) {

				let protocol: any = _.startsWith(swagger.host, 'http') ? '' : 'http://';
				let targetUrlTemplate: any = protocol + swagger.host + ( swagger.basePath || '' ) + path;
				let templateFn: any = _.template(targetUrlTemplate, {
					interpolate: /{([\s\S]+?)}/g
				});

				let params: any = req.allParams();

				let targetUrl: any = templateFn(params);

				let headers: any = req.headers;

				_.unset(headers, 'cookie');
				_.unset(headers, 'host');
				_.unset(headers, 'user-agent');
				_.unset(headers, 'referer');

				let reqOut: any = {
					url: targetUrl,
					method: vertex,
					body: ( req.body || null ),
					qs: req.transport != 'socket.io' ? req.query : req.body,
					json: true,
					headers: headers
				};

				let $request: any = sails.$request(req.session) || request;
				$request(reqOut, function (err: Error, message: any, body: any): void {

					console.log('*************************');
					console.log('' + vertex + ' ' + targetUrl);
					console.log('-------------------------');
					console.dir(headers);
					console.log('=========================');
					console.dir(body);

					if (params && body && !params.id && !_.isArray(body)) {
						body.id = body.id || uuid.v4();
						body = [body];
					}
					else if (_.isArray(body)) {
						_.each(body, function (item: any) {
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
