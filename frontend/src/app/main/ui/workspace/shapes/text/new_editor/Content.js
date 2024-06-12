/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

import cljs from "goog:cljs.core";

import Keyword from "./Keyword.js";

export const ContentTag = {
  ROOT: 'div',
  PARAGRAPH: 'div',
  INLINE: 'span'
}

export const ContentType = {
  ROOT: 'root',
  PARAGRAPH_SET: 'paragraph-set',
  PARAGRAPH: 'paragraph',
  INLINE: 'inline',
}

export const rootAttrs = [["vertical-align", "vertical-align"]];

export const paragraphAttrs = [
  [Keyword.TEXT_ALIGN, "text-align"],
  [Keyword.DIRECTION, "direction"],
  [Keyword.LINE_HEIGHT, "line-height"],
  [Keyword.FONT_SIZE, "font-size", "px"],
];

export const inlineAttrs = [
  [Keyword.TYPOGRAPHY_REF_ID, "--typography-ref-id"],
  [Keyword.TYPOGRAPHY_REF_FILE, "--typography-ref-file"],

  [Keyword.FONT_ID, "--font-id"],
  [Keyword.FONT_VARIANT_ID, "font-variant"],
  [Keyword.FONT_FAMILY, "font-family"],
  [Keyword.FONT_SIZE, "font-size", "px"],
  [Keyword.FONT_WEIGHT, "font-weight"],
  [Keyword.FONT_STYLE, "font-style"],

  [Keyword.LINE_HEIGHT, "line-height"],
  [Keyword.LETTER_SPACING, "letter-spacing"],

  [Keyword.TEXT_DECORATION, "text-decoration"],
  [Keyword.TEXT_TRANSFORM, "text-transform"],

  [Keyword.FILLS, "--fills"],
];

/**
 *
 * @param {} fills
 * @returns {PersistentVector<PersistentHashMap<Keyword, *>>}
 */
export function mapStyleFills(fills) {
  if (Array.isArray(fills)) {
    return cljs.PersistentVector.fromArray(
      fills.map((fill) => {
        return cljs.PersistentHashMap.fromArrays(
          [Keyword.FILL_COLOR, Keyword.FILL_OPACITY],
          [fill["fill-color"], fill["fill-opacity"]],
        );
      }),
    );
  }
  return null
}

/**
 * Extracts style from style declaration.
 *
 * @param {CSSStyleDeclaration} style
 * @param {string} styleName
 * @param {string} [styleUnits]
 * @returns {string}
 */
export function extractStyleValue(style, styleName, styleUnits) {
  const styleValue = styleUnits
    ? style.getPropertyValue(styleName).replace(styleUnits, "")
    : style.getPropertyValue(styleName);
  if (styleName.startsWith('--')) {
    try {
      const stylePayload = JSON.parse(styleValue)
      if (styleName === '--fills') {
        return mapStyleFills(stylePayload)
      } else if (stylePayload === 'null') {
        return null
      }
      return stylePayload
    } catch (error) {
      return null
    }
  }
  return styleValue
}

/**
 *
 * @param {HTMLElement} element
 * @param {ContentNodeAttributes} attrs
 * @returns {Map<cljs.keyword, *>}
 */
export function getStyleMap(element, attrs) {
  const style = getComputedStyle(element);
  const styleMap = new Map();
  for (const [contentAttr, styleName, styleUnits] of attrs) {
    const value = extractStyleValue(style, styleName, styleUnits);
    styleMap.set(contentAttr, value);
  }
  return styleMap
}

/**
 * Extracts styles from an HTMLElement.
 *
 * @param {HTMLElement} element
 * @param {ContentNodeAttributes} attrs
 * @returns {[cljs.keyword[], any[]]}
 */
export function extractStyles(element, attrs) {
  const styleMap = getStyleMap(element, attrs)
  return [Array.from(styleMap.keys()), Array.from(styleMap.values())];
}

/**
 *
 * @param {ContentRoot} element
 * @returns {[cljs.keyword[], any[]]}
 */
