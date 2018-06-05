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
      };
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
          points.push({
            x: section.startPoint.x,
            y: section.startPoint.y
          })
          for (var bI = 0; bI < _.size(section.bendPoints); bI++) {
            var bendPoint = section.bendPoints[bI];
            points.push({
              x: bendPoint.x,
              y: bendPoint.y
            })
          }
          points.push({
            x: section.endPoint.x,
            y: section.endPoint.y
          });
        }
        edgeCell.getGeometry().points = points;
      }
    } finally {
      model.endUpdate();
    }
    if(onUpdateGraph !== undefined && onUpdateGraph !== null) {
      onUpdateGraph(this)
    }
  }.bind(this));
};