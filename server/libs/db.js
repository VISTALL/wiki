'use strict'

/* global ROOTPATH, appconfig, winston */

const modb = require('mongoose')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

/**
 * MongoDB module
 *
 * @return     {Object}  MongoDB wrapper instance
 */
module.exports = {

  /**
   * Initialize DB
   *
   * @return     {Object}  DB instance
   */
  init() {
    let self = this

    let dbModelsPath = path.join(SERVERPATH, 'models')

    modb.Promise = require('bluebird')

    // Event handlers

    modb.connection.on('error', err => {
      winston.error('Failed to connect to MongoDB instance.')
      return err
    })
    modb.connection.once('open', function () {
      winston.log('Connected to MongoDB instance.')
    })

    // Store connection handle

    self.connection = modb.connection
    self.ObjectId = modb.Types.ObjectId

    // Load DB Models

    fs
      .readdirSync(dbModelsPath)
      .filter(function (file) {
        return (file.indexOf('.') !== 0)
      })
      .forEach(function (file) {
        let modelName = _.upperFirst(_.camelCase(_.split(file, '.')[0]))
        self[modelName] = require(path.join(dbModelsPath, file))
      })

    var options = {
      server: {
      },
      useMongoClient: true
    };

    if(appconfig.db.auth == 'x509') {
      var x509 = appconfig.db.x509
      options.server.ssl = x509.ssl;
      options.server.sslCert = x509.sslCert != undefined ? fs.readFileSync(x509.sslCert) : null;
      options.server.sslKey = x509.sslKey != undefined ? fs.readFileSync(x509.sslKey) : null;
      options.server.sslCA = x509.sslCA != undefined ? fs.readFileSync(x509.sslCA) : null;
      options.server.sslValidate = x509.sslValidate;
    }

    // Connect

    self.onReady = modb.connect(appconfig.db.uri, options)

    return self
  }

}
