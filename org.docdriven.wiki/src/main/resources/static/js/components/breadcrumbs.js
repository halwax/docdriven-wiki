Vue.component('doc-breadcrumbs', {
  template: [
    '<div class="doc-breadcrumb" >',
    '  <a v-for="breadcrumb in toBreadcrumbs(path)" :href="breadcrumb.href"><span>{{breadcrumb.name}}</span></a>',
    '</div>'
  ].join('\n'),
  props:['path'],
  methods: {
    toBreadcrumbs : function(path) {
      var href = '/'
      if(_.startsWith(path,'#')) {
        href = '#';
      }
      var result = [{
        href: href,
        name: 'wiki'
      }];
      if((path!==null || path!==undefined) && path!=='') {
        var breadcrumbs = path.split('/');
        for(var i=0; i < breadcrumbs.length; i++) {
          var breadcrumbName = breadcrumbs[i];
          if(_.isEmpty(breadcrumbName)) {
            continue;
          }
          if(breadcrumbName.charAt(0) != '#') {
            breadcrumbName = '/' + breadcrumbName;
          }
          if(breadcrumbName.includes('#')) {
            
            var hashIndex = breadcrumbName.indexOf('#');
            
            var breadcrumbNameWithoutHash = breadcrumbName.slice(0,hashIndex);
            var hrefBreadcrumbWithoutHash = breadcrumbs.slice(0,i).join('/') + breadcrumbNameWithoutHash;

            result.push({
              href: hrefBreadcrumbWithoutHash,
              name: breadcrumbNameWithoutHash
            })

            var breadcrumbNameWithHash = breadcrumbName.slice(hashIndex,breadcrumbName.length);
            var hrefBreadcrumbWithHash = hrefBreadcrumbWithoutHash + breadcrumbNameWithHash;

            result.push({
              href: hrefBreadcrumbWithHash,
              name: breadcrumbNameWithHash
            })

          } else {
            var hrefBreadcrumb = breadcrumbs.slice(0,i+1).join('/');
            result.push({
              href: hrefBreadcrumb,
              name: breadcrumbName
            })
          }
        }        
      }
      return result;
    }
  }
})