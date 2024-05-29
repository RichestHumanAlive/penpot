export const rootAttrs = [
  ["vertical-align", "verticalAlign"]
];

export const paragraphAttrs = [
  ["text-align", "textAlign"],
  ["text-direction", "textDirection"],
  ["line-height", "lineHeight"],
  ["font-size", "fontSize", "px"],
];

// [content-node-attr, element-style, style-units]
export const textAttrs = [
  ["typography-ref-id", null],
  ["typography-ref-file", null],

  ["font-id", null],
  ["font-variant-id", "fontVariant"],
  ["font-family", "fontFamily"],
  ["font-size", "fontSize", "px"],
  ["font-weight", "fontWeight"],
  ["font-style", "fontStyle"],

  ["line-height", "lineHeight"],
  ["letter-spacing", "letterSpacing"],

  ["text-decoration", "textDecoration"],
  ["text-transform", "textTransform"],

  ["fills", null],
];

export function applyStyles(element, contentNode, attrs) {
  const style = element.style;
  for (const [contentAttr, elementStyle, styleUnits] of attrs) {
    if (!(contentAttr in contentNode)) continue;
    const value = styleUnits ? `${contentNode[contentAttr]}${styleUnits}` : contentNode[contentAttr];
    if (!elementStyle) {
      // TODO: Ver la forma en al que podemos codificar JSON.
      // style.setProperty(`--${contentAttr}`, `"${JSON.stringify(value)}"`)
    } else {
      style.setProperty(contentAttr, value);
    }
  }
}

export function applyRootAttrs(element, contentNode) {
  return applyStyles(element, contentNode, rootAttrs);
}

export function applyParagraphAttrs(element, contentNode) {
  return applyStyles(element, contentNode, paragraphAttrs);
}

export function applyTextAttrs(element, contentNode) {
  return applyStyles(element, contentNode, textAttrs);
}

export function extractStyles(element, contentNode, attrs) {
  const style = getComputedStyle(element);
  for (const [contentAttr, elementStyle, styleUnits] of attrs) {
    if (!(elementStyle in element.style)) {
      let value = null;
      try {
        // TODO: Error de JSON end of input.
        // value = JSON.parse(style.getPropertyValue(`--${contentAttr}`))
      } catch (error) {
        console.warn(error);
      }
      contentNode[contentAttr] = value;
      continue;
    }
    const value = styleUnits
      ? style.getPropertyValue(contentAttr).replace(styleUnits, "")
      : style.getPropertyValue(contentAttr);
    if (!value) {
      continue;
    }
    contentNode[contentAttr] = value;
  }
  return contentNode;
}

export function extractRootStyles(element, contentNode) {
  return extractStyles(element, contentNode, rootAttrs);
}

export function extractParagraphStyles(element, contentNode) {
  return extractStyles(element, contentNode, paragraphAttrs);
}

export function extractTextStyles(element, contentNode) {
  return extractStyles(element, contentNode, textAttrs);
}

export default {
  rootAttrs,
  paragraphAttrs,
  textAttrs,
  applyStyles,
  applyRootAttrs,
  applyParagraphAttrs,
  applyTextAttrs,
  extractStyles,
  extractRootStyles,
  extractParagraphStyles,
  extractTextStyles
}
