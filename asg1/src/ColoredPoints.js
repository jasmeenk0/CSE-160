var VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform float u_Size;
  void main() {
    gl_Position = a_Position;
    gl_PointSize = u_Size;
  }
`;

var FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

const POINT = 0;
const TRIANGLE = 1;
const CIRCLE = 2;

let canvas;
let gl;
let a_Position;
let u_FragColor;
let u_Size;

let g_shapesList = [];

let g_selectedColor = [1.0, 1.0, 1.0, 1.0];
let g_selectedSize = 10.0;
let g_selectedType = POINT;
let g_selectedSegments = 10;
let g_selectedAlpha = 1.0;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  addActionsForHtmlUI();

  canvas.onmousedown = click;
  canvas.onmousemove = function(ev) {
    if (ev.buttons == 1) {
      click(ev);
    }
  };

  gl.clearColor(0.0, 0.0, 0.0, 1.0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.clear(gl.COLOR_BUFFER_BIT);
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
  }
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  if (a_Position < 0) {
    console.log('Failed to get the storage location of a_Position');
    return;
  }

  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');
  if (!u_FragColor) {
    console.log('Failed to get the storage location of u_FragColor');
    return;
  }

  u_Size = gl.getUniformLocation(gl.program, 'u_Size');
  if (!u_Size) {
    console.log('Failed to get the storage location of u_Size');
    return;
  }
}

function addActionsForHtmlUI() {
  document.getElementById('redSlide').addEventListener('input', function() {
    g_selectedColor[0] = this.value / 100;
  });

  document.getElementById('greenSlide').addEventListener('input', function() {
    g_selectedColor[1] = this.value / 100;
  });

  document.getElementById('blueSlide').addEventListener('input', function() {
    g_selectedColor[2] = this.value / 100;
  });

  document.getElementById('alphaSlide').addEventListener('input', function() {
    g_selectedAlpha = this.value / 100;
  });

  document.getElementById('sizeSlide').addEventListener('input', function() {
    g_selectedSize = Number(this.value);
  });

  document.getElementById('segmentSlide').addEventListener('input', function() {
    g_selectedSegments = Number(this.value);
    document.getElementById('segmentValue').textContent = g_selectedSegments;
  });

  document.getElementById('pointButton').onclick = function() {
    g_selectedType = POINT;
  };

  document.getElementById('triangleButton').onclick = function() {
    g_selectedType = TRIANGLE;
  };

  document.getElementById('circleButton').onclick = function() {
    g_selectedType = CIRCLE;
  };

  document.getElementById('clearButton').onclick = function() {
    g_shapesList = [];
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  };

  document.getElementById('drawPictureButton').onclick = function() {
    drawMyPicture();
  };
}

function click(ev) {
  let [x, y] = convertCoordinatesEventToGL(ev);

  let shape;

  if (g_selectedType === POINT) {
    shape = new Point();
  } else if (g_selectedType === TRIANGLE) {
    shape = new Triangle();
  } else if (g_selectedType === CIRCLE) {
    shape = new Circle();
    shape.segments = g_selectedSegments;
  }

  shape.position = [x, y, 0.0];
  shape.color = [
    g_selectedColor[0],
    g_selectedColor[1],
    g_selectedColor[2],
    g_selectedAlpha
  ];
  shape.size = g_selectedSize;

  g_shapesList.push(shape);
  renderAllShapes();
}

function convertCoordinatesEventToGL(ev) {
  let x = ev.clientX;
  let y = ev.clientY;
  let rect = ev.target.getBoundingClientRect();

  x = ((x - rect.left) - canvas.width / 2) / (canvas.width / 2);
  y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

  return [x, y];
}

function renderAllShapes() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  for (let i = 0; i < g_shapesList.length; i++) {
    g_shapesList[i].render();
  }
}

function drawMyPicture() {
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.uniform4f(u_FragColor, 0.53, 0.81, 0.98, 1.0);
  drawTriangle([
    -1.0,  1.0,
    -1.0, -0.2,
     1.0,  1.0
  ]);
  drawTriangle([
     1.0,  1.0,
    -1.0, -0.2,
     1.0, -0.2
  ]);

  gl.uniform4f(u_FragColor, 0.2, 0.7, 0.2, 1.0);
  drawTriangle([
    -1.0, -0.2,
    -1.0, -1.0,
     1.0, -0.2
  ]);
  drawTriangle([
     1.0, -0.2,
    -1.0, -1.0,
     1.0, -1.0
  ]);

  gl.uniform4f(u_FragColor, 1.0, 0.9, 0.0, 1.0);

  drawTriangle([
    0.65, 0.65,
    0.8, 0.8,
    0.95, 0.65
  ]);
  drawTriangle([
    0.65, 0.65,
    0.8, 0.5,
    0.95, 0.65
  ]);

  drawTriangle([
    0.8, 0.95,
    0.76, 0.84,
    0.84, 0.84
  ]);
  drawTriangle([
    0.8, 0.35,
    0.76, 0.46,
    0.84, 0.46
  ]);
  drawTriangle([
    0.5, 0.65,
    0.61, 0.61,
    0.61, 0.69
  ]);
  drawTriangle([
    1.0, 0.65,
    0.89, 0.61,
    0.89, 0.69
  ]);
  drawTriangle([
    0.59, 0.86,
    0.68, 0.77,
    0.72, 0.81
  ]);
  drawTriangle([
    0.59, 0.44,
    0.72, 0.49,
    0.68, 0.53
  ]);
  drawTriangle([
    1.01, 0.86,
    0.88, 0.81,
    0.92, 0.77
  ]);
  drawTriangle([
    1.01, 0.44,
    0.92, 0.53,
    0.88, 0.49
  ]);

  gl.uniform4f(u_FragColor, 0.0, 0.6, 0.0, 1.0);
  drawTriangle([
    -0.03, -0.1,
    -0.03, -0.75,
     0.03, -0.1
  ]);
  drawTriangle([
     0.03, -0.1,
    -0.03, -0.75,
     0.03, -0.75
  ]);

  gl.uniform4f(u_FragColor, 0.1, 0.7, 0.2, 1.0);
  drawTriangle([
    -0.03, -0.45,
    -0.28, -0.35,
    -0.10, -0.55
  ]);
  drawTriangle([
     0.03, -0.55,
     0.28, -0.45,
     0.10, -0.35
  ]);

  gl.uniform4f(u_FragColor, 1.0, 0.4, 0.7, 1.0);

  drawTriangle([
    -0.08, 0.28,
     0.00, 0.45,
     0.08, 0.28
  ]);

  drawTriangle([
    -0.08, 0.12,
     0.00, -0.02,
     0.08, 0.12
  ]);

  drawTriangle([
    -0.20, 0.10,
    -0.05, 0.20,
    -0.05, 0.04
  ]);

  drawTriangle([
     0.20, 0.10,
     0.05, 0.20,
     0.05, 0.04
  ]);

  drawTriangle([
    -0.18, 0.24,
    -0.03, 0.28,
    -0.08, 0.14
  ]);

  drawTriangle([
     0.18, 0.24,
     0.03, 0.28,
     0.08, 0.14
  ]);

  gl.uniform4f(u_FragColor, 1.0, 0.85, 0.1, 1.0);
  drawTriangle([
    -0.06, 0.10,
     0.00, 0.22,
     0.06, 0.10
  ]);
  drawTriangle([
    -0.06, 0.10,
     0.00, -0.02,
     0.06, 0.10
  ]);

  gl.uniform4f(u_FragColor, 0.9, 0.2, 0.2, 1.0);

  drawTriangle([
    -0.85, 0.55,
    -0.65, 0.55,
    -0.85, 0.48
  ]);
  drawTriangle([
    -0.65, 0.55,
    -0.85, 0.48,
    -0.65, 0.48
  ]);

  drawTriangle([
    -0.77, 0.48,
    -0.70, 0.48,
    -0.77, 0.12
  ]);
  drawTriangle([
    -0.70, 0.48,
    -0.77, 0.12,
    -0.70, 0.12
  ]);

  drawTriangle([
    -0.84, 0.12,
    -0.70, 0.12,
    -0.84, 0.04
  ]);
  drawTriangle([
    -0.70, 0.12,
    -0.84, 0.04,
    -0.70, 0.04
  ]);

  gl.uniform4f(u_FragColor, 0.2, 0.2, 0.9, 1.0);

  drawTriangle([
    -0.58, 0.55,
    -0.51, 0.55,
    -0.58, 0.04
  ]);
  drawTriangle([
    -0.51, 0.55,
    -0.58, 0.04,
    -0.51, 0.04
  ]);

  drawTriangle([
    -0.51, 0.30,
    -0.34, 0.55,
    -0.42, 0.55
  ]);
  drawTriangle([
    -0.51, 0.30,
    -0.42, 0.55,
    -0.46, 0.30
  ]);

  // lower arm
  drawTriangle([
    -0.51, 0.24,
    -0.34, 0.04,
    -0.42, 0.04
  ]);
  drawTriangle([
    -0.51, 0.24,
    -0.42, 0.04,
    -0.46, 0.24
  ]);
}