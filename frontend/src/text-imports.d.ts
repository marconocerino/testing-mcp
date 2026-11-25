/** Files imported as text with `with { loader: 'text' }` (Angular's esbuild text loader). */
declare module '*.md' {
  const text: string;
  export default text;
}
