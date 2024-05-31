/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

import PositionData from "./PositionData.js";

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
    if (prevLayoutElement && prevLayoutElement !== this.$layoutElement) {
      prevLayoutElement.parentElement.replaceChild(this.$layoutElement, prevLayoutElement);
    } else {
      document.body.appendChild(this.$layoutElement);
    }
  }

  /**
   *
   * @param {Node} node
   * @param {number} start
   * @param {number} end
   * @returns {DOMRect[]}
   */
  $getRangeRects(node, start, end) {
    const range = this.$layoutRange;
    range.setStart(node, start);
    range.setEnd(node, end);
    return [...range.getClientRects()].filter((clientRect) => clientRect.width > 0);
  }

  /**
   *
   * @param {HTMLElement} parent
   * @param {Node} textNode
   * @param {string} textAlign
   * @returns {LayoutNode}
   */
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
   * TODO: Añadir algo como `partialLayoutFromElement` que nos permita
   *       generar la info del layout pero a partir de un nodo y no
   *       de todo el contenido.
   *
   * @param {HTMLElement}
   * @returns {PersistentHashMap<Keyword, *>}
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
      .map(PositionData.mapLayoutNode);
    return positionData;
  }
}

/**
 *
 *
 * @type {TextLayout}
 */
export const textLayout = new TextLayout();

export default textLayout;
