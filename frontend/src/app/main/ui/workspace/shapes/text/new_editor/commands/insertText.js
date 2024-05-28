export function insertText(editor, event) {
  if (event.type !== 'beforeinput') return
  /**
   * @type {Range}
   */
  const range = editor.selection.getRangeAt(0)
  if (editor.selection.isCollapsed) {
    const caretNode = editor.selection.anchorNode
    // Si el nodo es un nodo de texto y es hijo del elemento editor
    // o el nodo es directamente el nodo del editor, entonces creamos
    // un nuevo <div> (un nuevo bloque contenedor) e insertamos ahí el texto.
    if (caretNode.nodeType === Node.TEXT_NODE) {
      if ('root' in caretNode.parentNode.dataset) {
        event.preventDefault();
        const newBlock = document.createElement("div");
        newBlock.dataset.key = editor.getRandomKey();
        newBlock.dataset.block = true;
        const newInline = document.createElement("span");
        newInline.dataset.text = true;
        const newText = document.createTextNode(event.data);
        newBlock.append(newInline);
        newInline.append(newText);
        range.insertNode(newBlock);
        range.selectNode(newText);
        range.collapse(false);
      }
    }
  }
}
