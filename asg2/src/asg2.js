let canvas;
let gl;

let a_Position;
let u_ModelMatrix;
let u_GlobalRotateMatrix;
let u_FragColor;

let g_globalAngleY = 0;
let g_globalAngleX = 0;

let g_frontThighAngle = 0;
let g_frontCalfAngle = 0;
let g_frontFootAngle = 0;

let g_backThighAngle = 0;
let g_backCalfAngle = 0;
let g_backFootAngle = 0;

let g_tailAngle = 0;
let g_tailTipAngle = 0;

let g_headAngle = 0;
let g_earAngle = 0;

let g_animation = false;
let g_startTime = performance.now() / 1000.0;
let g_seconds = 0;

let g_mouseDown = false;
let g_lastX = 0;
let g_lastY = 0;
let g_poke = false;
let g_pokeStart = 0;

let cubeBuffer = null;
let coneBuffer = null;
let coneVertexCount = 0;

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_GlobalRotateMatrix;
  void main() {
    gl_Position = u_GlobalRotateMatrix * u_ModelMatrix * a_Position;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;
  uniform vec4 u_FragColor;
  void main() {
    gl_FragColor = u_FragColor;
  }
`;

function main() {
  setupWebGL();
  connectVariablesToGLSL();
  initCubeBuffer();
  initConeBuffer();

  canvas.onmousedown = handleMouseDown;
  canvas.onmouseup = function () { g_mouseDown = false; };
  canvas.onmouseleave = function () { g_mouseDown = false; };
  canvas.onmousemove = handleMouseMove;
  canvas.onclick = handleClick;

  gl.clearColor(0.85, 0.9, 1.0, 1.0);

  renderScene();
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById('webgl');
  gl = canvas.getContext('webgl', { preserveDrawingBuffer: true });

  if (!gl) {
    console.log('Failed to get WebGL context.');
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to initialize shaders.');
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, 'a_Position');
  u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix');
  u_GlobalRotateMatrix = gl.getUniformLocation(gl.program, 'u_GlobalRotateMatrix');
  u_FragColor = gl.getUniformLocation(gl.program, 'u_FragColor');

  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
}

function initCubeBuffer() {
  const vertices = new Float32Array([
    // Front
    -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,

    // Back
    -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
    -0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5,-0.5,-0.5,

    // Left
    -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
    -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,

    // Right
     0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
     0.5,-0.5,-0.5,   0.5, 0.5, 0.5,   0.5,-0.5, 0.5,

    // Top
    -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5, 0.5,-0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,

    // Bottom
    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
    -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
  ]);

  cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
}

function initConeBuffer() {
  const verts = [];
  const segments = 20;

  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * 2 * Math.PI;
    const a2 = ((i + 1) / segments) * 2 * Math.PI;

    const x1 = Math.cos(a1) * 0.5;
    const z1 = Math.sin(a1) * 0.5;
    const x2 = Math.cos(a2) * 0.5;
    const z2 = Math.sin(a2) * 0.5;

    // Side
    verts.push(
      0, 0.5, 0,
      x1, -0.5, z1,
      x2, -0.5, z2
    );

    // Base
    verts.push(
      0, -0.5, 0,
      x2, -0.5, z2,
      x1, -0.5, z1
    );
  }

  const vertices = new Float32Array(verts);
  coneVertexCount = vertices.length / 3;

  coneBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, coneBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
}

function drawCube(matrix, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function drawCone(matrix, color) {
  gl.bindBuffer(gl.ARRAY_BUFFER, coneBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.drawArrays(gl.TRIANGLES, 0, coneVertexCount);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);
}

function tick() {
  g_seconds = performance.now() / 1000.0 - g_startTime;
  updateAnimationAngles();
  renderScene();
  requestAnimationFrame(tick);
}

function updateAnimationAngles() {
  if (g_animation) {
    g_frontThighAngle = 25 * Math.sin(g_seconds * 3);
    g_frontCalfAngle = 18 * Math.sin(g_seconds * 3 + 0.8);
    g_frontFootAngle = 10 * Math.sin(g_seconds * 3 + 1.4);

    g_backThighAngle = -25 * Math.sin(g_seconds * 3);
    g_backCalfAngle = -18 * Math.sin(g_seconds * 3 + 0.8);
    g_backFootAngle = -10 * Math.sin(g_seconds * 3 + 1.4);

    g_tailAngle = 20 * Math.sin(g_seconds * 5);
    g_tailTipAngle = 30 * Math.sin(g_seconds * 5 + 0.5);

    g_headAngle = 6 * Math.sin(g_seconds * 2);
    g_earAngle = 12 * Math.sin(g_seconds * 6);
  }

  if (g_poke) {
    let elapsed = performance.now() / 1000.0 - g_pokeStart;
    if (elapsed < 0.8) {
      g_tailAngle = 45 * Math.sin(elapsed * 20);
      g_tailTipAngle = 60 * Math.sin(elapsed * 24);
      g_headAngle = -12 * Math.sin(elapsed * 14);
      g_earAngle = 25 * Math.sin(elapsed * 18);
    } else {
      g_poke = false;
    }
  }
}

function renderScene() {
  let startTime = performance.now();

  let globalRotMat = new Matrix4();
  globalRotMat.rotate(g_globalAngleY, 0, 1, 0);
  globalRotMat.rotate(g_globalAngleX, 1, 0, 0);
  gl.uniformMatrix4fv(u_GlobalRotateMatrix, false, globalRotMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawGround();
  drawCow();

  let duration = performance.now() - startTime;
  document.getElementById('fps').innerText = 'ms: ' + duration.toFixed(2);
}

function drawGround() {
  let ground = new Matrix4();
  ground.translate(0, -0.8, 0);
  ground.scale(3, 0.05, 3);
  drawCube(ground, [0.3, 0.75, 0.35, 1.0]);
}

function drawCow() {
  const bodyColor = [0.95, 0.95, 0.95, 1.0];
  const spotColor = [0.15, 0.15, 0.15, 1.0];
  const hoofColor = [0.3, 0.2, 0.15, 1.0];
  const pink = [0.95, 0.7, 0.75, 1.0];
  const hornColor = [0.9, 0.85, 0.6, 1.0];

  // Body
  let body = new Matrix4();
  body.translate(0, -0.05, 0);
  body.scale(0.95, 0.48, 0.55);
  drawCube(body, bodyColor);

  // Spots
  let spot1 = new Matrix4();
  spot1.translate(0.10, 0.02, 0.22);
  spot1.scale(0.20, 0.16, 0.02);
  drawCube(spot1, spotColor);

  let spot2 = new Matrix4();
  spot2.translate(-0.18, -0.03, -0.23);
  spot2.scale(0.22, 0.18, 0.02);
  drawCube(spot2, spotColor);

  // Head joint
  let headBase = new Matrix4();
  headBase.translate(0.48, 0.12, 0.0);
  headBase.rotate(g_headAngle, 0, 0, 1);
  let headAnchor = new Matrix4(headBase);

  let head = new Matrix4(headBase);
  head.translate(0.16, 0.0, 0.0);
  head.scale(0.34, 0.28, 0.30);
  drawCube(head, bodyColor);

  let snout = new Matrix4(headAnchor);
  snout.translate(0.32, -0.08, 0.0);
  snout.scale(0.18, 0.14, 0.18);
  drawCube(snout, pink);

  // Ears
  let ear1Base = new Matrix4(headAnchor);
  ear1Base.translate(0.14, 0.16, 0.16);
  ear1Base.rotate(g_earAngle, 1, 0, 0);
  let ear1 = new Matrix4(ear1Base);
  ear1.scale(0.08, 0.08, 0.05);
  drawCube(ear1, spotColor);

  let ear2Base = new Matrix4(headAnchor);
  ear2Base.translate(0.14, 0.16, -0.16);
  ear2Base.rotate(-g_earAngle, 1, 0, 0);
  let ear2 = new Matrix4(ear2Base);
  ear2.scale(0.08, 0.08, 0.05);
  drawCube(ear2, spotColor);

  // Horns (non-cube primitive)
  let horn1 = new Matrix4(headAnchor);
  horn1.translate(0.20, 0.22, 0.10);
  horn1.rotate(-90, 0, 0, 1);
  horn1.scale(0.08, 0.12, 0.08);
  drawCone(horn1, hornColor);

  let horn2 = new Matrix4(headAnchor);
  horn2.translate(0.20, 0.22, -0.10);
  horn2.rotate(-90, 0, 0, 1);
  horn2.scale(0.08, 0.12, 0.08);
  drawCone(horn2, hornColor);

  // Tail chain
  let tailBase = new Matrix4();
  tailBase.translate(-0.52, 0.12, 0.0);
  tailBase.rotate(g_tailAngle, 0, 0, 1);
  let tailAnchor = new Matrix4(tailBase);

  let tail = new Matrix4(tailBase);
  tail.translate(-0.10, -0.14, 0.0);
  tail.scale(0.05, 0.28, 0.05);
  drawCube(tail, spotColor);

  let tailTipBase = new Matrix4(tailAnchor);
  tailTipBase.translate(-0.12, -0.28, 0.0);
  tailTipBase.rotate(g_tailTipAngle, 0, 0, 1);

  let tailTip = new Matrix4(tailTipBase);
  tailTip.translate(-0.04, -0.06, 0.0);
  tailTip.scale(0.07, 0.12, 0.07);
  drawCube(tailTip, spotColor);

  // Legs
  drawLeg( 0.28, -0.30,  0.18, false, false, hoofColor, bodyColor); // front right
  drawLeg( 0.28, -0.30, -0.18, false, true,  hoofColor, bodyColor); // front left
  drawLeg(-0.25, -0.30,  0.18, true,  true,  hoofColor, bodyColor); // back right
  drawLeg(-0.25, -0.30, -0.18, true,  true,  hoofColor, bodyColor); // back left
}

function drawLeg(x, y, z, isBackLeg, useSliderAngles, hoofColor, legColor) {
  let thighAngle = 0;
  let calfAngle = 0;
  let footAngle = 0;

  if (useSliderAngles || g_animation) {
    thighAngle = isBackLeg ? g_backThighAngle : g_frontThighAngle;
    calfAngle = isBackLeg ? g_backCalfAngle : g_frontCalfAngle;
    footAngle = isBackLeg ? g_backFootAngle : g_frontFootAngle;
  }

  let thighBase = new Matrix4();
  thighBase.translate(x, y, z);
  thighBase.rotate(thighAngle, 0, 0, 1);
  let thighAnchor = new Matrix4(thighBase);

  let thigh = new Matrix4(thighBase);
  thigh.translate(0, -0.15, 0);
  thigh.scale(0.11, 0.30, 0.11);
  drawCube(thigh, legColor);

  let calfBase = new Matrix4(thighAnchor);
  calfBase.translate(0, -0.30, 0);
  calfBase.rotate(calfAngle, 0, 0, 1);
  let calfAnchor = new Matrix4(calfBase);

  let calf = new Matrix4(calfBase);
  calf.translate(0, -0.15, 0);
  calf.scale(0.10, 0.30, 0.10);
  drawCube(calf, legColor);

  let footBase = new Matrix4(calfAnchor);
  footBase.translate(0, -0.30, 0);
  footBase.rotate(footAngle, 0, 0, 1);

  let foot = new Matrix4(footBase);
  foot.translate(0.06, -0.02, 0);
  foot.scale(0.16, 0.08, 0.13);
  drawCube(foot, hoofColor);
}

function handleMouseDown(ev) {
  g_mouseDown = true;
  g_lastX = ev.clientX;
  g_lastY = ev.clientY;
}

function handleMouseMove(ev) {
  if (!g_mouseDown) return;

  let dx = ev.clientX - g_lastX;
  let dy = ev.clientY - g_lastY;

  g_globalAngleY += dx * 0.5;
  g_globalAngleX += dy * 0.5;

  g_lastX = ev.clientX;
  g_lastY = ev.clientY;

  renderScene();
}

function handleClick(ev) {
  if (ev.shiftKey) {
    g_poke = true;
    g_pokeStart = performance.now() / 1000.0;
  }
}