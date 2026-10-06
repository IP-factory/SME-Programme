import { replaceParticipantPortalLink } from "./server/participantAuth.ts";

const enzoRegistrationId = 600001;
const request = {
  protocol: "https",
  headers: {
    host: "emmanueltarfa.com",
    "x-forwarded-proto": "https",
  },
  get(name) {
    return this.headers[name.toLowerCase()];
  },
};

const url = await replaceParticipantPortalLink(enzoRegistrationId, request);
console.log(url);
