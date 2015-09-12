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
  for (var key in attributes) {
    if (attributes.hasOwnProperty(key)) this[key] = result(attributes[key])
  }

  // Convert table to array of transactions
  var transactions = tableToArray(this.table, {
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

},{"./transaction-dates":14}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJpbmRleC5qcyIsImxpYi9jc3YvYXJyYXktdG8tZHN2LmpzIiwibGliL2Nzdi9pbmRleC5qcyIsImxpYi9kb3dubG9hZC5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL2xpYi9udW1iZXIvbWFrZS1hYnNvbHV0ZS1udW1iZXIuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9saWIvbnVtYmVyL21ha2UtbnVtYmVyLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3BhcnNlLWRhdGUuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9saWIvcmVzdWx0LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3RhYmxlLXRvLWFycmF5LmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvbGliL3dlbGQuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQtZGVmaW5pdGlvbnMuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci9zdGF0ZW1lbnQuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci90cmFuc2FjdGlvbi1kYXRlLmpzIiwibm9kZV9tb2R1bGVzL0BidW5zbi9ib2lsZXIvdHJhbnNhY3Rpb24tZGF0ZXMuanMiLCJub2RlX21vZHVsZXMvQGJ1bnNuL2JvaWxlci90cmFuc2FjdGlvbi5qcyIsIm5vZGVfbW9kdWxlcy9AYnVuc24vYm9pbGVyL3RyYW5zYWN0aW9ucy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1pBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBOztBQ0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNkQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNySkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBkZWZpbml0aW9ucyA9IHJlcXVpcmUoJ0BidW5zbi9ib2lsZXIvc3RhdGVtZW50LWRlZmluaXRpb25zJylcbnZhciBTdGF0ZW1lbnQgPSByZXF1aXJlKCdAYnVuc24vYm9pbGVyL3N0YXRlbWVudCcpXG52YXIgQ1NWID0gcmVxdWlyZSgnLi9saWIvY3N2JylcbnZhciBkb3dubG9hZCA9IHJlcXVpcmUoJy4vbGliL2Rvd25sb2FkJylcblxudmFyIGRlZmluaXRpb24gPSBkZWZpbml0aW9ucy5maW5kQnkoJ2hvc3QnLCB3aW5kb3cubG9jYXRpb24uaG9zdClcbnZhciBzdGF0ZW1lbnQgPSBuZXcgU3RhdGVtZW50KGRlZmluaXRpb24pXG52YXIga2V5cyA9IFsnZGF0ZScsICd0eXBlJywgJ2Rlc2NyaXB0aW9uJywgJ2Ftb3VudCddXG52YXIgY3N2ID0gQ1NWLnN0cmluZ2lmeShzdGF0ZW1lbnQudHJhbnNhY3Rpb25zLnRvQXJyYXkoa2V5cykpXG52YXIgYmxvYiA9IG5ldyBCbG9iKFtjc3ZdLCB7IHR5cGU6ICd0ZXh0L2NzdicgfSlcblxuZG93bmxvYWQoVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKSwgeyBmaWxlbmFtZTogc3RhdGVtZW50Lm5hbWUoKSB9KVxuIiwiLyoqXG4gKiBDb252ZXJ0cyBhIHR3by1kaW1lbnNpb25hbCBhcnJheSB0byBhIGRlbGltaXRlci1zZXBhcmF0ZWQgc3RyaW5nXG4gKi9cblxuZnVuY3Rpb24gYXJyYXlUb0RTViAoYXJyYXksIGRlbGltaXRlcikge1xuICByZXR1cm4gYXJyYXkubWFwKHByb2Nlc3NSb3cpLmpvaW4oJ1xcbicpXG5cbiAgZnVuY3Rpb24gcHJvY2Vzc1JvdyAoYXJyYXkpIHtcbiAgICByZXR1cm4gYXJyYXkubWFwKHByb2Nlc3NJdGVtKS5qb2luKGRlbGltaXRlcilcbiAgfVxuXG4gIGZ1bmN0aW9uIHByb2Nlc3NJdGVtIChpdGVtKSB7XG4gICAgaXRlbSA9IFN0cmluZyhpdGVtKVxuXG4gICAgdmFyIGhhc0RvdWJsZVF1b3RlID0gL1wiLy50ZXN0KGl0ZW0pXG4gICAgdmFyIGhhc0xpbmVCcmVhayA9IC9bXFxuXFxyXS8udGVzdChpdGVtKVxuICAgIHZhciBoYXNEZWxpbWl0ZXIgPSBuZXcgUmVnRXhwKGRlbGltaXRlcikudGVzdChpdGVtKVxuXG4gICAgaWYgKGhhc0RvdWJsZVF1b3RlKSBpdGVtID0gZXNjYXBlRG91YmxlUXVvdGVzKGl0ZW0pXG4gICAgaWYgKGhhc0RvdWJsZVF1b3RlIHx8IGhhc0xpbmVCcmVhayB8fCBoYXNEZWxpbWl0ZXIpIHtcbiAgICAgIGl0ZW0gPSB3cmFwSW5Eb3VibGVRdW90ZXMoaXRlbSlcbiAgICB9XG5cbiAgICByZXR1cm4gaXRlbVxuICB9XG5cbiAgZnVuY3Rpb24gZXNjYXBlRG91YmxlUXVvdGVzIChpdGVtKSB7XG4gICAgcmV0dXJuIGl0ZW0ucmVwbGFjZSgvXCIvZywgJ1wiXCInKVxuICB9XG5cbiAgZnVuY3Rpb24gd3JhcEluRG91YmxlUXVvdGVzIChpdGVtKSB7XG4gICAgcmV0dXJuICdcIicgKyBpdGVtICsgJ1wiJ1xuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gYXJyYXlUb0RTVlxuIiwidmFyIGFycmF5VG9EU1YgPSByZXF1aXJlKCcuL2FycmF5LXRvLWRzdicpXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICBzdHJpbmdpZnk6IGZ1bmN0aW9uIChhcnJheSkgeyByZXR1cm4gYXJyYXlUb0RTVihhcnJheSwgJywnKSB9XG59XG4iLCJmdW5jdGlvbiBkb3dubG9hZCAodXJsLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG5cbiAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdhJylcbiAgYS5ocmVmID0gdXJsXG4gIGEuZG93bmxvYWQgPSBvcHRpb25zLmZpbGVuYW1lXG5cbiAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKVxuICBhLmNsaWNrKClcbiAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChhKVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGRvd25sb2FkXG4iLCJ2YXIgbWFrZU51bWJlciA9IHJlcXVpcmUoJy4vbWFrZS1udW1iZXInKVxuXG4vKipcbiAqIFJlbW92ZXMgYW55IG5vbi1udW1lcmljYWwgc3ltYm9scyBhbmQgcmV0dXJucyB0aGUgYWJzb2x1dGUgdmFsdWUuXG4gKiBVc2VmdWwgZm9yIGNvbnZlcnRpbmcgbnVtYmVycyBmb3JtYXR0ZWQgYXMgY3VycmVuY3kuXG4gKiBlLmcuIFwiLcKjMyw0MjYuNzJcIiBjb252ZXJ0cyB0byAzNDI2LjcyXG4gKiBAcmV0dXJucyB7TnVtYmVyfVxuICovXG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gbWFrZUFic29sdXRlTnVtYmVyICh2YWx1ZSkge1xuICB2YXIgbnVtYmVyID0gbWFrZU51bWJlcih2YWx1ZSlcbiAgaWYgKG51bWJlciA9PSBudWxsKSByZXR1cm4gbnVsbFxuICByZXR1cm4gTWF0aC5hYnMobnVtYmVyKVxufVxuIiwiLyoqXG4gKiBSZW1vdmVzIGFueSBub24tbnVtZXJpY2FsIHN5bWJvbHMuXG4gKiBVc2VmdWwgZm9yIGNvbnZlcnRpbmcgbnVtYmVycyBmb3JtYXR0ZWQgYXMgY3VycmVuY3kuXG4gKiBlLmcuIFwiLcKjMyw0MjYuNzJcIiBjb252ZXJ0cyB0byAtMzQyNi43MlxuICogQHJldHVybnMge051bWJlcn1cbiAqL1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1ha2VOdW1iZXIgKHZhbHVlKSB7XG4gIHZhciBudW1iZXIgPSBOdW1iZXIoU3RyaW5nKHZhbHVlKS5yZXBsYWNlKC9bXlxcZFxcLi1dL2csICcnKSlcbiAgcmV0dXJuIG51bWJlciA/IG51bWJlciA6IG51bGxcbn1cbiIsInZhciBtb250aEZvcm1hdHMgPSB7XG4gIE1NTTogWydKYW4nLCAnRmViJywgJ01hcicsICdBcHInLCAnTWF5JywgJ0p1bicsICdKdWwnLCAnQXVnJywgJ1NlcCcsICdPY3QnLCAnTm92JywgJ0RlYyddLFxuICBNTU1NOiBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXVxufVxuXG5mdW5jdGlvbiBwYXJzZURhdGUgKGRhdGVTdHJpbmcsIGZvcm1hdCkge1xuICB2YXIgZm9ybWF0UGFydHMgPSBmb3JtYXQuc3BsaXQoL1teRE1ZXSsvKVxuICB2YXIgZGF0ZVJlZ2V4ID0gUmVnRXhwKGZvcm1hdC5yZXBsYWNlKC9ERD8vLCAnKFxcXFxkXFxcXGQ/KScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL017Myw0fS8sICcoXFxcXHd7Myx9KScpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL01NPy8sICcoXFxcXGRcXFxcZD8pJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAucmVwbGFjZSgvWXsyLDR9LywgJyhcXFxcZHsyLDR9KScpKVxuICB2YXIgZGF0ZVBhcnRzID0gZGF0ZVN0cmluZy5tYXRjaChkYXRlUmVnZXgpXG5cbiAgaWYgKGRhdGVQYXJ0cykge1xuICAgIGRhdGVQYXJ0cyA9IGRhdGVQYXJ0cy5zcGxpY2UoMSlcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoJ0Nhbm5vdCBwYXJzZTogYCcgKyBkYXRlU3RyaW5nICsgJ2Agd2l0aCBmb3JtYXQ6IGAnICsgZm9ybWF0ICsgJ2AnKVxuICB9XG5cbiAgZnVuY3Rpb24gZ2V0UGFydEluZGV4IChyZWdleCkge1xuICAgIGZvciAodmFyIGkgPSAwOyBpIDwgZm9ybWF0UGFydHMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmIChyZWdleC50ZXN0KGZvcm1hdFBhcnRzW2ldKSkgcmV0dXJuIGlcbiAgICB9XG4gIH1cblxuICB2YXIgZGF0ZSA9IGRhdGVQYXJ0c1tnZXRQYXJ0SW5kZXgoL0QvKV1cblxuICAvLyBHZXQgbW9udGggcGFydCBhbmQgY29udmVydCB0byBudW1iZXIgY29tcGF0aWJsZSB3aXRoIGBEYXRlYFxuXG4gIHZhciBtb250aCA9IChmdW5jdGlvbiBnZXRNb250aCAoKSB7XG4gICAgdmFyIGkgPSBnZXRQYXJ0SW5kZXgoL00vKVxuICAgIHZhciBtb250aEZvcm1hdCA9IGZvcm1hdFBhcnRzW2ldXG4gICAgdmFyIGRhdGVQYXJ0ID0gZGF0ZVBhcnRzW2ldXG4gICAgdmFyIG1vbnRoXG5cbiAgICBpZiAobW9udGhGb3JtYXQubGVuZ3RoID4gMikge1xuICAgICAgbW9udGggPSBtb250aEZvcm1hdHNbbW9udGhGb3JtYXRdLmluZGV4T2YoZGF0ZVBhcnQpXG4gICAgfSBlbHNlIHtcbiAgICAgIG1vbnRoID0gTnVtYmVyKGRhdGVQYXJ0KSAtIDFcbiAgICB9XG5cbiAgICByZXR1cm4gbW9udGhcbiAgfSkoKVxuXG4gIC8vIEdldCB5ZWFyIHBhcnQgYW5kIGNvbnZlcnQgdG8gbnVtYmVyIGNvbXBhdGlibGUgd2l0aCBgRGF0ZWBcblxuICB2YXIgeWVhciA9IChmdW5jdGlvbiBnZXRZZWFyICgpIHtcbiAgICB2YXIgeWVhciA9IGRhdGVQYXJ0c1tnZXRQYXJ0SW5kZXgoL1kvKV1cblxuICAgIGlmICh5ZWFyICYmICh5ZWFyLmxlbmd0aCA9PT0gMikpIHllYXIgPSAnMjAnICsgeWVhclxuXG4gICAgcmV0dXJuIHllYXJcbiAgfSkoKVxuXG4gIHJldHVybiB7IHllYXI6IHllYXIsIG1vbnRoOiBtb250aCwgZGF0ZTogZGF0ZSB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gcGFyc2VEYXRlXG4iLCJtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChvYmplY3QpIHtcbiAgcmV0dXJuICh0eXBlb2Ygb2JqZWN0ID09PSAnZnVuY3Rpb24nKSA/IG9iamVjdC5jYWxsKG9iamVjdCkgOiBvYmplY3Rcbn1cbiIsIi8qKlxuICogQ29udmVydHMgYSB0YWJsZSBub2RlIHRvIGEgMkQgYXJyYXlcbiAqL1xuXG5mdW5jdGlvbiB0YWJsZVRvQXJyYXkgKHRhYmxlLCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBwcm9jZXNzUm93ID0gb3B0aW9ucy5wcm9jZXNzUm93IHx8IGlkXG4gIHZhciBwcm9jZXNzQ2VsbCA9IG9wdGlvbnMucHJvY2Vzc0NlbGwgfHwgaWRcblxuICByZXR1cm4gbWFwKHRhYmxlLnF1ZXJ5U2VsZWN0b3JBbGwoJ3Rib2R5IHRyJyksIGZ1bmN0aW9uICh0ciwgcm93SW5kZXgsIHJvd3MpIHtcbiAgICB2YXIgcm93ID0gbWFwKHRyLmNlbGxzLCBmdW5jdGlvbiAobm9kZSwgY2VsbEluZGV4LCBjZWxscykge1xuICAgICAgcmV0dXJuIHByb2Nlc3NDZWxsKG5vZGVUZXh0KG5vZGUpLCBjZWxsSW5kZXgsIGNlbGxzLCBub2RlKVxuICAgIH0pXG5cbiAgICByZXR1cm4gcHJvY2Vzc1Jvdyhyb3csIHJvd0luZGV4LCByb3dzLCB0cilcbiAgfSlcbn1cblxuLyoqXG4gKiBTcXVhc2hlZCBhbmQgdHJpbW1lZCBub2RlIHRleHQgY29udGVudFxuICovXG5cbmZ1bmN0aW9uIG5vZGVUZXh0IChub2RlKSB7XG4gIHJldHVybiBzcXVhc2hXaGl0ZXNwYWNlKG5vZGUudGV4dENvbnRlbnQpXG5cbiAgZnVuY3Rpb24gc3F1YXNoV2hpdGVzcGFjZSAoc3RyaW5nKSB7XG4gICAgcmV0dXJuIHN0cmluZy5yZXBsYWNlKC9cXHN7Mix9L2csICcgJykudHJpbSgpXG4gIH1cbn1cblxuLyoqXG4gKiBtYXAgZm9yIE5vZGVMaXN0c1xuICovXG5cbmZ1bmN0aW9uIG1hcCAoYXJyYXksIGVudW1lcmF0b3IpIHtcbiAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5tYXAuY2FsbChhcnJheSwgZW51bWVyYXRvcilcbn1cblxuLyoqXG4gKiBJZGVudGl0eSBmdW5jdGlvblxuICogQHJldHVybnMgSXRzIGlucHV0IVxuICovXG5cbmZ1bmN0aW9uIGlkICh4KSB7IHJldHVybiB4IH1cblxubW9kdWxlLmV4cG9ydHMgPSB0YWJsZVRvQXJyYXlcbiIsIi8qKlxuICogTWFwcyBrZXlzIHRvIHZhbHVlc1xuICogQHBhcmFtIHtBcnJheX0ga2V5cyAtIEFuIGFycmF5IG9mIGtleXNcbiAqIEBwYXJhbSB7QXJyYXl9IHZhbHVlcyAtIEFuIGFycmF5IG9mIHJhdyB2YWx1ZXNcbiAqIEByZXR1cm5zIHtPYmplY3R9XG4gKi9cblxuZnVuY3Rpb24gd2VsZCAoa2V5cywgdmFsdWVzKSB7XG4gIHZhciBvYmplY3QgPSB7fVxuICBmb3IgKHZhciBpID0ga2V5cy5sZW5ndGggLSAxOyBpID49IDA7IGktLSkgb2JqZWN0W2tleXNbaV1dID0gdmFsdWVzW2ldXG4gIHJldHVybiBvYmplY3Rcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB3ZWxkXG4iLCJ2YXIgc3RhdGVtZW50RGVmaW5pdGlvbnMgPSBbXG4gIHtcbiAgICBpbnN0aXR1dGlvbjogJ0hTQkMnLFxuICAgIGhvc3Q6ICd3d3cuc2Fhcy5oc2JjLmNvLnVrJyxcbiAgICBjb2x1bW5zOiBbJ2RhdGUnLCAndHlwZScsICdkZXNjcmlwdGlvbicsICdwYWlkT3V0JywgJ3BhaWRJbicsICdiYWxhbmNlJ10sXG4gICAgZGF0ZUZvcm1hdDogJ0REIE1NTScsXG4gICAgdGFibGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd0YWJsZVtzdW1tYXJ5PVwiVGhpcyB0YWJsZSBjb250YWlucyBhIHN0YXRlbWVudCBvZiB5b3VyIGFjY291bnRcIl0nKVxuICAgIH0sXG4gICAgZGF0ZTogZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIHNlbGVjdG9ycyA9IFtcbiAgICAgICAgLy8gRm9yIFByZXZpb3VzIFN0YXRlbWVudHNcbiAgICAgICAgJyNjb250ZW50ID4gZGl2LmNvbnRhaW5lck1haW4gZGl2LmhzYmNUZXh0UmlnaHQnLFxuXG4gICAgICAgIC8vIEZvciBSZWNlbnQgVHJhbnNhY3Rpb25zXG4gICAgICAgICcjZGV0YWlsLXN3aXRjaCA+IHRhYmxlID4gdGJvZHkgPiB0cjpudGgtY2hpbGQoMykgPiB0ZC5leHRUYWJsZUNvbHVtbjInXG4gICAgICBdXG5cbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc2VsZWN0b3JzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIHZhciBkYXRlU3RyaW5nID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcihzZWxlY3RvcnNbaV0pLnRleHRDb250ZW50XG4gICAgICAgIGlmIChEYXRlLnBhcnNlKGRhdGVTdHJpbmcpKSByZXR1cm4gbmV3IERhdGUoZGF0ZVN0cmluZylcbiAgICAgIH1cbiAgICB9XG4gIH0sXG4gIHtcbiAgICBpbnN0aXR1dGlvbjogJ05hdFdlc3QnLFxuICAgIGhvc3Q6ICd3d3cubndvbGIuY29tJyxcbiAgICBjb2x1bW5zOiBbJ2RhdGUnLCAndHlwZScsICdkZXNjcmlwdGlvbicsICdwYWlkSW4nLCAncGFpZE91dCcsICdiYWxhbmNlJ10sXG4gICAgZGF0ZUZvcm1hdDogJ0QgTU1NIFlZWVknLFxuICAgIHRhYmxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICByZXR1cm4gd2luZG93LmZyYW1lcy5jdGwwMF9zZWNmcmFtZS5jb250ZW50RG9jdW1lbnQucXVlcnlTZWxlY3RvcignLkl0ZW1UYWJsZScpXG4gICAgfVxuICB9XG5dXG5cbnN0YXRlbWVudERlZmluaXRpb25zLmZpbmRCeSA9IGZ1bmN0aW9uIChrZXksIHZhbHVlKSB7XG4gIGZvciAodmFyIGkgPSB0aGlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGRlZmluaXRpb24gPSB0aGlzW2ldXG4gICAgaWYgKGRlZmluaXRpb25ba2V5XSA9PT0gdmFsdWUpIHJldHVybiBkZWZpbml0aW9uXG4gIH1cbiAgcmV0dXJuIG51bGxcbn1cblxuc3RhdGVtZW50RGVmaW5pdGlvbnMuZmluZEJ5SG9zdCA9IGZ1bmN0aW9uIChob3N0KSB7XG4gIHJldHVybiB0aGlzLmZpbmRCeSgnaG9zdCcsIGhvc3QpXG59XG5cbm1vZHVsZS5leHBvcnRzID0gc3RhdGVtZW50RGVmaW5pdGlvbnNcbiIsInZhciByZXN1bHQgPSByZXF1aXJlKCcuL2xpYi9yZXN1bHQnKVxudmFyIHRhYmxlVG9BcnJheSA9IHJlcXVpcmUoJy4vbGliL3RhYmxlLXRvLWFycmF5JylcbnZhciB3ZWxkID0gcmVxdWlyZSgnLi9saWIvd2VsZCcpXG52YXIgVHJhbnNhY3Rpb24gPSByZXF1aXJlKCcuL3RyYW5zYWN0aW9uJylcbnZhciBUcmFuc2FjdGlvbnMgPSByZXF1aXJlKCcuL3RyYW5zYWN0aW9ucycpXG5cbi8qKlxuICogUmVwcmVzZW50cyBhIFN0YXRlbWVudFxuICogQGNvbnN0cnVjdG9yXG4gKiBAcGFyYW0ge09iamVjdH0gYXR0cmlidXRlcyAtIFVzdWFsbHkgYSBzdGF0ZW1lbnQgZGVmaW5pdGlvblxuICovXG5cbmZ1bmN0aW9uIFN0YXRlbWVudCAoYXR0cmlidXRlcykge1xuICBmb3IgKHZhciBrZXkgaW4gYXR0cmlidXRlcykge1xuICAgIGlmIChhdHRyaWJ1dGVzLmhhc093blByb3BlcnR5KGtleSkpIHRoaXNba2V5XSA9IHJlc3VsdChhdHRyaWJ1dGVzW2tleV0pXG4gIH1cblxuICAvLyBDb252ZXJ0IHRhYmxlIHRvIGFycmF5IG9mIHRyYW5zYWN0aW9uc1xuICB2YXIgdHJhbnNhY3Rpb25zID0gdGFibGVUb0FycmF5KHRoaXMudGFibGUsIHtcbiAgICBwcm9jZXNzUm93OiBmdW5jdGlvbiAocm93KSB7XG4gICAgICByZXR1cm4gdGhpcy5jcmVhdGVUcmFuc2FjdGlvbih3ZWxkKHRoaXMuY29sdW1ucywgcm93KSlcbiAgICB9LmJpbmQodGhpcylcbiAgfSlcbiAgdGhpcy50cmFuc2FjdGlvbnMgPSBuZXcgVHJhbnNhY3Rpb25zKHRyYW5zYWN0aW9ucywgdGhpcylcbn1cblxuLyoqXG4gKiBDcmVhdGVzIGEgdHJhbnNhY3Rpb24gZnJvbSBhbiBvYmplY3Qgb2YgYXR0cmlidXRlcy5cbiAqIEByZXR1cm5zIHtUcmFuc2FjdGlvbn1cbiAqL1xuXG5TdGF0ZW1lbnQucHJvdG90eXBlLmNyZWF0ZVRyYW5zYWN0aW9uID0gZnVuY3Rpb24gKGF0dHJpYnV0ZXMpIHtcbiAgYXR0cmlidXRlcy5kYXRlU3RyaW5nID0gYXR0cmlidXRlcy5kYXRlXG4gIGF0dHJpYnV0ZXMuZGF0ZUZvcm1hdCA9IHRoaXMuZGF0ZUZvcm1hdFxuICBkZWxldGUgYXR0cmlidXRlcy5kYXRlXG4gIHJldHVybiBuZXcgVHJhbnNhY3Rpb24oYXR0cmlidXRlcylcbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7U3RyaW5nfSBUaGUgbmFtZSBvZiB0aGUgc3RhdGVtZW50IGJhc2VkIG9uIHRoZSBzdGF0ZW1lbnQgZGF0ZVxuICovXG5cblN0YXRlbWVudC5wcm90b3R5cGUubmFtZSA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIGxhYmVsID0gdGhpcy5pbnN0aXR1dGlvbiArICcgU3RhdGVtZW50J1xuXG4gIGlmICh0aGlzLnRyYW5zYWN0aW9ucy5sZW5ndGgpIHtcbiAgICByZXR1cm4gbGFiZWwgKyAnICcgKyB0aGlzLnRyYW5zYWN0aW9ucy5sYXN0KCkuZ2V0Rm9ybWF0dGVkKCdkYXRlJylcbiAgfVxuICByZXR1cm4gbGFiZWxcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTdGF0ZW1lbnRcbiIsInZhciBwYXJzZURhdGUgPSByZXF1aXJlKCcuL2xpYi9wYXJzZS1kYXRlJylcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgdHJhbnNhY3Rpb24gZGF0ZVxuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICovXG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9uRGF0ZSAoZGF0ZVN0cmluZywgZm9ybWF0LCBvcHRpb25zKSB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9XG4gIHZhciBwYXJzZWQgPSBwYXJzZURhdGUoZGF0ZVN0cmluZywgZm9ybWF0KVxuXG4gIHRoaXMueWVhciA9IHBhcnNlZC55ZWFyXG4gIHRoaXMubW9udGggPSBwYXJzZWQubW9udGhcbiAgdGhpcy5kYXRlID0gcGFyc2VkLmRhdGVcblxuICBpZiAoIXRoaXMueWVhciAmJiBvcHRpb25zLnN1Y2NlZWRpbmdEYXRlKSB7XG4gICAgdGhpcy55ZWFyID0gdGhpcy5jYWxjdWxhdGVZZWFyKG9wdGlvbnMuc3VjY2VlZGluZ0RhdGUpXG4gIH1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7RGF0ZX0gQSBuYXRpdmUgRGF0ZSByZXByZXNlbnRhdGlvbiBvZiB0aGUgdHJhbnNhY3Rpb24gZGF0ZVxuICovXG5cblRyYW5zYWN0aW9uRGF0ZS5wcm90b3R5cGUudG9EYXRlID0gZnVuY3Rpb24gKCkge1xuICBpZiAoIURhdGUucGFyc2UodGhpcy55ZWFyLCB0aGlzLm1vbnRoLCB0aGlzLmRhdGUpKSByZXR1cm4gbnVsbFxuICByZXR1cm4gbmV3IERhdGUodGhpcy55ZWFyLCB0aGlzLm1vbnRoLCB0aGlzLmRhdGUpXG59XG5cbi8qKlxuICogVXNlcyB0aGUgc3VjY2VlZGluZyBkYXRlIHRvIGRldGVybWluZSB0aGUgdHJhbnNhY3Rpb24geWVhclxuICogQHJldHVybnMge051bWJlcn1cbiAqL1xuXG5UcmFuc2FjdGlvbkRhdGUucHJvdG90eXBlLmNhbGN1bGF0ZVllYXIgPSBmdW5jdGlvbiAoc3VjY2VlZGluZ0RhdGUpIHtcbiAgdmFyIHllYXIgPSBzdWNjZWVkaW5nRGF0ZS5nZXRGdWxsWWVhcigpXG5cbiAgLy8gRGVjIC0gSmFuXG4gIGlmIChzdWNjZWVkaW5nRGF0ZS5nZXRNb250aCgpID09PSAwICYmIHRoaXMubW9udGggPT09IDExKSB5ZWFyLS1cblxuICByZXR1cm4geWVhclxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uRGF0ZVxuIiwiLyoqXG4gKiBSZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiB0cmFuc2FjdGlvbiBkYXRlc1xuICogQGNvbnN0cnVjdG9yXG4gKiBAcHJpdmF0ZVxuICogQHBhcmFtIHtBcnJheX0gZGF0ZXMgLSBBbiBhcnJheSBvZiBvYmplY3RzIGluIHRoZSBmb3JtIHsgeWVhcjogeWVhciwgbW9udGg6IG1vbnRoLCBkYXRlOiBkYXRlIH1cbiAqL1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbkRhdGVzIChkYXRlcykge1xuICB0aGlzLmRhdGVzID0gZGF0ZXNcbn1cblxuLyoqXG4gKiBEZXRlcm1pbmVzIHdoZXRoZXIgdGhlIGRhdGVzIGFyZSBjaHJvbm9sb2dpY2FsIG9yIG5vdFxuICogQHJldHVybnMge0Jvb2xlYW59XG4gKi9cblxuVHJhbnNhY3Rpb25EYXRlcy5wcm90b3R5cGUuY2hyb25vbG9naWNhbCA9IGZ1bmN0aW9uICgpIHtcbiAgdmFyIHVuaXEgPSB0aGlzLnVuaXEoKVxuICBpZiAodW5pcS5sZW5ndGggPCAyKSByZXR1cm4gdHJ1ZVxuXG4gIHJldHVybiB0aGlzLmNvbXBhcmUodW5pcVswXSwgdW5pcVsxXSkgPj0gMFxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtBcnJheX0gVGhlIHVuaXF1ZSBkYXRlc1xuICovXG5cblRyYW5zYWN0aW9uRGF0ZXMucHJvdG90eXBlLnVuaXEgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciB1bmlxcyA9IFtdXG5cbiAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmRhdGVzLmxlbmd0aDsgaSsrKSB7XG4gICAgdmFyIGRhdGUgPSB0aGlzLmRhdGVzW2ldXG4gICAgaWYgKGluVW5pcXMoZGF0ZSkpIGNvbnRpbnVlXG4gICAgdW5pcXMucHVzaChkYXRlKVxuICB9XG5cbiAgcmV0dXJuIHVuaXFzXG5cbiAgLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIGEgZGF0ZSBhbHJlYWR5IGV4aXN0cyBpbiB0aGUgdW5pcXMgYXJyYXlcbiAgZnVuY3Rpb24gaW5VbmlxcyAoZCkge1xuICAgIHJldHVybiB1bmlxcy5zb21lKGZ1bmN0aW9uICh1KSB7XG4gICAgICByZXR1cm4gdS55ZWFyID09PSBkLnllYXIgJiYgdS5tb250aCA9PT0gZC5tb250aCAmJiB1LmRhdGUgPT09IGQuZGF0ZVxuICAgIH0pXG4gIH1cbn1cblxuLyoqXG4gKiBDb21wYXJlcyB0d28gZGF0ZXMgdG8gdGVzdCBjaHJvbm9sb2d5XG4gKiBAcmV0dXJucyB7TnVtYmVyfSAwOiBhID09IGIsIDE6IGEgPiBiLCAtMTogYSA8IGJcbiAqL1xuXG5UcmFuc2FjdGlvbkRhdGVzLnByb3RvdHlwZS5jb21wYXJlID0gZnVuY3Rpb24gKGEsIGIpIHtcbiAgLy8gSWYgbm8geWVhciwgYW5kIGRhdGVzIGdvIGZyb20gRGVjIC0gSmFuLCBhc3N1bWUgRGVjIGRhdGUgaXMgb2xkZXJcbiAgaWYgKCghYS55ZWFyIHx8ICFiLnllYXIpICYmIGEubW9udGggPT09IDExICYmIGIubW9udGggPT09IDApIHJldHVybiAxXG5cbiAgaWYgKGEueWVhciA9PT0gYi55ZWFyKSB7XG4gICAgaWYgKGEubW9udGggPT09IGIubW9udGgpIHtcbiAgICAgIGlmIChhLmRhdGUgPiBiLmRhdGUpIHJldHVybiAtMVxuICAgICAgaWYgKGEuZGF0ZSA8IGIuZGF0ZSkgcmV0dXJuIDFcbiAgICAgIHJldHVybiAwXG4gICAgfVxuXG4gICAgaWYgKGEubW9udGggPiBiLm1vbnRoKSByZXR1cm4gLTFcbiAgICBpZiAoYS5tb250aCA8IGIubW9udGgpIHJldHVybiAxXG4gIH1cbiAgaWYgKGEueWVhciA+IGIueWVhcikgcmV0dXJuIC0xXG4gIGlmIChhLnllYXIgPCBiLnllYXIpIHJldHVybiAxXG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNhY3Rpb25EYXRlc1xuIiwidmFyIG1ha2VOdW1iZXIgPSByZXF1aXJlKCcuL2xpYi9udW1iZXIvbWFrZS1udW1iZXInKVxudmFyIG1ha2VBYnNvbHV0ZU51bWJlciA9IHJlcXVpcmUoJy4vbGliL251bWJlci9tYWtlLWFic29sdXRlLW51bWJlcicpXG52YXIgVHJhbnNhY3Rpb25EYXRlID0gcmVxdWlyZSgnLi90cmFuc2FjdGlvbi1kYXRlJylcblxuLyoqXG4gKiBSZXByZXNlbnRzIGEgc2luZ2xlIHRyYW5zYWN0aW9uLlxuICogR2V0dGVycyBhbmQgc2V0dGVycyBhcmUgdXNlZCB0byB0cmFuc2Zvcm0gYW5kIGZvcm1hdCB2YWx1ZXMuIEFsc28gcmVzcG9uc2libGVcbiAqIGZvciBjYWxjdWxhdGluZyBhbW91bnRzIGFuZCBkYXRlcyB3aGVuIG1pc3Npbmcgb3IgaW52YWxpZC5cbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtPYmplY3R9IGF0dHJpYnV0ZXNcbiAqL1xuXG5mdW5jdGlvbiBUcmFuc2FjdGlvbiAoYXR0cmlidXRlcykge1xuICB0aGlzLmF0dHJpYnV0ZXMgPSB7fVxuXG4gIGZvciAodmFyIGtleSBpbiBhdHRyaWJ1dGVzKSB7XG4gICAgaWYgKGF0dHJpYnV0ZXMuaGFzT3duUHJvcGVydHkoa2V5KSkgdGhpcy5zZXQoa2V5LCBhdHRyaWJ1dGVzW2tleV0pXG4gIH1cblxuICBpZiAoIXRoaXMuZ2V0KCdkYXRlJykpIHRoaXMuc2V0RGF0ZSgpXG4gIGlmICghdGhpcy5nZXQoJ2Ftb3VudCcpKSB0aGlzLnNldEFtb3VudCgpXG59XG5cbi8qKlxuICogRnVuY3Rpb25zIHRoYXQgdHJhbnNmb3JtIGF0dHJpYnV0ZXMgYXMgdGhleSBhcmUgc2V0XG4gKi9cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnRyYW5zZm9ybWVycyA9IHtcbiAgYW1vdW50OiBtYWtlTnVtYmVyLFxuICBiYWxhbmNlOiBtYWtlTnVtYmVyLFxuICBwYWlkSW46IG1ha2VBYnNvbHV0ZU51bWJlcixcbiAgcGFpZE91dDogbWFrZUFic29sdXRlTnVtYmVyLFxuICBkYXRlOiBmdW5jdGlvbiAoZGF0ZSkge1xuICAgIGlmICghKGRhdGUgaW5zdGFuY2VvZiBEYXRlKSkgcmV0dXJuIGRhdGVcblxuICAgIC8vIENvbnZlcnQgdG8gR01UIHRvIGVuc3VyZSBjb3JyZWN0IEpTT04gdmFsdWVzXG4gICAgZGF0ZS5zZXRIb3VycyhkYXRlLmdldEhvdXJzKCkgLSBkYXRlLmdldFRpbWV6b25lT2Zmc2V0KCkgLyA2MClcbiAgICByZXR1cm4gZGF0ZVxuICB9XG59XG5cbi8qKlxuICogRnVuY3Rpb25zIHRoYXQgZm9ybWF0IGF0dHJpYnV0ZXMgd2hlbiByZXRyaWV2ZWQgd2l0aCBgZ2V0Rm9ybWF0dGVkYFxuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5mb3JtYXR0ZXJzID0ge1xuICBkYXRlOiBmb3JtYXREYXRlXG59XG5cbi8qKlxuICogVHJhbnNmb3JtcyBhbmQgc2V0cyB0aGUgZ2l2ZW4gYXR0cmlidXRlXG4gKiBAcGFyYW0ge1N0cmluZ30ga2V5IC0gVGhlIG5hbWUgb2YgdGhlIGF0dHJpYnV0ZVxuICogQHBhcmFtIHZhbHVlIC0gVGhlIHZhbHVlIG9mIHRoZSBhdHRyaWJ1dGVcbiAqL1xuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuc2V0ID0gZnVuY3Rpb24gKGtleSwgdmFsdWUpIHtcbiAgdmFyIHRyYW5zZm9ybWVyID0gdGhpcy50cmFuc2Zvcm1lcnNba2V5XSB8fCBpZEZ1bmN0aW9uXG4gIHRoaXMuYXR0cmlidXRlc1trZXldID0gdHJhbnNmb3JtZXIodmFsdWUpXG59XG5cbi8qKlxuICogQHJldHVybnMgdGhlIHN0b3JlZCBhdHRyaWJ1dGVcbiAqL1xuXG5UcmFuc2FjdGlvbi5wcm90b3R5cGUuZ2V0ID0gZnVuY3Rpb24gKGtleSkge1xuICByZXR1cm4gdGhpcy5hdHRyaWJ1dGVzW2tleV1cbn1cblxuLyoqXG4gKiBHZXQgYSB2YWx1ZSBmb3JtYXR0ZWQgYnkgdGhlIGNvcnJlc3BvbmRpbmcgZm9ybWF0dGVyXG4gKiBAcGFyYW0ga2V5IC0gVGhlIGtleSBvZiB0aGUgdmFsdWUgdG8gcmV0dXJuXG4gKiBAcmV0dXJucyBUaGUgZm9ybWF0dGVkIGF0dHJpYnV0ZVxuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5nZXRGb3JtYXR0ZWQgPSBmdW5jdGlvbiAoa2V5KSB7XG4gIHZhciBmb3JtYXR0ZXIgPSB0aGlzLmZvcm1hdHRlcnNba2V5XSB8fCBpZEZ1bmN0aW9uXG4gIHJldHVybiBmb3JtYXR0ZXIodGhpcy5nZXQoa2V5KSlcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIGFycmF5IHJlcHJlc2VudGF0aW9uIG9mIHRoZSBnaXZlbiBrZXlzIG9yIGFsbCBmb3JtYXR0ZWRcbiAqIGF0dHJpYnV0ZXMuXG4gKiBAcGFyYW0ge0FycmF5fSBrZXlzIC0gQW4gYXJyYXkgb2YgYXR0cmlidXRlIGtleXNcbiAqIEByZXR1cm5zIHtBcnJheX0gLSBBbiBhcnJheSBvZiBmb3JtYXR0ZWQgYXR0cmlidXRlc1xuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKGtleXMpIHtcbiAga2V5cyA9IGtleXMgfHwgT2JqZWN0LmtleXModGhpcy5hdHRyaWJ1dGVzKVxuICByZXR1cm4ga2V5cy5tYXAodGhpcy5nZXRGb3JtYXR0ZWQuYmluZCh0aGlzKSlcbn1cblxuLyoqXG4gKiBSZXR1cm5zIGFuIG9iamVjdCBvZiBmb3JtYXR0ZWQgdmFsdWVzIG9mIHRoZSBnaXZlbiBrZXlzIG9yIGFsbCBmb3JtYXR0ZWRcbiAqIGF0dHJpYnV0ZXMuXG4gKiBAcGFyYW0ge0FycmF5fSBrZXlzIC0gQW4gYXJyYXkgb2YgYXR0cmlidXRlIGtleXNcbiAqIEByZXR1cm5zIHtBcnJheX0gLSBBbiBhcnJheSBvZiBmb3JtYXR0ZWQgYXR0cmlidXRlc1xuICovXG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS50b0pTT04gPSBmdW5jdGlvbiAoa2V5cykge1xuICBrZXlzID0ga2V5cyB8fCBPYmplY3Qua2V5cyh0aGlzLmF0dHJpYnV0ZXMpXG4gIHZhciBvYmplY3QgPSB7fVxuXG4gIGZvciAodmFyIGkgPSBrZXlzLmxlbmd0aCAtIDE7IGkgPj0gMDsgaS0tKSB7XG4gICAgdmFyIGtleSA9IGtleXNbaV1cbiAgICBvYmplY3Rba2V5XSA9IHRoaXMuZ2V0Rm9ybWF0dGVkKGtleSlcbiAgfVxuXG4gIHJldHVybiBvYmplY3Rcbn1cblxuVHJhbnNhY3Rpb24ucHJvdG90eXBlLnNldERhdGUgPSBmdW5jdGlvbiAoYXR0cnMpIHtcbiAgYXR0cnMgPSBhdHRycyB8fCB7fVxuICB2YXIgZGF0ZVN0cmluZyA9IGF0dHJzLmRhdGVTdHJpbmcgfHwgdGhpcy5nZXQoJ2RhdGVTdHJpbmcnKVxuICB2YXIgZGF0ZUZvcm1hdCA9IGF0dHJzLmRhdGVGb3JtYXQgfHwgdGhpcy5nZXQoJ2RhdGVGb3JtYXQnKVxuICB2YXIgc3VjY2VlZGluZ0RhdGUgPSBhdHRycy5zdWNjZWVkaW5nRGF0ZVxuXG4gIHZhciB0cmFuc2FjdGlvbkRhdGUgPSBuZXcgVHJhbnNhY3Rpb25EYXRlKGRhdGVTdHJpbmcsIGRhdGVGb3JtYXQsIHtcbiAgICBzdWNjZWVkaW5nRGF0ZTogc3VjY2VlZGluZ0RhdGVcbiAgfSlcbiAgdGhpcy5zZXQoJ3RyYW5zYWN0aW9uRGF0ZScsIHRyYW5zYWN0aW9uRGF0ZSlcbiAgdGhpcy5zZXQoJ2RhdGUnLCB0cmFuc2FjdGlvbkRhdGUudG9EYXRlKCkpXG59XG5cblRyYW5zYWN0aW9uLnByb3RvdHlwZS5zZXRBbW91bnQgPSBmdW5jdGlvbiAoKSB7XG4gIHZhciBwYWlkSW4gPSB0aGlzLmdldCgncGFpZEluJylcbiAgdmFyIHBhaWRPdXQgPSB0aGlzLmdldCgncGFpZE91dCcpXG5cbiAgdGhpcy5zZXQoJ2Ftb3VudCcsIGNhbGN1bGF0ZUFtb3VudChwYWlkSW4sIHBhaWRPdXQpKVxufVxuXG5mdW5jdGlvbiBjYWxjdWxhdGVBbW91bnQgKHBhaWRJbiwgcGFpZE91dCkge1xuICByZXR1cm4gcGFpZEluID8gcGFpZEluIDogLXBhaWRPdXRcbn1cblxuZnVuY3Rpb24gZm9ybWF0RGF0ZSAodmFsdWUpIHtcbiAgdmFyIHl5eXkgPSB2YWx1ZS5nZXRGdWxsWWVhcigpXG4gIHZhciBtbSA9IHBhZFplcm9lcyh2YWx1ZS5nZXRNb250aCgpICsgMSlcbiAgdmFyIGRkID0gcGFkWmVyb2VzKHZhbHVlLmdldERhdGUoKSlcblxuICByZXR1cm4gW3l5eXksIG1tLCBkZF0uam9pbignLScpXG5cbiAgZnVuY3Rpb24gcGFkWmVyb2VzIChudW1iZXIpIHtcbiAgICByZXR1cm4gU3RyaW5nKCcwMCcgKyBudW1iZXIpLnNsaWNlKC0yKVxuICB9XG59XG5cbmZ1bmN0aW9uIGlkRnVuY3Rpb24gKHgpIHsgcmV0dXJuIHggfVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRyYW5zYWN0aW9uXG4iLCJ2YXIgVHJhbnNhY3Rpb25EYXRlcyA9IHJlcXVpcmUoJy4vdHJhbnNhY3Rpb24tZGF0ZXMnKVxuXG4vKipcbiAqIEFuIGFycmF5LWxpa2UgY2xhc3MgdGhhdCByZXByZXNlbnRzIGEgY29sbGVjdGlvbiBvZiB0cmFuc2FjdGlvbnNcbiAqIEBjb25zdHJ1Y3RvclxuICogQHBhcmFtIHtBcnJheX0gdHJhbnNhY3Rpb25zIC0gQW4gYXJyYXkgb2YgVHJhbnNhY3Rpb24gb2JqZWN0c1xuICogQHBhcmFtIHtPYmplY3R9IHN0YXRlbWVudCAtIFRoZSBwYXJlbnQgc3RhdGVtZW50XG4gKiBAcmV0dXJucyB7QXJyYXl9IC0gQW4gYXJyYXkgb2YgdHJhbnNhY3Rpb25zIHdpdGggY29udmVuaWVuY2UgbWV0aG9kc1xuICovXG5cbmZ1bmN0aW9uIFRyYW5zYWN0aW9ucyAodHJhbnNhY3Rpb25zLCBzdGF0ZW1lbnQpIHtcbiAgVHJhbnNhY3Rpb25zLl9pbmplY3RQcm90b3R5cGVNZXRob2RzKHRyYW5zYWN0aW9ucylcblxuICAvKipcbiAgICogU29tZSBmaW5hbmNpYWwgaW5zdGl0dXRpb25zIG9taXQgdGhlIHllYXIgcGFydCBpbiB0aGVpciBkYXRlIGNlbGxzLlxuICAgKiBUaGlzIHdvcmthcm91bmQgY2FsY3VsYXRlcyB0aGUgeWVhciBmb3IgZWFjaCB0cmFuc2FjdGlvbiBhZmZlY3RlZC5cbiAgICovXG5cbiAgaWYgKCEvWXsyLH0vLnRlc3Qoc3RhdGVtZW50LmRhdGVGb3JtYXQpKSB7XG4gICAgaWYgKCF0cmFuc2FjdGlvbnMuY2hyb25vbG9naWNhbCgpKSB0cmFuc2FjdGlvbnMgPSB0cmFuc2FjdGlvbnMucmV2ZXJzZSgpXG5cbiAgICB2YXIgc3VjY2VlZGluZ0RhdGUgPSBzdGF0ZW1lbnQuZGF0ZVxuICAgIGZvciAodmFyIGkgPSB0cmFuc2FjdGlvbnMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgIHZhciB0cmFuc2FjdGlvbiA9IHRyYW5zYWN0aW9uc1tpXVxuICAgICAgdHJhbnNhY3Rpb24uc2V0RGF0ZSh7IHN1Y2NlZWRpbmdEYXRlOiBzdWNjZWVkaW5nRGF0ZSB9KVxuICAgICAgc3VjY2VlZGluZ0RhdGUgPSB0cmFuc2FjdGlvbi5nZXQoJ2RhdGUnKVxuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cmFuc2FjdGlvbnNcbn1cblxuVHJhbnNhY3Rpb25zLnByb3RvdHlwZS5jaHJvbm9sb2dpY2FsID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gZGF0ZXMuY2FsbCh0aGlzKS5jaHJvbm9sb2dpY2FsKClcblxuICBmdW5jdGlvbiBkYXRlcyAoKSB7XG4gICAgdmFyIGRhdGVzID0gdGhpcy5tYXAoZnVuY3Rpb24gKHRyYW5zYWN0aW9uKSB7XG4gICAgICByZXR1cm4gdHJhbnNhY3Rpb24uZ2V0KCd0cmFuc2FjdGlvbkRhdGUnKVxuICAgIH0pXG4gICAgcmV0dXJuIG5ldyBUcmFuc2FjdGlvbkRhdGVzKGRhdGVzKVxuICB9XG59XG5cbi8qKlxuICogQHJldHVybnMge1RyYW5zYWN0aW9ufSBUaGUgZmlyc3QgdHJhbnNhY3Rpb24gaW4gdGhlIGNvbGxlY3Rpb25cbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLmZpcnN0ID0gZnVuY3Rpb24gKCkge1xuICByZXR1cm4gdGhpc1swXVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtUcmFuc2FjdGlvbn0gVGhlIGxhc3QgdHJhbnNhY3Rpb24gaW4gdGhlIGNvbGxlY3Rpb25cbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLmxhc3QgPSBmdW5jdGlvbiAoKSB7XG4gIHJldHVybiB0aGlzW3RoaXMubGVuZ3RoIC0gMV1cbn1cblxuLyoqXG4gKiBAcmV0dXJucyB7QXJyYXl9IEFuIGFycmF5IG9mIGZvcm1hdHRlZCB0cmFuc2FjdGlvbiBhdHRyaWJ1dGUgYXJyYXlzXG4gKi9cblxuVHJhbnNhY3Rpb25zLnByb3RvdHlwZS50b0FycmF5ID0gZnVuY3Rpb24gKGtleXMpIHtcbiAgcmV0dXJuIHRoaXMubWFwKGZ1bmN0aW9uICh0cmFuc2FjdGlvbikgeyByZXR1cm4gdHJhbnNhY3Rpb24udG9BcnJheShrZXlzKSB9KVxufVxuXG4vKipcbiAqIEByZXR1cm5zIHtBcnJheX0gQW4gYXJyYXkgb2YgZm9ybWF0dGVkIHRyYW5zYWN0aW9uIG9iamVjdHNcbiAqL1xuXG5UcmFuc2FjdGlvbnMucHJvdG90eXBlLnRvSlNPTiA9IGZ1bmN0aW9uIChrZXlzKSB7XG4gIHJldHVybiB0aGlzLm1hcChmdW5jdGlvbiAodHJhbnNhY3Rpb24pIHsgcmV0dXJuIHRyYW5zYWN0aW9uLnRvSlNPTihrZXlzKSB9KVxufVxuXG4vKipcbiAqIEFkZHMgdGhlIHByb3RvdHlwZSBtZXRob2RzIHRvIHRyYW5zYWN0aW9ucyBhcnJheSB0byBhcHBlYXIgbGlrZSBpbmhlcml0YW5jZVxuICogQHByaXZhdGVcbiAqL1xuXG5UcmFuc2FjdGlvbnMuX2luamVjdFByb3RvdHlwZU1ldGhvZHMgPSBmdW5jdGlvbiAoYXJyYXkpIHtcbiAgZm9yICh2YXIgbWV0aG9kIGluIHRoaXMucHJvdG90eXBlKSB7XG4gICAgaWYgKHRoaXMucHJvdG90eXBlLmhhc093blByb3BlcnR5KG1ldGhvZCkpIHtcbiAgICAgIGFycmF5W21ldGhvZF0gPSB0aGlzLnByb3RvdHlwZVttZXRob2RdXG4gICAgfVxuICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVHJhbnNhY3Rpb25zXG4iXX0=
