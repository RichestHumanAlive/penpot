import clipboard from "./clipboard/index.js";
import commands from "./commands/index.js";
import ChangeController from './ChangeController.js';
import ContentValidation from './ContentValidation.js';
import ContentTransform from './ContentTransform.js';

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

  $createElement(tag, attribs, children) {
    const element = document.createElement(tag)
    if (attribs) {
      for (const [name, value] of Object.entries(attribs)) {
        if (name === 'style') {
          for (const [styleName, styleValue] of Object.entries(value)) {
            element.style[styleName] = styleValue
          }
        } else if (name === 'dataset') {
          for (const [dataName, dataValue] of Object.entries(value)) {
            element.dataset[dataName] = dataValue
          }
        } else {
          element.setAttribute(name, value)
        }
      }
    }
    if (Array.isArray(children)) {
      element.append(...children)
    }
    console.log(tag, attribs, children, element)
    return element
  }

  $createRoot() {
    return this.$createElement(
      "div",
      {
        dataset: {
          root: true,
        },
      },
      [this.createBlock('Hello, World!')]
    );
  }

  createBlock(data) {
    return this.$createElement('div', {
      dataset: {
        block: true
      }
    }, [this.createInline(data)])
  }

  createInline(data) {
    return this.$createElement('span', {
      dataset: {
        text: true
      }
    }, [document.createTextNode(data)])
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

    this.$element.appendChild(this.$createRoot());

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
    // console.log(e);
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
    // console.log(e);
    if (e.inputType in commands) {
      const command = commands[e.inputType];
      command(this, e);
    }
  };

  $onInput = (e) => {
    // console.log(e);
    if (e.inputType in commands) {
      const command = commands[e.inputType];
      command(this, e);
      this.$changeController.notifyDebounced();
    }
  };

  $onPaste = (e) => {
    // console.log(e);
    clipboard.paste(this, e);
  };

  $onCopy = (e) => {
    // console.log(e);
    clipboard.copy(this, e);
  };

  $onCut = (e) => {
    // console.log(e);
    clipboard.cut(this, e);
  };

  $onFocus = (e) => {
    // console.log(e);
    document.addEventListener("selectionchange", this.$onSelectionChange);
    this.$selection = document.getSelection();
  };

  $onBlur = (e) => {
    // console.log(e);
    document.removeEventListener("selectionchange", this.$onSelectionChange);
    this.$changeController.notifyImmediately();
  };

  $onKeyPress = (e) => {
    // console.log(e);
  };
  $onKeyDown = (e) => {
    // console.log(e);
  };
  $onKeyUp = (e) => {
    // console.log(e);
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

  /**
   *
   * @param {Content} content
   * @returns {boolean}
   */
  $validateContent(content) {
    return ContentValidation.validateContent(content);
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
    const rootNode = this.$element.querySelector('[data-root]')
                  ?? document.createElement("div");
    ContentTransform.applyRootAttrs(rootNode, root);
    rootNode.dataset.root = true;
    const paragraphSet = root.children[0];
    for (const paragraph of paragraphSet.children) {
      const paragraphNode = document.createElement("div");
      ContentTransform.applyParagraphAttrs(paragraphNode, paragraph);
      paragraphNode.dataset.block = true;
      for (const text of paragraph.children) {
        const textNode = document.createElement("span");
        ContentTransform.applyTextAttrs(textNode, text);
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
        return ContentTransform.extractTextStyles(childInline, {
          text: childInline.textContent,
        });
      });
      return ContentTransform.extractParagraphStyles(childBlock, {
        type: "paragraph",
        children,
      });
    });
    return ContentTransform.extractRootStyles(rootNode, {
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
