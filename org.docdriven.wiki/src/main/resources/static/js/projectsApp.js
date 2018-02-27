Vue.component('doc-project-info', {
  template: [
    '<div class="doc-project-info">',
    ' <div class="doc-project-info-title"><a :href="toProjectHref(name)">{{name}}</a></div>',
    //' <div class="doc-project-info-toolbar"><i class="fa fa-cogs" aria-hidden="true"></i></div>',
    ' <div class="doc-project-info-toolbar"></div>',
    '</div>'
  ].join('\n'),
  props: ['name'],
  methods: {
    toProjectHref: function(name) {
      return 'projects/' + name;
    }
  }
})

Vue.component('doc-projects', {
  template: [
    '<div class="doc-projects">',
    ' <header>',
    '   <doc-breadcrumbs :path="path"/>',
    ' </header>',
    ' <main>',
    '   <nav>',
    '   </nav>',
    '   <div class="doc-body">',
    '     <h1>Projects</h1>',
    '     <doc-project-info v-for="project in projects" :key="project.name" :name="project.name" />',
    '   </div>',
    ' </main>',
    '</div>'
  ].join('\n'),
  data: function() {
    return {
      'path':'projects',
      projects: []
    }
  },
  mounted: function() {
    this.loadContent();
  },
  methods: {
    loadContent: function() {
      var initContent = this.initContent;
      axios.get('/api/projects').then(function (response) {
        initContent(response.data);
      })
    },
    initContent: function(data) {
      this.projects = data;
    }
  }
})

new Vue({
  el: '.projects-app'
})