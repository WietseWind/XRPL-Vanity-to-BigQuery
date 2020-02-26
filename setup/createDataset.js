const {BigQuery} = require('@google-cloud/bigquery')

const main = async (datasetId = 'my_new_dataset') => {  
  const bigquery = new BigQuery()

  async function createDataset() {
    const options = {
      location: 'EU'
    }

    const [dataset] = await bigquery.createDataset(datasetId, options)
    console.log(`Dataset ${dataset.id} created.`)
  }

  return createDataset()
}

main(...process.argv.slice(2))