export function extractRootStyles(element) {
  return extractStyles(element, rootAttrs);
}

/**
 *
 * @param {ContentParagraph} element
 * @returns {[cljs.keyword[], any[]]}
 */
export function extractParagraphStyles(element) {
  return extractStyles(element, paragraphAttrs);
}

/**
 *
 * @param {HTMLElement} element
 * @returns {[cljs.keyword[], any[]]}
 */
export function extractInlineStyles(element) {
  return extractStyles(element, inlineAttrs);
}

/**
 *
 * @param {HTMLElement} element
 * @returns {Object}
 */
export function getParagraphStyles(element) {
  return getStyleMap(element, paragraphAttrs);
}

/**
 *
 * @param {HTMLElement} element
 * @returns {Object}
 */
export function getInlineStyles(element) {
  return getStyleMap(element, inlineAttrs);
}

/**
 * Sets attributes of an HTMLElement.
 *
 * @param {HTMLElement} element
 * @param {string} name
 * @param {*} value
 * @returns {HTMLElement}
 */
export function setAttribute(element, name, value) {
  if (name === "style" && value) {
    for (const [styleName, styleValue] of Object.entries(value)) {
      let propertyValue = styleValue
      if (styleName.startsWith("--")) {
        propertyValue = JSON.stringify(styleValue);
      }
      element.style.setProperty(styleName, propertyValue);
    }
  } else if (name === "dataset" && value) {
    for (const [dataName, dataValue] of Object.entries(value)) {
      element.dataset[dataName] = dataValue;
    }
  } else if (value) {
    element.setAttribute(name, value);
  }
  return element;
}

/**
 *
 * @param {Node} node
 * @param {number} type
 * @param  {...any} args
 * @returns {boolean}
 */
export function isNode(node, type, ...args) {
  if (node.nodeType !== type) {
    return false;
  }
  switch (type) {
    case Node.ELEMENT_NODE:
      const [name] = args
      if (node.nodeName !== name) {
        return false
      }
      return true

    case Node.TEXT_NODE:
      if (args.length > 0) {
        const [text] = args
        if (node.wholeText !== text) {
          return false
        }
      }
      return true
  }
}

/**
 * Creates a new element.
 *
 * @param {string} tag
 * @param {object} attribs
 * @param {Array<HTMLElement>} children
 * @param {object} options
 * @returns {HTMLElement}
 */
export function createElement(tag, attribs, children, options) {
  const element = document.createElement(tag);
  if (attribs) {
    for (const [name, value] of Object.entries(attribs)) {
      setAttribute(element, name, value);
    }
  }
  if (Array.isArray(children)) {
    element.append(...children);
    if (options?.normalize) {
      element.normalize();
    }
  }
  return element;
}

/**
 * Creates a new element style from a ContentNode
 *
 * @param {ContentNodeAttributes} attrs
 * @param {ContentNode} contentNode
 * @returns {ElementStyle}
 */
export function createElementStyleFromContentNode(attrs, contentNode) {
  const style = {};
  for (const [contentAttr, elementStyle, styleUnits] of attrs) {
    if (hasKey(contentNode, contentAttr)) {
      const value = getValue(contentNode, contentAttr);
      const valueUnits = styleUnits ? styleUnits : '';
      style[elementStyle] = `${value}${valueUnits}`;
    }
  }
  return style;
}

/**
 * Creates a new ElementStyle from a ContentRoot
 *
 * @param {ContentRoot} root
 * @returns {ElementStyle}
 */
export function createRootElementStyleFromContentNode(root) {
  return createElementStyleFromContentNode(rootAttrs, root)
}

/**
 * Creates a new HTMLElement for a root node.
 *
 * @param {Array<HTMLElement>} children
 * @param {object} styles
 * @returns {HTMLElement}
 */
export function createRootElement(children, styles) {
  return createElement(ContentTag.ROOT, {
    dataset: {
      itype: ContentType.ROOT
    },
    style: styles
  }, children);
}

