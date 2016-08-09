'use strict'

const fs = require('fs-extra')
const path = require('path')
const chai = require('chai')
const assert = chai.assert

const FlumeSpool = require('../')
const SPOOL_DIR = './spool'
const TEMP_DIR = './flume_temp'

describe('FlumeSpool', function () {
  let log

  after(function () {
    try {
      fs.removeSync(TEMP_DIR)
      fs.removeSync(SPOOL_DIR)
    } catch (err) {
      console.error(err)
    }
  })

  afterEach(function () {
    if (log) {
      log.close()
      log = null
    }
  })

  describe('Parameters', function () {
    it('throw an error when no log path is provided', function (done) {
      try {
        log = new FlumeSpool(null)
      } catch (err) {
        assert.instanceOf(err, Error)
        done()
      }
    })

    it('throw an error when a wrong interval is provided', function (done) {
      try {
        log = new FlumeSpool(SPOOL_DIR, {
          interval: 'wrong number',
        })
      } catch (err) {
        assert.instanceOf(err, Error)
        done()
      }
    })
  })

  describe('Constructor', function () {
    it('emit an open event when being initialized', function (done) {
      log = new FlumeSpool(SPOOL_DIR)
      log.on('open', done)
    })

    it('should create a temp file after being opened', function (done) {
      log = new FlumeSpool(SPOOL_DIR)
      log.on('open', () => {
        fs.stat(log.stream.path, (err) => {
          assert.isNull(err)
          done()
        })
      })
    })

    it('emit a transfer event when the temporary file is transfered', function (done) {
      this.timeout(5000)
      let oldPath
      log = new FlumeSpool(SPOOL_DIR, {
        interval: 100,
      })
      log.on('open', () => {
        oldPath = log.stream.path
      })
      log.on('transfer', () => {
        const filename = path.basename(oldPath)
        const newPath = path.resolve(SPOOL_DIR, filename)
        fs.stat(oldPath, (err) => {
          assert.instanceOf(err, Error)
          fs.stat(newPath, (err) => {
            assert.instanceOf(err, Error)
            done()
          })
        })
      })
    })

    it('should transfer the file when the file is not empty', function (done) {
      let filename
      log = new FlumeSpool(SPOOL_DIR, {
        interval: 100,
      })
      log.on('open', () => {
        filename = path.basename(log.stream.path)
        log.write('test')
      })
      log.on('transfer', () => {
        const newPath = path.resolve(SPOOL_DIR, filename)
        fs.stat(newPath, (err) => {
          assert.isNull(err)
          done()
        })
      })
    })

    it('emit an error event when the temporary stream is closed', function (done) {
      log = new FlumeSpool(SPOOL_DIR)
      log.on('close', () => {
        log.write('content')
      })
      log.on('error', (err) => {
        assert.instanceOf(err, Error)
        done()
      })
      log.close()
      log = null
    })

    it('emit a close event when being closed', function (done) {
      log = new FlumeSpool(SPOOL_DIR)
      log.on('close', done)
      log.close()
      log = null
    })
  })
})