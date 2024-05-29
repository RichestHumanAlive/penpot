/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

"use strict";

import clipboard from "./new_editor/clipboard/index.js";
import commands from "./new_editor/commands/index.js";

const rootAttrs = [
  ["vertical-align", "verticalAlign"]
];

const paragraphAttrs = [
  ["text-align", "textAlign"],
  ["text-direction", "textDirection"],
  ["line-height", "lineHeight"],
  ["font-size", "fontSize", "px"]
];

// [content-node-attr, element-style, style-units]
const textAttrs = [
  ["typography-ref-id", null],
  ["typography-ref-file", null],

  ["font-id", null],
  ["font-variant-id", "fontVariant"],
  ["font-family", "fontFamily"],
  ["font-size", "fontSize", "px"],
  ["font-weight", "fontWeight"],
  ["font-style", "fontStyle"],

  ["line-height", "lineHeight"],
  ["letter-spacing", "letterSpacing"],

  ["text-decoration", "textDecoration"],
  ["text-transform", "textTransform"],

  ["fills", null]
];

function applyStyles(element, contentNode, attrs) {
  const style = element.style;
  for (const [contentAttr, elementStyle, styleUnits] of attrs) {
    if (!(contentAttr in contentNode)) continue;
    const value = styleUnits
      ? `${contentNode[contentAttr]}${styleUnits}`
      : contentNode[contentAttr]
    if (!elementStyle) {
      // TODO: Ver la forma en al que podemos codificar JSON.
      // style.setProperty(`--${contentAttr}`, `"${JSON.stringify(value)}"`)
    } else {
      style.setProperty(contentAttr, value)
    }
  }
}

function applyRootAttrs(element, contentNode) {
  return applyStyles(element, contentNode, rootAttrs);
}

function applyParagraphAttrs(element, contentNode) {
  return applyStyles(element, contentNode, paragraphAttrs);
}

function applyTextAttrs(element, contentNode) {
  return applyStyles(element, contentNode, textAttrs);
}

function extractStyles(element, contentNode, attrs) {
  const style = getComputedStyle(element)
  for (const [contentAttr, elementStyle, styleUnits] of attrs) {
    if (!(elementStyle in element.style)) {
      let value = null
      try {
        // value = JSON.parse(style.getPropertyValue(`--${contentAttr}`))
      } catch (error) {
        console.warn(error)
      }
      contentNode[contentAttr] = value;
      continue;
    }
    const value = styleUnits
      ? style.getPropertyValue(contentAttr).replace(styleUnits, "")
      : style.getPropertyValue(contentAttr);
    if (!value) {
      continue;
    }
    contentNode[contentAttr] = value;
  }
  return contentNode
}

function extractRootStyles(element, contentNode) {
  return extractStyles(element, contentNode, rootAttrs);
}

function extractParagraphStyles(element, contentNode) {
  return extractStyles(element, contentNode, paragraphAttrs);
}

function extractTextStyles(element, contentNode) {
  return extractStyles(element, contentNode, textAttrs);
}

class Content {
  static validateContent(content) {
    const root = content
    if (!this.validateRoot(root)) {
      return false
    }
    const paragraphSet = root.children[0]
    if (!this.validateParagraphSet(paragraphSet)) {
      return false
    }
    for (const paragraph of paragraphSet.children) {
      if (!this.validateParagraph(paragraph)) {
        return false
      }
    }
    return true
  }

  static validateRoot(root) {
    return root.type === "root"
        && root.children.length === 1
  }

  static validateParagraphSet(paragraphSet) {
    return paragraphSet.type === "paragraph-set"
        && paragraphSet.children.length >= 0
  }

  static validateParagraph(paragraph) {
    return paragraph.type === "paragraph"
  }

  static validateText(text) {
    return "text" in text
  }
}

class ChangeController {
  $timeout = null;
  $target = null;
  $time = 1000;
  $hasPendingChanges = false;

  constructor(target, time) {
    if (!(target instanceof EventTarget)) {
      throw new TypeError("Invalid EventTarget");
    }
    this.$target = target;
    if (typeof time === "number" && (!Number.isInteger(time) || time <= 0)) {
      throw new TypeError("Invalid time");
    }
    this.$time = time ?? 500;
  }

  get hasPendingChanges() {
    return this.$hasPendingChanges;
  }

  $onTimeout = () => {
    this.$target.dispatchEvent(new Event("change"));
  }

  notifyDebounced() {
    this.$hasPendingChanges = true;
    clearTimeout(this.$timeout);
    this.$timeout = setTimeout(this.$onTimeout, this.$time);
  }

  notifyImmediately() {
    clearTimeout(this.$timeout);
    this.$onTimeout();
  }
}

