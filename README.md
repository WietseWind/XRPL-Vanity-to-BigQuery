# Generate XRPL seeds & derive r-addresses

Generate a random seed for the XRPL (family seed) and derive the address. Store them in Google BigQuery for easy vanity address finding.

## Setup:

```
node setup/createDataset.js xrpl_vanity
node setup/createTable.js xrpl_vanity accounts
```
