import { describe, expect, it } from "vitest";
import { JUMP_PROGRAMME_MAILBOX, JUMP_PROGRAMME_SENDER, getJumpProgrammeReplyTo, getJumpProgrammeSender } from "@server/email";

describe("JUMP participant-email sender policy", () => {
  it("rejects a stale admin sender configuration in favour of the JUMP programme mailbox", () => {
    expect(getJumpProgrammeSender("Emmanuel Tarfa | JUMP 2026 <admin@emmanueltarfa.com>")).toBe(JUMP_PROGRAMME_SENDER);
  });

  it("allows the configured JUMP mailbox without changing the display name", () => {
    expect(getJumpProgrammeSender("Emmanuel Tarfa <jump@emmanueltarfa.com>")).toBe("Emmanuel Tarfa <jump@emmanueltarfa.com>");
  });

  it("always routes participant replies to the JUMP programme mailbox", () => {
    expect(getJumpProgrammeReplyTo("admin@emmanueltarfa.com")).toBe(JUMP_PROGRAMME_MAILBOX);
    expect(getJumpProgrammeReplyTo("jump@emmanueltarfa.com")).toBe(JUMP_PROGRAMME_MAILBOX);
  });
});
