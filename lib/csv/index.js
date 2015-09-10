var arrayToDSV = require('./array-to-dsv')

module.exports = {
  stringify: function (array) { return arrayToDSV(array, ',') }
}
