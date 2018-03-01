require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});

var docDriven = new DocDriven();

Vue.component('doc-editable',{
  template: [
    '<div>',
    ' <div class="doc-editable"'+
    '   v-show="active"',
    '   contenteditable="true"',
    '   @input="update">{{editableContent}}'+
    ' </div>',
    ' <div v-show="!active">{{content}}</div>',
    '</div>'
  ].join('\n'),
  props:['content','active'],
  data:function(){
    return {
      editableContent: this.content
    }
  },
  watch: {
    content: function(newContent){
      if(!this.active) {
        this.editableContent = newContent;
      }
    }
  },
  methods:{
    update:function(event){
      this.$emit('update',event.target.innerText);
    }
  }
});

/**
 * Markdown Component
 */
Vue.component('doc-block-markdown', {
  template: [
    '<div v-show="show">',
    ' <div :class="{\'doc-block-code\' : block.codeBlock, \'doc-block-markdown\' : !block.codeBlock}">',
    '   <div class="doc-block-layout">',
    '     <div',
    '       v-bind:class="{ \'doc-editable\': isInEditMode , \'doc-markdown\': true}"',
    '       v-html="compiledMarkdown"',
    '       @click="onDivClick"',
    '     />',
    '     <div class="doc-block-toolbar"',
    '      v-show="isExecutable && !isInEditMode">',
    '       <i class="fa fa-play-circle-o fa-lg doc-selectable"',
    '        aria-hidden="true"',
    '        @click="executeCode"',
    '       />',
    '     </div>',
    '   </div>',
    ' </div>',
    ' <div v-show="executed && !isInEditMode" class="doc-markdown">',
    '   <pre class="doc-block-code"><code class="language-json" v-html="executionResult"/></pre>',
    ' </div>',
    '</div>'
  ].join('\n'),
  props: ['show', 'block', 'isInEditMode'],
  data : function() {
    return {
      executionResult : '',
      executed : false
    }
  },
  computed: {
    compiledMarkdown: function () {
      var markdown = this.block.content;
      if(this.block.codeBlock) {
        /*
        markdown =  '```' + 
          this.block.language + '\n' +
          markdown + '\n' +
          '```';
        */
        try {
          return '<pre><code>' + 
            hljs.highlight(this.block.language, this.block.content).value + 
            '</code></pre>';
        } catch (__) {}
      }
      return window.markdownit({
        highlight: function (str, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(lang, str).value;
            } catch (__) {}
          }
      
          return ''; // use external default escaping
        }        
      }).render(markdown);
    },
    isExecutable: function() {
      return this.block.blockParameter === 'executable';
    }
  },
  methods: {
    onDivClick: function(e) {
      if(this.isInEditMode) {
        this.$emit('activateBlockEditMode');
      }
    },
    executeCode: function(e) {
      var result = new Function(this.block.content)();
      this.executionResult = hljs.highlight('json', JSON.stringify(result, null, 2)).value;
      this.executed = true;
    }
  }
});

Vue.component('doc-block-toolbar', {
	template: [
    '<div class="doc-block-toolbar" v-show="show">',
    ' <i :class="toolbarIconClasses(\'fa-file-code-o\', true)" @click="changeBlockOrder(\'newCodeBlock\')"></i>',
    ' <i :class="toolbarIconClasses(\'fa-file-text-o\', true)" @click="changeBlockOrder(\'newMdBlock\')"></i>',
    ' <i :class="toolbarIconClasses(\'fa-arrow-down\', !last)" @click="changeBlockOrder(\'moveBlockDown\')"></i>',
    ' <i :class="toolbarIconClasses(\'fa-arrow-up\', !first)" @click="changeBlockOrder(\'moveBlockUp\')"></i>',
    ' <i :class="toolbarIconClasses(\'fa-trash\', !(last && first))" @click="changeBlockOrder(\'deleteBlock\')"></i>',
    '</div>'
    ].join('\n'),
    props: ['show','first','last'],
    methods: {
      toolbarIconClasses: function(faClass, enable) {
        var classObj = {
          'fa' : true,
          'doc-selectable' : true,
          'doc-selectable-disabled': false
        };
        classObj[faClass] = true;
        if(!enable) {
          classObj['doc-selectable'] = false;
          classObj['doc-selectable-disabled'] = true;
        }
        return classObj;
      },
      changeBlockOrder : function(type) {
        this.$emit('changeBlockOrder', type);
      }
    }
});

