class WikiMd {

  constructor(md) {
    md.core.ruler.push('docdriven', function(state) {
        
      let tokens = state.tokens;
      let bulletListStack = [];

      for(let tokenIndex = 0; tokenIndex < tokens.length; tokenIndex++) {
        let token = tokens[tokenIndex];
        if(token.type == 'bullet_list_open') {
          bulletListStack.push({
            ul : token,
            items : []
          })
        } else if (token.type == 'bullet_list_close') {
          let bulletListObj = bulletListStack.pop();
          let itemObjs = bulletListObj.items
          let taskList = itemObjs.length > 0;
          for(let itemIdx = 0; itemIdx < itemObjs.length; itemIdx++) {
            let itemObj = itemObjs[itemIdx];
            if(itemObj.taskTextToken == null) {
              taskList = false;
            }
          }
          if(taskList) {
            console.log('is tasklist')
          }
        } else if (token.type == 'list_item_open') {
          let bulletListObj = bulletListStack[bulletListStack.length-1];
          let nextTextTokenIndex = this.findNextListItemTextToken(tokens, tokenIndex + 1);
          let taskItem = false;
          let taskTextToken = null;
          if(nextTextTokenIndex !== -1) {
            let nextToken = tokens[nextTextTokenIndex];
            if(nextToken.content.startsWith('[ ]') ||
              nextToken.content.startsWith('[?]') ||
              nextToken.content.startsWith('[x]')) {
              taskItem = true;
              taskTextToken = nextToken;
            }
          }
          bulletListObj.items.push({
            item: token,
            taskTextToken: taskTextToken
          });
        }
      }
    }.bind(this));
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
}

export default WikiMd;