import {DistortNode, DistortShape, DistortText, DistortFrame, DistortAutoFrame} from './DistortionClasses'
const TIME_LENGTH = 50;

const supportedShapes = ["RECTANGLE", "ELLIPSE", "POLYGON", "STAR", "VECTOR"];

type ShapeNode = RectangleNode | EllipseNode | PolygonNode | StarNode | VectorNode;

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
  // @ts-ignore
  const docFonts: Set<FontName> = new Set<FontName>();
  
  let nodes = currentPage.findAll() as SceneNode[];
  nodes.forEach((node) => {
    if (node.type === "INSTANCE" && !node.removed) {
        detach(node);
    }
  });

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
  // @ts-ignore
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