/**
 * Moncao Editor Component
 */
Vue.component('doc-block-editor', {
  template : 
  [
    '<div v-show="show">',
    ' <div id="editor" style="height:400px" class="doc-editable"/>',
    '</div>'
  ].join('\n'),
  props: ['show', 'block', 'windowWidth'],
  watch: {
    windowWidth: function(newWindowWidth) {
      this.layout();
    }
  },
  updated: function() {
    this.layout();
  },
  mounted: function() {
    this.loadMonaco();
  },
  destroyed: function() {
    this.destroyMonaco();
  },
  computed: {
    editorOptions: function() {
      return {
        value: this.block.content,
        language: this.block.language,
        scrollBeyondLastLine: false
        //, theme: 'vs-dark'
      };
    }
  },
  data: function() {
    return {};
  },
  methods: {
    loadMonaco: function() {
      require(['vs/editor/editor.main'], this.createMonaco);
    },
    createMonaco: function() {
      this.editor = window.monaco.editor.create(this.$el.querySelector('#editor'), this.editorOptions);
      var triggerChangeContent = this.triggerChangeContent;
      this.editor.onDidChangeModelContent(function(e){
        triggerChangeContent(e);
      });
      this.layout();
    },
    triggerChangeContent: _.debounce(function (e) {
      var content = this.editor.getValue();
      var changedBlock = {
        id: this.block.id,
        content: content
      }
      this.$emit('blockChanged',changedBlock);
    }, 300),
    destroyMonaco: function() {
      if (typeof this.editor !== 'undefined') {
        this.editor.dispose();
      }
    },
    layout: function() {
      if(this.editor) {
        this.editor.layout();
      }
    }
  }  
})

/**
 * Document Block, content can be modified in an Editor when in Edit Mode,
 * otherwise it renders the markdown content of a block.
 */
Vue.component('doc-block', {
  template: [
  	'<div>',
    '  <doc-block-toolbar :show="isInEditMode" :first="first" :last="last"',
    '     @changeBlockOrder="changeBlockOrder"',
    '     />',
    '  <doc-block-editor', 
    '   :show="isBlockInEditMode()"',
    '   :block="block"',
    '   :windowWidth="windowWidth"',
    '   @blockChanged="triggerChangeBlock"/>',
    '  <doc-block-markdown',
    '   :show="!isBlockInEditMode()"',
    '   :isInEditMode="isInEditMode"',
    '   :block="block"',
    '   @activateBlockEditMode="triggerBlockEditMode"',
    '  />',
    '</div>'
  ].join('\n'),
  props: ['isInEditMode', 'blocksInEditMode', 'windowWidth', 'block', 'first', 'last'],
  methods: {
    triggerChangeBlock: function(content) {
      this.$emit('blockChanged', content);
    },
    triggerBlockEditMode: function(e) {
      this.$emit('activateBlockEditMode', this.block);
    },
    isBlockInEditMode: function() {
      return _.includes(this.blocksInEditMode, this.block.id);
    },
    changeBlockOrder : function(type) {
      this.$emit('changeBlockOrder', {
        'type': type,
        'blockId': this.block.id
      });
    }
  }
})

