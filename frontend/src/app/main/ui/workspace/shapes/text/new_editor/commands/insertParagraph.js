export function insertParagraph(editor, event) {
  if (event.type === 'beforeinput') return;

  editor.fixPreviousParagraph();
  editor.fixCurrentParagraph();
}
