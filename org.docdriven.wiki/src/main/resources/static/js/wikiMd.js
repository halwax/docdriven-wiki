let openTaskStr = '[ ]';
let finishedTaskStr = '[x]';
let unclearTaskStr = '[?]';
let inProgressTaskStr = '[~]';

class WikiMd {

  constructor(md) {

    let taskRegex = /\[[ x\?~]\]/;

    md.core.ruler.push('docdriven', function(state) {
      
      let tokens = state.tokens.slice(0);
      let bulletListStack = [];

      for(let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
        let token = tokens[tokenIndex];
        if(token.type == 'bullet_list_open') {
          bulletListStack.push({
            ulToken : token,
            items : []
          })
        } else if (token.type == 'bullet_list_close') {

          let bulletListObj = bulletListStack.pop();
          let ulToken = bulletListObj.ulToken;
          let itemObjs = bulletListObj.items
          let taskList = itemObjs.length > 0;
          
          for(let itemIdx = 0; itemIdx < itemObjs.length; itemIdx++) {
            let itemObj = itemObjs[itemIdx];
            if(itemObj.taskTextToken == null) {
              taskList = false;
            }
          }

          if(taskList) {
            // remove task symbols from text / inline nodes
            // add class attribute fa-ul to ul and a fa-li
            // token after the list-item-open
            itemObjs.forEach(itemObj => {
              
              let itemTokenIndex = state.tokens.findIndex(token => token === itemObj.itemToken)
              let taskTextToken = itemObj.taskTextToken;

              ulToken.attrJoin('class', 'fa-ul');
              
              let taskOpenToken = new state.Token('block','i',1);
              taskOpenToken.level = taskTextToken.level;
              taskOpenToken.attrSet('class', 'fa-li fa fa-'+ this.mapToFontAwesome(itemObj.taskType) +' fa-fw');

              state.tokens.splice(itemTokenIndex+1, 0, taskOpenToken);

              let taskCloseToken = new state.Token('block','i',-1);
              taskCloseToken.level = taskTextToken.level;

              state.tokens.splice(itemTokenIndex+2, 0, taskCloseToken);

              taskTextToken.content = taskTextToken.content.replace(taskRegex,'');
              if(taskTextToken.type === 'inline') {
                let taskTextTokenChildren = taskTextToken.children;
                for(let childIndex = 0; childIndex < taskTextTokenChildren.length; childIndex++) {
                  let taskTextTokenChild = taskTextTokenChildren[childIndex];
                  if(taskRegex.test(taskTextTokenChild.content)){
                    taskTextTokenChild.content = taskTextTokenChild.content.replace(taskRegex,'');
                    break;
                  }
                }
              }
            })
          }
        } else if (token.type == 'list_item_open') {

          let bulletListObj = bulletListStack[bulletListStack.length-1];
          let nextTextTokenIndex = this.findNextListItemTextToken(tokens, tokenIndex + 1);
          let taskItem = false;
          let taskTextToken = null;
          let taskType = openTaskStr;


          if(nextTextTokenIndex !== -1) {
            let nextToken = tokens[nextTextTokenIndex];
            if(nextToken.content.startsWith(openTaskStr) ||
              nextToken.content.startsWith(unclearTaskStr) ||
              nextToken.content.startsWith(finishedTaskStr) ||
              nextToken.content.startsWith(inProgressTaskStr)) {
              taskItem = true;
              taskTextToken = nextToken;
              taskType = nextToken.content.substring(0, 3);
            }
          }

          bulletListObj.items.push({
            itemToken: token,
            taskTextToken: taskTextToken,
            taskType: taskType
          });
        }
      }
    }.bind(this));

    var textRule = md.renderer.rules.text;
    md.renderer.rules.text = function (tokens, idx /*, options, env */) {
      
      var faRegex = /:fa-.+?:/;
      var combinedRegex = new RegExp('((?:'+faRegex.source+')|(?:'+taskRegex.source+'))');

      var textToken = tokens[idx];
      var content = textToken.content;
      if(combinedRegex.test(content)) {
        var newContent = '';
        var contentSplit = content.split(combinedRegex);
        for(var i = 0; i < contentSplit.length; i++) {
          var contentPart = contentSplit[i];
          if(faRegex.test(contentPart)) {
            newContent += contentPart.replace(faRegex, function(match) {
              return `<i class="fa ${match.slice(1,-1)}"></i>`
            })
          } else if (taskRegex.test(contentPart)) {
            newContent += `<i class="fa fa-${this.mapToFontAwesome(contentPart)} fa-fw></i>`
          } else {
            newContent += md.utils.escapeHtml(contentPart);
          }
        }
        return newContent;
      }
      return textRule(tokens,idx);
    }
  }

  findNextListItemTextToken(tokens, tokenIndex) {
    let notFoundTextTokenIndex = -1;
    for(tokenIndex; tokenIndex < tokens.length; tokenIndex++) {
      let token = tokens[tokenIndex];
      // inline is used when the list item is a paragraph
      if(token.type == 'text' || token.type == 'inline') {
        return tokenIndex;
      } else if(token.type == 'bullet_list_close' || 
        token.type == 'bullet_list_open' || 
        token.type == 'list_item_open') {
        return notFoundTextTokenIndex;
      }
    }
    return notFoundTextTokenIndex;
  }

  mapToFontAwesome(taskType) {
    switch(taskType) {
      case openTaskStr: {
        return 'square-o'
      }
      case finishedTaskStr: {
        return 'check-square-o'
      }
      case unclearTaskStr: {
        return 'question'
      }
      case inProgressTaskStr: {
        return 'pencil-square-o'
      }
    }
  }
}

export default WikiMd;