import {DistortNode, DistortShape, DistortText, DistortFrame, DistortAutoFrame} from './DistortionClasses'
import {detach} from './Utils';

const RUN_TIME = 50;
const RUN_SPEED = 1;

const supportedShapes = ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR"];

type ShapeNode = RectangleNode | EllipseNode | PolygonNode | StarNode | VectorNode;

export default async function () {
  const currentPage = figma.currentPage;
  const shapes: DistortNode<SceneNode>[] = [];
  // @ts-ignore
  const docFonts: Set<FontName> = new Set<FontName>();
  // Get all the nodes on the page
  let nodes = currentPage.findAll() as SceneNode[];
  // Detach all Instance nodes so they can be modified
  nodes.forEach((node) => {
    if (node.type === "INSTANCE" && !node.removed) {
        detach(node);
    }
  });
  // Get all nodes again now that instances are detached
  nodes = currentPage.findAll() as SceneNode[];
  
  nodes.forEach(node => {
    if (supportedShapes.indexOf(node.type) > -1) {
      shapes.push(new DistortShape(node as ShapeNode));
    }
    if (node.type === "TEXT") {
      node.getRangeAllFontNames(0, node.characters.length).forEach(font => docFonts.add(font));
      shapes.push(new DistortText(node as TextNode));
    }
    if (node.type === "FRAME" && node.inferredAutoLayout === null) {
      shapes.push(new DistortFrame(node as FrameNode));
    }
    if (node.type === "FRAME" && node.inferredAutoLayout) {
      shapes.push(new DistortAutoFrame(node as FrameNode));
    }
  });
  // Async load all fonts from the text frames. 
  // TODO: Change from Set to Array to dedupe.
  // @ts-ignore
  await Promise.all(Array.from(docFonts.entries()).map(([font]: [FontName, FontName]) => {
    return figma.loadFontAsync(font);
  }));

  function run() {
    setTimeout(() => {
      let index = Math.floor(Math.random() * shapes.length);
      let shape = shapes[index];
      let methodName = shape.getRandomMethod();
      console.log(shape.node, methodName);
      shape.set();
      shape.run(methodName, Math.ceil(Math.random() * RUN_TIME), RUN_SPEED, run);
    }, 10);
  }
  run();
}
