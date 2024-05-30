export function insertText(editor, event) {
  console.log(event)
  if (event.type !== 'beforeinput') return;
  /**
   * @type {Range}
   */
  const range = editor.selection.getRangeAt(0);
  if (editor.selection.isCollapsed) {
    const caretNode = editor.selection.anchorNode;
    console.log('caretNode', caretNode, 'caretOffset', editor.selection.anchorOffset)
    const needsBlock = (caretNode.nodeType === Node.ELEMENT_NODE && 'root' in caretNode.dataset)
                  || (caretNode.nodeType === Node.TEXT_NODE && 'root' in caretNode.parentNode.dataset);
    console.log('needsBlock', needsBlock)
    if (needsBlock) {
      event.preventDefault();
      const newBlock = editor.createBlock(event.data);
      console.log('newBlock', newBlock);
      const newText = newBlock.querySelector('[data-text]').firstChild;
      range.insertNode(newBlock);
      range.selectNode(newText);
      range.collapse(false);
    }
  } else {
    // TODO: Modificar bloques con texto seleccionado.
  }
}
