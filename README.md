# Boiler Bookmarklet

Download financial transaction as CSV with a bookmarklet.

This implements [Boiler](https://github.com/bunsn/boiler) to scrape and download financial data from online banking websites. It currently only supports HSBC and NatWest (I believe), but it should be relatively easy to add support for your bank by writing a [statement definition](https://github.com/bunsn/boiler#statement-definitions).

It has been designed to run as a bookmarklet, so to run it, add the following to your bookmarks:

```
javascript:(function()%7Bvar%20link%3Ddocument.createElement(%22link%22)%3Blink.rel%3D%22stylesheet%22%2Clink.href%3D%22https%3A%2F%2Frawgit.com%2Fbunsn%2Fboiler-bookmarklet%2Fmaster%2Fdist%2Fapp.min.css%22%2Cdocument.body.appendChild(link)%3Bfunction%20callback()%7B%7Dvar%20s%3Ddocument.createElement(%22script%22)%3Bs.addEventListener%3Fs.addEventListener(%22load%22%2Ccallback%2C!1)%3As.readyState%26%26(s.onreadystatechange%3Dcallback)%2Cs.src%3D%22https%3A%2F%2Frawgit.com%2Fbunsn%2Fboiler-bookmarklet%2Fmaster%2Fdist%2Fapp.min.js%22%2Cdocument.body.appendChild(s)%3B%7D)()
```

Note: this is the development version, so is likely to change, and may be hosted elsewhere in the future.

## License

See the [LICENSE](LICENSE.md) file for license rights and limitations (ISC).

***

The Bunsn logo is adapted from the [Fire Flame Match Icon](https://www.iconfinder.com/icons/289617/fire_flame_match_icon) by [Pixel Buddha](http://pixelbuddha.net), and is licensed under [Creative Commons (Attribution 3.0 Unported)](http://creativecommons.org/licenses/by/3.0/)
