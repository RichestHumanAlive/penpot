/**
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * Copyright (c) KALEIDOS INC
 */

import clipboard from "./clipboard/index.js";
import commands from "./commands/index.js";
import ChangeController from "./ChangeController.js";
import Content from "./Content.js";

/**
 * @typedef {object} TextEditorDefaults
 * @property {}
 */

/**
 * @typedef {object} TextEditorOptions
 * @property {boolean} [autofocus]
 * @property {boolean} [autoselect]
 * @property {TextEditorDefaults} [defaults]
 */

/**
 * TextEditor
 */
export class TextEditor extends EventTarget {
  /**
   * @type {HTMLElement}
   */
  $element = null;

  /**
   * @type {HTMLElement}
   */
  $root = null;

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
   * @type {TextEditorDefaults}
   */
  $defaults = {
    fontFamily: "sourcesanspro",
    fontVariant: "regular",
    fontSize: "14",
    fontWeight: "400",
    fontStyle: "normal",
    lineHeight: "1.2",
    letterSpacing: "0",
    textTransform: "none",
    textAlign: "left",
    textDecoration: "none",
  };

  /**
   *
   * @param {Element} element
   * @param {TextEditorOptions} [options]
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

    if (options?.defaults) {
      console.log("Setting editor defaults", Content.getDefaults(options.defaults));
      this.$defaults = Content.getDefaults(options.defaults);
    }

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

  $createRoot(styles) {
    return Content.createRootElement(
      [this.createParagraph("")],
      Content.createRootElementStyleFromDefaults(this.$defaults, styles),
    );
  }

  createParagraph(data = "", styles) {
    return Content.createParagraphElement(
      [this.createInline(data)],
      Content.createParagraphElementStyleFromDefaults(this.$defaults, styles),
    );
  }

  createInline(data, styles) {
    return Content.createInlineElement(
      [data],
      Content.createInlineElementStyleFromDefaults(this.$defaults, styles),
    );
  }

  $setup() {
    this.$element.contentEditable = true;
    this.$element.spellcheck = false;
    this.$element.autocapitalize = false;
    this.$element.autofocus = true;
    this.$element.role = "textbox";
    this.$element.dataset.editor = true;

    this.$element.ariaAutoComplete = false;
    this.$element.ariaMultiLine = true;

    this.$root = this.$createRoot();
    this.$element.appendChild(this.$root);

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
      // console.log(caretNode, caretOffset);
    } else {
      // console.log(this.$selection.anchorNode, this.$selection.anchorOffset);
      // console.log(this.$selection.focusNode, this.$selection.focusOffset);
      // Aquí estaríamos hablando de una selección
      // de rango.
      for (let rangeIndex = 0; rangeIndex < this.$selection.rangeCount; rangeIndex++) {
        const range = this.$selection.getRangeAt(rangeIndex);
        // console.log(range);
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
    /*
    console.log(this.$selection.anchorNode);
    if (!this.$selection.anchorNode) {
      const firstText = this.$element.querySelector('[data-inline]').firstChild
      this.$selection.collapse(firstText, 0);
      console.log(this.$selection.anchorNode, this.$selection.anchorOffset);
    }
    */
  };

  $onBlur = (e) => {
    console.log(e);
    document.removeEventListener("selectionchange", this.$onSelectionChange);
    this.$changeController.notifyImmediately();
  };

  $onKeyPress = (e) => {
    console.log(e);
  };

  $onKeyDown = (e) => {
    console.log(e);
  };

  $onKeyUp = (e) => {
    console.log(e);
  };

  $addEventListeners() {
    Object
      .entries(this.$events)
      .forEach(([type, listener]) => this.$element.addEventListener(type, listener));
  }

  $removeEventListeners() {
    Object
      .entries(this.$events)
      .forEach(([type, listener]) => this.$element.removeEventListener(type, listener));
  }

  /**
   *
   * @param {PersistentHashMap<Keyword,*>} content
   * @returns {TextEditor}
   */
  setContent(content, options) {
    const newRoot = Content.toDOM(content);
    console.log(newRoot);
    this.$root = newRoot;
    this.$element.replaceChildren(newRoot);
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
    return Content.fromDOM(this.$root);
  }

  selectAll() {
    this.$selection = document.getSelection();
    this.$selection.selectAllChildren(this.$element);
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

  /**
   * Returns a random id.
   *
   * @returns {string}
   */
  getRandomId() {
    return Math.floor(Math.random() * Number.MAX_SAFE_INTEGER).toString(36);
  }
}

export default TextEditor;
