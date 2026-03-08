// =============================================================================
// test-utils.ts — Utilitaires partages pour les labs TypeScript (01-19)
// =============================================================================

export function createTestRunner(labName: string) {
  let passed = 0;
  let failed = 0;
  const errors: { name: string; error: Error }[] = [];

  async function test(name: string, fn: () => void | Promise<void>): Promise<void> {
    try {
      await fn();
      passed++;
      console.log(`  \u2705 ${name}`);
    } catch (err) {
      failed++;
      const error = err instanceof Error ? err : new Error(String(err));
      errors.push({ name, error });
      console.log(`  \u274C ${name}`);
      console.log(`     \u2192 ${error.message}`);
    }
  }

  function assert(condition: boolean, message: string = 'Assertion failed'): void {
    if (!condition) throw new Error(message);
  }

  function assertEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
      throw new Error(
        message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
      );
    }
  }

  function assertDeepEqual<T>(actual: T, expected: T, message?: string): void {
    const a = JSON.stringify(actual);
    const b = JSON.stringify(expected);
    if (a !== b) {
      throw new Error(message || `Expected ${b}, got ${a}`);
    }
  }

  function assertThrows(fn: () => void, message?: string): void {
    try {
      fn();
      throw new Error(message || 'Expected function to throw');
    } catch (err) {
      if (err instanceof Error && err.message === (message || 'Expected function to throw')) {
        throw err;
      }
      // OK — function threw as expected
    }
  }

  function assertIncludes(haystack: string | unknown[], needle: unknown, message?: string): void {
    if (typeof haystack === 'string' && typeof needle === 'string') {
      if (!haystack.includes(needle)) {
        throw new Error(message || `Expected string to include "${needle}"`);
      }
    } else if (Array.isArray(haystack)) {
      if (!haystack.includes(needle)) {
        throw new Error(message || `Expected array to include ${JSON.stringify(needle)}`);
      }
    }
  }

  function assertType<_T>(_message?: string): void {
    // Compile-time only check — if this compiles, the type is correct
  }

  function assertGreaterThan(actual: number, expected: number, message?: string): void {
    if (!(actual > expected)) {
      throw new Error(message || `Expected ${actual} > ${expected}`);
    }
  }

  function assertLessThan(actual: number, expected: number, message?: string): void {
    if (!(actual < expected)) {
      throw new Error(message || `Expected ${actual} < ${expected}`);
    }
  }

  function summary(): { passed: number; failed: number; total: number } {
    const total = passed + failed;
    console.log(`\n${'─'.repeat(50)}`);
    console.log(`\uD83D\uDCCA ${labName} — Resultats : ${passed}/${total} tests reussis`);
    if (failed > 0) {
      console.log(`\n\u274C ${failed} test(s) echoue(s) :`);
      errors.forEach(({ name, error }) => {
        console.log(`   \u2022 ${name} : ${error.message}`);
      });
    } else {
      console.log(`\n\uD83C\uDF89 Tous les tests passent !`);
    }
    console.log(`${'─'.repeat(50)}\n`);
    return { passed, failed, total };
  }

  return {
    test,
    assert,
    assertEqual,
    assertDeepEqual,
    assertThrows,
    assertIncludes,
    assertType,
    assertGreaterThan,
    assertLessThan,
    summary,
  };
}
