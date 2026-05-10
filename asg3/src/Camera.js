class Camera {
  constructor() {
    this.eye = new Vector3([0, 1, 5]);
    this.at = new Vector3([0, 1, 0]);
    this.up = new Vector3([0, 1, 0]);

    this.speed = 0.25;
    this.alpha = 5;
  }

  moveForward() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    f.mul(this.speed);

    this.eye.add(f);
    this.at.add(f);
  }

  moveBackwards() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();
    f.mul(this.speed);

    this.eye.sub(f);
    this.at.sub(f);
  }

  moveLeft() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(this.up, f);
    s.normalize();
    s.mul(this.speed);

    this.eye.add(s);
    this.at.add(s);
  }

  moveRight() {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);
    f.normalize();

    let s = Vector3.cross(f, this.up);
    s.normalize();
    s.mul(this.speed);

    this.eye.add(s);
    this.at.add(s);
  }

  panLeft() {
    this.pan(this.alpha);
  }

  panRight() {
    this.pan(-this.alpha);
  }

  pan(angle) {
    let f = new Vector3(this.at.elements);
    f.sub(this.eye);

    let rotationMatrix = new Matrix4();
    rotationMatrix.setRotate(angle, this.up.elements[0], this.up.elements[1], this.up.elements[2]);

    let fPrime = rotationMatrix.multiplyVector3(f);

    this.at = new Vector3(this.eye.elements);
    this.at.add(fPrime);
  }
}