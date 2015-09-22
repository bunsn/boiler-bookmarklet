var assert = require('assert')
var CSV = require('../lib/csv')

describe('stringify', function () {
  it('escapes double quotes', function () {
    assert.equal(CSV.stringify([['Hello "World"', '"Foo" Bar']]),
      '"Hello ""World""","""Foo"" Bar"')
  })

  it('wraps items with line break in double quotes', function () {
    assert.equal(CSV.stringify([['Hello\nWorld']]), '"Hello\nWorld"')
  })

  it('wraps items with a delimiter in double quotes', function () {
    assert.equal(CSV.stringify([['Hello, World']]), '"Hello, World"')
  })

  it('joins items with a delimiter', function () {
    assert.equal(CSV.stringify([['Hello World', 'Foo Bar']]),
      'Hello World,Foo Bar')
  })

  it('converts undefined to empty string', function () {
    assert.equal(CSV.stringify([['Hello World', void 0]]),
      'Hello World,')
  })

  it('converts null to empty string', function () {
    assert.equal(CSV.stringify([['Hello World', null]]),
      'Hello World,')
  })

  it('does not convert 0 to an empty string', function () {
    assert.equal(CSV.stringify([['Hello World', 0]]),
      'Hello World,0')
  })

  it('does not convert false to an empty string', function () {
    assert.equal(CSV.stringify([['Hello World', false]]),
      'Hello World,false')
  })
})
