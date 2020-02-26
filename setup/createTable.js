const {BigQuery} = require('@google-cloud/bigquery')

const main = async (
  datasetId = 'my_dataset',
  tableId = 'my_new_table',
  schema = [
    {name: 'Address', type: 'STRING', mode: 'REQUIRED'},
    {name: 'FamilySeed', type: 'STRING', mode: 'REQUIRED'},
  ]
) => {
  const bigquery = new BigQuery()

  async function deleteTable() {
    try {
      await bigquery
        .dataset(datasetId)
        .table(tableId)
        .delete()

        console.log(`Table ${tableId} deleted.`)
    } catch (e) {}
  }
  
  await deleteTable()

  const push = {
    forward: [],
    backward: []
  }
  for (let i = 1; i <= 12; i++) {
    push.forward.push({name: `f${i}`, type: 'STRING'})
    push.backward.push({name: `r${i}`, type: 'STRING'})
  }

  async function createTable() {
    const options = {
      schema: [ ...schema, ...(push.forward), ...(push.backward) ],
      location: 'EU'
    }

    const [table] = await bigquery
      .dataset(datasetId)
      .createTable(tableId, options)

    console.log(`Table ${table.id} created.`)
  }

  await createTable()
}

main(...process.argv.slice(2))
