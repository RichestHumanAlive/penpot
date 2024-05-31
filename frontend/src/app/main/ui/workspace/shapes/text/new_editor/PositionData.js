/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

import cljs from 'goog:cljs.core'

/**
 * Returns a new function that maps values from a CSSStyleDeclaration.
 *
 * @param {string} styleName
 * @param {string} styleDefault
 * @returns {Function}
 */
function createStyleMapper(styleName, styleDefault) {
  return function styleMap(layoutNode) {
    const value = layoutNode.node.style.getPropertyValue(styleName);
    if (!value && styleDefault) {
      return styleDefault;
    }
    return value;
  };
}

/**
 * Returns a new function that maps values from a DOMRect.
 *
 * @param {string} propertyName
 * @returns {Function}
 */
function createRectMapper(propertyName) {
  return function rectMap(layoutNode) {
    return layoutNode.rect[propertyName];
  };
}

const DEFAULT_FILLS = cljs.PersistentHashMap.fromArrays(
  [cljs.keyword("fill-color"), cljs.keyword("fill-opacity")],
  ["#000000", 1],
);

const LayoutNodeMap = [
  [cljs.keyword("fills"), () => DEFAULT_FILLS],
  [cljs.keyword("text"), (layoutNode) => layoutNode.text],
  [cljs.keyword("direction"), createStyleMapper("text-direction", "ltr")],
  [cljs.keyword("font-family"), createStyleMapper("font-family")],
  [cljs.keyword("font-size"), createStyleMapper("font-size")],
  [cljs.keyword("font-style"), createStyleMapper("font-style")],
  [cljs.keyword("font-weight"), createStyleMapper("font-weight")],
  [cljs.keyword("font-variant"), createStyleMapper("font-variant")],
  [cljs.keyword("text-decoration"), createStyleMapper("text-decoration")],
  [cljs.keyword("text-transform"), createStyleMapper("text-transform")],
  [cljs.keyword("line-height"), createStyleMapper("line-height")],
  [cljs.keyword("letter-spacing"), createStyleMapper("letter-spacing")],
  [cljs.keyword("x"), createRectMapper("x")],
  [cljs.keyword("y"), createRectMapper("y")],
  [cljs.keyword("width"), createRectMapper("width")],
  [cljs.keyword("height"), createRectMapper("height")],
  [cljs.keyword("x1"), createRectMapper("x")],
  [cljs.keyword("y1"), createRectMapper("y")],
  [cljs.keyword("x2"), (layoutNode) => layoutNode.rect.x + layoutNode.rect.width],
  [cljs.keyword("y2"), (layoutNode) => layoutNode.rect.y + layoutNode.rect.height],
];

/**
 * @typedef {object} LayoutNode
 * @property {string} text
 * @property {DOMRect} rect
 * @property {Node} node
 */

/**
 * Maps a LayoutNode returned by the text
 * layout functions into a PersistentHashMap
 * compatible with our ClojureScript functions.
 *
 * @param {LayoutNode} layoutNode
 * @returns {PersistentHashMap<Keyword, *>}
 */
export function mapLayoutNode(layoutNode) {
  return cljs.PersistentHashMap.fromArrays(
    ...LayoutNodeMap.reduce(
      (kvs, [keyword, mapFn]) => {
        kvs[0].push(keyword);
        kvs[1].push(mapFn(layoutNode));
        return kvs;
      },
      [[], []],
    ),
  );
}

export const PositionData = {
  mapLayoutNode
};

export default PositionData