Vue.component('doc-header',{
  template: [
    '<div>',
    ' <!-- Header Section -->',
    ' <div class="doc-header">',
    '   <h1 class="doc-title"><doc-editable :active="isInEditMode" :content="document.meta.title" @update="updateTitle"/></h1>',
    '   <div class="doc-toolbar">',
    '    <i class="fa fa-download fa-lg doc-selectable"></i>',
    '    <i class="fa fa-eye fa-lg doc-selectable" v-show="isInEditMode" @click="switchEditMode"></i>',
    '    <i class="fa fa-pencil-square-o fa-lg doc-selectable" v-show="!isInEditMode" @click="switchEditMode"></i>',
    '   </div>',
    ' </div>',  
    ' <div class="doc-metainfo">',
    '  <p>',
    '    <doc-editable :active="isInEditMode" :content="document.meta.summary" @update="updateSummary"/>',
    '  </p>',
    ' </div>',
    '</div>',
  ].join('\n'),
  props:['document','isInEditMode'],
  methods: {
    switchEditMode: function() {
      this.$emit('switchEditMode');
    },
    updateTitle: function(title) {
      this.$emit('updateTitle', title);
    },
    updateSummary: function(summary) {
      this.$emit('updateSummary', summary);
    }
  }
})

function initWikiData() {
  
}

/**
 * Main Component which manages a Document in a Wiki-like way.
 */
