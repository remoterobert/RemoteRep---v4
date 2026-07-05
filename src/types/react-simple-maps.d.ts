// Minimal declaration for react-simple-maps — we only use three
// components (ComposableMap, Geographies, Geography) so a light shim
// beats pulling in a full @types package that clashes on peer deps.

declare module "react-simple-maps" {
  import * as React from "react";

  export interface ComposableMapProps
    extends React.HTMLAttributes<SVGSVGElement> {
    projection?: string;
    projectionConfig?: Record<string, unknown>;
    width?: number;
    height?: number;
    children?: React.ReactNode;
  }
  export const ComposableMap: React.FC<ComposableMapProps>;

  export interface GeographiesProps {
    geography: string | object;
    children: (props: {
      geographies: Array<{
        rsmKey: string;
        properties: Record<string, unknown> & { name: string };
      }>;
    }) => React.ReactNode;
  }
  export const Geographies: React.FC<GeographiesProps>;

  export interface GeographyProps {
    geography: unknown;
    style?: {
      default?: React.CSSProperties;
      hover?: React.CSSProperties;
      pressed?: React.CSSProperties;
    };
    onClick?: (event: React.MouseEvent) => void;
    onMouseEnter?: (event: React.MouseEvent) => void;
    onMouseLeave?: (event: React.MouseEvent) => void;
  }
  export const Geography: React.FC<GeographyProps>;
}
