(function () {
  'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray(arr);
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter);
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  var assert = function assert(condition, message) {
    if (!condition) {
      throw message || "Assertion failed";
    }
  }; // syntax sugar


  var getopt = function getopt(opt, field, defaultval) {
    if (opt.hasOwnProperty(field)) {
      return opt[field];
    } else {
      return defaultval;
    }
  }; // return 0 mean unit standard deviation random number


  var return_v = false;
  var v_val = 0.0;

  var gaussRandom = function gaussRandom() {
    if (return_v) {
      return_v = false;
      return v_val;
    }

    var u = 2 * Math.random() - 1;
    var v = 2 * Math.random() - 1;
    var r = u * u + v * v;
    if (r == 0 || r > 1) return gaussRandom();
    var c = Math.sqrt(-2 * Math.log(r) / r);
    v_val = v * c; // cache this for next function call for efficiency

    return_v = true;
    return u * c;
  }; // return random normal number


  var randn = function randn(mu, std) {
    return mu + gaussRandom() * std;
  }; // utilitity that creates contiguous vector of zeros of size n


  var zeros = function zeros(n) {
    if (typeof n === 'undefined' || isNaN(n)) {
      return [];
    }

    if (typeof ArrayBuffer === 'undefined') {
      // lacking browser support
      var arr = new Array(n);

      for (var i = 0; i < n; i++) {
        arr[i] = 0;
      }

      return arr;
    } else {
      return new Float64Array(n); // typed arrays are faster
    }
  }; // utility that returns 2d array filled with random numbers
  // or with value s, if provided


  var randn2d = function randn2d(n, d, s) {
    var uses = typeof s !== 'undefined';
    var x = [];

    for (var i = 0; i < n; i++) {
      var xhere = [];

      for (var j = 0; j < d; j++) {
        if (uses) {
          xhere.push(s);
        } else {
          xhere.push(randn(0.0, 1e-4));
        }
      }

      x.push(xhere);
    }

    return x;
  }; // compute L2 distance between two vectors


  var L2 = function L2(x1, x2) {
    var D = x1.length;
    var d = 0;

    for (var i = 0; i < D; i++) {
      var x1i = x1[i];
      var x2i = x2[i];
      d += (x1i - x2i) * (x1i - x2i);
    }

    return d;
  }; // compute pairwise distance in all vectors in X


  var xtod = function xtod(X) {
    var N = X.length;
    var dist = zeros(N * N); // allocate contiguous array

    for (var i = 0; i < N; i++) {
      for (var j = i + 1; j < N; j++) {
        var d = L2(X[i], X[j]);
        dist[i * N + j] = d;
        dist[j * N + i] = d;
      }
    }

    return dist;
  }; // compute (p_{i|j} + p_{j|i})/(2n)


  var d2p = function d2p(D, perplexity, tol) {
    var Nf = Math.sqrt(D.length); // this better be an integer

    var N = Math.floor(Nf);
    assert(N === Nf, "D should have square number of elements.");
    var Htarget = Math.log(perplexity); // target entropy of distribution

    var P = zeros(N * N); // temporary probability matrix

    var prow = zeros(N); // a temporary storage compartment

    for (var i = 0; i < N; i++) {
      var betamin = -Infinity;
      var betamax = Infinity;
      var beta = 1; // initial value of precision

      var done = false;
      var maxtries = 50; // perform binary search to find a suitable precision beta
      // so that the entropy of the distribution is appropriate

      var num = 0;

      while (!done) {
        //debugger;
        // compute entropy and kernel row with beta precision
        var psum = 0.0;

        for (var j = 0; j < N; j++) {
          var pj = Math.exp(-D[i * N + j] * beta);

          if (i === j) {
            pj = 0;
          } // we dont care about diagonals


          prow[j] = pj;
          psum += pj;
        } // normalize p and compute entropy


        var Hhere = 0.0;

        for (var j = 0; j < N; j++) {
          if (psum == 0) {
            var pj = 0;
          } else {
            var pj = prow[j] / psum;
          }

          prow[j] = pj;
          if (pj > 1e-7) Hhere -= pj * Math.log(pj);
        } // adjust beta based on result


        if (Hhere > Htarget) {
          // entropy was too high (distribution too diffuse)
          // so we need to increase the precision for more peaky distribution
          betamin = beta; // move up the bounds

          if (betamax === Infinity) {
            beta = beta * 2;
          } else {
            beta = (beta + betamax) / 2;
          }
        } else {
          // converse case. make distrubtion less peaky
          betamax = beta;

          if (betamin === -Infinity) {
            beta = beta / 2;
          } else {
            beta = (beta + betamin) / 2;
          }
        } // stopping conditions: too many tries or got a good precision


        num++;

        if (Math.abs(Hhere - Htarget) < tol) {
          done = true;
        }

        if (num >= maxtries) {
          done = true;
        }
      } // console.log('data point ' + i + ' gets precision ' + beta + ' after ' + num + ' binary search steps.');
      // copy over the final prow to P at row i


      for (var j = 0; j < N; j++) {
        P[i * N + j] = prow[j];
      }
    } // end loop over examples i
    // symmetrize P and normalize it to sum to 1 over all ij


    var Pout = zeros(N * N);
    var N2 = N * 2;

    for (var i = 0; i < N; i++) {
      for (var j = 0; j < N; j++) {
        Pout[i * N + j] = Math.max((P[i * N + j] + P[j * N + i]) / N2, 1e-100);
      }
    }

    return Pout;
  }; // helper function


  function sign(x) {
    return x > 0 ? 1 : x < 0 ? -1 : 0;
  } // CONVERT TO CLASS


  var tSNE = /*#__PURE__*/function () {
    function tSNE(opt) {
      _classCallCheck(this, tSNE);

      var opt = opt || {};
      this.perplexity = getopt(opt, "perplexity", 30); // effective number of nearest neighbors

      this.dim = getopt(opt, "dim", 2); // by default 2-D tSNE

      this.epsilon = getopt(opt, "epsilon", 10); // learning rate

      this.iter = 0;
    } // constructor
    // this function takes a set of high-dimensional points
    // and creates matrix P from them using gaussian kernel


    _createClass(tSNE, [{
      key: "initDataRaw",
      value: function initDataRaw(X) {
        var N = X.length;
        var D = X[0].length;
        assert(N > 0, " X is empty? You must have some data!");
        assert(D > 0, " X[0] is empty? Where is the data?");
        var dists = xtod(X); // convert X to distances using gaussian kernel

        this.P = d2p(dists, this.perplexity, 1e-4); // attach to object

        this.N = N; // back up the size of the dataset

        this.initSolution(); // refresh this
      } // initDataRaw
      // this function takes a given distance matrix and creates
      // matrix P from them.
      // D is assumed to be provided as a list of lists, and should be symmetric

    }, {
      key: "initDataDist",
      value: function initDataDist(D) {
        var N = D.length;
        assert(N > 0, " X is empty? You must have some data!"); // convert D to a (fast) typed array version

        var dists = zeros(N * N); // allocate contiguous array

        for (var i = 0; i < N; i++) {
          for (var j = i + 1; j < N; j++) {
            var d = D[i][j];
            dists[i * N + j] = d;
            dists[j * N + i] = d;
          }
        }

        this.P = d2p(dists, this.perplexity, 1e-4);
        this.N = N;
        this.initSolution(); // refresh this
      } // initDataDist
      // (re)initializes the solution to random

    }, {
      key: "initSolution",
      value: function initSolution() {
        // generate random solution to t-SNE
        this.Y = randn2d(this.N, this.dim); // the solution

        this.gains = randn2d(this.N, this.dim, 1.0); // step gains to accelerate progress in unchanging directions

        this.ystep = randn2d(this.N, this.dim, 0.0); // momentum accumulator

        this.iter = 0;
      } // initSolution
      // return pointer to current solution

    }, {
      key: "getSolution",
      value: function getSolution() {
        return this.Y;
      } // getSolution
      // perform a single step of optimization to improve the embedding

    }, {
      key: "step",
      value: function step() {
        this.iter += 1;
        var N = this.N;
        var cg = this.costGrad(this.Y); // evaluate gradient

        var cost = cg.cost;
        var grad = cg.grad; // perform gradient step

        var ymean = zeros(this.dim);

        for (var i = 0; i < N; i++) {
          for (var d = 0; d < this.dim; d++) {
            var gid = grad[i][d];
            var sid = this.ystep[i][d];
            var gainid = this.gains[i][d]; // compute gain update

            var newgain = sign(gid) === sign(sid) ? gainid * 0.8 : gainid + 0.2;
            if (newgain < 0.01) newgain = 0.01; // clamp

            this.gains[i][d] = newgain; // store for next turn
            // compute momentum step direction

            var momval = this.iter < 250 ? 0.5 : 0.8;
            var newsid = momval * sid - this.epsilon * newgain * grad[i][d];
            this.ystep[i][d] = newsid; // remember the step we took
            // step!

            this.Y[i][d] += newsid;
            ymean[d] += this.Y[i][d]; // accumulate mean so that we can center later
          } // for

        } // for
        // reproject Y to be zero mean


        for (var i = 0; i < N; i++) {
          for (var d = 0; d < this.dim; d++) {
            this.Y[i][d] -= ymean[d] / N;
          }
        } //if(this.iter%100===0) console.log('iter ' + this.iter + ', cost: ' + cost);


        return cost; // return current cost
      } // step
      // for debugging: gradient check

    }, {
      key: "debugGrad",
      value: function debugGrad() {
        var N = this.N;
        var cg = this.costGrad(this.Y); // evaluate gradient

        var cost = cg.cost;
        var grad = cg.grad;
        var e = 1e-5;

        for (var i = 0; i < N; i++) {
          for (var d = 0; d < this.dim; d++) {
            var yold = this.Y[i][d];
            this.Y[i][d] = yold + e;
            var cg0 = this.costGrad(this.Y);
            this.Y[i][d] = yold - e;
            var cg1 = this.costGrad(this.Y);
            var analytic = grad[i][d];
            var numerical = (cg0.cost - cg1.cost) / (2 * e);
            console.log(i + ',' + d + ': gradcheck analytic: ' + analytic + ' vs. numerical: ' + numerical);
            this.Y[i][d] = yold;
          }
        }
      } // debugGrad
      // return cost and gradient, given an arrangement

    }, {
      key: "costGrad",
      value: function costGrad(Y) {
        var N = this.N;
        var dim = this.dim; // dim of output space

        var P = this.P;
        var pmul = this.iter < 100 ? 4 : 1; // trick that helps with local optima
        // compute current Q distribution, unnormalized first

        var Qu = zeros(N * N);
        var qsum = 0.0;

        for (var i = 0; i < N; i++) {
          for (var j = i + 1; j < N; j++) {
            var dsum = 0.0;

            for (var d = 0; d < dim; d++) {
              var dhere = Y[i][d] - Y[j][d];
              dsum += dhere * dhere;
            }

            var qu = 1.0 / (1.0 + dsum); // Student t-distribution

            Qu[i * N + j] = qu;
            Qu[j * N + i] = qu;
            qsum += 2 * qu;
          }
        } // normalize Q distribution to sum to 1


        var NN = N * N;
        var Q = zeros(NN);

        for (var q = 0; q < NN; q++) {
          Q[q] = Math.max(Qu[q] / qsum, 1e-100);
        }

        var cost = 0.0;
        var grad = [];

        for (var i = 0; i < N; i++) {
          var gsum = new Array(dim); // init grad for point i

          for (var d = 0; d < dim; d++) {
            gsum[d] = 0.0;
          }

          for (var j = 0; j < N; j++) {
            cost += -P[i * N + j] * Math.log(Q[i * N + j]); // accumulate cost (the non-constant portion at least...)

            var premult = 4 * (pmul * P[i * N + j] - Q[i * N + j]) * Qu[i * N + j];

            for (var d = 0; d < dim; d++) {
              gsum[d] += premult * (Y[i][d] - Y[j][d]);
            }
          }

          grad.push(gsum);
        }

        return {
          cost: cost,
          grad: grad
        };
      } // costGrad

    }]);

    return tSNE;
  }(); // tSNE

  var viewobj = /*#__PURE__*/function () {
    function viewobj(div, v2p) {
      _classCallCheck(this, viewobj);

      this.div = div;
      this.spritewidth = viewobj.spritewidth;
      this.scales = {
        x: d3.scaleLinear().domain([0, div.offsetWidth * v2p]).range([0, div.offsetWidth]),
        y: d3.scaleLinear().domain([0, div.offsetHeight * v2p]).range([0, div.offsetHeight])
      }; // scales

      this.current = {
        x: [0, div.offsetWidth * v2p],
        y: [0, div.offsetHeight * v2p],
        v2p: v2p
      }; // current
    } // constructor


    _createClass(viewobj, [{
      key: "transform",
      value: function transform() {
        // d3/event.transform keeps track of the zoom based on the initial state. Therefore if the scale domain is actually changed, the changes compound later on!! Either reset the event tracker, or keep the domain unchanged, and just update separate view coordinates.
        var view = this.current;
        view.x = d3.event.transform.rescaleX(this.scales.x).domain();
        view.y = d3.event.transform.rescaleY(this.scales.y).domain();
        var v2p_new = (view.x[1] - view.x[0]) / this.div.offsetWidth;
        var k = v2p_new / view.v2p;
        view.v2p = v2p_new;
        this.spritewidth = this.spritewidth / k;
      } // transform

    }, {
      key: "pixel2data",
      value: function pixel2data(pixelpoint) {
        // Transform into the data values. B
        var view = this.current;
        var dom = {
          x: [0, this.div.offsetWidth],
          y: [0, this.div.offsetHeight]
        };
        return canvasobj.domA2domB(pixelpoint, dom, view);
      } // pixel2data

    }, {
      key: "data2pixel",
      value: function data2pixel(datapoint) {
        // Transform into the data values. B
        var view = this.current;
        var dom = {
          x: [0, this.div.offsetWidth],
          y: [0, this.div.offsetHeight]
        };
        return canvasobj.domA2domB(datapoint, view, dom);
      } // pixel2data

    }], [{
      key: "domA2domB",
      value: function domA2domB(point, A, B) {
        // Convert a single point `point' from a domain defined by `A' to a domain defined by `B'. `A' and `B' both require to have `x' and `y' attributes, which are arrays of length 2.
        var x = d3.scaleLinear().domain(A.x).range(B.x);
        var y = d3.scaleLinear().domain(A.y).range(B.y);
        return [x(point[0]), y(point[1])];
      } // dom2view

    }]);

    return viewobj;
  }(); // canvasobj


  viewobj.spritewidth = 64;

  // General helpers

  var helpers = {
    isIterable: function isIterable(object) {
      // https://stackoverflow.com/questions/18884249/checking-whether-something-is-iterable
      return object != null && typeof object[Symbol.iterator] === 'function';
    },
    // isIterable
    makeTranslate: function makeTranslate(x, y) {
      return "translate(" + x + "," + y + ")";
    },
    // makeTranslate
    // Arrays
    unique: function unique(d) {
      // https://stackoverflow.com/questions/1960473/get-all-unique-values-in-a-javascript-array-remove-duplicates
      function onlyUnique(value, index, self) {
        return self.indexOf(value) === index;
      } // unique


      return d.filter(onlyUnique);
    },
    // unique
    arrayEqual: function arrayEqual(A, B) {
      return helpers.arrayIncludesAll(A, B) && helpers.arrayIncludesAll(B, A);
    },
    // arrayEqual
    arrayIncludesAll: function arrayIncludesAll(A, B) {
      // 'arrayIncludesAll' checks if array A includes all elements of array B. The elements of the arrays are expected to be strings.
      // Return element of B if it is not contained in A. If the response array has length 0 then A includes all elements of B, and 'true' is returned.
      var f = B.filter(function (b) {
        return !A.includes(b);
      });
      return f.length == 0 ? true : false;
    },
    // arrayIncludesAll
    indexOfObjectByAttr: function indexOfObjectByAttr(array, attr, value) {
      // Return hte index of the first object with the attribute 'attr' of value 'value'. 
      for (var i = 0; i < array.length; i += 1) {
        if (array[i][attr] === value) {
          return i;
        }
      }

      return -1;
    },
    // indexOfObjectByAttr
    findObjectByAttribute: function findObjectByAttribute(A, attribute, values, flag) {
      // Return the objects in an object array 'A', which have an attribute 'attribute', with the value 'value'. If they do not an empty set is returned. In cases when a single item is selected the item is returned as the object, without the wrapping array.
      var subset = A.filter(function (a) {
        return values.includes(a[attribute]);
      }); // If only one output is expected, return a single output.

      if (subset.length > 0 && flag == 1) {
        subset = subset[0];
      } // if


      return subset;
    },
    // findObjectByAttribute
    collectObjectArrayProperty: function collectObjectArrayProperty(A, attribute) {
      // Take input object array 'A', collect all of the object members attribute 'attribute', and flattens the array of arrays into a single array of values once.
      var C = A.map(function (a) {
        return a[attribute];
      });
      return [].concat.apply([], C);
    },
    // collectObjectArrayProperty
    setDifference: function setDifference(A, B) {
      var a = new Set(A);
      var b = new Set(B);
      return {
        aMinusB: new Set(_toConsumableArray(a).filter(function (x) {
          return !b.has(x);
        })),
        bMinusA: new Set(_toConsumableArray(b).filter(function (x) {
          return !a.has(x);
        }))
      };
    },
    // setDifference
    // Comparing file contents
    // Text sizing
    fitTextToBox: function fitTextToBox(text, box, dim, val) {
      // `text' and `box' are d3 selections. `dim' must be either `width' or `height', and `val' must be a number.
      if (["width", "height"].includes(dim) && !isNaN(val)) {
        var fontSize = 16;
        text.style("font-size", fontSize + "px");

        while (box.node().getBoundingClientRect()[dim] > val && fontSize > 0) {
          // Reduce the font size
          fontSize -= 1;
          text.style("font-size", fontSize + "px");
        } // while

      } // if

    },
    // fitTextToBox
    calculateExponent: function calculateExponent(val) {
      // calculate the exponent for the scientific notation.
      var exp = 0;

      while (Math.floor(val / Math.pow(10, exp + 1)) > 0) {
        exp += 1;
      } // Convert the exponent to multiple of three


      return Math.floor(exp / 3) * 3;
    },
    // calculateExponent
    // FILES
    createFileInputElement: function createFileInputElement(loadFunction) {
      // This button is already created. Just add the functionaity.
      var dataInput = document.createElement('input');
      dataInput.type = 'file';

      dataInput.onchange = function (e) {
        loadFunction(e.target.files);
      }; // onchange


      return dataInput;
    } // createFileInputElement

  }; // helpers

  // Load in the metadata.
  // "c:\Users\ak2164\Documents\CAMBRIDGE\PhD\demo\data\merged_micrograph_sample.csv"

  var dbsliceData = {
    sprites: [],
    selected: [],
    hiding: [],
    tsnesettings: undefined,
    view: undefined
  };
  d3.csv("./data/animal_metadata.csv").then(function (metadata) {
    // Convert the values to numbers.
    metadata.forEach(function (row) {
      ordinals.forEach(function (varname) {
        row[varname] = Number(row[varname]);
      }); // forEach
    }); // forEach
    // Actual sprites

    dbsliceData.sprites = metadata.map(function (task) {
      return {
        task: task,
        mouse: undefined,
        position: undefined
      };
    }); // map

    dbsliceData.tsnesettings = new tsnesettings(); // The t-SNE scores are z-scored in hte end, so hte val2px is controlled here. So let's leave 100px on either side empty, and the area in between should span 1

    var div = d3.select("#root");
    var v2p = 1 / (div.node().offsetWidth - 400);
    var view = new viewobj(div.node(), v2p);
    dbsliceData.view = view; // Add an image for every path in the metadata? Start with first 10.
    // get the t-sne scores

    gettsnescores(dbsliceData.sprites); // Add the zooming

    div.call(d3.zoom().scaleExtent([0.01, Infinity]).on("zoom", function (obj) {
      view.transform();
      zooming(view);
    }));
    var dragobj = d3.drag().on("start", function (d) {
      d.mouse = getMousePosition();
    }).on("drag", function (d) {
      var position = calculateNewPosition(d, this); // Move the wrapper.

      d3.select(this).style("left", position.x + "px").style("top", position.y + "px");
    }).on("end", function (d) {
      var xscale = d3.scaleLinear().domain(view.current.x).range([0, view.div.offsetWidth]);
      var yscale = d3.scaleLinear().domain(view.current.y).range([0, view.div.offsetHeight]);
      d.position = [xscale.invert(parseFloat(this.style.left)), yscale.invert(parseFloat(this.style.top))];
    }); // ./data/uhcsdata/micrographs/

    d3.select("div.content").selectAll("img").data(dbsliceData.sprites).enter().append("img").attr("src", function (d) {
      return "./data/jpgs_for_AK/" + d.task.path + ".jpeg";
    }).attr("width", 64).attr("height", 52).style("position", "absolute").style("left", function (d) {
      return view.scales.x(d.position[0]) + "px";
    }).style("top", function (d) {
      return view.scales.y(d.position[1]) + "px";
    }).call(dragobj); // Add the reference to the DOM to the sprites.

    d3.select("div.content").selectAll("img").each(function (sprite) {
      sprite.graphic = this;
    }); // Create a lasso.

    var parentobj = {
      onlassostart: function onlassostart() {
        dbsliceData.selected = [];
        d3.select("div.content").selectAll("img").style("border", "");
      },
      onlassoend: function onlassoend() {
        // Find all hte circled images.
        var obj = this;
        var selected = dbsliceData.sprites.filter(function (sprite) {
          var point = [parseFloat(sprite.graphic.style.left), parseFloat(sprite.graphic.style.top)];
          return obj.lassoobj.iswithin(point);
        });
        selected.forEach(function (sprite) {
          sprite.graphic.style.border = "4px solid purple";
        });
        dbsliceData.selected = selected; // Bring up the toolbar.

        tb.show();
      }
    };
    var overlay = d3.select("#overlay").node();
    parentobj.lassoobj = new lasso(overlay, parentobj);
  }); // zooming

  function zooming(view) {
    var xscale = d3.scaleLinear().domain(view.current.x).range([0, view.div.offsetWidth]);
    var yscale = d3.scaleLinear().domain(view.current.y).range([0, view.div.offsetHeight]);
    d3.select("div.content").selectAll("img").attr("width", view.spritewidth).attr("height", view.spritewidth / 64 * 52).style("left", function (d) {
      return xscale(d.position[0]) + "px";
    }).style("top", function (d) {
      return yscale(d.position[1]) + "px";
    });
  } // zooming
  // repositioning via t-sne


  function reposition() {
    // Update the positions in the storage.
    gettsnescores(dbsliceData.sprites); // Update on-screen positions.

    d3.select("div.content").selectAll("img").style("left", function (d) {
      return dbsliceData.view.scales.x(d.position[0]) + "px";
    }).style("top", function (d) {
      return dbsliceData.view.scales.y(d.position[1]) + "px";
    });
  } // reposition
  // t-SNE


  function gettsnescores(sprites) {
    // Which metadtata to use
    var animalsinfo = sprites.map(function (sprite) {
      var feature = [];
      ordinals.forEach(function (varname) {
        feature.push(sprite.task[varname]);
      }); // forEach

      return feature;
    }); // map
    // The options MUST be configured correctly for t-sne to produce meaningful results!!
    // perplexity must be smaller than the number of actual cases, maybe a third or so?
    // var opt = {}
    // opt.epsilon = 10; // epsilon is learning rate (10 = default)
    // opt.perplexity = Math.round( animalsinfo.length / 5 ); // roughly how many neighbors each point influences (30 = default)
    // opt.dim = 2; // dimensionality of the embedding (2 = default)

    var opt = dbsliceData.tsnesettings.data;
    var tsne = new tSNE(opt); // create a tSNE instance
    // initialize the raw data.

    tsne.initDataRaw(animalsinfo);

    for (var k = 0; k < 5000; k++) {
      tsne.step(); // every time you call this, solution gets better
    } // for


    var Y = tsne.getSolution(); // Y is an array of 2-D points that you can plot
    // This z-score should erally be axis sensitive.

    var xdom = d3.extent(Y, function (d) {
      return d[0];
    });
    var ydom = d3.extent(Y, function (d) {
      return d[1];
    });
    sprites.forEach(function (sprite, i) {
      // Give the position in [0, 1]
      sprite.position = [(Y[i][0] - xdom[0]) / (xdom[1] - xdom[0]), (Y[i][1] - ydom[0]) / (ydom[1] - ydom[0])];
    }); // forEach
  } // gettsnescores
  // tsnesettings


  var tsnesettings = /*#__PURE__*/function () {
    function tsnesettings() {
      _classCallCheck(this, tsnesettings); // Has to have the graphic,


      this.graphic = {
        wrapper: undefined,
        position: {}
      }; // graphic

      var p = Math.round(dbsliceData.sprites.length / 5);
      this.data = {
        epsilon: 10,
        perplexity: p < 2 ? 2 : p,
        dim: 2
      }; // Make the toolbar.

      var d3toolbar = d3.select("#animals").append("div").attr("class", "tagging").style("display", "none").style("cursor", "pointer");
      this.graphic.wrapper = d3toolbar.node(); // Add the dragging.

      var dragobj = d3.drag().on("start", function (d) {
        d.mouse = getMousePosition();
      }).on("drag", function (d) {
        var position = calculateNewPosition(d, this); // Move the wrapper.

        d3.select(this).style("left", position.x + "px").style("top", position.y + "px");
      }).on("end", function (d) {
        var xscale = d3.scaleLinear().domain(dbsliceData.view.current.x).range([0, dbsliceData.view.div.offsetWidth]);
        var yscale = d3.scaleLinear().domain(dbsliceData.view.current.y).range([0, dbsliceData.view.div.offsetHeight]);
        d.position = [xscale.invert(parseFloat(this.style.left)), yscale.invert(parseFloat(this.style.top))];
      });
      d3toolbar.datum(this);
      d3toolbar.call(dragobj); // MOVE? : Should the assemply of options be moved outside for greater flexibility? Also, how would I otherwise access the functionality required?? 

      var obj = this; // Sliders

      addRange("perplexity", "perplexity", 1, 100, 10);
      addRange("learn. rate", "epsilon", 1, 100, 10);
      addButton("close", function (d) {
        obj.hide();
      });
      addButton("check", function (d) {
        obj.submit();
      });

      function addButton(icon, event) {
        d3toolbar.append("button").attr("class", "btn-circle").on("click", event).append("i").attr("class", "fa fa-" + icon).style("cursor", "pointer");
      } // addButton


      function addRange(text, classname, min, max, init) {
        var div = d3toolbar.append("div").style("display", "block").style("font-family", "helvetica").style("color", "black").html(text);
        div.append("input").attr("class", classname).attr("type", "range").attr("min", min).attr("max", max).attr("value", init).on("mousedown", function () {
          // Propagation must be stopped so that the movement is logged as input change, and not drag.
          d3.event.stopPropagation();
        });
      } // addRange

    } // constructor


    _createClass(tsnesettings, [{
      key: "submit",
      value: function submit() {
        var obj = this;
        obj.hide(); // Set the selected values to obj.data

        var perplexitynode = d3.select(obj.graphic.wrapper).select("input.perplexity").node();
        var epsilonnode = d3.select(obj.graphic.wrapper).select("input.epsilon").node();
        obj.data.epsilon = epsilonnode.value;
        obj.data.perplexity = perplexitynode.value;
        reposition();
      } // submit

    }, {
      key: "show",
      value: function show() {
        // Position hte tooltip By finding the mean of all hte selected sprites.
        var obj = this; // Set the current settings to the ranges.
        // Offset by the expected tooltip size. How to calculate that when display:none?

        var style = obj.graphic.wrapper.style;
        style.display = "block";
        style.left = 20 + "px";
        style.top = 150 + "px";
      } // show

    }, {
      key: "hide",
      value: function hide() {
        var obj = this;
        obj.graphic.wrapper.style.display = "none";
      } // hide

    }]);

    return tsnesettings;
  }(); // tsnesettings
  // dragging helpers


  function getMousePosition() {
    var mousePosition = d3.mouse(d3.select("div.content").node());
    return {
      x: mousePosition[0],
      y: mousePosition[1]
    };
  } // getMousePosition


  function calculateNewPosition(d, wrapperdom) {
    // Get the current wrapper position and the mouse movement on increment.
    var wrapper = getWrapperPosition(wrapperdom);
    var movement = calculateMouseMovement(d);
    return {
      x: wrapper.x + movement.x,
      y: wrapper.y + movement.y
    };
  } // calculateNewPosition


  function getWrapperPosition(wrapperdom) {
    // Calculate the position of the wrapper relative to it's parent
    return {
      x: parseInt(wrapperdom.style.left),
      y: parseInt(wrapperdom.style.top),
      w: wrapperdom.offsetWidth,
      h: wrapperdom.offsetHeight
    };
  } // getWrapperPosition


  function calculateMouseMovement(d) {
    var mp0 = d.mouse;
    var mp1 = getMousePosition();
    var movement = {
      x: mp1.x - mp0.x,
      y: mp1.y - mp0.y
    };
    d.mouse = mp1;
    return movement;
  } // calculateMouseMovement
  // Lasso


  var lasso = /*#__PURE__*/function () {
    /*
    `lasso' creates a new lasso instance, based on the `overlay' svg dom element. In addition to collecting the points selected by the user it also performs a user specified action on the start and end of lassoing.
    
    The lasso only collects the selected region, and passes it to the user. The search for any data in the graphic must be done by the plot. Lasso does provide functionality (lasso.iswithin) to check whether a particular pixel on the svg is within it.
    */
    function lasso(overlay, parentobj) {
      _classCallCheck(this, lasso); // Declare the most important attributes. Note that the lasso does NOT find it's own selected data! The `selected' attribute is only a placeholder here to allow the user to store the results in it. This is to simplify the lasso code by moving the data identification out.


      this.svg = overlay;
      this.boundary = []; // Add behavior to the overlay.

      d3.select(overlay.parentElement).on("mousemove", function () {
        if (event.shiftKey) {
          overlay.style.display = "block";
        } else {
          overlay.style.display = "none";
        } // if

      }); // on

      var obj = this;
      d3.select(overlay).call(d3.drag().on("start", function () {
        // Clear previous lasso, remove graphic, remove toolbar.
        obj.boundary = [];
        obj.draw();
        parentobj.onlassostart(obj);
      }) // on
      .on("drag", function () {
        obj.addpoint();
        obj.draw();
      }) // on
      .on("end", function () {
        if (obj.boundary.length > 3) {
          parentobj.onlassoend(obj);
        } // if


        obj.remove();
      }) // on
      ); // call
    } // constructor


    _createClass(lasso, [{
      key: "addpoint",
      value: function addpoint() {
        var obj = this;
        obj.boundary.push(d3.mouse(obj.svg));
      } // addpoint

    }, {
      key: "iswithin",
      value: function iswithin(point) {
        // Check wheteher the `point' is within the polygon defined by the boundary of the lasso in `this.boundary'. The check is based on the idea that any ray starting from `point' must pass the boundary an odd number of times if it is within it, and an even number of times otherwise. For simplicity a horizontal ray was selected. The boundary is imagined as straight segments between neighbouring points of `this.boundary'. Every segment is checked to see whether the ray crosses it. As the ray is expected to run in one dimension only, the `isInside' flag is only changed if the segment is a boundary segment, AND if the crossing point is to the right of the initial point. The check could be optimised further by only considering the part of the lasso that is to the right of the selected point. A separate improvement could allow the user to input an array of points to be checked.
        var boundary = this.boundary;
        var isInside = false;

        for (var i = 1; i < boundary.length; i++) {
          checkIntersect(boundary[i - 1], boundary[i], point);
        } // for


        checkIntersect(boundary[boundary.length - 1], boundary[0], point);
        return isInside; // Need to check the same number of edge segments as vertex points. The last edge should be the last and the first point.

        function checkIntersect(p0, p1, point) {
          // One point needs to be above, while the other needs to be below -> the above conditions must be different.
          if (p0[1] > point[1] !== p1[1] > point[1]) {
            // One is above, and the other below. Now find if the x are positioned so that the ray passes through. Essentially interpolate the x at the y of the point, and see if it is larger.
            var x = (p1[0] - p0[0]) / (p1[1] - p0[1]) * (point[1] - p0[1]) + p0[0];
            isInside = x > point[0] ? !isInside : isInside;
          } // if

        } // checkIntersect

      } // iswithin

    }, {
      key: "draw",
      value: function draw() {
        var obj = this; // Create the data for a single polygon

        var d = [obj.boundary.map(function (d) {
          return d.join();
        }).join(" ")];
        d3.select(obj.svg).selectAll("polygon").data(d).join(function (enter) {
          return enter.append("polygon").attr("points", function (d) {
            return d;
          }).style("fill", "cornflowerblue").style("stroke", "dodgerblue").style("stroke-width", 2).attr("opacity", 0.4);
        }, function (update) {
          return update.attr("points", function (d) {
            return d;
          });
        }, function (exit) {
          return exit.remove();
        }); // join
      } // draw

    }, {
      key: "remove",
      value: function remove() {
        var obj = this;
        d3.select(obj.svg).selectAll("polygon").remove();
      } // remove

    }]);

    return lasso;
  }(); // lasso
  // Tagging


  var tagging = /*#__PURE__*/function () {
    function tagging(parentobj) {
      _classCallCheck(this, tagging); // Has to have the graphic,


      this.graphic = {
        wrapper: undefined,
        position: {}
      }; // graphic

      this.parentobj = parentobj; // Make the toolbar.

      var d3toolbar = d3.select("#root").append("div").attr("class", "tagging").style("cursor", "pointer").style("display", "none");
      this.graphic.wrapper = d3toolbar.node();
      d3toolbar.datum(this); // Add the dragging.

      var dragobj = d3.drag().on("start", function (d) {
        d.mouse = getMousePosition();
      }).on("drag", function (d) {
        var position = calculateNewPosition(d, this); // Move the wrapper.

        d3.select(this).style("left", position.x + "px").style("top", position.y + "px");
      }).on("end", function (d) {
        var xscale = d3.scaleLinear().domain(dbsliceData.view.current.x).range([0, dbsliceData.view.div.offsetWidth]);
        var yscale = d3.scaleLinear().domain(dbsliceData.view.current.y).range([0, dbsliceData.view.div.offsetHeight]);
        d.position = [xscale.invert(parseFloat(this.style.left)), yscale.invert(parseFloat(this.style.top))];
      });
      d3toolbar.call(dragobj); // Make all the functionality here.

      var obj = this; // The input groups. Loose tags, name-value categorical, name-value ordinal.

      var form = d3toolbar.append("div").style("display", "inline-block").append("form");
      var loosetags = addFormOptionDiv(form, "tag");
      addTagButton(loosetags, "tag", function () {
        obj.addtag();
      });
      loosetags.append("input").attr("value", "keyword");
      var categorical = addFormOptionDiv(form, "categorical");
      addTagButton(categorical, "categorical", function () {
        obj.addcategorical();
      });
      categorical.append("input").attr("value", "name");
      categorical.append("input").attr("value", "value");
      var ordinal = addFormOptionDiv(form, "ordinal");
      addTagButton(ordinal, "ordinal", function () {
        obj.addordinal();
      });
      ordinal.append("input").attr("value", "name");
      var axisoption = ordinal.append("select");
      axisoption.append("option").html("x");
      axisoption.append("option").html("y");
      var buttongroup = d3toolbar.append("div").style("display", "inline-block").append("div"); // Submit and close buttons.

      buttongroup.append("button").attr("class", "btn-circle").on("click", function (d) {
        obj.hide();
        obj.parentobj.ontagoff();
      }).append("i").attr("class", "fa fa-" + "close").style("cursor", "pointer");

      function addTagButton(owner, text, event) {
        owner.append("label").attr("class", "label").append("button").attr("class", "label-button").html(text).on("click", event);
      } // addtagbutton


      function addFormOptionDiv(owner, classname) {
        var option = owner.append("div").append("div").attr("class", classname).style("float", "left").style("text-align", "left");
        return option;
      } // addformoptiondiv

    } // constructor


    _createClass(tagging, [{
      key: "show",
      value: function show() {
        // Position hte tooltip By finding the mean of all hte selected sprites.
        var obj = this;
        var selected = dbsliceData.selected;
        var position = selected.reduce(function (total, spriteobj) {
          var midpoint = [parseInt(spriteobj.graphic.style.left), parseInt(spriteobj.graphic.style.top)];
          total.x += midpoint[0] / selected.length;
          total.y += midpoint[1] / selected.length;
          return total;
        }, {
          x: 0,
          y: 0
        }); // Offset by the expected tooltip size. How to calculate that when display:none?

        var style = obj.graphic.wrapper.style;
        style.display = "block";
        style.left = position.x - 100 + "px";
        style.top = position.y - 30 + "px";
      } // show

    }, {
      key: "hide",
      value: function hide() {
        var obj = this;
        obj.graphic.wrapper.style.display = "none";
      } // hide
      // Specific tagging.

    }, {
      key: "getinputvalues",
      value: function getinputvalues(divspec) {
        var obj = this;
        var inputs = [];
        d3.select(obj.graphic.wrapper).select(divspec).selectAll("input").each(function (input) {
          inputs = inputs.concat(this.value);
        });
        return inputs;
      } // getinputvalues

    }, {
      key: "addtag",
      value: function addtag() {
        var obj = this; // Get the appropriate values.

        var inputs = obj.getinputvalues("div.tag");
        var tag = inputs[0]; // Add them to the tasks.

        dbsliceData.selected.forEach(function (spriteobj) {
          var tags = spriteobj.task.usertags;

          if (tags) {
            // Check if the tag is already included.
            if (!tags.includes(tag)) {
              tags.push(tag);
            }
          } else {
            spriteobj.task.usertags = [tag];
          } // if

        }); // forEach
      } // addtag

    }, {
      key: "addcategorical",
      value: function addcategorical() {
        var obj = this; // Get the appropriate values.

        var inputs = obj.getinputvalues("div.categorical");
        var name = "classified_" + inputs[0];
        var value = inputs[1]; // Add them to the tasks.

        dbsliceData.selected.forEach(function (spriteobj) {
          spriteobj.task[name] = value;
        }); // forEach
      } // addcategorical

    }, {
      key: "addordinal",
      value: function addordinal() {
        var obj = this; // Get the appropriate values.

        var inputs = obj.getinputvalues("div.ordinal");
        var name = "estimated_" + inputs[0];
        var axisind = inputs[1] == "x" ? 0 : 1; // Add them to the tasks.

        dbsliceData.selected.forEach(function (spriteobj) {
          spriteobj.task[name] = spriteobj.position[axisind];
        }); // forEach
      } // addordinal

    }], [{
      key: "gettagnames",
      value: function gettagnames(sprites) {
        var tagnames = sprites.reduce(function (acc, sprite) {
          // Find all task variables
          var names = Object.getOwnPropertyNames(sprite.task);
          var cls = names.filter(function (name) {
            return name.startsWith("classified_");
          });
          var est = names.filter(function (name) {
            return name.startsWith("estimated_");
          });
          acc.classifications = acc.classifications.concat(cls);
          acc.estimations = acc.estimations.concat(est);
          return acc;
        }, {
          classifications: [],
          estimations: []
        });
        tagnames.classifications = helpers.unique(tagnames.classifications);
        tagnames.estimations = helpers.unique(tagnames.estimations);
        return tagnames;
      } // gettagnames

    }, {
      key: "gettaggedsprites",
      value: function gettaggedsprites(sprites, tagname) {
        return sprites.filter(function (sprite) {
          return Object.getOwnPropertyNames(sprite.task).includes(tagname);
        }); // filter
      } // gettaggedsprites

    }]);

    return tagging;
  }(); // tagging


  var tgparentobj = {
    ontagoff: function ontagoff() {}
  };
  var tg = new tagging(tgparentobj); // Grouping toolbar

  var toolbar = /*#__PURE__*/function () {
    function toolbar(parentobj) {
      _classCallCheck(this, toolbar); // Has to have the graphic,


      this.graphic = {
        wrapper: undefined,
        position: {}
      }; // graphic
      // Make the toolbar.

      var d3toolbar = d3.select("#root").append("div").attr("class", "contourTooltip").style("display", "none").style("cursor", "pointer");
      this.graphic.wrapper = d3toolbar.node(); // Add the dragging.

      d3toolbar.datum(this);
      var dragobj = d3.drag().on("start", function (d) {
        d.mouse = getMousePosition();
      }).on("drag", function (d) {
        var position = calculateNewPosition(d, this); // Move the wrapper.

        d3.select(this).style("left", position.x + "px").style("top", position.y + "px");
      }).on("end", function (d) {
        var xscale = d3.scaleLinear().domain(dbsliceData.view.current.x).range([0, dbsliceData.view.div.offsetWidth]);
        var yscale = d3.scaleLinear().domain(dbsliceData.view.current.y).range([0, dbsliceData.view.div.offsetHeight]);
        d.position = [xscale.invert(parseFloat(this.style.left)), yscale.invert(parseFloat(this.style.top))];
      });
      d3toolbar.call(dragobj); // MOVE? : Should the assemply of options be moved outside for greater flexibility? Also, how would I otherwise access the functionality required?? 

      var obj = this;
      addButton("close", function (d) {
        obj.hide();
        parentobj.unhighlight();
      });
      addButton("tags", function (d) {
        obj.hide();
        parentobj.ontag();
      });
      addButton("stack-overflow", function (d) {
        return parentobj.ongroup();
      });

      function addButton(icon, event) {
        d3toolbar.append("button").attr("class", "btn-circle").on("click", event).append("i").attr("class", "fa fa-" + icon).style("cursor", "pointer");
      } // addButton

    } // constructor


    _createClass(toolbar, [{
      key: "show",
      value: function show() {
        // Position hte tooltip By finding the mean of all hte selected sprites.
        var obj = this;
        var selected = dbsliceData.selected;
        var position = selected.reduce(function (total, spriteobj) {
          var midpoint = [parseInt(spriteobj.graphic.style.left), parseInt(spriteobj.graphic.style.top)];
          total.x += midpoint[0] / selected.length;
          total.y += midpoint[1] / selected.length;
          return total;
        }, {
          x: 0,
          y: 0
        }); // Offset by the expected tooltip size. How to calculate that when display:none?

        var style = obj.graphic.wrapper.style;
        style.display = "block";
        style.left = position.x - 100 + "px";
        style.top = position.y - 30 + "px";
      } // show

    }, {
      key: "hide",
      value: function hide() {
        var obj = this;
        obj.graphic.wrapper.style.display = "none";
      } // hide

    }]);

    return toolbar;
  }(); // toolbar


  var tbparentobj = {
    ongroup: ongroup,
    ontag: function ontag() {
      tg.show();
    },
    unhighlight: function unhighlight() {}
  };
  var tb = new toolbar(tbparentobj); // Correlations and we're done here
  // FOR THIS SOME ADDITIONAL METADATA WILL BE REQUIRED!!
  // These are the default ones. Now also check for any user defined ones. For user defined one

  var categoricals = ["animal"];
  var ordinals = [];

  for (var i = 0; i < 2048; i++) {
    ordinals.push("ftr_" + i);
  } // for
  // The trending and statistics object.


  var statistics = {
    correlation: function correlation(sprites) {
      // Need to get all tagged metadata variables here. "Classified" is categorical, "Estimated is ordinal".
      var tags = sprites.reduce(function (acc, sprite) {
        Object.getOwnPropertyNames(sprite.task).forEach(function (varname) {
          if (varname.startsWith("classified")) {
            acc.taggedcat.push(varname);
          } // if


          if (varname.startsWith("estimated")) {
            acc.taggedord.push(varname);
          } // if

        });
        return acc;
      }, {
        taggedcat: [],
        taggedord: []
      });
      var categoricals_ = helpers.unique(tags.taggedcat).concat(categoricals);
      var ordinals_ = helpers.unique(tags.taggedord).concat(ordinals);
      console.log(categoricals_);
      console.log(ordinals_); // Categorical variables

      var categoricalscores = categoricals_.map(function (cat) {
        return statistics.categoricalcorrelation(sprites, cat);
      }); // map
      // Ordinal variables.

      var ordinalscores = ordinals_.map(function (ord) {
        return statistics.ordinalcorrelation(sprites, ord);
      }); // map
      // Before returning the scores, order them.

      var scores = categoricalscores.concat(ordinalscores);
      scores.sort(function (a, b) {
        return Math.max(a.score.x, a.score.y) - Math.max(b.score.x, b.score.y);
      });
      return scores;
    },
    // correlation
    covariance: function covariance(d) {
      // 'd' is an array of observations. Calculate the covariance between x and the metadata variable.
      var N = d.length;
      var mu_var0 = d3.sum(d, function (d) {
        return d.var0;
      }) / N;
      var mu_var1 = d3.sum(d, function (d) {
        return d.var1;
      }) / N;
      var sum = 0;

      for (var i = 0; i < N; i++) {
        sum += (d[i].var0 - mu_var0) * (d[i].var1 - mu_var1);
      }

      return 1 / (N - 1) * sum;
    },
    // covariance
    spearman: function spearman(d) {
      /* Get Spearman's rank correlation scores  (https://en.wikipedia.org/wiki/Spearman%27s_rank_correlation_coefficient) for the order in a direction.
      	
      The coefficient is:
        covariance (rank_var0, rank_var1 )/( sigma(rank_var0) sigma(rank_var1) )
      */
      var cov = statistics.covariance(d);
      var sigma_var0 = d3.deviation(d, function (d) {
        return d.var0;
      });
      var sigma_var1 = d3.deviation(d, function (d) {
        return d.var1;
      });
      sigma_var0 = sigma_var0 == 0 ? Infinity : sigma_var0;
      sigma_var1 = sigma_var1 == 0 ? Infinity : sigma_var1;
      return cov / (sigma_var0 * sigma_var1);
    },
    // spearman
    categoricalmapping: function categoricalmapping(sprites, variable) {
      var uniquevals = helpers.unique(sprites.map(function (sprite) {
        return sprite.task[variable];
      })); // unique
      // Find the appropriate mapping given the on-screen arrangement. For each unique categorical value calculate the median.

      var medianpoints = uniquevals.map(function (uniqueval) {
        var relevant = sprites.filter(function (sprite) {
          return sprite.task[variable] == uniqueval;
        }); // Find the medianpoint.

        return {
          name: uniqueval,
          x: d3.median(relevant, function (sprite) {
            return parseFloat(sprite.graphic.style.left);
          }),
          y: d3.median(relevant, function (sprite) {
            return parseFloat(sprite.graphic.style.top);
          })
        }; // medianpoint
      }); // map
      // Sort the median points and convert them into direct maps?

      var xmap = medianpoints.sort(function (a, b) {
        return a.x - b.x;
      }).reduce(function (acc, mpoint, i) {
        acc[mpoint.name] = i;
        return acc;
      }, {});
      var ymap = medianpoints.sort(function (a, b) {
        return a.y - b.y;
      }).reduce(function (acc, mpoint, i) {
        acc[mpoint.name] = i;
        return acc;
      }, {});
      return {
        x: xmap,
        y: ymap
      };
    },
    // categoricalmapping
    categoricalcorrelation: function categoricalcorrelation(sprites, categorical) {
      // Collect and encode the categorical variables. The encoding in the x and y directions may differ.
      var sprites_ = sprites.filter(function (sprite) {
        return sprite.task[categorical];
      });
      var variable = categorical; // Get the mapping from labels to numbers.

      var mapping = statistics.categoricalmapping(sprites_, variable); // Because the categorical encoding can be different along both axes, the correlations need to be calculated twice.
      // The midpoints are now ready - do the scores themselves

      var xd = sprites_.map(function (sprite) {
        return {
          var0: parseFloat(sprite.graphic.style.left),
          var1: mapping.x[sprite.task[variable]]
        }; // return
      }); // map

      var yd = sprites_.map(function (sprite) {
        return {
          var0: parseFloat(sprite.graphic.style.top),
          var1: mapping.y[sprite.task[variable]]
        }; // return
      }); // map

      var xscore = statistics.spearman(xd);
      var yscore = statistics.spearman(yd);
      var label = {
        x: xscore < 0 ? "- " + variable : "+ " + variable,
        y: yscore < 0 ? "- " + variable : "+ " + variable
      };
      return {
        name: variable,
        label: label,
        score: {
          x: xscore,
          y: yscore
        }
      };
    },
    // categoricalcorrelation
    ordinalcorrelation: function ordinalcorrelation(sprites, ordinal) {
      // Make sure that all the sprites used have the variable name.
      var sprites_ = sprites.filter(function (sprite) {
        return sprite.task[ordinal];
      });
      var variable = ordinal; // For each of the data variables calculate a correlation.

      var xd = sprites_.map(function (sprite) {
        return {
          var0: parseFloat(sprite.graphic.style.left),
          var1: sprite.task[variable]
        }; // return
      }); // map

      var yd = sprites_.map(function (sprite) {
        return {
          var0: parseFloat(sprite.graphic.style.top),
          var1: sprite.task[variable]
        }; // return
      }); // map

      var xscore = statistics.spearman(xd);
      var yscore = statistics.spearman(yd);
      var label = {
        x: xscore < 0 ? "- " + variable : "+ " + variable,
        y: yscore < 0 ? "- " + variable : "+ " + variable
      };
      return {
        name: variable,
        label: label,
        score: {
          x: xscore,
          y: yscore
        }
      };
    } // ordinalcorrelation

  }; // statistics
  // Button functionality

  function ongroup() {
    // If selection has sprites then only retain those.
    if (dbsliceData.selected.length > 0) {
      // Log all sprites that are not selected into hiding.
      var evicted = dbsliceData.sprites.filter(function (sprite) {
        return !dbsliceData.selected.includes(sprite);
      }); // filter

      dbsliceData.hiding = evicted;
      evicted.forEach(function (sprite) {
        sprite.graphic.style.display = "none";
      });
    } // if

  } // ongroup


  function onungroup() {
    // If selection has sprites then only retain those.
    dbsliceData.selected = [];
    dbsliceData.evicted = [];
    dbsliceData.sprites.forEach(function (sprite) {
      sprite.graphic.style.border = "";
      sprite.graphic.style.display = "";
    });
  } // onungroup


  d3.select("#enter").on("click", ongroup);
  d3.select("#exit").on("click", onungroup);
  d3.select("#correlation-show").on("click", function () {
    // If selection has sprites then only retain those.
    var scores_;

    if (dbsliceData.selected.length > 1) {
      scores_ = statistics.correlation(dbsliceData.selected);
    } else {
      scores_ = statistics.correlation(dbsliceData.sprites);
    } // if


    console.log(scores_);
    var container = d3.select("#correlation-container");
    container.style("display", "");
    var svg = container.select("svg"); // Draw on the svg.

    var xscale = d3.scaleLinear().domain([-1.1, 1.1]).range([0, 500]);
    svg.selectAll("circle").remove();
    svg.selectAll("circle").data(scores_).enter().append("circle").attr("cx", function (d) {
      return xscale(d.score.x);
    }).attr("cy", function (d) {
      return xscale(d.score.y);
    }).attr("r", 5).attr("fill", function (d) {
      // If the score has estimated in name then draw it in orange.
      return d.name.startsWith("estimated") || d.name.startsWith("classified") ? "orange" : "cornflowerblue";
    }).style("cursor", "auto"); // Add the tooltip

    svg.selectAll("circle").on("mouseenter", function (d) {
      d3.select("#tooltip").style("display", "").style("left", d3.event.clientX + "px").style("top", d3.event.clientY - 20 + "px").html(d.name);
    }).on("mouseout", function () {
      d3.select("#tooltip").style("display", "none");
    }); // Let's add some axis.

    svg.selectAll("g.axis").remove();
    var xaxis = d3.axisBottom(xscale);
    var yaxis = d3.axisRight(xscale);
    svg.append("g").attr("class", "axis").call(xaxis);
    svg.append("g").attr("class", "axis").call(yaxis);
  });
  d3.select("#correlation-hide").on("click", function () {
    d3.select("#correlation-container").style("display", "none");
  });
  d3.select("#tsne").on("click", function () {
    dbsliceData.tsnesettings.show();
  });

}());
