export type BrandedEmailDetails = {
  label: string;
  value: string;
};

export type BrandedEmailInput = {
  label?: string;
  title: string;
  preheader?: string;
  greeting?: string;
  paragraphs: string[];
  details?: BrandedEmailDetails[];
  callout?: string;
  cta?: { label: string; url: string };
  footerNote?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toParagraphHtml(value: string) {
  return escapeHtml(value).replace(/\n/g, "<br />");
}

function safeHref(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:" ? escapeHtml(parsed.toString()) : "";
  } catch {
    return "";
  }
}

/**
 * Produces a conservative table-based email that renders reliably in Gmail and narrow mobile clients.
 * The responsive container and spacing are intentionally inline because major email clients strip CSS.
 */
export function buildBrandedEmailHtml(input: BrandedEmailInput) {
  const preheader = escapeHtml(input.preheader || input.title);
  const label = input.label ? `<div style="font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;letter-spacing:1.4px;text-transform:uppercase;color:#B45309;font-weight:700;margin:0 0 12px;">${escapeHtml(input.label)}</div>` : "";
  const greeting = input.greeting ? `<p style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:18px;line-height:28px;color:#18212D;">${toParagraphHtml(input.greeting)}</p>` : "";
  const paragraphs = input.paragraphs.map((paragraph) => `<p style="margin:0 0 18px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:25px;color:#344154;word-break:normal;overflow-wrap:break-word;">${toParagraphHtml(paragraph)}</p>`).join("");
  const details = input.details?.length
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:4px 0 22px;background:#F8FAFC;border:1px solid #D8E2EC;border-radius:8px;">${input.details.map((detail) => `<tr><td style="padding:11px 14px 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:17px;letter-spacing:.7px;text-transform:uppercase;color:#5F7083;font-weight:700;">${escapeHtml(detail.label)}</td></tr><tr><td style="padding:3px 14px 11px;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:23px;color:#18212D;word-break:normal;overflow-wrap:break-word;">${toParagraphHtml(detail.value)}</td></tr>`).join("")}</table>`
    : "";
  const callout = input.callout ? `<div style="margin:0 0 22px;padding:15px 16px;background:#FFF7E7;border-left:4px solid #F59E0B;border-radius:0 8px 8px 0;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:23px;color:#5B4214;word-break:normal;overflow-wrap:break-word;">${toParagraphHtml(input.callout)}</div>` : "";
  const href = input.cta ? safeHref(input.cta.url) : "";
  const cta = input.cta && href
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:4px 0 24px;"><tr><td bgcolor="#F59E0B" style="border-radius:7px;"><a href="${href}" target="_blank" style="display:inline-block;padding:14px 20px;font-family:Arial,Helvetica,sans-serif;font-size:16px;line-height:20px;font-weight:700;color:#172033;text-decoration:none;border-radius:7px;">${escapeHtml(input.cta.label)}</a></td></tr></table>`
    : "";
  const footerNote = input.footerNote ? `<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:20px;color:#68778A;word-break:normal;overflow-wrap:break-word;">${toParagraphHtml(input.footerNote)}</p>` : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="x-apple-disable-message-reformatting"><title>${escapeHtml(input.title)}</title></head><body style="margin:0;padding:0;background:#F3F0EA;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;line-height:1px;font-size:1px;">${preheader}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;background:#F3F0EA;"><tr><td align="center" style="padding:24px 12px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;border-collapse:collapse;background:#FFFFFF;border-radius:12px;overflow:hidden;"><tr><td style="padding:24px 28px;background:#1F4E79;"><div style="font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:30px;font-weight:700;letter-spacing:.2px;color:#FFFFFF;">JUMP 2026</div><div style="margin-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:11px;line-height:16px;letter-spacing:1.15px;text-transform:uppercase;color:#DCE9F4;">Strategy &amp; Innovation Genius Track</div></td></tr><tr><td style="padding:30px 28px 24px;">${label}<h1 style="margin:0 0 18px;font-family:Georgia,'Times New Roman',serif;font-size:29px;line-height:36px;font-weight:700;color:#18212D;word-break:normal;">${escapeHtml(input.title)}</h1>${greeting}${paragraphs}${details}${callout}${cta}${footerNote}</td></tr><tr><td style="padding:18px 28px 22px;background:#F8FAFC;border-top:1px solid #E1E8EF;"><p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:#68778A;">Emmanuel Tarfa &nbsp;|&nbsp; JUMP 2026 Strategy &amp; Innovation Genius Track</p></td></tr></table></td></tr></table></body></html>`;
}

