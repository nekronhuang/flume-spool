const FlumeSpool = require('../index')
const log = new FlumeSpool('./tmp', {
  interval: 10000,

  autoDelete: true,
  autoDeleteInterval: 15 * 1000,
  autoDeleteSuffixReg: /\.log$/,
})

log.on('error', (err) => {
  console.error(err)
})