/**
 * Returns a root HTMLElement from a ContentNode.
 *
 * @param {ContentRoot} root
 * @returns {HTMLElement}
 */
export function createRootElementFromContentNode(root) {
  return createRootElement([], createRootElementStyleFromContentNode(root));
}

/**
 *
 * @param {ContentNodeAttributes} attrs
 * @param {TextEditorDefaults} defaults
 * @param {TextEditorStyles} styles
 * @returns {ElementStyle}
 */
export function createElementStyleFromDefaults(attrs, defaults, styles) {
  const style = {}
  for (const [, elementStyle] of attrs) {
    let styleValue = styles?.[elementStyle] ?? defaults?.[elementStyle];
    if (elementStyle.startsWith('--')) {
      styleValue = cljs.clj__GT_js(styleValue);
    }
    style[elementStyle] = styleValue
  }
  return style
}

/**
 *
 * @param {TextEditorDefaults} defaults
 * @param {TextEditorStyles} styles
 * @returns {ElementStyle}
 */
export function createRootElementStyleFromDefaults(defaults, styles) {
  return createElementStyleFromDefaults(rootAttrs, defaults, styles)
}

/**
 *
 * @param {TextEditorDefaults} defaults
 * @param {TextEditorStyles} styles
 * @returns {ElementStyle}
 */
export function createParagraphElementStyleFromDefaults(defaults, styles) {
  return createElementStyleFromDefaults(paragraphAttrs, defaults, styles)
}

/**
 *
 * @param {TextEditorDefaults} defaults
 * @param {TextEditorStyles} styles
 * @returns {ElementStyle}
 */
export function createInlineElementStyleFromDefaults(defaults, styles) {
  return createElementStyleFromDefaults(inlineAttrs, defaults, styles)
}

/**
 * Returns a new object from a content node styles.
 *
 * @param {cljs.PersistentHashMap} paragraphStyles
 * @returns {object}
 */
export function createParagraphElementStyleFromContentNode(paragraphStyles) {
  return createElementStyleFromContentNode(paragraphAttrs, paragraphStyles);
}

/**
 *
 * @param {TextEditorDefaults} defaults
 * @param {TextEditorStyles} styles
 * @returns {HTMLElement}
 */
export function createParagraphElement(children, styles) {
  if (children && !Array.isArray(children)) {
    throw new TypeError('Invalid paragraph children, it should be an Array of HTMLElements')
  }
  return createElement(ContentTag.PARAGRAPH, {
    dataset: {
      itype: ContentType.PARAGRAPH
    },
    style: styles
  }, children);
}

/**
 *
 * @param {ContentRoot} root
 * @returns {HTMLElement}
 */
export function createParagraphElementFromContentNode(root) {
  return createParagraphElement([], createParagraphElementStyleFromContentNode(root));
}

/**
 *
 * @param {ContentInline} root
 * @returns {HTMLElement}
 */
export function createInlineElementStyleFromContentNode(inlineStyles) {
  return createElementStyleFromContentNode(inlineAttrs, inlineStyles);
}

/**
 *
 * @param {ContentRoot} root
 * @returns {HTMLElement}
 */
export function createInlineElement(children, styles) {
  if (!Array.isArray(children)) {
    throw new TypeError('Invalid inline children, it should be an Array of strings')
  }
  if (children.length > 0) {
    const firstChild = children[0]
    if (typeof firstChild !== 'string') {
      if (!isNode(firstChild, Node.ELEMENT_NODE, 'BR')) {
        throw new TypeError('Invalid inlien children, only one element is allowed: <br>')
      }
    } else {
      if (!children.every(child => typeof child === 'string')) {
        throw new TypeError('Invalid inline children, some children aren\'t strings')
      }
    }
  }
  return createElement(ContentTag.INLINE, {
    dataset: {
      itype: ContentType.INLINE
    },
    style: styles
  }, children.map((child) => {
    if (typeof child === 'string') {
      return document.createTextNode(child)
    }
    return child
  }));
}

