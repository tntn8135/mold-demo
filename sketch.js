let molds = [];  // 곰팡이 저장
let eyes = [];   // 눈 저장
let spores = []; // 포자 저장
let targetX = null;
let targetY = null;

const MAX_SPORES = 1000;  // 포자 최대 개수
const SPORE_SPEED = 0.8;   // 포자 기본 이동 속도
const SPORE_LIFE = 50;     // 포자 수명

let bg;
let textImg; // 텍스트 이미지
let scaleFactor = 0.3; // 실제 포스터(A2)를 화면용으로 축소

function preload() {
  bg = loadImage('bg.png');
  textImg = loadImage('text.png');
}

function setup() {
  createCanvas(bg.width * scaleFactor, bg.height * scaleFactor);
  noStroke();
}

function draw() {
  background(255);
  image(bg, 0, 0, width, height);

  // 곰팡이 업데이트 및 표시
  for (let mold of molds) {
    mold.update();
    mold.show();
  }

  // 평소 포자 흩날리기
  if (random(1) < 0.015 && molds.length > 0) {
    let m = random(molds);
    spores.push(new Spore(m.x + random(-5,5), m.y + random(-5,5)));
  }

  // 포자 업데이트
  for (let i = spores.length - 1; i >= 0; i--) {
    spores[i].update();
    spores[i].show();
    if (spores[i].life <= 0) spores.splice(i, 1);
  }

  if (spores.length > MAX_SPORES) {
    spores.splice(0, spores.length - MAX_SPORES);
  }

  // 랜덤 곰팡이 생성
  if (random(1) < 0.01) {
    molds.push(new Mold(random(width), random(height), random(10, 40), false));
  }

  // 눈 표시
  for (let eye of eyes) {
    eye.show();
  }
}

function mouseDragged() {
  targetX = mouseX;
  targetY = mouseY;

  for (let i = 0; i < 3; i++) {
    molds.push(new Mold(mouseX + random(-10, 10), mouseY + random(-10, 10), random(15, 60), true));
  }
}

function mouseReleased() {
  targetX = null;
  targetY = null;
}

function mousePressed() {
  for (let mold of molds) {
    let num = floor(random(1, 3));
    for (let i = 0; i < num; i++) {
      spores.push(new Spore(mold.x + random(-5,5), mold.y + random(-5,5)));
    }
  }
}

// -------------------- 클래스 정의 --------------------

class Mold {
  constructor(x, y, size, isDragged) {
    this.x = x;
    this.y = y;
    this.size = size * 1.5;
    this.growth = isDragged ? 0 : random(0, 5);
    this.maxSize = this.size;
    this.color = color(random(20, 250), random(205, 230), random(210, 220), 150);
    this.isDragged = isDragged;
    this.offsetX = random(1000);
    this.offsetY = random(1000);
    this.noiseOffset = random(1000);

    this.fuzzParticles = [];
    this.particlesGenerated = false;
  }

  update() {
    if (this.growth < this.maxSize) {
      this.growth += this.isDragged ? 0.8 : 0.1;
    } else if (!this.particlesGenerated) {
      // 외곽 입자 저장
      let fuzzCount = int(this.growth * 1.5);
      let ringRadius = this.growth / 2 * 0.8;
      let ringWidth = this.growth * 0.5;

      for (let i = 0; i < fuzzCount; i++) {
        let angle = random(TWO_PI);
        let r = ringRadius + random(-ringWidth/2, ringWidth/2);
        let px = cos(angle) * r + random(-1.5,1.5);
        let py = sin(angle) * r + random(-1.5,1.5);
        let alpha = random(60,150);
        this.fuzzParticles.push({px, py, alpha});
      }

      this.particlesGenerated = true;
    }

    // 눈 생성 (확률 높임)
    if (this.growth > this.maxSize * 0.8 && random(1) < 0.05) {
      let canSpawn = true;
      let minDist = 70; // 눈끼리 최소 거리 증가
      for (let e of eyes) {
        if (dist(this.x, this.y, e.x, e.y) < minDist) {
          canSpawn = false;
          break;
        }
      }
      if (canSpawn && this.x > width*0.1 && this.x < width*0.9 && this.y > height*0.1 && this.y < height*0.9) {
        eyes.push(new Eye(this.x, this.y));
      }
    }
  }

  show() {
    let dx = sin(frameCount * 0.01 + this.offsetX) * 2;
    let dy = cos(frameCount * 0.01 + this.offsetY) * 2;

    // 본체
    fill(this.color);
    circle(this.x + dx, this.y + dy, this.growth);

    push();
    translate(this.x + dx, this.y + dy);

    if (this.particlesGenerated) {
      // 다 커진 후 고정 입자
      for (let p of this.fuzzParticles) {
        let flicker = map(sin(frameCount*0.1 + this.noiseOffset), -1,1, 0.9, 1.1);
        fill(red(this.color) + random(-20,20),
             green(this.color) + random(-20,20),
             blue(this.color) + random(-20,20),
             p.alpha * flicker);
        circle(p.px*flicker, p.py*flicker, random(2,5));
      }
    } else {
      // 성장 중 입자
      let fuzzCount = int(this.growth*1.5);
      let ringRadius = this.growth/2*0.8;
      let ringWidth = this.growth*0.5;
      for (let i=0;i<fuzzCount;i++){
        let angle = random(TWO_PI);
        let r = ringRadius + random(-ringWidth/2, ringWidth/2);
        let px = cos(angle)*r + random(-1.5,1.5);
        let py = sin(angle)*r + random(-1.5,1.5);
        let alpha = random(60,150);
        fill(red(this.color)+random(-20,20),
             green(this.color)+random(-20,20),
             blue(this.color)+random(-20,20),
             alpha);
        circle(px, py, random(2,5));
      }
    }

    pop();
  }
}

// -------------------- Eye --------------------
class Eye {
  constructor(x,y){
    this.x = x;
    this.y = y;
    this.blinkSpeed = int(random(80,150));
    // 눈 크기 범위를 조금 더 다양하게
    this.eyeSize = random(10,28)*1.5; 
  }

  show(){
    let blinking = frameCount % this.blinkSpeed < 10;
    let irisOffsetX = 0;
    let irisOffsetY = 0;

    if (targetX !== null && targetY !== null){
      let dx = targetX - this.x;
      let dy = targetY - this.y;
      let angle = atan2(dy,dx);
      let offsetDist = this.eyeSize/5;
      irisOffsetX = cos(angle)*offsetDist;
      irisOffsetY = sin(angle)*offsetDist;
    }

    fill(255);
    ellipse(this.x,this.y, this.eyeSize, blinking ? 3 : this.eyeSize);

    if (!blinking){
      fill(0);
      circle(this.x + irisOffsetX, this.y + irisOffsetY, this.eyeSize/3);
    }
  }
}

// -------------------- Spore --------------------
class Spore {
  constructor(x,y){
    this.x = x;
    this.y = y;
    this.size = random(2,5)*2;
    this.life = SPORE_LIFE;
    this.alpha = 200;

    let angle = random(TWO_PI);
    this.vx = cos(angle) * SPORE_SPEED * random(0.5,1.5);
    this.vy = sin(angle) * SPORE_SPEED * random(0.5,1.5) - 0.2;
  }

  update(){
    this.x += this.vx;
    this.y += this.vy;
    this.life -= 2;
    this.alpha = map(this.life,0,SPORE_LIFE,0,200);
  }

  show(){
    fill(255,250,255,this.alpha);
    circle(this.x,this.y,this.size);
  }
}
