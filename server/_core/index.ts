import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { registerOAuthRoutes } from "./oauth";
import { handleScheduledReminder } from "../scheduledReminder";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import type { TrpcContext } from "./context";
import { getAuthenticatedParticipant } from "../participantAuth";
import { storagePut } from "../storage";
import { buildParticipantUploadKey, buildPaymentReceiptUploadKey, getParticipantUploadValidationError, participantUploadPolicy } from "../participantUploads";
import { serveStatic, setupVite } from "./vite";
import { applySecurityHeaders, requireTrustedBrowserOrigin } from "../security";
import multer from "multer";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  const server = createServer(app);
  app.use(applySecurityHeaders);
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ limit: "32kb", extended: true }));
  app.use("/api", requireTrustedBrowserOrigin);
  registerStorageProxy(app);
  registerOAuthRoutes(app);
  app.get(["/portal/authenticate", "/portal/access"], (_req, res) => {
    res.redirect(302, "/?participant_signin=1");
  });
  const participantUpload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: participantUploadPolicy.maxBytes, files: 1 },
  });

  app.post("/api/participant-upload", participantUpload.single("file"), async (req, res) => {
    try {
      const participant = await getAuthenticatedParticipant({ req, res, user: null } as TrpcContext);
      const file = req.file;
      if (!file) return res.status(400).json({ message: "Kindly select a file to upload." });
      const validationError = getParticipantUploadValidationError(file);
      if (validationError) return res.status(415).json({ message: validationError });
      const uploaded = await storagePut(
        buildParticipantUploadKey(participant.id, file.originalname),
        file.buffer,
        file.mimetype,
      );
      return res.status(201).json(uploaded);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload the file.";
      const status = error instanceof TRPCError && error.code === "UNAUTHORIZED" ? 401 : 500;
      console.warn("[Participant upload] Failed:", message);
      return res.status(status).json({ message: status === 401 ? "Kindly sign in to your participant portal again and try again." : "We could not store this file. Kindly try again shortly." });
    }
  });

  app.post("/api/payment-receipt-upload", participantUpload.single("file"), async (req, res) => {
    try {
      const participant = await getAuthenticatedParticipant({ req, res, user: null } as TrpcContext);
      const file = req.file;
      if (!file) return res.status(400).json({ message: "Kindly select a payment receipt to upload." });
      const validationError = getParticipantUploadValidationError(file);
      if (validationError) return res.status(415).json({ message: validationError });
      const uploaded = await storagePut(
        buildPaymentReceiptUploadKey(participant.id, file.originalname),
        file.buffer,
        file.mimetype,
      );
      return res.status(201).json(uploaded);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to upload the payment receipt.";
      const status = error instanceof TRPCError && error.code === "UNAUTHORIZED" ? 401 : 500;
      console.warn("[Payment receipt upload] Failed:", message);
      return res.status(status).json({ message: status === 401 ? "Kindly sign in to your participant portal again and try again." : "We could not store the receipt. Kindly try again shortly." });
    }
  });

  // Scheduled cron callback for 24-hour reminders
  app.post("/api/scheduled/sendReminder", handleScheduledReminder);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