/** Gives historic or admin-composed plain-text messages a readable HTML shell without changing their text fallback. */
export function buildPlainTextEmailHtml(body: string) {
  const blocks = body.trim().split(/\n\s*\n/).filter(Boolean);
  const first = blocks[0] || "JUMP 2026";
  const greeting = /^dear\s+/i.test(first) ? first : undefined;
  return buildBrandedEmailHtml({
    label: "JUMP 2026 communication",
    title: greeting ? "A message from Emmanuel Tarfa" : "JUMP 2026 update",
    greeting,
    paragraphs: greeting ? blocks.slice(1) : blocks,
  });
}

export function buildRegistrationConfirmationEmail(input: {
  fullName: string;
  businessName: string;
  businessModel: string;
  packageName: string;
}) {
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName;
  const subject = `JUMP 2026 Registration Received — ${input.packageName} Package`;
  const body = `Dear ${input.fullName},\n\nThank you for registering for the JUMP 2026 Strategy & Innovation Genius Track (${input.packageName} Package).\n\nWe have received your registration details for ${input.businessName} (${input.businessModel}). Our review team is evaluating your submission, and you will receive a follow-up email regarding your acceptance and onboarding details shortly.\n\nThe participant platform was built specifically for this programme and is continually being improved. If anything does not work as expected, kindly take a screenshot and reply directly to this email. Emmanuel reads every participant email and will have the technical team review it.\n\nWarm regards,\nDr. Emmanuel Tarfa\nJUMP 2026 Programme Team`;
  return {
    subject,
    body,
    html: buildBrandedEmailHtml({
      label: `${input.packageName} package`,
      title: "Your registration has been received",
      preheader: `Thank you, ${firstName}. Your JUMP 2026 registration is safely with us.`,
      greeting: `Dear ${firstName},`,
      paragraphs: [
        "Thank you for registering for the JUMP 2026 Strategy & Innovation Genius Track. We have safely received your submission.",
        `Our review team is now considering the context you provided for ${input.businessName}. We will write again shortly with the next stage of your acceptance and onboarding journey.`,
        "Kindly keep this email for your records. There is nothing further you need to do today.",
      ],
      details: [
        { label: "Business", value: input.businessName },
        { label: "Business model", value: input.businessModel },
        { label: "Selected pathway", value: input.packageName },
      ],
      callout: "This participant platform was built specifically for JUMP 2026 and is continually being improved. If anything does not work as expected, kindly take a screenshot and reply directly to this email. Emmanuel reads every participant email and will have the technical team review it.",
      footerNote: "If you need to correct a registration detail or need support, kindly reply directly to this email.",
    }),
  };
}

const engagementInvitationPackageCopy = {
  Foundation: {
    fee: "₦575,000",
    commitment: "₦230,000 (40%)",
    upfront: "₦517,500",
    distinction: "Foundation gives you the core five-class journey and the decisions, tools and language needed to strengthen how you build.",
  },
  "Engine Room": {
    fee: "₦875,000",
    commitment: "₦350,000 (40%)",
    upfront: "₦787,500",
    distinction: "Engine Room includes the Foundation journey together with deeper work around your commercial model, positioning, unit economics and operating choices.",
  },
  Boardroom: {
    fee: "₦1,500,000",
    commitment: "₦600,000 (40%)",
    upfront: "₦1,350,000",
    distinction: "Boardroom is the complete cumulative engagement, including Foundation and Engine Room work, three private 90-minute strategy sessions, and written action points after each one.",
  },
} as const;

