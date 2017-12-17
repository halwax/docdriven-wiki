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
  var codeLanguagePattern = '^```(.+?)?\\r?\\n([\\s\\S]*?)\\r?\\n```$';
  this.codeLanguageRegexp = new RegExp(codeLanguagePattern, 'm');
  this.blockSeparatorPattern = '^\\[//\\]: # \\(block(:.+?)?\\)(?:\\r?\\n)([\\s\\S]*)';
  this.blockSeparatorRegexp = new RegExp(this.blockSeparatorPattern, 'm');
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

  // use positive lookahead (?=...) to keep the block starting line
  // in the split result to be able to extract the optional block
  // parameter

  _.forEach(content.split(/(?:\r?\n)?(?=\[\/\/\]: # \(block(?:.+?)?\)(?:\r?\n)?)/), function(blockText) {
    docDriven.addBlock(document, blockText);
  })
  return document;
}

DocDriven.prototype.addBlock = function(document, blockText) {

  if(typeof(blockText) === "undefined" || blockText === null) {
    return;
  }

  var blockSeparatorMatch = this.blockSeparatorRegexp.exec(blockText);
  var blockParameter = '';
  if(blockSeparatorMatch && blockSeparatorMatch.index == 0) {
    if(blockSeparatorMatch.length==2) {
      blockText = blockSeparatorMatch[1];
    } else if (blockSeparatorMatch.length==3) {
      blockParameter = blockSeparatorMatch[1];
      blockText = blockSeparatorMatch[2];
    }
  }

  if(typeof(blockParameter) === "undefined" || blockParameter === null) {
    blockParameter = '';
  } else {
    blockParameter = blockParameter.substring(1);
  }

  var id = this.uuidv4();
  var language = 'markdown';
  var codeBlock = false;

  var match = this.codeLanguageRegexp.exec(blockText);
  if(match && match.index == 0) {
    codeBlock = true;
    if(match.length==2) {
      language = '';
      blockText = match[1];
    } else if(match.length==3) {
      language = match[1];
      blockText = match[2];
    }
  }

  document.blocks[id] = {
    id: id,
    codeBlock: codeBlock,
    blockParameter: blockParameter,
    language: language,
    content: blockText,
  }

  document.blockOrder.push(id);
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

DocDriven.prototype.test = function (string) {
  string = string || ''
  return this.regex.test(string)
}

DocDriven.prototype.render = function (document) {
  return [
    '---',
    jsyaml.safeDump(document.meta),
    '---',
    _.map(document.blockOrder, function(id, index) {

      
      var block = document.blocks[id];
      var startBlock = '';
      var endBlock = '';
      if(block.codeBlock){
        startBlock = '```' + block.language + '\n';
        endBlock = '\n```';
      }
      
      var renderedBlock = startBlock + block.content + endBlock;

      if(index!==0 || !block.codeBlock || block.blockParameter !== '') {
        var renderedBlockParameter = ''
        if(block.blockParameter !== '') {
          renderedBlockParameter = ':' + block.blockParameter;
        }
        renderedBlock = '[//]: # (block' + renderedBlockParameter + ')\n' + renderedBlock;
      }

      return renderedBlock;
    }).join('\n')
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