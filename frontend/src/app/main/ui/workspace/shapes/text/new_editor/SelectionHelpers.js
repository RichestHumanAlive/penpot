/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

import { ContentType } from './Content';

const MAX_ITERATIONS = 5

export function findReverse(startNode, predicate, options) {
  const maxIterations = options?.maxIterations || MAX_ITERATIONS
  let iterations = 0
  let currentNode = startNode
  while (currentNode && iterations < maxIterations) {
    if (predicate(currentNode)) {
      return currentNode;
    }
    iterations++
    currentNode = currentNode.parentNode
  }
  return null
}

export function pathReverse(startNode, predicate, options) {
  const maxIterations = options?.maxIterations || MAX_ITERATIONS
  const path = []
  let currentNode = startNode
  while (currentNode && iterations < maxIterations) {
    path.push(currentNode)
    if (predicate(currentNode)) {
      return path
    }
    iterations++
    currentNode = currentNode.parentNode
  }
  return null
}

export function findRootFromNode(node) {
  return findReverse(node, (node) => node?.dataset?.itype === ContentType.ROOT);
}

export function findParagraphFromNode(node) {
  return findReverse(node, (node) => node?.dataset?.itype === ContentType.PARAGRAPH);
}

export function findInlineFromNode(node) {
  return findReverse(node, (node) => node?.dataset?.itype === ContentType.INLINE);
}

export function findRootFromSelection(selection, node = 'anchor') {
  return findRootFromNode(node === 'focus' ? selection.focusNode : selection.anchorNode);
}

export function findParagraphFromSelection(selection, node = 'anchor') {
  return findParagraphFromNode(node === 'focus' ? selection.focusNode :selection.anchorNode);
}

export function findInlineFromSelection(selection, node = 'anchor') {
  return findInlineFromNode(node === 'focus' ? selection.focusNode : selection.anchorNode);
}

export function pathFromSelection(selection) {
  return pathReverse(selection.anchorNode, (node) => node?.dataset?.itype === ContentType.ROOT)
}

export function isSameParagraph(selection) {
  return findParagraphFromNode(selection.anchorNode) === findParagraphFromNode(selection.focusNode);
}

export function isSameInline(selection) {
  return findInlineFromNode(selection.anchorNode) === findInlineFromNode(selection.focusNode);
}

/**
 * Returns true if the current `anchorNode` is inside.
 *
 * @param {Selection} selection
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isInside(selection, element) {
  return element.contains(selection.anchorNode);
}

/**
 * Returns true if the current `anchorNode` is outside.
 *
 * @param {Selection} selection
 * @param {HTMLElement} element
 * @returns {boolean}
 */
export function isOutside(selection, element) {
  return !isInside(selection, element);
}

/**
 * Returns true if the selection `anchorNode` is not in a TextNode.
 *
 * @param {Selection} selection
 * @returns {boolean}
 */
export function isUnanchored(selection) {
  return !selection.anchorNode
      || !selection.anchorNode.nodeType !== Node.TEXT_NODE;
}

/**
 * Returns the caret position from the coordinates.
 *
 * @param {number} x
 * @param {number} y
 * @returns {CaretPosition}
 */
export function caretFromPoint(x, y) {
  if ("caretPositionFromPoint" in document) {
    return document.caretPositionFromPoint(x, y);
  } else if ("caretRangeFromPoint" in document) {
    const caretRange = document.caretRangeFromPoint(x, y);
    return {
      offsetNode: caretRange.anchorNode,
      offset: caretRange.anchorOffset,
      getClientRect() {
        return caretRange.getBoundingClientRect();
      },
    };
  } else {
    const selection = document.getSelection();
    const range = selection.getRangeAt(0);
    const clonedRange = range.cloneRange();
    if (!clonedRange.collapsed) {
      clonedRange.collapse();
    }
    return {
      offsetNode: clonedRange.anchorNode,
      offset: clonedRange.anchorOffset,
      getClientRect() {
        return clonedRange.getBoundingClientRect();
      },
    };
  }
}

export default {
  findInlineFromSelection,
  findParagraphFromSelection,
  findRootFromSelection,
  pathFromSelection
}