export function buildEngagementBriefInvitationEmail(input: {
  fullName: string;
  businessName: string;
  packageName: "Foundation" | "Engine Room" | "Boardroom";
  portalUrl: string;
}) {
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName;
  const packageCopy = engagementInvitationPackageCopy[input.packageName];
  const subject = `JUMP 2026 — Your ${input.packageName} Engagement Brief is ready`;
  const body = `Dear ${input.fullName},\n\nI trust this meets you well and in good health.\n\nThank you again for registering for JUMP 2026. I am pleased to welcome you into the next stage for ${input.businessName}: your private participant portal and personalised ${input.packageName} Engagement Brief.\n\nWe have digitised this engagement so your brief, diagnostic, working materials and, as they become available, meeting recordings can live in one private place over the course of the programme. The portal works on mobile, but kindly use a laptop whenever possible for the most complete experience—especially when working through the diagnostic and programme materials.\n\nPlease use this secure link to set your participant password:\n${input.portalUrl}\n\nThis link is single-use and expires after 20 minutes. Once your password is set, return to the JUMP website and sign in normally using your registered email address and password. Your browser can remember your sign-in on this device for 30 days.\n\nYour Engagement Brief is the first thing you will see. It opens with my understanding of what you shared in your registration, the potential challenge it may point to, and the areas we will explore together. This is a starting hypothesis for our work—not a final diagnosis. It also presents the programme sessions once, with one clear explanation of how the engagement works. Kindly read it carefully and select “I have read and consent to the terms.”\n\n${packageCopy.distinction}\n\nYour private payment guidance is available alongside this brief. Kindly review your pathway-specific fee, instalment schedule, full-upfront option, and approved payment routes whenever you are ready. Once you acknowledge the brief, your Current State Assessment and programme tracker open immediately. You can begin the assessment before payment; it adds the detail I need to shape the advisory work around your business. It is an initial get-to-know-you diagnostic, not the full set of questions for the engagement. Before each class, I will ask further focused questions so the discussion, recommendations and materials can respond to the decisions then in front of you.\n\nThe programme is currently scheduled to begin on Friday, 4 September 2026. Every class will be recorded. Where an unforeseen adjustment is necessary, I will communicate at least 72 hours ahead and advise a replacement date.\n\nThis platform was built specifically for JUMP 2026 and is continually being improved. If you encounter any technical difficulty, kindly take a screenshot and email me directly. I read every participant email and will have the technical team look into it promptly.\n\nI look forward to the work ahead.\n\nWarm regards,\n\nEmmanuel Tarfa\nFacilitator, JUMP 2026 — Strategy & Innovation Genius Track`;

  return {
    subject,
    body,
    html: buildBrandedEmailHtml({
      label: `${input.packageName} engagement`,
      title: "Your Engagement Brief is ready",
      preheader: `Set your password to access your private JUMP 2026 ${input.packageName} Engagement Brief.`,
      greeting: `Dear ${firstName},\n\nI trust this meets you well and in good health.`,
      paragraphs: [
        `Thank you again for registering for JUMP 2026. I am pleased to welcome you into the next stage for ${input.businessName}: your private participant portal and personalised Engagement Brief.`,
        "We have digitised this engagement so your brief, diagnostic, working materials and, as they become available, meeting recordings can live in one private place over the course of the programme. The portal works on mobile, but kindly use a laptop whenever possible for the most complete experience—especially when working through the diagnostic and programme materials.",
        "Your Engagement Brief is the first thing you will see. It opens with my understanding of what you shared, the potential challenge it may point to and the areas we will explore together. This is a starting hypothesis—not a final diagnosis. The programme sessions appear once, with one clear explanation of how the engagement works.",
        packageCopy.distinction,
        "Your private payment guidance is available alongside this brief. Kindly review your pathway-specific fee, instalment schedule, full-upfront option, and approved payment routes whenever you are ready. Once you acknowledge the brief, your Current State Assessment and programme tracker open immediately. You can begin the assessment before payment; it adds the detail I need to shape the advisory work around your business. It is an initial get-to-know-you diagnostic, not the full set of questions for the engagement. Before each class, I will ask further focused questions so the discussion, recommendations and materials can respond to the decisions then in front of you.",
        "The programme is currently scheduled to begin on Friday, 4 September 2026. Every class will be recorded. Where an unforeseen adjustment is necessary, I will communicate at least 72 hours ahead and advise a replacement date.",
      ],
      details: [{ label: "Selected pathway", value: input.packageName }],
      cta: { label: "Set my portal password", url: input.portalUrl },
      callout: "This secure password-setup link expires in 20 minutes and can be used once. Once your password is set, sign in normally with your registered email address and password.",
      footerNote: "This platform was built specifically for JUMP 2026 and is continually being improved. If you encounter any technical difficulty, kindly take a screenshot and email Emmanuel directly. He will have the technical team review it promptly.",
    }),
  };
}

