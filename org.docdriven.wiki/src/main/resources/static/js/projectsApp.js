import BreadCrumbs from './components/breadcrumbs.js';

Vue.component('doc-breadcrumbs', BreadCrumbs);

Vue.component('doc-project-info', {
  template: `
    <div class="doc-project-info">
     <div class="doc-project-info-title"><a :href="toProjectHref(name)">{{name}}</a></div>
     <div class="doc-project-info-toolbar">
      <i class="fa fa-external-link doc-selectable" aria-hidden="true" @click="copyExternalLink"></i>
    </div>
     <div class="doc-project-info-toolbar"></div>
    </div>
  `,
  props: ['name','path'],
  methods: {
    toProjectHref: function(name) {
      return 'projects/' + name;
    },
    copyExternalLink: function() {
      var dt = new clipboard.DT();
      dt.setData("text/plain", this.path);
      clipboard.write(dt);
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
    '     <doc-project-info v-for="project in projects" :key="project.name" :name="project.name" :path="project.path"/>',
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