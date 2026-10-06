# Participant Portal Sign-In Loop — Mobile Evidence

The owner’s Enzo mobile test confirms that the permanent portal page correctly accepts the registered address and sends a fresh sign-in email. The fresh email is received and displays the intended secure-sign-in CTA. The failure therefore occurs after that CTA is opened: the session established by the one-time callback is not available to the subsequent `/portal` request in the mobile mail-app/browser hand-off.

The repair must keep the public landing-page Participant Sign In as the durable entry point, while making the authentication callback establish access in a way that survives the mobile hand-off. Participant invitations remain paused until the owner can complete landing-page sign-in, open one email link, and view the private portal.
