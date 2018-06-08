class WikiGraph {

  constructor(graphDiv) {
    this.innerGraph = new mxGraph(graphDiv);
    this.graphDiv = graphDiv;
    this.asyncLayout = false;
    this.title = null;
    this.titleCell = null;
    this.legend = null;
    this.legendCell = null;
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

  getXmlNode() {
    var enc = new mxCodec();
    return enc.encode(this.innerGraph.getModel());
  }

  getXml() {
    return mxUtils.getXml(this.getXmlNode());
  }

  setXml(xml) {
    let xmlNode = mxUtils.parseXml(xml);
    this.setXmlNode(xmlNode);
  }

  setXmlNode(xmlNode) {
    let decoder = new mxCodec(xmlNode);
    let documentNode = xmlNode.documentElement;
    decoder.decode(documentNode, this.innerGraph.getModel());
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
    edgeStyle[mxConstants.STYLE_ENDARROW] = mxConstants.ARROW_BLOCK;
    edgeStyle[mxConstants.STYLE_FONTCOLOR] = 'black';
    edgeStyle[mxConstants.STYLE_STROKECOLOR] = 'black';
    edgeStyle[mxConstants.STYLE_FONTSIZE] = '12';
    edgeStyle[mxConstants.STYLE_ALIGN] = mxConstants.ALIGN_LEFT;
    edgeStyle[mxConstants.STYLE_VERTICAL_ALIGN] = mxConstants.ALIGN_TOP;

    this.innerGraph.getStylesheet().putDefaultVertexStyle(vertexStyle);
    this.innerGraph.getStylesheet().putDefaultEdgeStyle(edgeStyle);

    var labelStyle = new Object();
    labelStyle[mxConstants.STYLE_STROKE_OPACITY] = 0;
    this.innerGraph.getStylesheet().putCellStyle('LABEL', labelStyle);    

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

  updateCellSize(cell) {
    var cellArray = _.castArray(cell);
    for (var i = 0; i < cellArray.length; i++) {
      this.innerGraph.updateCellSize(cellArray[i]);
    }
  }

  insertHtmlNode(htmlContent, boxSizeOpt, xOpt, yOpt, strokeWidthOpt) {
    let boxSize = _.isNil(boxSizeOpt) ? {width: 10, height: 10} : boxSizeOpt;
    let x = _.isNil(xOpt) ? 0 : xOpt;
    let y = _.isNil(yOpt) ? 0 : yOpt;
    let strokeWidth = _.isNil(strokeWidthOpt) ? 1 : strokeWidthOpt;

    let nodeCell = this.innerGraph.insertVertex(this.getDefaultParent(), null, htmlContent,
        x, y,
        boxSize.width, boxSize.height,
        'strokeWidth='+ strokeWidth + ';rounded=1;absoluteArcSize=1;arcSize=5;spacing=4;');

    if(_.isNil(boxSizeOpt)) {
      this.updateCellSize(nodeCell);
    }

    return nodeCell;
  }

  insertBox(title, description, boxSize, xOpt, yOpt) {
    return this.insertHtmlNode([
      '<h3>' + title + '</h3>',
      description
    ].join(''), boxSize,
      xOpt, yOpt);
  }

  setTitle(title) {
    this.title = title;
  }

  setLegend(legend) {
    this.legend = legend;
  }

  connectNodes(node1, node2, htmlLabel, strokeWidthOpt, additionalEdgeStyleOpt) {
    let strokeWidth = _.isNil(strokeWidthOpt) ? 1.0 : strokeWidthOpt;
    let additionalEdgeStyle = _.isNil(additionalEdgeStyleOpt) ? '' : additionalEdgeStyleOpt;
    let edgeStyle = 'strokeWidth=' + strokeWidth + ';';
    this.innerGraph.insertEdge(this.getDefaultParent(), null, htmlLabel, node1, node2, edgeStyle + additionalEdgeStyle);
  }

  connectBoxes(box1, box2, label) {
    let edgeStyle = 'strokeWidth=1.3;rounded=1;';
    this.innerGraph.insertEdge(this.getDefaultParent(), null, label, box1, box2, edgeStyle);
  }

  hierarchicalLayout(interRankCellSpacingOpt) {
    var layout = new mxHierarchicalLayout(this.innerGraph);
    if(!_.isNil(interRankCellSpacingOpt)) {
      layout.interRankCellSpacing = interRankCellSpacingOpt;
    }
    layout.execute(this.getDefaultParent());
    this.finishGraph();
  }

  getHeight() {
    let parent = this.getDefaultParent();
    let childCount = this.innerGraph.model.getChildCount(parent);
    let maxYPosition = 0;
    for(let i = 0; i < childCount; i++) {
      let childCell = this.innerGraph.model.getChildAt(parent, i);
      let geometry = childCell.getGeometry();
      maxYPosition = Math.max(maxYPosition, geometry.y + geometry.height);
    }
    return maxYPosition;    
  }

  finishGraph() {
    if(!_.isNil(this.title)) {
      let titleCell = this.innerGraph.insertVertex(this.getDefaultParent(), null,
        '<div style="text-decoration: underline">'+this.title+'</div>',
        0, 0, 10, 10, 'LABEL');
      this.updateCellSize(titleCell);
      let geometry = titleCell.getGeometry();
      this.innerGraph.translateCell(titleCell, 0, - geometry.height - 10);  
      this.titleCell = titleCell;
    }
    if(!_.isNil(this.legend)) {
      let graphHeight = this.getHeight();
      let bounds = this.innerGraph.getGraphBounds();
      let legendCell = this.innerGraph.insertVertex(this.getDefaultParent(), null,
        this.legend, 
        0, graphHeight + 10, 0, 0, 'LABEL');
      this.updateCellSize(legendCell);
      this.legendCell = legendCell;
    }
  }

  updateGraphAfterLayout() {
    if(!_.isNil(this.titleCell)) {
      this.titleCell.removeFromParent();
    }
    if(!_.isNil(this.legendCell)) {
      this.legendCell.removeFromParent();
    }
    this.finishGraph();
  }

  elkLayout(directionOpt) {
    let layout = new mxElkLayout(this.innerGraph);
    if(!_.isNil(directionOpt)) {
      layout.direction = directionOpt;
    }
    layout.execute(this.getDefaultParent(), function() {
      this.updateGraphAfterLayout();
      if(!_.isNil(this.onUpdateGraph)) {
        this.onUpdateGraph();
      }
    }.bind(this));
    this.asyncLayout = true;
  }
}

export default WikiGraph;

