import 'dotenv/config';

const KEY = process.env.RESEND_API_KEY;
const TO = process.argv[2] || 'emmanuel.tarfa@enzokrypton.com';

if (!KEY) {
  console.error('RESEND_API_KEY is not set.');
  process.exit(1);
}

async function main() {
  const domRes = await fetch('https://api.resend.com/domains', {
    headers: { Authorization: `Bearer ${KEY}` },
  });
  const domJson = await domRes.json().catch(() => ({}));
  console.log('DOMAINS HTTP', domRes.status);
  console.log(JSON.stringify(domJson, null, 2));

  const list = Array.isArray(domJson?.data) ? domJson.data : [];
  const verified = list.filter((d) => d.status === 'verified');
  console.log(
    'VERIFIED DOMAINS:',
    verified.length ? verified.map((d) => d.name).join(', ') : 'NONE',
  );

  const from = verified.length
    ? `Dr. Emmanuel Tarfa <hello@${verified[0].name}>`
    : 'JUMP 2026 <onboarding@resend.dev>';
  console.log('USING FROM:', from);

  const body = {
    from,
    to: [TO],
    reply_to: 'emmanueltarfa@gmail.com',
    subject: '[TEST] Abigail — your JUMP 2026 registration, and a personal note',
    text: `Dear Abigail,

Thank you for registering for JUMP 2026. I wanted to write to you myself rather than let an automated message do it, because you were among the very first to put your name forward and that deserves a proper acknowledgement.

I have read what you wrote about Sheinvest Consulting. You are in the early days of building, and you work as an Expert - your knowledge and judgement are the product. That is a particular kind of business to grow, and it comes with a particular set of constraints that we will get into.

Your registration is received and confirmed on my side. What happens next is that I will come back to you with a fuller diagnosis of where I think your specific bottleneck sits, and we will talk about what success looks like for Sheinvest by the end of the programme. I want to hear your definition before I offer mine.

I should say plainly: I am agile in how I run this. The structure is fixed but the application is yours. If your priority shifts between now and September, we adjust.

Classes begin Friday 4 September. I will follow up shortly with the practical details on securing your place.

I am genuinely glad you are considering this. Do reply if anything is on your mind in the meantime.

Warm regards,

Emmanuel

Dr. Emmanuel Tarfa
Partner, Enzo Krypton
Facilitator, JUMP 2026 - Strategy & Innovation Genius Track
emmanueltarfa@gmail.com
`,
    html: `<div style="font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.65;color:#1a1a1a;max-width:600px">
  <p style="background:#FBF9F5;border-left:3px solid #1F4E79;padding:10px 14px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#1F4E79;margin:0 0 28px">Test preview &mdash; this is the letter Abigail would receive</p>
  <p>Dear Abigail,</p>
  <p>Thank you for registering for JUMP 2026. I wanted to write to you myself rather than let an automated message do it, because you were among the very first to put your name forward and that deserves a proper acknowledgement.</p>
  <p>I have read what you wrote about Sheinvest Consulting. You are in the early days of building, and you work as an Expert &mdash; your knowledge and judgement are the product. That is a particular kind of business to grow, and it comes with a particular set of constraints that we will get into.</p>
  <p>Your registration is received and confirmed on my side. What happens next is that I will come back to you with a fuller diagnosis of where I think your specific bottleneck sits, and we will talk about what success looks like for Sheinvest by the end of the programme. I want to hear your definition before I offer mine.</p>
  <p>I should say plainly: I am agile in how I run this. The structure is fixed but the application is yours. If your priority shifts between now and September, we adjust.</p>
  <p>Classes begin Friday 4 September. I will follow up shortly with the practical details on securing your place.</p>
  <p>I am genuinely glad you are considering this. Do reply if anything is on your mind in the meantime.</p>
  <p style="margin-top:28px">Warm regards,</p>
  <p style="margin:0 0 18px"><strong>Emmanuel</strong></p>
  <div style="border-top:1px solid #ddd6c9;padding-top:14px;font-family:Helvetica,Arial,sans-serif;font-size:13px;line-height:1.6;color:#555">
    Dr. Emmanuel Tarfa<br>
    Partner, Enzo Krypton<br>
    Facilitator, JUMP 2026 &mdash; Strategy &amp; Innovation Genius Track<br>
    <a href="mailto:emmanueltarfa@gmail.com" style="color:#1F4E79">emmanueltarfa@gmail.com</a>
  </div>
</div>`,
  };

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  console.log('SEND HTTP', res.status);
  console.log(JSON.stringify(json, null, 2));
}

main().catch((e) => {
  console.error('FAILED:', e);
  process.exit(1);
});