/*
class TextLayout {
  constructor() {
    this.$range = document.createRange();
  }

  $getRangeRects(node, start, end) {
    const range = this.$range
    range.setStart(node, start);
    range.setEnd(node, end);
    return [...range.getClientRects()].filter((r) => r.width > 0);
  }

  $layoutTextNodes(parent, textNode, textAlign) {
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
    let safeguard = false;

    while (to < textSize) {
      const rects = this.$getRangeRects(textNode, from, to + 1);
      const splitByWords = textAlign == "justify" && content[to].trim() == "";

      if (rects.length > 1 && safeguard) {
        from++;
        to++;
        safeguard = false;
      } else if (rects.length > 1 || splitByWords) {
        const position = prevRect;

        result.push({
          node: parent,
          position: position,
          text: current,
        });

        if (splitByWords) {
          to++;
        }

        from = to;
        current = "";
        safeguard = true;
      } else {
        prevRect = rects[0];
        current += content[to];
        to = to + 1;
        safeguard = false;
      }
    }

    // to == textSize
    const rects = this.$getRangeRects(textNode, from, to);
    result.push({
      node: parent,
      position: rects[0],
      text: current
    });
    return result;
  }

  $getParentWithSelector(node, selector) {
    let current = node
    while (current !== null) {
      if (current.matches(selector)) {
        return current
      }
      current = current.parentElement
    }
    return null
  }

  layout(textEditor) {
    const clonedNode = textEditor.element.cloneNode(true);
    const textNodes = clonedNode.querySelectorAll('[data-text]');
    const root = clonedNode.querySelector('[data-root]');
    return textNodes.map((textNode) => {
      const paragraph = this.$getParentWithSelector(textNode, '[data-block]');
      const textNodeStyles = window.getComputedStyle(textNode);
      const direction = textNodeStyles.direction;
      const paragraphStyles = window.getComputedStyle(paragraph);
      const textAlign = paragraphStyles.textAlign;
      for (const childNode of textNode.childNodes) {
        this.$layoutTextNodes(textNode, direction);
      }
    })
  }
}
*/

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
    return this.$setLayoutSize(
      element.parentElement.clientWidth,
      element.parentElement.clientHeight
    )
  }

  $setLayoutSize(width, height) {
    this.$layoutElement.style.width = `${width}px`;
    this.$layoutElement.style.height = `${height}px`;
    return this
  }

  $setupLayout() {
    this.$layoutElement.dataset.layout = true;
    this.$layoutElement.style.pointerEvents = "none";
    this.$layoutElement.style.left = "0px";
    this.$layoutElement.style.top = "0px";
    this.$layoutElement.style.position = "absolute";

    const prevLayoutElement = document.querySelector("[data-layout]");
    if (prevLayoutElement) {
      prevLayoutElement.parentElement.replaceChild(
        this.$layoutElement,
        prevLayoutElement
      );
    } else {
      document.body.appendChild(this.$layoutElement)
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
        console.log("prevRect", rect);
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
    console.log(rects[0]);
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
  layoutFromContent(content, options) {

  }

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
    this.$setLayoutSizeFromElement(element)
    console.log("Do the layout!");
    this.$layoutElement.replaceChildren(element.cloneNode(true));
    console.log(this.$layoutElement);
    const positionData = Array.from(this.$layoutElement.querySelectorAll("[data-text]"))
      .flatMap((inlineNode) => {
        console.log(inlineNode);
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
    console.log("position-data", positionData);
    return positionData;
  }
}

export class TextEditor extends EventTarget {
  /**
   * @type {HTMLElement}
   */
  $element = null;

  /**
   * @type {Selection}
   */
  $selection = null;

  /**
   * @type {Object<string, Function>}
   */
  $events = null;

  /**
   * @type {ChangeController}
   */
  $changeController = null;

  /**
   *
   * @param {Element} element
   * @param {TextEditorOptions} options
   */
  constructor(element, options) {
    super();

    this.$changeController = new ChangeController(this);
    this.$element = element;
    this.$events = {
      beforeinput: this.$onBeforeInput,
      input: this.$onInput,

      paste: this.$onPaste,
      copy: this.$onCopy,
      cut: this.$onCut,

      focus: this.$onFocus,
      blur: this.$onBlur,

      keypress: this.$onKeyPress,
      keydown: this.$onKeyDown,
      keyup: this.$onKeyUp,
    };
    this.$setup();

    if (options?.autofocus ?? true) {
      this.focus();
    }
    if (options?.autoselect ?? true) {
      this.selectAll();
    }
  }

  get hasFocus() {
    return document.activeElement === this.$element;
  }

  get element() {
    return this.$element;
  }

  get selection() {
    return this.$selection;
  }

  $setup() {
    this.$element.contentEditable = true;
    this.$element.spellcheck = false;
    this.$element.autocapitalize = false;
    this.$element.autofocus = true;
    this.$element.role = "textbox";

    this.$element.ariaAutoComplete = false;
    this.$element.ariaMultiLine = true;

    this.$addEventListeners();
  }

  dispose() {
    if (this.$changeController.hasPendingChanges) {
      this.$changeController.notifyImmediately();
    }
    this.$removeEventListeners();
    this.$element = null;
    this.$changeController = null;
  }

  $onSelectionChange = (e) => {
    console.log(e);
    this.$selection = document.getSelection();
    // Aquí lidiamos con una selección colapsada
    // también conocida como "caret".
    if (this.$selection.isCollapsed) {
      const caretNode = this.$selection.anchorNode;
      const caretOffset = this.$selection.anchorOffset;
      console.log(caretNode, caretOffset);
    } else {
      console.log(this.$selection.anchorNode, this.$selection.anchorOffset);
      console.log(this.$selection.focusNode, this.$selection.focusOffset);
      // Aquí estaríamos hablando de una selección
      // de rango.
      for (let rangeIndex = 0; rangeIndex < this.$selection.rangeCount; rangeIndex++) {
        const range = this.$selection.getRangeAt(rangeIndex);
        console.log(range);
      }
    }
  };

  $onBeforeInput = (e) => {
    console.log(e);
    if (e.inputType in commands) {
      const command = commands[e.inputType];
      command(this, e);
    }
  };

  $onInput = (e) => {
    console.log(e);
    if (e.inputType in commands) {
      const command = commands[e.inputType];
      command(this, e);
      this.$changeController.notifyDebounced();
    }
  };

  $onPaste = (e) => {
    console.log(e);
    clipboard.paste(this, e);
  };

  $onCopy = (e) => {
    console.log(e);
    clipboard.copy(this, e);
  };

  $onCut = (e) => {
    console.log(e);
    clipboard.cut(this, e);
  };

  $onFocus = (e) => {
    console.log(e);
    document.addEventListener("selectionchange", this.$onSelectionChange);
    this.$selection = document.getSelection();
  };

  $onBlur = (e) => {
    console.log(e);
    document.removeEventListener("selectionchange", this.$onSelectionChange);
    this.$changeController.notifyImmediately();
  };

  $onKeyPress = (e) => console.log(e);
  $onKeyDown = (e) => console.log(e);
  $onKeyUp = (e) => console.log(e);

  $addEventListeners() {
    Object.entries(this.$events).forEach(([type, listener]) =>
      this.$element.addEventListener(type, listener),
    );
  }

  $removeEventListeners() {
    Object.entries(this.$events).forEach(([type, listener]) =>
      this.$element.removeEventListener(type, listener),
    );
  }

  /**
   *
   * @param {Content} content
   * @returns {boolean}
   */
  $validateContent(content) {
    return Content.validateContent(content);
  }

  /**
   *
   * @param {Content} content
   */
  setContent(content, options) {
    if (!this.$validateContent(content)) {
      throw new TypeError("Invalid content");
    }
    const root = content;
    const rootNode = document.createElement("div");
    applyRootAttrs(rootNode, root);
    rootNode.dataset.root = true;
    const paragraphSet = root.children[0];
    for (const paragraph of paragraphSet.children) {
      const paragraphNode = document.createElement("div");
      applyParagraphAttrs(paragraphNode, paragraph);
      paragraphNode.dataset.block = true;
      for (const text of paragraph.children) {
        const textNode = document.createElement("span");
        applyTextAttrs(textNode, text);
        textNode.dataset.text = true;
        if (!text.text) {
          textNode.append(document.createElement("br"));
        } else {
          textNode.textContent = text.text;
        }
        paragraphNode.appendChild(textNode);
      }
      rootNode.appendChild(paragraphNode);
    }
    this.$element.replaceChildren(rootNode);
    if (options?.selectAll) {
      this.selectAll();
    }
    return this;
  }

  /**
   *
   * @returns {Content}
   */
  getContent() {
    const rootNode = this.$element.querySelector("[data-root]");
    if (!rootNode) {
      return null;
    }
    const children = Array.from(this.$element.querySelectorAll("[data-block]")).map((childBlock) => {
      const children = Array.from(childBlock.querySelectorAll("[data-text]")).map((childInline) => {
        return extractTextStyles(childInline, {
          text: childInline.textContent,
        });
      });
      return extractParagraphStyles(childBlock, {
        type: "paragraph",
        children,
      });
    });
    return extractRootStyles(rootNode, {
      type: "root",
      children: [
        {
          type: "paragraph-set",
          children,
        },
      ],
    });
  }

  selectAll() {
    const selection = (this.$selection = document.getSelection());
    selection.selectAllChildren(this.$element);
    return this;
  }

  getText() {
    return this.$element.textContent;
  }

  hasText() {
    return !!this.$element.textContent;
  }

  focus() {
    this.$element.focus();
    return this;
  }

  blur() {
    this.$element.blur();
    return this;
  }

  undo() {
    this.$history.undo();
    return this;
  }

  redo() {
    this.$history.redo();
    return this;
  }

  /**
   * Returns a random id.
   *
   * @returns {string}
   */
  getRandomId() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36)
  }
}

export const textLayout = new TextLayout()

export function setContent(editor, newContent, options) {
  return editor.setContent(newContent, options);
}

export function getContent(editor) {
  return editor.getContent();
}

export function layoutFromContent(content, options) {
  return textLayout.layoutFromContent(content, options)
}

export function layoutFromElement(element) {
  return textLayout.layoutFromElement(element)
}

export function layoutFromEditor(editor) {
  return textLayout.layoutFromElement(editor.element)
}

export default {
  TextEditor,
  getContent,
  setContent,
  textLayout,
  layoutFromContent,
  layoutFromElement
}
