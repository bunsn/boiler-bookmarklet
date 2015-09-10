(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var definitions = require('@bunsn/boiler/statement-definitions')
var Statement = require('@bunsn/boiler/statement')
var CSV = require('./lib/csv')
var download = require('./lib/download')

var definition = definitions.findBy('host', window.location.host)
var statement = new Statement(definition)
var csv = CSV.stringify(statement.transactions.toArray())
var blob = new Blob([csv], { type: 'text/csv' })

download(URL.createObjectURL(blob), { filename: statement.name() })

},{"./lib/csv":3,"./lib/download":4,"@bunsn/boiler/statement":12,"@bunsn/boiler/statement-definitions":11}],2:[function(require,module,exports){
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

module.exports = function makeAbsoluteNumber (value) {
  return Math.abs(makeNumber(value))
}

},{"./make-number":6}],6:[function(require,module,exports){
module.exports = function makeNumber (value) {
  return Number(String(value).replace(/[^\d\.-]/g, ''))
}

},{}],7:[function(require,module,exports){
var monthFormats = {
  MMM: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  MMMM: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
}

function parseDate (dateString, format) {
  var formatParts = format.split(/[^DMY]+/)
  var dateRegex = RegExp(format.replace(/DD?/, '(\\d\\d?)')
                               .replace(/M{3,4}/, '(\\w{3,})')
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
    var datePart = dateParts[i]
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
 * Converts a table node to a 2D array
 */

function tableToArray (table, options) {
  options = options || {}
  var processRow = options.processRow || id
  var processCell = options.processCell || id

  return map(table.querySelectorAll('tbody tr'), function (tr, rowIndex, rows) {
    var row = map(tr.cells, function (node, cellIndex, cells) {
      return processCell(nodeText(node), cellIndex, cells, node)
    })

    return processRow(row, rowIndex, rows, tr)
  })
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

module.exports = tableToArray

},{}],10:[function(require,module,exports){
/**
 * Maps keys to values
 * @param {Array} data - An array of raw values
 * @param {Array} keys - An array of keys
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
  {
    institution: 'HSBC',
    host: 'www.saas.hsbc.co.uk',
    columns: ['date', 'type', 'description', 'paidOut', 'paidIn', 'balance'],
    dateFormat: 'DD MMM',
    table: function () {
      return document.querySelector('table[summary="This table contains a statement of your account"]')
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
  },
  {
    institution: 'NatWest',
    host: 'www.nwolb.com',
    columns: ['date', 'type', 'description', 'paidIn', 'paidOut', 'balance'],
    dateFormat: 'D MMM YYYY',
    table: function () {
      return window.frames.ctl00_secframe.contentDocument.querySelector('.ItemTable')
    }
  }
]

statementDefinitions.findBy = function (key, value) {
  for (var i = this.length - 1; i >= 0; i--) {
    var definition = this[i]
    if (definition[key] === value) return definition
  }
  return null
}

statementDefinitions.findByHost = function (host) {
  return this.findBy('host', host)
}

module.exports = statementDefinitions

},{}],12:[function(require,module,exports){
var result = require('./lib/result')
var tableToArray = require('./lib/table-to-array')
var weld = require('./lib/weld')
var Transaction = require('./transaction')
var Transactions = require('./transactions')

/**
 * Represents a Statement
 * @constructor
 * @param {Object} attributes - Usually a statement definition
 */

function Statement (attributes) {
  for (var key in attributes) this[key] = result(attributes[key])

  // Convert table to array of transactions
  var transactions = tableToArray(this.table, {
    processRow: function (row) {
      return this.createTransaction(weld(this.columns, row))
    }.bind(this)
  })
  this.transactions = new Transactions(transactions, this)
}

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

},{"./lib/result":8,"./lib/table-to-array":9,"./lib/weld":10,"./transaction":15,"./transactions":16}],13:[function(require,module,exports){
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
    this.calculateYear(options.succeedingDate)
  }
}

/**
 * @returns {Date} A native Date representation of the transaction date
 */

TransactionDate.prototype.toDate = function () {
  if (!Date.parse(this.year, this.month, this.date)) return null

  var date = new Date(this.year, this.month, this.date)

  // Convert to GMT to ensure correct JSON values
  date.setHours(date.getHours() - date.getTimezoneOffset() / 60)

  return date
}

/**
 * Uses the succeeding date to determine the transaction year
 * @returns {Number}
 */

TransactionDate.prototype.calculateYear = function (succeedingDate) {
  var year = succeedingDate.getFullYear()

  // Dec - Jan
  if (succeedingDate.getMonth() === 0 && this.month === 11) year--

  this.year = year
}

module.exports = TransactionDate

},{"./lib/parse-date":7}],14:[function(require,module,exports){
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

},{}],15:[function(require,module,exports){
var makeNumber = require('./lib/number/make-number')
var makeAbsoluteNumber = require('./lib/number/make-absolute-number')
var TransactionDate = require('./transaction-date')

/**
 * @constructor
 * @param {Array} data - An array of attribute values
 * @param {Array} columns - An array of attribute keys in the order they appear in `data`
 * @param {Object} options
 */

function Transaction (attributes) {
  this.attributes = {}

  for (var key in attributes) this.set(key, attributes[key])

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
  paidOut: makeAbsoluteNumber
}

/**
 * Functions that format attributes when retrieved with `getFormatted`
 */

Transaction.prototype.formatters = {
  date: formatDate
}

/**
 * Default output columns
 */

Transaction.prototype.output = ['date', 'amount', 'description']

/**
 * Transforms and sets the given attribute
 */

Transaction.prototype.set = function (key, value) {
  var transformer = this.transformers[key] || function (v) { return v }
  this.attributes[key] = transformer(value)
}

/**
 * Returns the stored attribute
 */

Transaction.prototype.get = function (key) {
  return this.attributes[key]
}

/**
 * Returns the formatted attribute
 */

Transaction.prototype.getFormatted = function (key) {
  var value = this.get(key)

  var formatter = this.formatters[key]
  if (typeof formatter === 'function') value = formatter(value)

  return value
}

Transaction.prototype.isValid = function () {
  return this.toArray().every(function (i) { return Boolean(i) })
}

Transaction.prototype.toArray = function () {
  return this.output.map(this.getFormatted.bind(this))
}

Transaction.prototype.toJSON = function () {
  var object = {}

  for (var i = this.output.length - 1; i >= 0; i--) {
    var key = this.output[i]
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

  this.set('amount', amountFromAbsolutes(paidIn, paidOut))
}

function amountFromAbsolutes (paidIn, paidOut) {
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

module.exports = Transaction

},{"./lib/number/make-absolute-number":5,"./lib/number/make-number":6,"./transaction-date":13}],16:[function(require,module,exports){
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
}

function dates () {
  var dates = this.map(function (transaction) {
    return transaction.get('transactionDate')
  })
  return new TransactionDates(dates)
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

Transactions.prototype.toArray = function () {
  return this.map(function (transaction) { return transaction.toArray() })
}

/**
 * @returns {Array} An array of formatted transaction objects
 */

Transactions.prototype.toJSON = function () {
  return this.map(function (transaction) { return transaction.toJSON() })
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

},{"./transaction-dates":14}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9jc3YvYXJyYXktdG8tZHN2LmpzIiwibGliL2Nzdi9pbmRleC5qcyIsImxpYi9kb3dubG9hZC5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL2xpYi9udW1iZXIvbWFrZS1hYnNvbHV0ZS1udW1iZXIuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9saWIvbnVtYmVyL21ha2UtbnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3BhcnNlLWRhdGUuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9saWIvcmVzdWx0LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3RhYmxlLXRvLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3dlbGQuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci90cmFuc2FjdGlvbi1kYXRlLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvdHJhbnNhY3Rpb24tZGF0ZXMuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci90cmFuc2FjdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL3RyYW5zYWN0aW9ucy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNYQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDYkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbklBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgZGVmaW5pdGlvbnMgPSByZXF1aXJlKCdAYnVuc24vYm9pbGVyL3N0YXRlbWVudC1kZWZpbml0aW9ucycpXG52YXIgU3RhdGVtZW50ID0gcmVxdWlyZSgnQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQnKVxudmFyIENTViA9IHJlcXVpcmUoJy4vbGliL2NzdicpXG52YXIgZG93bmxvYWQgPSByZXF1aXJlKCcuL2xpYi9kb3dubG9hZCcpXG5cbnZhciBkZWZpbml0aW9uID0gZGVmaW5pdGlvbnMuZmluZEJ5KCdob3N0Jywgd2luZG93LmxvY2F0aW9uLmhvc3QpXG52YXIgc3RhdGVtZW50ID0gbmV3IFN0YXRlbWVudChkZWZpbml0aW9uKVxudmFyIGNzdiA9IENTVi5zdHJpbmdpZnkoc3RhdGVtZW50LnRyYW5zYWN0aW9ucy50b0FycmF5KCkpXG52YXIgYmxvYiA9IG5ldyBCbG9iKFtjc3ZdLCB7IHR5cGU6ICd0ZXh0L2NzdicgfSlcblxuZG93bmxvYWQoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSwgeyBmaWxlbmFtZTogc3RhdGVtZW50Lm5hbWUoKSB9KVxuIiwiLyoqXG4gKiBDb252ZXJ0cyBhIHR3by1kaW1lbnNpb25hbCBhcnJheSB0byBhIGRlbGltaXRlci1zZXBhcmF0ZWQgc3RyaW5nXG4gKi9cblxuZnVuY3Rpb24gYXJyYXlUb0RTViAoYXJyYXksIGRlbGltaXRlcikge1xuICByZXR1cm4gYXJyYXkubWFwKHByb2Nlc3NSb3cpLmpvaW4oJ1xcbicpXG5cbiAgZnVuY3Rpb24gcHJvY2Vzc1JvdyAoYXJyYXkpIHtcbiAgICByZXR1cm4gYXJyYXkubWFwKHByb2Nlc3NJdGVtKS5qb2luKGRlbGltaXRlcilcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb2Nlc3NJdGVtIChpdGVtKSB7XG4gICAgaXRlbSA9IFN0cmluZyhpdGVtKVxuXG4gICAgdmFyIGhhc0RvdWJsZVF1b3RlID0gL1wiLy50ZXN0KGl0ZW0pXG4gICAgdmFyIGhhc0xpbmVCcmVhayA9IC9bXFxuXFxyXS8udGVzdChpdGVtKVxuICAgIHZhciBoYXNEZWxpbWl0ZXIgPSBuZXcgUmVnRXhwKGRlbGltaXRlcikudGVzdChpdGVtKVxuXG4gICAgaWYgKGhhc0RvdWJsZVF1b3RlKSBpdGVtID0gZXNjYXBlRG91YmxlUXVvdGVzKGl0ZW0pXG4gICAgaWYgKGhhc0RvdWJsZVF1b3RlIHx8IGhhc0xpbmVCcmVhayB8fCBoYXNEZWxpbWl0ZXIpIHtcbiAgICAgIGl0ZW0gPSB3cmFwSW5Eb3VibGVRdW90ZXMoaXRlbSlcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbVxuICB9XG5cbiAgZnVuY3Rpb24gZXNjYXBlRG91YmxlUXVvdGVzIChpdGVtKSB7XG4gICAgcmV0dXJuIGl0ZW0ucmVwbGFjZSgvXCIvZywgJ1wiXCInKVxuICB9XG5cbiAgZnVuY3Rpb24gd3JhcEluRG91YmxlUXVvdGVzIChpdGVtKSB7XG4gICAgcmV0dXJuICdcIicgKyBpdGVtICsgJ1wiJ1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlUb0RTVlxuIiwidmFyIGFycmF5VG9EU1YgPSByZXF1aXJlKCcuL2FycmF5LXRvLWRzdicpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBzdHJpbmdpZnk6IGZ1bmN0aW9uIChhcnJheSkgeyByZXR1cm4gYXJyYXlUb0RTVihhcnJheSwgJywnKSB9XG59XG4iLCJmdW5jdGlvbiBkb3dubG9hZCAodXJsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cbiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgYS5ocmVmID0gdXJsXG4gIGEuZG93bmxvYWQgPSBvcHRpb25zLmZpbGVuYW1lXG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKVxuICBhLmNsaWNrKClcbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvd25sb2FkXG4iLCJ2YXIgbWFrZU51bWJlciA9IHJlcXVpcmUoJy4vbWFrZS1udW1iZXInKVxuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1ha2VBYnNvbHV0ZU51bWJlciAodmFsdWUpIHtcbiAgcmV0dXJuIE1hdGguYWJzKG1ha2VOdW1iZXIodmFsdWUpKVxufVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBtYWtlTnVtYmVyICh2YWx1ZSkge1xuICByZXR1cm4gTnVtYmVyKFN0cmluZyh2YWx1ZSkucmVwbGFjZSgvW15cXGRcXC4tXS9nLCAnJykpXG59XG4iLCJ2YXIgbW9udGhGb3JtYXRzID0ge1xuICBNTU06IFsnSmFuJywgJ0ZlYicsICdNYXInLCAnQXByJywgJ01heScsICdKdW4nLCAnSnVsJywgJ0F1ZycsICdTZXAnLCAnT2N0JywgJ05vdicsICdEZWMnXSxcbiAgTU1NTTogWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLCAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ11cbn1cblxuZnVuY3Rpb24gcGFyc2VEYXRlIChkYXRlU3RyaW5nLCBmb3JtYXQpIHtcbiAgdmFyIGZvcm1hdFBhcnRzID0gZm9ybWF0LnNwbGl0KC9bXkRNWV0rLylcbiAgdmFyIGRhdGVSZWdleCA9IFJlZ0V4cChmb3JtYXQucmVwbGFjZSgvREQ/LywgJyhcXFxcZFxcXFxkPyknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9NezMsNH0vLCAnKFxcXFx3ezMsfSknKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9NTT8vLCAnKFxcXFxkXFxcXGQ/KScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1l7Miw0fS8sICcoXFxcXGR7Miw0fSknKSlcbiAgdmFyIGRhdGVQYXJ0cyA9IGRhdGVTdHJpbmcubWF0Y2goZGF0ZVJlZ2V4KVxuXG4gIGlmIChkYXRlUGFydHMpIHtcbiAgICBkYXRlUGFydHMgPSBkYXRlUGFydHMuc3BsaWNlKDEpXG4gIH0gZWxzZSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKCdDYW5ub3QgcGFyc2U6IGAnICsgZGF0ZVN0cmluZyArICdgIHdpdGggZm9ybWF0OiBgJyArIGZvcm1hdCArICdgJylcbiAgfVxuXG4gIGZ1bmN0aW9uIGdldFBhcnRJbmRleCAocmVnZXgpIHtcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGZvcm1hdFBhcnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAocmVnZXgudGVzdChmb3JtYXRQYXJ0c1tpXSkpIHJldHVybiBpXG4gICAgfVxuICB9XG5cbiAgdmFyIGRhdGUgPSBkYXRlUGFydHNbZ2V0UGFydEluZGV4KC9ELyldXG5cbiAgLy8gR2V0IG1vbnRoIHBhcnQgYW5kIGNvbnZlcnQgdG8gbnVtYmVyIGNvbXBhdGlibGUgd2l0aCBgRGF0ZWBcblxuICB2YXIgbW9udGggPSAoZnVuY3Rpb24gZ2V0TW9udGggKCkge1xuICAgIHZhciBpID0gZ2V0UGFydEluZGV4KC9NLylcbiAgICB2YXIgbW9udGhGb3JtYXQgPSBmb3JtYXRQYXJ0c1tpXVxuICAgIHZhciBkYXRlUGFydCA9IGRhdGVQYXJ0c1tpXVxuICAgIHZhciBtb250aFxuXG4gICAgaWYgKG1vbnRoRm9ybWF0Lmxlbmd0aCA+IDIpIHtcbiAgICAgIG1vbnRoID0gbW9udGhGb3JtYXRzW21vbnRoRm9ybWF0XS5pbmRleE9mKGRhdGVQYXJ0KVxuICAgIH0gZWxzZSB7XG4gICAgICBtb250aCA9IE51bWJlcihkYXRlUGFydCkgLSAxXG4gICAgfVxuXG4gICAgcmV0dXJuIG1vbnRoXG4gIH0pKClcblxuICAvLyBHZXQgeWVhciBwYXJ0IGFuZCBjb252ZXJ0IHRvIG51bWJlciBjb21wYXRpYmxlIHdpdGggYERhdGVgXG5cbiAgdmFyIHllYXIgPSAoZnVuY3Rpb24gZ2V0WWVhciAoKSB7XG4gICAgdmFyIHllYXIgPSBkYXRlUGFydHNbZ2V0UGFydEluZGV4KC9ZLyldXG5cbiAgICBpZiAoeWVhciAmJiAoeWVhci5sZW5ndGggPT09IDIpKSB5ZWFyID0gJzIwJyArIHllYXJcblxuICAgIHJldHVybiB5ZWFyXG4gIH0pKClcblxuICByZXR1cm4geyB5ZWFyOiB5ZWFyLCBtb250aDogbW9udGgsIGRhdGU6IGRhdGUgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHBhcnNlRGF0ZVxuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAob2JqZWN0KSB7XG4gIHJldHVybiAodHlwZW9mIG9iamVjdCA9PT0gJ2Z1bmN0aW9uJykgPyBvYmplY3QuY2FsbChvYmplY3QpIDogb2JqZWN0XG59XG4iLCIvKipcbiAqIENvbnZlcnRzIGEgdGFibGUgbm9kZSB0byBhIDJEIGFycmF5XG4gKi9cblxuZnVuY3Rpb24gdGFibGVUb0FycmF5ICh0YWJsZSwgb3B0aW9ucykge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fVxuICB2YXIgcHJvY2Vzc1JvdyA9IG9wdGlvbnMucHJvY2Vzc1JvdyB8fCBpZFxuICB2YXIgcHJvY2Vzc0NlbGwgPSBvcHRpb25zLnByb2Nlc3NDZWxsIHx8IGlkXG5cbiAgcmV0dXJuIG1hcCh0YWJsZS5xdWVyeVNlbGVjdG9yQWxsKCd0Ym9keSB0cicpLCBmdW5jdGlvbiAodHIsIHJvd0luZGV4LCByb3dzKSB7XG4gICAgdmFyIHJvdyA9IG1hcCh0ci5jZWxscywgZnVuY3Rpb24gKG5vZGUsIGNlbGxJbmRleCwgY2VsbHMpIHtcbiAgICAgIHJldHVybiBwcm9jZXNzQ2VsbChub2RlVGV4dChub2RlKSwgY2VsbEluZGV4LCBjZWxscywgbm9kZSlcbiAgICB9KVxuXG4gICAgcmV0dXJuIHByb2Nlc3NSb3cocm93LCByb3dJbmRleCwgcm93cywgdHIpXG4gIH0pXG59XG5cbi8qKlxuICogU3F1YXNoZWQgYW5kIHRyaW1tZWQgbm9kZSB0ZXh0IGNvbnRlbnRcbiAqL1xuXG5mdW5jdGlvbiBub2RlVGV4dCAobm9kZSkge1xuICByZXR1cm4gc3F1YXNoV2hpdGVzcGFjZShub2RlLnRleHRDb250ZW50KVxuXG4gIGZ1bmN0aW9uIHNxdWFzaFdoaXRlc3BhY2UgKHN0cmluZykge1xuICAgIHJldHVybiBzdHJpbmcucmVwbGFjZSgvXFxzezIsfS9nLCAnICcpLnRyaW0oKVxuICB9XG59XG5cbi8qKlxuICogbWFwIGZvciBOb2RlTGlzdHNcbiAqL1xuXG5mdW5jdGlvbiBtYXAgKGFycmF5LCBlbnVtZXJhdG9yKSB7XG4gIHJldHVybiBBcnJheS5wcm90b3R5cGUubWFwLmNhbGwoYXJyYXksIGVudW1lcmF0b3IpXG59XG5cbi8qKlxuICogSWRlbnRpdHkgZnVuY3Rpb25cbiAqIEByZXR1cm5zIEl0cyBpbnB1dCFcbiAqL1xuXG5mdW5jdGlvbiBpZCAoeCkgeyByZXR1cm4geCB9XG5cbm1vZHVsZS5leHBvcnRzID0gdGFibGVUb0FycmF5XG4iLCIvKipcbiAqIE1hcHMga2V5cyB0byB2YWx1ZXNcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBBbiBhcnJheSBvZiByYXcgdmFsdWVzXG4gKiBAcGFyYW0ge0FycmF5fSBrZXlzIC0gQW4gYXJyYXkgb2Yga2V5c1xuICogQHJldHVybnMge09iamVjdH1cbiAqL1xuXG5mdW5jdGlvbiB3ZWxkIChrZXlzLCB2YWx1ZXMpIHtcbiAgdmFyIG9iamVjdCA9IHt9XG4gIGZvciAodmFyIGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSBvYmplY3Rba2V5c1tpXV0gPSB2YWx1ZXNbaV1cbiAgcmV0dXJuIG9iamVjdFxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHdlbGRcbiIsInZhciBzdGF0ZW1lbnREZWZpbml0aW9ucyA9IFtcbiAge1xuICAgIGluc3RpdHV0aW9uOiAnSFNCQycsXG4gICAgaG9zdDogJ3d3dy5zYWFzLmhzYmMuY28udWsnLFxuICAgIGNvbHVtbnM6IFsnZGF0ZScsICd0eXBlJywgJ2Rlc2NyaXB0aW9uJywgJ3BhaWRPdXQnLCAncGFpZEluJywgJ2JhbGFuY2UnXSxcbiAgICBkYXRlRm9ybWF0OiAnREQgTU1NJyxcbiAgICB0YWJsZTogZnVuY3Rpb24gKCkge1xuICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RhYmxlW3N1bW1hcnk9XCJUaGlzIHRhYmxlIGNvbnRhaW5zIGEgc3RhdGVtZW50IG9mIHlvdXIgYWNjb3VudFwiXScpXG4gICAgfSxcbiAgICBkYXRlOiBmdW5jdGlvbiAoKSB7XG4gICAgICB2YXIgc2VsZWN0b3JzID0gW1xuICAgICAgICAvLyBGb3IgUHJldmlvdXMgU3RhdGVtZW50c1xuICAgICAgICAnI2NvbnRlbnQgPiBkaXYuY29udGFpbmVyTWFpbiBkaXYuaHNiY1RleHRSaWdodCcsXG5cbiAgICAgICAgLy8gRm9yIFJlY2VudCBUcmFuc2FjdGlvbnNcbiAgICAgICAgJyNkZXRhaWwtc3dpdGNoID4gdGFibGUgPiB0Ym9keSA+IHRyOm50aC1jaGlsZCgzKSA+IHRkLmV4dFRhYmxlQ29sdW1uMidcbiAgICAgIF1cblxuICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCBzZWxlY3RvcnMubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgdmFyIGRhdGVTdHJpbmcgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yc1tpXSkudGV4dENvbnRlbnRcbiAgICAgICAgaWYgKERhdGUucGFyc2UoZGF0ZVN0cmluZykpIHJldHVybiBuZXcgRGF0ZShkYXRlU3RyaW5nKVxuICAgICAgfVxuICAgIH1cbiAgfSxcbiAge1xuICAgIGluc3RpdHV0aW9uOiAnTmF0V2VzdCcsXG4gICAgaG9zdDogJ3d3dy5ud29sYi5jb20nLFxuICAgIGNvbHVtbnM6IFsnZGF0ZScsICd0eXBlJywgJ2Rlc2NyaXB0aW9uJywgJ3BhaWRJbicsICdwYWlkT3V0JywgJ2JhbGFuY2UnXSxcbiAgICBkYXRlRm9ybWF0OiAnRCBNTU0gWVlZWScsXG4gICAgdGFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiB3aW5kb3cuZnJhbWVzLmN0bDAwX3NlY2ZyYW1lLmNvbnRlbnREb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuSXRlbVRhYmxlJylcbiAgICB9XG4gIH1cbl1cblxuc3RhdGVtZW50RGVmaW5pdGlvbnMuZmluZEJ5ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgZm9yICh2YXIgaSA9IHRoaXMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIgZGVmaW5pdGlvbiA9IHRoaXNbaV1cbiAgICBpZiAoZGVmaW5pdGlvbltrZXldID09PSB2YWx1ZSkgcmV0dXJuIGRlZmluaXRpb25cbiAgfVxuICByZXR1cm4gbnVsbFxufVxuXG5zdGF0ZW1lbnREZWZpbml0aW9ucy5maW5kQnlIb3N0ID0gZnVuY3Rpb24gKGhvc3QpIHtcbiAgcmV0dXJuIHRoaXMuZmluZEJ5KCdob3N0JywgaG9zdClcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBzdGF0ZW1lbnREZWZpbml0aW9uc1xuIiwidmFyIHJlc3VsdCA9IHJlcXVpcmUoJy4vbGliL3Jlc3VsdCcpXG52YXIgdGFibGVUb0FycmF5ID0gcmVxdWlyZSgnLi9saWIvdGFibGUtdG8tYXJyYXknKVxudmFyIHdlbGQgPSByZXF1aXJlKCcuL2xpYi93ZWxkJylcbnZhciBUcmFuc2FjdGlvbiA9IHJlcXVpcmUoJy4vdHJhbnNhY3Rpb24nKVxudmFyIFRyYW5zYWN0aW9ucyA9IHJlcXVpcmUoJy4vdHJhbnNhY3Rpb25zJylcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgU3RhdGVtZW50XG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7T2JqZWN0fSBhdHRyaWJ1dGVzIC0gVXN1YWxseSBhIHN0YXRlbWVudCBkZWZpbml0aW9uXG4gKi9cblxuZnVuY3Rpb24gU3RhdGVtZW50IChhdHRyaWJ1dGVzKSB7XG4gIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB0aGlzW2tleV0gPSByZXN1bHQoYXR0cmlidXRlc1trZXldKVxuXG4gIC8vIENvbnZlcnQgdGFibGUgdG8gYXJyYXkgb2YgdHJhbnNhY3Rpb25zXG4gIHZhciB0cmFuc2FjdGlvbnMgPSB0YWJsZVRvQXJyYXkodGhpcy50YWJsZSwge1xuICAgIHByb2Nlc3NSb3c6IGZ1bmN0aW9uIChyb3cpIHtcbiAgICAgIHJldHVybiB0aGlzLmNyZWF0ZVRyYW5zYWN0aW9uKHdlbGQodGhpcy5jb2x1bW5zLCByb3cpKVxuICAgIH0uYmluZCh0aGlzKVxuICB9KVxuICB0aGlzLnRyYW5zYWN0aW9ucyA9IG5ldyBUcmFuc2FjdGlvbnModHJhbnNhY3Rpb25zLCB0aGlzKVxufVxuXG5TdGF0ZW1lbnQucHJvdG90eXBlLmNyZWF0ZVRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKGF0dHJpYnV0ZXMpIHtcbiAgYXR0cmlidXRlcy5kYXRlU3RyaW5nID0gYXR0cmlidXRlcy5kYXRlXG4gIGF0dHJpYnV0ZXMuZGF0ZUZvcm1hdCA9IHRoaXMuZGF0ZUZvcm1hdFxuICBkZWxldGUgYXR0cmlidXRlcy5kYXRlXG4gIHJldHVybiBuZXcgVHJhbnNhY3Rpb24oYXR0cmlidXRlcylcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgbmFtZSBvZiB0aGUgc3RhdGVtZW50IGJhc2VkIG9uIHRoZSBzdGF0ZW1lbnQgZGF0ZVxuICovXG5cblN0YXRlbWVudC5wcm90b3R5cGUubmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxhYmVsID0gdGhpcy5pbnN0aXR1dGlvbiArICcgU3RhdGVtZW50J1xuXG4gIGlmICh0aGlzLnRyYW5zYWN0aW9ucy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbGFiZWwgKyAnICcgKyB0aGlzLnRyYW5zYWN0aW9ucy5sYXN0KCkuZ2V0Rm9ybWF0dGVkKCdkYXRlJylcbiAgfVxuICByZXR1cm4gbGFiZWxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZW1lbnRcbiIsInZhciBwYXJzZURhdGUgPSByZXF1aXJlKCcuL2xpYi9wYXJzZS1kYXRlJylcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgdHJhbnNhY3Rpb24gZGF0ZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uRGF0ZSAoZGF0ZVN0cmluZywgZm9ybWF0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBwYXJzZWQgPSBwYXJzZURhdGUoZGF0ZVN0cmluZywgZm9ybWF0KVxuXG4gIHRoaXMueWVhciA9IHBhcnNlZC55ZWFyXG4gIHRoaXMubW9udGggPSBwYXJzZWQubW9udGhcbiAgdGhpcy5kYXRlID0gcGFyc2VkLmRhdGVcblxuICBpZiAoIXRoaXMueWVhciAmJiBvcHRpb25zLnN1Y2NlZWRpbmdEYXRlKSB7XG4gICAgdGhpcy5jYWxjdWxhdGVZZWFyKG9wdGlvbnMuc3VjY2VlZGluZ0RhdGUpXG4gIH1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7RGF0ZX0gQSBuYXRpdmUgRGF0ZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gZGF0ZVxuICovXG5cblRyYW5zYWN0aW9uRGF0ZS5wcm90b3R5cGUudG9EYXRlID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIURhdGUucGFyc2UodGhpcy55ZWFyLCB0aGlzLm1vbnRoLCB0aGlzLmRhdGUpKSByZXR1cm4gbnVsbFxuXG4gIHZhciBkYXRlID0gbmV3IERhdGUodGhpcy55ZWFyLCB0aGlzLm1vbnRoLCB0aGlzLmRhdGUpXG5cbiAgLy8gQ29udmVydCB0byBHTVQgdG8gZW5zdXJlIGNvcnJlY3QgSlNPTiB2YWx1ZXNcbiAgZGF0ZS5zZXRIb3VycyhkYXRlLmdldEhvdXJzKCkgLSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkgLyA2MClcblxuICByZXR1cm4gZGF0ZVxufVxuXG4vKipcbiAqIFVzZXMgdGhlIHN1Y2NlZWRpbmcgZGF0ZSB0byBkZXRlcm1pbmUgdGhlIHRyYW5zYWN0aW9uIHllYXJcbiAqIEByZXR1cm5zIHtOdW1iZXJ9XG4gKi9cblxuVHJhbnNhY3Rpb25EYXRlLnByb3RvdHlwZS5jYWxjdWxhdGVZZWFyID0gZnVuY3Rpb24gKHN1Y2NlZWRpbmdEYXRlKSB7XG4gIHZhciB5ZWFyID0gc3VjY2VlZGluZ0RhdGUuZ2V0RnVsbFllYXIoKVxuXG4gIC8vIERlYyAtIEphblxuICBpZiAoc3VjY2VlZGluZ0RhdGUuZ2V0TW9udGgoKSA9PT0gMCAmJiB0aGlzLm1vbnRoID09PSAxMSkgeWVhci0tXG5cbiAgdGhpcy55ZWFyID0geWVhclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uRGF0ZVxuIiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiB0cmFuc2FjdGlvbiBkYXRlc1xuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gZGF0ZXMgLSBBbiBhcnJheSBvZiBvYmplY3RzIGluIHRoZSBmb3JtIHsgeWVhcjogeWVhciwgbW9udGg6IG1vbnRoLCBkYXRlOiBkYXRlIH1cbiAqL1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbkRhdGVzIChkYXRlcykge1xuICB0aGlzLmRhdGVzID0gZGF0ZXNcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIGRhdGVzIGFyZSBjaHJvbm9sb2dpY2FsIG9yIG5vdFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cblxuVHJhbnNhY3Rpb25EYXRlcy5wcm90b3R5cGUuY2hyb25vbG9naWNhbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHVuaXEgPSB0aGlzLnVuaXEoKVxuICBpZiAodW5pcS5sZW5ndGggPCAyKSByZXR1cm4gdHJ1ZVxuXG4gIHJldHVybiB0aGlzLmNvbXBhcmUodW5pcVswXSwgdW5pcVsxXSkgPj0gMFxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtBcnJheX0gVGhlIHVuaXF1ZSBkYXRlc1xuICovXG5cblRyYW5zYWN0aW9uRGF0ZXMucHJvdG90eXBlLnVuaXEgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB1bmlxcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGRhdGUgPSB0aGlzLmRhdGVzW2ldXG4gICAgaWYgKGluVW5pcXMoZGF0ZSkpIGNvbnRpbnVlXG4gICAgdW5pcXMucHVzaChkYXRlKVxuICB9XG5cbiAgcmV0dXJuIHVuaXFzXG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIGEgZGF0ZSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgdW5pcXMgYXJyYXlcbiAgZnVuY3Rpb24gaW5VbmlxcyAoZCkge1xuICAgIHJldHVybiB1bmlxcy5zb21lKGZ1bmN0aW9uICh1KSB7XG4gICAgICByZXR1cm4gdS55ZWFyID09PSBkLnllYXIgJiYgdS5tb250aCA9PT0gZC5tb250aCAmJiB1LmRhdGUgPT09IGQuZGF0ZVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBDb21wYXJlcyB0d28gZGF0ZXMgdG8gdGVzdCBjaHJvbm9sb2d5XG4gKiBAcmV0dXJucyB7TnVtYmVyfSAwOiBhID09IGIsIDE6IGEgPiBiLCAtMTogYSA8IGJcbiAqL1xuXG5UcmFuc2FjdGlvbkRhdGVzLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgLy8gSWYgbm8geWVhciwgYW5kIGRhdGVzIGdvIGZyb20gRGVjIC0gSmFuLCBhc3N1bWUgRGVjIGRhdGUgaXMgb2xkZXJcbiAgaWYgKCghYS55ZWFyIHx8ICFiLnllYXIpICYmIGEubW9udGggPT09IDExICYmIGIubW9udGggPT09IDApIHJldHVybiAxXG5cbiAgaWYgKGEueWVhciA9PT0gYi55ZWFyKSB7XG4gICAgaWYgKGEubW9udGggPT09IGIubW9udGgpIHtcbiAgICAgIGlmIChhLmRhdGUgPiBiLmRhdGUpIHJldHVybiAtMVxuICAgICAgaWYgKGEuZGF0ZSA8IGIuZGF0ZSkgcmV0dXJuIDFcbiAgICAgIHJldHVybiAwXG4gICAgfVxuXG4gICAgaWYgKGEubW9udGggPiBiLm1vbnRoKSByZXR1cm4gLTFcbiAgICBpZiAoYS5tb250aCA8IGIubW9udGgpIHJldHVybiAxXG4gIH1cbiAgaWYgKGEueWVhciA+IGIueWVhcikgcmV0dXJuIC0xXG4gIGlmIChhLnllYXIgPCBiLnllYXIpIHJldHVybiAxXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNhY3Rpb25EYXRlc1xuIiwidmFyIG1ha2VOdW1iZXIgPSByZXF1aXJlKCcuL2xpYi9udW1iZXIvbWFrZS1udW1iZXInKVxudmFyIG1ha2VBYnNvbHV0ZU51bWJlciA9IHJlcXVpcmUoJy4vbGliL251bWJlci9tYWtlLWFic29sdXRlLW51bWJlcicpXG52YXIgVHJhbnNhY3Rpb25EYXRlID0gcmVxdWlyZSgnLi90cmFuc2FjdGlvbi1kYXRlJylcblxuLyoqXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IGRhdGEgLSBBbiBhcnJheSBvZiBhdHRyaWJ1dGUgdmFsdWVzXG4gKiBAcGFyYW0ge0FycmF5fSBjb2x1bW5zIC0gQW4gYXJyYXkgb2YgYXR0cmlidXRlIGtleXMgaW4gdGhlIG9yZGVyIHRoZXkgYXBwZWFyIGluIGBkYXRhYFxuICogQHBhcmFtIHtPYmplY3R9IG9wdGlvbnNcbiAqL1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbiAoYXR0cmlidXRlcykge1xuICB0aGlzLmF0dHJpYnV0ZXMgPSB7fVxuXG4gIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB0aGlzLnNldChrZXksIGF0dHJpYnV0ZXNba2V5XSlcblxuICBpZiAoIXRoaXMuZ2V0KCdkYXRlJykpIHRoaXMuc2V0RGF0ZSgpXG4gIGlmICghdGhpcy5nZXQoJ2Ftb3VudCcpKSB0aGlzLnNldEFtb3VudCgpXG59XG5cbi8qKlxuICogRnVuY3Rpb25zIHRoYXQgdHJhbnNmb3JtIGF0dHJpYnV0ZXMgYXMgdGhleSBhcmUgc2V0XG4gKi9cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnRyYW5zZm9ybWVycyA9IHtcbiAgYW1vdW50OiBtYWtlTnVtYmVyLFxuICBiYWxhbmNlOiBtYWtlTnVtYmVyLFxuICBwYWlkSW46IG1ha2VBYnNvbHV0ZU51bWJlcixcbiAgcGFpZE91dDogbWFrZUFic29sdXRlTnVtYmVyXG59XG5cbi8qKlxuICogRnVuY3Rpb25zIHRoYXQgZm9ybWF0IGF0dHJpYnV0ZXMgd2hlbiByZXRyaWV2ZWQgd2l0aCBgZ2V0Rm9ybWF0dGVkYFxuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5mb3JtYXR0ZXJzID0ge1xuICBkYXRlOiBmb3JtYXREYXRlXG59XG5cbi8qKlxuICogRGVmYXVsdCBvdXRwdXQgY29sdW1uc1xuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5vdXRwdXQgPSBbJ2RhdGUnLCAnYW1vdW50JywgJ2Rlc2NyaXB0aW9uJ11cblxuLyoqXG4gKiBUcmFuc2Zvcm1zIGFuZCBzZXRzIHRoZSBnaXZlbiBhdHRyaWJ1dGVcbiAqL1xuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgdmFyIHRyYW5zZm9ybWVyID0gdGhpcy50cmFuc2Zvcm1lcnNba2V5XSB8fCBmdW5jdGlvbiAodikgeyByZXR1cm4gdiB9XG4gIHRoaXMuYXR0cmlidXRlc1trZXldID0gdHJhbnNmb3JtZXIodmFsdWUpXG59XG5cbi8qKlxuICogUmV0dXJucyB0aGUgc3RvcmVkIGF0dHJpYnV0ZVxuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5nZXQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHJldHVybiB0aGlzLmF0dHJpYnV0ZXNba2V5XVxufVxuXG4vKipcbiAqIFJldHVybnMgdGhlIGZvcm1hdHRlZCBhdHRyaWJ1dGVcbiAqL1xuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuZ2V0Rm9ybWF0dGVkID0gZnVuY3Rpb24gKGtleSkge1xuICB2YXIgdmFsdWUgPSB0aGlzLmdldChrZXkpXG5cbiAgdmFyIGZvcm1hdHRlciA9IHRoaXMuZm9ybWF0dGVyc1trZXldXG4gIGlmICh0eXBlb2YgZm9ybWF0dGVyID09PSAnZnVuY3Rpb24nKSB2YWx1ZSA9IGZvcm1hdHRlcih2YWx1ZSlcblxuICByZXR1cm4gdmFsdWVcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLmlzVmFsaWQgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzLnRvQXJyYXkoKS5ldmVyeShmdW5jdGlvbiAoaSkgeyByZXR1cm4gQm9vbGVhbihpKSB9KVxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMub3V0cHV0Lm1hcCh0aGlzLmdldEZvcm1hdHRlZC5iaW5kKHRoaXMpKVxufVxuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICB2YXIgb2JqZWN0ID0ge31cblxuICBmb3IgKHZhciBpID0gdGhpcy5vdXRwdXQubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICB2YXIga2V5ID0gdGhpcy5vdXRwdXRbaV1cbiAgICBvYmplY3Rba2V5XSA9IHRoaXMuZ2V0Rm9ybWF0dGVkKGtleSlcbiAgfVxuXG4gIHJldHVybiBvYmplY3Rcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnNldERhdGUgPSBmdW5jdGlvbiAoYXR0cnMpIHtcbiAgYXR0cnMgPSBhdHRycyB8fCB7fVxuICB2YXIgZGF0ZVN0cmluZyA9IGF0dHJzLmRhdGVTdHJpbmcgfHwgdGhpcy5nZXQoJ2RhdGVTdHJpbmcnKVxuICB2YXIgZGF0ZUZvcm1hdCA9IGF0dHJzLmRhdGVGb3JtYXQgfHwgdGhpcy5nZXQoJ2RhdGVGb3JtYXQnKVxuICB2YXIgc3VjY2VlZGluZ0RhdGUgPSBhdHRycy5zdWNjZWVkaW5nRGF0ZVxuXG4gIHZhciB0cmFuc2FjdGlvbkRhdGUgPSBuZXcgVHJhbnNhY3Rpb25EYXRlKGRhdGVTdHJpbmcsIGRhdGVGb3JtYXQsIHtcbiAgICBzdWNjZWVkaW5nRGF0ZTogc3VjY2VlZGluZ0RhdGVcbiAgfSlcbiAgdGhpcy5zZXQoJ3RyYW5zYWN0aW9uRGF0ZScsIHRyYW5zYWN0aW9uRGF0ZSlcbiAgdGhpcy5zZXQoJ2RhdGUnLCB0cmFuc2FjdGlvbkRhdGUudG9EYXRlKCkpXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5zZXRBbW91bnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBwYWlkSW4gPSB0aGlzLmdldCgncGFpZEluJylcbiAgdmFyIHBhaWRPdXQgPSB0aGlzLmdldCgncGFpZE91dCcpXG5cbiAgdGhpcy5zZXQoJ2Ftb3VudCcsIGFtb3VudEZyb21BYnNvbHV0ZXMocGFpZEluLCBwYWlkT3V0KSlcbn1cblxuZnVuY3Rpb24gYW1vdW50RnJvbUFic29sdXRlcyAocGFpZEluLCBwYWlkT3V0KSB7XG4gIHJldHVybiBwYWlkSW4gPyBwYWlkSW4gOiAtcGFpZE91dFxufVxuXG5mdW5jdGlvbiBmb3JtYXREYXRlICh2YWx1ZSkge1xuICB2YXIgeXl5eSA9IHZhbHVlLmdldEZ1bGxZZWFyKClcbiAgdmFyIG1tID0gcGFkWmVyb2VzKHZhbHVlLmdldE1vbnRoKCkgKyAxKVxuICB2YXIgZGQgPSBwYWRaZXJvZXModmFsdWUuZ2V0RGF0ZSgpKVxuXG4gIHJldHVybiBbeXl5eSwgbW0sIGRkXS5qb2luKCctJylcblxuICBmdW5jdGlvbiBwYWRaZXJvZXMgKG51bWJlcikge1xuICAgIHJldHVybiBTdHJpbmcoJzAwJyArIG51bWJlcikuc2xpY2UoLTIpXG4gIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUcmFuc2FjdGlvblxuIiwidmFyIFRyYW5zYWN0aW9uRGF0ZXMgPSByZXF1aXJlKCcuL3RyYW5zYWN0aW9uLWRhdGVzJylcblxuLyoqXG4gKiBBbiBhcnJheS1saWtlIGNsYXNzIHRoYXQgcmVwcmVzZW50cyBhIGNvbGxlY3Rpb24gb2YgdHJhbnNhY3Rpb25zXG4gKiBAY29uc3RydWN0b3JcbiAqIEBwYXJhbSB7QXJyYXl9IHRyYW5zYWN0aW9ucyAtIEFuIGFycmF5IG9mIFRyYW5zYWN0aW9uIG9iamVjdHNcbiAqIEBwYXJhbSB7T2JqZWN0fSBzdGF0ZW1lbnQgLSBUaGUgcGFyZW50IHN0YXRlbWVudFxuICogQHJldHVybnMge0FycmF5fSAtIEFuIGFycmF5IG9mIHRyYW5zYWN0aW9ucyB3aXRoIGNvbnZlbmllbmNlIG1ldGhvZHNcbiAqL1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbnMgKHRyYW5zYWN0aW9ucywgc3RhdGVtZW50KSB7XG4gIFRyYW5zYWN0aW9ucy5faW5qZWN0UHJvdG90eXBlTWV0aG9kcyh0cmFuc2FjdGlvbnMpXG5cbiAgLyoqXG4gICAqIFNvbWUgZmluYW5jaWFsIGluc3RpdHV0aW9ucyBvbWl0IHRoZSB5ZWFyIHBhcnQgaW4gdGhlaXIgZGF0ZSBjZWxscy5cbiAgICogVGhpcyB3b3JrYXJvdW5kIGNhbGN1bGF0ZXMgdGhlIHllYXIgZm9yIGVhY2ggdHJhbnNhY3Rpb24gYWZmZWN0ZWQuXG4gICAqL1xuXG4gIGlmICghL1l7Mix9Ly50ZXN0KHN0YXRlbWVudC5kYXRlRm9ybWF0KSkge1xuICAgIGlmICghdHJhbnNhY3Rpb25zLmNocm9ub2xvZ2ljYWwoKSkgdHJhbnNhY3Rpb25zID0gdHJhbnNhY3Rpb25zLnJldmVyc2UoKVxuXG4gICAgdmFyIHN1Y2NlZWRpbmdEYXRlID0gc3RhdGVtZW50LmRhdGVcbiAgICBmb3IgKHZhciBpID0gdHJhbnNhY3Rpb25zLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgICB2YXIgdHJhbnNhY3Rpb24gPSB0cmFuc2FjdGlvbnNbaV1cbiAgICAgIHRyYW5zYWN0aW9uLnNldERhdGUoeyBzdWNjZWVkaW5nRGF0ZTogc3VjY2VlZGluZ0RhdGUgfSlcbiAgICAgIHN1Y2NlZWRpbmdEYXRlID0gdHJhbnNhY3Rpb24uZ2V0KCdkYXRlJylcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJhbnNhY3Rpb25zXG59XG5cblRyYW5zYWN0aW9ucy5wcm90b3R5cGUuY2hyb25vbG9naWNhbCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIGRhdGVzLmNhbGwodGhpcykuY2hyb25vbG9naWNhbCgpXG59XG5cbmZ1bmN0aW9uIGRhdGVzICgpIHtcbiAgdmFyIGRhdGVzID0gdGhpcy5tYXAoZnVuY3Rpb24gKHRyYW5zYWN0aW9uKSB7XG4gICAgcmV0dXJuIHRyYW5zYWN0aW9uLmdldCgndHJhbnNhY3Rpb25EYXRlJylcbiAgfSlcbiAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbkRhdGVzKGRhdGVzKVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtUcmFuc2FjdGlvbn0gVGhlIGZpcnN0IHRyYW5zYWN0aW9uIGluIHRoZSBjb2xsZWN0aW9uXG4gKi9cblxuVHJhbnNhY3Rpb25zLnByb3RvdHlwZS5maXJzdCA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXNbMF1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7VHJhbnNhY3Rpb259IFRoZSBsYXN0IHRyYW5zYWN0aW9uIGluIHRoZSBjb2xsZWN0aW9uXG4gKi9cblxuVHJhbnNhY3Rpb25zLnByb3RvdHlwZS5sYXN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpc1t0aGlzLmxlbmd0aCAtIDFdXG59XG5cbi8qKlxuICogQHJldHVybnMge0FycmF5fSBBbiBhcnJheSBvZiBmb3JtYXR0ZWQgdHJhbnNhY3Rpb24gYXR0cmlidXRlIGFycmF5c1xuICovXG5cblRyYW5zYWN0aW9ucy5wcm90b3R5cGUudG9BcnJheSA9IGZ1bmN0aW9uICgpIHtcbiAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uICh0cmFuc2FjdGlvbikgeyByZXR1cm4gdHJhbnNhY3Rpb24udG9BcnJheSgpIH0pXG59XG5cbi8qKlxuICogQHJldHVybnMge0FycmF5fSBBbiBhcnJheSBvZiBmb3JtYXR0ZWQgdHJhbnNhY3Rpb24gb2JqZWN0c1xuICovXG5cblRyYW5zYWN0aW9ucy5wcm90b3R5cGUudG9KU09OID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpcy5tYXAoZnVuY3Rpb24gKHRyYW5zYWN0aW9uKSB7IHJldHVybiB0cmFuc2FjdGlvbi50b0pTT04oKSB9KVxufVxuXG4vKipcbiAqIEFkZHMgdGhlIHByb3RvdHlwZSBtZXRob2RzIHRvIHRyYW5zYWN0aW9ucyBhcnJheSB0byBhcHBlYXIgbGlrZSBpbmhlcml0YW5jZVxuICogQHByaXZhdGVcbiAqL1xuXG5UcmFuc2FjdGlvbnMuX2luamVjdFByb3RvdHlwZU1ldGhvZHMgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgZm9yICh2YXIgbWV0aG9kIGluIHRoaXMucHJvdG90eXBlKSB7XG4gICAgaWYgKHRoaXMucHJvdG90eXBlLmhhc093blByb3BlcnR5KG1ldGhvZCkpIHtcbiAgICAgIGFycmF5W21ldGhvZF0gPSB0aGlzLnByb3RvdHlwZVttZXRob2RdXG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNhY3Rpb25zXG4iXX0=
