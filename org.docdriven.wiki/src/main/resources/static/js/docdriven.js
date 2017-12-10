/**
 * <p>
 * DocDriven to parse and render markdown meta information and special
 * markdown sections. Based on ideas of Kajero and Front-Matter.
 * </p>
 * 
 * <ul>
 *  <li>front-matter : https://github.com/jxson/front-matter (MIT license)</li>
 *  <li>
 * </ul>
 */

var DocDriven = function() {
  var optionalByteOrderMark = '\\ufeff?'
  var pattern = '^(' +
    optionalByteOrderMark +
    '(= yaml =|---)' +
    '$([\\s\\S]*?)' +
    '^(?:\\2|\\.\\.\\.)' +
    '$' +
    '\\r?' +
    '(?:\\n)?)'
  // NOTE: If this pattern uses the 'g' flag the `regex` variable definition will
  // need to be moved down into the functions that use it.
  this.regex = new RegExp(pattern, 'm')
}

DocDriven.prototype.extract = function(string) {
  string = string || ''

  var lines = string.split(/(\r?\n)/)
  if (lines[0] && /= yaml =|---/.test(lines[0])) {
    return this.parse(string)
  } else {
    return { meta: {}, content: string }
  }
}

DocDriven.prototype.parse = function (string) {
  var match = this.regex.exec(string)

  if (!match) {
    return {
      meta: {},
      content: string
    }
  }

  var yaml = match[match.length - 1].replace(/^\s+|\s+$/g, '')
  var meta = jsyaml.load(yaml) || {}
  var content = string.replace(match[0], '')

  return { meta: meta, content: content}
}

DocDriven.prototype.test = function (string) {
  string = string || ''
  return this.regex.test(string)
}

DocDriven.prototype.render = function (document) {
  return [
    '---',
    jsyaml.safeDump(document.meta),
    '---',
    document.content
  ].join('\n');
}

/**
 * https://stackoverflow.com/a/2117523
 */
DocDriven.prototype.uuidv4 = function () {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}