let canvas;
let ctx;

function main() {
  canvas = document.getElementById("example");
  if (!canvas) {
    console.log("Failed to retrieve the <canvas> element");
    return;
  }

  ctx = canvas.getContext("2d");
  clearCanvas();

  // draw default v1 for startup if you want
  let v1 = new Vector3([2.25, 2.25, 0]);
  drawVector(v1, "red");
}

function clearCanvas() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawVector(v, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;

  const x = centerX + v.elements[0] * 20;
  const y = centerY - v.elements[1] * 20; // minus because canvas y goes downward

  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(x, y);
  ctx.stroke();
}

function getV1() {
  let x = parseFloat(document.getElementById("v1x").value);
  let y = parseFloat(document.getElementById("v1y").value);
  return new Vector3([x, y, 0]);
}

function getV2() {
  let x = parseFloat(document.getElementById("v2x").value);
  let y = parseFloat(document.getElementById("v2y").value);
  return new Vector3([x, y, 0]);
}

function handleDrawEvent() {
  clearCanvas();

  let v1 = getV1();
  let v2 = getV2();

  drawVector(v1, "red");
  drawVector(v2, "blue");
}

function handleDrawOperationEvent() {
  clearCanvas();

  let v1 = getV1();
  let v2 = getV2();

  drawVector(v1, "red");
  drawVector(v2, "blue");

  let op = document.getElementById("operation").value;
  let scalar = parseFloat(document.getElementById("scalar").value);

  if (op === "add") {
    let v3 = new Vector3(v1.elements.slice());
    v3.add(v2);
    drawVector(v3, "green");
  }
  else if (op === "sub") {
    let v3 = new Vector3(v1.elements.slice());
    v3.sub(v2);
    drawVector(v3, "green");
  }
  else if (op === "mul") {
    let v3 = new Vector3(v1.elements.slice());
    let v4 = new Vector3(v2.elements.slice());
    v3.mul(scalar);
    v4.mul(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  }
  else if (op === "div") {
    let v3 = new Vector3(v1.elements.slice());
    let v4 = new Vector3(v2.elements.slice());
    v3.div(scalar);
    v4.div(scalar);
    drawVector(v3, "green");
    drawVector(v4, "green");
  }
  else if (op === "magnitude") {
    console.log("Magnitude v1:", v1.magnitude());
    console.log("Magnitude v2:", v2.magnitude());
  }
  else if (op === "normalize") {
    let v3 = new Vector3(v1.elements.slice());
    let v4 = new Vector3(v2.elements.slice());
    v3.normalize();
    v4.normalize();
    drawVector(v3, "green");
    drawVector(v4, "green");
  }
  else if (op === "angle") {
    console.log("Angle:", angleBetween(v1, v2), "degrees");
  }
  else if (op === "area") {
    console.log("Area of triangle:", areaTriangle(v1, v2));
  }
}

function angleBetween(v1, v2) {
  let dot = Vector3.dot(v1, v2);
  let mag1 = v1.magnitude();
  let mag2 = v2.magnitude();

  let cosAlpha = dot / (mag1 * mag2);

  // clamp just in case of tiny floating-point weirdness
  cosAlpha = Math.max(-1, Math.min(1, cosAlpha));

  let angleRad = Math.acos(cosAlpha);
  return angleRad * 180 / Math.PI;
}

function areaTriangle(v1, v2) {
  let cross = Vector3.cross(v1, v2);
  let parallelogramArea = cross.magnitude();
  return parallelogramArea / 2;
}