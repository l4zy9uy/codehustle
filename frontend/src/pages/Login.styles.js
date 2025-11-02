import { COLORS } from '../constants';

// Styles for the Login page components
export const loginStyles = {
  // Google OAuth button styles
  googleButton: {
    backgroundColor: COLORS.GOOGLE_BUTTON_BG,
    border: `1px solid ${COLORS.GOOGLE_BUTTON_BORDER}`,
    color: COLORS.GOOGLE_BUTTON_TEXT,
    borderRadius: '24px',
    height: '48px',
  },

  googleButtonHover: {
    '&:hover': {
      backgroundColor: COLORS.GOOGLE_BUTTON_BG_HOVER,
    },  
    '&:disabled': {
      backgroundColor: COLORS.GOOGLE_BUTTON_BG,
      opacity: 0.6,
    },
  },

  googleButtonLabel: {
    color: COLORS.GOOGLE_BUTTON_TEXT,
  },
};
