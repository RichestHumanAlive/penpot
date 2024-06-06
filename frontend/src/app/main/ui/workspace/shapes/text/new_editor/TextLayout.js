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
  $layoutElement = null; // <div>
  $layoutContainerElement = null; // <foreignObject>
  $layoutRootElement = null; // <svg>

  constructor() {
    this.$layoutRange = document.createRange();
    this.$layoutRootElement = document.querySelector('[data-layout-root]');
    this.$layoutContainerElement = document.querySelector("[data-layout-container]");
    this.$layoutElement = this.$getOrCreate("[data-layout]", () => this.$createLayoutElement());
    this.$setupLayout();
  }

  $createLayoutRoot() {
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.style.position = "fixed";
    svg.style.top = "0px";
    svg.style.left = "0px";
    svg.style.pointerEvents = "none";
    svg.dataset.layoutRoot = true;
    return svg
  }

  $createLayoutContainer() {
    const ns = "http://www.w3.org/2000/svg";
    const foreignObject = document.createElementNS(ns, "foreignObject");
    foreignObject.dataset.layoutContainer = true;
    return foreignObject;
  }

  $createLayoutElement() {
    const element = document.createElement("div");
    element.dataset.layout = true;
    return element;
  }

  $getOrCreate(selector, factory, options) {
    const parentElement = options?.parentElement ?? document;
    const element = parentElement.querySelector(selector);
    if (!element) {
      return factory();
    } else {
      return element;
    }
  }

  /**
   * Sets the layout element size.
   *
   * @param {HTMLElement} element
   * @returns {TextLayout}
   */
  $setLayoutSizeFromElement(element) {
    return this
      .$setLayoutRootSize(element.parentElement.clientWidth, element.parentElement.clientHeight)
      .$setLayoutSize(element.parentElement.clientWidth, element.parentElement.clientHeight);
  }

  $setLayoutRootSize(width, height) {
    this.$layoutRootElement.setAttribute('width', `${width}px`);
    this.$layoutRootElement.setAttribute('height', `${height}px`);
    return this;
  }

  /**
   * Sets the layout size.
   *
   * @param {number} width
   * @param {number} height
   * @returns {TextLayout}
   */
  $setLayoutSize(width, height) {
    this.$layoutElement.style.width = `${width}px`;
    this.$layoutElement.style.height = `${height}px`;
    return this;
  }

  $setupLayout() {
    this.$layoutElement.dataset.layout = true;

    if (!this.$layoutRootElement) {
      this.$layoutRootElement = this.$createLayoutRoot();
      document.body.appendChild(this.$layoutRootElement);
    }

    // If the [data-layout-container] element doesn't exists
    // then we create it and append it to the document.body
    if (!this.$layoutContainerElement) {
      this.$layoutContainerElement = this.$createLayoutContainer();
      this.$layoutRootElement.appendChild(this.$layoutContainerElement);
    }

    // Replaces every children inside the layout container element.
    this.$layoutContainerElement.replaceChildren(this.$layoutElement);
  }

  /**
   * Returns all the range rects.
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
   * Layouts a text node.
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
    // FIXME: No me gusta esta forma de convertir las coordenadas.
    const x = parseFloat(element.dataset.x);
    const y = parseFloat(element.dataset.y);

    this.$setLayoutSizeFromElement(element);

    // TODO: En vez de clonar todo el layout utilizando `element.cloneNode(true)`
    // creo que voy a necesitar atravesar el árbol (¿usando un TreeWalker?)
    // y clonar a mano todo para poder mantener la relación entre los nodos
    // del editor y los nodos del layout.
    this.$layoutElement.replaceChildren(element.cloneNode(true));
    const positionData = Array
      .from(this.$layoutElement.querySelectorAll('[data-itype="inline"]'))
      .flatMap((inlineNode) => {
        const style = window.getComputedStyle(inlineNode.parentElement);
        const textAlign = style.textAlign || "left";
        return Array
          .from(inlineNode.childNodes)
          .flatMap((childNode) =>
            this.$layoutTextNode(inlineNode, childNode, textAlign),
          );
      })
      .filter((layoutNode) => layoutNode.rect)
      .map((layoutNode) => {
        // FIXME: No me gusta esta forma de convertir las coordenadas.
        layoutNode.rect.x += x;
        layoutNode.rect.y += y + layoutNode.rect.height;
        layoutNode.rect.x1 += x;
        layoutNode.rect.y1 += y + layoutNode.rect.height;
        layoutNode.rect.x2 += x;
        layoutNode.rect.y2 += y + layoutNode.rect.height;
        return layoutNode;
      })
      .map(PositionData.mapLayoutNode);
    return positionData;
  }
}

/**
 * Instance of the TextLayout.
 *
 * @type {TextLayout}
 */
export const textLayout = new TextLayout();

export default textLayout;
