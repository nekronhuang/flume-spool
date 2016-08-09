'use strict'

const FlumeSpool = require('../')
const log = new FlumeSpool('./spool', {
  interval: 10000,

  // autoDelete: true,
  // autoDeleteInterval: 15 * 1000,
  // autoDeleteSuffixReg: /\.log$/,
})

// event listeners
log.on('error', (err) => {
  console.log('error')
}).on('open', () => {
  console.log('open')
}).on('transfer', () => {
  console.log('transfer')
}).on('close', () => {
  console.log('close')
})

// functions
setInterval(() => {
  log.write('test\n')
}, 9000)

setTimeout(() => {
  log.close()
}, 20000)
