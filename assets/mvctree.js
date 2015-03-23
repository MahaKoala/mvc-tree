/* jshint ignore:start */

/* jshint ignore:end */

define('mvctree/app', ['exports', 'ember', 'ember/resolver', 'ember/load-initializers', 'mvctree/config/environment'], function (exports, Ember, Resolver, loadInitializers, config) {

  'use strict';

  Ember['default'].MODEL_FACTORY_INJECTIONS = true;

  var App = Ember['default'].Application.extend({
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix,
    Resolver: Resolver['default']
  });

  loadInitializers['default'](App, config['default'].modulePrefix);

  exports['default'] = App;

});
define('mvctree/components/definitions-showcase', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({

    allPatterns: null,

    availablePatterns: (function () {
      var currPatternId = this.get("currPatternId"),
          allPatterns = this.get("allPatterns");

      if (!allPatterns) {
        return null;
      }

      return allPatterns.filter(function (pattern) {
        if (pattern.id === currPatternId || !pattern.get("definitions")) {
          return false;
        }

        return true;
      }).sortBy("name").toArray();
    }).property("allPatterns"),

    selectedPatternId: null,

    selectedPattern: (function () {
      var selectedPatternId = this.get("selectedPatternId");

      if (!selectedPatternId) {
        return null;
      }

      var availablePatterns = this.get("availablePatterns");

      for (var i = 0; availablePatterns.length; i++) {
        var pattern = availablePatterns[i];
        if (pattern.id === selectedPatternId) {
          return pattern;
        }
      }

      return null;
    }).property("selectedPatternId")

  });

});
define('mvctree/components/tabbed-drawer', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Component.extend({

    tagName: "section",

    classNames: ["tabbed_drawer"],

    classNameBindings: ["isDrawerShown"],

    isDrawerShown: true,

    actions: {
      toggleDrawer: function toggleDrawer() {
        this.toggleProperty("isDrawerShown");
      }
    }
  });

});
define('mvctree/controllers/index', ['exports', 'ember', 'mvctree/mixins/path-factory'], function (exports, Ember, PathFactory) {

  'use strict';

  exports['default'] = Ember['default'].Controller.extend(PathFactory['default'], {

    gridNodes: (function () {
      var model = this.get("model"),

      // sortBy turns them into arrays too
      p = model.dpatterns.sortBy("year"),
          t = model.technologies.sortBy("year");

      return p.concat(t).sort(function (a, b) {
        a = a.get("year");
        b = b.get("year");
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }
        return 0;
      });
    }).property("model"),

    gridLines: (function () {
      var svgenv = this.get("svgenv"),
          w = svgenv.viewBoxW,
          h = svgenv.viewBoxH,
          gridLines = [];

      for (var x = 0; x < w; x += svgenv.colW) {
        gridLines.push("M" + x + " 0 V" + h + " Z");
      }
      for (var y = 0; y < h; y += svgenv.rowH) {
        gridLines.push("M0 " + y + " H" + w + " Z");
      }

      return gridLines;
    }).property(),

    yearLines: (function () {
      return [this._buildYearLine(1980, 2), this._buildYearLine(1990, 5), this._buildYearLine(2000, 9), this._buildYearLine(2010, 13)];
    }).property(),

    _buildYearLine: function _buildYearLine(year, row) {
      var svgenv = this.get("svgenv"),
          x = svgenv.yearLineFontSize * 2,
          y = row * svgenv.rowH,
          xLine = svgenv.yearLineFontSize * 4;

      return { year: year, x: x, y: y,
        path: "M" + xLine + " " + y + " H" + svgenv.viewBoxW };
    },

    /*
      Generates paths between two nodes.
      The bound nodes have a parent/child relationship.
    */
    pathsToChildren: (function () {
      var dpatterns = this.get("model.dpatterns"),
          paths = [],
          _this = this;

      dpatterns.forEach(function (node_dpattern) {
        var children = node_dpattern.get("children");
        if (!children || !children.length) {
          return;
        }

        children.forEach(function (childId) {
          var childNode = _this.store.getById("node-dpattern", childId);
          var path = _this.generatePathToChild(node_dpattern, childNode);
          paths.push(path);
        });
      });

      return paths;
    }).property("model"),

    /*
      Generates paths between two nodes.
    */
    pathsBoundNodes: (function () {
      var gridNodes = this.get("gridNodes"),
          paths = [],
          _this = this;

      gridNodes.forEach(function (node_dpattern) {
        var rNodes = node_dpattern.get("related");

        if (!rNodes || !rNodes.get("length")) {
          return;
        }

        rNodes.forEach(function (node) {
          var classNames = node.get("classNames");
          classNames = classNames ? classNames.join(" ") : "";
          var pathObj = {
            path: _this.generateBindingPath(node_dpattern, node),
            classNames: "line line-dashed " + classNames
          };
          paths.push(pathObj);
        });
      });

      return paths;
    }).property("gridNodes")

  });

});
define('mvctree/initializers/app-version', ['exports', 'mvctree/config/environment', 'ember'], function (exports, config, Ember) {

  'use strict';

  var classify = Ember['default'].String.classify;

  exports['default'] = {
    name: "App Version",
    initialize: function initialize(container, application) {
      var appName = classify(application.toString());
      Ember['default'].libraries.register(appName, config['default'].APP.version);
    }
  };

});
define('mvctree/initializers/export-application-global', ['exports', 'ember', 'mvctree/config/environment'], function (exports, Ember, config) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    var classifiedName = Ember['default'].String.classify(config['default'].modulePrefix);

    if (config['default'].exportApplicationGlobal && !window[classifiedName]) {
      window[classifiedName] = application;
    }
  }

  ;

  exports['default'] = {
    name: "export-application-global",

    initialize: initialize
  };

});
define('mvctree/initializers/preload-data', ['exports', 'mvctree/jsons/technologies', 'mvctree/jsons/dpatterns', 'mvctree/jsons/headers'], function (exports, fixtureT, fixtureP, fixtureH) {

  'use strict';

  exports.initialize = initialize;

  // TODO: Fix deprecation in Ember 1.11
  // DEPRECATION: register should be called on the registry instead of the container
  // https://github.com/ember-cli/ember-cli/issues/3159
  // https://github.com/emberjs/data/issues/2806
  function initialize(container /*, application */) {
    var store = container.lookup("store:main");

    fixtureP['default'].forEach(function (item) {
      item.template = "dpatterns/" + item.id;
      store.push("node-dpattern", item);
    });

    fixtureT['default'].forEach(function (item) {
      item.template = "technologies/" + item.id;
      store.push("node-technology", item);
    });

    fixtureH['default'].forEach(function (item) {
      store.push("node-header", item);
    });
  }

  exports['default'] = {
    name: "preload-data",
    after: "svg-environment-service",
    initialize: initialize
  };

});
define('mvctree/initializers/svg-environment-service', ['exports'], function (exports) {

  'use strict';

  exports.initialize = initialize;

  function initialize(container, application) {
    application.inject("controller", "svgenv", "service:svg-environment");
    application.inject("model", "svgenv", "service:svg-environment");
  }

  exports['default'] = {
    name: "svg-environment-service",
    after: ["ember-data", "store"],
    initialize: initialize
  };

});
define('mvctree/jsons/dpatterns', ['exports'], function (exports) {

  'use strict';

  exports['default'] = [{
    id: "pac",
    name: "PAC",
    year: "1987",
    author: "J. Coutaz",
    col: "4",
    row: "3",
    definitions: [{
      term: "Presentation",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Abstraction",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Control",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "mvc-kp",
    name: "MVC K&P",
    year: "1988",
    author: "Krasner & Pope",
    col: "0",
    row: "4",
    children: ["am", "model2"],
    definitions: [{
      term: "Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Controller",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "tmve",
    name: "TMVE",
    year: "1979",
    author: "T. Reenskaug",
    col: "0",
    row: "1",
    children: ["mvc79", "mvp-taligent"],
    definitions: [{
      term: "Thing",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Editor",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "mvc79",
    name: "MVC",
    year: "1979",
    author: "T. Reenskaug",
    col: "0",
    row: "2",
    children: ["mvc-kp"],
    definitions: [{
      term: "Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Controller",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "observer",
    name: "Observer Pattern",
    year: "1994",
    author: "GoF",
    col: "7",
    row: "6",
    definitions: null
  }, {
    id: "model2",
    name: "Model 2",
    year: "1998",
    author: "J2EE",
    col: "0",
    row: "9",
    definitions: [{
      term: "Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Controller",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "mvp-taligent",
    name: "MVP",
    year: "1996",
    author: "Taligent",
    col: "2",
    row: "8",
    definitions: [{
      term: "Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Presenter",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "am",
    name: "Application Model",
    year: "1993",
    author: "VisualWorks",
    col: "1",
    row: "6",
    children: ["pm"],
    definitions: [{
      term: "Application Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Property Object",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "data_binding",
    name: "Data Binding",
    year: "1995",
    author: "unknown",
    col: "6",
    row: "7",
    definitions: null
  }, {
    id: "pm",
    name: "Presentation Model",
    year: "2004",
    author: "M. Fowler",
    col: "1",
    row: "13",
    definitions: [{
      term: "Presentation Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "mvvm",
    name: "MVVM",
    year: "2005",
    author: "Microsoft",
    col: "3",
    row: "14",
    related: [{ id: "pm", type: "node-dpattern" }, { id: "data_binding", type: "node-dpattern" }],
    definitions: [{
      term: "Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View Model",
      text: "Lorem ipsum dolor sir amet"
    }]
  }, {
    id: "mvw",
    name: "MVW",
    year: "2012",
    author: "unknown",
    col: "5",
    row: "20",
    related: [{ id: "angular", type: "node-technology" }, { id: "backbone", type: "node-technology" }, { id: "ember", type: "node-technology" }],
    definitions: [{
      term: "Model",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "View",
      text: "Lorem ipsum dolor sir amet"
    }, {
      term: "Whatever",
      text: "Lorem ipsum dolor sir amet"
    }]
  }];

});
define('mvctree/jsons/headers', ['exports'], function (exports) {

  'use strict';

  exports['default'] = [{
    id: "0",
    title: "MVC",
    col: "0",
    row: "0"
  }, {
    id: "1",
    title: "Application Model",
    col: "1",
    row: "0"
  }, {
    id: "2",
    title: "MVP",
    col: "2",
    row: "0"
  }, {
    id: "3",
    title: "MVVM",
    col: "3",
    row: "0"
  }, {
    id: "4",
    title: "PAC",
    col: "4",
    row: "0"
  }, {
    id: "5",
    title: "MVW",
    col: "5",
    row: "0"
  }, {
    id: "6",
    title: "Other Patterns",
    col: "6",
    row: "0"
  }];

});
define('mvctree/jsons/technologies', ['exports'], function (exports) {

  'use strict';

  exports['default'] = [{
    id: "swing",
    name: "SWING",
    year: "1998",
    col: 0,
    row: 8,
    classNames: ["tech_sig"]
  }, {
    id: "struts",
    name: "Struts",
    year: "2000",
    col: 0,
    row: 10,
    classNames: ["tech_sig", "tech_java"]
  }, {
    id: "nextstep",
    name: "NeXTstep",
    year: "1988",
    col: 0,
    row: 5,
    classNames: ["tech_sig"]
  }, {
    id: "msaccess",
    name: "MS-Access",
    year: "1995",
    col: 6,
    row: 7,
    classNames: ["tech_ms"]
  }, {
    id: "dolphin",
    name: "Dolphin",
    year: "1995",
    col: 2,
    row: 10,
    classNames: ["tech_smalltalk"]
  }, {
    id: "drupal",
    name: "Drupal",
    year: "2001",
    col: 4,
    row: 11,
    classNames: ["tech_php"]
  }, {
    id: "rails",
    name: "Rails",
    year: "2004",
    col: 0,
    row: 13,
    classNames: ["tech_sig", "tech_ruby"]
  }, {
    id: "j2ee",
    name: "J2EE",
    year: "1999",
    col: 0,
    row: 12,
    classNames: ["tech_java"]
  }, {
    id: "jsf",
    name: "JSF",
    year: "2004",
    col: 0,
    row: 13,
    classNames: ["tech_java"]
  }, {
    id: "django",
    name: "DJango",
    year: "2005",
    col: 0,
    row: 15,
    classNames: ["tech_python"]
  }, {
    id: "cakephp",
    name: "Cake PHP",
    year: "2005",
    col: 0,
    row: 14,
    classNames: ["tech_php"]
  }, {
    id: "zend",
    name: "Zend",
    year: "2006",
    col: 0,
    row: 16,
    classNames: ["tech_php"]
  }, {
    id: "aspnet",
    name: "APS.NET MVC",
    year: "2007",
    col: 0,
    row: 16,
    classNames: ["tech_ms"]
  }, {
    id: "silverlight",
    name: "Silverlight",
    year: "2007",
    col: 3,
    row: 16,
    classNames: ["tech_ms"]
  }, {
    id: "sproutcore",
    name: "Sproutcore",
    year: "2007",
    col: 0,
    row: 16,
    classNames: ["tech_sig", "tech_js"],
    related: [{ id: "ember", type: "node-technology" }]
  }, {
    id: "angular",
    name: "Angular.js",
    year: "2009",
    col: 3,
    row: 17,
    classNames: ["tech_js"]
  }, {
    id: "backbone",
    name: "Backbone",
    year: "2010",
    col: 2,
    row: 18,
    classNames: ["tech_js"]
  }, {
    id: "knockout",
    name: "Knockout.js",
    year: "2010",
    col: 3,
    row: 18,
    classNames: ["tech_js"]
  }, {
    id: "ember",
    name: "Ember.js",
    year: "2011",
    col: 3,
    row: 19,
    classNames: ["tech_js"]
  }];

});
define('mvctree/mixins/coordinates-factory', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Mixin.create({

    getBorderPos: function getBorderPos(gridNode, options) {
      var x = gridNode.get("x");
      var y = gridNode.get("y");
      var colW = this.get("svgenv.colW");
      var rowH = this.get("svgenv.rowH");

      switch (options.border) {
        case "top":
          x += colW / 2;
          y += this.get("svgenv.paddingT");
          break;
        case "right":
          x += colW;
          x -= this.get("svgenv.paddingR");
          y += rowH / 2;
          break;
        case "bottom":
          x += colW / 2;
          y += rowH;
          y -= this.get("svgenv.paddingB");
          break;
        case "left":
          x += this.get("svgenv.paddingL");
          y += rowH / 2;
          break;
        default:
          return null;
      }

      return { x: x, y: y };
    }

  });

});
define('mvctree/mixins/path-factory', ['exports', 'ember', 'mvctree/mixins/coordinates-factory'], function (exports, Ember, CoordinatesFactory) {

  'use strict';

  exports['default'] = Ember['default'].Mixin.create(CoordinatesFactory['default'], {

    // 1 is right, -1 is left
    _calcHDir: function _calcHDir(col1, col2) {
      if (col1 === col2) {
        return 1; // when 0, it defaults to the right i.e. 1
      } else {
        return col1 < col2 ? 1 : -1;
      }
    },

    _calcVDir: function _calcVDir(row1, row2) {
      if (row1 === row2) {
        return -1;
      } else {
        // 1 is down, -1 is top
        return row1 < row2 ? 1 : -1;
      }
    },

    _calcHDelta: function _calcHDelta(col1, col2) {
      var delta = Math.abs(col1 - col2);
      return delta === 0 ? 0 : delta - 1;
    },

    _calcVDelta: function _calcVDelta(row1, row2) {
      if (row1 === row2) {
        return 1;
      } else {
        var delta = Math.abs(row1 - row2);
        if (delta === 1) {
          return row1 < row2 ? 0 : 2;
        } else {
          return delta - 1;
        }
      }
    },

    /*
      generate Horizontal Path Parent to Corner
    */
    _genHPathP2C: function _genHPathP2C(hDelta, vDelta) {
      var colW = this.get("svgenv.colW"),
          isEnoughSpace = hDelta > 0 ? true : vDelta > 1 ? true : false,
          length = isEnoughSpace ? colW / 2 : 0;

      return length ? "h" + length : "";
    },

    /*
      generate Horizontal Path Corner to Child
    */
    _genHPathC2Ch: function _genHPathC2Ch(hDelta, vDelta) {
      var colW = this.get("svgenv.colW"),
          isEnoughSpace = hDelta > 0 ? true : vDelta > 1 ? true : false,
          length = isEnoughSpace ? colW / 2 : 0;

      length = hDelta === 0 ? length * -1 : length;

      return length ? "h" + length : "";
    },

    /*
      generate Vertical Path Node to Corner
    */
    _genVPathN2C: function _genVPathN2C(hDelta, vDelta) {
      if (hDelta < 2 && vDelta === 0) {
        return null;
      }
      var length = this.get("svgenv.rowH") / 2;
      if (vDelta < 0) {
        return "v-" + length;
      }
      return "v" + length;
    },

    /*
      generate Vertical Path Corner to Node
    */
    _genVPathC2N: function _genVPathC2N(hDelta, vDelta) {
      // TODO: unit test
      if (hDelta > 1) {
        return vDelta < 1 ? "v-" + this.get("svgenv.rowH") / 2 : "v" + this.get("svgenv.rowH") / 2;
      } else if (hDelta === 0) {
        if (vDelta !== 0) {
          return vDelta < 1 ? "v-" + this.get("svgenv.rowH") / 2 : "v" + this.get("svgenv.rowH") / 2;
        }
      } else if (hDelta === 1) {
        if (vDelta !== 0) {
          return vDelta < 1 ? "v-" + this.get("svgenv.rowH") / 2 : "v" + this.get("svgenv.rowH") / 2;
        }
      }
      return null;
    },

    /*
      @param {number} col1 
      @param {number} row1 
      @param {number} col2 
      @param {number} row2 
     */
    _genPathC2C: function _genPathC2C(col1, row1, col2, row2) {
      if (col1 === col2 && row1 === row2) {
        return null;
      }

      var hDelta = this._calcHDelta(col1, col2),
          vDelta = this._calcVDelta(row1, row2);

      if (!hDelta && !vDelta) {
        return null;
      }

      var svgenv = this.get("svgenv"),
          colW = svgenv.get("colW"),
          rowH = svgenv.get("rowH"),
          hDir = this._calcHDir(col1, col2),
          vDir = this._calcVDir(row1, row2);

      var h = colW * hDelta * hDir,
          v = rowH * vDelta * vDir;

      h = h ? "h" + h : "";
      v = v ? "v" + v : "";

      return h && v ? h + " " + v : h + v;
    },

    _getHMultC2C: function _getHMultC2C(hDelta) {
      if (hDelta <= 1) {
        return 0;
      } else {
        return hDelta - 1;
      }
    },

    _getVMultC2C: function _getVMultC2C(vDelta) {
      if (vDelta === 0 || vDelta === 1) {
        return 0;
      }
      if (vDelta === 2) {
        return 1;
      }
      if (vDelta === -2) {
        return -1;
      }
      var isNegative = vDelta < 0;
      return isNegative ? vDelta + 1 : vDelta - 1;
    },

    /*
      Asumes a left to right direction.
    */
    _genPathC2CR: function _genPathC2CR(hDelta, vDelta) {
      var hMult = this._getHMultC2C(hDelta);
      var vMult = this._getVMultC2C(vDelta);

      if (!hMult && !vMult) {
        return null;
      }

      var h = hMult * this.get("svgenv.colW");
      var v = vMult * this.get("svgenv.rowH");
      h = h ? "h" + h : "";
      v = v ? "v" + v : "";
      return h && v ? h + " " + v : h + v;
    },

    _genChildArrow: function _genChildArrow() {
      // TODO: maybe replace this with a <marker>
      var svgenv = this.get("svgenv"),
          paddingT = svgenv.get("paddingT"),
          halfPT = paddingT / 2;

      return "h-" + halfPT + " " + "l" + halfPT + " " + paddingT + " " + "l" + halfPT + " -" + paddingT + " " + "h-" + halfPT;
    },

    /*
      Adds two stems:
        1. first stem goes underneath the parent
        2. second stem goes above the child 
    */
    generatePathToChild: function generatePathToChild(a, b) {
      var col1 = parseInt(a.get("col")),
          row1 = parseInt(a.get("row")),
          col2 = parseInt(b.get("col")),
          row2 = parseInt(b.get("row"));

      if (col1 === col2 && row1 === row2) {
        return "";
      }

      var pathRoot = this.getBorderPos(a, { border: "bottom" });

      var hDelta = Math.abs(col1 - col2),
          vDelta = Math.abs(row1 - row2);

      var pathP2C = this._genHPathP2C(hDelta, vDelta);
      var pathC2C = this._genPathC2C(col1, row1, col2, row2);
      var pathC2Ch = this._genHPathC2Ch(hDelta, vDelta);

      pathP2C = pathP2C ? pathP2C + " " : "";
      pathC2C = pathC2C ? pathC2C + " " : "";
      pathC2Ch = pathC2Ch ? pathC2Ch + " " : "";

      return "M" + pathRoot.x + " " + pathRoot.y + " " + "v" + this.get("svgenv.paddingB") + " " + pathP2C + pathC2C + pathC2Ch + this._genChildArrow();
    },

    /*
      @method generateBindingPath 
      @param {model:grid-node} a 
      @param {model:grid-node} b 
      @return {String} SVG path 
    */
    generateBindingPath: function generateBindingPath(a, b) {
      var col1 = parseInt(a.get("col")),
          row1 = parseInt(a.get("row")),
          col2 = parseInt(b.get("col")),
          row2 = parseInt(b.get("row"));

      if (col1 === col2 && row1 === row2) {
        return null;
      }

      // switch, we want left->right
      if (col1 > col2 || col1 === col2 && row1 > row2) {
        var tmpNode = b,
            tmpCol = col2,
            tmpRow = row2;
        b = a;
        col2 = col1;
        row2 = row1;
        a = tmpNode;
        col1 = tmpCol;
        row1 = tmpRow;
      }

      var hDelta = col2 - col1,
          vDelta = row2 - row1;

      var paddingR = this.get("svgenv.paddingR");
      var pathN2C = this._genVPathN2C(hDelta, vDelta);
      var pathC2C = this._genPathC2CR(hDelta, vDelta);
      var pathC2N = this._genVPathC2N(hDelta, vDelta);
      var paddingL = this.get("svgenv.paddingL");

      var padRight = paddingR ? "h" + paddingR + " " : "";
      pathN2C = pathN2C ? pathN2C + " " : "";
      pathC2C = pathC2C ? pathC2C + " " : "";
      pathC2N = pathC2N ? pathC2N : "";
      var padLeft = paddingL ? " h" + paddingL : "";

      var path = padRight + pathN2C + pathC2C + pathC2N + padLeft;
      var pathRoot = this.getBorderPos(a, { border: "right" });
      return path ? "M" + pathRoot.x + " " + pathRoot.y + " " + path : null;
    }

  });

});
define('mvctree/models/grid-node', ['exports', 'ember', 'ember-data'], function (exports, Ember, DS) {

  'use strict';

  exports['default'] = DS['default'].Model.extend({
    name: DS['default'].attr("string"),
    year: DS['default'].attr("number"),
    col: DS['default'].attr("number"),
    row: DS['default'].attr("number"),
    template: DS['default'].attr("string"),

    // added localy
    x: DS['default'].attr("number"),
    y: DS['default'].attr("number"),
    x_padded: DS['default'].attr("number"),
    y_padded: DS['default'].attr("number"),
    rx: DS['default'].attr("number"),
    ry: DS['default'].attr("number"),
    cx: DS['default'].attr("number"),
    cy: DS['default'].attr("number"),
    width: DS['default'].attr("number"),
    height: DS['default'].attr("number"),

    addNodeValues: (function () {
      var svgenv = this.get("svgenv");

      if (!svgenv) {
        throw new Ember['default'].Error("svgenv has not been injected yet");
      }

      // TODO: use uppercase names for absolute values

      // x
      this.set("x", this.get("col") * svgenv.get("colW"));
      this.set("x_padded", svgenv.get("paddingL") + this.get("x"));
      this.set("cx", this.get("x") + svgenv.get("colW") / 2);
      this.set("width", svgenv.get("colW") - svgenv.get("paddingL") - svgenv.get("paddingR"));
      this.set("rx", this.get("width") / 2);

      // y
      this.set("y", this.get("row") * svgenv.get("rowH"));
      this.set("y_padded", svgenv.get("paddingT") + this.get("y"));
      this.set("cy", this.get("y") + svgenv.get("rowH") / 2);
      this.set("height", svgenv.get("rowH") - svgenv.get("paddingT") - svgenv.get("paddingB"));
      this.set("ry", this.get("height") / 2);
    }).on("ready")

  });

});
define('mvctree/models/node-dpattern', ['exports', 'ember-data', 'mvctree/models/grid-node'], function (exports, DS, GridNode) {

  'use strict';

  exports['default'] = GridNode['default'].extend({
    author: DS['default'].attr("string"),
    children: DS['default'].attr(),
    related: DS['default'].hasMany("grid-node", { polymorphic: true, async: true }),
    definitions: DS['default'].attr()
  });

});
define('mvctree/models/node-header', ['exports', 'ember-data', 'mvctree/models/grid-node'], function (exports, DS, GridNode) {

  'use strict';

  exports['default'] = GridNode['default'].extend({
    title: DS['default'].attr("string")
  });

});
define('mvctree/models/node-technology', ['exports', 'ember-data', 'mvctree/models/grid-node'], function (exports, DS, GridNode) {

  'use strict';

  exports['default'] = GridNode['default'].extend({
    classNames: DS['default'].attr(),
    related: DS['default'].hasMany("grid-node", { polymorphic: true, async: true }) });

});
define('mvctree/router', ['exports', 'ember', 'mvctree/config/environment'], function (exports, Ember, config) {

  'use strict';

  var Router = Ember['default'].Router.extend({
    location: config['default'].locationType
  });

  Router.map(function () {
    this.route("about");
  });

  exports['default'] = Router;

});
define('mvctree/routes/about', ['exports', 'ember'], function (exports, Ember) {

	'use strict';

	exports['default'] = Ember['default'].Route.extend({});

});
define('mvctree/routes/index', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].Route.extend({
    model: function model() {
      return Ember['default'].RSVP.hash({
        dpatterns: this.store.all("node-dpattern"),
        technologies: this.store.all("node-technology"),
        headers: this.store.all("node-header") });
    }
  });

});
define('mvctree/serializers/node-dpattern', ['exports', 'ember-data'], function (exports, DS) {

  'use strict';

  exports['default'] = DS['default'].RESTSerializer.extend(DS['default'].EmbeddedRecordsMixin, {
    attrs: {
      definitions: { embedded: "always" }
    }
  });

});
define('mvctree/services/svg-environment', ['exports', 'ember', 'mvctree/config/environment'], function (exports, Ember, ENV) {

  'use strict';

  exports['default'] = Ember['default'].Object.extend({

    showGrid: ENV['default'].APP.showGrid,

    paddingT: 6,
    paddingR: 6,
    paddingB: 12,
    paddingL: 6,

    colW: 170 + 12,
    rowH: 64 + 18,

    maxCols: 7,
    maxRows: 22,

    viewBoxW: null,
    viewBoxH: null,
    viewBox: null,

    yearLineFontSize: 12, // from CSS rule .year_line_txt

    _calcViewBox: (function () {
      var viewBoxW = this.get("colW") * this.get("maxCols"),
          viewBoxH = this.get("rowH") * this.get("maxRows");

      this.set("viewBoxW", viewBoxW);
      this.set("viewBoxH", viewBoxH);
      this.set("viewBox", "0 0 " + viewBoxW + " " + viewBoxH);
    }).on("init")

  });

});
define('mvctree/templates/about', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("h1");
        var el3 = dom.createTextNode("About");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","alert alert-warning");
        dom.setAttribute(el2,"role","alert");
        var el3 = dom.createTextNode("\n    WIP: last update 22 / March / 2015 \n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","panel panel-success");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","panel-heading");
        var el4 = dom.createTextNode("\n      Why?\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","panel-body");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        It is a common mistake to think that there is a single MVC design and that it is just about separation of concerns (data storage, user interface, business logic).\n        Application designs also include tradeoffs between resources consumption, maintainability/testing and ease of development/debugging.\n      ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("p");
        var el6 = dom.createTextNode("\n      ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        Also, is not well known that the pattern is used differently in different scenarios.\n        A server application and a client application might be using an MVC pattern, but it won't work exactly in the same way.\n        Context matters too.\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        Understanding the reasons behind design choices of the past will enable you to make better decisions for new design challenges.\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        Want to read a bit more? here: ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("a");
        dom.setAttribute(el5,"href","http://givan.se/p/00000010");
        var el6 = dom.createTextNode("MVC past, present and future");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode(".\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","panel panel-success");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","panel-heading");
        var el4 = dom.createTextNode("\n      Who?\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","panel-body");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        Built by\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("a");
        dom.setAttribute(el5,"target","_blank");
        dom.setAttribute(el5,"href","https://twitter.com/givanse");
        var el6 = dom.createTextNode("@givanse");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        with the help and guidance of\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("a");
        dom.setAttribute(el5,"target","_blank");
        dom.setAttribute(el5,"href","https://twitter.com/paul_hammant");
        var el6 = dom.createTextNode("@paul_hammant");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode(".\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        I had a need to better understand MVC, I did some research and wrote an article about it:\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("a");
        dom.setAttribute(el5,"href","http://givan.se/p/00000010");
        var el6 = dom.createTextNode("MVC past, present and future");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode(".\n        That led to a bunch of emails between me and P. Hammant.\n        I received more ideas to go beyond the original article and also some neat sources of information.\n        Now, it is all here.\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","panel panel-success");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","panel-heading");
        var el4 = dom.createTextNode("\n      How?\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","panel-body");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n        Ember.js views that use SVG tags as their tagName property.\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("p");
        var el5 = dom.createTextNode("\n      Hosted at ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("a");
        dom.setAttribute(el5,"href","https://github.com/givanse/mvc-tree/");
        var el6 = dom.createTextNode("Github");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode(".\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
        content(env, morph0, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/application', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("        MVC Family Tree\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("            About\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("nav");
        dom.setAttribute(el1,"class","navbar navbar-default ");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","container-fluid");
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","navbar-header");
        var el4 = dom.createTextNode("\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("button");
        dom.setAttribute(el4,"type","button");
        dom.setAttribute(el4,"class","navbar-toggle collapsed");
        dom.setAttribute(el4,"data-toggle","collapse");
        dom.setAttribute(el4,"data-target","#bs-example-navbar-collapse-1");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("span");
        dom.setAttribute(el5,"class","sr-only");
        var el6 = dom.createTextNode("Toggle navigation");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("span");
        dom.setAttribute(el5,"class","icon-bar");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("span");
        dom.setAttribute(el5,"class","icon-bar");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("span");
        dom.setAttribute(el5,"class","icon-bar");
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n");
        dom.appendChild(el3, el4);
        var el4 = dom.createComment("");
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("div");
        dom.setAttribute(el3,"class","collapse navbar-collapse");
        dom.setAttribute(el3,"id","bs-example-navbar-collapse-1");
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        dom.setAttribute(el4,"class","nav navbar-nav");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createTextNode("\n");
        dom.appendChild(el5, el6);
        var el6 = dom.createComment("");
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n      ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("ul");
        dom.setAttribute(el4,"class","nav navbar-nav navbar-right");
        var el5 = dom.createTextNode("\n        ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("li");
        var el6 = dom.createTextNode("\n          ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("a");
        var el7 = dom.createTextNode("\n            ");
        dom.appendChild(el6, el7);
        var el7 = dom.createElement("iframe");
        dom.setAttribute(el7,"src","https://ghbtns.com/github-btn.html?user=givanse&repo=mvc-tree&type=star&count=true&size=large");
        dom.setAttribute(el7,"frameborder","0");
        dom.setAttribute(el7,"scrolling","0");
        dom.setAttribute(el7,"width","160px");
        dom.setAttribute(el7,"height","30px");
        dom.appendChild(el6, el7);
        var el7 = dom.createTextNode("\n          ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n        ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n      ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n\n    ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createComment(" collapse ");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, block = hooks.block, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [1, 1]);
        var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),3,3);
        var morph1 = dom.createMorphAt(dom.childAt(element0, [3, 1, 1]),1,1);
        var morph2 = dom.createMorphAt(fragment,3,3,contextualElement);
        block(env, morph0, context, "link-to", ["index"], {"class": "navbar-brand"}, child0, null);
        block(env, morph1, context, "link-to", ["about"], {"class": "navbar-brand"}, child1, null);
        content(env, morph2, context, "outlet");
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/components/definitions-showcase', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1,"class","list-group-item");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("b");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(": ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),0,0);
          var morph1 = dom.createMorphAt(element1,3,3);
          content(env, morph0, context, "definition.term");
          content(env, morph1, context, "definition.text");
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("      ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("li");
          dom.setAttribute(el1,"class","list-group-item");
          var el2 = dom.createTextNode("\n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("b");
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode(": ");
          dom.appendChild(el1, el2);
          var el2 = dom.createComment("");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n      ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var morph0 = dom.createMorphAt(dom.childAt(element0, [1]),0,0);
          var morph1 = dom.createMorphAt(element0,3,3);
          content(env, morph0, context, "definition.term");
          content(env, morph1, context, "definition.text");
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("h4");
        dom.setAttribute(el1,"class","bg-info text-info");
        var el2 = dom.createTextNode("Pattern Elements");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-xs-12 col-md-6");
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","col-xs-12 col-md-6");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" definitions ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-12 col-md-6");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        dom.setAttribute(el2,"class","list-group");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" definitions ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","col-xs-12 col-md-6");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        dom.setAttribute(el2,"class","list-group compare_to");
        var el3 = dom.createTextNode("\n");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, inline = hooks.inline, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [3, 3]),1,1);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [7, 1]),1,1);
        var morph2 = dom.createMorphAt(dom.childAt(fragment, [11, 1]),1,1);
        inline(env, morph0, context, "view", ["select"], {"content": get(env, context, "availablePatterns"), "value": get(env, context, "selectedPatternId"), "prompt": "compare to:", "optionValuePath": "content.id", "optionLabelPath": "content.name", "class": "form-control"});
        block(env, morph1, context, "each", [get(env, context, "currDefinitions")], {"keyword": "definition"}, child0, null);
        block(env, morph2, context, "each", [get(env, context, "selectedPattern.definitions")], {"keyword": "definition"}, child1, null);
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/components/tabbed-drawer', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","td_tab");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("span");
        dom.setAttribute(el2,"class","glyphicon glyphicon-option-vertical");
        dom.setAttribute(el2,"aria-hidden","true");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","td_drawer");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, element = hooks.element, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var morph0 = dom.createMorphAt(dom.childAt(fragment, [2]),1,1);
        element(env, element0, context, "action", ["toggleDrawer"], {});
        content(env, morph0, context, "yield");
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/am', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        Used in VisualWorks, a Smalltalk implementation done by ParcPlace. \n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("blockquote");
        var el2 = dom.createTextNode("\n    ...a construct that moves towards Presentation Model.\n    ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("footer");
        var el3 = dom.createTextNode("\n        M. Fowler\n    ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/data-binding', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/model2', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        A design pattern used in Java Web applications described in\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"href","http://www.kirkdorffer.com/jspspecs/jsp092.html#model");
        var el2 = dom.createTextNode("\n          JavaServer Pages - Specification 0.92\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(". A year later after release it was associated with MVC.\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/mvc-kp', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("Glenn E. Krasner and Stephen T. Pope published a variation of MVC in\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"href","papers/krasner-pope-88.pdf");
        var el2 = dom.createTextNode("\n  A Cookbook for Using the Model-View-Controller User Interface Paradigm in Smalltalk-80\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(".\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/mvc79', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        Trygve Reenskaug revamps TMVE into ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"href","papers/mvc.pdf");
        var el2 = dom.createTextNode("MVC");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(".\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/mvc88', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        Glenn E. Krasner and Stephen T. Pope published a variation of MVC in\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"href","papers/krasner-pope-88.pdf");
        var el2 = dom.createTextNode("\n          A Cookbook for Using the Model-View-Controller User Interface Paradigm in Smalltalk-80\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(".\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/mvp-taligent', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        First described by Mike Potel from Taligent Inc. in \n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","papers/mvp-taligent.pdf");
        var el3 = dom.createTextNode("\n          MVP: Model-View-Presenter, The Taligent Programming Model for C++ and Java\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(".\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        Key features:\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        var el3 = dom.createTextNode("\n          ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createTextNode("\n          The classic controller faded in into the view and now is called an interactor.\n          ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n          ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createTextNode("\n          The Presenter is a controller, but elevated to the application level.\n          ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/mvvm', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        Described by John Gossman from Microsoft in his blog post:\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://blogs.msdn.com/b/johngossman/archive/2005/10/08/478683.aspx");
        var el3 = dom.createTextNode("\n          Introduction to Model/View/ViewModel pattern for building WPF apps\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(". From the beginning it was compared to Presentation Model and later, in 2008, \n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://blogs.msdn.com/b/johngossman/archive/2008/05/28/presentationmodel-and-wpf.aspx");
        var el3 = dom.createTextNode("\n          J. Gossman posted\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(":\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("blockquote");
        var el3 = dom.createTextNode("\n        My opinion at this point is the Model-View-ViewModel pattern is a WPF-specific version of the PresentationModel pattern.\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n          An interesting observation made about MVVM is that it maps quite well to PAC.\n          You can read about that in:\n          ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://blogs.msdn.com/b/johngossman/archive/2005/10/09/478894.aspx");
        var el3 = dom.createTextNode("\n            100 Model/View/ViewModels of Mt. Fuji\n          ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        MVVM Key features:\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        var el3 = dom.createTextNode("\n          ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createTextNode("\n            Data binding gives you boilerplate synchronization code.\n          ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n          ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createTextNode("\n            The ViewModel is easier to unit test compared to code-behind or event-driven code.\n            ");
        dom.appendChild(el3, el4);
        var el4 = dom.createElement("blockquote");
        var el5 = dom.createTextNode("\n              ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("p");
        var el6 = dom.createTextNode("\n              The ViewModel, though it sounds View-ish is really more Model-ish, and that means you can test it without awkward UI automation and interaction.\n              ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n              ");
        dom.appendChild(el4, el5);
        var el5 = dom.createElement("footer");
        var el6 = dom.createTextNode("\n                ");
        dom.appendChild(el5, el6);
        var el6 = dom.createElement("a");
        dom.setAttribute(el6,"href","http://blogs.msdn.com/b/johngossman/archive/2006/03/04/543695.aspx");
        var el7 = dom.createTextNode("\n                  Advantages and disadvantages of M-V-VM\n                ");
        dom.appendChild(el6, el7);
        dom.appendChild(el5, el6);
        var el6 = dom.createTextNode("\n              ");
        dom.appendChild(el5, el6);
        dom.appendChild(el4, el5);
        var el5 = dom.createTextNode("\n            ");
        dom.appendChild(el4, el5);
        dom.appendChild(el3, el4);
        var el4 = dom.createTextNode("\n          ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        MVVM Issues:\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("ul");
        var el3 = dom.createTextNode("\n          ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createTextNode("\n            Declarative data binding can be harder to debug.\n          ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n          ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createTextNode("\n            In very large apps, data binding can result in considerable memory consumption.\n          ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n          ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("li");
        var el4 = dom.createTextNode("\n            It can be overkill for simple UIs.\n          ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/mvw', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        It is the term used when a technology can't clearly be identified as MVC, MVP or MVVM.\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/observer', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        Although the technique had been in use since the early days of MVC, it was\n        first described in the book ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("b");
        var el2 = dom.createTextNode("Design Patterns: Elements of Reusable Object-Oriented Software");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode(" by\n        Erich Gamma, Richard Helm, Ralph Johnson, John Vlissides.\n        The authors are often referred to as the Gang of Four (GoF).\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/pac', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  Developed independently from MVC by Joëlle Coutaz in:\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","papers/pac.pdf");
        var el3 = dom.createTextNode("\n    PAC, an Object Oriented Model for Dialog Design.\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n  In an email response J. Coutaz said that:\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("blockquote");
        var el3 = dom.createTextNode("\n    when she formulated PAC, that she was unaware of MVC, and that she chose the word \"control\" independently.\n    She later discovered MVC and was delighted to see the similarities, but \n    also noted that her (independently coined) term \"control\" was similar to the term \"controller\" used with a very different meaning. \n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  All this was reported by Kyle Brown in\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://c2.com/cgi/wiki?WhatsaControllerAnyway");
        var el3 = dom.createTextNode("Whats a Controller Anyway");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(".\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/pm', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        Described by Martin Fowler in\n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"href","http://martinfowler.com/eaaDev/PresentationModel.html");
        var el2 = dom.createTextNode("\n          Development of Further Patterns of Enterprise Application Architecture.\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/dpatterns/tmve', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        Trygve Reenskaug writes a memo, \n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"href","papers/a-note-on-dynabook-requirements.pdf");
        var el2 = dom.createTextNode("\n          a note on DynaBook requirements\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n        , that describes his design for a project management task.\n        A couple of months later in another memo the \n        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("a");
        dom.setAttribute(el1,"href","papers/tmve.pdf");
        var el2 = dom.createTextNode("thing-model-view-editor");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n        metaphor is explored.\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/index', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("h5");
          dom.setAttribute(el1,"class","text-center");
          var el2 = dom.createTextNode("Technologies");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
          inline(env, morph0, context, "view", ["master-overlay-checkbox"], {});
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.0-beta.5",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("              ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            inline(env, morph0, context, "definitions-showcase", [], {"currPatternId": get(env, context, "node.id"), "currDefinitions": get(env, context, "node.definitions"), "allPatterns": get(env, context, "model.dpatterns")});
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("    ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("div");
          dom.setAttribute(el1,"class","row text_box_info");
          var el2 = dom.createTextNode("\n      \n        ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("div");
          var el3 = dom.createTextNode("\n\n          ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3,"class","panel-heading");
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment(" title ");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("h3");
          dom.setAttribute(el4,"class","panel-title");
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode(" ");
          dom.appendChild(el4, el5);
          var el5 = dom.createComment("");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createElement("div");
          dom.setAttribute(el4,"class","pull-right button_top");
          var el5 = dom.createTextNode("\n              ");
          dom.appendChild(el4, el5);
          var el5 = dom.createElement("a");
          dom.setAttribute(el5,"href","#top");
          var el6 = dom.createTextNode("\n                ");
          dom.appendChild(el5, el6);
          var el6 = dom.createElement("span");
          dom.setAttribute(el6,"class","glyphicon glyphicon-triangle-top");
          dom.setAttribute(el6,"aria-hidden","true");
          dom.appendChild(el5, el6);
          var el6 = dom.createTextNode("\n              ");
          dom.appendChild(el5, el6);
          dom.appendChild(el4, el5);
          var el5 = dom.createTextNode("\n            ");
          dom.appendChild(el4, el5);
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n          ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createComment(" panel-heading ");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n\n          ");
          dom.appendChild(el2, el3);
          var el3 = dom.createElement("div");
          dom.setAttribute(el3,"class","panel-body");
          var el4 = dom.createTextNode("\n            ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment(" template ");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n              ");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("\n            \n\n");
          dom.appendChild(el3, el4);
          var el4 = dom.createComment("");
          dom.appendChild(el3, el4);
          var el4 = dom.createTextNode("          ");
          dom.appendChild(el3, el4);
          dom.appendChild(el2, el3);
          var el3 = dom.createComment(" panel-body ");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n        ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createComment(" panel ");
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n    \n    ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createComment(" row ");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, content = hooks.content, inline = hooks.inline, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [1]);
          var element1 = dom.childAt(element0, [1]);
          var element2 = dom.childAt(element1, [1, 3]);
          var element3 = dom.childAt(element1, [4]);
          var attrMorph0 = dom.createAttrMorph(element0, 'id');
          var attrMorph1 = dom.createAttrMorph(element1, 'class');
          var morph0 = dom.createMorphAt(element2,0,0);
          var morph1 = dom.createMorphAt(element2,2,2);
          var morph2 = dom.createMorphAt(element3,3,3);
          var morph3 = dom.createMorphAt(element3,5,5);
          attribute(env, attrMorph0, element0, "id", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.id")], {})]));
          attribute(env, attrMorph1, element1, "class", concat(env, ["panel ", subexpr(env, context, "if", [get(env, context, "node.author"), "panel-primary", "panel-info"], {})]));
          content(env, morph0, context, "node.year");
          content(env, morph1, context, "node.name");
          inline(env, morph2, context, "partial", [get(env, context, "node.template")], {});
          block(env, morph3, context, "if", [get(env, context, "node.definitions")], {}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Tree drawn with SVG ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","mvc_tree_wrapper_scroll");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("div");
        dom.setAttribute(el2,"class","mvc_tree_wrapper");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("br");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("div");
        dom.setAttribute(el1,"class","container");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment(" List of all the nodes with their descriptions. ");
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        var el2 = dom.createComment("");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, block = hooks.block, inline = hooks.inline, get = hooks.get;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
        var morph1 = dom.createMorphAt(dom.childAt(fragment, [5, 1]),1,1);
        var morph2 = dom.createMorphAt(dom.childAt(fragment, [9]),3,3);
        block(env, morph0, context, "tabbed-drawer", [], {}, child0, null);
        inline(env, morph1, context, "view", ["svg"], {});
        block(env, morph2, context, "each", [get(env, context, "gridNodes")], {"keyword": "node"}, child1, null);
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/node-dpattern', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("rect");
        dom.setAttribute(el1,"class","node_design");
        dom.setAttribute(el1,"ry","7");
        dom.setAttribute(el1,"rx","7");
        dom.setAttribute(el1,"r","7");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("text");
        dom.setAttribute(el1,"class","node_txt");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tspan");
        dom.setAttribute(el2,"dy","16.8");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tspan");
        dom.setAttribute(el2,"dy","16.8");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tspan");
        dom.setAttribute(el2,"class","node_txt_auth");
        dom.setAttribute(el2,"dy","16.8");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [1]);
        var element1 = dom.childAt(fragment, [3]);
        var element2 = dom.childAt(element1, [3]);
        var element3 = dom.childAt(element1, [5]);
        var attrMorph0 = dom.createAttrMorph(element0, 'x');
        var attrMorph1 = dom.createAttrMorph(element0, 'y');
        var attrMorph2 = dom.createAttrMorph(element0, 'height');
        var attrMorph3 = dom.createAttrMorph(element0, 'width');
        var attrMorph4 = dom.createAttrMorph(element1, 'x');
        var attrMorph5 = dom.createAttrMorph(element1, 'y');
        var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
        var morph1 = dom.createMorphAt(element2,1,1);
        var attrMorph6 = dom.createAttrMorph(element2, 'x');
        var morph2 = dom.createMorphAt(element3,1,1);
        var attrMorph7 = dom.createAttrMorph(element3, 'x');
        attribute(env, attrMorph0, element0, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.x_padded")], {})]));
        attribute(env, attrMorph1, element0, "y", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.y_padded")], {})]));
        attribute(env, attrMorph2, element0, "height", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.height")], {})]));
        attribute(env, attrMorph3, element0, "width", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.width")], {})]));
        attribute(env, attrMorph4, element1, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cx")], {})]));
        attribute(env, attrMorph5, element1, "y", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.y_padded")], {})]));
        content(env, morph0, context, "node.name");
        attribute(env, attrMorph6, element2, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cx")], {})]));
        content(env, morph1, context, "node.year");
        attribute(env, attrMorph7, element3, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cx")], {})]));
        content(env, morph2, context, "node.author");
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/node-header', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("rect");
        dom.setAttribute(el1,"class","node_header");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("text");
        dom.setAttribute(el1,"class","node_header_title");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tspan");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(fragment, [2]);
        var attrMorph0 = dom.createAttrMorph(element0, 'x');
        var attrMorph1 = dom.createAttrMorph(element0, 'y');
        var attrMorph2 = dom.createAttrMorph(element0, 'height');
        var attrMorph3 = dom.createAttrMorph(element0, 'width');
        var attrMorph4 = dom.createAttrMorph(element1, 'x');
        var attrMorph5 = dom.createAttrMorph(element1, 'y');
        var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
        attribute(env, attrMorph0, element0, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.x_padded")], {})]));
        attribute(env, attrMorph1, element0, "y", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.y_padded")], {})]));
        attribute(env, attrMorph2, element0, "height", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.height")], {})]));
        attribute(env, attrMorph3, element0, "width", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.width")], {})]));
        attribute(env, attrMorph4, element1, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cx")], {})]));
        attribute(env, attrMorph5, element1, "y", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cy")], {})]));
        content(env, morph0, context, "node.title");
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/node-technology', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createElement("ellipse");
        dom.setAttribute(el1,"class","node_tech");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("text");
        dom.setAttribute(el1,"class","node_txt");
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tspan");
        dom.setAttribute(el2,"dy","32");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n  ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("tspan");
        dom.setAttribute(el2,"dy","16.8");
        var el3 = dom.createTextNode("\n    ");
        dom.appendChild(el2, el3);
        var el3 = dom.createComment("");
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n  ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var element0 = dom.childAt(fragment, [0]);
        var element1 = dom.childAt(fragment, [2]);
        var element2 = dom.childAt(element1, [3]);
        var attrMorph0 = dom.createAttrMorph(element0, 'cx');
        var attrMorph1 = dom.createAttrMorph(element0, 'cy');
        var attrMorph2 = dom.createAttrMorph(element0, 'rx');
        var attrMorph3 = dom.createAttrMorph(element0, 'ry');
        var attrMorph4 = dom.createAttrMorph(element1, 'x');
        var attrMorph5 = dom.createAttrMorph(element1, 'y');
        var morph0 = dom.createMorphAt(dom.childAt(element1, [1]),1,1);
        var morph1 = dom.createMorphAt(element2,1,1);
        var attrMorph6 = dom.createAttrMorph(element2, 'x');
        attribute(env, attrMorph0, element0, "cx", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cx")], {})]));
        attribute(env, attrMorph1, element0, "cy", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cy")], {})]));
        attribute(env, attrMorph2, element0, "rx", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.rx")], {})]));
        attribute(env, attrMorph3, element0, "ry", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.ry")], {})]));
        attribute(env, attrMorph4, element1, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cx")], {})]));
        attribute(env, attrMorph5, element1, "y", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.y_padded")], {})]));
        content(env, morph0, context, "node.name");
        attribute(env, attrMorph6, element2, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "node.cx")], {})]));
        content(env, morph1, context, "node.year");
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/overlay-checkbox', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, content = hooks.content;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
        dom.insertBoundary(fragment, 0);
        content(env, morph0, context, "view.name");
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/svg', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    var child0 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.0-beta.5",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createElement("path");
            dom.setAttribute(el1,"fill","none");
            dom.setAttribute(el1,"class","grid_line");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var element4 = dom.childAt(fragment, [1]);
            var attrMorph0 = dom.createAttrMorph(element4, 'd');
            attribute(env, attrMorph0, element4, "d", concat(env, [subexpr(env, context, "unbound", [get(env, context, "line")], {})]));
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "each", [get(env, context, "gridLines")], {"keyword": "line"}, child0, null);
          return fragment;
        }
      };
    }());
    var child1 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("text");
          dom.setAttribute(el1,"class","year_line_txt");
          var el2 = dom.createTextNode("\n    ");
          dom.appendChild(el1, el2);
          var el2 = dom.createElement("tspan");
          dom.setAttribute(el2,"dy","4.233003616333008");
          var el3 = dom.createTextNode("\n      ");
          dom.appendChild(el2, el3);
          var el3 = dom.createComment("");
          dom.appendChild(el2, el3);
          var el3 = dom.createTextNode("\n    ");
          dom.appendChild(el2, el3);
          dom.appendChild(el1, el2);
          var el2 = dom.createTextNode("\n  ");
          dom.appendChild(el1, el2);
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("path");
          dom.setAttribute(el1,"fill","none");
          dom.setAttribute(el1,"class","year_line_path");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute, content = hooks.content;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element2 = dom.childAt(fragment, [1]);
          var element3 = dom.childAt(fragment, [3]);
          var attrMorph0 = dom.createAttrMorph(element2, 'x');
          var attrMorph1 = dom.createAttrMorph(element2, 'y');
          var morph0 = dom.createMorphAt(dom.childAt(element2, [1]),1,1);
          var attrMorph2 = dom.createAttrMorph(element3, 'd');
          attribute(env, attrMorph0, element2, "x", concat(env, [subexpr(env, context, "unbound", [get(env, context, "line.x")], {})]));
          attribute(env, attrMorph1, element2, "y", concat(env, [subexpr(env, context, "unbound", [get(env, context, "line.y")], {})]));
          content(env, morph0, context, "line.year");
          attribute(env, attrMorph2, element3, "d", concat(env, [subexpr(env, context, "unbound", [get(env, context, "line.path")], {})]));
          return fragment;
        }
      };
    }());
    var child2 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "view", ["svg-g"], {"templateName": "node-header", "node": get(env, context, "node")});
          return fragment;
        }
      };
    }());
    var child3 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("path");
          dom.setAttribute(el1,"class","line");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element1 = dom.childAt(fragment, [1]);
          var attrMorph0 = dom.createAttrMorph(element1, 'd');
          attribute(env, attrMorph0, element1, "d", concat(env, [subexpr(env, context, "unbound", [get(env, context, "path")], {})]));
          return fragment;
        }
      };
    }());
    var child4 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment(" \n    possible bug \n        class=\"{{unbound pathObj.classNames}}\"\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createElement("path");
          dom.setAttribute(el1,"class","line line-dashed");
          dom.setAttribute(el1,"stroke-dasharray","5, 5");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline, subexpr = hooks.subexpr, concat = hooks.concat, attribute = hooks.attribute;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var element0 = dom.childAt(fragment, [5]);
          var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
          var attrMorph0 = dom.createAttrMorph(element0, 'd');
          inline(env, morph0, context, "log", [get(env, context, "pathObj.classNames")], {});
          attribute(env, attrMorph0, element0, "d", concat(env, [subexpr(env, context, "unbound", [get(env, context, "pathObj.path")], {})]));
          return fragment;
        }
      };
    }());
    var child5 = (function() {
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createTextNode("  ");
          dom.appendChild(el0, el1);
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          var el1 = dom.createTextNode("\n");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
          inline(env, morph0, context, "view", ["svg-g-click"], {"templateName": "node-dpattern", "node": get(env, context, "node")});
          return fragment;
        }
      };
    }());
    var child6 = (function() {
      var child0 = (function() {
        return {
          isHTMLBars: true,
          revision: "Ember@1.11.0-beta.5",
          blockParams: 0,
          cachedFragment: null,
          hasRendered: false,
          build: function build(dom) {
            var el0 = dom.createDocumentFragment();
            var el1 = dom.createTextNode("    ");
            dom.appendChild(el0, el1);
            var el1 = dom.createComment("");
            dom.appendChild(el0, el1);
            var el1 = dom.createTextNode("\n");
            dom.appendChild(el0, el1);
            return el0;
          },
          render: function render(context, env, contextualElement) {
            var dom = env.dom;
            var hooks = env.hooks, get = hooks.get, inline = hooks.inline;
            dom.detectNamespace(contextualElement);
            var fragment;
            if (env.useFragmentCache && dom.canClone) {
              if (this.cachedFragment === null) {
                fragment = this.build(dom);
                if (this.hasRendered) {
                  this.cachedFragment = fragment;
                } else {
                  this.hasRendered = true;
                }
              }
              if (this.cachedFragment) {
                fragment = dom.cloneNode(this.cachedFragment, true);
              }
            } else {
              fragment = this.build(dom);
            }
            var morph0 = dom.createMorphAt(fragment,1,1,contextualElement);
            inline(env, morph0, context, "view", ["svg-g-click"], {"templateName": "node-technology", "node": get(env, context, "node"), "classNameTech": get(env, context, "className")});
            return fragment;
          }
        };
      }());
      return {
        isHTMLBars: true,
        revision: "Ember@1.11.0-beta.5",
        blockParams: 0,
        cachedFragment: null,
        hasRendered: false,
        build: function build(dom) {
          var el0 = dom.createDocumentFragment();
          var el1 = dom.createComment("");
          dom.appendChild(el0, el1);
          return el0;
        },
        render: function render(context, env, contextualElement) {
          var dom = env.dom;
          var hooks = env.hooks, get = hooks.get, block = hooks.block;
          dom.detectNamespace(contextualElement);
          var fragment;
          if (env.useFragmentCache && dom.canClone) {
            if (this.cachedFragment === null) {
              fragment = this.build(dom);
              if (this.hasRendered) {
                this.cachedFragment = fragment;
              } else {
                this.hasRendered = true;
              }
            }
            if (this.cachedFragment) {
              fragment = dom.cloneNode(this.cachedFragment, true);
            }
          } else {
            fragment = this.build(dom);
          }
          var morph0 = dom.createMorphAt(fragment,0,0,contextualElement);
          dom.insertBoundary(fragment, null);
          dom.insertBoundary(fragment, 0);
          block(env, morph0, context, "each", [get(env, context, "node.classNames")], {"keyword": "className"}, child0, null);
          return fragment;
        }
      };
    }());
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Debug grid ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Years lines ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Column Headers ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" parent to child ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" bind nodes ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Design Patterns ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment(" Technologies ");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        var el1 = dom.createComment("");
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        var hooks = env.hooks, get = hooks.get, block = hooks.block;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        var morph0 = dom.createMorphAt(fragment,3,3,contextualElement);
        var morph1 = dom.createMorphAt(fragment,7,7,contextualElement);
        var morph2 = dom.createMorphAt(fragment,11,11,contextualElement);
        var morph3 = dom.createMorphAt(fragment,15,15,contextualElement);
        var morph4 = dom.createMorphAt(fragment,19,19,contextualElement);
        var morph5 = dom.createMorphAt(fragment,23,23,contextualElement);
        var morph6 = dom.createMorphAt(fragment,27,27,contextualElement);
        block(env, morph0, context, "if", [get(env, context, "svgenv.showGrid")], {}, child0, null);
        block(env, morph1, context, "each", [get(env, context, "yearLines")], {"keyword": "line"}, child1, null);
        block(env, morph2, context, "each", [get(env, context, "model.headers")], {"keyword": "node"}, child2, null);
        block(env, morph3, context, "each", [get(env, context, "pathsToChildren")], {"keyword": "path"}, child3, null);
        block(env, morph4, context, "each", [get(env, context, "pathsBoundNodes")], {"keyword": "pathObj"}, child4, null);
        block(env, morph5, context, "each", [get(env, context, "model.dpatterns")], {"keyword": "node"}, child5, null);
        block(env, morph6, context, "each", [get(env, context, "model.technologies")], {"keyword": "node"}, child6, null);
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/angular', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("    ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n      AngularJS is a tool set for building the framework most suited to your application development.\n      It is maintained by Google and the community.\n      ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("blockquote");
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("p");
        var el4 = dom.createTextNode("\n          Angular is not a framework, it's an HTML compiler\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n        ");
        dom.appendChild(el2, el3);
        var el3 = dom.createElement("footer");
        var el4 = dom.createTextNode("\n          Misko Hevery, creator of Angular\n        ");
        dom.appendChild(el3, el4);
        dom.appendChild(el2, el3);
        var el3 = dom.createTextNode("\n      ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n    ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n    ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n      In 2012 Angular was declared a Model View Whatever library through a post made in the\n      ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","https://plus.google.com/+AngularJS/posts/aZNVhj355G2");
        var el3 = dom.createTextNode("AngularJS G+ account");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(".\n      It wasn't a very formal declaration, but it helped the term to take off.\n    ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/aspnet', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/backbone', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/cakephp', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/django', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/dolphin', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        Dolphin, the Object Arts Ltd implementation of Smalltalk, used MVP as its UI model. \n        The research and reasonings behind that decision are found in a paper by Andy Bower and Blair McGlashan called: \n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","papers/mvp-dolphin.pdf");
        var el3 = dom.createTextNode("Twisting the triad");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode(", published in 2000.\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        In their research about MVC, they used VisualWorks 2.5 which actually refers to Application Model \n        and in their paper both terms are used interchangeably.\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        A detailed timeline about Dolphin can be fount at:\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://www.idb.me.uk/idb/about.html");
        var el3 = dom.createTextNode("Ian's Dolphin Smalltalk Pages");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/drupal', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        Drupal is a content management framework and the core installation can serve as a simple web site, a single or multi-user blog, an Internet forum, or a community web site providing for user-generated content.\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        The framework has been around for a long time and different versions will reflect different MVC designs.\n        It has been described a couple of times as a PAC architecture.\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/ember', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        Its an opinionated JavaScript framework that embraces the concept of convention over configuration.\n        It was originally being developed as SproutCore 2.0, but it changed course, the announcement:\n        ");
        dom.appendChild(el1, el2);
        var el2 = dom.createElement("a");
        dom.setAttribute(el2,"href","http://yehudakatz.com/2011/12/12/amber-js-formerly-sproutcore-2-0-is-now-ember-js/");
        var el3 = dom.createTextNode("\n          Amber.js (formerly SproutCore 2.0) is now Ember.js\n        ");
        dom.appendChild(el2, el3);
        dom.appendChild(el1, el2);
        var el2 = dom.createTextNode("\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/j2ee', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/jsf', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/knockout', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        JavaScript library developed by Microsoft that uses the MVVM pattern.\n        Some call it a data binding library and is not wrong since that is a key feature of MVVM.\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/msaccess', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/nextstep', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        NextSTEP is an object-oriented, multitasking operating system which was developed by NeXT Computer, Inc.\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        Tim Berners Lee once commented that his pioneering World-Wide-Web application was only feasible at the time because of NeXTstep.\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n      ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n        NeXTstep was later modified to separate the underlying operating system from the higher-level object libraries.\n        The result was the OpenStep API, a predecesor of Mac OS X and the Cocoa API.\n      ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/rails', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/silverlight', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/sproutcore', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        var el1 = dom.createTextNode("        ");
        dom.appendChild(el0, el1);
        var el1 = dom.createElement("p");
        var el2 = dom.createTextNode("\n          Developed by Apple and claims to have kicked off the JS-MVC movement, its inspired by Cocoa.\n        ");
        dom.appendChild(el1, el2);
        dom.appendChild(el0, el1);
        var el1 = dom.createTextNode("\n\n");
        dom.appendChild(el0, el1);
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/struts', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/swing', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/templates/technologies/zend', ['exports'], function (exports) {

  'use strict';

  exports['default'] = Ember.HTMLBars.template((function() {
    return {
      isHTMLBars: true,
      revision: "Ember@1.11.0-beta.5",
      blockParams: 0,
      cachedFragment: null,
      hasRendered: false,
      build: function build(dom) {
        var el0 = dom.createDocumentFragment();
        return el0;
      },
      render: function render(context, env, contextualElement) {
        var dom = env.dom;
        dom.detectNamespace(contextualElement);
        var fragment;
        if (env.useFragmentCache && dom.canClone) {
          if (this.cachedFragment === null) {
            fragment = this.build(dom);
            if (this.hasRendered) {
              this.cachedFragment = fragment;
            } else {
              this.hasRendered = true;
            }
          }
          if (this.cachedFragment) {
            fragment = dom.cloneNode(this.cachedFragment, true);
          }
        } else {
          fragment = this.build(dom);
        }
        return fragment;
      }
    };
  }()));

});
define('mvctree/tests/acceptance/index-test', ['ember', 'qunit', 'mvctree/tests/helpers/start-app'], function (Ember, qunit, startApp) {

  'use strict';

  var application;

  qunit.module("Acceptance: Index", {
    beforeEach: function beforeEach() {
      application = startApp['default']();
    },

    afterEach: function afterEach() {
      Ember['default'].run(application, "destroy");
    }
  });

  //TODO: avoid using run.later() by adding an async helper that will wait
  // on a promise returned by the svg-g view.
  // http://stackoverflow.com/questions/26498845
  // for now its good enough

  qunit.test("visiting /#pac", function (assert) {
    var $panel = find("#pac");
    assert.ok(!$panel.isInView(), "panel is not visible on screen");

    visit("/#pac");

    andThen(function () {
      assert.equal(currentPath(), "index", "current path");
      assert.equal(currentURL(), "/#pac", "current URL");

      // TODO: enable this test
      // it has to wait for the scroll animation (view:svg-g-click) to finish
      // assert.ok( $panel.isInView(), 'panel is visible on screen');
    });
  });

  qunit.test("TMVE", function (assert) {
    visit("/");

    var $panel = find("#tmve");
    assert.ok(!$panel.isInView(), "panel is not visible on screen");

    click("svg .g_tmve");

    andThen(function () {
      assert.equal(currentPath(), "index");
      assert.equal("/" + window.location.hash, "/#tmve");

      assert.notEqual(currentURL(), "/#tmve", "we did not enter this ember route");

      // TODO: enable this test
      // it has to wait for the scroll animation (view:svg-g-click) to finish
      // assert.ok( $panel.isInView(), 'panel is visible on screen');
    });
  });

  qunit.test("click select", function (assert) {
    visit("/#tmve");

    var $select = find("#tmve .ember-select"),
        $compareToList = find("#tmve .compare_to");
    assert.ok(!$compareToList.children().length, "empty list");

    fillIn("#tmve .ember-select", "mvc79");

    andThen(function () {
      assert.ok(!!$compareToList.children().length, "populated list");
    });
  });

});
define('mvctree/tests/acceptance/index-test.jshint', function () {

  'use strict';

  module('JSHint - acceptance');
  test('acceptance/index-test.js should pass jshint', function() { 
    ok(true, 'acceptance/index-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/app.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('app.js should pass jshint', function() { 
    ok(true, 'app.js should pass jshint.'); 
  });

});
define('mvctree/tests/components/definitions-showcase.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/definitions-showcase.js should pass jshint', function() { 
    ok(true, 'components/definitions-showcase.js should pass jshint.'); 
  });

});
define('mvctree/tests/components/tabbed-drawer.jshint', function () {

  'use strict';

  module('JSHint - components');
  test('components/tabbed-drawer.js should pass jshint', function() { 
    ok(true, 'components/tabbed-drawer.js should pass jshint.'); 
  });

});
define('mvctree/tests/controllers/index.jshint', function () {

  'use strict';

  module('JSHint - controllers');
  test('controllers/index.js should pass jshint', function() { 
    ok(true, 'controllers/index.js should pass jshint.'); 
  });

});
define('mvctree/tests/helpers/resolver', ['exports', 'ember/resolver', 'mvctree/config/environment'], function (exports, Resolver, config) {

  'use strict';

  var resolver = Resolver['default'].create();

  resolver.namespace = {
    modulePrefix: config['default'].modulePrefix,
    podModulePrefix: config['default'].podModulePrefix
  };

  exports['default'] = resolver;

});
define('mvctree/tests/helpers/resolver.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/resolver.js should pass jshint', function() { 
    ok(true, 'helpers/resolver.js should pass jshint.'); 
  });

});
define('mvctree/tests/helpers/start-app', ['exports', 'ember', 'mvctree/app', 'mvctree/router', 'mvctree/config/environment'], function (exports, Ember, Application, Router, config) {

  'use strict';



  exports['default'] = startApp;
  function startApp(attrs) {
    var application;

    var attributes = Ember['default'].merge({}, config['default'].APP);
    attributes = Ember['default'].merge(attributes, attrs); // use defaults, but you can override;

    Ember['default'].run(function () {
      application = Application['default'].create(attributes);
      application.setupForTesting();
      application.injectTestHelpers();
    });

    return application;
  }

});
define('mvctree/tests/helpers/start-app.jshint', function () {

  'use strict';

  module('JSHint - helpers');
  test('helpers/start-app.js should pass jshint', function() { 
    ok(true, 'helpers/start-app.js should pass jshint.'); 
  });

});
define('mvctree/tests/initializers/preload-data.jshint', function () {

  'use strict';

  module('JSHint - initializers');
  test('initializers/preload-data.js should pass jshint', function() { 
    ok(true, 'initializers/preload-data.js should pass jshint.'); 
  });

});
define('mvctree/tests/initializers/svg-environment-service.jshint', function () {

  'use strict';

  module('JSHint - initializers');
  test('initializers/svg-environment-service.js should pass jshint', function() { 
    ok(true, 'initializers/svg-environment-service.js should pass jshint.'); 
  });

});
define('mvctree/tests/jsons/dpatterns.jshint', function () {

  'use strict';

  module('JSHint - jsons');
  test('jsons/dpatterns.js should pass jshint', function() { 
    ok(true, 'jsons/dpatterns.js should pass jshint.'); 
  });

});
define('mvctree/tests/jsons/headers.jshint', function () {

  'use strict';

  module('JSHint - jsons');
  test('jsons/headers.js should pass jshint', function() { 
    ok(true, 'jsons/headers.js should pass jshint.'); 
  });

});
define('mvctree/tests/jsons/technologies.jshint', function () {

  'use strict';

  module('JSHint - jsons');
  test('jsons/technologies.js should pass jshint', function() { 
    ok(true, 'jsons/technologies.js should pass jshint.'); 
  });

});
define('mvctree/tests/mixins/coordinates-factory.jshint', function () {

  'use strict';

  module('JSHint - mixins');
  test('mixins/coordinates-factory.js should pass jshint', function() { 
    ok(true, 'mixins/coordinates-factory.js should pass jshint.'); 
  });

});
define('mvctree/tests/mixins/path-factory.jshint', function () {

  'use strict';

  module('JSHint - mixins');
  test('mixins/path-factory.js should pass jshint', function() { 
    ok(true, 'mixins/path-factory.js should pass jshint.'); 
  });

});
define('mvctree/tests/models/grid-node.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/grid-node.js should pass jshint', function() { 
    ok(true, 'models/grid-node.js should pass jshint.'); 
  });

});
define('mvctree/tests/models/node-dpattern.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/node-dpattern.js should pass jshint', function() { 
    ok(true, 'models/node-dpattern.js should pass jshint.'); 
  });

});
define('mvctree/tests/models/node-header.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/node-header.js should pass jshint', function() { 
    ok(true, 'models/node-header.js should pass jshint.'); 
  });

});
define('mvctree/tests/models/node-technology.jshint', function () {

  'use strict';

  module('JSHint - models');
  test('models/node-technology.js should pass jshint', function() { 
    ok(true, 'models/node-technology.js should pass jshint.'); 
  });

});
define('mvctree/tests/router.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('router.js should pass jshint', function() { 
    ok(true, 'router.js should pass jshint.'); 
  });

});
define('mvctree/tests/routes/about.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/about.js should pass jshint', function() { 
    ok(true, 'routes/about.js should pass jshint.'); 
  });

});
define('mvctree/tests/routes/index.jshint', function () {

  'use strict';

  module('JSHint - routes');
  test('routes/index.js should pass jshint', function() { 
    ok(true, 'routes/index.js should pass jshint.'); 
  });

});
define('mvctree/tests/serializers/node-dpattern.jshint', function () {

  'use strict';

  module('JSHint - serializers');
  test('serializers/node-dpattern.js should pass jshint', function() { 
    ok(true, 'serializers/node-dpattern.js should pass jshint.'); 
  });

});
define('mvctree/tests/services/svg-environment.jshint', function () {

  'use strict';

  module('JSHint - services');
  test('services/svg-environment.js should pass jshint', function() { 
    ok(true, 'services/svg-environment.js should pass jshint.'); 
  });

});
define('mvctree/tests/test-helper', ['mvctree/tests/helpers/resolver', 'ember-qunit'], function (resolver, ember_qunit) {

	'use strict';

	ember_qunit.setResolver(resolver['default']);

});
define('mvctree/tests/test-helper.jshint', function () {

  'use strict';

  module('JSHint - .');
  test('test-helper.js should pass jshint', function() { 
    ok(true, 'test-helper.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/components/definitions-showcase-test', ['ember-qunit', 'ember'], function (ember_qunit, Ember) {

  'use strict';

  ember_qunit.moduleForComponent("definitions-showcase", {
    // specify the other units that are required for this test
    // needs: ['component:foo', 'helper:bar']

    setup: function setup() {}
  });

  ember_qunit.test("it renders", function (assert) {
    assert.expect(2);

    // creates the component instance
    var component = this.subject();
    assert.equal(component._state, "preRender", "preRender");

    // appends the component to the page
    this.render();
    assert.equal(component._state, "inDOM", "inDOM");
  });

});
define('mvctree/tests/unit/components/definitions-showcase-test.jshint', function () {

  'use strict';

  module('JSHint - unit/components');
  test('unit/components/definitions-showcase-test.js should pass jshint', function() { 
    ok(true, 'unit/components/definitions-showcase-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/components/tabbed-drawer-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleForComponent("tabbed-drawer", {});

  ember_qunit.test("it renders", function (assert) {
    assert.expect(2);

    // creates the component instance
    var component = this.subject();
    assert.equal(component._state, "preRender");

    // renders the component to the page
    this.render();
    assert.equal(component._state, "inDOM");
  });

  // specify the other units that are required for this test
  // needs: ['component:foo', 'helper:bar']

});
define('mvctree/tests/unit/components/tabbed-drawer-test.jshint', function () {

  'use strict';

  module('JSHint - unit/components');
  test('unit/components/tabbed-drawer-test.js should pass jshint', function() { 
    ok(true, 'unit/components/tabbed-drawer-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/controllers/index-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("controller:index", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function (assert) {
    var controller = this.subject();
    assert.ok(controller);
  });

  ember_qunit.test("gridLines 1x1", function (assert) {
    var controller = this.subject({
      svgenv: {
        colW: 40, rowH: 50,
        maxCols: 1, maxRows: 1,
        viewBoxW: 40, viewBoxH: 50 }
    });

    var gridLines = ["M0 0 V50 Z", "M0 0 H40 Z"];
    assert.deepEqual(controller.get("gridLines"), gridLines, "1x1");
  });

  ember_qunit.test("gridLines 2x2", function (assert) {
    var controller = this.subject({
      svgenv: {
        colW: 20, rowH: 30,
        maxCols: 2, maxRows: 2,
        viewBoxW: 40, viewBoxH: 60
      }
    });
    var gridLines = ["M0 0 V60 Z", "M20 0 V60 Z", "M0 0 H40 Z", "M0 30 H40 Z"];
    assert.deepEqual(controller.get("gridLines"), gridLines, "2x2");
  });

  ember_qunit.test("gridLines 0x0", function (assert) {
    var controller = this.subject({
      svgenv: {
        colW: 0, rowH: 0,
        maxCols: 2, maxRows: 2,
        viewBoxW: 0, viewBoxH: 0
      }
    });
    var gridLines = [];
    assert.deepEqual(controller.get("gridLines"), gridLines, "colW and rowH are 0");
  });

  ember_qunit.test("_buildYearLine", function (assert) {
    var controller = this.subject({
      svgenv: {
        colW: 30, rowH: 60,
        maxCols: 1, maxRows: 1,
        viewBoxW: 30, viewBoxH: 60,
        yearLineFontSize: 12
      }
    });

    var yearLine = { year: 1514, x: 24, y: 0,
      path: "M48 0 H30" };
    assert.deepEqual(controller._buildYearLine(1514, 0), yearLine);

    yearLine = { year: 1514, x: 24, y: 60,
      path: "M48 60 H30" };
    assert.deepEqual(controller._buildYearLine(1514, 1), yearLine);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('mvctree/tests/unit/controllers/index-test.jshint', function () {

  'use strict';

  module('JSHint - unit/controllers');
  test('unit/controllers/index-test.js should pass jshint', function() { 
    ok(true, 'unit/controllers/index-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/initializers/preload-data-test', ['ember', 'mvctree/initializers/preload-data', 'qunit', 'mvctree/models/grid-node', 'mvctree/models/node-dpattern', 'mvctree/models/node-technology', 'mvctree/models/node-header', 'mvctree/initializers/svg-environment-service', 'mvctree/services/svg-environment'], function (Ember, preload_data, qunit, GridNode, NodeDPattern, NodeTechnology, NodeHeader, SvgEnvironmentService, SvgEnvironment) {

  'use strict';

  var container, application;

  qunit.module("initializer:preload-data", {
    beforeEach: function beforeEach() {
      Ember['default'].run(function () {
        application = Ember['default'].Application.create();
        container = application.__container__;
        application.deferReadiness();

        container.register("model:grid-node", GridNode['default']);
        container.register("model:node-dpattern", NodeDPattern['default']);
        container.register("model:node-technology", NodeTechnology['default']);
        container.register("model:node-header", NodeHeader['default']);

        container.register("service:svg-environment", SvgEnvironment['default']);
        SvgEnvironmentService['default'].initialize(container, application);
      });
    }
  });

  // Replace this with your real tests.
  qunit.test("it works", function (assert) {
    Ember['default'].run(function () {
      preload_data.initialize(container, application);
    });

    // you would normally confirm the results of the initializer here
    assert.ok(true);
  });

});
define('mvctree/tests/unit/initializers/preload-data-test.jshint', function () {

  'use strict';

  module('JSHint - unit/initializers');
  test('unit/initializers/preload-data-test.js should pass jshint', function() { 
    ok(true, 'unit/initializers/preload-data-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/mixins/coordinates-factory-test', ['ember', 'mvctree/mixins/coordinates-factory', 'qunit'], function (Ember, CoordinatesFactoryMixin, qunit) {

  'use strict';

  qunit.module("mixin:coordinates-factory");

  qunit.test("it works", function (assert) {
    var CoordinatesFactoryObject = Ember['default'].Object.extend(CoordinatesFactoryMixin['default']);
    var subject = CoordinatesFactoryObject.create();
    assert.ok(subject);
  });

  qunit.test("getBorderPos", function (assert) {
    var CoordinatesFactoryObject = Ember['default'].Object.extend(CoordinatesFactoryMixin['default']);
    var subject = CoordinatesFactoryObject.create({
      svgenv: Ember['default'].Object.create({
        colW: 30,
        rowH: 30,
        paddingT: 0,
        paddingR: 0,
        paddingB: 0,
        paddingL: 0 })
    });

    // padding 0

    // top
    var gridNode = Ember['default'].Object.create({ x: 0, y: 0 });
    var expected = { x: 15, y: 0 };
    var options = { border: "top" };
    assert.deepEqual(subject.getBorderPos(gridNode, options), expected);

    // right
    gridNode = Ember['default'].Object.create({ x: 0, y: 0 });
    expected = { x: 30, y: 15 };
    options = { border: "right" };
    assert.deepEqual(subject.getBorderPos(gridNode, options), expected);

    // bottom
    gridNode = Ember['default'].Object.create({ x: 0, y: 0 });
    expected = { x: 15, y: 30 };
    options = { border: "bottom" };
    assert.deepEqual(subject.getBorderPos(gridNode, options), expected);

    // left
    gridNode = Ember['default'].Object.create({ x: 0, y: 0 });
    expected = { x: 0, y: 15 };
    options = { border: "left" };
    assert.deepEqual(subject.getBorderPos(gridNode, options), expected);

    // padding 7

    subject.svgenv.set("paddingT", 7);
    subject.svgenv.set("paddingR", 7);
    subject.svgenv.set("paddingB", 7);
    subject.svgenv.set("paddingL", 7);

    // top
    gridNode = Ember['default'].Object.create({ x: 0, y: 0 });
    expected = { x: 15, y: 7 };
    options = { border: "top" };
    assert.deepEqual(subject.getBorderPos(gridNode, options), expected);

    // right
    gridNode = Ember['default'].Object.create({ x: 0, y: 0 });
    expected = { x: 23, y: 15 };
    options = { border: "right" };
    assert.deepEqual(subject.getBorderPos(gridNode, options), expected);

    // bottom
    gridNode = Ember['default'].Object.create({ x: 0, y: 0 });
    expected = { x: 15, y: 23 };
    options = { border: "bottom" };
    assert.deepEqual(subject.getBorderPos(gridNode, options), expected);

    // left
    gridNode = Ember['default'].Object.create({ x: 0, y: 0 });
    expected = { x: 7, y: 15 };
    options = { border: "left" };
    assert.deepEqual(subject.getBorderPos(gridNode, options), expected);
  });

});
define('mvctree/tests/unit/mixins/coordinates-factory-test.jshint', function () {

  'use strict';

  module('JSHint - unit/mixins');
  test('unit/mixins/coordinates-factory-test.js should pass jshint', function() { 
    ok(true, 'unit/mixins/coordinates-factory-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/mixins/path-factory-test', ['ember', 'mvctree/mixins/path-factory', 'qunit'], function (Ember, PathFactoryMixin, qunit) {

  'use strict';

  qunit.module("mixin:path-factory");

  // Replace this with your real tests.
  qunit.test("it works", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default']);
    var subject = PathFactoryObject.create();
    assert.ok(subject);
  });

  qunit.test("_calcHDir", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default']);
    var subject = PathFactoryObject.create();

    assert.equal(subject._calcHDir(0, 0), 1);
    assert.equal(subject._calcHDir(0, 1), 1);
    assert.equal(subject._calcHDir(1, 0), -1);
    assert.equal(subject._calcHDir(1, 1), 1);

    assert.equal(subject._calcHDir(50, 50), 1);
    assert.equal(subject._calcHDir(10, 20), 1);
    assert.equal(subject._calcHDir(20, 10), -1);
  });

  qunit.test("_calcVDir", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default']);
    var subject = PathFactoryObject.create();

    // row1, row2
    assert.equal(subject._calcVDir(0, 0), -1);
    assert.equal(subject._calcVDir(0, 1), 1);
    assert.equal(subject._calcVDir(1, 0), -1);
    assert.equal(subject._calcVDir(1, 1), -1);

    assert.equal(subject._calcVDir(6, 13), 1);
  });

  qunit.test("_calcHDelta", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default']);
    var subject = PathFactoryObject.create();

    assert.equal(subject._calcHDelta(0, 0), 0, "0, 0");
    assert.equal(subject._calcHDelta(0, 1), 0, "0, 1");
    assert.equal(subject._calcHDelta(1, 0), 0, "1, 0");
    assert.equal(subject._calcHDelta(1, 1), 0, "1, 1");

    assert.equal(subject._calcHDelta(0, 2), 1);
    assert.equal(subject._calcHDelta(2, 0), 1);

    assert.equal(subject._calcHDelta(0, 10), 9);
    assert.equal(subject._calcHDelta(10, 0), 9);
  });

  qunit.test("_calcVDelta", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default']);
    var subject = PathFactoryObject.create();

    assert.equal(subject._calcVDelta(0, 0), 1);
    assert.equal(subject._calcVDelta(0, 1), 0);
    assert.equal(subject._calcVDelta(1, 0), 2);
    assert.equal(subject._calcVDelta(1, 1), 1);

    assert.equal(subject._calcVDelta(0, 2), 1);
    assert.equal(subject._calcVDelta(2, 0), 1);

    assert.equal(subject._calcVDelta(0, 10), 9);
    assert.equal(subject._calcVDelta(10, 0), 9);
  });

  qunit.test("_genHPathP2C", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        colW: 60
      })
    });
    var subject = PathFactoryObject.create();

    // hDelta, vDelta
    assert.equal(subject._genHPathP2C(0, 0), "");
    assert.equal(subject._genHPathP2C(1, 0), "h30");
    assert.equal(subject._genHPathP2C(0, 1), "");
    assert.equal(subject._genHPathP2C(1, 1), "h30");

    assert.equal(subject._genHPathP2C(0, 2), "h30");
    assert.equal(subject._genHPathP2C(2, 0), "h30");
  });

  qunit.test("_genHPathC2Ch", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        colW: 60
      })
    });
    var subject = PathFactoryObject.create();

    // 2x2
    assert.equal(subject._genHPathC2Ch(0, 0), "");
    assert.equal(subject._genHPathC2Ch(0, 1), "");
    assert.equal(subject._genHPathC2Ch(1, 0), "h30");
    assert.equal(subject._genHPathC2Ch(1, 1), "h30");

    // 3x2
    assert.equal(subject._genHPathC2Ch(2, 0), "h30");
    assert.equal(subject._genHPathC2Ch(2, 1), "h30");

    // 2x3
    assert.equal(subject._genHPathC2Ch(0, 2), "h-30");
    assert.equal(subject._genHPathC2Ch(1, 2), "h30");
  });

  qunit.test("_genPathC2C basic", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        colW: 40,
        rowH: 40
      })
    });
    var subject = PathFactoryObject.create();

    /* 2x2 */

    var result = subject._genPathC2C(0, 0, 0, 0),
        expected = null;
    assert.equal(result, expected, "same node");

    result = subject._genPathC2C(0, 0, 1, 0);
    expected = "v-40";
    assert.equal(result, expected, "node to the right");

    result = subject._genPathC2C(1, 0, 0, 0);
    expected = "v-40";
    assert.equal(result, expected, "node to the left");

    result = subject._genPathC2C(0, 0, 0, 1);
    expected = null;
    assert.equal(result, expected, "node below");

    result = subject._genPathC2C(0, 0, 1, 1);
    expected = null;
    assert.equal(result, expected, "diagonal node");

    /* 2x3 */

    /* 0,0 */
    result = subject._genPathC2C(0, 0, 2, 0);
    expected = "h40 v-40";
    assert.equal(result, expected, "(0,0) (2,0)");

    result = subject._genPathC2C(2, 0, 0, 0);
    expected = "h-40 v-40";
    assert.equal(result, expected, "(2,0) (0,0)");

    result = subject._genPathC2C(0, 0, 2, 1);
    expected = "h40";
    assert.equal(result, expected, "(0,0) (2,1)");

    result = subject._genPathC2C(2, 1, 0, 0);
    expected = "h-40 v-80";
    assert.equal(result, expected, "(2,1) (0,0)");

    /* 0,1 */
    result = subject._genPathC2C(0, 1, 2, 0);
    expected = "h40 v-80";
    assert.equal(result, expected, "(0,1) (2,0)");

    result = subject._genPathC2C(0, 1, 2, 1);
    expected = "h40 v-40";
    assert.equal(result, expected, "(0,1) (2,1)");

    result = subject._genPathC2C(2, 0, 0, 1);
    expected = "h-40";
    assert.equal(result, expected, "(2,0) (0,1)");

    result = subject._genPathC2C(2, 1, 0, 1);
    expected = "h-40 v-40";
    assert.equal(result, expected, "(2,1) (0,1)");

    /* 3x2 */

    /* 0,0 */
    result = subject._genPathC2C(0, 0, 0, 2);
    expected = "v40";
    assert.equal(result, expected, "(0,0) (0,2)");

    result = subject._genPathC2C(0, 2, 0, 0);
    expected = "v-40";
    assert.equal(result, expected, "(0,2) (0,0)");

    result = subject._genPathC2C(0, 0, 1, 2);
    expected = "v40";
    assert.equal(result, expected, "(0,0) (1,2)");

    result = subject._genPathC2C(1, 2, 0, 0);
    expected = "v-40";
    assert.equal(result, expected, "(1,2) (0,0)");

    /* 1,0 */
    result = subject._genPathC2C(1, 0, 0, 2);
    expected = "v40";
    assert.equal(result, expected, "(1,0) (0,2)");

    result = subject._genPathC2C(0, 2, 1, 0);
    expected = "v-40";
    assert.equal(result, expected, "(0,2) (1,0)");

    result = subject._genPathC2C(1, 0, 1, 2);
    expected = "v40";
    assert.equal(result, expected, "(1,0) (1,2)");

    result = subject._genPathC2C(1, 2, 1, 0);
    expected = "v-40";
    assert.equal(result, expected, "(1,2) (1,0)");
  });

  qunit.test("_getHMultC2C", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        colW: 40,
        rowH: 40
      })
    });
    var subject = PathFactoryObject.create();

    var result = subject._getHMultC2C(0);
    var expected = 0;
    assert.equal(result, expected);

    result = subject._getHMultC2C(1);
    expected = 0;
    assert.equal(result, expected);

    result = subject._getHMultC2C(-1);
    expected = 0;
    assert.equal(result, expected);

    result = subject._getHMultC2C(2);
    expected = 1;
    assert.equal(result, expected, "2");

    result = subject._getHMultC2C(-2);
    expected = 0;
    assert.equal(result, expected, "-2");
  });

  qunit.test("_getVMultC2C", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        colW: 40,
        rowH: 40
      })
    });
    var subject = PathFactoryObject.create();

    var result = subject._getVMultC2C(0);
    var expected = 0;
    assert.equal(result, expected, "vDelta 0");

    result = subject._getVMultC2C(1);
    expected = 0;
    assert.equal(result, expected, "vDelta 1");

    result = subject._getVMultC2C(-1);
    expected = 0;
    assert.equal(result, expected, "vDelta -1");

    result = subject._getVMultC2C(2);
    expected = 1;
    assert.equal(result, expected, "vDelta 2");

    result = subject._getVMultC2C(-2);
    expected = -1;
    assert.equal(result, expected, "vDelta -2");

    result = subject._getVMultC2C(-7);
    expected = -6;
    assert.equal(result, expected, "(3,14) (6,7) vDelta -7");

    result = subject._getVMultC2C(7);
    expected = 6;
    assert.equal(result, expected, "(3,7) (6,14) vDelta 7");
  });

  qunit.test("_genPathC2CR basic", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        colW: 40,
        rowH: 40
      })
    });
    var subject = PathFactoryObject.create();

    /* 2x2 */

    var result = subject._genPathC2CR(0, 0),
        expected = null;
    assert.equal(result, expected, "same node");

    result = subject._genPathC2CR(1, 0);
    expected = null;
    assert.equal(result, expected, "node to the right");

    result = subject._genPathC2CR(-1, 0);
    expected = null;
    assert.equal(result, expected, "node to the left");

    result = subject._genPathC2CR(0, 1);
    expected = null;
    assert.equal(result, expected, "node below");

    result = subject._genPathC2CR(1, 1);
    expected = null;
    assert.equal(result, expected, "diagonal node");

    /* 2x3 */

    /* 0,0 */
    result = subject._genPathC2CR(2, 0);
    expected = "h40";
    assert.equal(result, expected, "(0,0) (2,0)");

    result = subject._genPathC2CR(2, 1);
    expected = "h40";
    assert.equal(result, expected, "(0,0) (2,1)");

    /* 0,1 */
    result = subject._genPathC2CR(2, -1);
    expected = "h40";
    assert.equal(result, expected, "(0,1) (2,0)");

    result = subject._genPathC2CR(2, 0);
    expected = "h40";
    assert.equal(result, expected, "(0,1) (2,1)");

    /* 3x2 */

    /* 0,0 */
    result = subject._genPathC2CR(0, 2);
    expected = "v40";
    assert.equal(result, expected, "(0,0) (0,2)");

    result = subject._genPathC2CR(1, 2);
    expected = "v40";
    assert.equal(result, expected, "(0,0) (1,2)");

    /* 1,0 */
    result = subject._genPathC2CR(-1, 2);
    expected = "v40";
    assert.equal(result, expected, "(1,0) (0,2)");

    result = subject._genPathC2CR(0, 2);
    expected = "v40";
    assert.equal(result, expected, "(1,0) (1,2)");

    // non basic cases

    result = subject._genPathC2CR(3, -7);
    expected = "h80 v-240";
    assert.equal(result, expected, "(3,14) (6,7)");
  });

  qunit.test("_genPathC2C 5x5", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        paddingT: 20,
        paddingB: 20,
        colW: 100,
        rowH: 100
      })
    });
    var subject = PathFactoryObject.create();

    var x = 150,
        y = 200,
        result = subject._genPathC2C(1, 1, 3, 3),
        expected = "h100 v100";
    assert.equal(result, expected, "(1,1) (3,3)");

    x = 350;y = 400;
    result = subject._genPathC2C(3, 3, 1, 1);
    expected = "h-100 v-100";
    assert.equal(result, expected, "(3,3) (1,1)");
  });

  qunit.test("generatePathToChild", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        paddingT: 5,
        paddingB: 5,
        colW: 40,
        rowH: 20
      })
    });
    var subject = PathFactoryObject.create();

    var a = Ember['default'].Object.create({
      col: 0,
      row: 0
    }),
        b = Ember['default'].Object.create({
      col: 0,
      row: 0
    }),
        result = subject.generatePathToChild(a, b),
        expected = "";
    assert.equal(result, expected, "same node");
    /*
       __
      |a |
      |_b|
    */
    a = Ember['default'].Object.create({
      col: 0,
      row: 0,
      x: 0,
      y: 0,
      width: 40,
      height: 10,
      cx: 20,
      y_padded: 5 });
    b = Ember['default'].Object.create({
      col: 1,
      row: 1
    });
    result = subject.generatePathToChild(a, b);
    expected = "M20 15 v5 h20 h20 h-2.5 l2.5 5 l2.5 -5 h-2.5";
    assert.equal(result, expected, "diagonal");

    /*
       __
      |ab|
      |__|
    */
    a = Ember['default'].Object.create({
      col: 0,
      row: 0,
      x: 0,
      y: 0,
      width: 40,
      height: 10,
      cx: 20,
      y_padded: 5 });
    b = Ember['default'].Object.create({
      col: 1,
      row: 0 });
    result = subject.generatePathToChild(a, b);
    expected = "M20 15 v5 h20 v-20 h20 h-2.5 l2.5 5 l2.5 -5 h-2.5";
    assert.equal(result, expected, "node to the right (0,0) (1,0)");

    /*
       __
      |a |
      |b_|
    */
    a = Ember['default'].Object.create({
      col: 0,
      row: 0,
      x: 0,
      y: 0,
      width: 40,
      height: 10,
      cx: 20,
      y_padded: 5 });
    b = Ember['default'].Object.create({
      col: 0,
      row: 1 });
    result = subject.generatePathToChild(a, b);
    expected = "M20 15 v5 h-2.5 l2.5 5 l2.5 -5 h-2.5";
    assert.equal(result, expected, "node to the right (0,0) (1,0)");
  });

  qunit.test("generatePathToChild am -> pm", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        paddingT: 6,
        paddingR: 6,
        paddingB: 12,
        paddingL: 6,
        colW: 170 + 12,
        rowH: 64 + 18
      })
    });
    var subject = PathFactoryObject.create();

    var a = Ember['default'].Object.create({
      col: 1,
      row: 6,
      x: 182,
      y: 492,
      width: 170,
      height: 64,
      cx: 273,
      y_padded: 498 }),
        b = Ember['default'].Object.create({
      col: 1,
      row: 13 }),
        result = subject.generatePathToChild(a, b),
        expected = "M273 562 v12 h91 v492 h-91 h-3 l3 6 l3 -6 h-3";
    assert.equal(result, expected);
  });

  qunit.test("_genVPathN2C", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        rowH: 40
      })
    });
    var subject = PathFactoryObject.create();

    // hDelta 0

    var result = subject._genVPathN2C(0, 0);
    var expected = null;
    assert.equal(result, expected);

    result = subject._genVPathN2C(0, 1);
    expected = "v20";
    assert.equal(result, expected);

    result = subject._genVPathN2C(0, -1);
    expected = "v-20";
    assert.equal(result, expected, "hDelta 0 vDelta -1");

    // hDelta 1

    result = subject._genVPathN2C(1, 0);
    expected = null;
    assert.equal(result, expected, "same row, contiguous");

    result = subject._genVPathN2C(1, 1);
    expected = "v20";
    assert.equal(result, expected);

    result = subject._genVPathN2C(1, -1);
    expected = "v-20";
    assert.equal(result, expected, "hDelta 1 vDelta -1");

    // hDelta -1

    result = subject._genVPathN2C(-1, 0);
    expected = null;
    assert.equal(result, expected, "do not accept a right-to-left direction");
  });

  qunit.test("generateBindingPath 3x2 simple", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        colW: 40,
        rowH: 40,
        paddingT: 0,
        paddingR: 0,
        paddingB: 0,
        paddingL: 0
      })
    });
    var subject = PathFactoryObject.create();

    // #__
    // ___
    var a = Ember['default'].Object.create({ col: 0, row: 0, x: 0, y: 0 });
    var b = Ember['default'].Object.create({ col: 0, row: 0, x: 0, y: 0 });
    var result = subject.generateBindingPath(a, b);
    var expected = null;
    assert.equal(result, expected, "same node");

    // ##_
    // ___
    a = Ember['default'].Object.create({ col: 0, row: 0, x: 0, y: 0 });
    b = Ember['default'].Object.create({ col: 1, row: 0, x: 40, y: 0 });
    result = subject.generateBindingPath(a, b);
    expected = null;
    assert.equal(result, expected, "contiguous a b (0,0) (1,0)");

    result = subject.generateBindingPath(b, a);
    assert.equal(result, expected, "same row, contiguous b a");

    // 3x2

    // #_#
    // ___
    a = Ember['default'].Object.create({ col: 0, row: 0, x: 0, y: 0 });
    b = Ember['default'].Object.create({ col: 2, row: 0, x: 80, y: 0 });
    result = subject.generateBindingPath(a, b);
    expected = "M40 20 v20 h40 v-20";
    assert.equal(result, expected, "(0,0) (2,0)");

    result = subject.generateBindingPath(b, a);
    assert.equal(result, expected, "(0,0) (2,0)");

    // #__
    // __#
    a = Ember['default'].Object.create({ col: 0, row: 0, x: 0, y: 0 });
    b = Ember['default'].Object.create({ col: 2, row: 1, x: 0, y: 0 });
    result = subject.generateBindingPath(a, b);
    expected = "M40 20 v20 h40 v20";
    assert.equal(result, expected, "(0,0) (2,1)");

    result = subject.generateBindingPath(b, a);
    assert.equal(result, expected);

    // __#
    // #__
    a = Ember['default'].Object.create({ col: 0, row: 1, x: 0, y: 40 });
    b = Ember['default'].Object.create({ col: 2, row: 0, x: 80, y: 0 });
    result = subject.generateBindingPath(a, b);
    expected = "M40 60 v-20 h40 v-20";
    assert.equal(result, expected, "(0,1) (2,0)");

    result = subject.generateBindingPath(b, a);
    assert.equal(result, expected, "(2,0) (0,1)");

    // 2x3

    // _#
    // __
    // _#
    a = Ember['default'].Object.create({ col: 1, row: 0, x: 40, y: 0 });
    b = Ember['default'].Object.create({ col: 1, row: 2, x: 40, y: 80 });
    result = subject.generateBindingPath(a, b);
    expected = "M80 20 v20 v40 v20";
    assert.equal(result, expected, "(1,0) (1,2)");

    result = subject.generateBindingPath(b, a);
    assert.equal(result, expected, "(1,2) (1,0)");

    // #_
    // __
    // _#
    a = Ember['default'].Object.create({ col: 0, row: 0, x: 0, y: 0 });
    b = Ember['default'].Object.create({ col: 1, row: 2, x: 40, y: 80 });
    result = subject.generateBindingPath(a, b);
    expected = "M40 20 v20 v40 v20";
    assert.equal(result, expected, "(0,0) (1,2)");

    result = subject.generateBindingPath(b, a);
    assert.equal(result, expected, "(1,2) (0,0)");
  });

  qunit.test("generateBindingPath MVVM - Data Binding", function (assert) {
    var PathFactoryObject = Ember['default'].Object.extend(PathFactoryMixin['default'], {
      svgenv: Ember['default'].Object.create({
        colW: 180,
        rowH: 80,
        paddingT: 2,
        paddingR: 4,
        paddingB: 8,
        paddingL: 16 })
    });
    var subject = PathFactoryObject.create();

    var a = Ember['default'].Object.create({ col: 3, row: 14, x: 540, y: 1120 });
    var b = Ember['default'].Object.create({ col: 6, row: 7, x: 1080, y: 560 });
    var result = subject.generateBindingPath(a, b);
    var expected = "M716 1160 h4 v-40 h360 v-480 v-40 h16";
    assert.equal(result, expected);
  });

});
define('mvctree/tests/unit/mixins/path-factory-test.jshint', function () {

  'use strict';

  module('JSHint - unit/mixins');
  test('unit/mixins/path-factory-test.js should pass jshint', function() { 
    ok(true, 'unit/mixins/path-factory-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/models/grid-node-test', ['ember', 'ember-qunit'], function (Ember, ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("grid-node", {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test("it exists", function (assert) {
    var model = this.subject({ svgenv: Ember['default'].Object.create() });
    //var store = this.store();
    assert.ok(!!model);
  });

  ember_qunit.test("create node 0,0 padding 15 0 0 10", function (assert) {
    var model = this.subject({
      col: 0, row: 0,
      svgenv: Ember['default'].Object.create({
        colW: 30, rowH: 60,
        paddingT: 15,
        paddingR: 0,
        paddingB: 0,
        paddingL: 10
      })
    });
    assert.equal(model.get("x"), 0, "x 0");
    assert.equal(model.get("y"), 0, "y 0");
    assert.equal(model.get("x_padded"), 10, "x 10");
    assert.equal(model.get("y_padded"), 15, "y 15");
    assert.equal(model.get("width"), 20, "width 20");
    assert.equal(model.get("height"), 45, "height 45");
    assert.equal(model.get("cx"), 15, "cx 15");
    assert.equal(model.get("cy"), 30, "cy 30");
    assert.equal(model.get("rx"), 10, "rx 10");
    assert.equal(model.get("ry"), 22.5, "ry 22.5");
  });

  ember_qunit.test("create node 1,1 padding 15 0 0 10", function (assert) {
    var model = this.subject({
      col: 1, row: 1,
      svgenv: Ember['default'].Object.create({
        colW: 30, rowH: 60,
        paddingT: 15,
        paddingR: 0,
        paddingB: 0,
        paddingL: 10
      })
    });
    assert.equal(model.get("x"), 30, "x 30");
    assert.equal(model.get("y"), 60, "y 60");
    assert.equal(model.get("x_padded"), 40, "x 40");
    assert.equal(model.get("y_padded"), 75, "y 75");
    assert.equal(model.get("cx"), 45, "cx 45"); // 30 + 30  / 2
    assert.equal(model.get("cy"), 90, "cy 90"); // 60 + 60 / 2
  });

  ember_qunit.test("create node 0,0", function (assert) {
    var model = this.subject({
      col: 0, row: 0,
      svgenv: Ember['default'].Object.create({
        colW: 130, rowH: 60,
        paddingT: 12,
        paddingR: 12,
        paddingB: 12,
        paddingL: 12
      })
    });
    assert.equal(model.get("x"), 0, "x 0");
    assert.equal(model.get("y"), 0, "y 0");
    assert.equal(model.get("x_padded"), 12, "x 12");
    assert.equal(model.get("y_padded"), 12, "y 12");
    assert.equal(model.get("width"), 106, "width 106");
    assert.equal(model.get("height"), 36, "height 36");
    assert.equal(model.get("cx"), 65, "cx 65");
    assert.equal(model.get("cy"), 30, "cy 30");
    assert.equal(model.get("rx"), 53, "rx 53");
    assert.equal(model.get("ry"), 18, "ry 18");
  });

});
define('mvctree/tests/unit/models/grid-node-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/grid-node-test.js should pass jshint', function() { 
    ok(true, 'unit/models/grid-node-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/models/node-dpattern-test', ['ember', 'ember-qunit'], function (Ember, ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("node-dpattern", {
    // Specify the other units that are required for this test.
    needs: ["model:grid-node"]
  });

  ember_qunit.test("it exists", function (assert) {
    var model = this.subject({ svgenv: Ember['default'].Object.create() });
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('mvctree/tests/unit/models/node-dpattern-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/node-dpattern-test.js should pass jshint', function() { 
    ok(true, 'unit/models/node-dpattern-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/models/node-header-test', ['ember', 'ember-qunit'], function (Ember, ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("node-header", {
    // Specify the other units that are required for this test.
    needs: []
  });

  ember_qunit.test("it exists", function (assert) {
    var model = this.subject({ svgenv: Ember['default'].Object.create() });
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('mvctree/tests/unit/models/node-header-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/node-header-test.js should pass jshint', function() { 
    ok(true, 'unit/models/node-header-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/models/node-technology-test', ['ember', 'ember-qunit'], function (Ember, ember_qunit) {

  'use strict';

  ember_qunit.moduleForModel("node-technology", {
    // Specify the other units that are required for this test.
    needs: ["model:grid-node"]
  });

  ember_qunit.test("it exists", function (assert) {
    var model = this.subject({ svgenv: Ember['default'].Object.create() });
    // var store = this.store();
    assert.ok(!!model);
  });

});
define('mvctree/tests/unit/models/node-technology-test.jshint', function () {

  'use strict';

  module('JSHint - unit/models');
  test('unit/models/node-technology-test.js should pass jshint', function() { 
    ok(true, 'unit/models/node-technology-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/routes/about-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("route:about", {});

  ember_qunit.test("it exists", function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('mvctree/tests/unit/routes/about-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/about-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/about-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/routes/index-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("route:index", {});

  ember_qunit.test("it exists", function (assert) {
    var route = this.subject();
    assert.ok(route);
  });

  // Specify the other units that are required for this test.
  // needs: ['controller:foo']

});
define('mvctree/tests/unit/routes/index-test.jshint', function () {

  'use strict';

  module('JSHint - unit/routes');
  test('unit/routes/index-test.js should pass jshint', function() { 
    ok(true, 'unit/routes/index-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/serializers/node-dpattern-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("serializer:node-dpattern", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function (assert) {
    var serializer = this.subject();
    assert.ok(serializer);
  });

  // Specify the other units that are required for this test.
  // needs: ['serializer:foo']

});
define('mvctree/tests/unit/serializers/node-dpattern-test.jshint', function () {

  'use strict';

  module('JSHint - unit/serializers');
  test('unit/serializers/node-dpattern-test.js should pass jshint', function() { 
    ok(true, 'unit/serializers/node-dpattern-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/services/svg-environment-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("service:svg-environment", {});

  // Replace this with your real tests.
  ember_qunit.test("it exists", function (assert) {
    var service = this.subject();
    assert.ok(service);
  });

  ember_qunit.test("calcViewBox", function (assert) {
    var service = this.subject({
      colW: 10,
      rowH: 5,
      maxCols: 10,
      maxRows: 10
    });

    assert.equal(service.viewBoxW, 100);
    assert.equal(service.viewBoxH, 50);
    assert.equal(service.viewBox, "0 0 100 50");
  });

  // Specify the other units that are required for this test.
  // needs: ['service:foo']

});
define('mvctree/tests/unit/services/svg-environment-test.jshint', function () {

  'use strict';

  module('JSHint - unit/services');
  test('unit/services/svg-environment-test.js should pass jshint', function() { 
    ok(true, 'unit/services/svg-environment-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/views/master-overlay-checkbox-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("view:master-overlay-checkbox");

  // Replace this with your real tests.
  ember_qunit.test("it exists", function (assert) {
    var view = this.subject();
    assert.ok(view);
  });

});
define('mvctree/tests/unit/views/master-overlay-checkbox-test.jshint', function () {

  'use strict';

  module('JSHint - unit/views');
  test('unit/views/master-overlay-checkbox-test.js should pass jshint', function() { 
    ok(true, 'unit/views/master-overlay-checkbox-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/views/overlay-checkbox-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("view:overlay-checkbox");

  // Replace this with your real tests.
  ember_qunit.test("it exists", function (assert) {
    var view = this.subject();
    assert.ok(view);
  });

});
define('mvctree/tests/unit/views/overlay-checkbox-test.jshint', function () {

  'use strict';

  module('JSHint - unit/views');
  test('unit/views/overlay-checkbox-test.js should pass jshint', function() { 
    ok(true, 'unit/views/overlay-checkbox-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/views/svg-g-click-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("view:svg-g-click");

  // Replace this with your real tests.
  ember_qunit.test("it exists", function (assert) {
    var view = this.subject();
    assert.ok(view);
  });

});
define('mvctree/tests/unit/views/svg-g-click-test.jshint', function () {

  'use strict';

  module('JSHint - unit/views');
  test('unit/views/svg-g-click-test.js should pass jshint', function() { 
    ok(true, 'unit/views/svg-g-click-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/views/svg-g-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("view:svg-g");

  // Replace this with your real tests.
  ember_qunit.test("it exists", function (assert) {
    var view = this.subject();
    assert.ok(view);
  });

});
define('mvctree/tests/unit/views/svg-g-test.jshint', function () {

  'use strict';

  module('JSHint - unit/views');
  test('unit/views/svg-g-test.js should pass jshint', function() { 
    ok(true, 'unit/views/svg-g-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/unit/views/svg-test', ['ember-qunit'], function (ember_qunit) {

  'use strict';

  ember_qunit.moduleFor("view:svg");

  ember_qunit.test("it exists", function (assert) {
    var view = this.subject();
    assert.ok(view);
  });

});
define('mvctree/tests/unit/views/svg-test.jshint', function () {

  'use strict';

  module('JSHint - unit/views');
  test('unit/views/svg-test.js should pass jshint', function() { 
    ok(true, 'unit/views/svg-test.js should pass jshint.'); 
  });

});
define('mvctree/tests/views/master-overlay-checkbox.jshint', function () {

  'use strict';

  module('JSHint - views');
  test('views/master-overlay-checkbox.js should pass jshint', function() { 
    ok(true, 'views/master-overlay-checkbox.js should pass jshint.'); 
  });

});
define('mvctree/tests/views/overlay-checkbox.jshint', function () {

  'use strict';

  module('JSHint - views');
  test('views/overlay-checkbox.js should pass jshint', function() { 
    ok(true, 'views/overlay-checkbox.js should pass jshint.'); 
  });

});
define('mvctree/tests/views/svg-g-click.jshint', function () {

  'use strict';

  module('JSHint - views');
  test('views/svg-g-click.js should pass jshint', function() { 
    ok(true, 'views/svg-g-click.js should pass jshint.'); 
  });

});
define('mvctree/tests/views/svg-g.jshint', function () {

  'use strict';

  module('JSHint - views');
  test('views/svg-g.js should pass jshint', function() { 
    ok(true, 'views/svg-g.js should pass jshint.'); 
  });

});
define('mvctree/tests/views/svg.jshint', function () {

  'use strict';

  module('JSHint - views');
  test('views/svg.js should pass jshint', function() { 
    ok(true, 'views/svg.js should pass jshint.'); 
  });

});
define('mvctree/views/master-overlay-checkbox', ['exports', 'ember', 'mvctree/views/overlay-checkbox'], function (exports, Ember, OverlayCheckbox) {

  'use strict';

  exports['default'] = Ember['default'].ContainerView.extend({

    //overlayClassNames: ['checkbox_group'],

    itemViewClass: OverlayCheckbox['default'],

    _populateChildViews: (function () {
      var masterCheckbox = OverlayCheckbox['default'].create({
        name: "All",
        checked: false,
        isMaster: true
      });
      this.pushObject(masterCheckbox);

      var chksList = this.get("checkboxes"),
          _this = this;
      chksList.forEach(function (chkHash) {
        var view = _this.createChildView(OverlayCheckbox['default'], chkHash);
        _this.pushObject(view);
      });
    }).on("init"),

    checkboxes: [{ name: "Significant",
      overlayClassName: "tech_sig",
      checked: true }, { name: "Java",
      overlayClassName: "tech_java",
      checked: false }, { name: "JavaScript",
      overlayClassName: "tech_js",
      checked: false }, { name: "Microsoft",
      overlayClassName: "tech_ms",
      checked: false }, { name: "PHP",
      overlayClassName: "tech_php",
      checked: false }, { name: "Python",
      overlayClassName: "tech_python",
      checked: false }, { name: "Ruby",
      overlayClassName: "tech_ruby",
      checked: false }, { name: "Smalltalk",
      overlayClassName: "tech_smalltalk",
      checked: false }],

    actions: {
      toggleAll: function toggleAll(isChecked) {
        var childViews = this.get("childViews");
        for (var i = 0; i < childViews.length; i++) {
          childViews[i].set("checked", isChecked);
        }
      },

      removeOvrEnabClass: function removeOvrEnabClass() {
        Ember['default'].$("#" + this.get("masterCheckbox.elementId")).removeClass("overlay_enabled");
      }
    }

  });

});
define('mvctree/views/overlay-checkbox', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].View.extend({
    name: null,
    overlayClassName: null,
    checked: false,
    isMaster: false,

    tagName: "div",
    templateName: "overlay-checkbox",
    classNames: ["overlay_checkbox"],
    classNameBindings: ["checked:overlay_enabled"],

    click: function click() {
      var checked = !this.get("checked");
      this.set("checked", checked);

      if (this.get("isMaster")) {
        this.get("parentView").send("toggleAll", checked);
      } else {
        this.get("parentView").send("removeOvrEnabClass");
      }
    },

    checkedObserver: (function () {
      var checked = this.get("checked");
      this._toggleOverlay(checked);
    }).observes("checked"),

    _toggleOverlay: function _toggleOverlay(isChecked) {
      var overlayClassName = this.get("overlayClassName"),
          svgElements = Ember['default'].$("." + overlayClassName);

      if (svgElements.length < 1) {
        return;
      }

      var elemsClassNames = svgElements.attr("class");

      elemsClassNames = isChecked ? elemsClassNames.replace(/hidden/, "") : elemsClassNames + " hidden";

      svgElements.attr("class", elemsClassNames);
    },

    didInsertElement: function didInsertElement() {
      // like listening to on('init'), but after the elements have been inserted,
      // otherwise none is found and the CSS class is not applied properly
      this.checkedObserver();
    }

  });

});
define('mvctree/views/svg-g-click', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].View.extend({

    tagName: "g",

    _classNames: (function () {
      // warning: we are overriding the classNames property
      this.set("classNames", ["ember-view", "g_" + this.get("node.id")]);
    }).on("init"),

    classNameBindings: ["classNameTech"],

    _$html_body: Ember['default'].$("html, body"),

    click: function click() {
      var nodeId = this.get("node.id");

      this._$html_body.animate({
        scrollTop: Ember['default'].$("#" + nodeId).offset().top
      }, 700);

      //TODO: revisit hashbang anchor support in Ember
      window.location.hash = nodeId;
    }
  });

});
define('mvctree/views/svg-g', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].View.extend({

    tagName: "g"

  });

});
define('mvctree/views/svg', ['exports', 'ember'], function (exports, Ember) {

  'use strict';

  exports['default'] = Ember['default'].View.extend({

    tagName: "svg",

    elementId: "mvc_tree",

    templateName: "svg",

    attributeBindings: ["xmlns", "version", "width", "height", "viewBox", "preserveAspectRatio"],
    xmlns: "http://www.w3.org/2000/svg",
    version: "1.1",
    width: "100%",
    height: "100%",
    preserveAspectRatio: "xMinYMin",
    viewBox: null,

    _setViewBox: (function () {
      this.set("viewBox", this.get("controller.svgenv.viewBox"));
    }).on("init") });

});
/* jshint ignore:start */

/* jshint ignore:end */

/* jshint ignore:start */

define('mvctree/config/environment', ['ember'], function(Ember) {
  var prefix = 'mvctree';
/* jshint ignore:start */

try {
  var metaName = prefix + '/config/environment';
  var rawConfig = Ember['default'].$('meta[name="' + metaName + '"]').attr('content');
  var config = JSON.parse(unescape(rawConfig));

  return { 'default': config };
}
catch(err) {
  throw new Error('Could not read config from meta tag with name "' + metaName + '".');
}

/* jshint ignore:end */

});

if (runningTests) {
  require("mvctree/tests/test-helper");
} else {
  require("mvctree/app")["default"].create({"showGrid":true,"name":"mvctree","version":"0.0.0.c68f17e7"});
}

/* jshint ignore:end */
//# sourceMappingURL=mvctree.map