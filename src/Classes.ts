import { changeColor, randomColor } from "./colorTools";
import nerdAlertImg from './images/nerdalert';
import ratImg from './images/ratthew';
import menImg from './images/men';

const RUN_SPEED = 1;

type ShapeNode = RectangleNode | EllipseNode | PolygonNode | StarNode | VectorNode;

  const makeRandom = () => {
    return (Math.random() * 3 - 1);
  }

  const makeRandomPos = () => {
    return (Math.random() * 2);
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
    const images = [nerdAlertImg, ratImg, menImg];
    return images[Math.floor(Math.random() * images.length)];
  }
  
  interface method {
    name: string;
    value: number;
  }
  
 export class DistortNode<T extends SceneNode>{
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
      this.scaleFactor = makeRandomPos();
      this.methods = [];
    }
    getMethod() {
      const total = this.methods.reduce((acc, m) => acc + m.value, 0);
      let randomNum = Math.random();
      // @ts-ignore
      const selected = (this.methods.find(m => {
        randomNum -= m.value / total;
        return randomNum < 0;
      }) as method).name;
      return selected ? selected : "";
    }
    set() {
      this.x = makeRandom();
      this.y = makeRandom();
      this.scaleFactor = makeRandomPos();
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
        if (count < 0 || funcName === "imageFill" || funcName === "clip" || funcName === "layoutMode") {
          this.running = false;
          callback();
          return true;
        }
        return this.run(funcName, count - 1, callback);
      }, RUN_SPEED);
    }
  }
  
  export class DistortShape extends DistortNode<ShapeNode> {
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
  
  export class DistortText extends DistortNode<TextNode> {
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

  export class DistortFrame extends DistortNode<FrameNode> {
    constructor(node: FrameNode) {
        super(node);
        this.methods = [
          {name: "clip", value: 10},
          {name: "resize", value: 10}
        ]
    }
    resize() {
        this.node.resize(this.node.width + Math.abs(this.x), this.node.height + Math.abs(this.y));
    }
    clip() {
        this.node.clipsContent = false;
    }
  }

  export class DistortAutoFrame extends DistortNode<FrameNode> {
    constructor(node: FrameNode) {
        super(node);
        this.methods = [
          {name: "clip", value: 10},
          {name: "resize", value: 5},
          {name: "layoutSize",  value: 10},
          {name: "layoutMode", value: 10}
        ]
    }
    resize() {
        this.node.resize(this.node.width + Math.abs(this.x), this.node.height + Math.abs(this.y));
    }
    clip() {
        this.node.clipsContent = false;
    }
    layoutMode() {
        if (this.node.layoutMode === "HORIZONTAL") this.node.layoutMode = "VERTICAL"
        if (this.node.layoutMode === "VERTICAL") this.node.layoutMode = "HORIZONTAL"
    }
    layoutSize() {
        this.node.itemSpacing += this.scaleFactor;
    }
  }