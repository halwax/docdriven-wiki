require.config({ paths: { 'vs': 'monaco-editor/min/vs' }});

var docDriven = new DocDriven();

Vue.component('doc-editable',{
  template: [
    '<div>',
    ' <div class="doc-editable" v-show="active" contenteditable="true" @input="update">{{editableContent}}</div>',
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
    '<div',
    ' v-bind:class="{ \'doc-editable\': isInEditMode }"',
    ' v-show="show"',
    ' v-html="compiledMarkdown"',
    ' @click="onDivClick"',
    '>',
    '</div>'
  ].join('\n'),
  props: ['show', 'content', 'isInEditMode'],
  computed: {
    compiledMarkdown: function () {
      return window.markdownit().render(this.content)
    }
  },
  methods: {
    onDivClick: function(e) {
      if(this.isInEditMode) {
        this.$emit('activateBlockEditMode');
      }
    }
  }
});

Vue.component('doc-block-toolbar', {
	template: [
    '<div class="doc-block-toolbar" v-show="show">',
    ' <i class="fa-file-code-o fa doc-selectable"></i>',
    ' <i class="fa-file-text-o fa doc-selectable"></i>',
    ' <i class="fa-arrow-down fa doc-selectable"></i>',
    ' <i class="fa-arrow-up fa doc-selectable"></i>',
    '</div>'
    ].join('\n'),
    props: ['show']
});

/**
 * Moncao Editor Component
 */
Vue.component('doc-block-editor', {
  template : '<div style="width:100%;height:400px" class="doc-editable" v-show="show"></div>',
  props: ['show', 'content', 'windowWidth', 'language'],
  watch: {
    windowWidth: function(newWindowWidth) {
      if(this.editor) {
        this.editor.layout();
      }
    }
  },
  updated: function() {
    this.editor.layout();
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
        value: this.content,
        language: this.language
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
      this.editor = window.monaco.editor.create(this.$el, this.editorOptions);
      var triggerChangeContent = this.triggerChangeContent;
      this.editor.onDidChangeModelContent(function(e){
        triggerChangeContent(e);
      });
    },
    triggerChangeContent: _.debounce(function (e) {
      var content = this.editor.getValue();
      this.$emit('contentChanged',content);
    }, 300),
    destroyMonaco: function() {
      if (typeof this.editor !== 'undefined') {
        this.editor.dispose();
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
  	'  <doc-block-toolbar :show="isInEditMode"/>',
    '  <doc-block-editor', 
    '   :show="isInBlockEditMode"'+
    '   :content="block.content"'+
    '   :windowWidth="windowWidth"'+
    '   @contentChanged="triggerChangeContent"/>',
    '  <doc-block-markdown',
    '   :show="!isInBlockEditMode"',
    '   :isInEditMode="isInEditMode"',
    '   :content="block.content"'+
    '   @activateBlockEditMode="triggerBlockEditMode"'+
    '  />',
    '</div>'
  ].join('\n'),
  props: ['isInEditMode', 'windowWidth', 'block'],
  data: function() {
    return {
      isInBlockEditMode: false
    }
  },
  methods: {
    triggerChangeContent: function(content) {
      this.$emit('contentChanged', content);
    },
    triggerBlockEditMode: function(e) {
      this.isInBlockEditMode = true;
    }
  }
})

Vue.component('doc-header',{
  template: [
    '<div>',
    ' <!-- Header Section -->',
    ' <div class="doc-header">',
    '   <div class="doc-toolbar">',
    '    <i class="fa fa-download fa-lg doc-selectable"></i>',
    '    <i class="fa fa-eye fa-lg doc-selectable" v-show="isInEditMode" @click="switchEditMode"></i>',
    '    <i class="fa fa-pencil-square-o fa-lg doc-selectable" v-show="!isInEditMode" @click="switchEditMode"></i>',
    '   </div>',
    '   <h1><doc-editable :active="isInEditMode" :content="document.meta.title" @update="updateTitel"/></h1>',
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
    updateTitel: function(title) {
      this.$emit('updateTitle', title);
    },
    updateSummary: function(summary) {
      this.$emit('updateSummary', summary);
    }
  }
})

/**
 * Main Component which manages a Document in a Wiki-like way.
 */
Vue.component('doc-wiki', {
  template: [
    '<div>',
    ' <doc-header v-bind:document="document"',
    '   :isInEditMode="isInEditMode"',
    '   @switchEditMode="switchEditMode"',
    '   @updateTitle="updateTitle"',
    '   @updateSummary="updateSummary"',
    ' />',
    ' <div class="doc-content">',
    '  <doc-block v-for="block in document.blocks"',
    '     :windowWidth="windowWidth"',
    '     :isInEditMode="isInEditMode"',
    '     :block="block"',
    '     @contentChanged="changeContent"',
    '  />',
    ' </div>',
    '</div>'
  ].join('\n'),
  props: ['windowWidth'],
  data: function() { 
    return {
      isInEditMode: false,
      document: {
        meta: {
          title: 'Title',
          summary: 'Summary'
        },
        content: '## Content',
        blocks: [
          {
            language : 'markdown',
            content : '## Content'
          }
        ]
      }
    }
  },
  mounted: function() {
    this.loadContent();
  },
  methods: {
    switchEditMode: function() {
      this.isInEditMode = !this.isInEditMode;
    },
    changeContent: function(content) {
      this.document.content = content;
      this.autoSaveContent();
    },
    initContent: function(content) {
      var document = docDriven.extract(content);
      this.document.content = document.content;
      this.document.blocks = [{
        'language' : 'markdown',
        'content' : document.content
      }, {
        'language' : 'javascript',
        'content' : 'console.log("test");'
      }];
      this.document.meta = document.meta;
    },
    updateTitle: function(title) {
      this.document.meta.title = title;
      this.autoSaveContent();
    },
    updateSummary: function(summary) {
      this.document.meta.summary = summary;
      this.autoSaveContent();
    },
    autoSaveContent: _.debounce(function () {
      axios.post('/document', docDriven.render(this.document), {
        headers: {
          'Content-Type': 'application/json',
        }
      })
    }, 500),
    loadContent: function() {
      var initContent = this.initContent;
      axios.get('/document').then(function (response) {
        initContent(response.data);
      })
    }
  }
})

new Vue({
  el: '.wiki-app',
  data: function() { 
    return {
      windowWidth: 0,
      windowHeight: 0
    }
  },
  mounted() {
    this.$nextTick(function() {
      window.addEventListener('resize', this.loadWindowWidth);
      window.addEventListener('resize', this.loadWindowHeight);

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
    }, 300)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.loadWindowWidth);
    window.removeEventListener('resize', this.loadWindowHeight);
  }
})