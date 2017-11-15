require.config({ paths: { 'vs': 'monaco-editor/min/vs' }});

/**
 * Markdown Component
 */
Vue.component('section-markdown', {
  template: '<div v-show="show" v-html="compiledMarkdown"></div>',
  props: ['show', 'content'],
  computed: {
    compiledMarkdown: function () {
      return window.markdownit().render(this.content)
    }
  }
});

Vue.component('section-toolbar', {
	template: [
	  '<div class="doc-section-toolbar" v-show="show">',
    ' <i class="icon-speech icons doc-selectable"></i>',
    ' <i class="icon-doc icons doc-selectable"></i>',
    '</div>'
    ].join('\n'),
    props: ['show']
});

/**
 * Moncao Editor Component
 */
Vue.component('section-editor', {
  template : '<div style="width:100%;height:400px;border:1px solid grey" v-show="show"></div>',
  props: ['show', 'content', 'windowWidth'],
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
        language: 'markdown'
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
      var handleChangedContent = this.handleChangedContent;
      this.editor.onDidChangeModelContent(function(e){
        handleChangedContent(e);
      });
    },
    handleChangedContent: _.debounce(function (e) {
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
 * Document Section, content can be modified in an Editor when in Edit Mode,
 * otherwise it renders the markdown content of a section.
 */
Vue.component('doc-section', {
  template: [
  	'<div>',
  	'  <section-toolbar v-bind:show="isInEditMode"/>',
    '  <section-editor v-bind:show="isInEditMode" v-bind:content="content" v-bind:windowWidth="windowWidth" v-on:contentChanged="changeContent"/>',
    '  <section-markdown v-bind:show="!isInEditMode" v-bind:content="content"/>',
    '</div>'
  ].join('\n'),
  props: ['isInEditMode', 'windowWidth'],
  data: function() { 
    return {
      content: [
        '## Content'
       ].join('\n')
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
      this.content = content;
      this.autoSaveContent();
    },
    initContent: function(content) {
      this.content = content;
    },
    autoSaveContent: _.debounce(function () {
      axios.post('/document', this.content, {
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

/**
 * Main Component which manages a Document in a Wiki-like way.
 */
Vue.component('doc-wiki', {
  template: [
    '<div>',
    ' <!-- Header Section -->',
    ' <div class="doc-header">',
    '   <div class="doc-toolbar">',
    '    <i class="icon-cloud-download icons doc-selectable"></i>',
    '    <i class="icon-note icons doc-selectable" v-on:click="switchEditMode"></i>',
    '   </div>',
    '   <h1>Doc Title</h1>',
    ' </div>',  
    ' <div class="doc-metainfo">',
    '  <p>',
    '    <b>Summary :</b> summary',
    '  </p>',
    ' </div>',
    ' <div class="doc-content">',
    '  <doc-section v-bind:windowWidth="windowWidth" v-bind:isInEditMode="isInEditMode"/>',
    ' </div>',
    '</div>'
  ].join('\n'),
  props: ['windowWidth'],
  data: function() { 
    return {
      isInEditMode: false
    }
  },
  methods: {
    switchEditMode: function() {
      this.isInEditMode = !this.isInEditMode;
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