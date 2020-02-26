const {fork} = require('child_process')
const {BigQuery} = require('@google-cloud/bigquery')
const bigquery = new BigQuery()

/**
 * options.children: the amount of child processes you like to start
 */
const options = {
  children: 70,
  interval: {
    stats: 1,
    persist: 1
  },
  generated: 0,
  started: Math.round(new Date() / 1000),
  datasetId: 'xrpl_vanity',
  tableId: 'accounts',
  buffer: [],
  persist: {
    chars: 15
  }
}

let statsInterval = setInterval(() => {
  const secondsRunning = Math.round(new Date() / 1000) - options.started
  console.log(`Generated: ${options.generated}, generations /second: ${Math.round(options.generated / secondsRunning)}`)
}, options.interval.stats * 1000)

const insertRowsAsStream = async rows => {
  try {
    await bigquery
      .dataset(options.datasetId)
      .table(options.tableId)
      .insert(rows.map(r => {
        for (let i = 0; i <= options.persist.chars - 1; i++) {
          r[`f${i + 1}`] = r.Address.split('').slice(i + 1, i + 2)[0]
          r[`r${i + 1}`] = r.Address.split('').reverse().slice(i, i + 1)[0]
        }
        return r
      }))

    console.log(`      > BigQuery: Inserted ${rows.length} rows`)
  } catch (e) {
    console.log(`      > BigQuery Insert ERROR(s):`)
    console.log(e.errors.map(r => r.errors[0]))
  }
}

let persistInterval = setInterval(() => {
  const buffer = options.buffer
  options.buffer = []

  insertRowsAsStream(buffer)
}, options.interval.persist * 1000)

/**
 * Launch one child
 */
const launch = async data => {
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
        case 'store':
          msg.data.forEach(r => {
            options.buffer.push(r)
          })
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
  clearInterval(persistInterval)
})