export function buildInformationSessionInvitationEmail(input: {
  fullName: string;
  meetUrl: string;
}) {
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName;
  const subject = "JUMP 2026 — Information Session & Briefing | Sunday, 23 August";
  const body = `Dear ${input.fullName},\n\nI trust this meets you well and in good health.\n\nHaving interacted with some individuals already, I would like to give everyone an opportunity to be properly advised on the programme. I would therefore like to invite you to a JUMP 2026 Information Session & Briefing: a chance to bring the room together, answer your questions and allow you to meet the fellow entrepreneurs with whom you may share the journey.\n\nDate: Sunday, 23 August 2026\nTime: 7:00–8:00 pm (Lagos time)\nVenue: Google Meet\n\nDuring the session, I will set out what JUMP is designed to achieve, how the advisory journey is structured and how Foundation, Engine Room and Boardroom build on the shared core experience. We will also cover how to make the best use of your private portal, Current State Assessment, working materials and subsequent sessions. Most importantly, we will make time for your questions, so you can begin with context, clarity and confidence.\n\nIf you are already clear on what you want and ready to move forward, kindly feel free to continue with your registration steps, portal consent, payment and any scheduling made available to you. You are still very welcome to attend the Information Session; it is designed to help everyone begin well.\n\nYou will receive a Google Calendar invitation immediately after this email. Kindly use its Yes, No or Maybe response option to confirm your attendance.\n\nJoin the Information Session here:\n${input.meetUrl}\n\nIf you cannot attend live, kindly do not worry. The session will be recorded, and the recording will be shared in your private participant portal for you to revisit.\n\nPlease come with the practical questions that matter most to you: your business priorities, how the engagement will work, and how you can get the most value from the journey. There is no additional preparation required for this session.\n\nI look forward to meeting you properly and opening the journey together.\n\nWarm regards,\n\nEmmanuel Tarfa`;

  return {
    subject,
    body,
    html: buildBrandedEmailHtml({
      label: "A personal invitation from Emmanuel Tarfa",
      title: "Information Session & Briefing",
      preheader: "Join Emmanuel Tarfa and the JUMP 2026 cohort on Sunday, 23 August at 7:00 pm Lagos time.",
      greeting: `Dear ${firstName},\n\nI trust this meets you well and in good health.`,
      paragraphs: [
        "Having interacted with some individuals already, I would like to give everyone an opportunity to be properly advised on the programme. I would therefore like to invite you to a JUMP 2026 Information Session & Briefing: a chance to bring the room together, answer your questions and allow you to meet the fellow entrepreneurs with whom you may share the journey.",
        "I will set out what JUMP is designed to achieve, how the advisory journey is structured and how Foundation, Engine Room and Boardroom build on the shared core experience. We will also cover how to make the best use of your private portal, Current State Assessment, working materials and subsequent sessions.",
        "Most importantly, we will make time for your questions, so you can begin the programme with context, clarity and confidence. Please come with the practical questions that matter most to you: your business priorities, how the engagement will work, and how you can get the most value from the journey. There is no additional preparation required.",
        "If you are already clear on what you want and ready to move forward, kindly feel free to continue with your registration steps, portal consent, payment and any scheduling made available to you. You are still very welcome to attend the Information Session; it is designed to help everyone begin well.",
        "You will receive a Google Calendar invitation immediately after this email. Kindly use its Yes, No or Maybe response option to confirm your attendance.",
        "If you cannot attend live, kindly do not worry. The session will be recorded, and the recording will be shared in your private participant portal for you to revisit.",
      ],
      details: [
        { label: "Date", value: "Sunday, 23 August 2026" },
        { label: "Time", value: "7:00–8:00 pm (Lagos time)" },
        { label: "Venue", value: "Google Meet" },
      ],
      callout: "This is a live orientation and briefing for the JUMP 2026 community—not an additional assessment. Whether you are still considering your route or already ready to proceed, kindly join if you can; the recording will be available for those who miss it.",
      cta: { label: "Join the Information Session", url: input.meetUrl },
      footerNote: "If you experience a technical issue, kindly take a screenshot and reply directly to this email. Emmanuel reads participant emails and will have the technical team review it.",
    }),
  };
}

