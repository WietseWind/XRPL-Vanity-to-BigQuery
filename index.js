const {fork} = require('child_process')
const {BigQuery} = require('@google-cloud/bigquery')
const bigquery = new BigQuery()

/**
 * options.children: the amount of child processes you like to start
 */
const options = {
  children: 2,
  recordCountStore: 7500,
  datasetId: 'xrpl_vanity',
  tableId: 'accounts',
  persist: {
    chars: 12
  }
}

let buffer = []

const insertRowsAsStream = rows => {
  bigquery
    .dataset(options.datasetId)
    .table(options.tableId)
    .insert(rows.map(r => {
      for (let i = 0; i <= options.persist.chars - 1; i++) {
        r[`f${i + 1}`] = r.Address.split('').slice(i + 1, i + 2)[0]
        r[`r${i + 1}`] = r.Address.split('').reverse().slice(i, i + 1)[0]
      }
      return r
    }))
    .then(r => {
      console.log(`      > BigQuery: Inserted ${rows.length} rows`)
    })
    .catch(e => {
      console.log(`      > BigQuery Insert ERROR(s):`)
      console.log(e.errors.map(r => r))  
    })
}

/**
 * Launch one child
 */
const launch = data => {
  const child = fork(__dirname + '/child.js')

  child.on('message', msg => {
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
        // case 'found':
        //   children.forEach(c => c.kill('SIGINT'))
        //   console.log(`Child ${msg.type}:`, msg.data)
        //   break;
        case 'store':
          if (buffer.length % 1000 === 0) {
            console.log('Buffer length', buffer.length)
          }
          if (buffer.length >= options.recordCountStore) {
            console.log(`Storing ${buffer.length} records...`)
            const _buffer = buffer
            buffer = []

            insertRowsAsStream(_buffer)
          }

          buffer.push(...(msg.data))
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
process.on('SIGINT', () => {
  console.log(' --- STOPPING (PARENT: SIGINT) --- ')
  setTimeout(() => {
    console.log('Running children #', children.filter(c => c.connected).length)
  }, 500)
})
