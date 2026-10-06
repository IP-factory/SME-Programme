import { BRAND } from "./brand";
export const PAYMENT_INSTRUCTION_TEMPLATE_IDS = ["nigeria_access_bank", "north_america", "uk_wise"] as const;

export type PaymentInstructionTemplateId = (typeof PAYMENT_INSTRUCTION_TEMPLATE_IDS)[number];

type PaymentInstructionTemplate = {
  id: PaymentInstructionTemplateId;
  label: string;
  routeLabel: string;
  subject: string;
  render: (firstName: string, appOrigin: string) => string;
};

const NIGERIA_ACCESS_BANK_TEMPLATE: PaymentInstructionTemplate = {
  id: "nigeria_access_bank",
  label: "Nigeria — NGN via Access Bank",
  routeLabel: "NGN / Nigeria",
  subject: `${BRAND.programmeName} — Nigeria payment instructions`,
  render: (firstName) => `Dear ${firstName},

I trust this meets you well.

Thank you for your decision to move forward with ${BRAND.programmeName}. I am delighted to welcome you, and I look forward to a successful engagement.

For a Nigeria Naira transfer, kindly use the Access Bank details below:

Account name: EMMANUEL TARFA
Account number: 0021722315
Bank: Access Bank Nigeria

Kindly use your name as the transfer reference where possible. Once payment has been made, please submit the receipt through your ${BRAND.programmeShortName} portal or send confirmation by email.

Warm regards,
${BRAND.facilitatorName}`,
};

const NORTH_AMERICA_TEMPLATE: PaymentInstructionTemplate = {
  id: "north_america",
  label: "North America — USD via Paystack",
  routeLabel: "USD / North America",
  subject: `${BRAND.programmeName} — North America payment instructions`,
  render: (firstName, appOrigin) => `Dear ${firstName},

I trust this meets you well.

Thank you for your decision to move forward with ${BRAND.programmeName}. I am delighted to welcome you, and I look forward to a successful engagement.

For North America, kindly use the approved Paystack checkout route in the secure ${BRAND.programmeShortName} Payment tab:

${appOrigin}/portal?tab=payment

Select the Paystack row that matches your pathway and payment option. The table includes the approved commitment and full-payment amounts, including the 10% full-payment discount. Kindly confirm the amount and currency at checkout before paying. If you experience any difficulty or restriction, please pause and email ${BRAND.facilitatorFirstName} before continuing.

Warm regards,
${BRAND.facilitatorName}`,
};

const UK_WISE_TEMPLATE: PaymentInstructionTemplate = {
  id: "uk_wise",
  label: "United Kingdom — GBP via Wise",
  routeLabel: "GBP / United Kingdom",
  subject: `${BRAND.programmeName} — U.K. payment instructions`,
  render: (firstName) => `Dear ${firstName},

I trust this meets you well.

Thank you for your decision to move forward with ${BRAND.programmeName}. I am delighted to welcome you, and I look forward to a successful engagement.

For your U.K. payment route, I receive GBP payments through Wise. Kindly use the account details below:

Account name: Emmanuel Tarfa
Account number: 18538812
Sort code: 60-84-64
IBAN: GB64 TRWI 6084 6418 5388 12
Swift/BIC: TRWIGB2LXXX
Bank name and address: Wise Payments Limited, Worship Square, 65 Clifton Street, London, EC2A 4JE, United Kingdom

For payments sent from within the United Kingdom, kindly use the account number and sort code. For payments sent from outside the United Kingdom, kindly use the IBAN and Swift/BIC.

If you experience any challenge using the platform or face any restriction while making the payment, kindly let me know and I will be happy to assist.

Warm regards,
${BRAND.facilitatorName}`,
};

const PAYMENT_INSTRUCTION_TEMPLATES: Record<PaymentInstructionTemplateId, PaymentInstructionTemplate> = {
  nigeria_access_bank: NIGERIA_ACCESS_BANK_TEMPLATE,
  north_america: NORTH_AMERICA_TEMPLATE,
  uk_wise: UK_WISE_TEMPLATE,
};

export function getPaymentInstructionTemplate(templateId: PaymentInstructionTemplateId) {
  return PAYMENT_INSTRUCTION_TEMPLATES[templateId];
}

export function paymentInstructionTemplateLibrary() {
  return PAYMENT_INSTRUCTION_TEMPLATE_IDS.map((id) => {
    const template = getPaymentInstructionTemplate(id);
    return { id: template.id, label: template.label, routeLabel: template.routeLabel };
  });
}

export function firstNameFromFullName(fullName: string) {
  return fullName.trim().split(/\s+/)[0] || "there";
}

/** `appOrigin` is the deployment's public origin, used for portal links in the message. */
export function renderPaymentInstruction(templateId: PaymentInstructionTemplateId, fullName: string, appOrigin: string) {
  const template = getPaymentInstructionTemplate(templateId);
  return { subject: template.subject, body: template.render(firstNameFromFullName(fullName), appOrigin) };
}
