import { changeColor, randomColor } from "./colorTools";
import nerdAlertImg from './images/nerdalert';
import ratImg from './images/ratthew';

const TIME_LENGTH = 50;
const RUN_SPEED = 1;

interface method {
  name: string;
  value: number;
}

type ShapeNode = RectangleNode | EllipseNode | PolygonNode | StarNode | VectorNode;
const supportedShapes = ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR"];

const makeRandom = () => {
  return (Math.random() * 3 - 1);
}

function getRandomAlphanumeric(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomIndex = Math.floor(Math.random() * chars.length);
  return chars[randomIndex];
}

function clone(val: any) {
  return JSON.parse(JSON.stringify(val))
}

function randomImage() {
  const images = [nerdAlertImg, ratImg];
  return images[Math.floor(Math.random() * images.length)];
}

class DistortNode<T extends SceneNode>{
  node: T;
  x: number;
  y: number;
  scaleFactor: number;
  running: boolean = false;
  methods: method[];

  constructor(node: T) {
    this.node = node;
    this.x = makeRandom();
    this.y = makeRandom();
    this.scaleFactor = makeRandom();
    this.methods = [
      {
        name: "move",
        value: 10
      }
    ]
  }
  getMethod() {
    const total = this.methods.reduce((acc, m) => acc + m.value, 0);
    let randomNum = Math.random();
    const selected = (this.methods.find(m => {
      randomNum -= m.value / total;
      return randomNum < 0;
    }) as method).name;
    return selected ? selected : "";
  }
  set() {
    this.x = makeRandom();
    this.y = makeRandom();
    this.scaleFactor = makeRandom();
  }
  moveX() {
    this.node.x = this.node.x + this.x;
  }
  moveY() {
    this.node.y = this.node.y + this.y;
  }
  run(funcName: string, count: number, callback: any): any {
    setTimeout(() => {
      this.running = true;
      // @ts-ignore
      this[funcName]();
      if (count < 0 || funcName === "imageFill") {
        this.running = false;
        callback();
        return true;
      }
      return this.run(funcName, count - 1, callback);
    }, RUN_SPEED);
  }
}

class DistortShape extends DistortNode<ShapeNode> {
  constructor(node: ShapeNode) {
    super(node);
    this.methods = [
      {name: "moveX", value: 10},
      {name: "moveY", value: 15},
      {name: "resize", value: 10},
      {name: "color", value: 5},
      {name: "rotate", value: 5},
      {name: "imageFill", value: 5},
    ]
  }
  resize() {
    this.node.resize(this.node.width + Math.abs(this.x), this.node.height + Math.abs(this.y));
  }
  color() {
    const fill = clone(this.node.fills);
    if (fill[0]) {
      if (fill[0].type === "SOLID") { 
        fill[0].color = changeColor(fill[0].color, this.scaleFactor * 0.25);
        this.node.fills = [
          fill[0]
        ];
      }
      else {
        const color = randomColor();
        this.node.fills = [{
          type: 'SOLID',
          color
        }]
      }
    }
  }
  rotate() {
    this.node.rotation = this.node.rotation + this.scaleFactor / 2;
  }
  imageFill() {
    const image = figma.createImage(
      figma.base64Decode(randomImage())
    );
    this.node.fills = [
      {
        type: 'IMAGE',
        imageHash: image.hash,
        scaleMode: 'FILL'
      }
    ]
  }
}

class DistortText extends DistortNode<TextNode> {
  constructor(node: TextNode) {
    super(node);
    this.methods = [
      {name: "moveX",value: 10},
      {name: "moveY",value: 15},
      {name: "resize",value: 10},
      {name: "color",value: 5},
      {name: "randomCharacter", value: 10}
    ]
  }
  resize() {
    this.node.resize(this.node.width + Math.abs(this.x), this.node.height + Math.abs(this.y));
  }
  color() {
    const fill = clone(this.node.fills)
    if (fill[0] && fill[0].type === "SOLID") {
      fill[0].color = changeColor(fill[0].color, this.scaleFactor);
      this.node.fills = [
        fill[0]
      ]
    }
  }
  randomCharacter() {
    if (Math.random() > 0.85) {
      const charLength = this.node.characters.length;
      const randomPos = Math.floor(Math.random() * charLength);
      const randomChar = getRandomAlphanumeric();
      this.node.deleteCharacters(randomPos, randomPos + 1);
      this.node.insertCharacters(randomPos , randomChar);
    }
  }
}

const detach = (instance: InstanceNode) => {
  if (instance.children) {
    instance.children.forEach(child => {
        if (child.type === "INSTANCE") return detach(child);
      })
  }
  if (!instance.removed) instance.detachInstance();
}

export default async function () {
  const currentPage = figma.currentPage;
  const shapes: DistortNode<SceneNode>[] = [];
  const docFonts: Set<FontName> = new Set<FontName>();
  
  let nodes = currentPage.findAll() as SceneNode[];
  nodes.forEach((node) => {
    if (node.type === "INSTANCE" && !node.removed) {
        detach(node);
    }
  });

  nodes = currentPage.findAll() as SceneNode[];
  nodes.forEach(node => {
    if (supportedShapes.includes(node.type)) {
      shapes.push(new DistortShape(node as ShapeNode));
    }
    if (node.type === "TEXT") {
      node.getRangeAllFontNames(0, node.characters.length).forEach(font => docFonts.add(font));
      shapes.push(new DistortText(node as TextNode));
    }
  });

  await Promise.all(Array.from(docFonts.entries()).map(([font]: [FontName, FontName]) => {
    return figma.loadFontAsync(font);
  }));

  function run() {
    setTimeout(() => {
      let index = Math.floor(Math.random() * shapes.length);
      let shape = shapes[index];
      let methodName = shape.getMethod();
      console.log(shape.node, methodName);
      shape.set();
      shape.run(methodName, Math.ceil(Math.random() * TIME_LENGTH), run);
    }, 10);
  }
  run();
}
