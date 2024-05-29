/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

"use strict";

import TextEditorImpl from './new_editor/TextEditor';
import textLayoutImpl from './new_editor/TextLayout';

export function setContent(editor, newContent, options) {
  return editor.setContent(newContent, options);
}

export function getContent(editor) {
  return editor.getContent();
}

export function layoutFromContent(content, options) {
  return textLayout.layoutFromContent(content, options);
}

export function layoutFromElement(element) {
  return textLayout.layoutFromElement(element);
}

export function layoutFromEditor(editor) {
  return textLayout.layoutFromElement(editor.element);
}

export const TextEditor = TextEditorImpl
export const textLayout = textLayoutImpl

export default {
  TextEditor,
  textLayout,
  getContent,
  setContent,
  layoutFromContent,
  layoutFromEditor,
  layoutFromElement
}
