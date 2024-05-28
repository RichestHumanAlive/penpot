import { insertText } from './insertText.js'
import { insertReplacementText } from './insertReplacementText.js'
import { insertLineBreak } from './insertLineBreak.js'
import { insertParagraph } from './insertParagraph.js'
import { insertOrderedList } from './insertOrderedList.js'
import { insertUnorderedList } from './insertUnorderedList.js'
import { insertHorizontalRule } from './insertHorizontalRule.js'
import { insertFromYank } from './insertFromYank.js'
import { insertFromDrop } from './insertFromDrop.js'
import { insertFromPaste } from './insertFromPaste.js'
import { insertFromPasteAsQuotation } from './insertFromPasteAsQuotation.js'
import { insertTranspose } from './insertTranspose.js'
import { insertCompositionText } from './insertCompositionText.js'
import { insertLink } from './insertLink.js'
import { deleteWordBackward } from './deleteWordBackward.js'
import { deleteWordForward } from './deleteWordForward.js'
import { deleteSoftLineBackward } from './deleteSoftLineBackward.js'
import { deleteSoftLineForward } from './deleteSoftLineForward.js'
import { deleteEntireSoftLine } from './deleteEntireSoftLine.js'
import { deleteHardLineBackward } from './deleteHardLineBackward.js'
import { deleteHardLineForward } from './deleteHardLineForward.js'
import { deleteByDrag } from './deleteByDrag.js'
import { deleteByCut } from './deleteByCut.js'
import { deleteContent } from './deleteContent.js'
import { deleteContentBackward } from './deleteContentBackward.js'
import { deleteContentForward } from './deleteContentForward.js'
import { historyUndo } from './historyUndo.js'
import { historyRedo } from './historyRedo.js'
import { formatBold } from './formatBold.js'
import { formatItalic } from './formatItalic.js'
import { formatUnderline } from './formatUnderline.js'
import { formatStrikeThrough } from './formatStrikeThrough.js'
import { formatSuperscript } from './formatSuperscript.js'
import { formatSubscript } from './formatSubscript.js'
import { formatJustifyFull } from './formatJustifyFull.js'
import { formatJustifyCenter } from './formatJustifyCenter.js'
import { formatJustifyRight } from './formatJustifyRight.js'
import { formatJustifyLeft } from './formatJustifyLeft.js'
import { formatIndent } from './formatIndent.js'
import { formatOutdent } from './formatOutdent.js'
import { formatRemove } from './formatRemove.js'
import { formatSetBlockTextDirection } from './formatSetBlockTextDirection.js'
import { formatSetInlineTextDirection } from './formatSetInlineTextDirection.js'
import { formatBackColor } from './formatBackColor.js'
import { formatFontColor } from './formatFontColor.js'
import { formatFontName } from './formatFontName.js'

export default {
  insertText,
  insertReplacementText,
  insertLineBreak,
  insertParagraph,
  insertOrderedList,
  insertUnorderedList,
  insertHorizontalRule,
  insertFromYank,
  insertFromDrop,
  insertFromPaste,
  insertFromPasteAsQuotation,
  insertTranspose,
  insertCompositionText,
  insertLink,
  deleteWordBackward,
  deleteWordForward,
  deleteSoftLineBackward,
  deleteSoftLineForward,
  deleteEntireSoftLine,
  deleteHardLineBackward,
  deleteHardLineForward,
  deleteByDrag,
  deleteByCut,
  deleteContent,
  deleteContentBackward,
  deleteContentForward,
  historyUndo,
  historyRedo,
  formatBold,
  formatItalic,
  formatUnderline,
  formatStrikeThrough,
  formatSuperscript,
  formatSubscript,
  formatJustifyFull,
  formatJustifyCenter,
  formatJustifyRight,
  formatJustifyLeft,
  formatIndent,
  formatOutdent,
  formatRemove,
  formatSetBlockTextDirection,
  formatSetInlineTextDirection,
  formatBackColor,
  formatFontColor,
  formatFontName
}