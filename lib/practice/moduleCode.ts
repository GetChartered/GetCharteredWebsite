// Some backend responses double-prefix a module code with its own exam
// code — e.g. "BIP-BIP-4" or "ARF-ARF-1" instead of the canonical "BIP-4" /
// "ARF-1" (same duplicated-prefix data-quality issue documented for
// GetChartered_app's own module-code handling). GET /courses and
// GET /progress don't always agree on which form a given module comes back
// as, so anywhere a module code is read from either endpoint funnels
// through this single canonicalization point — the alternative (patching
// each consumer's lookup individually) is how this bug shows up
// inconsistently across a page in the first place.
export function canonicalizeModuleCode(code: string): string {
  const match = code.match(/^([A-Z]+)-\1-(.+)$/);
  return match ? `${match[1]}-${match[2]}` : code;
}