/**
 *
 * @param {ContentInline} inline
 * @returns {HTMLElement}
 */
export function createInlineElementFromContentNode(inline) {
  const text = getValue(inline, Keyword.TEXT);
  if (text === '\n') {
    return createInlineElement(
      [createElement('br')],
      createInlineElementStyleFromContentNode(inline)
    )
  }
  return createInlineElement(
    [text],
    createInlineElementStyleFromContentNode(inline)
  )
}

/**
 * Returns true if a ContentNode is a ClojureScript IMap
 *
 * @param {ContentNode} contentNode
 * @returns {boolean}
 */
export function isMap(contentNode) {
  return cljs.map_QMARK_(contentNode);
}

/**
 * Returns true if a ContentNode has an especific type
 *
 * @param {ContentNode} contentNode
 * @param {string} expectedType
 * @returns {boolean}
 */
export function hasType(contentNode, expectedType) {
  return cljs.get(contentNode, Keyword.TYPE) === expectedType;
}

/**
 * Returns the ContentNode children.
 *
 * @param {ContentNode} contentNode
 * @returns {cljs.PersistentVector}
 */
export function getChildren(contentNode) {
  return cljs.get(contentNode, Keyword.CHILDREN);
}

/**
 * Iterates through ContentNode children.
 *
 * @param {ContentNode} contentNode
 * @returns {Generator<ContentNode>}
 */
export function * childrenOf(contentNode) {
  const children = getChildren(contentNode);
  const count = cljs.count(children);
  for (let index = 0; index < count; index++) {
    yield cljs.nth(children, index);
  }
}

/**
 * Returns the first child of a ContentNode.
 *
 * @param {ContentNode} contentNode
 * @returns {ContentNode}
 */
export function getFirstChild(contentNode) {
  return cljs.first(getChildren(contentNode))
}

/**
 * Returns true if has exactly the amount of specified children.
 *
 * @param {ContentNode} contentNode
 * @param {number} expectedAmount
 * @returns {boolean}
 */
export function hasExactlyChildren(contentNode, expectedAmount) {
  const children = getChildren(contentNode);
  return cljs.count(children) === expectedAmount;
}

/**
 * Returns true if has at least the amount of specified children.
 *
 * @param {ContentNode} contentNode
 * @param {number} expectedAmount
 * @returns {boolean}
 */
export function hasAtLeastChildren(contentNode, expectedAmount) {
  const children = getChildren(contentNode);
  return cljs.count(children) >= expectedAmount;
}

/**
 * Returns true if has a specific key
 *
 * @param {ContentNode} contentNode
 * @param {cljs.Keyword} key
 * @returns {boolean}
 */
export function hasKey(contentNode, key) {
  return cljs.contains_QMARK_(contentNode, key);
}

/**
 *
 * @param {ContentNode} contentNode
 * @param {cljs.Keyword} key
 * @returns {*}
 */
export function getValue(contentNode, key) {
  return cljs.get(contentNode, key)
}

/**
 * Returns true if the argument is a ContentRoot
 *
 * @param {*} root
 * @returns {[boolean, Error?]}
 */
export function validateRoot(root) {
  if (!isMap(root)) {
    return [false, new Error('Root is not a PersistentHashMap')]
  }
  if (!hasType(root, ContentType.ROOT)) {
    return [false, new Error('Root doesn\'t have type "root"')]
  }
  if (!hasExactlyChildren(root, 1)) {
    return [false, new Error('Root doesn\'t have exactly one child')]
  }
  return [true]
}

/**
 * Returns true if the argument is a ContentParagraphSet
 *
 * @param {*} paragraphSet
 * @returns {[boolean,Error?]}
 */
export function validateParagraphSet(paragraphSet) {
  if (!isMap(paragraphSet)) {
    return [false, new Error('ParagraphSet is not a PersistentHashMap')]
  }
  if (!hasType(paragraphSet, ContentType.PARAGRAPH_SET)) {
    return [false, new Error('ParagraphSet doesn\'t have type "paragraph-set"')]
  }
  if (!hasAtLeastChildren(paragraphSet, 1)) {
    return [false, new Error('ParagraphSet doesn\'t have at least one child')]
  }
  return [true]
}

