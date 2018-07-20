/**
 * Constructs a new edit file dialog.
 */
var EditSvgDiagramDialog = function (editorUi) {
  var div = document.createElement('div');
  div.style.textAlign = 'right';
  var textarea = document.createElement('textarea');
  textarea.setAttribute('wrap', 'off');
  textarea.setAttribute('spellcheck', 'false');
  textarea.setAttribute('autocorrect', 'off');
  textarea.setAttribute('autocomplete', 'off');
  textarea.setAttribute('autocapitalize', 'off');
  textarea.style.overflow = 'auto';
  textarea.style.resize = 'none';
  textarea.style.width = '600px';
  textarea.style.height = '360px';
  textarea.style.marginBottom = '16px';

  textarea.value = EditSvgDiagramDialog.toSvg(editorUi.editor);
  div.appendChild(textarea);

  this.init = function () {
    textarea.focus();
  };

  // Enables dropping files
  if (Graph.fileSupport) {
    function handleDrop(evt) {
      evt.stopPropagation();
      evt.preventDefault();

      if (evt.dataTransfer.files.length > 0) {
        var file = evt.dataTransfer.files[0];
        var reader = new FileReader();

        reader.onload = function (e) {
          textarea.value = e.target.result;
        };

        reader.readAsText(file);
      }
      else {
        textarea.value = editorUi.extractGraphModelFromEvent(evt);
      }
    };

    function handleDragOver(evt) {
      evt.stopPropagation();
      evt.preventDefault();
    };

    // Setup the dnd listeners.
    textarea.addEventListener('dragover', handleDragOver, false);
    textarea.addEventListener('drop', handleDrop, false);
  }

  var cancelBtn = mxUtils.button(mxResources.get('cancel'), function () {
    editorUi.hideDialog();
  });
  cancelBtn.className = 'geBtn';

  if (editorUi.editor.cancelFirst) {
    div.appendChild(cancelBtn);
  }

  var select = document.createElement('select');
  select.style.width = '180px';
  select.className = 'geBtn';

  if (editorUi.editor.graph.isEnabled()) {
    var replaceOption = document.createElement('option');
    replaceOption.setAttribute('value', 'replace');
    mxUtils.write(replaceOption, mxResources.get('replaceExistingDrawing'));
    select.appendChild(replaceOption);
  }

  var newOption = document.createElement('option');
  newOption.setAttribute('value', 'new');
  mxUtils.write(newOption, mxResources.get('openInNewWindow'));

  if (EditSvgDiagramDialog.showNewWindowOption) {
    select.appendChild(newOption);
  }

  if (editorUi.editor.graph.isEnabled()) {
    var importOption = document.createElement('option');
    importOption.setAttribute('value', 'import');
    mxUtils.write(importOption, mxResources.get('addToExistingDrawing'));
    select.appendChild(importOption);
  }

  div.appendChild(select);

  var okBtn = mxUtils.button(mxResources.get('ok'), function () {
    // Removes all illegal control characters before parsing
    var svgData = editorUi.editor.graph.zapGremlins(mxUtils.trim(textarea.value));
    var svg = mxUtils.parseXml(svgData);
    var data = mxUtils.getXml(svg.documentElement.querySelector('mxGraphModel'));
    var error = null;

    if (select.value == 'new') {
      window.openFile = new OpenFile(function () {
        editorUi.hideDialog();
        window.openFile = null;
      });

      window.openFile.setData(data, null);
      editorUi.editor.graph.openLink(editorUi.getUrl());
    }
    else if (select.value == 'replace') {
      editorUi.editor.graph.model.beginUpdate();
      try {
        editorUi.editor.setGraphXml(mxUtils.parseXml(data).documentElement);
        // LATER: Why is hideDialog between begin-/endUpdate faster?
        editorUi.hideDialog();
      }
      catch (e) {
        error = e;
      }
      finally {
        editorUi.editor.graph.model.endUpdate();
      }
    }
    else if (select.value == 'import') {
      editorUi.editor.graph.model.beginUpdate();
      try {
        var doc = mxUtils.parseXml(data);
        var model = new mxGraphModel();
        var codec = new mxCodec(doc);
        codec.decode(doc.documentElement, model);

        var children = model.getChildren(model.getChildAt(model.getRoot(), 0));
        editorUi.editor.graph.setSelectionCells(editorUi.editor.graph.importCells(children));

        // LATER: Why is hideDialog between begin-/endUpdate faster?
        editorUi.hideDialog();
      }
      catch (e) {
        error = e;
      }
      finally {
        editorUi.editor.graph.model.endUpdate();
      }
    }

    if (error != null) {
      mxUtils.alert(error.message);
    }
  });
  okBtn.className = 'geBtn gePrimaryBtn';
  div.appendChild(okBtn);

  if (!editorUi.editor.cancelFirst) {
    div.appendChild(cancelBtn);
  }

  this.container = div;
};

EditSvgDiagramDialog.toSvg = function (editor) {
  
  var graph = editor.graph;

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

  root.appendChild(editor.getGraphXml());

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
  return mxUtils.getPrettyXml(root);
};

/**
 * 
 */
EditSvgDiagramDialog.showNewWindowOption = true;

(function () {

  var hideAction = function (action) {
    action.setEnabled(false);
    action.visible = false;
  };

  var actionsInit = Actions.prototype.init;
  Actions.prototype.init = function () {
    actionsInit.apply(this, arguments);
    var ui = this.editorUi;
    this.addAction('editSVGDiagram...', function () {
      var dlg = new EditSvgDiagramDialog(ui);
      ui.showDialog(dlg.container, 620, 420, true, false);
      dlg.init();
    });

    hideAction(this.get('open'));
    hideAction(this.get('import'));
    hideAction(this.get('save'));
    hideAction(this.get('saveAs'));
    hideAction(this.get('export'));
  }

  var menusInit = Menus.prototype.init;
  Menus.prototype.init = function () {
    menusInit.apply(this, arguments);

    this.put('extras', new Menu(mxUtils.bind(this, function (menu, parent) {
      this.addMenuItems(menu, ['copyConnect', 'collapseExpand', '-', 'editDiagram', 'editSVGDiagram']);
    })));
  };

  // Adds required resources (disables loading of fallback properties, this can only
  // be used if we know that all keys are defined in the language specific file)
  mxResources.loadDefaultBundle = false;
  var bundle = mxResources.getDefaultBundle(RESOURCE_BASE, mxLanguage) ||
    mxResources.getSpecialBundle(RESOURCE_BASE, mxLanguage);
  // Fixes possible asynchronous requests
  mxUtils.getAll([bundle, STYLE_PATH + '/default.xml'], function (xhr) {
    // Adds bundle text to resources
    mxResources.parse(xhr[0].getText());

    // Configures the default graph theme
    var themes = new Object();
    themes[Graph.prototype.defaultThemeName] = xhr[1].getDocumentElement();

    // Main
    document.editorUI = new EditorUi(new Editor(urlParams['chrome'] == '0', themes));
  }, function () {
    document.body.innerHTML = '<center style="margin-top:10%;">Error loading resource files. Please check browser console.</center>';
  });
})();