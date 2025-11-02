import { CODE_DISPLAY, COLORS } from '../../constants';

// Re-export constants for backward compatibility and local use
export const MAX_CODE_H = CODE_DISPLAY.MAX_CODE_HEIGHT;

export const CODE_PREVIEW_BOX = {
  border: CODE_DISPLAY.BORDER,
  borderRadius: CODE_DISPLAY.BORDER_RADIUS,
  maxHeight: MAX_CODE_H,
  overflow: 'auto',
  fontFamily: CODE_DISPLAY.FONT_FAMILY,
  fontSize: CODE_DISPLAY.FONT_SIZE,
  padding: CODE_DISPLAY.PADDING,
  background: CODE_DISPLAY.BACKGROUND
};

export const CODE_BLOCK_BOX = {
  border: CODE_DISPLAY.BORDER,
  borderRadius: CODE_DISPLAY.BORDER_RADIUS,
  padding: CODE_DISPLAY.PADDING,
  background: CODE_DISPLAY.BACKGROUND,
  fontFamily: CODE_DISPLAY.FONT_FAMILY,
  fontSize: CODE_DISPLAY.FONT_SIZE
};

export const DIFF_HL_LEFT = COLORS.DIFF_HL_LEFT;
export const DIFF_HL_RIGHT = COLORS.DIFF_HL_RIGHT; 