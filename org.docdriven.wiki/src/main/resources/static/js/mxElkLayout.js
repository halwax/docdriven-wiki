function mxElkLayout(graph, algorithmName) {
  mxGraphLayout.call(this, graph);
  this.algorithmName = (algorithmName != null) ? algorithmName : 'layered';
};


mxElkLayout.prototype = new mxGraphLayout();
mxElkLayout.prototype.constructor = mxElkLayout;

/**
 * Variable: elk algorithm name
 * 
 * 'layered', 'stress', 'mrtree', 'radial', 'force', 'disco', 'box', 'fixed', 'random'
 */
mxElkLayout.prototype.algorithmName = null;

mxElkLayout.prototype.direction = null;

/**
 * Uses canvas.measureText to compute and return the width of the given text of given font in pixels.
 * 
 * @param {String} text The text to be rendered.
 * @param {String} font The css font descriptor that text is to be rendered with (e.g. "bold 14px verdana").
 * 
 * @see https://stackoverflow.com/questions/118241/calculate-text-width-with-javascript/21015393#21015393
 */
mxElkLayout.prototype.getTextWidth = function(text, font) {
  // re-use canvas object for better performance
  var canvas = this.getTextWidth.canvas || (this.getTextWidth.canvas = document.createElement("canvas"));
  var context = canvas.getContext("2d");
  context.font = font;
  var metrics = context.measureText(text);
  return metrics.width;
}

mxElkLayout.prototype.getTextHeight = function(style) {
 return parseInt(style.fontSize, 10);
}

mxElkLayout.prototype.getDefaultStyle = function() {
 var div = this.getDefaultStyle.div;
 if(_.isNil(div)) {
   this.getDefaultStyle.div = document.createElement('div');
   div = this.getDefaultStyle.div;
   document.body.appendChild(div);
 }
 return window.getComputedStyle(div);
}

mxElkLayout.prototype.getTextBox = function(text, style) {
 return {
   text: text,
   width: this.getTextWidth(text, style.font),
   height: this.getTextHeight(style)
 };
}

mxElkLayout.prototype.getDefaultTextBox = function(text) {
 return this.getTextBox(text, this.getDefaultStyle());
}

/**
 * Function: execute
 * 
 * Implements <mxGraphLayout.execute>.
 */
mxElkLayout.prototype.execute = function (parent, onUpdateGraph) {
  var model = this.graph.getModel();

  var elkObj = {};
  elkObj.id = "root";
  elkObj.children = [];
  elkObj.edges = [];
  elkObj.layoutOptions = {
    'elk.algorithm': this.algorithmName
  };

  if(this.direction!==undefined && this.direction!==null) {
    elkObj.layoutOptions['elk.direction'] = this.direction;
  }

  var childCount = model.getChildCount(parent);
  for (var i = 0; i < childCount; i++) {
    var cell = model.getChildAt(parent, i);
    if (!this.isVertexIgnored(cell)) {
      var bounds = this.getVertexBounds(cell);
      elkObj.children.push({
        id: cell.id,
        width: bounds.width,
        height: bounds.height
      })
    } else if (!this.isEdgeIgnored(cell)) {
      var sourceCell = cell.getTerminal(true);
      var targetCell = cell.getTerminal(false);
      var elkEdge = {
        id: cell.id,
        sources: [sourceCell.id],
        targets: [targetCell.id],
        labels: []
      };
      if(cell.value!==undefined && cell.value!==null) {
        var edgeLabelBox = this.getDefaultTextBox(cell.value);

        elkEdge.labels.push({
          text: cell.value,
          width: edgeLabelBox.width,
          height: edgeLabelBox.height
        })
      }
      elkObj.edges.push(elkEdge);
    }
  }

  var elk = new ELK();
  elk.layout(elkObj).then(function (g) {
    model.beginUpdate();
    try {

      for (var nI = 0; nI < g.children.length; nI++) {
        var eNode = g.children[nI];
        var nodeCell = model.getCell(eNode.id);
        var geometry = nodeCell.getGeometry();
        this.graph.translateCell(nodeCell, eNode.x - geometry.x, eNode.y - geometry.y);
      }

      for (var eI = 0; eI < g.edges.length; eI++) {
        var eEdge = g.edges[eI];
        var edgeCell = model.getCell(eEdge.id);

        var points = [];
        for (var iS = 0; iS < eEdge.sections.length; iS++) {
          var section = eEdge.sections[iS];
          points.push(new mxPoint(section.startPoint.x, section.startPoint.y));
          for (var bI = 0; bI < _.size(section.bendPoints); bI++) {
            var bendPoint = section.bendPoints[bI];
            points.push(new mxPoint(bendPoint.x,bendPoint.y));
          }
          points.push(new mxPoint(section.endPoint.x, section.endPoint.y));
        }
        let geometry = edgeCell.getGeometry().clone();
        geometry.points = points;
        edgeCell.setGeometry(geometry);
      }
    } finally {
      model.endUpdate();
    }
    if(onUpdateGraph !== undefined && onUpdateGraph !== null) {
      onUpdateGraph(this)
    }
  }.bind(this));
};