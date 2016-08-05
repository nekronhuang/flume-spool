global.Promise = require('bluebird')

Promise.promisifyAll(require('fs-extra'))

module.exports = require('./flume-spool')
