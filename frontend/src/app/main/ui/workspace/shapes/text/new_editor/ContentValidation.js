export function validateContent(content) {
  const root = content
  if (!this.validateRoot(root)) {
    return false
  }
  const paragraphSet = root.children[0]
  if (!this.validateParagraphSet(paragraphSet)) {
    return false
  }
  for (const paragraph of paragraphSet.children) {
    if (!this.validateParagraph(paragraph)) {
      return false
    }
  }
  return true
}

export function validateRoot(root) {
  return root.type === "root"
      && root.children.length === 1
}

export function validateParagraphSet(paragraphSet) {
  return paragraphSet.type === "paragraph-set"
      && paragraphSet.children.length >= 0
}

export function validateParagraph(paragraph) {
  return paragraph.type === "paragraph"
}

export function validateText(text) {
  return "text" in text
}

export default {
  validateContent,
  validateRoot,
  validateParagraphSet,
  validateParagraph,
  validateText
}
