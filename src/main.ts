import { hslToRgb, rgbToHsl } from "./colorTools";

const TIME_LENGTH = 25;
const DISTORT_SPEED = 1;
const RUN_SPEED = 1;

type ShapeNode = RectangleNode | EllipseNode | PolygonNode | StarNode | VectorNode;

const makeRandom = () => {
  return (Math.random() * 3 - 1.5);
}

function getRandomAlphanumeric(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomIndex = Math.floor(Math.random() * chars.length);
  return chars[randomIndex];
}

function clone(val: any) {
  return JSON.parse(JSON.stringify(val))
}

function changeColor(color:any, increment:number) {
  let hsl = rgbToHsl(color.r,color.g,color.b)
  hsl.h = (hsl.h + increment * 2) % 360;
  hsl.s = Math.min(Math.max(hsl.s + increment * 1, 0), 100);
  hsl.l = Math.min(Math.max(hsl.l + increment * 2, 0), 100);
  if (hsl.h < 0) hsl.h = 360;
  const rgb = hslToRgb(hsl.h, hsl.s, hsl.l);
  return rgb;
}

class DistortNode<T extends SceneNode>{
  node: T;
  x: number;
  y: number;
  scaleFactor: number;
  running: boolean = false;

  constructor(node: T) {
    this.node = node;
    this.x = makeRandom() * 5;
    this.y = makeRandom();
    this.scaleFactor = makeRandom() * 0.5;
  }
  reset() {
    this.x = makeRandom() * 5;
    this.y = makeRandom();
    this.scaleFactor = makeRandom() * 0.5;
  }
  move() {
    this.node.x = this.node.x + this.x;
    this.node.y = this.node.y + this.y;
  }
  run(funcName: string, count: number): any {
    setTimeout(() => {
      this.running = true;
      // @ts-ignore
      this[funcName]();
      console.log(count);
      if (count < 0) {
        this.running = false;
        return true;
      }
      return this.run(funcName, count - 1);
    }, RUN_SPEED);
  }
}

class DistortShape extends DistortNode<ShapeNode> {
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
  rotate() {
    this.node.rotation = this.node.rotation + this.scaleFactor / 2;
  }
}

class DistortText extends DistortNode<TextNode> {
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
    const charLength = this.node.characters.length;
    const randomPos = Math.floor(Math.random() * charLength);
    const randomChar = getRandomAlphanumeric();
    this.node.deleteCharacters(randomPos, randomPos + 1);
    this.node.insertCharacters(randomPos , randomChar);
  }
}

const runDistortion = (shape: DistortNode<SceneNode>): void => {
  shape.running = true;
  let countdown = Math.ceil(Math.random() * TIME_LENGTH);
  const interval = setInterval(() => {
      if (shape instanceof DistortShape) {
        shape.move();
        shape.color();
        shape.rotate();
      }
      if (shape instanceof DistortText) {
        shape.move();
        shape.color();
        if (Math.random() > 0.5) shape.randomCharacter();
      }
      countdown--;
      if (countdown <= 0) {
        clearInterval(interval);
        shape.reset();
        shape.running = false;
      }
  }, DISTORT_SPEED);
};

const detach = (instance: InstanceNode) => {
  if (instance.children) {
    instance.children.forEach(child => {
        if (child.type === "INSTANCE") return detach(child);
      })
  }
  if (!instance.removed) instance.detachInstance();
}

const supportedShapes = ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR"];
export default async function () {
  const currentPage = figma.currentPage;
  let nodes = currentPage.findAll() as SceneNode[];
  const shapes: DistortNode<SceneNode>[] = [];
  const docFonts: Set<FontName> = new Set<FontName>();

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
  })

  await Promise.all(Array.from(docFonts.entries()).map(([font]: [FontName, FontName]) => {
    return figma.loadFontAsync(font);
  }));

  setInterval(() => {
    let index = Math.floor(Math.random() * shapes.length);
    // runDistortion(shapes[index]);
    let shape = shapes[index];
    shape.run("move", 10);
  }, 1000);
}
