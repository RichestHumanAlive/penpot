/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

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
