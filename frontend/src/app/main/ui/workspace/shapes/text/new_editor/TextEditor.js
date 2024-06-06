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
import SelectionHelpers from "./SelectionHelpers.js";

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
    "--typography-ref-file": null,
    "--typography-ref-id": null,
    "--font-id": "sourcesanspro",
    "--fills": [{
      "fill-color": "#000000",
      "fill-opacity": 1
    }],
    "font-family": "sourcesanspro",
    "font-variant": "regular",
    "font-size": "14",
    "font-weight": "400",
    "font-style": "normal",
    "line-height": "1.2",
    "letter-spacing": "0",
    "text-transform": "none",
    "text-align": "left",
    "text-decoration": "none",
  };

  /**
   * @param {Element} element Element that
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
    if (!this.$element.contentEditable) this.$element.contentEditable = true;

    if (this.$element.spellcheck) this.$element.spellcheck = false;

    if (this.$element.autocapitalize) this.$element.autocapitalize = false;

    if (!this.$element.autofocus) this.$element.autofocus = true;

    if (!this.$element.role || this.$element.role !== "textbox") this.$element.role = "textbox";

    if (!this.$element.dataset.editor) this.$element.dataset.editor = true;

    if (this.$element.ariaAutoComplete) this.$element.ariaAutoComplete = false;

    if (!this.$element.ariaMultiLine) this.$element.ariaMultiLine = true;

    this.$root = this.$createRoot();
    this.$element.appendChild(this.$root);
    this.$selection = document.getSelection();

    const textNode = document.createTextNode(' ')
    const inline = this.$root.querySelector('[data-itype="inline"]')
    inline.appendChild(textNode)
    this.$selection.collapse(textNode, 0)

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
    // TODO: Cuando se realice un "selectionchange" lo que podemos
    // hacer es lanzar un evento al componente que nos permita obtener
    // los estilos actuales (en el nodo actual) y usar esos estilos
    // para notificar al menu de tipografías qué es lo que hay actualmente
    // seteado en el editor.
    console.log(e);
    this.$selection = document.getSelection();
    console.log('Range Count', this.$selection.rangeCount);
    // Aquí lidiamos con una selección colapsada
    // también conocida como "caret".
    if (this.$selection.isCollapsed) {
      const caretNode = this.$selection.anchorNode;
      const caretOffset = this.$selection.anchorOffset;
      console.log(caretNode, caretOffset);
      console.log('current paragraph', this.getCurrentParagraph());
      console.log('current inline', this.getCurrentInline());
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
    console.log(this.$selection.anchorNode);
    if (!this.$selection.anchorNode) {
      this.$selectFirstInline();
    }
  };

  $onBlur = (e) => {
    // TODO: Aquí necesitamos controlar el caso en el
    // que tenemos una selección y queremos modificar
    // algo. Deberíamos tener algo como `createFakeSelection`
    // y que esa función pinte la selección falsa directamente
    // en el DOM.
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
    Object.entries(this.$events).forEach(([type, listener]) =>
      this.$element.addEventListener(type, listener),
    );
  }

  $removeEventListeners() {
    Object.entries(this.$events).forEach(([type, listener]) =>
      this.$element.removeEventListener(type, listener),
    );
  }

  $createRoot(styles) {
    return Content.createRootElement(
      // FIXME: Por lo visto cuando creas un párrafo vacío el caret se queda tróspido.
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

  /**
   *
   * @param {PersistentHashMap<Keyword,*>} content
   * @returns {TextEditor}
   */
  setContent(content, options) {
    const newRoot = Content.toDOM(content);
    console.log("root", newRoot);
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

  $selectFirstInline() {
    const inline = this.$element.querySelector('[data-itype="inline"]');
    if (inline.firstChild) {
      if (inline.firstChild.nodeType !== Node.TEXT_NODE) {
        console.warn("Inline should'nt have ELEMENT_NODE descendants");
      }
      this.$selection.collapse(inline.firstChild, 0);
    } else {
      const textNode = document.createTextNode("");
      inline.appendChild(textNode);
      this.$selection.collapse(textNode, 0);
    }
  }

  selectAll() {
    this.$selection = document.getSelection();
    this.$selection.selectAllChildren(this.$element);
    return this;
  }

  getCurrentParagraph() {
    return this.getStartParagraph();
  }

  getCurrentInline() {
    return this.getStartInline();
  }

  getStartParagraph() {
    return SelectionHelpers.findParagraphFromSelection(this.$selection);
  }

  getEndParagraph() {
    return SelectionHelpers.findParagraphFromSelection(this.$selection, 'focus');
  }

  getStartInline() {
    return SelectionHelpers.findInlineFromSelection(this.$selection);
  }

  getEndInline() {
    return SelectionHelpers.findInlineFromSelection(this.$selection, 'focus');
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
