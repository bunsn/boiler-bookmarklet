(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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

},{"./lib/csv":3,"./lib/download":4,"@bunsn/boiler/statement":15,"@bunsn/boiler/statement-definitions":11}],2:[function(require,module,exports){
/**
 * Converts a two-dimensional array to a delimiter-separated string
 */

function arrayToDSV (array, delimiter) {
  return array.map(processRow).join('\n')

  function processRow (array) {
    return array.map(processItem).join(delimiter)
  }

  function processItem (item) {
    if (item == null) return ''

    item = String(item)

    var hasDoubleQuote = /"/.test(item)
    var hasLineBreak = /[\n\r]/.test(item)
    var hasDelimiter = new RegExp(delimiter).test(item)

    if (hasDoubleQuote) item = escapeDoubleQuotes(item)
    if (hasDoubleQuote || hasLineBreak || hasDelimiter) {
      item = wrapInDoubleQuotes(item)
    }

    return item
  }

  function escapeDoubleQuotes (item) {
    return item.replace(/"/g, '""')
  }

  function wrapInDoubleQuotes (item) {
    return '"' + item + '"'
  }
}

module.exports = arrayToDSV

},{}],3:[function(require,module,exports){
var arrayToDSV = require('./array-to-dsv')

module.exports = {
  stringify: function (array) { return arrayToDSV(array, ',') }
}

},{"./array-to-dsv":2}],4:[function(require,module,exports){
function download (url, options) {
  options = options || {}

  var a = document.createElement('a')
  a.href = url
  a.download = options.filename

  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

module.exports = download

},{}],5:[function(require,module,exports){
var makeNumber = require('./make-number')

/**
 * Removes any non-numerical symbols and returns the absolute value.
 * Useful for converting numbers formatted as currency.
 * e.g. "-£3,426.72" converts to 3426.72
 * @returns {Number}
 */

module.exports = function makeAbsoluteNumber (value) {
  var number = makeNumber(value)
  if (number == null) return null
  return Math.abs(number)
}

},{"./make-number":6}],6:[function(require,module,exports){
/**
 * Removes any non-numerical symbols.
 * Useful for converting numbers formatted as currency.
 * e.g. "-£3,426.72" converts to -3426.72
 * @returns {Number}
 */

module.exports = function makeNumber (value) {
  var number = Number(String(value).replace(/[^\d\.-]/g, ''))
  return number || null
}

},{}],7:[function(require,module,exports){
var monthFormats = {
  MMM: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
  MMMM: ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
}

function parseDate (dateString, format) {
  var formatParts = format.match(/(D{1,2})|(M{1,4})|(Y{2,4})/g)
  var dateRegex = RegExp(format.replace(/DD?/, '(\\d\\d?)')
                               .replace(/M{3,4}/, '([a-zA-Z]{3,})')
                               .replace(/MM?/, '(\\d\\d?)')
                               .replace(/Y{2,4}/, '(\\d{2,4})'))
  var dateParts = dateString.match(dateRegex)

  if (dateParts) {
    dateParts = dateParts.splice(1)
  } else {
    throw new Error('Cannot parse: `' + dateString + '` with format: `' + format + '`')
  }

  function getPartIndex (regex) {
    for (var i = 0; i < formatParts.length; i++) {
      if (regex.test(formatParts[i])) return i
    }
  }

  var date = dateParts[getPartIndex(/D/)]

  // Get month part and convert to number compatible with `Date`

  var month = (function getMonth () {
    var i = getPartIndex(/M/)
    var monthFormat = formatParts[i]
    var datePart = dateParts[i].toLowerCase()
    var month

    if (monthFormat.length > 2) {
      month = monthFormats[monthFormat].indexOf(datePart)
    } else {
      month = Number(datePart) - 1
    }

    return month
  })()

  // Get year part and convert to number compatible with `Date`

  var year = (function getYear () {
    var year = dateParts[getPartIndex(/Y/)]

    if (year && (year.length === 2)) year = '20' + year

    return year
  })()

  return { year: year, month: month, date: date }
}

module.exports = parseDate

},{}],8:[function(require,module,exports){
module.exports = function (object) {
  return (typeof object === 'function') ? object.call(object) : object
}

},{}],9:[function(require,module,exports){
/**
 * Represents a table node
 */

function Table (element) {
  this.element = element
}

/**
 * @returns A 2D array representation of the given rows
 */

Table.prototype.rowsToArray = function (rows, options) {
  options = options || {}
  var processRow = options.processRow || id
  var processCell = options.processCell || id

  return map(rows, function (tr, rowIndex, rows) {
    var row = map(tr.cells, function (node, cellIndex, cells) {
      return processCell(nodeText(node), cellIndex, cells, node)
    })

    return processRow(row, rowIndex, rows, tr)
  })
}

/**
 * @returns A 2D array representation of the table
 */

Table.prototype.toArray = function () {
  return this.rowsToArray(this.element.querySelectorAll('tbody tr'))
}

/**
 * Squashed and trimmed node text content
 */

function nodeText (node) {
  return squashWhitespace(node.textContent)

  function squashWhitespace (string) {
    return string.replace(/\s{2,}/g, ' ').trim()
  }
}

/**
 * map for NodeLists
 */

function map (array, enumerator) {
  return Array.prototype.map.call(array, enumerator)
}

/**
 * Identity function
 * @returns Its input!
 */

function id (x) { return x }

module.exports = Table

},{}],10:[function(require,module,exports){
/**
 * Maps keys to values
 * @param {Array} keys - An array of keys
 * @param {Array} values - An array of raw values
 * @returns {Object}
 */

function weld (keys, values) {
  var object = {}
  for (var i = keys.length - 1; i >= 0; i--) object[keys[i]] = values[i]
  return object
}

module.exports = weld

},{}],11:[function(require,module,exports){
var statementDefinitions = [
  require('./statement-definitions/cater-allen'),
  require('./statement-definitions/hsbc'),
  require('./statement-definitions/natwest')
]

statementDefinitions.findBy = function (key, value) {
  for (var i = this.length - 1; i >= 0; i--) {
    var definition = this[i]
    if (definition[key] === value) return definition
  }
  return null
}

module.exports = statementDefinitions

},{"./statement-definitions/cater-allen":12,"./statement-definitions/hsbc":13,"./statement-definitions/natwest":14}],12:[function(require,module,exports){
module.exports = {
  institution: 'Cater Allen',
  host: 'www.caterallenonline.co.uk',
  columns: ['date', 'description', 'paidOut', 'paidIn', 'balance'],
  dateFormat: 'DDMMMYYYY',
  rows: function () {
    return document.querySelectorAll('table[summary="Table consists of Date, Reference, Payments, Reciepts and Balance columns, displaying recent account transactions"] tbody:nth-of-type(2) tr')
  }
}

},{}],13:[function(require,module,exports){
module.exports = {
  institution: 'HSBC',
  host: 'www.hsbc.co.uk',
  columns: ['date', 'type', 'description', 'paidOut', 'paidIn', 'balance'],
  dateFormat: 'DD MMM',
  rows: function () {
    return document.querySelectorAll('table[summary="This table contains a statement of your account"] tbody tr')
  },
  date: function () {
    var selectors = [
      // For Previous Statements
      '#content > div.containerMain div.hsbcTextRight',

      // For Recent Transactions
      '#detail-switch > table > tbody > tr:nth-child(3) > td.extTableColumn2'
    ]

    for (var i = 0; i < selectors.length; i++) {
      var dateString = document.querySelector(selectors[i]).textContent
      if (Date.parse(dateString)) return new Date(dateString)
    }
  }
}

},{}],14:[function(require,module,exports){
module.exports = {
  institution: 'NatWest',
  host: 'www.nwolb.com',
  columns: ['date', 'type', 'description', 'paidIn', 'paidOut', 'balance'],
  dateFormat: 'D MMM YYYY',
  rows: function () {
    return window.frames.ctl00_secframe.contentDocument.querySelectorAll('.ItemTable tbody tr')
  }
}

},{}],15:[function(require,module,exports){
var result = require('./lib/result')
var Table = require('./lib/table')
var weld = require('./lib/weld')
var Transaction = require('./transaction')
var Transactions = require('./transactions')

/**
 * Represents a Statement
 * @constructor
 * @param {Object} attributes - Usually a statement definition
 */

function Statement (attributes) {
  for (var key in attributes) {
    if (attributes.hasOwnProperty(key)) this[key] = result(attributes[key])
  }

  // Convert table rows to array of transactions
  var transactions = Table.prototype.rowsToArray(this.rows, {
    processRow: function (row) {
      return this.createTransaction(weld(this.columns, row))
    }.bind(this)
  })
  this.transactions = new Transactions(transactions, this)
}

/**
 * Creates a transaction from an object of attributes.
 * @returns {Transaction}
 */

Statement.prototype.createTransaction = function (attributes) {
  attributes.dateString = attributes.date
  attributes.dateFormat = this.dateFormat
  delete attributes.date
  return new Transaction(attributes)
}

/**
 * @returns {String} The name of the statement based on the statement date
 */

Statement.prototype.name = function () {
  var label = this.institution + ' Statement'

  if (this.transactions.length) {
    return label + ' ' + this.transactions.last().getFormatted('date')
  }
  return label
}

module.exports = Statement

},{"./lib/result":8,"./lib/table":9,"./lib/weld":10,"./transaction":18,"./transactions":19}],16:[function(require,module,exports){
var parseDate = require('./lib/parse-date')

/**
 * Represents a transaction date
 * @constructor
 * @private
 */

function TransactionDate (dateString, format, options) {
  options = options || {}
  var parsed = parseDate(dateString, format)

  this.year = parsed.year
  this.month = parsed.month
  this.date = parsed.date

  if (!this.year && options.succeedingDate) {
    this.year = this.calculateYear(options.succeedingDate)
  }
}

/**
 * @returns {Date} A native Date representation of the transaction date
 */

TransactionDate.prototype.toDate = function () {
  if (!Date.parse(this.year, this.month, this.date)) return null
  return new Date(this.year, this.month, this.date)
}

/**
 * Uses the succeeding date to determine the transaction year
 * @returns {Number}
 */

TransactionDate.prototype.calculateYear = function (succeedingDate) {
  var year = succeedingDate.getFullYear()

  // Dec - Jan
  if (succeedingDate.getMonth() === 0 && this.month === 11) year--

  return year
}

module.exports = TransactionDate

},{"./lib/parse-date":7}],17:[function(require,module,exports){
/**
 * Represents a collection of transaction dates
 * @constructor
 * @private
 * @param {Array} dates - An array of objects in the form { year: year, month: month, date: date }
 */

function TransactionDates (dates) {
  this.dates = dates
}

/**
 * Determines whether the dates are chronological or not
 * @returns {Boolean}
 */

TransactionDates.prototype.chronological = function () {
  var uniq = this.uniq()
  if (uniq.length < 2) return true

  return this.compare(uniq[0], uniq[1]) >= 0
}

/**
 * @returns {Array} The unique dates
 */

TransactionDates.prototype.uniq = function () {
  var uniqs = []

  for (var i = 0; i < this.dates.length; i++) {
    var date = this.dates[i]
    if (inUniqs(date)) continue
    uniqs.push(date)
  }

  return uniqs

  // Determines whether a date already exists in the uniqs array
  function inUniqs (d) {
    return uniqs.some(function (u) {
      return u.year === d.year && u.month === d.month && u.date === d.date
    })
  }
}

/**
 * Compares two dates to test chronology
 * @returns {Number} 0: a == b, 1: a > b, -1: a < b
 */

TransactionDates.prototype.compare = function (a, b) {
  // If no year, and dates go from Dec - Jan, assume Dec date is older
  if ((!a.year || !b.year) && a.month === 11 && b.month === 0) return 1

  if (a.year === b.year) {
    if (a.month === b.month) {
      if (a.date > b.date) return -1
      if (a.date < b.date) return 1
      return 0
    }

    if (a.month > b.month) return -1
    if (a.month < b.month) return 1
  }
  if (a.year > b.year) return -1
  if (a.year < b.year) return 1
}

module.exports = TransactionDates

},{}],18:[function(require,module,exports){
var makeNumber = require('./lib/number/make-number')
var makeAbsoluteNumber = require('./lib/number/make-absolute-number')
var TransactionDate = require('./transaction-date')

/**
 * Represents a single transaction.
 * Getters and setters are used to transform and format values. Also responsible
 * for calculating amounts and dates when missing or invalid.
 * @constructor
 * @param {Object} attributes
 */

function Transaction (attributes) {
  this.attributes = {}

  for (var key in attributes) {
    if (attributes.hasOwnProperty(key)) this.set(key, attributes[key])
  }

  if (!this.get('date')) this.setDate()
  if (!this.get('amount')) this.setAmount()
}

/**
 * Functions that transform attributes as they are set
 */

Transaction.prototype.transformers = {
  amount: makeNumber,
  balance: makeNumber,
  paidIn: makeAbsoluteNumber,
  paidOut: makeAbsoluteNumber,
  date: function (date) {
    if (!(date instanceof Date)) return date

    // Convert to GMT to ensure correct JSON values
    date.setHours(date.getHours() - date.getTimezoneOffset() / 60)
    return date
  }
}

/**
 * Functions that format attributes when retrieved with `getFormatted`
 */

Transaction.prototype.formatters = {
  date: formatDate
}

/**
 * Transforms and sets the given attribute
 * @param {String} key - The name of the attribute
 * @param value - The value of the attribute
 */

Transaction.prototype.set = function (key, value) {
  var transformer = this.transformers[key] || idFunction
  this.attributes[key] = transformer(value)
}

/**
 * @returns the stored attribute
 */

Transaction.prototype.get = function (key) {
  return this.attributes[key]
}

/**
 * Get a value formatted by the corresponding formatter
 * @param key - The key of the value to return
 * @returns The formatted attribute
 */

Transaction.prototype.getFormatted = function (key) {
  var formatter = this.formatters[key] || idFunction
  return formatter(this.get(key))
}

/**
 * Returns an array representation of the given keys or all formatted
 * attributes.
 * @param {Array} keys - An array of attribute keys
 * @returns {Array} - An array of formatted attributes
 */

Transaction.prototype.toArray = function (keys) {
  keys = keys || Object.keys(this.attributes)
  return keys.map(this.getFormatted.bind(this))
}

/**
 * Returns an object of formatted values of the given keys or all formatted
 * attributes.
 * @param {Array} keys - An array of attribute keys
 * @returns {Array} - An array of formatted attributes
 */

Transaction.prototype.toJSON = function (keys) {
  keys = keys || Object.keys(this.attributes)
  var object = {}

  for (var i = keys.length - 1; i >= 0; i--) {
    var key = keys[i]
    object[key] = this.getFormatted(key)
  }

  return object
}

Transaction.prototype.setDate = function (attrs) {
  attrs = attrs || {}
  var dateString = attrs.dateString || this.get('dateString')
  var dateFormat = attrs.dateFormat || this.get('dateFormat')
  var succeedingDate = attrs.succeedingDate

  var transactionDate = new TransactionDate(dateString, dateFormat, {
    succeedingDate: succeedingDate
  })
  this.set('transactionDate', transactionDate)
  this.set('date', transactionDate.toDate())
}

Transaction.prototype.setAmount = function () {
  var paidIn = this.get('paidIn')
  var paidOut = this.get('paidOut')

  this.set('amount', calculateAmount(paidIn, paidOut))
}

function calculateAmount (paidIn, paidOut) {
  return paidIn || -paidOut
}

function formatDate (value) {
  var yyyy = value.getFullYear()
  var mm = padZeroes(value.getMonth() + 1)
  var dd = padZeroes(value.getDate())

  return [yyyy, mm, dd].join('-')

  function padZeroes (number) {
    return String('00' + number).slice(-2)
  }
}

function idFunction (x) { return x }

module.exports = Transaction

},{"./lib/number/make-absolute-number":5,"./lib/number/make-number":6,"./transaction-date":16}],19:[function(require,module,exports){
var TransactionDates = require('./transaction-dates')

/**
 * An array-like class that represents a collection of transactions
 * @constructor
 * @param {Array} transactions - An array of Transaction objects
 * @param {Object} statement - The parent statement
 * @returns {Array} - An array of transactions with convenience methods
 */

function Transactions (transactions, statement) {
  Transactions._injectPrototypeMethods(transactions)

  /**
   * Some financial institutions omit the year part in their date cells.
   * This workaround calculates the year for each transaction affected.
   */

  if (!/Y{2,}/.test(statement.dateFormat)) {
    if (!transactions.chronological()) transactions = transactions.reverse()

    var succeedingDate = statement.date
    for (var i = transactions.length - 1; i >= 0; i--) {
      var transaction = transactions[i]
      transaction.setDate({ succeedingDate: succeedingDate })
      succeedingDate = transaction.get('date')
    }
  }

  return transactions
}

Transactions.prototype.chronological = function () {
  return dates.call(this).chronological()

  function dates () {
    var dates = this.map(function (transaction) {
      return transaction.get('transactionDate')
    })
    return new TransactionDates(dates)
  }
}

/**
 * @returns {Transaction} The first transaction in the collection
 */

Transactions.prototype.first = function () {
  return this[0]
}

/**
 * @returns {Transaction} The last transaction in the collection
 */

Transactions.prototype.last = function () {
  return this[this.length - 1]
}

/**
 * @returns {Array} An array of formatted transaction attribute arrays
 */

Transactions.prototype.toArray = function (keys) {
  return this.map(function (transaction) { return transaction.toArray(keys) })
}

/**
 * @returns {Array} An array of formatted transaction objects
 */

Transactions.prototype.toJSON = function (keys) {
  return this.map(function (transaction) { return transaction.toJSON(keys) })
}

/**
 * Adds the prototype methods to transactions array to appear like inheritance
 * @private
 */

Transactions._injectPrototypeMethods = function (array) {
  for (var method in this.prototype) {
    if (this.prototype.hasOwnProperty(method)) {
      array[method] = this.prototype[method]
    }
  }
}

module.exports = Transactions

},{"./transaction-dates":17}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9jc3YvYXJyYXktdG8tZHN2LmpzIiwibGliL2Nzdi9pbmRleC5qcyIsImxpYi9kb3dubG9hZC5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL2xpYi9udW1iZXIvbWFrZS1hYnNvbHV0ZS1udW1iZXIuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9saWIvbnVtYmVyL21ha2UtbnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3BhcnNlLWRhdGUuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9saWIvcmVzdWx0LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3RhYmxlLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3dlbGQuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMvY2F0ZXItYWxsZW4uanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMvaHNiYy5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL3N0YXRlbWVudC1kZWZpbml0aW9ucy9uYXR3ZXN0LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvc3RhdGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvdHJhbnNhY3Rpb24tZGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL3RyYW5zYWN0aW9uLWRhdGVzLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvdHJhbnNhY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci90cmFuc2FjdGlvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDWEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7O0FDSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzlEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDVEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGRlZmluaXRpb25zID0gcmVxdWlyZSgnQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMnKVxudmFyIFN0YXRlbWVudCA9IHJlcXVpcmUoJ0BidW5zbi9ib2lsZXIvc3RhdGVtZW50JylcbnZhciBDU1YgPSByZXF1aXJlKCcuL2xpYi9jc3YnKVxudmFyIGRvd25sb2FkID0gcmVxdWlyZSgnLi9saWIvZG93bmxvYWQnKVxuXG52YXIgZGVmaW5pdGlvbiA9IGRlZmluaXRpb25zLmZpbmRCeSgnaG9zdCcsIHdpbmRvdy5sb2NhdGlvbi5ob3N0KVxudmFyIHN0YXRlbWVudCA9IG5ldyBTdGF0ZW1lbnQoZGVmaW5pdGlvbilcbnZhciBrZXlzID0gWydkYXRlJywgJ3R5cGUnLCAnZGVzY3JpcHRpb24nLCAnYW1vdW50J11cbnZhciBjc3YgPSBDU1Yuc3RyaW5naWZ5KHN0YXRlbWVudC50cmFuc2FjdGlvbnMudG9BcnJheShrZXlzKSlcbnZhciBibG9iID0gbmV3IEJsb2IoW2Nzdl0sIHsgdHlwZTogJ3RleHQvY3N2JyB9KVxuXG5kb3dubG9hZChVUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpLCB7IGZpbGVuYW1lOiBzdGF0ZW1lbnQubmFtZSgpIH0pXG4iLCIvKipcbiAqIENvbnZlcnRzIGEgdHdvLWRpbWVuc2lvbmFsIGFycmF5IHRvIGEgZGVsaW1pdGVyLXNlcGFyYXRlZCBzdHJpbmdcbiAqL1xuXG5mdW5jdGlvbiBhcnJheVRvRFNWIChhcnJheSwgZGVsaW1pdGVyKSB7XG4gIHJldHVybiBhcnJheS5tYXAocHJvY2Vzc1Jvdykuam9pbignXFxuJylcblxuICBmdW5jdGlvbiBwcm9jZXNzUm93IChhcnJheSkge1xuICAgIHJldHVybiBhcnJheS5tYXAocHJvY2Vzc0l0ZW0pLmpvaW4oZGVsaW1pdGVyKVxuICB9XG5cbiAgZnVuY3Rpb24gcHJvY2Vzc0l0ZW0gKGl0ZW0pIHtcbiAgICBpZiAoaXRlbSA9PSBudWxsKSByZXR1cm4gJydcblxuICAgIGl0ZW0gPSBTdHJpbmcoaXRlbSlcblxuICAgIHZhciBoYXNEb3VibGVRdW90ZSA9IC9cIi8udGVzdChpdGVtKVxuICAgIHZhciBoYXNMaW5lQnJlYWsgPSAvW1xcblxccl0vLnRlc3QoaXRlbSlcbiAgICB2YXIgaGFzRGVsaW1pdGVyID0gbmV3IFJlZ0V4cChkZWxpbWl0ZXIpLnRlc3QoaXRlbSlcblxuICAgIGlmIChoYXNEb3VibGVRdW90ZSkgaXRlbSA9IGVzY2FwZURvdWJsZVF1b3RlcyhpdGVtKVxuICAgIGlmIChoYXNEb3VibGVRdW90ZSB8fCBoYXNMaW5lQnJlYWsgfHwgaGFzRGVsaW1pdGVyKSB7XG4gICAgICBpdGVtID0gd3JhcEluRG91YmxlUXVvdGVzKGl0ZW0pXG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVzY2FwZURvdWJsZVF1b3RlcyAoaXRlbSkge1xuICAgIHJldHVybiBpdGVtLnJlcGxhY2UoL1wiL2csICdcIlwiJylcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyYXBJbkRvdWJsZVF1b3RlcyAoaXRlbSkge1xuICAgIHJldHVybiAnXCInICsgaXRlbSArICdcIidcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5VG9EU1ZcbiIsInZhciBhcnJheVRvRFNWID0gcmVxdWlyZSgnLi9hcnJheS10by1kc3YnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc3RyaW5naWZ5OiBmdW5jdGlvbiAoYXJyYXkpIHsgcmV0dXJuIGFycmF5VG9EU1YoYXJyYXksICcsJykgfVxufVxuIiwiZnVuY3Rpb24gZG93bmxvYWQgKHVybCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG4gIGEuaHJlZiA9IHVybFxuICBhLmRvd25sb2FkID0gb3B0aW9ucy5maWxlbmFtZVxuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSlcbiAgYS5jbGljaygpXG4gIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoYSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkb3dubG9hZFxuIiwidmFyIG1ha2VOdW1iZXIgPSByZXF1aXJlKCcuL21ha2UtbnVtYmVyJylcblxuLyoqXG4gKiBSZW1vdmVzIGFueSBub24tbnVtZXJpY2FsIHN5bWJvbHMgYW5kIHJldHVybnMgdGhlIGFic29sdXRlIHZhbHVlLlxuICogVXNlZnVsIGZvciBjb252ZXJ0aW5nIG51bWJlcnMgZm9ybWF0dGVkIGFzIGN1cnJlbmN5LlxuICogZS5nLiBcIi3CozMsNDI2LjcyXCIgY29udmVydHMgdG8gMzQyNi43MlxuICogQHJldHVybnMge051bWJlcn1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1ha2VBYnNvbHV0ZU51bWJlciAodmFsdWUpIHtcbiAgdmFyIG51bWJlciA9IG1ha2VOdW1iZXIodmFsdWUpXG4gIGlmIChudW1iZXIgPT0gbnVsbCkgcmV0dXJuIG51bGxcbiAgcmV0dXJuIE1hdGguYWJzKG51bWJlcilcbn1cbiIsIi8qKlxuICogUmVtb3ZlcyBhbnkgbm9uLW51bWVyaWNhbCBzeW1ib2xzLlxuICogVXNlZnVsIGZvciBjb252ZXJ0aW5nIG51bWJlcnMgZm9ybWF0dGVkIGFzIGN1cnJlbmN5LlxuICogZS5nLiBcIi3CozMsNDI2LjcyXCIgY29udmVydHMgdG8gLTM0MjYuNzJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYWtlTnVtYmVyICh2YWx1ZSkge1xuICB2YXIgbnVtYmVyID0gTnVtYmVyKFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvW15cXGRcXC4tXS9nLCAnJykpXG4gIHJldHVybiBudW1iZXIgfHwgbnVsbFxufVxuIiwidmFyIG1vbnRoRm9ybWF0cyA9IHtcbiAgTU1NOiBbJ2phbicsICdmZWInLCAnbWFyJywgJ2FwcicsICdtYXknLCAnanVuJywgJ2p1bCcsICdhdWcnLCAnc2VwJywgJ29jdCcsICdub3YnLCAnZGVjJ10sXG4gIE1NTU06IFsnamFudWFyeScsICdmZWJydWFyeScsICdtYXJjaCcsICdhcHJpbCcsICdtYXknLCAnanVuZScsICdqdWx5JywgJ2F1Z3VzdCcsICdzZXB0ZW1iZXInLCAnb2N0b2JlcicsICdub3ZlbWJlcicsICdkZWNlbWJlciddXG59XG5cbmZ1bmN0aW9uIHBhcnNlRGF0ZSAoZGF0ZVN0cmluZywgZm9ybWF0KSB7XG4gIHZhciBmb3JtYXRQYXJ0cyA9IGZvcm1hdC5tYXRjaCgvKER7MSwyfSl8KE17MSw0fSl8KFl7Miw0fSkvZylcbiAgdmFyIGRhdGVSZWdleCA9IFJlZ0V4cChmb3JtYXQucmVwbGFjZSgvREQ/LywgJyhcXFxcZFxcXFxkPyknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9NezMsNH0vLCAnKFthLXpBLVpdezMsfSknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9NTT8vLCAnKFxcXFxkXFxcXGQ/KScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1l7Miw0fS8sICcoXFxcXGR7Miw0fSknKSlcbiAgdmFyIGRhdGVQYXJ0cyA9IGRhdGVTdHJpbmcubWF0Y2goZGF0ZVJlZ2V4KVxuXG4gIGlmIChkYXRlUGFydHMpIHtcbiAgICBkYXRlUGFydHMgPSBkYXRlUGFydHMuc3BsaWNlKDEpXG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcGFyc2U6IGAnICsgZGF0ZVN0cmluZyArICdgIHdpdGggZm9ybWF0OiBgJyArIGZvcm1hdCArICdgJylcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFBhcnRJbmRleCAocmVnZXgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZvcm1hdFBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVnZXgudGVzdChmb3JtYXRQYXJ0c1tpXSkpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgdmFyIGRhdGUgPSBkYXRlUGFydHNbZ2V0UGFydEluZGV4KC9ELyldXG5cbiAgLy8gR2V0IG1vbnRoIHBhcnQgYW5kIGNvbnZlcnQgdG8gbnVtYmVyIGNvbXBhdGlibGUgd2l0aCBgRGF0ZWBcblxuICB2YXIgbW9udGggPSAoZnVuY3Rpb24gZ2V0TW9udGggKCkge1xuICAgIHZhciBpID0gZ2V0UGFydEluZGV4KC9NLylcbiAgICB2YXIgbW9udGhGb3JtYXQgPSBmb3JtYXRQYXJ0c1tpXVxuICAgIHZhciBkYXRlUGFydCA9IGRhdGVQYXJ0c1tpXS50b0xvd2VyQ2FzZSgpXG4gICAgdmFyIG1vbnRoXG5cbiAgICBpZiAobW9udGhGb3JtYXQubGVuZ3RoID4gMikge1xuICAgICAgbW9udGggPSBtb250aEZvcm1hdHNbbW9udGhGb3JtYXRdLmluZGV4T2YoZGF0ZVBhcnQpXG4gICAgfSBlbHNlIHtcbiAgICAgIG1vbnRoID0gTnVtYmVyKGRhdGVQYXJ0KSAtIDFcbiAgICB9XG5cbiAgICByZXR1cm4gbW9udGhcbiAgfSkoKVxuXG4gIC8vIEdldCB5ZWFyIHBhcnQgYW5kIGNvbnZlcnQgdG8gbnVtYmVyIGNvbXBhdGlibGUgd2l0aCBgRGF0ZWBcblxuICB2YXIgeWVhciA9IChmdW5jdGlvbiBnZXRZZWFyICgpIHtcbiAgICB2YXIgeWVhciA9IGRhdGVQYXJ0c1tnZXRQYXJ0SW5kZXgoL1kvKV1cblxuICAgIGlmICh5ZWFyICYmICh5ZWFyLmxlbmd0aCA9PT0gMikpIHllYXIgPSAnMjAnICsgeWVhclxuXG4gICAgcmV0dXJuIHllYXJcbiAgfSkoKVxuXG4gIHJldHVybiB7IHllYXI6IHllYXIsIG1vbnRoOiBtb250aCwgZGF0ZTogZGF0ZSB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2VEYXRlXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgcmV0dXJuICh0eXBlb2Ygb2JqZWN0ID09PSAnZnVuY3Rpb24nKSA/IG9iamVjdC5jYWxsKG9iamVjdCkgOiBvYmplY3Rcbn1cbiIsIi8qKlxuICogUmVwcmVzZW50cyBhIHRhYmxlIG5vZGVcbiAqL1xuXG5mdW5jdGlvbiBUYWJsZSAoZWxlbWVudCkge1xuICB0aGlzLmVsZW1lbnQgPSBlbGVtZW50XG59XG5cbi8qKlxuICogQHJldHVybnMgQSAyRCBhcnJheSByZXByZXNlbnRhdGlvbiBvZiB0aGUgZ2l2ZW4gcm93c1xuICovXG5cblRhYmxlLnByb3RvdHlwZS5yb3dzVG9BcnJheSA9IGZ1bmN0aW9uIChyb3dzLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBwcm9jZXNzUm93ID0gb3B0aW9ucy5wcm9jZXNzUm93IHx8IGlkXG4gIHZhciBwcm9jZXNzQ2VsbCA9IG9wdGlvbnMucHJvY2Vzc0NlbGwgfHwgaWRcblxuICByZXR1cm4gbWFwKHJvd3MsIGZ1bmN0aW9uICh0ciwgcm93SW5kZXgsIHJvd3MpIHtcbiAgICB2YXIgcm93ID0gbWFwKHRyLmNlbGxzLCBmdW5jdGlvbiAobm9kZSwgY2VsbEluZGV4LCBjZWxscykge1xuICAgICAgcmV0dXJuIHByb2Nlc3NDZWxsKG5vZGVUZXh0KG5vZGUpLCBjZWxsSW5kZXgsIGNlbGxzLCBub2RlKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvY2Vzc1Jvdyhyb3csIHJvd0luZGV4LCByb3dzLCB0cilcbiAgfSlcbn1cblxuLyoqXG4gKiBAcmV0dXJucyBBIDJEIGFycmF5IHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0YWJsZVxuICovXG5cblRhYmxlLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5yb3dzVG9BcnJheSh0aGlzLmVsZW1lbnQucXVlcnlTZWxlY3RvckFsbCgndGJvZHkgdHInKSlcbn1cblxuLyoqXG4gKiBTcXVhc2hlZCBhbmQgdHJpbW1lZCBub2RlIHRleHQgY29udGVudFxuICovXG5cbmZ1bmN0aW9uIG5vZGVUZXh0IChub2RlKSB7XG4gIHJldHVybiBzcXVhc2hXaGl0ZXNwYWNlKG5vZGUudGV4dENvbnRlbnQpXG5cbiAgZnVuY3Rpb24gc3F1YXNoV2hpdGVzcGFjZSAoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9cXHN7Mix9L2csICcgJykudHJpbSgpXG4gIH1cbn1cblxuLyoqXG4gKiBtYXAgZm9yIE5vZGVMaXN0c1xuICovXG5cbmZ1bmN0aW9uIG1hcCAoYXJyYXksIGVudW1lcmF0b3IpIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChhcnJheSwgZW51bWVyYXRvcilcbn1cblxuLyoqXG4gKiBJZGVudGl0eSBmdW5jdGlvblxuICogQHJldHVybnMgSXRzIGlucHV0IVxuICovXG5cbmZ1bmN0aW9uIGlkICh4KSB7IHJldHVybiB4IH1cblxubW9kdWxlLmV4cG9ydHMgPSBUYWJsZVxuIiwiLyoqXG4gKiBNYXBzIGtleXMgdG8gdmFsdWVzXG4gKiBAcGFyYW0ge0FycmF5fSBrZXlzIC0gQW4gYXJyYXkgb2Yga2V5c1xuICogQHBhcmFtIHtBcnJheX0gdmFsdWVzIC0gQW4gYXJyYXkgb2YgcmF3IHZhbHVlc1xuICogQHJldHVybnMge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiB3ZWxkIChrZXlzLCB2YWx1ZXMpIHtcbiAgdmFyIG9iamVjdCA9IHt9XG4gIGZvciAodmFyIGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBvYmplY3Rba2V5c1tpXV0gPSB2YWx1ZXNbaV1cbiAgcmV0dXJuIG9iamVjdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdlbGRcbiIsInZhciBzdGF0ZW1lbnREZWZpbml0aW9ucyA9IFtcbiAgcmVxdWlyZSgnLi9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMvY2F0ZXItYWxsZW4nKSxcbiAgcmVxdWlyZSgnLi9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMvaHNiYycpLFxuICByZXF1aXJlKCcuL3N0YXRlbWVudC1kZWZpbml0aW9ucy9uYXR3ZXN0Jylcbl1cblxuc3RhdGVtZW50RGVmaW5pdGlvbnMuZmluZEJ5ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgZGVmaW5pdGlvbiA9IHRoaXNbaV1cbiAgICBpZiAoZGVmaW5pdGlvbltrZXldID09PSB2YWx1ZSkgcmV0dXJuIGRlZmluaXRpb25cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHN0YXRlbWVudERlZmluaXRpb25zXG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5zdGl0dXRpb246ICdDYXRlciBBbGxlbicsXG4gIGhvc3Q6ICd3d3cuY2F0ZXJhbGxlbm9ubGluZS5jby51aycsXG4gIGNvbHVtbnM6IFsnZGF0ZScsICdkZXNjcmlwdGlvbicsICdwYWlkT3V0JywgJ3BhaWRJbicsICdiYWxhbmNlJ10sXG4gIGRhdGVGb3JtYXQ6ICdERE1NTVlZWVknLFxuICByb3dzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RhYmxlW3N1bW1hcnk9XCJUYWJsZSBjb25zaXN0cyBvZiBEYXRlLCBSZWZlcmVuY2UsIFBheW1lbnRzLCBSZWNpZXB0cyBhbmQgQmFsYW5jZSBjb2x1bW5zLCBkaXNwbGF5aW5nIHJlY2VudCBhY2NvdW50IHRyYW5zYWN0aW9uc1wiXSB0Ym9keTpudGgtb2YtdHlwZSgyKSB0cicpXG4gIH1cbn1cbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBpbnN0aXR1dGlvbjogJ0hTQkMnLFxuICBob3N0OiAnd3d3LmhzYmMuY28udWsnLFxuICBjb2x1bW5zOiBbJ2RhdGUnLCAndHlwZScsICdkZXNjcmlwdGlvbicsICdwYWlkT3V0JywgJ3BhaWRJbicsICdiYWxhbmNlJ10sXG4gIGRhdGVGb3JtYXQ6ICdERCBNTU0nLFxuICByb3dzOiBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ3RhYmxlW3N1bW1hcnk9XCJUaGlzIHRhYmxlIGNvbnRhaW5zIGEgc3RhdGVtZW50IG9mIHlvdXIgYWNjb3VudFwiXSB0Ym9keSB0cicpXG4gIH0sXG4gIGRhdGU6IGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgc2VsZWN0b3JzID0gW1xuICAgICAgLy8gRm9yIFByZXZpb3VzIFN0YXRlbWVudHNcbiAgICAgICcjY29udGVudCA+IGRpdi5jb250YWluZXJNYWluIGRpdi5oc2JjVGV4dFJpZ2h0JyxcblxuICAgICAgLy8gRm9yIFJlY2VudCBUcmFuc2FjdGlvbnNcbiAgICAgICcjZGV0YWlsLXN3aXRjaCA+IHRhYmxlID4gdGJvZHkgPiB0cjpudGgtY2hpbGQoMykgPiB0ZC5leHRUYWJsZUNvbHVtbjInXG4gICAgXVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgIHZhciBkYXRlU3RyaW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcnNbaV0pLnRleHRDb250ZW50XG4gICAgICBpZiAoRGF0ZS5wYXJzZShkYXRlU3RyaW5nKSkgcmV0dXJuIG5ldyBEYXRlKGRhdGVTdHJpbmcpXG4gICAgfVxuICB9XG59XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcbiAgaW5zdGl0dXRpb246ICdOYXRXZXN0JyxcbiAgaG9zdDogJ3d3dy5ud29sYi5jb20nLFxuICBjb2x1bW5zOiBbJ2RhdGUnLCAndHlwZScsICdkZXNjcmlwdGlvbicsICdwYWlkSW4nLCAncGFpZE91dCcsICdiYWxhbmNlJ10sXG4gIGRhdGVGb3JtYXQ6ICdEIE1NTSBZWVlZJyxcbiAgcm93czogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiB3aW5kb3cuZnJhbWVzLmN0bDAwX3NlY2ZyYW1lLmNvbnRlbnREb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCcuSXRlbVRhYmxlIHRib2R5IHRyJylcbiAgfVxufVxuIiwidmFyIHJlc3VsdCA9IHJlcXVpcmUoJy4vbGliL3Jlc3VsdCcpXG52YXIgVGFibGUgPSByZXF1aXJlKCcuL2xpYi90YWJsZScpXG52YXIgd2VsZCA9IHJlcXVpcmUoJy4vbGliL3dlbGQnKVxudmFyIFRyYW5zYWN0aW9uID0gcmVxdWlyZSgnLi90cmFuc2FjdGlvbicpXG52YXIgVHJhbnNhY3Rpb25zID0gcmVxdWlyZSgnLi90cmFuc2FjdGlvbnMnKVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBTdGF0ZW1lbnRcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXMgLSBVc3VhbGx5IGEgc3RhdGVtZW50IGRlZmluaXRpb25cbiAqL1xuXG5mdW5jdGlvbiBTdGF0ZW1lbnQgKGF0dHJpYnV0ZXMpIHtcbiAgZm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAoYXR0cmlidXRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB0aGlzW2tleV0gPSByZXN1bHQoYXR0cmlidXRlc1trZXldKVxuICB9XG5cbiAgLy8gQ29udmVydCB0YWJsZSByb3dzIHRvIGFycmF5IG9mIHRyYW5zYWN0aW9uc1xuICB2YXIgdHJhbnNhY3Rpb25zID0gVGFibGUucHJvdG90eXBlLnJvd3NUb0FycmF5KHRoaXMucm93cywge1xuICAgIHByb2Nlc3NSb3c6IGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVRyYW5zYWN0aW9uKHdlbGQodGhpcy5jb2x1bW5zLCByb3cpKVxuICAgIH0uYmluZCh0aGlzKVxuICB9KVxuICB0aGlzLnRyYW5zYWN0aW9ucyA9IG5ldyBUcmFuc2FjdGlvbnModHJhbnNhY3Rpb25zLCB0aGlzKVxufVxuXG4vKipcbiAqIENyZWF0ZXMgYSB0cmFuc2FjdGlvbiBmcm9tIGFuIG9iamVjdCBvZiBhdHRyaWJ1dGVzLlxuICogQHJldHVybnMge1RyYW5zYWN0aW9ufVxuICovXG5cblN0YXRlbWVudC5wcm90b3R5cGUuY3JlYXRlVHJhbnNhY3Rpb24gPSBmdW5jdGlvbiAoYXR0cmlidXRlcykge1xuICBhdHRyaWJ1dGVzLmRhdGVTdHJpbmcgPSBhdHRyaWJ1dGVzLmRhdGVcbiAgYXR0cmlidXRlcy5kYXRlRm9ybWF0ID0gdGhpcy5kYXRlRm9ybWF0XG4gIGRlbGV0ZSBhdHRyaWJ1dGVzLmRhdGVcbiAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbihhdHRyaWJ1dGVzKVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtTdHJpbmd9IFRoZSBuYW1lIG9mIHRoZSBzdGF0ZW1lbnQgYmFzZWQgb24gdGhlIHN0YXRlbWVudCBkYXRlXG4gKi9cblxuU3RhdGVtZW50LnByb3RvdHlwZS5uYW1lID0gZnVuY3Rpb24gKCkge1xuICB2YXIgbGFiZWwgPSB0aGlzLmluc3RpdHV0aW9uICsgJyBTdGF0ZW1lbnQnXG5cbiAgaWYgKHRoaXMudHJhbnNhY3Rpb25zLmxlbmd0aCkge1xuICAgIHJldHVybiBsYWJlbCArICcgJyArIHRoaXMudHJhbnNhY3Rpb25zLmxhc3QoKS5nZXRGb3JtYXR0ZWQoJ2RhdGUnKVxuICB9XG4gIHJldHVybiBsYWJlbFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0YXRlbWVudFxuIiwidmFyIHBhcnNlRGF0ZSA9IHJlcXVpcmUoJy4vbGliL3BhcnNlLWRhdGUnKVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSB0cmFuc2FjdGlvbiBkYXRlXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwcml2YXRlXG4gKi9cblxuZnVuY3Rpb24gVHJhbnNhY3Rpb25EYXRlIChkYXRlU3RyaW5nLCBmb3JtYXQsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgdmFyIHBhcnNlZCA9IHBhcnNlRGF0ZShkYXRlU3RyaW5nLCBmb3JtYXQpXG5cbiAgdGhpcy55ZWFyID0gcGFyc2VkLnllYXJcbiAgdGhpcy5tb250aCA9IHBhcnNlZC5tb250aFxuICB0aGlzLmRhdGUgPSBwYXJzZWQuZGF0ZVxuXG4gIGlmICghdGhpcy55ZWFyICYmIG9wdGlvbnMuc3VjY2VlZGluZ0RhdGUpIHtcbiAgICB0aGlzLnllYXIgPSB0aGlzLmNhbGN1bGF0ZVllYXIob3B0aW9ucy5zdWNjZWVkaW5nRGF0ZSlcbiAgfVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtEYXRlfSBBIG5hdGl2ZSBEYXRlIHJlcHJlc2VudGF0aW9uIG9mIHRoZSB0cmFuc2FjdGlvbiBkYXRlXG4gKi9cblxuVHJhbnNhY3Rpb25EYXRlLnByb3RvdHlwZS50b0RhdGUgPSBmdW5jdGlvbiAoKSB7XG4gIGlmICghRGF0ZS5wYXJzZSh0aGlzLnllYXIsIHRoaXMubW9udGgsIHRoaXMuZGF0ZSkpIHJldHVybiBudWxsXG4gIHJldHVybiBuZXcgRGF0ZSh0aGlzLnllYXIsIHRoaXMubW9udGgsIHRoaXMuZGF0ZSlcbn1cblxuLyoqXG4gKiBVc2VzIHRoZSBzdWNjZWVkaW5nIGRhdGUgdG8gZGV0ZXJtaW5lIHRoZSB0cmFuc2FjdGlvbiB5ZWFyXG4gKiBAcmV0dXJucyB7TnVtYmVyfVxuICovXG5cblRyYW5zYWN0aW9uRGF0ZS5wcm90b3R5cGUuY2FsY3VsYXRlWWVhciA9IGZ1bmN0aW9uIChzdWNjZWVkaW5nRGF0ZSkge1xuICB2YXIgeWVhciA9IHN1Y2NlZWRpbmdEYXRlLmdldEZ1bGxZZWFyKClcblxuICAvLyBEZWMgLSBKYW5cbiAgaWYgKHN1Y2NlZWRpbmdEYXRlLmdldE1vbnRoKCkgPT09IDAgJiYgdGhpcy5tb250aCA9PT0gMTEpIHllYXItLVxuXG4gIHJldHVybiB5ZWFyXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNhY3Rpb25EYXRlXG4iLCIvKipcbiAqIFJlcHJlc2VudHMgYSBjb2xsZWN0aW9uIG9mIHRyYW5zYWN0aW9uIGRhdGVzXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwcml2YXRlXG4gKiBAcGFyYW0ge0FycmF5fSBkYXRlcyAtIEFuIGFycmF5IG9mIG9iamVjdHMgaW4gdGhlIGZvcm0geyB5ZWFyOiB5ZWFyLCBtb250aDogbW9udGgsIGRhdGU6IGRhdGUgfVxuICovXG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uRGF0ZXMgKGRhdGVzKSB7XG4gIHRoaXMuZGF0ZXMgPSBkYXRlc1xufVxuXG4vKipcbiAqIERldGVybWluZXMgd2hldGhlciB0aGUgZGF0ZXMgYXJlIGNocm9ub2xvZ2ljYWwgb3Igbm90XG4gKiBAcmV0dXJucyB7Qm9vbGVhbn1cbiAqL1xuXG5UcmFuc2FjdGlvbkRhdGVzLnByb3RvdHlwZS5jaHJvbm9sb2dpY2FsID0gZnVuY3Rpb24gKCkge1xuICB2YXIgdW5pcSA9IHRoaXMudW5pcSgpXG4gIGlmICh1bmlxLmxlbmd0aCA8IDIpIHJldHVybiB0cnVlXG5cbiAgcmV0dXJuIHRoaXMuY29tcGFyZSh1bmlxWzBdLCB1bmlxWzFdKSA+PSAwXG59XG5cbi8qKlxuICogQHJldHVybnMge0FycmF5fSBUaGUgdW5pcXVlIGRhdGVzXG4gKi9cblxuVHJhbnNhY3Rpb25EYXRlcy5wcm90b3R5cGUudW5pcSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHVuaXFzID0gW11cblxuICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuZGF0ZXMubGVuZ3RoOyBpKyspIHtcbiAgICB2YXIgZGF0ZSA9IHRoaXMuZGF0ZXNbaV1cbiAgICBpZiAoaW5VbmlxcyhkYXRlKSkgY29udGludWVcbiAgICB1bmlxcy5wdXNoKGRhdGUpXG4gIH1cblxuICByZXR1cm4gdW5pcXNcblxuICAvLyBEZXRlcm1pbmVzIHdoZXRoZXIgYSBkYXRlIGFscmVhZHkgZXhpc3RzIGluIHRoZSB1bmlxcyBhcnJheVxuICBmdW5jdGlvbiBpblVuaXFzIChkKSB7XG4gICAgcmV0dXJuIHVuaXFzLnNvbWUoZnVuY3Rpb24gKHUpIHtcbiAgICAgIHJldHVybiB1LnllYXIgPT09IGQueWVhciAmJiB1Lm1vbnRoID09PSBkLm1vbnRoICYmIHUuZGF0ZSA9PT0gZC5kYXRlXG4gICAgfSlcbiAgfVxufVxuXG4vKipcbiAqIENvbXBhcmVzIHR3byBkYXRlcyB0byB0ZXN0IGNocm9ub2xvZ3lcbiAqIEByZXR1cm5zIHtOdW1iZXJ9IDA6IGEgPT0gYiwgMTogYSA+IGIsIC0xOiBhIDwgYlxuICovXG5cblRyYW5zYWN0aW9uRGF0ZXMucHJvdG90eXBlLmNvbXBhcmUgPSBmdW5jdGlvbiAoYSwgYikge1xuICAvLyBJZiBubyB5ZWFyLCBhbmQgZGF0ZXMgZ28gZnJvbSBEZWMgLSBKYW4sIGFzc3VtZSBEZWMgZGF0ZSBpcyBvbGRlclxuICBpZiAoKCFhLnllYXIgfHwgIWIueWVhcikgJiYgYS5tb250aCA9PT0gMTEgJiYgYi5tb250aCA9PT0gMCkgcmV0dXJuIDFcblxuICBpZiAoYS55ZWFyID09PSBiLnllYXIpIHtcbiAgICBpZiAoYS5tb250aCA9PT0gYi5tb250aCkge1xuICAgICAgaWYgKGEuZGF0ZSA+IGIuZGF0ZSkgcmV0dXJuIC0xXG4gICAgICBpZiAoYS5kYXRlIDwgYi5kYXRlKSByZXR1cm4gMVxuICAgICAgcmV0dXJuIDBcbiAgICB9XG5cbiAgICBpZiAoYS5tb250aCA+IGIubW9udGgpIHJldHVybiAtMVxuICAgIGlmIChhLm1vbnRoIDwgYi5tb250aCkgcmV0dXJuIDFcbiAgfVxuICBpZiAoYS55ZWFyID4gYi55ZWFyKSByZXR1cm4gLTFcbiAgaWYgKGEueWVhciA8IGIueWVhcikgcmV0dXJuIDFcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2FjdGlvbkRhdGVzXG4iLCJ2YXIgbWFrZU51bWJlciA9IHJlcXVpcmUoJy4vbGliL251bWJlci9tYWtlLW51bWJlcicpXG52YXIgbWFrZUFic29sdXRlTnVtYmVyID0gcmVxdWlyZSgnLi9saWIvbnVtYmVyL21ha2UtYWJzb2x1dGUtbnVtYmVyJylcbnZhciBUcmFuc2FjdGlvbkRhdGUgPSByZXF1aXJlKCcuL3RyYW5zYWN0aW9uLWRhdGUnKVxuXG4vKipcbiAqIFJlcHJlc2VudHMgYSBzaW5nbGUgdHJhbnNhY3Rpb24uXG4gKiBHZXR0ZXJzIGFuZCBzZXR0ZXJzIGFyZSB1c2VkIHRvIHRyYW5zZm9ybSBhbmQgZm9ybWF0IHZhbHVlcy4gQWxzbyByZXNwb25zaWJsZVxuICogZm9yIGNhbGN1bGF0aW5nIGFtb3VudHMgYW5kIGRhdGVzIHdoZW4gbWlzc2luZyBvciBpbnZhbGlkLlxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlc1xuICovXG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uIChhdHRyaWJ1dGVzKSB7XG4gIHRoaXMuYXR0cmlidXRlcyA9IHt9XG5cbiAgZm9yICh2YXIga2V5IGluIGF0dHJpYnV0ZXMpIHtcbiAgICBpZiAoYXR0cmlidXRlcy5oYXNPd25Qcm9wZXJ0eShrZXkpKSB0aGlzLnNldChrZXksIGF0dHJpYnV0ZXNba2V5XSlcbiAgfVxuXG4gIGlmICghdGhpcy5nZXQoJ2RhdGUnKSkgdGhpcy5zZXREYXRlKClcbiAgaWYgKCF0aGlzLmdldCgnYW1vdW50JykpIHRoaXMuc2V0QW1vdW50KClcbn1cblxuLyoqXG4gKiBGdW5jdGlvbnMgdGhhdCB0cmFuc2Zvcm0gYXR0cmlidXRlcyBhcyB0aGV5IGFyZSBzZXRcbiAqL1xuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUudHJhbnNmb3JtZXJzID0ge1xuICBhbW91bnQ6IG1ha2VOdW1iZXIsXG4gIGJhbGFuY2U6IG1ha2VOdW1iZXIsXG4gIHBhaWRJbjogbWFrZUFic29sdXRlTnVtYmVyLFxuICBwYWlkT3V0OiBtYWtlQWJzb2x1dGVOdW1iZXIsXG4gIGRhdGU6IGZ1bmN0aW9uIChkYXRlKSB7XG4gICAgaWYgKCEoZGF0ZSBpbnN0YW5jZW9mIERhdGUpKSByZXR1cm4gZGF0ZVxuXG4gICAgLy8gQ29udmVydCB0byBHTVQgdG8gZW5zdXJlIGNvcnJlY3QgSlNPTiB2YWx1ZXNcbiAgICBkYXRlLnNldEhvdXJzKGRhdGUuZ2V0SG91cnMoKSAtIGRhdGUuZ2V0VGltZXpvbmVPZmZzZXQoKSAvIDYwKVxuICAgIHJldHVybiBkYXRlXG4gIH1cbn1cblxuLyoqXG4gKiBGdW5jdGlvbnMgdGhhdCBmb3JtYXQgYXR0cmlidXRlcyB3aGVuIHJldHJpZXZlZCB3aXRoIGBnZXRGb3JtYXR0ZWRgXG4gKi9cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmZvcm1hdHRlcnMgPSB7XG4gIGRhdGU6IGZvcm1hdERhdGVcbn1cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIGFuZCBzZXRzIHRoZSBnaXZlbiBhdHRyaWJ1dGVcbiAqIEBwYXJhbSB7U3RyaW5nfSBrZXkgLSBUaGUgbmFtZSBvZiB0aGUgYXR0cmlidXRlXG4gKiBAcGFyYW0gdmFsdWUgLSBUaGUgdmFsdWUgb2YgdGhlIGF0dHJpYnV0ZVxuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5zZXQgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICB2YXIgdHJhbnNmb3JtZXIgPSB0aGlzLnRyYW5zZm9ybWVyc1trZXldIHx8IGlkRnVuY3Rpb25cbiAgdGhpcy5hdHRyaWJ1dGVzW2tleV0gPSB0cmFuc2Zvcm1lcih2YWx1ZSlcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB0aGUgc3RvcmVkIGF0dHJpYnV0ZVxuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNba2V5XVxufVxuXG4vKipcbiAqIEdldCBhIHZhbHVlIGZvcm1hdHRlZCBieSB0aGUgY29ycmVzcG9uZGluZyBmb3JtYXR0ZXJcbiAqIEBwYXJhbSBrZXkgLSBUaGUga2V5IG9mIHRoZSB2YWx1ZSB0byByZXR1cm5cbiAqIEByZXR1cm5zIFRoZSBmb3JtYXR0ZWQgYXR0cmlidXRlXG4gKi9cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmdldEZvcm1hdHRlZCA9IGZ1bmN0aW9uIChrZXkpIHtcbiAgdmFyIGZvcm1hdHRlciA9IHRoaXMuZm9ybWF0dGVyc1trZXldIHx8IGlkRnVuY3Rpb25cbiAgcmV0dXJuIGZvcm1hdHRlcih0aGlzLmdldChrZXkpKVxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gYXJyYXkgcmVwcmVzZW50YXRpb24gb2YgdGhlIGdpdmVuIGtleXMgb3IgYWxsIGZvcm1hdHRlZFxuICogYXR0cmlidXRlcy5cbiAqIEBwYXJhbSB7QXJyYXl9IGtleXMgLSBBbiBhcnJheSBvZiBhdHRyaWJ1dGUga2V5c1xuICogQHJldHVybnMge0FycmF5fSAtIEFuIGFycmF5IG9mIGZvcm1hdHRlZCBhdHRyaWJ1dGVzXG4gKi9cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiAoa2V5cykge1xuICBrZXlzID0ga2V5cyB8fCBPYmplY3Qua2V5cyh0aGlzLmF0dHJpYnV0ZXMpXG4gIHJldHVybiBrZXlzLm1hcCh0aGlzLmdldEZvcm1hdHRlZC5iaW5kKHRoaXMpKVxufVxuXG4vKipcbiAqIFJldHVybnMgYW4gb2JqZWN0IG9mIGZvcm1hdHRlZCB2YWx1ZXMgb2YgdGhlIGdpdmVuIGtleXMgb3IgYWxsIGZvcm1hdHRlZFxuICogYXR0cmlidXRlcy5cbiAqIEBwYXJhbSB7QXJyYXl9IGtleXMgLSBBbiBhcnJheSBvZiBhdHRyaWJ1dGUga2V5c1xuICogQHJldHVybnMge0FycmF5fSAtIEFuIGFycmF5IG9mIGZvcm1hdHRlZCBhdHRyaWJ1dGVzXG4gKi9cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIChrZXlzKSB7XG4gIGtleXMgPSBrZXlzIHx8IE9iamVjdC5rZXlzKHRoaXMuYXR0cmlidXRlcylcbiAgdmFyIG9iamVjdCA9IHt9XG5cbiAgZm9yICh2YXIgaSA9IGtleXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIga2V5ID0ga2V5c1tpXVxuICAgIG9iamVjdFtrZXldID0gdGhpcy5nZXRGb3JtYXR0ZWQoa2V5KVxuICB9XG5cbiAgcmV0dXJuIG9iamVjdFxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuc2V0RGF0ZSA9IGZ1bmN0aW9uIChhdHRycykge1xuICBhdHRycyA9IGF0dHJzIHx8IHt9XG4gIHZhciBkYXRlU3RyaW5nID0gYXR0cnMuZGF0ZVN0cmluZyB8fCB0aGlzLmdldCgnZGF0ZVN0cmluZycpXG4gIHZhciBkYXRlRm9ybWF0ID0gYXR0cnMuZGF0ZUZvcm1hdCB8fCB0aGlzLmdldCgnZGF0ZUZvcm1hdCcpXG4gIHZhciBzdWNjZWVkaW5nRGF0ZSA9IGF0dHJzLnN1Y2NlZWRpbmdEYXRlXG5cbiAgdmFyIHRyYW5zYWN0aW9uRGF0ZSA9IG5ldyBUcmFuc2FjdGlvbkRhdGUoZGF0ZVN0cmluZywgZGF0ZUZvcm1hdCwge1xuICAgIHN1Y2NlZWRpbmdEYXRlOiBzdWNjZWVkaW5nRGF0ZVxuICB9KVxuICB0aGlzLnNldCgndHJhbnNhY3Rpb25EYXRlJywgdHJhbnNhY3Rpb25EYXRlKVxuICB0aGlzLnNldCgnZGF0ZScsIHRyYW5zYWN0aW9uRGF0ZS50b0RhdGUoKSlcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnNldEFtb3VudCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHBhaWRJbiA9IHRoaXMuZ2V0KCdwYWlkSW4nKVxuICB2YXIgcGFpZE91dCA9IHRoaXMuZ2V0KCdwYWlkT3V0JylcblxuICB0aGlzLnNldCgnYW1vdW50JywgY2FsY3VsYXRlQW1vdW50KHBhaWRJbiwgcGFpZE91dCkpXG59XG5cbmZ1bmN0aW9uIGNhbGN1bGF0ZUFtb3VudCAocGFpZEluLCBwYWlkT3V0KSB7XG4gIHJldHVybiBwYWlkSW4gfHwgLXBhaWRPdXRcbn1cblxuZnVuY3Rpb24gZm9ybWF0RGF0ZSAodmFsdWUpIHtcbiAgdmFyIHl5eXkgPSB2YWx1ZS5nZXRGdWxsWWVhcigpXG4gIHZhciBtbSA9IHBhZFplcm9lcyh2YWx1ZS5nZXRNb250aCgpICsgMSlcbiAgdmFyIGRkID0gcGFkWmVyb2VzKHZhbHVlLmdldERhdGUoKSlcblxuICByZXR1cm4gW3l5eXksIG1tLCBkZF0uam9pbignLScpXG5cbiAgZnVuY3Rpb24gcGFkWmVyb2VzIChudW1iZXIpIHtcbiAgICByZXR1cm4gU3RyaW5nKCcwMCcgKyBudW1iZXIpLnNsaWNlKC0yKVxuICB9XG59XG5cbmZ1bmN0aW9uIGlkRnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uXG4iLCJ2YXIgVHJhbnNhY3Rpb25EYXRlcyA9IHJlcXVpcmUoJy4vdHJhbnNhY3Rpb24tZGF0ZXMnKVxuXG4vKipcbiAqIEFuIGFycmF5LWxpa2UgY2xhc3MgdGhhdCByZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiB0cmFuc2FjdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtBcnJheX0gdHJhbnNhY3Rpb25zIC0gQW4gYXJyYXkgb2YgVHJhbnNhY3Rpb24gb2JqZWN0c1xuICogQHBhcmFtIHtPYmplY3R9IHN0YXRlbWVudCAtIFRoZSBwYXJlbnQgc3RhdGVtZW50XG4gKiBAcmV0dXJucyB7QXJyYXl9IC0gQW4gYXJyYXkgb2YgdHJhbnNhY3Rpb25zIHdpdGggY29udmVuaWVuY2UgbWV0aG9kc1xuICovXG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9ucyAodHJhbnNhY3Rpb25zLCBzdGF0ZW1lbnQpIHtcbiAgVHJhbnNhY3Rpb25zLl9pbmplY3RQcm90b3R5cGVNZXRob2RzKHRyYW5zYWN0aW9ucylcblxuICAvKipcbiAgICogU29tZSBmaW5hbmNpYWwgaW5zdGl0dXRpb25zIG9taXQgdGhlIHllYXIgcGFydCBpbiB0aGVpciBkYXRlIGNlbGxzLlxuICAgKiBUaGlzIHdvcmthcm91bmQgY2FsY3VsYXRlcyB0aGUgeWVhciBmb3IgZWFjaCB0cmFuc2FjdGlvbiBhZmZlY3RlZC5cbiAgICovXG5cbiAgaWYgKCEvWXsyLH0vLnRlc3Qoc3RhdGVtZW50LmRhdGVGb3JtYXQpKSB7XG4gICAgaWYgKCF0cmFuc2FjdGlvbnMuY2hyb25vbG9naWNhbCgpKSB0cmFuc2FjdGlvbnMgPSB0cmFuc2FjdGlvbnMucmV2ZXJzZSgpXG5cbiAgICB2YXIgc3VjY2VlZGluZ0RhdGUgPSBzdGF0ZW1lbnQuZGF0ZVxuICAgIGZvciAodmFyIGkgPSB0cmFuc2FjdGlvbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IHRyYW5zYWN0aW9uc1tpXVxuICAgICAgdHJhbnNhY3Rpb24uc2V0RGF0ZSh7IHN1Y2NlZWRpbmdEYXRlOiBzdWNjZWVkaW5nRGF0ZSB9KVxuICAgICAgc3VjY2VlZGluZ0RhdGUgPSB0cmFuc2FjdGlvbi5nZXQoJ2RhdGUnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cmFuc2FjdGlvbnNcbn1cblxuVHJhbnNhY3Rpb25zLnByb3RvdHlwZS5jaHJvbm9sb2dpY2FsID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZGF0ZXMuY2FsbCh0aGlzKS5jaHJvbm9sb2dpY2FsKClcblxuICBmdW5jdGlvbiBkYXRlcyAoKSB7XG4gICAgdmFyIGRhdGVzID0gdGhpcy5tYXAoZnVuY3Rpb24gKHRyYW5zYWN0aW9uKSB7XG4gICAgICByZXR1cm4gdHJhbnNhY3Rpb24uZ2V0KCd0cmFuc2FjdGlvbkRhdGUnKVxuICAgIH0pXG4gICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbkRhdGVzKGRhdGVzKVxuICB9XG59XG5cbi8qKlxuICogQHJldHVybnMge1RyYW5zYWN0aW9ufSBUaGUgZmlyc3QgdHJhbnNhY3Rpb24gaW4gdGhlIGNvbGxlY3Rpb25cbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLmZpcnN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpc1swXVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtUcmFuc2FjdGlvbn0gVGhlIGxhc3QgdHJhbnNhY3Rpb24gaW4gdGhlIGNvbGxlY3Rpb25cbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzW3RoaXMubGVuZ3RoIC0gMV1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7QXJyYXl9IEFuIGFycmF5IG9mIGZvcm1hdHRlZCB0cmFuc2FjdGlvbiBhdHRyaWJ1dGUgYXJyYXlzXG4gKi9cblxuVHJhbnNhY3Rpb25zLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKGtleXMpIHtcbiAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uICh0cmFuc2FjdGlvbikgeyByZXR1cm4gdHJhbnNhY3Rpb24udG9BcnJheShrZXlzKSB9KVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtBcnJheX0gQW4gYXJyYXkgb2YgZm9ybWF0dGVkIHRyYW5zYWN0aW9uIG9iamVjdHNcbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIChrZXlzKSB7XG4gIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAodHJhbnNhY3Rpb24pIHsgcmV0dXJuIHRyYW5zYWN0aW9uLnRvSlNPTihrZXlzKSB9KVxufVxuXG4vKipcbiAqIEFkZHMgdGhlIHByb3RvdHlwZSBtZXRob2RzIHRvIHRyYW5zYWN0aW9ucyBhcnJheSB0byBhcHBlYXIgbGlrZSBpbmhlcml0YW5jZVxuICogQHByaXZhdGVcbiAqL1xuXG5UcmFuc2FjdGlvbnMuX2luamVjdFByb3RvdHlwZU1ldGhvZHMgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgZm9yICh2YXIgbWV0aG9kIGluIHRoaXMucHJvdG90eXBlKSB7XG4gICAgaWYgKHRoaXMucHJvdG90eXBlLmhhc093blByb3BlcnR5KG1ldGhvZCkpIHtcbiAgICAgIGFycmF5W21ldGhvZF0gPSB0aGlzLnByb3RvdHlwZVttZXRob2RdXG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNhY3Rpb25zXG4iXX0=
