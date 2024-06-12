export function deleteContentForward(editor, event) {
  if (event.type === "beforeinput") return;

  editor.fixCurrentParagraph();
}
