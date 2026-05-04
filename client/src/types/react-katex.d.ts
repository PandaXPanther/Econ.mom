declare module "react-katex" {
  import type { ComponentType } from "react";
  export interface KaTeXProps {
    math: string;
    block?: boolean;
    errorColor?: string;
    renderError?: (error: { name: string; message: string }) => React.ReactNode;
    settings?: Record<string, unknown>;
    as?: keyof JSX.IntrinsicElements;
  }
  export const InlineMath: ComponentType<KaTeXProps>;
  export const BlockMath: ComponentType<KaTeXProps>;
}
