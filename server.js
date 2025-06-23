const crypto = require("crypto");

const express = require("express");
const bodyParser = require("body-parser");
const Box = require("box-node-sdk");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;

// Load HMAC signature keys from environment variables
const primaryKey = process.env.PRIMARY_KEY;
const secondaryKey = process.env.SECONDARY_KEY;

// Use raw body to preserve the original payload (needed for signature validation)
app.use(bodyParser.raw({ type: "*/*" }));

// Manual signature verification
// Docs: https://developer.box.com/guides/webhooks/v2/signatures-v2/#manual-signature-verification
function verifySignatureManually(rawBody, headers, primaryKey, secondaryKey) {
  const timestamp = headers["box-delivery-timestamp"];
  const sigPrimary = headers["box-signature-primary"];
  const sigSecondary = headers["box-signature-secondary"];

  // Check for missing components
  if (!timestamp || !sigPrimary || !primaryKey) {
    console.warn("Missing required signature components.");
    return false;
  }

  // Reject webhook if timestamp is too old or invalid (protects against replay attacks)
  const age = Date.now() - Date.parse(timestamp);
  if (isNaN(age) || age > 10 * 60 * 1000) {
    console.warn("Timestamp is too old or invalid.");
    return false;
  }

  // Helper to compute HMAC digest using provided key and timestamp
  function computeDigest(key) {
    const hmac = crypto.createHmac("sha256", key);
    hmac.update(rawBody);
    hmac.update(timestamp);
    return hmac.digest("base64");
  }

  // Compute HMAC digests using both primary and (optional) secondary keys
  const digestPrimary = computeDigest(primaryKey);
  const digestSecondary = secondaryKey ? computeDigest(secondaryKey) : null;

  // Use constant-time comparison to prevent timing attacks
  function safeEqual(a, b) {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }

  // Compare computed digests to the signatures from the request headers
  const matchesPrimary = safeEqual(digestPrimary, sigPrimary);
  const matchesSecondary =
    digestSecondary && sigSecondary
      ? safeEqual(digestSecondary, sigSecondary)
      : false;

  // Return true if either the primary or secondary signature matches
  return matchesPrimary || matchesSecondary;
}

// Handle incoming webhook events from Box
app.post("/receiveWebhook", (req, res) => {
  // Convert raw body buffer to string
  const body = req.body.toString("utf8");

  // Extract Box-specific headers for signature validation
  // Docs: https://developer.box.com/guides/webhooks/v2/#payload-headers
  const headers = {
    "box-delivery-id": req.get("box-delivery-id"),
    "box-delivery-timestamp": req.get("box-delivery-timestamp"),
    "box-signature-algorithm": req.get("box-signature-algorithm"),
    "box-signature-primary": req.get("box-signature-primary"),
    "box-signature-secondary": req.get("box-signature-secondary"),
    "box-signature-version": req.get("box-signature-version"),
  };

  // Use the Box SDK's signature verification method
  // Docs: https://github.com/box/box-node-sdk/blob/main/docs/webhooks.md#validate-a-webhook-message
  const isValid = Box.validateWebhookMessage(
    body,
    headers,
    primaryKey,
    secondaryKey
  );

  // To test manual signature verification instead, comment out `isValid` above
  // and uncomment `isvalid` below:
  // const isValid = verifySignatureManually(
  //   body,
  //   headers,
  //   primaryKey,
  //   secondaryKey
  // );

  // Return a 400 Bad Request if invalid
  if (!isValid) {
    console.log("Invalid webhook signature");
    return res.status(400).send("Invalid signature");
  }

  // Signature is valid — log the event in a readable format
  console.log("Webhook signature verified.");
  console.log("────────────────────────────────────────────");
  console.log("Webhook event received:");
  console.log(JSON.stringify(JSON.parse(body), null, 2));
  console.log("────────────────────────────────────────────\n");
  res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Webhook server listening on port ${PORT}`);
});
