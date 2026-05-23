const STUB_MARKER = "_stub" as const;

export function isStubbed(payload: Record<string, unknown> | null | undefined): boolean {
  return Boolean(payload && (payload as Record<string, unknown>)[STUB_MARKER]);
}