export function buildDuplicatePathwayClarificationEmail(input: {
  fullName: string;
  businessName: string;
  packageName: "Foundation" | "Engine Room" | "Boardroom";
  portalUrl: string;
}) {
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName;
  const packageCopy = engagementInvitationPackageCopy[input.packageName];
  const subject = `JUMP 2026 — Your ${input.packageName} registration is confirmed`;
  const body = `Dear ${input.fullName},\n\nI trust this meets you well and in good health.\n\nApologies: our system recognised two entries for ${input.businessName}. I have resolved this on the back end and retained your ${input.packageName} registration only. Please disregard the earlier lower-pathway email; there is nothing further you need to do in relation to it.\n\n${packageCopy.distinction}\n\nPlease use this secure link to set your ${input.packageName} participant password:\n${input.portalUrl}\n\nThis link is single-use and expires after 20 minutes. Once your password is set, return to the JUMP website and sign in normally with your registered email address and password.\n\nYour Engagement Brief is the first thing you will see. Kindly read it and select “I have read and consent to the terms.” You can then complete your Current State Assessment. This is an initial get-to-know-you diagnostic, not the full set of questions for the engagement. Before each class, I will ask further focused questions so the discussion, recommendations and materials can respond to the decisions then in front of you.\n\nThe portal works on mobile, but kindly use a laptop or desktop whenever possible for the most complete experience—especially when working through the diagnostic and programme materials.\n\nThis is now the one participant experience we will use for your ${input.packageName} engagement. If you encounter any technical difficulty, please take a screenshot and email me directly.\n\nWarm regards,\n\nEmmanuel Tarfa\nFacilitator, JUMP 2026 — Strategy & Innovation Genius Track`;

  return {
    subject,
    body,
    html: buildBrandedEmailHtml({
      label: `${input.packageName} registration confirmed`,
      title: `Your ${input.packageName} journey is confirmed`,
      preheader: `Your JUMP 2026 ${input.packageName} portal is now your single active participant experience.`,
      greeting: `Dear ${firstName},\n\nI trust this meets you well and in good health.`,
      paragraphs: [
        `Apologies: our system recognised two entries for ${input.businessName}. I have resolved this on the back end and retained your ${input.packageName} registration only. Please disregard the earlier lower-pathway email; there is nothing further you need to do in relation to it.`,
        packageCopy.distinction,
        "Your Engagement Brief is the first thing you will see. Kindly read it and select “I have read and consent to the terms.” You can then complete your Current State Assessment.",
        "This is an initial get-to-know-you diagnostic, not the full set of questions for the engagement. Before each class, I will ask further focused questions so the discussion, recommendations and materials can respond to the decisions then in front of you.",
        "Use the secure link to set your participant password. Once complete, sign in normally from the JUMP website with your registered email address and password.",
        "The portal works on mobile, but kindly use a laptop or desktop whenever possible for the most complete experience—especially when working through the diagnostic and programme materials.",
      ],
      details: [{ label: "Active pathway", value: input.packageName }],
      cta: { label: "Set my participant password", url: input.portalUrl },
      callout: "This secure password-setup link expires in 20 minutes and can be used once. Once your password is set, sign in normally from the JUMP website.",
      footerNote: "If you encounter any technical difficulty, kindly take a screenshot and email Emmanuel directly. He will have the technical team review it promptly.",
    }),
  };
}

