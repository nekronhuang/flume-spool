'use strict'

const path = require('path')
const EventEmitter = require('events')
const fs = require('fs-extra')
const debug = require('debug')('flume-spool:flume-spool')

const defaultOpt = {
  tempDir: './flume_temp',

  interval: 60 * 1000,

  autoDelete: false,
  autoDeleteInterval: 10 * 60 * 1000,
  autoDeleteSuffixReg: /\.COMPLETED$/,

  streamEncoding: 'utf8',
  streamMode: Number.parseInt('0644', 8),
  streamFlags: 'a',
}
const constants = require('./constants')
const TEMP_PREFIX = constants.TEMP_PREFIX
const NO_SPOOL_DIR = constants.NO_SPOOL_DIR
const NOT_CORRECT_INTERVAL = constants.NOT_CORRECT_INTERVAL
const NO_STREAM = constants.NO_STREAM
const FS_ERR = constants.FS_ERR

class FlumeSpool extends EventEmitter {
  constructor(spoolDir, option) {
    super()
    this.spoolDir = spoolDir
    this.option = Object.assign({}, defaultOpt, option || {})
    debug('spoolDir: %o', this.spoolDir)
    debug('option: %o', this.option)

    if (!this.spoolDir) {
      throw new Error(NO_SPOOL_DIR)
    }

    if (Number.isNaN(Number.parseFloat(this.option.interval))) {
      throw new Error(NOT_CORRECT_INTERVAL)
    }

    try {
      fs.ensureDirSync(this.spoolDir)
      fs.ensureDirSync(this.option.tempDir)
    } catch (err) {
      throw err
    }

    this._openStream().then(() => {
      this.emit('open')
      const loopFn = this._transfer.bind(this)
      this.loop = setInterval(loopFn, this.option.interval)
    })

    if (this.option.autoDelete) {
      const deleteLoopFn = () => {
        return fs.readdirAsync(this.spoolDir).then((files) => {
          const array = files.filter((file) => this.option.autoDeleteSuffixReg.test(file))
          return Promise.resolve(array)
        }).then((files) => {
          const tasks = files.map((file) => {
            const p = path.resolve(this.spoolDir, file)
            return fs.unlinkAsync(p)
          })
          return Promise.all(tasks)
        }).catch((err) => {
          debug('auto delete file error: %o', err)
          this.emit('error', FS_ERR + err.message)
        })
      }
      this.deleteLoop = setInterval(deleteLoopFn, this.option.autoDeleteInterval)
    }
  }

  write(content) {
    if (this.stream) {
      this.stream.write(content)
    } else {
      debug('no stream when write content: %s', content)
      this.emit('error', new Error(NO_STREAM))
    }
  }

  close() {
    this._closeStream()
    clearInterval(this.loop)
    clearInterval(this.deleteLoop)
    this.emit('close')
  }

  _openStream() {
    return new Promise((resolve, reject) => {
      if (this.stream) {
        this._closeStream()
      }
      return resolve()
    }).then(() => {
      const streamFile = path.resolve(this.option.tempDir, `${TEMP_PREFIX}${Date.now()}.log`)
      this.stream = fs.createWriteStream(streamFile, {
        flags: this.option.streamFlags,
        encoding: this.option.streamEncoding,
        mode: this.option.streamMode,
      })

      this.stream.on('error', this._closeStream)
      return Promise.resolve()
    })
  }

  _closeStream(err) {
    if (this.stream && this.stream.end) {
      this.stream.end()
      this.stream = null
      if (err) {
        this.emit('error', err)
      }
    }
  }

  _transfer() {
    const time = Date.now() - this.option.interval
    return this._openStream().then(() => {
      return fs.readdirAsync(this.option.tempDir)
    }).then((files) => {
      const regexp = new RegExp(`^${TEMP_PREFIX}\\d+\\.log$`, 'i')
      const array = files.filter((file) => regexp.test(file) && file.match(/\d+/)[0] <= time)
      return Promise.resolve(array)
    }).then((files) => {
      debug('files: %o', files)
      const tasks = files.map((file) => {
        const oldPath = path.resolve(this.option.tempDir, file)
        return fs.statAsync(oldPath).then((stat) => {
          debug('file(%s) stat: %o', file, stat)
          if (stat.size === 0) {
            return fs.unlinkAsync(oldPath)
          }
          const newPath = path.resolve(this.spoolDir, file)
          return fs.renameAsync(oldPath, newPath)
        }).catch((err) => {
          debug('transfer file error: %o', err)
          this.emit('error', FS_ERR + err.message)
        })
      })
      return Promise.all(tasks)
    }).then(() => {
      this.emit('transfer')
    }).catch((err) => {
      this.emit('error', err)
    })
  }
}

module.exports = FlumeSpool
