var definitions = require('@bunsn/boiler/statement-definitions')
var Statement = require('@bunsn/boiler/statement')
var CSV = require('./lib/csv')
var download = require('./lib/download')

var definition = definitions.findBy('host', window.location.host)
var statement = new Statement(definition)
var keys = ['date', 'type', 'description', 'amount']
var csv = CSV.stringify(statement.transactions.toArray(keys))
var blob = new Blob([csv], { type: 'text/csv' })

download(URL.createObjectURL(blob), { filename: statement.name() })
