import 'vitest';

/* vitest-axe déclare ses matchers dans l'espace `Vi`, abandonné par Vitest 5. */
declare module 'vitest' {
  interface Assertion {
    toHaveNoViolations(): void;
  }
  interface AsymmetricMatchersContaining {
    toHaveNoViolations(): void;
  }
}
