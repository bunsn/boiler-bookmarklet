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
