/**
 * <p>
 * DocDriven to parse and render markdown meta information and special
 * markdown sections. Based on ideas of Kajero and Front-Matter.
 * </p>
 * 
 * <ul>
 *  <li>front-matter : https://github.com/jxson/front-matter (MIT license)</li>
 *  <li></li>
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
    return this.addBlock(this.initDocument(),string)
  }
}

DocDriven.prototype.parse = function (string) {
  
  var docDriven = this;
  var match = this.regex.exec(string)

  if (!match) {
    return this.addBlock(this.initDocument(),string)
  }

  var yaml = match[match.length - 1].replace(/^\s+|\s+$/g, '')
  var meta = jsyaml.load(yaml) || {}
  var content = string.replace(match[0], '')

  var document = this.setMeta(this.initDocument(),meta)

  var blocks = {};
  var blockOrder = [];
  _.forEach(content.split(/\[\/\/\]: # \(block\)(?:\r?\n)?/), function(blockText) {
    docDriven.addBlock(document, blockText);
  })
  return document;
}

DocDriven.prototype.initDocument = function() {
  return { 
    meta: {}, 
    blocks: {},
    blockOrder: []
  }
}

DocDriven.prototype.setMeta = function(document, meta) {
  document.meta = meta;
  return document;
}

DocDriven.prototype.addBlock = function(document, blockText) {
  var id = this.uuidv4();
  var language = 'markdown';

  document.blocks[id] = {
    id: id,
    language: language,
    content: blockText
  }
  document.blockOrder.push(id);
  return document;
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
    _.map(document.blockOrder, function(id) {
      return document.blocks[id].content;
    }).join('\n[//]: # (block)\n')
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