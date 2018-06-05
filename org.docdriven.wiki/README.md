---
title: Doc Driven Wiki
summary: 'Documentation, Inspiration and Concepts behind Doc Driven Wiki.'

---
[//]: # (block)
## Abstract

Documentation often gets out of sync and is spread along many locations in multiple versions.
This project intends to provide tools, concepts and ideas to better provide up to date
and consistent documentation in a structured way.

It's possible to register more wiki projects in the filesystem.

## Site Structure

[//]: # (block)
```mxgraph

```
[//]: # (block)
## Technical Structure
[//]: # (block)
```mxgraph
let graph = it.graph;
let parent = it.parent;

let boxSize = {
    width: 130,
    height: 65
}

var docWiki = graph.insertBox('doc-wiki', 'entry point for the application', boxSize);
var docBreadCrumbs = graph.insertBox('doc-breadcrumbs', 'hash path links', boxSize);
var docHeader = graph.insertBox('doc-header', 'toolbar, title, summary', boxSize);
var docBlock = graph.insertBox('doc-block', 'content block', boxSize);
var docBlockEditor = graph.insertBox('doc-block-editor', 'content editor', boxSize);
var docBlockMd = graph.insertBox('doc-block-markdown', 'content markdown viewer', boxSize);

graph.connectBoxes(docWiki, docBreadCrumbs, '1');
graph.connectBoxes(docWiki, docHeader, '1');
graph.connectBoxes(docWiki, docBlock, '0..*');
graph.connectBoxes(docBlock, docBlockEditor, '1');
graph.connectBoxes(docBlock, docBlockMd, '1');
graph.connectBoxes(docHeader, docBlockEditor, '1');

var layout = new mxHierarchicalLayout(graph.getGraph());
layout.interRankCellSpacing = 55;
layout.execute(parent);
```
[//]: # (block)
The Doc Driven Wiki App is a client server application with Spring Boot for the Backend and Thymleaf in combination with VueJs in the Frontend.
The Frontend is structured in several components which are partly implemented in a Single Page Application style.

[//]: # (block)
## UI Structure

### Navigation

- Documentation supports editing of GitHub md files
- Tree-Structure navigation on the left, section navigation on the right
- Code Samples are provided in separated files and included with own styling and possibility to edit

Example <https://ant.design/components/list/> :

- Main MD file : <https://github.com/ant-design/ant-design/tree/master/components/list/index.en-US.md>
- Sample MD file : <https://github.com/ant-design/ant-design/blob/master/components/list/demo/basic.md>

## Code Editing

- VS-Code Markdown - <https://code.visualstudio.com/docs/languages/markdown> : `markdown.preview.scrollPreviewWithEditorSelection` 

## Code Execution

- Vuep (online Vue editing) - <https://cinwell.com/vuep>
- Runkit - <https://runkit.com/runkit/brain-js>
- Result as tree - <https://devblog.digimondo.io/building-a-json-tree-view-component-in-vue-js-from-scratch-in-six-steps-ce0c05c2fdd8>

## Similar products

- Kajero - <http://www.joelotter.com/kajero/>
- Markdeep - <https://casual-effects.com/markdeep/>
- API Notebook - <https://api-notebook.anypoint.mulesoft.com/>
- Daux.io - <https://daux.io>
- MDBook - <https://github.com/rust-lang-nursery/mdBook>
- Gitbook - <https://www.gitbook.com>

## Technical Base

Frameworks currently in use ...

- Vue Js - <https://vuejs.org>
- Monaco Editor - <https://github.com/Microsoft/monaco-editor>
- Markdown It - <https://github.com/markdown-it/markdown-it>
- FrontMatter - <https://github.com/jxson/front-matter>
- Font Awesome 4.7 - <https://fontawesome.com/v4.7.0/>

Frameworks that would be interesting to integrate ...

- MxGraph - <https://github.com/jgraph/mxgraph>
- QuickMockup - <https://jdittrich.github.io/quickMockup/>
- Remark - <https://github.com/wooorm/remark>
- Unified - <https://github.com/unifiedjs/unified>

Tools used ...

- Font Awesome Favicon - <https://paulferrett.com/fontawesome-favicon/>

## Documentation Guide

- Software Architecture for Developers (by Simon Brown - <http://www.codingthearchitecture.com/authors/sbrown/>)
- Wikipedia - <https://en.wikipedia.org/wiki/Wikipedia:The_perfect_article>
- http://www.literateprogramming.com/documentation.pdf
- https://doorstop.readthedocs.io/en/latest/
- https://opensource.guide/
- https://monday.com/blog/agile-project-management-scrum/

```javascript
function() {
    console.log('test');
}
```

- Code-Snippet Licensing - <http://triplecheck.tech/sourcecode.html>
- Pandoc Format - <http://pandoc.org/>
- Markdown Inline content - <https://github.com/github/markup/issues/346>
- Jekyll Templates (includes) - <https://jekyllrb.com/docs/templates/>
- StackEdit - <https://stackedit.io/>
- Markdeep - <https://casual-effects.com/markdeep/>
- <https://opensource.com/life/15/8/markup-lowdown>

## Additional References

- Save SVG as PNG - <http://dinbror.dk/blog/how-to-download-an-inline-svg-as-jpg-or-png/>
[//]: # (block:executable)
```javascript
var obj = {
    test: true
};
return obj;
```