export function buildWaitlistEmail(fullName: string) {
  const firstName = fullName.trim().split(/\s+/)[0] || fullName;
  const subject = `JUMP 2026 Boardroom Waitlist — ${fullName}`;
  const body = `Dear ${fullName},\n\nThank you for your interest in the JUMP 2026 Boardroom package. The 8 available places are currently full, so we have placed your registration on the Waitlist. The programme team will contact you if a place becomes available.\n\nWarm regards,\nJUMP 2026 Programme Team`;
  return {
    subject,
    body,
    html: buildBrandedEmailHtml({
      label: "Boardroom package",
      title: "You have been added to the waitlist",
      preheader: "Your Boardroom interest has been recorded.",
      greeting: `Dear ${firstName},`,
      paragraphs: [
        "Thank you for your interest in the JUMP 2026 Boardroom package.",
        "The eight available Boardroom places are currently full, so we have added your registration to the waitlist. We will contact you personally if a place becomes available.",
      ],
      callout: "Your registration has been safely recorded. No further action is needed at this time.",
      footerNote: "Kindly reply directly to this email if you have a question about your registration.",
    }),
  };
}

export function buildSessionReminderEmail(input: {
  fullName: string;
  sessionTitle: string;
  sessionDate: string;
  sessionTime: string;
  meetingUrl?: string;
  messageNotes?: string;
}) {
  const firstName = input.fullName.trim().split(/\s+/)[0] || input.fullName;
  const subject = `24-Hour Reminder: ${input.sessionTitle} — JUMP 2026`;
  const meeting = input.meetingUrl || "Access via your JUMP participant portal";
  const body = `Dear ${input.fullName},\n\nThis is your 24-hour reminder for the upcoming JUMP 2026 session: "${input.sessionTitle}".\n\nScheduled Date: ${input.sessionDate} at ${input.sessionTime}\nMeeting Link: ${meeting}\n\n${input.messageNotes ? `Facilitator Notes:\n${input.messageNotes}\n\n` : ""}We have attached a calendar invitation (ICS) to this email so you can add this session directly to your calendar.\n\nWarm regards,\nDr. Emmanuel Tarfa\nFacilitator, JUMP 2026`;
  return {
    subject,
    body,
    html: buildBrandedEmailHtml({
      label: "24-hour session reminder",
      title: input.sessionTitle,
      preheader: `Your JUMP 2026 session is scheduled for ${input.sessionDate}.`,
      greeting: `Dear ${firstName},`,
      paragraphs: ["This is a kindly reminder about your upcoming JUMP 2026 session. Your calendar invitation is attached for convenience."],
      details: [
        { label: "Date", value: input.sessionDate },
        { label: "Time", value: input.sessionTime },
        { label: "Joining details", value: input.meetingUrl ? "Use the button below to join the session." : meeting },
      ],
      callout: input.messageNotes ? `Facilitator notes:\n${input.messageNotes}` : undefined,
      cta: input.meetingUrl ? { label: "Join session", url: input.meetingUrl } : undefined,
      footerNote: "If you experience a difficulty, kindly reply directly to this email. The calendar invitation is attached for your records.",
    }),
  };
}
