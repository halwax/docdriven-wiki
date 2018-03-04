require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});

var docDriven = new DocDriven();

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
    '       v-html="compiledMarkdown(block)"',
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
  props: ['show', 'block', 'isInEditMode', 'path'],
  data : function() {
    return {
      executionResult : '',
      executed : false
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
    },
    compiledMarkdown: function (block) {
      var path = this.path;
      var markdown = block.content;
      if(block.codeBlock) {
        /*
        markdown =  '```' + 
          this.block.language + '\n' +
          markdown + '\n' +
          '```';
        */
        try {
          return '<pre><code>' + 
            hljs.highlight(block.language, block.content).value + 
            '</code></pre>';
        } catch (__) {
          console.log('hightlight error with '+block.language);
        }
      }
      var md = window.markdownit({
        highlight: function (str, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(lang, str).value;
            } catch (__) {}
          }
      
          return ''; // use external default escaping
        },
        replaceLink: function (link, env) {
          var linkPath = path;
          var fileExtensionPattern = /\.[0-9a-z]+$/i;
          if(link.match(fileExtensionPattern) && path.includes('#')) {
            var hashIndex = path.indexOf('#');
            linkPath = path.slice(0,hashIndex);
            var hashPath = path.slice(hashIndex+1,path.length)
            var lastHashPathSegment = _.last(hashPath.split('/'));
            if(hashPath.length!==lastHashPathSegment.length) {
              hashPath = hashPath.slice(0, hashPath.length - (lastHashPathSegment.length+1));
            }
            linkPath = '/api/files' + linkPath + '/' + hashPath + '/' + link;
          } else {
            if(link.startsWith('./')) {
              link = link.slice(2,link.length);
            }
            linkPath = linkPath + '#' + link;
          }
          return linkPath;
        }      
      }).use(markdownitReplaceLink);
      return md.render(markdown);
    },
    isExecutable: function() {
      return this.block.blockParameter === 'executable';
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
    },
    block: function(newBlock) {
      if(!_.isNil(this.editor) && !this.show) {
        this.editor.setValue(newBlock.content);
      }
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
    '   :show="isBlockInEditMode(blocksInEditMode)"',
    '   :block="block"',
    '   :windowWidth="windowWidth"',
    '   @blockChanged="triggerChangeBlock"/>',
    '  <doc-block-markdown',
    '   :show="!isBlockInEditMode(blocksInEditMode)"',
    '   :isInEditMode="isInEditMode"',
    '   :block="block"',
    '   :path="path"',
    '   @activateBlockEditMode="triggerBlockEditMode"',
    '  />',
    '</div>'
  ].join('\n'),
  props: ['isInEditMode', 'blocksInEditMode', 'windowWidth', 'block', 'first', 'last', 'path'],
  methods: {
    triggerChangeBlock: function(content) {
      this.$emit('blockChanged', content);
    },
    triggerBlockEditMode: function(e) {
      this.$emit('activateBlockEditMode', this.block);
    },
    isBlockInEditMode: function(blocksInEditMode) {
      return _.includes(blocksInEditMode, this.block.id);
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
    '   <h1 class="doc-title" @click="onDivClick">{{getTitle(document.meta)}}</h1>',
    '   <div class="doc-toolbar">',
    '    <i class="fa fa-download fa-lg doc-selectable"></i>',
    '    <i class="fa fa-eye fa-lg doc-selectable" v-show="isInEditMode" @click="switchEditMode"></i>',
    '    <i class="fa fa-pencil-square-o fa-lg doc-selectable" v-show="!isInEditMode" @click="switchEditMode"></i>',
    '   </div>',
    ' </div>',  
    ' <div v-if="hasSummary(document.meta)" v-show="!isInEditMode"',
    '     class="doc-metainfo" @click="onDivClick">',
    '  <p>',
    '    {{getSummary(document.meta)}}',
    '  </p>',
    ' </div>',
    ' <div class="doc-metainfo-editmode" v-show="isInEditMode">',
    '   <doc-block-markdown v-if="!_.isNil(document.meta.content)"',
    '     :show="isInEditMode && !isBlockInEditMode(document.blocksInEditMode)"',
    '     :isInEditMode="isInEditMode"',
    '     :block="document.meta"',
    '     :path="\'/\'"',
    '     @activateBlockEditMode="onDivClick"',
    '   />',
    '   <doc-block-editor', 
    '     :show="isBlockInEditMode(document.blocksInEditMode)"',
    '     :block="document.meta"',
    '     :windowWidth="windowWidth"',
    '     @blockChanged="triggerChangeBlock"/>',
    ' </div>',
    '</div>',
  ].join('\n'),
  props:['document', 'isInEditMode', 'windowWidth'],
  methods: {
    switchEditMode: function() {
      this.$emit('switchEditMode');
    },
    onDivClick: function() {
      if(this.isInEditMode) {
        this.$emit('activateHeaderEditMode', this.document.meta);
      }
    },
    getTitle: function(meta) {
      if(_.isNil(meta.title)) {
        return '';
      }
      return meta.title;
    },
    getSummary: function(meta) {
      return meta.summary;
    },
    hasSummary: function(meta) {
      return !_.isNil(meta.summary);
    },
    isBlockInEditMode: function(blocksInEditMode) {
      return !_.isNil(this.document.meta.id) && _.includes(blocksInEditMode, this.document.meta.id);
    },
    triggerChangeBlock: function(content) {
      this.$emit('metaChanged', content);
    }
  }
})

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
    '       :windowWidth="windowWidth"',
    '       @switchEditMode="switchEditMode"',
    '       @activateHeaderEditMode="triggerBlockEditMode"',
    '       @metaChanged="changeMeta"',
    '     />',
    '     <div class="doc-content">',
    '       <doc-block v-for="blockId in document.blockOrder" :key="blockId"',
    '         :windowWidth="windowWidth"',
    '         :isInEditMode="isInEditMode"',
    '         :blocksInEditMode="document.blocksInEditMode"',
    '         :block="document.blocks[blockId]"',
    '         :first="document.blockOrder.indexOf(blockId)===0"',
    '         :last="document.blockOrder.indexOf(blockId)===(document.blockOrder.length-1)"',
    '         :path="path"',
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
        meta: {},
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
      this.$set(this.document.blocks[changedBlock.id],'content', changedBlock.content);
      this.autoSaveContent();
    },
    changeMeta: function(metaBlock) {
      var meta = docDriven.parseMeta(metaBlock.content, this.document.meta.id);
      this.$set(this.document, 'meta', meta);
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
      this.$set(this.document, 'meta', document.meta);
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
    }, 200),
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