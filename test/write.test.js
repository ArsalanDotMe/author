'use strict';

const Lab = require('lab');
const Code = require('code');
const Promise = require('bluebird');
const _ = require('lodash');
const joi = Promise.promisifyAll(require('joi'));
const author = require('../lib/index.js');

const lab = exports.lab = Lab.script();

const configSchema = joi.object().required();
const routesSchema = joi.array().required();

const manuscriptSchema = joi.object().keys({
  version: joi.string().required(),
  createdAt: joi.date().required(),
  config: configSchema,
  routes: routesSchema,
});

lab.experiment('Author', () => {

  lab.test('Basic test', done => {
    const doc = author();
    joi.validate(manuscriptSchema, doc, done);
  });

  lab.test('Static configuration', done => {
    const staticConfig = {
      title: 'My Application Title',
      version: '0.0.0',
    };
    const doc = author().staticConfig(staticConfig);

    Code.expect(doc.config.static).to.deep.equal(staticConfig);
  });

  lab.test('Dynamic Configuration', done => {
    const defaultConfig = {
      host: 'localhost',
      port: 8057,
      db: {
        api: {
          host: 'localhost',
          user: 'arsalanahmad',
          password: '',
          database: 'todos',
          port: 5432,
          schema: [
            `CREATE TABLE todos (
              "id"      serial,
              "title"   text,
              "done"    boolean DEFAULT true,
              "order"   integer,
              PRIMARY KEY("id")
            )`,
          ],
        },
      },
    };
    const productionConfig = {
      port: 80,
    };

    const doc = author().dynamicConfig(defaultConfig).dynamicConfig('production', productionConfig);

    Code.expect(doc.config.dynamic.default).to.deep.equal(defaultConfig);
    Code.expect(doc.config.dynamic.production).to.deep.equal(productionConfig);
  });

  lab.test('Specify Routes', done => {
    const routes = [
      {
        method: 'GET',
        path: '/',
        description: 'optional',
        operations: [{
          type: 'db',
          config: {},
        }],
      },
    ];

    const singleRoute = {
      method: 'POST',
      path: '/hello',
      operations: [{
        type: 'something',
        config: {},
      }],
    };

    const doc = author().addRoute(routes).addRoute(singleRoute);

    Code.expect(doc.routes).to.have.length(2);
    Code.expect(doc.routes).to.deep.include(singleRoute);
    Code.expect(doc.routes).to.deep.include(routes);
  });
});
