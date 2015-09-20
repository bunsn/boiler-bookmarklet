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
  return number ? number : null
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
  host: 'www.saas.hsbc.co.uk',
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
  return paidIn ? paidIn : -paidOut
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
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9jc3YvYXJyYXktdG8tZHN2LmpzIiwibGliL2Nzdi9pbmRleC5qcyIsImxpYi9kb3dubG9hZC5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL2xpYi9udW1iZXIvbWFrZS1hYnNvbHV0ZS1udW1iZXIuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9saWIvbnVtYmVyL21ha2UtbnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3BhcnNlLWRhdGUuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9saWIvcmVzdWx0LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3RhYmxlLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3dlbGQuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMvY2F0ZXItYWxsZW4uanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMvaHNiYy5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL3N0YXRlbWVudC1kZWZpbml0aW9ucy9uYXR3ZXN0LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvc3RhdGVtZW50LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvdHJhbnNhY3Rpb24tZGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL3RyYW5zYWN0aW9uLWRhdGVzLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvdHJhbnNhY3Rpb24uanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci90cmFuc2FjdGlvbnMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZGVmaW5pdGlvbnMgPSByZXF1aXJlKCdAYnVuc24vYm9pbGVyL3N0YXRlbWVudC1kZWZpbml0aW9ucycpXG52YXIgU3RhdGVtZW50ID0gcmVxdWlyZSgnQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQnKVxudmFyIENTViA9IHJlcXVpcmUoJy4vbGliL2NzdicpXG52YXIgZG93bmxvYWQgPSByZXF1aXJlKCcuL2xpYi9kb3dubG9hZCcpXG5cbnZhciBkZWZpbml0aW9uID0gZGVmaW5pdGlvbnMuZmluZEJ5KCdob3N0Jywgd2luZG93LmxvY2F0aW9uLmhvc3QpXG52YXIgc3RhdGVtZW50ID0gbmV3IFN0YXRlbWVudChkZWZpbml0aW9uKVxudmFyIGtleXMgPSBbJ2RhdGUnLCAndHlwZScsICdkZXNjcmlwdGlvbicsICdhbW91bnQnXVxudmFyIGNzdiA9IENTVi5zdHJpbmdpZnkoc3RhdGVtZW50LnRyYW5zYWN0aW9ucy50b0FycmF5KGtleXMpKVxudmFyIGJsb2IgPSBuZXcgQmxvYihbY3N2XSwgeyB0eXBlOiAndGV4dC9jc3YnIH0pXG5cbmRvd25sb2FkKFVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYiksIHsgZmlsZW5hbWU6IHN0YXRlbWVudC5uYW1lKCkgfSlcbiIsIi8qKlxuICogQ29udmVydHMgYSB0d28tZGltZW5zaW9uYWwgYXJyYXkgdG8gYSBkZWxpbWl0ZXItc2VwYXJhdGVkIHN0cmluZ1xuICovXG5cbmZ1bmN0aW9uIGFycmF5VG9EU1YgKGFycmF5LCBkZWxpbWl0ZXIpIHtcbiAgcmV0dXJuIGFycmF5Lm1hcChwcm9jZXNzUm93KS5qb2luKCdcXG4nKVxuXG4gIGZ1bmN0aW9uIHByb2Nlc3NSb3cgKGFycmF5KSB7XG4gICAgcmV0dXJuIGFycmF5Lm1hcChwcm9jZXNzSXRlbSkuam9pbihkZWxpbWl0ZXIpXG4gIH1cblxuICBmdW5jdGlvbiBwcm9jZXNzSXRlbSAoaXRlbSkge1xuICAgIGl0ZW0gPSBTdHJpbmcoaXRlbSlcblxuICAgIHZhciBoYXNEb3VibGVRdW90ZSA9IC9cIi8udGVzdChpdGVtKVxuICAgIHZhciBoYXNMaW5lQnJlYWsgPSAvW1xcblxccl0vLnRlc3QoaXRlbSlcbiAgICB2YXIgaGFzRGVsaW1pdGVyID0gbmV3IFJlZ0V4cChkZWxpbWl0ZXIpLnRlc3QoaXRlbSlcblxuICAgIGlmIChoYXNEb3VibGVRdW90ZSkgaXRlbSA9IGVzY2FwZURvdWJsZVF1b3RlcyhpdGVtKVxuICAgIGlmIChoYXNEb3VibGVRdW90ZSB8fCBoYXNMaW5lQnJlYWsgfHwgaGFzRGVsaW1pdGVyKSB7XG4gICAgICBpdGVtID0gd3JhcEluRG91YmxlUXVvdGVzKGl0ZW0pXG4gICAgfVxuXG4gICAgcmV0dXJuIGl0ZW1cbiAgfVxuXG4gIGZ1bmN0aW9uIGVzY2FwZURvdWJsZVF1b3RlcyAoaXRlbSkge1xuICAgIHJldHVybiBpdGVtLnJlcGxhY2UoL1wiL2csICdcIlwiJylcbiAgfVxuXG4gIGZ1bmN0aW9uIHdyYXBJbkRvdWJsZVF1b3RlcyAoaXRlbSkge1xuICAgIHJldHVybiAnXCInICsgaXRlbSArICdcIidcbiAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGFycmF5VG9EU1ZcbiIsInZhciBhcnJheVRvRFNWID0gcmVxdWlyZSgnLi9hcnJheS10by1kc3YnKVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgc3RyaW5naWZ5OiBmdW5jdGlvbiAoYXJyYXkpIHsgcmV0dXJuIGFycmF5VG9EU1YoYXJyYXksICcsJykgfVxufVxuIiwiZnVuY3Rpb24gZG93bmxvYWQgKHVybCwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuXG4gIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnYScpXG4gIGEuaHJlZiA9IHVybFxuICBhLmRvd25sb2FkID0gb3B0aW9ucy5maWxlbmFtZVxuXG4gIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSlcbiAgYS5jbGljaygpXG4gIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoYSlcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBkb3dubG9hZFxuIiwidmFyIG1ha2VOdW1iZXIgPSByZXF1aXJlKCcuL21ha2UtbnVtYmVyJylcblxuLyoqXG4gKiBSZW1vdmVzIGFueSBub24tbnVtZXJpY2FsIHN5bWJvbHMgYW5kIHJldHVybnMgdGhlIGFic29sdXRlIHZhbHVlLlxuICogVXNlZnVsIGZvciBjb252ZXJ0aW5nIG51bWJlcnMgZm9ybWF0dGVkIGFzIGN1cnJlbmN5LlxuICogZS5nLiBcIi3CozMsNDI2LjcyXCIgY29udmVydHMgdG8gMzQyNi43MlxuICogQHJldHVybnMge051bWJlcn1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1ha2VBYnNvbHV0ZU51bWJlciAodmFsdWUpIHtcbiAgdmFyIG51bWJlciA9IG1ha2VOdW1iZXIodmFsdWUpXG4gIGlmIChudW1iZXIgPT0gbnVsbCkgcmV0dXJuIG51bGxcbiAgcmV0dXJuIE1hdGguYWJzKG51bWJlcilcbn1cbiIsIi8qKlxuICogUmVtb3ZlcyBhbnkgbm9uLW51bWVyaWNhbCBzeW1ib2xzLlxuICogVXNlZnVsIGZvciBjb252ZXJ0aW5nIG51bWJlcnMgZm9ybWF0dGVkIGFzIGN1cnJlbmN5LlxuICogZS5nLiBcIi3CozMsNDI2LjcyXCIgY29udmVydHMgdG8gLTM0MjYuNzJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gKi9cblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYWtlTnVtYmVyICh2YWx1ZSkge1xuICB2YXIgbnVtYmVyID0gTnVtYmVyKFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvW15cXGRcXC4tXS9nLCAnJykpXG4gIHJldHVybiBudW1iZXIgPyBudW1iZXIgOiBudWxsXG59XG4iLCJ2YXIgbW9udGhGb3JtYXRzID0ge1xuICBNTU06IFsnamFuJywgJ2ZlYicsICdtYXInLCAnYXByJywgJ21heScsICdqdW4nLCAnanVsJywgJ2F1ZycsICdzZXAnLCAnb2N0JywgJ25vdicsICdkZWMnXSxcbiAgTU1NTTogWydqYW51YXJ5JywgJ2ZlYnJ1YXJ5JywgJ21hcmNoJywgJ2FwcmlsJywgJ21heScsICdqdW5lJywgJ2p1bHknLCAnYXVndXN0JywgJ3NlcHRlbWJlcicsICdvY3RvYmVyJywgJ25vdmVtYmVyJywgJ2RlY2VtYmVyJ11cbn1cblxuZnVuY3Rpb24gcGFyc2VEYXRlIChkYXRlU3RyaW5nLCBmb3JtYXQpIHtcbiAgdmFyIGZvcm1hdFBhcnRzID0gZm9ybWF0Lm1hdGNoKC8oRHsxLDJ9KXwoTXsxLDR9KXwoWXsyLDR9KS9nKVxuICB2YXIgZGF0ZVJlZ2V4ID0gUmVnRXhwKGZvcm1hdC5yZXBsYWNlKC9ERD8vLCAnKFxcXFxkXFxcXGQ/KScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL017Myw0fS8sICcoW2EtekEtWl17Myx9KScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL01NPy8sICcoXFxcXGRcXFxcZD8pJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvWXsyLDR9LywgJyhcXFxcZHsyLDR9KScpKVxuICB2YXIgZGF0ZVBhcnRzID0gZGF0ZVN0cmluZy5tYXRjaChkYXRlUmVnZXgpXG5cbiAgaWYgKGRhdGVQYXJ0cykge1xuICAgIGRhdGVQYXJ0cyA9IGRhdGVQYXJ0cy5zcGxpY2UoMSlcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwYXJzZTogYCcgKyBkYXRlU3RyaW5nICsgJ2Agd2l0aCBmb3JtYXQ6IGAnICsgZm9ybWF0ICsgJ2AnKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UGFydEluZGV4IChyZWdleCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZm9ybWF0UGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWdleC50ZXN0KGZvcm1hdFBhcnRzW2ldKSkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICB2YXIgZGF0ZSA9IGRhdGVQYXJ0c1tnZXRQYXJ0SW5kZXgoL0QvKV1cblxuICAvLyBHZXQgbW9udGggcGFydCBhbmQgY29udmVydCB0byBudW1iZXIgY29tcGF0aWJsZSB3aXRoIGBEYXRlYFxuXG4gIHZhciBtb250aCA9IChmdW5jdGlvbiBnZXRNb250aCAoKSB7XG4gICAgdmFyIGkgPSBnZXRQYXJ0SW5kZXgoL00vKVxuICAgIHZhciBtb250aEZvcm1hdCA9IGZvcm1hdFBhcnRzW2ldXG4gICAgdmFyIGRhdGVQYXJ0ID0gZGF0ZVBhcnRzW2ldLnRvTG93ZXJDYXNlKClcbiAgICB2YXIgbW9udGhcblxuICAgIGlmIChtb250aEZvcm1hdC5sZW5ndGggPiAyKSB7XG4gICAgICBtb250aCA9IG1vbnRoRm9ybWF0c1ttb250aEZvcm1hdF0uaW5kZXhPZihkYXRlUGFydClcbiAgICB9IGVsc2Uge1xuICAgICAgbW9udGggPSBOdW1iZXIoZGF0ZVBhcnQpIC0gMVxuICAgIH1cblxuICAgIHJldHVybiBtb250aFxuICB9KSgpXG5cbiAgLy8gR2V0IHllYXIgcGFydCBhbmQgY29udmVydCB0byBudW1iZXIgY29tcGF0aWJsZSB3aXRoIGBEYXRlYFxuXG4gIHZhciB5ZWFyID0gKGZ1bmN0aW9uIGdldFllYXIgKCkge1xuICAgIHZhciB5ZWFyID0gZGF0ZVBhcnRzW2dldFBhcnRJbmRleCgvWS8pXVxuXG4gICAgaWYgKHllYXIgJiYgKHllYXIubGVuZ3RoID09PSAyKSkgeWVhciA9ICcyMCcgKyB5ZWFyXG5cbiAgICByZXR1cm4geWVhclxuICB9KSgpXG5cbiAgcmV0dXJuIHsgeWVhcjogeWVhciwgbW9udGg6IG1vbnRoLCBkYXRlOiBkYXRlIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBwYXJzZURhdGVcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gKG9iamVjdCkge1xuICByZXR1cm4gKHR5cGVvZiBvYmplY3QgPT09ICdmdW5jdGlvbicpID8gb2JqZWN0LmNhbGwob2JqZWN0KSA6IG9iamVjdFxufVxuIiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgdGFibGUgbm9kZVxuICovXG5cbmZ1bmN0aW9uIFRhYmxlIChlbGVtZW50KSB7XG4gIHRoaXMuZWxlbWVudCA9IGVsZW1lbnRcbn1cblxuLyoqXG4gKiBAcmV0dXJucyBBIDJEIGFycmF5IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiByb3dzXG4gKi9cblxuVGFibGUucHJvdG90eXBlLnJvd3NUb0FycmF5ID0gZnVuY3Rpb24gKHJvd3MsIG9wdGlvbnMpIHtcbiAgb3B0aW9ucyA9IG9wdGlvbnMgfHwge31cbiAgdmFyIHByb2Nlc3NSb3cgPSBvcHRpb25zLnByb2Nlc3NSb3cgfHwgaWRcbiAgdmFyIHByb2Nlc3NDZWxsID0gb3B0aW9ucy5wcm9jZXNzQ2VsbCB8fCBpZFxuXG4gIHJldHVybiBtYXAocm93cywgZnVuY3Rpb24gKHRyLCByb3dJbmRleCwgcm93cykge1xuICAgIHZhciByb3cgPSBtYXAodHIuY2VsbHMsIGZ1bmN0aW9uIChub2RlLCBjZWxsSW5kZXgsIGNlbGxzKSB7XG4gICAgICByZXR1cm4gcHJvY2Vzc0NlbGwobm9kZVRleHQobm9kZSksIGNlbGxJbmRleCwgY2VsbHMsIG5vZGUpXG4gICAgfSlcblxuICAgIHJldHVybiBwcm9jZXNzUm93KHJvdywgcm93SW5kZXgsIHJvd3MsIHRyKVxuICB9KVxufVxuXG4vKipcbiAqIEByZXR1cm5zIEEgMkQgYXJyYXkgcmVwcmVzZW50YXRpb24gb2YgdGhlIHRhYmxlXG4gKi9cblxuVGFibGUucHJvdG90eXBlLnRvQXJyYXkgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnJvd3NUb0FycmF5KHRoaXMuZWxlbWVudC5xdWVyeVNlbGVjdG9yQWxsKCd0Ym9keSB0cicpKVxufVxuXG4vKipcbiAqIFNxdWFzaGVkIGFuZCB0cmltbWVkIG5vZGUgdGV4dCBjb250ZW50XG4gKi9cblxuZnVuY3Rpb24gbm9kZVRleHQgKG5vZGUpIHtcbiAgcmV0dXJuIHNxdWFzaFdoaXRlc3BhY2Uobm9kZS50ZXh0Q29udGVudClcblxuICBmdW5jdGlvbiBzcXVhc2hXaGl0ZXNwYWNlIChzdHJpbmcpIHtcbiAgICByZXR1cm4gc3RyaW5nLnJlcGxhY2UoL1xcc3syLH0vZywgJyAnKS50cmltKClcbiAgfVxufVxuXG4vKipcbiAqIG1hcCBmb3IgTm9kZUxpc3RzXG4gKi9cblxuZnVuY3Rpb24gbWFwIChhcnJheSwgZW51bWVyYXRvcikge1xuICByZXR1cm4gQXJyYXkucHJvdG90eXBlLm1hcC5jYWxsKGFycmF5LCBlbnVtZXJhdG9yKVxufVxuXG4vKipcbiAqIElkZW50aXR5IGZ1bmN0aW9uXG4gKiBAcmV0dXJucyBJdHMgaW5wdXQhXG4gKi9cblxuZnVuY3Rpb24gaWQgKHgpIHsgcmV0dXJuIHggfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRhYmxlXG4iLCIvKipcbiAqIE1hcHMga2V5cyB0byB2YWx1ZXNcbiAqIEBwYXJhbSB7QXJyYXl9IGtleXMgLSBBbiBhcnJheSBvZiBrZXlzXG4gKiBAcGFyYW0ge0FycmF5fSB2YWx1ZXMgLSBBbiBhcnJheSBvZiByYXcgdmFsdWVzXG4gKiBAcmV0dXJucyB7T2JqZWN0fVxuICovXG5cbmZ1bmN0aW9uIHdlbGQgKGtleXMsIHZhbHVlcykge1xuICB2YXIgb2JqZWN0ID0ge31cbiAgZm9yICh2YXIgaSA9IGtleXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIG9iamVjdFtrZXlzW2ldXSA9IHZhbHVlc1tpXVxuICByZXR1cm4gb2JqZWN0XG59XG5cbm1vZHVsZS5leHBvcnRzID0gd2VsZFxuIiwidmFyIHN0YXRlbWVudERlZmluaXRpb25zID0gW1xuICByZXF1aXJlKCcuL3N0YXRlbWVudC1kZWZpbml0aW9ucy9jYXRlci1hbGxlbicpLFxuICByZXF1aXJlKCcuL3N0YXRlbWVudC1kZWZpbml0aW9ucy9oc2JjJyksXG4gIHJlcXVpcmUoJy4vc3RhdGVtZW50LWRlZmluaXRpb25zL25hdHdlc3QnKVxuXVxuXG5zdGF0ZW1lbnREZWZpbml0aW9ucy5maW5kQnkgPSBmdW5jdGlvbiAoa2V5LCB2YWx1ZSkge1xuICBmb3IgKHZhciBpID0gdGhpcy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgIHZhciBkZWZpbml0aW9uID0gdGhpc1tpXVxuICAgIGlmIChkZWZpbml0aW9uW2tleV0gPT09IHZhbHVlKSByZXR1cm4gZGVmaW5pdGlvblxuICB9XG4gIHJldHVybiBudWxsXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGVtZW50RGVmaW5pdGlvbnNcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuICBpbnN0aXR1dGlvbjogJ0NhdGVyIEFsbGVuJyxcbiAgaG9zdDogJ3d3dy5jYXRlcmFsbGVub25saW5lLmNvLnVrJyxcbiAgY29sdW1uczogWydkYXRlJywgJ2Rlc2NyaXB0aW9uJywgJ3BhaWRPdXQnLCAncGFpZEluJywgJ2JhbGFuY2UnXSxcbiAgZGF0ZUZvcm1hdDogJ0RETU1NWVlZWScsXG4gIHJvd3M6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgndGFibGVbc3VtbWFyeT1cIlRhYmxlIGNvbnNpc3RzIG9mIERhdGUsIFJlZmVyZW5jZSwgUGF5bWVudHMsIFJlY2llcHRzIGFuZCBCYWxhbmNlIGNvbHVtbnMsIGRpc3BsYXlpbmcgcmVjZW50IGFjY291bnQgdHJhbnNhY3Rpb25zXCJdIHRib2R5Om50aC1vZi10eXBlKDIpIHRyJylcbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGluc3RpdHV0aW9uOiAnSFNCQycsXG4gIGhvc3Q6ICd3d3cuc2Fhcy5oc2JjLmNvLnVrJyxcbiAgY29sdW1uczogWydkYXRlJywgJ3R5cGUnLCAnZGVzY3JpcHRpb24nLCAncGFpZE91dCcsICdwYWlkSW4nLCAnYmFsYW5jZSddLFxuICBkYXRlRm9ybWF0OiAnREQgTU1NJyxcbiAgcm93czogZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCd0YWJsZVtzdW1tYXJ5PVwiVGhpcyB0YWJsZSBjb250YWlucyBhIHN0YXRlbWVudCBvZiB5b3VyIGFjY291bnRcIl0gdGJvZHkgdHInKVxuICB9LFxuICBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgdmFyIHNlbGVjdG9ycyA9IFtcbiAgICAgIC8vIEZvciBQcmV2aW91cyBTdGF0ZW1lbnRzXG4gICAgICAnI2NvbnRlbnQgPiBkaXYuY29udGFpbmVyTWFpbiBkaXYuaHNiY1RleHRSaWdodCcsXG5cbiAgICAgIC8vIEZvciBSZWNlbnQgVHJhbnNhY3Rpb25zXG4gICAgICAnI2RldGFpbC1zd2l0Y2ggPiB0YWJsZSA+IHRib2R5ID4gdHI6bnRoLWNoaWxkKDMpID4gdGQuZXh0VGFibGVDb2x1bW4yJ1xuICAgIF1cblxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICB2YXIgZGF0ZVN0cmluZyA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3JzW2ldKS50ZXh0Q29udGVudFxuICAgICAgaWYgKERhdGUucGFyc2UoZGF0ZVN0cmluZykpIHJldHVybiBuZXcgRGF0ZShkYXRlU3RyaW5nKVxuICAgIH1cbiAgfVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSB7XG4gIGluc3RpdHV0aW9uOiAnTmF0V2VzdCcsXG4gIGhvc3Q6ICd3d3cubndvbGIuY29tJyxcbiAgY29sdW1uczogWydkYXRlJywgJ3R5cGUnLCAnZGVzY3JpcHRpb24nLCAncGFpZEluJywgJ3BhaWRPdXQnLCAnYmFsYW5jZSddLFxuICBkYXRlRm9ybWF0OiAnRCBNTU0gWVlZWScsXG4gIHJvd3M6IGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gd2luZG93LmZyYW1lcy5jdGwwMF9zZWNmcmFtZS5jb250ZW50RG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnLkl0ZW1UYWJsZSB0Ym9keSB0cicpXG4gIH1cbn1cbiIsInZhciByZXN1bHQgPSByZXF1aXJlKCcuL2xpYi9yZXN1bHQnKVxudmFyIFRhYmxlID0gcmVxdWlyZSgnLi9saWIvdGFibGUnKVxudmFyIHdlbGQgPSByZXF1aXJlKCcuL2xpYi93ZWxkJylcbnZhciBUcmFuc2FjdGlvbiA9IHJlcXVpcmUoJy4vdHJhbnNhY3Rpb24nKVxudmFyIFRyYW5zYWN0aW9ucyA9IHJlcXVpcmUoJy4vdHJhbnNhY3Rpb25zJylcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgU3RhdGVtZW50XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzIC0gVXN1YWxseSBhIHN0YXRlbWVudCBkZWZpbml0aW9uXG4gKi9cblxuZnVuY3Rpb24gU3RhdGVtZW50IChhdHRyaWJ1dGVzKSB7XG4gIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKGF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkoa2V5KSkgdGhpc1trZXldID0gcmVzdWx0KGF0dHJpYnV0ZXNba2V5XSlcbiAgfVxuXG4gIC8vIENvbnZlcnQgdGFibGUgcm93cyB0byBhcnJheSBvZiB0cmFuc2FjdGlvbnNcbiAgdmFyIHRyYW5zYWN0aW9ucyA9IFRhYmxlLnByb3RvdHlwZS5yb3dzVG9BcnJheSh0aGlzLnJvd3MsIHtcbiAgICBwcm9jZXNzUm93OiBmdW5jdGlvbiAocm93KSB7XG4gICAgICByZXR1cm4gdGhpcy5jcmVhdGVUcmFuc2FjdGlvbih3ZWxkKHRoaXMuY29sdW1ucywgcm93KSlcbiAgICB9LmJpbmQodGhpcylcbiAgfSlcbiAgdGhpcy50cmFuc2FjdGlvbnMgPSBuZXcgVHJhbnNhY3Rpb25zKHRyYW5zYWN0aW9ucywgdGhpcylcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBvYmplY3Qgb2YgYXR0cmlidXRlcy5cbiAqIEByZXR1cm5zIHtUcmFuc2FjdGlvbn1cbiAqL1xuXG5TdGF0ZW1lbnQucHJvdG90eXBlLmNyZWF0ZVRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKGF0dHJpYnV0ZXMpIHtcbiAgYXR0cmlidXRlcy5kYXRlU3RyaW5nID0gYXR0cmlidXRlcy5kYXRlXG4gIGF0dHJpYnV0ZXMuZGF0ZUZvcm1hdCA9IHRoaXMuZGF0ZUZvcm1hdFxuICBkZWxldGUgYXR0cmlidXRlcy5kYXRlXG4gIHJldHVybiBuZXcgVHJhbnNhY3Rpb24oYXR0cmlidXRlcylcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgbmFtZSBvZiB0aGUgc3RhdGVtZW50IGJhc2VkIG9uIHRoZSBzdGF0ZW1lbnQgZGF0ZVxuICovXG5cblN0YXRlbWVudC5wcm90b3R5cGUubmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxhYmVsID0gdGhpcy5pbnN0aXR1dGlvbiArICcgU3RhdGVtZW50J1xuXG4gIGlmICh0aGlzLnRyYW5zYWN0aW9ucy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbGFiZWwgKyAnICcgKyB0aGlzLnRyYW5zYWN0aW9ucy5sYXN0KCkuZ2V0Rm9ybWF0dGVkKCdkYXRlJylcbiAgfVxuICByZXR1cm4gbGFiZWxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZW1lbnRcbiIsInZhciBwYXJzZURhdGUgPSByZXF1aXJlKCcuL2xpYi9wYXJzZS1kYXRlJylcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgdHJhbnNhY3Rpb24gZGF0ZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uRGF0ZSAoZGF0ZVN0cmluZywgZm9ybWF0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBwYXJzZWQgPSBwYXJzZURhdGUoZGF0ZVN0cmluZywgZm9ybWF0KVxuXG4gIHRoaXMueWVhciA9IHBhcnNlZC55ZWFyXG4gIHRoaXMubW9udGggPSBwYXJzZWQubW9udGhcbiAgdGhpcy5kYXRlID0gcGFyc2VkLmRhdGVcblxuICBpZiAoIXRoaXMueWVhciAmJiBvcHRpb25zLnN1Y2NlZWRpbmdEYXRlKSB7XG4gICAgdGhpcy55ZWFyID0gdGhpcy5jYWxjdWxhdGVZZWFyKG9wdGlvbnMuc3VjY2VlZGluZ0RhdGUpXG4gIH1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7RGF0ZX0gQSBuYXRpdmUgRGF0ZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gZGF0ZVxuICovXG5cblRyYW5zYWN0aW9uRGF0ZS5wcm90b3R5cGUudG9EYXRlID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIURhdGUucGFyc2UodGhpcy55ZWFyLCB0aGlzLm1vbnRoLCB0aGlzLmRhdGUpKSByZXR1cm4gbnVsbFxuICByZXR1cm4gbmV3IERhdGUodGhpcy55ZWFyLCB0aGlzLm1vbnRoLCB0aGlzLmRhdGUpXG59XG5cbi8qKlxuICogVXNlcyB0aGUgc3VjY2VlZGluZyBkYXRlIHRvIGRldGVybWluZSB0aGUgdHJhbnNhY3Rpb24geWVhclxuICogQHJldHVybnMge051bWJlcn1cbiAqL1xuXG5UcmFuc2FjdGlvbkRhdGUucHJvdG90eXBlLmNhbGN1bGF0ZVllYXIgPSBmdW5jdGlvbiAoc3VjY2VlZGluZ0RhdGUpIHtcbiAgdmFyIHllYXIgPSBzdWNjZWVkaW5nRGF0ZS5nZXRGdWxsWWVhcigpXG5cbiAgLy8gRGVjIC0gSmFuXG4gIGlmIChzdWNjZWVkaW5nRGF0ZS5nZXRNb250aCgpID09PSAwICYmIHRoaXMubW9udGggPT09IDExKSB5ZWFyLS1cblxuICByZXR1cm4geWVhclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uRGF0ZVxuIiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiB0cmFuc2FjdGlvbiBkYXRlc1xuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gZGF0ZXMgLSBBbiBhcnJheSBvZiBvYmplY3RzIGluIHRoZSBmb3JtIHsgeWVhcjogeWVhciwgbW9udGg6IG1vbnRoLCBkYXRlOiBkYXRlIH1cbiAqL1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbkRhdGVzIChkYXRlcykge1xuICB0aGlzLmRhdGVzID0gZGF0ZXNcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIGRhdGVzIGFyZSBjaHJvbm9sb2dpY2FsIG9yIG5vdFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cblxuVHJhbnNhY3Rpb25EYXRlcy5wcm90b3R5cGUuY2hyb25vbG9naWNhbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHVuaXEgPSB0aGlzLnVuaXEoKVxuICBpZiAodW5pcS5sZW5ndGggPCAyKSByZXR1cm4gdHJ1ZVxuXG4gIHJldHVybiB0aGlzLmNvbXBhcmUodW5pcVswXSwgdW5pcVsxXSkgPj0gMFxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtBcnJheX0gVGhlIHVuaXF1ZSBkYXRlc1xuICovXG5cblRyYW5zYWN0aW9uRGF0ZXMucHJvdG90eXBlLnVuaXEgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB1bmlxcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGRhdGUgPSB0aGlzLmRhdGVzW2ldXG4gICAgaWYgKGluVW5pcXMoZGF0ZSkpIGNvbnRpbnVlXG4gICAgdW5pcXMucHVzaChkYXRlKVxuICB9XG5cbiAgcmV0dXJuIHVuaXFzXG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIGEgZGF0ZSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgdW5pcXMgYXJyYXlcbiAgZnVuY3Rpb24gaW5VbmlxcyAoZCkge1xuICAgIHJldHVybiB1bmlxcy5zb21lKGZ1bmN0aW9uICh1KSB7XG4gICAgICByZXR1cm4gdS55ZWFyID09PSBkLnllYXIgJiYgdS5tb250aCA9PT0gZC5tb250aCAmJiB1LmRhdGUgPT09IGQuZGF0ZVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBDb21wYXJlcyB0d28gZGF0ZXMgdG8gdGVzdCBjaHJvbm9sb2d5XG4gKiBAcmV0dXJucyB7TnVtYmVyfSAwOiBhID09IGIsIDE6IGEgPiBiLCAtMTogYSA8IGJcbiAqL1xuXG5UcmFuc2FjdGlvbkRhdGVzLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgLy8gSWYgbm8geWVhciwgYW5kIGRhdGVzIGdvIGZyb20gRGVjIC0gSmFuLCBhc3N1bWUgRGVjIGRhdGUgaXMgb2xkZXJcbiAgaWYgKCghYS55ZWFyIHx8ICFiLnllYXIpICYmIGEubW9udGggPT09IDExICYmIGIubW9udGggPT09IDApIHJldHVybiAxXG5cbiAgaWYgKGEueWVhciA9PT0gYi55ZWFyKSB7XG4gICAgaWYgKGEubW9udGggPT09IGIubW9udGgpIHtcbiAgICAgIGlmIChhLmRhdGUgPiBiLmRhdGUpIHJldHVybiAtMVxuICAgICAgaWYgKGEuZGF0ZSA8IGIuZGF0ZSkgcmV0dXJuIDFcbiAgICAgIHJldHVybiAwXG4gICAgfVxuXG4gICAgaWYgKGEubW9udGggPiBiLm1vbnRoKSByZXR1cm4gLTFcbiAgICBpZiAoYS5tb250aCA8IGIubW9udGgpIHJldHVybiAxXG4gIH1cbiAgaWYgKGEueWVhciA+IGIueWVhcikgcmV0dXJuIC0xXG4gIGlmIChhLnllYXIgPCBiLnllYXIpIHJldHVybiAxXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNhY3Rpb25EYXRlc1xuIiwidmFyIG1ha2VOdW1iZXIgPSByZXF1aXJlKCcuL2xpYi9udW1iZXIvbWFrZS1udW1iZXInKVxudmFyIG1ha2VBYnNvbHV0ZU51bWJlciA9IHJlcXVpcmUoJy4vbGliL251bWJlci9tYWtlLWFic29sdXRlLW51bWJlcicpXG52YXIgVHJhbnNhY3Rpb25EYXRlID0gcmVxdWlyZSgnLi90cmFuc2FjdGlvbi1kYXRlJylcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgc2luZ2xlIHRyYW5zYWN0aW9uLlxuICogR2V0dGVycyBhbmQgc2V0dGVycyBhcmUgdXNlZCB0byB0cmFuc2Zvcm0gYW5kIGZvcm1hdCB2YWx1ZXMuIEFsc28gcmVzcG9uc2libGVcbiAqIGZvciBjYWxjdWxhdGluZyBhbW91bnRzIGFuZCBkYXRlcyB3aGVuIG1pc3Npbmcgb3IgaW52YWxpZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXNcbiAqL1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbiAoYXR0cmlidXRlcykge1xuICB0aGlzLmF0dHJpYnV0ZXMgPSB7fVxuXG4gIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKGF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkoa2V5KSkgdGhpcy5zZXQoa2V5LCBhdHRyaWJ1dGVzW2tleV0pXG4gIH1cblxuICBpZiAoIXRoaXMuZ2V0KCdkYXRlJykpIHRoaXMuc2V0RGF0ZSgpXG4gIGlmICghdGhpcy5nZXQoJ2Ftb3VudCcpKSB0aGlzLnNldEFtb3VudCgpXG59XG5cbi8qKlxuICogRnVuY3Rpb25zIHRoYXQgdHJhbnNmb3JtIGF0dHJpYnV0ZXMgYXMgdGhleSBhcmUgc2V0XG4gKi9cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnRyYW5zZm9ybWVycyA9IHtcbiAgYW1vdW50OiBtYWtlTnVtYmVyLFxuICBiYWxhbmNlOiBtYWtlTnVtYmVyLFxuICBwYWlkSW46IG1ha2VBYnNvbHV0ZU51bWJlcixcbiAgcGFpZE91dDogbWFrZUFic29sdXRlTnVtYmVyLFxuICBkYXRlOiBmdW5jdGlvbiAoZGF0ZSkge1xuICAgIGlmICghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkgcmV0dXJuIGRhdGVcblxuICAgIC8vIENvbnZlcnQgdG8gR01UIHRvIGVuc3VyZSBjb3JyZWN0IEpTT04gdmFsdWVzXG4gICAgZGF0ZS5zZXRIb3VycyhkYXRlLmdldEhvdXJzKCkgLSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkgLyA2MClcbiAgICByZXR1cm4gZGF0ZVxuICB9XG59XG5cbi8qKlxuICogRnVuY3Rpb25zIHRoYXQgZm9ybWF0IGF0dHJpYnV0ZXMgd2hlbiByZXRyaWV2ZWQgd2l0aCBgZ2V0Rm9ybWF0dGVkYFxuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5mb3JtYXR0ZXJzID0ge1xuICBkYXRlOiBmb3JtYXREYXRlXG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhbmQgc2V0cyB0aGUgZ2l2ZW4gYXR0cmlidXRlXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0gVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZVxuICogQHBhcmFtIHZhbHVlIC0gVGhlIHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGVcbiAqL1xuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgdmFyIHRyYW5zZm9ybWVyID0gdGhpcy50cmFuc2Zvcm1lcnNba2V5XSB8fCBpZEZ1bmN0aW9uXG4gIHRoaXMuYXR0cmlidXRlc1trZXldID0gdHJhbnNmb3JtZXIodmFsdWUpXG59XG5cbi8qKlxuICogQHJldHVybnMgdGhlIHN0b3JlZCBhdHRyaWJ1dGVcbiAqL1xuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW2tleV1cbn1cblxuLyoqXG4gKiBHZXQgYSB2YWx1ZSBmb3JtYXR0ZWQgYnkgdGhlIGNvcnJlc3BvbmRpbmcgZm9ybWF0dGVyXG4gKiBAcGFyYW0ga2V5IC0gVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmV0dXJuXG4gKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIGF0dHJpYnV0ZVxuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5nZXRGb3JtYXR0ZWQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBmb3JtYXR0ZXIgPSB0aGlzLmZvcm1hdHRlcnNba2V5XSB8fCBpZEZ1bmN0aW9uXG4gIHJldHVybiBmb3JtYXR0ZXIodGhpcy5nZXQoa2V5KSlcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGFycmF5IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBrZXlzIG9yIGFsbCBmb3JtYXR0ZWRcbiAqIGF0dHJpYnV0ZXMuXG4gKiBAcGFyYW0ge0FycmF5fSBrZXlzIC0gQW4gYXJyYXkgb2YgYXR0cmlidXRlIGtleXNcbiAqIEByZXR1cm5zIHtBcnJheX0gLSBBbiBhcnJheSBvZiBmb3JtYXR0ZWQgYXR0cmlidXRlc1xuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKGtleXMpIHtcbiAga2V5cyA9IGtleXMgfHwgT2JqZWN0LmtleXModGhpcy5hdHRyaWJ1dGVzKVxuICByZXR1cm4ga2V5cy5tYXAodGhpcy5nZXRGb3JtYXR0ZWQuYmluZCh0aGlzKSlcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIG9iamVjdCBvZiBmb3JtYXR0ZWQgdmFsdWVzIG9mIHRoZSBnaXZlbiBrZXlzIG9yIGFsbCBmb3JtYXR0ZWRcbiAqIGF0dHJpYnV0ZXMuXG4gKiBAcGFyYW0ge0FycmF5fSBrZXlzIC0gQW4gYXJyYXkgb2YgYXR0cmlidXRlIGtleXNcbiAqIEByZXR1cm5zIHtBcnJheX0gLSBBbiBhcnJheSBvZiBmb3JtYXR0ZWQgYXR0cmlidXRlc1xuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoa2V5cykge1xuICBrZXlzID0ga2V5cyB8fCBPYmplY3Qua2V5cyh0aGlzLmF0dHJpYnV0ZXMpXG4gIHZhciBvYmplY3QgPSB7fVxuXG4gIGZvciAodmFyIGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGtleSA9IGtleXNbaV1cbiAgICBvYmplY3Rba2V5XSA9IHRoaXMuZ2V0Rm9ybWF0dGVkKGtleSlcbiAgfVxuXG4gIHJldHVybiBvYmplY3Rcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnNldERhdGUgPSBmdW5jdGlvbiAoYXR0cnMpIHtcbiAgYXR0cnMgPSBhdHRycyB8fCB7fVxuICB2YXIgZGF0ZVN0cmluZyA9IGF0dHJzLmRhdGVTdHJpbmcgfHwgdGhpcy5nZXQoJ2RhdGVTdHJpbmcnKVxuICB2YXIgZGF0ZUZvcm1hdCA9IGF0dHJzLmRhdGVGb3JtYXQgfHwgdGhpcy5nZXQoJ2RhdGVGb3JtYXQnKVxuICB2YXIgc3VjY2VlZGluZ0RhdGUgPSBhdHRycy5zdWNjZWVkaW5nRGF0ZVxuXG4gIHZhciB0cmFuc2FjdGlvbkRhdGUgPSBuZXcgVHJhbnNhY3Rpb25EYXRlKGRhdGVTdHJpbmcsIGRhdGVGb3JtYXQsIHtcbiAgICBzdWNjZWVkaW5nRGF0ZTogc3VjY2VlZGluZ0RhdGVcbiAgfSlcbiAgdGhpcy5zZXQoJ3RyYW5zYWN0aW9uRGF0ZScsIHRyYW5zYWN0aW9uRGF0ZSlcbiAgdGhpcy5zZXQoJ2RhdGUnLCB0cmFuc2FjdGlvbkRhdGUudG9EYXRlKCkpXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5zZXRBbW91bnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBwYWlkSW4gPSB0aGlzLmdldCgncGFpZEluJylcbiAgdmFyIHBhaWRPdXQgPSB0aGlzLmdldCgncGFpZE91dCcpXG5cbiAgdGhpcy5zZXQoJ2Ftb3VudCcsIGNhbGN1bGF0ZUFtb3VudChwYWlkSW4sIHBhaWRPdXQpKVxufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVBbW91bnQgKHBhaWRJbiwgcGFpZE91dCkge1xuICByZXR1cm4gcGFpZEluID8gcGFpZEluIDogLXBhaWRPdXRcbn1cblxuZnVuY3Rpb24gZm9ybWF0RGF0ZSAodmFsdWUpIHtcbiAgdmFyIHl5eXkgPSB2YWx1ZS5nZXRGdWxsWWVhcigpXG4gIHZhciBtbSA9IHBhZFplcm9lcyh2YWx1ZS5nZXRNb250aCgpICsgMSlcbiAgdmFyIGRkID0gcGFkWmVyb2VzKHZhbHVlLmdldERhdGUoKSlcblxuICByZXR1cm4gW3l5eXksIG1tLCBkZF0uam9pbignLScpXG5cbiAgZnVuY3Rpb24gcGFkWmVyb2VzIChudW1iZXIpIHtcbiAgICByZXR1cm4gU3RyaW5nKCcwMCcgKyBudW1iZXIpLnNsaWNlKC0yKVxuICB9XG59XG5cbmZ1bmN0aW9uIGlkRnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uXG4iLCJ2YXIgVHJhbnNhY3Rpb25EYXRlcyA9IHJlcXVpcmUoJy4vdHJhbnNhY3Rpb24tZGF0ZXMnKVxuXG4vKipcbiAqIEFuIGFycmF5LWxpa2UgY2xhc3MgdGhhdCByZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiB0cmFuc2FjdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtBcnJheX0gdHJhbnNhY3Rpb25zIC0gQW4gYXJyYXkgb2YgVHJhbnNhY3Rpb24gb2JqZWN0c1xuICogQHBhcmFtIHtPYmplY3R9IHN0YXRlbWVudCAtIFRoZSBwYXJlbnQgc3RhdGVtZW50XG4gKiBAcmV0dXJucyB7QXJyYXl9IC0gQW4gYXJyYXkgb2YgdHJhbnNhY3Rpb25zIHdpdGggY29udmVuaWVuY2UgbWV0aG9kc1xuICovXG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9ucyAodHJhbnNhY3Rpb25zLCBzdGF0ZW1lbnQpIHtcbiAgVHJhbnNhY3Rpb25zLl9pbmplY3RQcm90b3R5cGVNZXRob2RzKHRyYW5zYWN0aW9ucylcblxuICAvKipcbiAgICogU29tZSBmaW5hbmNpYWwgaW5zdGl0dXRpb25zIG9taXQgdGhlIHllYXIgcGFydCBpbiB0aGVpciBkYXRlIGNlbGxzLlxuICAgKiBUaGlzIHdvcmthcm91bmQgY2FsY3VsYXRlcyB0aGUgeWVhciBmb3IgZWFjaCB0cmFuc2FjdGlvbiBhZmZlY3RlZC5cbiAgICovXG5cbiAgaWYgKCEvWXsyLH0vLnRlc3Qoc3RhdGVtZW50LmRhdGVGb3JtYXQpKSB7XG4gICAgaWYgKCF0cmFuc2FjdGlvbnMuY2hyb25vbG9naWNhbCgpKSB0cmFuc2FjdGlvbnMgPSB0cmFuc2FjdGlvbnMucmV2ZXJzZSgpXG5cbiAgICB2YXIgc3VjY2VlZGluZ0RhdGUgPSBzdGF0ZW1lbnQuZGF0ZVxuICAgIGZvciAodmFyIGkgPSB0cmFuc2FjdGlvbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IHRyYW5zYWN0aW9uc1tpXVxuICAgICAgdHJhbnNhY3Rpb24uc2V0RGF0ZSh7IHN1Y2NlZWRpbmdEYXRlOiBzdWNjZWVkaW5nRGF0ZSB9KVxuICAgICAgc3VjY2VlZGluZ0RhdGUgPSB0cmFuc2FjdGlvbi5nZXQoJ2RhdGUnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cmFuc2FjdGlvbnNcbn1cblxuVHJhbnNhY3Rpb25zLnByb3RvdHlwZS5jaHJvbm9sb2dpY2FsID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZGF0ZXMuY2FsbCh0aGlzKS5jaHJvbm9sb2dpY2FsKClcblxuICBmdW5jdGlvbiBkYXRlcyAoKSB7XG4gICAgdmFyIGRhdGVzID0gdGhpcy5tYXAoZnVuY3Rpb24gKHRyYW5zYWN0aW9uKSB7XG4gICAgICByZXR1cm4gdHJhbnNhY3Rpb24uZ2V0KCd0cmFuc2FjdGlvbkRhdGUnKVxuICAgIH0pXG4gICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbkRhdGVzKGRhdGVzKVxuICB9XG59XG5cbi8qKlxuICogQHJldHVybnMge1RyYW5zYWN0aW9ufSBUaGUgZmlyc3QgdHJhbnNhY3Rpb24gaW4gdGhlIGNvbGxlY3Rpb25cbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLmZpcnN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpc1swXVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtUcmFuc2FjdGlvbn0gVGhlIGxhc3QgdHJhbnNhY3Rpb24gaW4gdGhlIGNvbGxlY3Rpb25cbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzW3RoaXMubGVuZ3RoIC0gMV1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7QXJyYXl9IEFuIGFycmF5IG9mIGZvcm1hdHRlZCB0cmFuc2FjdGlvbiBhdHRyaWJ1dGUgYXJyYXlzXG4gKi9cblxuVHJhbnNhY3Rpb25zLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKGtleXMpIHtcbiAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uICh0cmFuc2FjdGlvbikgeyByZXR1cm4gdHJhbnNhY3Rpb24udG9BcnJheShrZXlzKSB9KVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtBcnJheX0gQW4gYXJyYXkgb2YgZm9ybWF0dGVkIHRyYW5zYWN0aW9uIG9iamVjdHNcbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIChrZXlzKSB7XG4gIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAodHJhbnNhY3Rpb24pIHsgcmV0dXJuIHRyYW5zYWN0aW9uLnRvSlNPTihrZXlzKSB9KVxufVxuXG4vKipcbiAqIEFkZHMgdGhlIHByb3RvdHlwZSBtZXRob2RzIHRvIHRyYW5zYWN0aW9ucyBhcnJheSB0byBhcHBlYXIgbGlrZSBpbmhlcml0YW5jZVxuICogQHByaXZhdGVcbiAqL1xuXG5UcmFuc2FjdGlvbnMuX2luamVjdFByb3RvdHlwZU1ldGhvZHMgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgZm9yICh2YXIgbWV0aG9kIGluIHRoaXMucHJvdG90eXBlKSB7XG4gICAgaWYgKHRoaXMucHJvdG90eXBlLmhhc093blByb3BlcnR5KG1ldGhvZCkpIHtcbiAgICAgIGFycmF5W21ldGhvZF0gPSB0aGlzLnByb3RvdHlwZVttZXRob2RdXG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNhY3Rpb25zXG4iXX0=