/**
 * Returns [true] if the argument is a ContentParagraph
 *
 * @param {*} paragraph
 * @returns {[boolean,Error?]}
 */
export function validateParagraph(paragraph) {
  if (!isMap(paragraph)) {
    return [false, new Error('Paragraph is not a PersistentHashMap')]
  }
  if (!hasType(paragraph, ContentType.PARAGRAPH)) {
    return [false, new Error('Paragraph doesn\'t have type "paragraph"')]
  }
  if (!hasAtLeastChildren(paragraph, 1)) {
    return [false, new Error('Paragraph doesn\'t have at least one child')]
  }
  return [true]
}

/**
 * Returns [true] if the argument is a ContentText
 *
 * @param {*} text
 * @returns {[boolean,Error?]}
 */
export function validateText(text) {
  return hasKey(text, Keyword.TEXT);
}

/**
 * Validates content
 *
 * @param {Content} content
 * @returns {[boolean, Error?]}
 */
export function validateContent(content) {
  const root = content;
  if (root === null) {
    return [true]
  }
  const [isValidRoot, rootError] = validateRoot(root)
  if (!isValidRoot) {
    return [false, rootError];
  }
  const paragraphSet = getFirstChild(root);
  const [isValidParagraphSet, paragraphSetError] = validateParagraphSet(paragraphSet)
  if (!isValidParagraphSet) {
    return [false, paragraphSetError];
  }
  for (const paragraph of childrenOf(paragraphSet)) {
    const [isValidParagraph, paragraphError] = validateParagraph(paragraph)
    if (!isValidParagraph) {
      return [false, paragraphError];
    }
  }
  return [true];
}

/**
 * This function transforms any content using the internal Penpot model
 * into a tree of DOM nodes.
 *
 * @param {Content} content
 */
export function toDOM(content) {
  const [isValid, error] = validateContent(content)
  if (!isValid) {
    throw error;
  }
  const root = content;
  const rootNode = createRootElementFromContentNode(root);
  const paragraphSet = getFirstChild(root);
  for (const paragraph of childrenOf(paragraphSet)) {
    const paragraphNode = createParagraphElementFromContentNode(paragraph);
    for (const inline of childrenOf(paragraph)) {
      const inlineNode = createInlineElementFromContentNode(inline);
      paragraphNode.appendChild(inlineNode);
    }
    rootNode.appendChild(paragraphNode);
  }
  return rootNode
}

/**
 * NOTE: This is the equivalent of an `inline` DOM element.
 *
 * @param {string} text
 * @param {[cljs.keyword[], any[]]} styles
 * @returns {ContentText}
 */
export function createText(text, [keys=[], values=[]]) {
  return cljs.PersistentHashMap.fromArrays([
    Keyword.TEXT,
    ...keys
  ], [
    text,
    ...values
  ]);
}

/**
 *
 * @param {Array<ContentText>} children
 * @param {[cljs.keyword[], any[]]} styles
 * @returns {ContentParagraph}
 */
export function createParagraph(children, [keys=[], values=[]]) {
  return cljs.PersistentHashMap.fromArrays([
    Keyword.TYPE,
    Keyword.CHILDREN,
    ...keys
  ], [
    ContentType.PARAGRAPH,
    children,
    ...values
  ]);
}

/**
 *
 * @param {Array<ContentParagraph>} children
 * @param {[cljs.keyword[], any[]]} styles
 * @returns {ContentParagraphSet}
 */
export function createParagraphSet(children, [keys=[], values=[]]) {
  return cljs.PersistentHashMap.fromArrays([
    Keyword.TYPE,
    Keyword.CHILDREN,
    ...keys
  ], [
    ContentType.PARAGRAPH_SET,
    children,
    ...values
  ]);
}

