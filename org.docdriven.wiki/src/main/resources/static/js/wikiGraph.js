class WikiGraph {
  constructor() {
    // Creates the default style for vertices
    this.vertexStyle = [];
    this.vertexStyle[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    this.vertexStyle[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    this.vertexStyle[mxConstants.STYLE_STROKECOLOR] = 'black';
    this.vertexStyle[mxConstants.STYLE_ROUNDED] = false;
    this.vertexStyle[mxConstants.STYLE_FILLCOLOR] = 'white';
    this.vertexStyle[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
    this.vertexStyle[mxConstants.STYLE_FONTCOLOR] = 'black';
    this.vertexStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    this.vertexStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    this.vertexStyle[mxConstants.STYLE_FONTSIZE] = '12';
    this.vertexStyle[mxConstants.STYLE_FONTSTYLE] = 0;

    // Creates the default style for edges
    this.edgeStyle = [];
    this.edgeStyle[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
    this.edgeStyle[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_BLOCK;
    this.edgeStyle[mxConstants.STYLE_FONTCOLOR] = 'black';
    this.edgeStyle[mxConstants.STYLE_STROKECOLOR] = 'black';
    this.edgeStyle[mxConstants.STYLE_FONTSIZE] = '12';
    this.edgeStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    this.edgeStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
  }

  initStyle(graph) {
    graph.getStylesheet().putDefaultVertexStyle(this.vertexStyle);
    graph.getStylesheet().putDefaultEdgeStyle(this.edgeStyle);
  }
}

