export function deleteContentBackward(editor, event) {
  if (event.type === 'beforeinput') return;

  editor.fixCurrentParagraph();
}
