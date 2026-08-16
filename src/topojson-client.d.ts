// Minimal ambient types for topojson-client (no @types package installed).
// We only use `feature()` and immediately cast its result to the shape we need.
declare module "topojson-client" {
  export function feature(topology: unknown, object: unknown): unknown;
}