/**
 *
 * @param {Array<ContentParagraphSet>} children
 * @param {[cljs.keyword[], any[]]} styles
 * @returns {ContentRoot}
 */
export function createRoot(children, [keys=[], values=[]]) {
  return cljs.PersistentHashMap.fromArrays([
    Keyword.TYPE,
    Keyword.CHILDREN,
    ...keys
  ], [
    ContentType.ROOT,
    children,
    ...values
  ]);
}

export function isStyleInline(style) {
  return style.display === 'inline'
      || style.display === 'inline-block';
}

export function isStyleParagraph(style) {
  return !isStyleInline(style);
}

export function mapCompatibleStyles(style, attrs) {
  const mappedStyles = {};
  for (const [keyword, styleName] of attrs) {
    const styleValue = style.getPropertyValue(styleName);
    mappedStyles[styleName] = styleValue;
  }
  return mappedStyles;
}

export function mapCompatibleInlineStyles(style) {
  return mapCompatibleStyles(style, inlineAttrs);
}

export function mapCompatibleParagraphStyles() {
  return mapCompatibleStyles(style, paragraphAttrs);
}

/**
 * @param {HTMLElement} root
 * @param {Content}
 */
export function mapContent(root) {
  const nodeIterator = document.createNodeIterator(root, NodeFilter.SHOW_TEXT);
  const fragment = document.createDocumentFragment();

  let currentParagraph = createParagraphElement();
  let currentNode = nodeIterator.nextNode();
  while (currentNode) {
    if (currentNode.wholeText.trim() === '') {
      currentNode = nodeIterator.nextNode();
      continue;
    }

    const parentStyle = window.getComputedStyle(currentNode.parentNode);
    if (isStyleParagraph(parentStyle)) {
      fragment.appendChild(currentParagraph);
      currentParagraph = createParagraphElement(
        undefined,
        mapCompatibleParagraphStyles(parentStyle)
      );
    }

    currentParagraph.appendChild(
      createInlineElement([currentNode.wholeText], mapCompatibleInlineStyles(parentStyle))
    )

    currentNode = nodeIterator.nextNode();
  }
  fragment.appendChild(currentParagraph);
  return fragment;
}

/**
 * Maps a DOM tree into a Penpot content model.
 *
 * @param {HTMLElement} rootNode
 * @returns {Content}
 */
export function fromDOM(rootNode) {
  if (!rootNode) {
    return null;
  }
  const children = cljs.PersistentVector.fromArray(
    Array
      .from(rootNode.querySelectorAll('[data-itype="paragraph"]'))
      .map((childBlock) => {
        const children = cljs.PersistentVector.fromArray(
          Array
            .from(childBlock.querySelectorAll('[data-itype="inline"]'))
            .map((childInline) => {
              const textStyles = extractInlineStyles(childInline);
              if (isNode(childInline.firstChild, Node.ELEMENT_NODE, 'BR')) {
                return createText(
                  '\n',
                  textStyles
                )
              }
              return createText(
                childInline.textContent,
                textStyles
              );
            }),
          false
        );
        const paragraphStyles = extractParagraphStyles(childBlock);
        return createParagraph(
          children,
          paragraphStyles
        );
      }),
    false
  );
  const rootStyles = extractRootStyles(rootNode);
  const root = createRoot(
    cljs.PersistentVector.fromArray([
      createParagraphSet(children, []),
    ]),
    rootStyles
  )
  return root
}

export function fixInline(inline, defaults, styles) {
  inline.childNodes.forEach((childNode) => {
    if (!childNode.nodeType === Node.TEXT_NODE) {
      // TODO: Ver si podemos mapear estos elementos en otros inlines o algo así.
      childNode.remove();
    }
  });
}

/**
 *
 * @param {HTMLElement} paragraph
 * @param {TextEditorStyles} defaults
 * @param {TextEditorStyles} styles
 * @returns {void}
 */
