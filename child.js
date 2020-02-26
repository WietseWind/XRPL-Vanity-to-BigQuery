const keypairs = require('ripple-keypairs')

/**
 * The log() method sends data to the parent
 */
const log = function () {
  process.send({
    type: 'log',
    pid: process.pid,
    data: arguments
      ? (arguments.length === 1 ? arguments[0] : arguments)
      : undefined
  })
}

/**
 * Notify the parent we started
 */
process.send({
  type: 'start',
  pid: process.pid,
  data: null
})

/**
 * Handle a message from the parent. Default: console.log()
 */
process.on('message', async msg => {
  if (typeof msg === 'object' && msg !== null && typeof msg.type === 'string') {
    switch (msg.type) {
      case 'start':
        main(msg.data)
        break;
      default:
        console.log('Child received message:', msg)
    }
  }
})

/**
 * Code, modify to do whatever you like it to do.
 * Send data (object) to the parent with the log() method.
 */
const main = async data => {
  const stats = {
    generated: 0,
    reportPer: 25
  }

  while (true) {
    const seed = keypairs.generateSeed()
    const keypair = keypairs.deriveKeypair(seed)
    const address = keypairs.deriveAddress(keypair.publicKey)
    stats.generated++
    if (stats.generated % stats.reportPer === 0) {
      process.send({
        type: 'progress',
        pid: process.pid,
        data: stats.reportPer
      })
    }

    if (address.slice(1).match(/^(xummpro|XUMMPRO)|(xummpro|XUMMPRO)$/)) {
      process.send({
        type: 'found',
        pid: process.pid,
        data: {seed, address}
      })
    }
  }
}
