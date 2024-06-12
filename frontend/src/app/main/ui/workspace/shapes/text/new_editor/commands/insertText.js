export function insertText(editor, event) {
  console.log(event)
  if (event.type === 'beforeinput') {
    /**
     * @type {Range}
     */
    const range = editor.selection.getRangeAt(0);
    if (editor.selection.isCollapsed) {
      const caretNode = editor.selection.anchorNode;
      const needsParagraph =
        (caretNode.nodeType === Node.ELEMENT_NODE && "root" in caretNode.dataset) ||
        (caretNode.nodeType === Node.TEXT_NODE && "root" in caretNode.parentNode.dataset);
      console.log("needsParagraph", needsParagraph);
      if (needsParagraph) {
        event.preventDefault();
        const newParagraph = editor.createParagraph(event.data);
        console.log("newParagraph", newParagraph);
        const newText = newParagraph.querySelector("[data-inline]").firstChild;
        range.insertNode(newParagraph);
        range.selectNode(newText);
        range.collapse(false);
      }
    }
  } else if (event.type === 'input') {
    // editor.fixPreviousParagraph();
    // editor.fixCurrentParagraph();
  }
}
