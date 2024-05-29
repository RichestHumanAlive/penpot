export class TextLayout {
  $layoutRange = null;
  $layoutElement = null;

  constructor() {
    this.$layoutRange = document.createRange();
    const layoutElement = document.querySelector("[data-layout]");
    if (!layoutElement) {
      this.$layoutElement = document.createElement("div");
    } else {
      this.$layoutElement = layoutElement;
    }
    this.$setupLayout();
  }

  $setLayoutSizeFromElement(element) {
    return this.$setLayoutSize(element.parentElement.clientWidth, element.parentElement.clientHeight);
  }

  $setLayoutSize(width, height) {
    this.$layoutElement.style.width = `${width}px`;
    this.$layoutElement.style.height = `${height}px`;
    return this;
  }

  $setupLayout() {
    this.$layoutElement.dataset.layout = true;
    this.$layoutElement.style.pointerEvents = "none";
    this.$layoutElement.style.left = "0px";
    this.$layoutElement.style.top = "0px";
    this.$layoutElement.style.position = "absolute";

    const prevLayoutElement = document.querySelector("[data-layout]");
    if (prevLayoutElement) {
      prevLayoutElement.parentElement.replaceChild(this.$layoutElement, prevLayoutElement);
    } else {
      document.body.appendChild(this.$layoutElement);
    }
  }

  $getRangeRects(node, start, end) {
    const range = this.$layoutRange;
    range.setStart(node, start);
    range.setEnd(node, end);
    return [...range.getClientRects()].filter((clientRect) => clientRect.width > 0);
  }

  $layoutTextNode(parent, textNode, textAlign) {
    const content = textNode.textContent;
    const textSize = content.length;

    let from = 0;
    let to = 0;
    let current = "";
    let result = [];
    let prevRect = null;

    // This variable is to make sure there are not infinite loops
    // when we don't advance `to` we store true and then force to
    // advance `to` on the next iteration if the condition is true again
    let safeGuard = false;

    while (to < textSize) {
      const rects = this.$getRangeRects(textNode, from, to + 1);
      const splitByWords = textAlign == "justify" && content[to].trim() == "";

      if (rects.length > 1 && safeGuard) {
        from++;
        to++;
        safeGuard = false;
      } else if (rects.length > 1 || splitByWords) {
        const rect = prevRect;
        result.push({
          node: parent,
          rect: rect,
          text: current,
        });

        if (splitByWords) {
          to++;
        }

        from = to;
        current = "";
        safeGuard = true;
      } else {
        prevRect = rects[0];
        current += content[to];
        to = to + 1;
        safeGuard = false;
      }
    }

    // to == textSize
    const rects = this.$getRangeRects(textNode, from, to);
    result.push({
      node: parent,
      rect: rects[0],
      text: current,
    });
    return result;
  }

  /**
   *
   * @param {*} content
   * @param {*} options
   */
  layoutFromContent(content, options) {}

  /**
   * Layouts the text.
   *
   * TODO: Sacar esto de aquí para que el layout se pueda realizar
   *       independientemente del editor de texto.
   *
   * NOTA: Podría tener dos métodos, uno más directo, que utilice
   *       el propio editor de texto, algo como `fastLayout` y otro
   *       más lento que haga el layout a partir de un Content de texto.
   *
   *
   *
   *
   *
   *
   */
  layoutFromElement(element) {
    this.$setLayoutSizeFromElement(element);
    this.$layoutElement.replaceChildren(element.cloneNode(true));
    const positionData = Array.from(this.$layoutElement.querySelectorAll("[data-text]"))
      .flatMap((inlineNode) => {
        const textAlign = inlineNode.parentElement.style.textAlign || "left";
        return Array.from(inlineNode.childNodes).flatMap((childNode) =>
          this.$layoutTextNode(inlineNode, childNode, textAlign),
        );
      })
      .filter((layoutNode) => layoutNode.rect)
      .map((layoutNode) => {
        return {
          direction: layoutNode.node.style.getPropertyValue("text-direction") || "ltr",
          fills: [{ "fill-color": "#000000", "fill-opacity": 1 }],
          fontFamily: layoutNode.node.style.getPropertyValue("font-family"),
          fontSize: layoutNode.node.style.getPropertyValue("font-size"),
          fontStyle: layoutNode.node.style.getPropertyValue("font-style"),
          fontWeight: layoutNode.node.style.getPropertyValue("font-weight"),
          fontVariant: layoutNode.node.style.getPropertyValue("font-variant"),
          lineHeight: layoutNode.node.style.getPropertyValue("line-height"),
          letterSpacing: layoutNode.node.style.getPropertyValue("letter-spacing"),
          text: layoutNode.text,
          textDecoration: layoutNode.node.style.getPropertyValue("text-decoration"),
          textTransform: layoutNode.node.style.getPropertyValue("text-transform"),
          x: layoutNode.rect.x,
          y: layoutNode.rect.y,
          height: layoutNode.rect.height,
          width: layoutNode.rect.width,
          x1: layoutNode.rect.x,
          y1: layoutNode.rect.y,
          x2: layoutNode.rect.x + layoutNode.rect.width,
          y2: layoutNode.rect.y + layoutNode.rect.height,
        };
      });
    return positionData;
  }
}

/**
 *
 *
 * @type {TextLayout}
 */
export const textLayout = new TextLayout();

export default {
  TextLayout,
  textLayout
}
