let canvas, gl;

let a_Position, a_UV;
let u_ModelMatrix, u_ViewMatrix, u_ProjectionMatrix;
let u_FragColor, u_whichTexture;
let u_Sampler0, u_Sampler1, u_Sampler2;

let cubeBuffer = null;
let uvBuffer = null;
let g_camera;

let g_texturesLoaded = [false, false, false];

const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec2 a_UV;

  varying vec2 v_UV;

  uniform mat4 u_ModelMatrix;
  uniform mat4 u_ViewMatrix;
  uniform mat4 u_ProjectionMatrix;

  void main() {
    gl_Position = u_ProjectionMatrix * u_ViewMatrix * u_ModelMatrix * a_Position;
    v_UV = a_UV;
  }
`;

const FSHADER_SOURCE = `
  precision mediump float;

  varying vec2 v_UV;

  uniform vec4 u_FragColor;
  uniform int u_whichTexture;

  uniform sampler2D u_Sampler0;
  uniform sampler2D u_Sampler1;
  uniform sampler2D u_Sampler2;

  void main() {
    if (u_whichTexture == -2) {
      gl_FragColor = u_FragColor;
    } else if (u_whichTexture == 0) {
      gl_FragColor = texture2D(u_Sampler0, v_UV);
    } else if (u_whichTexture == 1) {
      gl_FragColor = texture2D(u_Sampler1, v_UV);
    } else if (u_whichTexture == 2) {
      gl_FragColor = texture2D(u_Sampler2, v_UV);
    } else {
      gl_FragColor = u_FragColor;
    }
  }