Vue.component('doc-wiki', {
  template: [
    '<div class="doc-wiki">',
    ' <header>',
    '   <doc-breadcrumbs :path="path"/>',
    ' </header>',
    ' <main>',
    '   <nav>',
    '   </nav>',
    '   <div class="doc-body">',
    '     <doc-header :document="document"',
    '       :isInEditMode="isInEditMode"',
    '       @switchEditMode="switchEditMode"',
    '       @updateTitle="updateTitle"',
    '       @updateSummary="updateSummary"',
    '     />',
    '     <div class="doc-content">',
    '       <doc-block v-for="blockId in document.blockOrder" :key="blockId"',
    '         :windowWidth="windowWidth"',
    '         :isInEditMode="isInEditMode"',
    '         :blocksInEditMode="document.blocksInEditMode"',
    '         :block="document.blocks[blockId]"',
    '         :first="document.blockOrder.indexOf(blockId)===0"',
    '         :last="document.blockOrder.indexOf(blockId)===(document.blockOrder.length-1)"',
    '         @blockChanged="changeBlock"',
    '         @changeBlockOrder="changeBlockOrder"',
    '         @activateBlockEditMode="triggerBlockEditMode"',
    '       />',
    '     </div>',
    '   </div>',
    ' </main>',
    '</div>'
  ].join('\n'),
  props: ['windowWidth','path'],
  data: function() { 
    return {
      isInEditMode: false,
      document: {
        meta: {
          title: 'Title',
          summary: 'Summary'
        },
        blocksInEditMode: [],
        blockOrder: [],
        blocks: {}
      }
    }
  },
  watch: {
    path: function(newPath, oldPath) {
      this.reloadContent();
    }
  },
  mounted: function() {
    this.loadContent();
  },
  // moveBlockUp, moveBlockDown, deleteBlock
  methods: {
    changeBlockOrder: function(changeBlockOrderEvent) {
      console.log(changeBlockOrderEvent.type + ' ' + changeBlockOrderEvent.blockId);
      var document = this.document;
      var blockIndex = document.blockOrder.indexOf(changeBlockOrderEvent.blockId);
      if('newCodeBlock' === changeBlockOrderEvent.type || 'newMdBlock' === changeBlockOrderEvent.type) {

        var language = 'markdown';
        var codeBlock = false;
        if('newCodeBlock' === changeBlockOrderEvent.type) {
          language = 'javascript';
          codeBlock = true;
        }

        var id = docDriven.uuidv4();
        document.blocks[id] = {
          id: id,
          codeBlock: codeBlock,
          blockParameter: '',
          language: language,
          content: '',
        };

        document.blockOrder.splice(blockIndex, 0, id);

      } else if('moveBlockUp' === changeBlockOrderEvent.type) {
        var newPositionIndex = blockIndex;
        if(blockIndex>0) {
          newPositionIndex--;
        }
        document.blockOrder.splice(newPositionIndex, 0, document.blockOrder.splice(blockIndex, 1)[0]);
      } else if('moveBlockDown' === changeBlockOrderEvent.type) {
        var newPositionIndex = blockIndex;
        if(blockIndex<(document.blockOrder.length-1)) {
          newPositionIndex++;
        }
        document.blockOrder.splice(newPositionIndex, 0, document.blockOrder.splice(blockIndex, 1)[0]);
      } else if('deleteBlock' === changeBlockOrderEvent.type) {
        document.blockOrder.splice(blockIndex, 1);
      }
      this.autoSaveContent();
    },
    switchEditMode: function() {
      this.isInEditMode = !this.isInEditMode;
      this.document.blocksInEditMode.pop();
    },
    changeBlock: function(changedBlock) {
      this.document.blocks[changedBlock.id].content = changedBlock.content;
      this.autoSaveContent();
    },
    initContent: function(content) {
      var document = docDriven.extract(content);
      var docWiki = this;
      Object.assign(this.$data, this.$options.data.call(this));
      _.forEach(document.blockOrder, function(id) {
        docWiki.$set(docWiki.document.blocks, id, document.blocks[id]);
        docWiki.document.blockOrder.push(id);        
      })
      this.document.blocksInEditMode = [];
      var title = document.meta.title;
      this.document.meta.title = _.isNil(title)? '' : title;
      var summary = document.meta.summary;
      this.document.meta.summary = _.isNil(summary)? '' : summary;
    },
    updateTitle: function(title) {
      this.document.meta.title = title;
      this.autoSaveContent();
    },
    updateSummary: function(summary) {
      this.document.meta.summary = summary;
      this.autoSaveContent();
    },
    triggerBlockEditMode: function(block) {
      this.document.blocksInEditMode.pop();      
      this.document.blocksInEditMode.push(block.id);
    },
    autoSaveContent: _.debounce(function () {
      var path = this.getDocResourcePath()
      axios.post('/api/docs' + path, docDriven.render(this.document), {
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }, 500),
    loadContent: function() {
      var path = this.getDocResourcePath()
      var initContent = this.initContent;
      axios.get('/api/docs' + path).then(function (response) {
        initContent(response.data);
      })
    },
    reloadContent: _.debounce(function() {
      this.loadContent();
    }, 500),
    getDocResourcePath: function() {
      var path = window.location.pathname + window.location.hash;
      path = _.replace(path, /#/g, "/");
      path = _.replace(path, /\/\//g, "/");
      if(!_.startsWith(path,'/projects')) {
        return '/projects/wiki' + path;
      }
      return path;
    }
  }
})

new Vue({
  el: '.wiki-app',
  data: function() { 
    return {
      windowWidth: 0,
      windowHeight: 0,
      path: window.location.pathname + window.location.hash
    }
  },
  mounted() {

    this.$nextTick(function() {
      window.addEventListener('resize', this.loadWindowWidth);
      window.addEventListener('resize', this.loadWindowHeight);
      window.addEventListener('hashchange', this.changePath);

      //Init
      this.loadWindowWidth()
      this.loadWindowHeight()
    })

  },

  methods: {
    loadWindowWidth: _.debounce(function(event) {
      this.windowWidth = document.documentElement.clientWidth;
    }, 300),    
    loadWindowHeight: _.debounce(function(event) {
      this.windowHeight = document.documentElement.clientHeight;
    }, 300),
    changePath: _.debounce(function(event) {
      this.path = window.location.pathname + window.location.hash;
    }, 300)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.loadWindowWidth);
    window.removeEventListener('resize', this.loadWindowHeight);
  }
})