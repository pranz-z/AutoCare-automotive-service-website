import { getBranding } from "@/lib/content";

export function BrandStyles() {
  const branding = getBranding();
  const css = `
    :root {
      --brand-primary: ${branding.primaryColor};
      --brand-secondary: ${branding.secondaryColor};
      --brand-accent: ${branding.accentColor};
      --brand-accent-contrast: ${branding.accentContrast};
      --brand-bg: ${branding.backgroundColor};
      --brand-surface: ${branding.surfaceColor};
      --brand-muted: ${branding.mutedColor};
      --brand-text: ${branding.textColor};
      --brand-inverted: ${branding.invertedTextColor};
      --brand-border: ${branding.borderColor};
      --brand-radius: ${branding.borderRadius};
    }
  `;
  return <style dangerouslySetInnerHTML={{ __html: css }} />;
}
