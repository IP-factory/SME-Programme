/**
 * PostgreSQL stores identifiers (constraint and index names) truncated to 63 bytes (NAMEDATALEN - 1).
 * Drizzle generates longer names for some foreign keys, so any catalogue lookup by a declared name must use the
 * stored form: `pg_constraint.conname` holds the truncation, never the declared name.
 */
export const MAX_IDENTIFIER_BYTES = 63;

export function pgIdentifier(name) {
  const bytes = Buffer.from(name, "utf8");
  if (bytes.length <= MAX_IDENTIFIER_BYTES) return name;
  let end = MAX_IDENTIFIER_BYTES;
  while (end > 0 && (bytes[end] & 0xc0) === 0x80) end -= 1; // never cut a multi-byte character in half
  return bytes.subarray(0, end).toString("utf8");
}
