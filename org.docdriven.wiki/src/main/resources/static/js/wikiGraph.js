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

  mxGraphToSvg(graph) {
    var background = '#ffffff';
    var scale = 1;
    var border = 1;
    
    var imgExport = new mxImageExport();
    var bounds = graph.getGraphBounds();
    var vs = graph.view.scale;
    // Prepares SVG document that holds the output
    var svgDoc = mxUtils.createXmlDocument();
    var root = (svgDoc.createElementNS != null) ?
          svgDoc.createElementNS(mxConstants.NS_SVG, 'svg') : svgDoc.createElement('svg');
      
    if (background != null) {
      if (root.style != null) {
        root.style.backgroundColor = background;
      } else {
        root.setAttribute('style', 'background-color:' + background);
      }
    }
      
    if (svgDoc.createElementNS == null) {
        root.setAttribute('xmlns', mxConstants.NS_SVG);
        root.setAttribute('xmlns:xlink', mxConstants.NS_XLINK);
    } else {
      // KNOWN: Ignored in IE9-11, adds namespace for each image element instead. No workaround.
      root.setAttributeNS('http://www.w3.org/2000/xmlns/', 'xmlns:xlink', mxConstants.NS_XLINK);
    }
    
    root.setAttribute('width', (Math.ceil(bounds.width * scale / vs) + 2 * border) + 'px');
    root.setAttribute('height', (Math.ceil(bounds.height * scale / vs) + 2 * border) + 'px');
    root.setAttribute('version', '1.1');
    
      // Adds group for anti-aliasing via transform
    var group = (svgDoc.createElementNS != null) ?
        svgDoc.createElementNS(mxConstants.NS_SVG, 'g') : svgDoc.createElement('g');
    group.setAttribute('transform', 'translate(0.5,0.5)');
    root.appendChild(group);
    svgDoc.appendChild(root);
      // Renders graph. Offset will be multiplied with state's scale when painting state.
    var svgCanvas = new mxSvgCanvas2D(group);
    svgCanvas.translate(Math.floor((border / scale - bounds.x) / vs), Math.floor((border / scale - bounds.y) / vs));
    svgCanvas.scale(scale / vs);
    // Displayed if a viewer does not support foreignObjects (which is needed to HTML output)
    svgCanvas.foAltText = '[Not supported by viewer]';
    imgExport.drawState(graph.getView().getState(graph.model.root), svgCanvas);
    return mxUtils.getXml(root);
  }
}

export default WikiGraph;

