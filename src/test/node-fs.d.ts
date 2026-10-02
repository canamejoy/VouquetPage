// Vite refuses to serve `.env*` files through `?raw` imports, and the project deliberately has no
// `@types/node`. The hygiene test needs to read `.env.local.example`, so it declares only the one
// function it uses.
declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
}
