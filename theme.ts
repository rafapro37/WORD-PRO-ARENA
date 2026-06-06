// SISTEMA DE DESIGN GLOBAL RF-PRO - THEME.TS
// Fonte única de verdade de design para impedir fragmentação visual

export const THEME = {
  colors: {
    background: "#2f3136",      // Cinza grafite suave
    card: "#3a3d42",            // Cinza médio
    primary: "#ff7a00",         // Laranja forte destaque
    textMain: "#f2f2f2",        // Branco suave
    textSecondary: "#bdbdbd",   // Cinza claro secundário
    border: "#4d5156",          // Borda padrão
    success: "#10B981",         // Verde de sucesso
    danger: "#ef4444",          // Vermelho de erro/alerta
    warning: "#f59e0b",         // Amarelo
  },
  typography: {
    fontSans: "'Inter', sans-serif",
    sizes: {
      xs: "0.75rem", // 12px
      sm: "0.875rem", // 14px
      base: "1rem", // 16px
      lg: "1.125rem", // 18px
      xl: "1.25rem", // 20px
      "2xl": "1.5rem", // 24px
      "3xl": "1.875rem", // 30px
      "4xl": "2.25rem", // 36px
    },
    weights: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
      black: "900",
    }
  },
  spacing: {
    xs: "0.25rem", // 4px
    sm: "0.5rem", // 8px
    md: "1rem", // 16px
    lg: "1.5rem", // 24px
    xl: "2rem", // 32px
    "2xl": "3rem", // 48px
  },
  borders: {
    radiusCard: "16px",
    radiusInput: "12px",
    radiusButton: "12px",
    style: "1px solid #4d5156",
  },
  shadows: {
    card: "0 4px 20px rgba(0, 0, 0, 0.2)",
    button: "0 4px 12px rgba(255, 122, 0, 0.25)",
    glow: "0 0 20px rgba(255, 122, 0, 0.15)",
  }
};

// Export style strings/tailwind aliases for quick reference inside TSX
export const SYSTEM_CLASSES = {
  mainBg: "bg-[#2f3136] text-[#f2f2f2]",
  card: "bg-[#3a3d42] border border-[#4d5156] rounded-2xl shadow-xl",
  input: "bg-[#3a3d42] border border-[#4d5156] text-[#f2f2f2] rounded-xl focus:border-[#ff7a00] outline-none transition-all",
  buttonPrimary: "bg-[#ff7a00] text-[#f2f2f2] font-black uppercase tracking-wider rounded-xl transition-all hover:bg-[#ee7200]",
  textMain: "text-[#f2f2f2]",
  textMuted: "text-[#bdbdbd]"
};