`;

let g_map = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,0,0,0,0,0,0,2,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,0,0,3,3,3,0,0,0,2,0,0,0,0,1],
  [1,0,0,0,3,0,3,0,0,0,2,0,0,0,0,1],
  [1,0,0,0,3,3,3,0,0,0,2,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,2,0,0,0,0,0,0,0,0,0,2,0,0,1],
  [1,0,2,0,0,0,0,0,0,0,0,0,2,0,0,1],
  [1,0,2,0,0,0,0,0,0,0,0,0,2,0,0,1],
  [1,0,0,0,0,0,0,0,3,3,3,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,3,0,3,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,3,3,3,0,0,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
];

function main() {
  setupWebGL();
  connectVariablesToGLSL();

  g_camera = new Camera();

  initCubeBuffer();
  initTextures();

  document.onkeydown = keydown;
  canvas.onclick = handleClick;
  canvas.onmousemove = handleMouseMove;

  gl.clearColor(0.6, 0.8, 1.0, 1.0);

  tick();
}

function tick() {
  renderScene();
  requestAnimationFrame(tick);
}

function setupWebGL() {
  canvas = document.getElementById("webgl");
  gl = canvas.getContext("webgl", { preserveDrawingBuffer: true });

  if (!gl) {
    console.log("Failed to get WebGL context.");
    return;
  }

  gl.enable(gl.DEPTH_TEST);
}

function connectVariablesToGLSL() {
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log("Failed to initialize shaders.");
    return;
  }

  a_Position = gl.getAttribLocation(gl.program, "a_Position");
  a_UV = gl.getAttribLocation(gl.program, "a_UV");

  u_ModelMatrix = gl.getUniformLocation(gl.program, "u_ModelMatrix");
  u_ViewMatrix = gl.getUniformLocation(gl.program, "u_ViewMatrix");
  u_ProjectionMatrix = gl.getUniformLocation(gl.program, "u_ProjectionMatrix");
  u_FragColor = gl.getUniformLocation(gl.program, "u_FragColor");
  u_whichTexture = gl.getUniformLocation(gl.program, "u_whichTexture");

  u_Sampler0 = gl.getUniformLocation(gl.program, "u_Sampler0");
  u_Sampler1 = gl.getUniformLocation(gl.program, "u_Sampler1");
  u_Sampler2 = gl.getUniformLocation(gl.program, "u_Sampler2");

  let identity = new Matrix4();
  gl.uniformMatrix4fv(u_ModelMatrix, false, identity.elements);
}

function initCubeBuffer() {
  const vertices = new Float32Array([
    -0.5,-0.5, 0.5,   0.5,-0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5,-0.5, 0.5,   0.5, 0.5, 0.5,  -0.5, 0.5, 0.5,

    -0.5,-0.5,-0.5,  -0.5, 0.5,-0.5,   0.5, 0.5,-0.5,
    -0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5,-0.5,-0.5,

    -0.5,-0.5,-0.5,  -0.5,-0.5, 0.5,  -0.5, 0.5, 0.5,
    -0.5,-0.5,-0.5,  -0.5, 0.5, 0.5,  -0.5, 0.5,-0.5,

     0.5,-0.5,-0.5,   0.5, 0.5,-0.5,   0.5, 0.5, 0.5,
     0.5,-0.5,-0.5,   0.5, 0.5, 0.5,   0.5,-0.5, 0.5,

    -0.5, 0.5,-0.5,  -0.5, 0.5, 0.5,   0.5, 0.5, 0.5,
    -0.5, 0.5,-0.5,   0.5, 0.5, 0.5,   0.5, 0.5,-0.5,

    -0.5,-0.5,-0.5,   0.5,-0.5,-0.5,   0.5,-0.5, 0.5,
    -0.5,-0.5,-0.5,   0.5,-0.5, 0.5,  -0.5,-0.5, 0.5,
  ]);

  const uvs = new Float32Array([
    0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
    0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
    0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
    0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
    0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
    0,0, 1,0, 1,1,  0,0, 1,1, 0,1,
  ]);

  cubeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

  uvBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
}

function initTextures() {
  loadTexture("./images/grass.jpg", 0, u_Sampler0);
  loadTexture("./images/dirt.jpg", 1, u_Sampler1);
  loadTexture("./images/sky.jpg", 2, u_Sampler2);
}

function loadTexture(src, textureUnit, sampler) {
  let image = new Image();

  image.onload = function () {
    sendImageToTexture(image, textureUnit, sampler);
    g_texturesLoaded[textureUnit] = true;
    renderScene();
  };

  image.onerror = function () {
    console.log("Could not load texture:", src);
  };

  image.src = src;
}

function sendImageToTexture(image, textureUnit, sampler) {
  let texture = gl.createTexture();

  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

  if (textureUnit === 0) gl.activeTexture(gl.TEXTURE0);
  if (textureUnit === 1) gl.activeTexture(gl.TEXTURE1);
  if (textureUnit === 2) gl.activeTexture(gl.TEXTURE2);

  gl.bindTexture(gl.TEXTURE_2D, texture);

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Important for random online images that are not 256x256 / 512x512
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    image
  );

  gl.uniform1i(sampler, textureUnit);
}

function drawCube(matrix, color, textureNum) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeBuffer);
  gl.vertexAttribPointer(a_Position, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_Position);

  gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer);
  gl.vertexAttribPointer(a_UV, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(a_UV);

  // If texture is not loaded yet, just use color instead of black.
  if (textureNum >= 0 && !g_texturesLoaded[textureNum]) {
    textureNum = -2;
  }

  gl.uniformMatrix4fv(u_ModelMatrix, false, matrix.elements);
  gl.uniform4f(u_FragColor, color[0], color[1], color[2], color[3]);
  gl.uniform1i(u_whichTexture, textureNum);

  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

function renderScene() {
  let startTime = performance.now();

  let projMat = new Matrix4();
  projMat.setPerspective(60, canvas.width / canvas.height, 0.1, 100);
  gl.uniformMatrix4fv(u_ProjectionMatrix, false, projMat.elements);

  let viewMat = new Matrix4();
  viewMat.setLookAt(
    g_camera.eye.elements[0], g_camera.eye.elements[1], g_camera.eye.elements[2],
    g_camera.at.elements[0],  g_camera.at.elements[1],  g_camera.at.elements[2],
    g_camera.up.elements[0],  g_camera.up.elements[1],  g_camera.up.elements[2]
  );
  gl.uniformMatrix4fv(u_ViewMatrix, false, viewMat.elements);

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  drawSky();
  drawGround();
  drawMap();
  drawCow();

  let duration = performance.now() - startTime;
  document.getElementById("fps").innerText = "ms: " + duration.toFixed(2);
}

function drawGround() {
  let ground = new Matrix4();
  ground.translate(0, -0.51, 0);
  ground.scale(32, 0.05, 32);
  drawCube(ground, [0.25, 0.7, 0.25, 1.0], 0);
}

function drawSky() {
  let sky = new Matrix4();
  sky.scale(-60, -60, -60);
  drawCube(sky, [0.55, 0.75, 1.0, 1.0], 2);
}

function drawMap() {
  for (let x = 0; x < g_map.length; x++) {
    for (let z = 0; z < g_map[x].length; z++) {
      let height = g_map[x][z];

      for (let y = 0; y < height; y++) {
        let block = new Matrix4();
        block.translate(x - 8, y, z - 8);
        let rainbowColors = [
        [1.0, 0.2, 0.2, 1.0],
        [1.0, 0.55, 0.1, 1.0],
        [1.0, 1.0, 0.2, 1.0],
        [0.2, 0.8, 0.2, 1.0],
        [0.2, 0.5, 1.0, 1.0],
        [0.6, 0.3, 1.0, 1.0],
        ];

        let color = rainbowColors[(x + y + z) % rainbowColors.length];

// taller blocks stay dirt, shorter blocks become rainbow
        if (height == 1) {
            drawCube(block, color, -2);
        } else {
            drawCube(block, [0.55, 0.38, 0.2, 1.0], 1);
        }
        }
    }
    }
}

function drawCow() {
  let time = performance.now() * 0.002;
  let bounce = Math.sin(time) * 0.08;
  let sway = Math.sin(time * 1.5) * 5;

  let base = new Matrix4();
  base.translate(0, 0.1 + bounce, 5);
  base.rotate(sway, 0, 1, 0);
  base.scale(1.5, 1.5, 1.5);

  let bodyColor = [0.95, 0.95, 0.95, 1.0];
  let spotColor = [0.1, 0.1, 0.1, 1.0];
  let pink = [0.95, 0.65, 0.75, 1.0];

  let body = new Matrix4(base);
  body.scale(0.9, 0.45, 0.5);
  drawCube(body, bodyColor, -2);

  let head = new Matrix4(base);
  head.translate(0.6, 0.15, 0);
  head.scale(0.35, 0.3, 0.3);
  drawCube(head, bodyColor, -2);

  let snout = new Matrix4(base);
  snout.translate(0.82, 0.08, 0);
  snout.scale(0.18, 0.15, 0.2);
  drawCube(snout, pink, -2);

  let spot1 = new Matrix4(base);
  spot1.translate(0.1, 0.1, 0.26);
  spot1.scale(0.25, 0.18, 0.03);
  drawCube(spot1, spotColor, -2);

  let spot2 = new Matrix4(base);
  spot2.translate(-0.25, 0.02, -0.26);
  spot2.scale(0.25, 0.18, 0.03);
  drawCube(spot2, spotColor, -2);

  drawLeg(base, 0.3, -0.45, 0.18);
  drawLeg(base, 0.3, -0.45, -0.18);
  drawLeg(base, -0.3, -0.45, 0.18);
  drawLeg(base, -0.3, -0.45, -0.18);

  let tail = new Matrix4(base);
  tail.translate(-0.55, 0.12, 0);
  tail.rotate(35, 0, 0, 1);
  tail.scale(0.06, 0.35, 0.06);
  drawCube(tail, spotColor, -2);
}

function drawLeg(base, x, y, z) {
  let leg = new Matrix4(base);
  leg.translate(x, y, z);
  leg.scale(0.12, 0.45, 0.12);
  drawCube(leg, [0.95, 0.95, 0.95, 1.0], -2);

  let hoof = new Matrix4(base);
  hoof.translate(x, y - 0.25, z);
  hoof.scale(0.15, 0.08, 0.15);
  drawCube(hoof, [0.25, 0.15, 0.1, 1.0], -2);
}

function keydown(ev) {
  if (ev.key === "w" || ev.key === "W") {
    g_camera.moveForward();
  } else if (ev.key === "s" || ev.key === "S") {
    g_camera.moveBackwards();
  } else if (ev.key === "a" || ev.key === "A") {
    g_camera.moveLeft();
  } else if (ev.key === "d" || ev.key === "D") {
    g_camera.moveRight();
  } else if (ev.key === "q" || ev.key === "Q") {
    g_camera.panLeft();
  } else if (ev.key === "e" || ev.key === "E") {
    g_camera.panRight();
  }

  renderScene();
}

function handleMouseMove(ev) {
  if (ev.buttons !== 1) return;

  let movementX = ev.movementX || 0;

  if (movementX > 0) {
    g_camera.panRight();
  } else if (movementX < 0) {
    g_camera.panLeft();
  }

  renderScene();
}

function handleClick(ev) {
  let x = Math.floor(g_camera.at.elements[0] + 8);
  let z = Math.floor(g_camera.at.elements[2] + 8);

  if (x < 0 || x >= g_map.length || z < 0 || z >= g_map[0].length) {
    return;
  }

  if (ev.shiftKey) {
    if (g_map[x][z] > 0) {
      g_map[x][z]--;
    }
  } else {
    if (g_map[x][z] < 4) {
      g_map[x][z]++;
    }
  }

  renderScene();
}