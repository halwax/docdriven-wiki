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

          var isLastBreadcrumb = i===(breadcrumbs.length-1);

          var breadcrumbName = breadcrumbs[i];
          if(_.isEmpty(breadcrumbName)) {
            continue;
          }
          if(breadcrumbName.charAt(0) != '#') {
            breadcrumbName = '/' + breadcrumbName;
          }
          if(breadcrumbName.includes('#')) {
            
            var hashIndex = breadcrumbName.indexOf('#');
            
            var breadcrumbNameBeforeHash = breadcrumbName.slice(0,hashIndex);
            var hrefBreadcrumbBeforeHash = breadcrumbs.slice(0,i).join('/') + breadcrumbNameBeforeHash;

            result.push({
              // add hash to avoid page reload
              href: hrefBreadcrumbBeforeHash + '#',
              name: breadcrumbNameBeforeHash
            })

            var breadcrumbNameWithHash = breadcrumbName.slice(hashIndex,breadcrumbName.length);
            var hrefBreadcrumbWithHash = hrefBreadcrumbBeforeHash + breadcrumbNameWithHash;

            result.push({
              href: hrefBreadcrumbWithHash,
              name: breadcrumbNameWithHash
            })

          } else {
            
            var hrefBreadcrumb = breadcrumbs.slice(0,i+1).join('/');
            if(isLastBreadcrumb && !hrefBreadcrumb.includes('#')) {
              // add hash to last breadcrumb to avoid page reload
              hrefBreadcrumb = hrefBreadcrumb + '#'
            }

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