const {fork} = require('child_process')

/**
 * options.children: the amount of child processes you like to start
 */
const options = {
  children: 88,
  generated: 0,
  started: Math.round(new Date() / 1000)
}

let statsInterval = setInterval(() => {
  const secondsRunning = Math.round(new Date() / 1000) - options.started
  console.log(`Generated: ${options.generated}, generations /second: ${Math.round(options.generated / secondsRunning)}`)
}, 5000)

/**
 * Launch one child
 */
const launch = data => {
  const child = fork(__dirname + '/child.js')

  child.on('message', async msg => {
    if (typeof msg === 'object' && msg !== null && typeof msg.type === 'string') {
      switch (msg.type) {
        case 'start':
          if (msg.pid === child.pid) {
            child.send({
              type: 'start',
              data
            })
          }
          break;
        case 'found':
          children.forEach(c => c.kill('SIGINT'))
          console.log(`Child ${msg.type}:`, msg.data)
          break;
        case 'progress':
          options.generated += msg.data
          break;
        case 'log':
        default:
          console.log('Child message:', msg)
      }
    }
  })

  child.on('exit', (code, signal) => {
    // console.log('Child exit:', {code, signal})
  })

  return child
}

/**
 * Launch all children
 */
const children = Array.apply(null, Array(options.children)).map(a => {
  return launch(null)
})

console.log('Running children #', children.filter(c => c.connected).length)

/**
 * If the parent receives a SIGINT, allow the children to
 * stop and report the amount of remaining (running) children.
 * Should be zero.
 */
process.on('SIGINT', async () => {
  console.log(' --- STOPPING (PARENT: SIGINT) --- ')
  setTimeout(() => {
    console.log('Running children #', children.filter(c => c.connected).length)
  }, 500)
  clearInterval(statsInterval)
})
