import { BRAND } from "../shared/brand";
export type ParticipantPackage = "Foundation" | "Engine Room" | "Boardroom";

type PrivatePaymentRoute = {
  id: "nigeria_access_bank" | "uk_wise" | "north_america";
  eyebrow: string;
  title: string;
  details: Array<{ label: string; value: string }>;
  note: string;
};

type PaystackPaymentOption = {
  packageName: ParticipantPackage;
  lineItem: "Commitment" | "Full payment (10% discount)";
  naira: string;
  usd: string;
  url: string;
};

const PAYSTACK_PAYMENT_OPTIONS: PaystackPaymentOption[] = [
  { packageName: "Foundation", lineItem: "Commitment", naira: "₦350,000", usd: "$250.00", url: "https://paystack.shop/pay/sm7k5rn3ql" },
  { packageName: "Foundation", lineItem: "Full payment (10% discount)", naira: "₦517,500", usd: "$369.90", url: "https://paystack.shop/pay/rklvj6ssz2" },
  { packageName: "Engine Room", lineItem: "Commitment", naira: "₦350,000", usd: "$250.00", url: "https://paystack.shop/pay/b8zgluv9j3" },
  { packageName: "Engine Room", lineItem: "Full payment (10% discount)", naira: "₦787,500", usd: "$562.50", url: "https://paystack.shop/pay/ghptqiitwh" },
  { packageName: "Boardroom", lineItem: "Commitment", naira: "₦600,000", usd: "$428.40", url: "https://paystack.shop/pay/udn97fzul-" },
  { packageName: "Boardroom", lineItem: "Full payment (10% discount)", naira: "₦1,350,000", usd: "$963.90", url: "https://paystack.shop/pay/5o7l3kq66m" },
];

const PACKAGE_PAYMENT = {
  Foundation: { total: 575_000, commitment: 230_000, instalment: 172_500, fullUpfront: 517_500 },
  "Engine Room": { total: 875_000, commitment: 350_000, instalment: 262_500, fullUpfront: 787_500 },
  Boardroom: { total: 1_500_000, commitment: 600_000, instalment: 450_000, fullUpfront: 1_350_000 },
} as const;

function formatNaira(value: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Payment terms and receiving details are disclosed only inside an authenticated participant portal. */
export function getPrivatePaymentGuidance(packageName: ParticipantPackage, fullName: string) {
  const fee = PACKAGE_PAYMENT[packageName];
  const paymentRoutes: PrivatePaymentRoute[] = [
    {
      id: "north_america",
      eyebrow: "North America · USD",
      title: "Paystack",
      details: [
        { label: "Payment route", value: "Paystack online checkout" },
        { label: "How to pay", value: "Choose the Paystack row above that matches your pathway and payment option." },
      ],
      note: "The Paystack table above contains the approved commitment and full-payment checkout links for Foundation, Engine Room and Boardroom. Kindly confirm the amount and currency at checkout before paying.",
    },
    {
      id: "nigeria_access_bank",
      eyebrow: "Nigeria · Naira",
      title: "Access Bank Nigeria",
      details: [
        { label: "Account name", value: "EMMANUEL TARFA" },
        { label: "Account number", value: "0021722315" },
        { label: "Bank", value: "Access Bank Nigeria" },
      ],
      note: `For Naira transfers, kindly use your name as the transfer reference where possible. If you need support before making payment, please email ${BRAND.facilitatorFirstName}.`,
    },
    {
      id: "uk_wise",
      eyebrow: "United Kingdom · GBP",
      title: "Wise Payments Limited",
      details: [
        { label: "Account name", value: "Emmanuel Tarfa" },
        { label: "Account number", value: "18538812" },
        { label: "Sort code", value: "60-84-64" },
        { label: "IBAN", value: "GB64 TRWI 6084 6418 5388 12" },
        { label: "Swift/BIC", value: "TRWIGB2LXXX" },
      ],
      note: "For transfers within the United Kingdom, use the account number and sort code. For transfers from outside the United Kingdom, use the IBAN and Swift/BIC.",
    },
  ];
  return {
    packageName,
    paymentStatus: "awaiting" as const,
    structure: "40/30/30" as const,
    paystackOptions: PAYSTACK_PAYMENT_OPTIONS,
    fullProgrammeFee: formatNaira(fee.total),
    commitmentPayment: formatNaira(fee.commitment),
    firstInstalment: formatNaira(fee.instalment),
    secondInstalment: formatNaira(fee.instalment),
    fullUpfrontFee: formatNaira(fee.fullUpfront),
    fullUpfrontNote: `The full-upfront option applies a 10% discount to the full ${packageName} programme fee. Kindly use the private payment route below that is most suitable for you.`,
    paymentInstructions: `These payment instructions are visible only inside your authenticated ${BRAND.programmeShortName} portal. Kindly use your name as the transfer reference where possible.`,
    paymentRoutes,
    confirmationNote: "After making payment using one of the private routes below, submit your receipt here so the programme office can confirm your place and open eligible session scheduling.",
  };
}