export function fixParagraph(paragraph, defaults, styles) {
  if (paragraph.dataset.itype !== ContentType.PARAGRAPH) {
    throw new Error('Trying to fix an invalid node (not a paragraph)')
  }

  if (paragraph.childNodes.length === 1
   && isNode(paragraph.firstChild, Node.ELEMENT_NODE, "BR")) {
    paragraph.replaceChildren(
      createInlineElement(
        [
          document.createElement("br")
        ],
        createInlineElementStyleFromDefaults(defaults, styles)
      )
    );
  } else if (paragraph.childNodes.length === 1
    && isNode(paragraph.firstChild, Node.TEXT_NODE)) {
    paragraph.replaceChildren(
      createInlineElement(
        [paragraph.firstChild.wholeText],
        createInlineElementStyleFromDefaults(defaults, styles)
      )
    )
  } else {
    paragraph.childNodes.forEach((childNode) => {
      if (
        childNode.nodeType === Node.TEXT_NODE ||
        !isNode(childNode.nodeType, Node.ELEMENT_NODE, "SPAN")
      ) {
        // Remove invalid nodes.
        childNode.remove();
      }
    });
  }
}

/**
 * @typedef {object} TextEditorStyles
 * @property {string} "font-family"
 * @property {string} "font-variant"
 * @property {string} "font-size"
 * @property {string} "font-weight"
 * @property {string} "font-style"
 * @property {string} "text-transform"
 * @property {string} "text-align"
 * @property {string} "text-decoration"
 * @property {string} "line-height"
 * @property {string} "letter-spacing"
 */

/**
 * Returns the defaults
 *
 * @param {cljs.PersistentHashMap} defaults
 * @returns {TextEditorStyles}
 */
export function getDefaults(defaults) {
  return {
    "--typography-ref-file": getValue(defaults, Keyword.TYPOGRAPHY_REF_FILE) ?? null,
    "--typography-ref-id": getValue(defaults, Keyword.TYPOGRAPHY_REF_ID) ?? null,
    "--font-id": getValue(defaults, Keyword.FONT_ID) ?? "sourcesanspro",
    "--fills": getValue(defaults, Keyword.FILLS) ?? [{
      "fill-color": "#000000",
      "fill-opacity": 1
    }],
    "font-family": getValue(defaults, Keyword.FONT_FAMILY) ?? "sourcesanspro",
    "font-variant": getValue(defaults, Keyword.FONT_VARIANT_ID) ?? "regular",
    "font-size": getValue(defaults, Keyword.FONT_SIZE) ?? "14",
    "font-weight": getValue(defaults, Keyword.FONT_WEIGHT) ?? "400",
    "font-style": getValue(defaults, Keyword.FONT_STYLE) ?? "normal",
    "text-transform": getValue(defaults, Keyword.TEXT_TRANSFORM) ?? "none",
    "text-align": getValue(defaults, Keyword.TEXT_ALIGN) ?? "left",
    "text-decoration": getValue(defaults, Keyword.TEXT_DECORATION) ?? "none",
    "line-height": getValue(defaults, Keyword.LINE_HEIGHT) ?? "1.2",
    "letter-spacing": getValue(defaults, Keyword.LETTER_SPACING) ?? "0",
  };
}

export const Content = {
  setAttribute,

  validateContent,
  validateText,
  validateParagraph,
  validateParagraphSet,
  validateRoot,

  extractStyles,
  extractInlineStyles,
  extractParagraphStyles,
  extractRootStyles,

  getParagraphStyles,
  getInlineStyles,

  createElementStyleFromContentNode,
  createRootElementStyleFromContentNode,
  createParagraphElementStyleFromContentNode,
  createInlineElementStyleFromContentNode,

  createElementStyleFromDefaults,
  createRootElementStyleFromDefaults,
  createParagraphElementStyleFromDefaults,
  createInlineElementStyleFromDefaults,

  createElement,
  createRootElement,
  createParagraphElement,
  createInlineElement,

  fixParagraph,

  fromDOM,
  toDOM,

  getDefaults,

  isNode,
};

export default Content;
