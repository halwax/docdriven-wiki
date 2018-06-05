class WikiGraph {

  constructor(graphDiv) {
    this.innerGraph = new mxGraph(graphDiv);
    this.graphDiv = graphDiv;
    this.asyncLayout = false;
  }

  getModel() {
    return this.innerGraph.getModel();
  }

  getGraph() {
    return this.innerGraph;
  }

  getDefaultParent() {
    return this.innerGraph.getDefaultParent();
  }

  destroy() {
    this.innerGraph.destroy();
  }

  applyStyle() {
    // Creates the default style for vertices
    let vertexStyle = [];

    vertexStyle[mxConstants.STYLE_SHAPE] = mxConstants.SHAPE_RECTANGLE;
    vertexStyle[mxConstants.STYLE_PERIMETER] = mxPerimeter.RectanglePerimeter;
    vertexStyle[mxConstants.STYLE_STROKECOLOR] = 'black';
    vertexStyle[mxConstants.STYLE_ROUNDED] = false;
    vertexStyle[mxConstants.STYLE_FILLCOLOR] = 'white';
    vertexStyle[mxConstants.STYLE_GRADIENTCOLOR] = 'white';
    vertexStyle[mxConstants.STYLE_FONTCOLOR] = 'black';
    vertexStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    vertexStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;
    vertexStyle[mxConstants.STYLE_FONTSIZE] = '12';
    vertexStyle[mxConstants.STYLE_FONTSTYLE] = 0;

    // Creates the default style for edges
    let edgeStyle = [];
    edgeStyle[mxConstants.STYLE_EDGE] = mxEdgeStyle.ElbowConnector;
    edgeStyle[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_BLOCK;
    edgeStyle[mxConstants.STYLE_FONTCOLOR] = 'black';
    edgeStyle[mxConstants.STYLE_STROKECOLOR] = 'black';
    edgeStyle[mxConstants.STYLE_FONTSIZE] = '12';
    edgeStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    edgeStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;

    this.innerGraph.getStylesheet().putDefaultVertexStyle(vertexStyle);
    this.innerGraph.getStylesheet().putDefaultEdgeStyle(edgeStyle);

    this.innerGraph.setHtmlLabels(true);
  }

  toSvg() {
    var background = '#ffffff';
    var scale = 1;
    var border = 1;
    
    var imgExport = new mxImageExport();
    var bounds = this.innerGraph.getGraphBounds();
    var vs = this.innerGraph.view.scale;
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
    imgExport.drawState(this.innerGraph.getView().getState(this.innerGraph.model.root), svgCanvas);
    return mxUtils.getXml(root);
  }

  insertHtmlNode(htmlContent, boxSize, xOpt, yOpt) {
    let x = _.isNil(xOpt) ? 0 : xOpt;
    let y = _.isNil(yOpt) ? 0 : yOpt;

    return this.innerGraph.insertVertex(this.getDefaultParent(), null, htmlContent, 
        x, y, 
        boxSize.width, boxSize.height, 
        'verticalAlign=middle;align=center;overflow=fill;whiteSpace=wrap;strokeWidth=2;rounded=1;');    
  }

  insertBox(title, description, boxSize, xOpt, yOpt) {
    return this.insertHtmlNode([
            '<b>'+title+'</b><hr/>',
            description
        ].join(''), boxSize,
        xOpt, yOpt);
  }

  connectNodes(node1, node2, htmlLabel, strokeWidthOpt, additionalEdgeStyleOpt) {
    let strokeWidth = _.isNil(strokeWidthOpt) ? 1.3 : strokeWidthOpt;
    let additionalEdgeStyle = _.isNil(additionalEdgeStyleOpt) ? '' : additionalEdgeStyleOpt;
    let edgeStyle = 'strokeWidth='+ strokeWidth + ';rounded=1;';
    this.innerGraph.insertEdge(this.getDefaultParent(), null, htmlLabel, node1, node2, edgeStyle + additionalEdgeStyle);    
  }

  connectBoxes(box1, box2, label) {
    let edgeStyle = 'strokeWidth=1.3;rounded=1;';
    this.innerGraph.insertEdge(this.getDefaultParent(), null, label, box1, box2, edgeStyle);
  }

  elkLayout() {
    let layout = new mxElkLayout(this.innerGraph);
    layout.execute(this.getDefaultParent(), this.onUpdateGraph);
    this.asyncLayout = true;
  }
}

export default WikiGraph;

