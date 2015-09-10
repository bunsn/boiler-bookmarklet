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
