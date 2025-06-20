# Box V2 Webhooks Demo

Webhooks let platforms like Box automatically notify your server when something important happens - like a file upload, a comment, or a task assignment. Instead of constantly polling for changes, your app can "listen" for events and respond in real time.

This is a lightweight [Express](https://expressjs.com/) server built to receive and verify [Box API webhook events](https://developer.box.com/guides/webhooks/). It’s designed as a hands-on learning tool for developers who want to:

- Understand how Box [v2 webhooks](https://developer.box.com/guides/webhooks/v2/) work
- Learn how to securely [verify webhook signatures](https://developer.box.com/guides/webhooks/v2/signatures-v2/)
- Explore both the [official SDK](https://github.com/box/box-node-sdk) and manual HMAC verification
- View webhook payloads in real time with clean, formatted output

---

## Setup

### 1. Install dependencies

After cloning the repository, navigate to the project root and run:

```bash
npm install
```

### 2. Start an ngrok tunnel

Follow the [official ngrok setup guide](https://ngrok.com/docs/getting-started/) to install and authenticate ngrok.

Ngrok lets you create a publicly accessible URL that tunnels to a port on your local machine. This is required so Box can reach your webhook server.

By default, the Express server in this demo runs on port `8080`, so you can start ngrok with:

```
ngrok http 8080
```

### 3. Create a `.env` file

Copy the included `.env.sample` file and rename it to `.env`:

```bash
cp .env.sample .env
```

Then fill in the following values:

```env
PORT=8080
PRIMARY_KEY=your_primary_signature_key
SECONDARY_KEY=your_secondary_signature_key
```

Set `PORT` to any available local port. This is the port your Express server will listen on for incoming webhook events from Box.

You can find your signature keys in the [Box Developer Console](https://app.box.com/developers/console) by selecting your app, then navigating to **Webhooks** → **Manage Signature Keys**.

---

## Usage (receiving events from Box)

### 1. Start the webhook server

```
npm run dev
```

This will start the Express server locally (default: port `8080`).

### 2. Configure the webhook

1. Go to the [Box Developer Console](https://app.box.com/developers/console) and select your app
2. Under **Webhooks**, click **Create Webhook** → **V2**
3. In the **URL Address** field, enter your public ngrok forwarding URL:

```
https://your-ngrok-url.ngrok-free.app/receiveWebhook
```

> Important: Do not use http://localhost:8080. Box needs a public URL to reach your local server. Replace localhost:8080 with your unique ngrok forwarding domain followed by /receiveWebhook
> Example: https://0d88-71-123-53-94.ngrok-free.app/receiveWebhook

4. Choose a **Content Type** (e.g., file or folder) to monitor, with one or more triggers (e.g., file uploaded, comment created)

### 3. Trigger the event

Make a change to the target content (e.g., upload a file or add a comment). This should trigger the webhook and send a request to your server.

### 4. View received events in your console

Your terminal will log a pretty-printed JSON payload with details about the webhook event!

---

## Signature verification

This app supports two ways to verify webhook signatures:

### Using the Box SDK (default)

```js
const isValid = Box.validateWebhookMessage(
  body,
  headers,
  primaryKey,
  secondaryKey
);
```

### Manually (toggle in code)

Comment the above line, then uncomment _this_ line in `server.js` to switch to manual validation:

```js
const isValid = verifySignatureManually(
  body,
  headers,
  primaryKey,
  secondaryKey
);
```

This uses `crypto.createHmac()` with the Box-provided signing algorithm.

---

## Example webhook payload

Below is an example of an event that is sent to the server when an event happens. See [Webhook (V2) Payload](https://developer.box.com/reference/resources/webhook-invocation/) for schema properties.

```json
{
  "type": "webhook_event",
  "id": "REDACTED_EVENT_ID",
  "created_at": "2025-06-22T19:37:32-07:00",
  "trigger": "FOLDER.RENAMED",
  "webhook": {
    "id": "REDACTED_WEBHOOK_ID",
    "type": "webhook"
  },
  "created_by": {
    "type": "user",
    "id": "USER_ID",
    "name": "John Doe",
    "login": "user@example.com"
  },
  "source": {
    "id": "FOLDER_ID",
    "type": "folder",
    "sequence_id": "42",
    "etag": "42",
    "name": "New Folder Name",
    "created_at": "2025-06-19T18:48:25-07:00",
    "modified_at": "2025-06-22T19:37:32-07:00",
    "description": "",
    "size": 44627,
    "path_collection": {
      "total_count": 1,
      "entries": [
        {
          "type": "folder",
          "id": "0",
          "sequence_id": null,
          "etag": null,
          "name": "All Files"
        }
      ]
    },
    "created_by": {
      "type": "user",
      "id": "USER_ID",
      "name": "John Doe",
      "login": "user@example.com"
    },
    "modified_by": {
      "type": "user",
      "id": "USER_ID",
      "name": "John Doe",
      "login": "user@example.com"
    },
    "trashed_at": null,
    "purged_at": null,
    "content_created_at": "2025-06-19T18:48:25-07:00",
    "content_modified_at": "2025-06-22T19:37:32-07:00",
    "owned_by": {
      "type": "user",
      "id": "USER_ID",
      "name": "John Doe",
      "login": "user@example.com"
    },
    "shared_link": null,
    "folder_upload_email": null,
    "parent": {
      "type": "folder",
      "id": "0",
      "sequence_id": null,
      "etag": null,
      "name": "All Files"
    },
    "item_status": "active"
  },
  "additional_info": {
    "old_name": "Old Folder Name"
  }
}
```

---

## Building on this foundation.

This webhook listener can serve as a starting point for enterprise-grade integrations. Here are a few examples of how teams could extend it:

- Reporting – Log events to a centralized database to generate audit trails or usage summaries for compliance or analytics
- Syncing – Mirror file or folder changes in other systems (e.g., CRMs, project management tools, or document repositories) to maintain consistency
- Automation – Trigger downstream workflows like task assignment, alerting, or classification when key content changes occur

---

## About the author

I’m a developer advocate who loves turning complex technical workflows into approachable, real-world demos. I built this project to better understand Box’s developer platform — and to share what I learned with others. Feel free to fork, remix, or reach out 🤙

---

## Resources

- [Box Webhooks guide](https://developer.box.com/guides/webhooks/)
- [Signature Verification](https://developer.box.com/guides/webhooks/using/verify-signatures/)
- [Box Node SDK](https://github.com/box/box-node-sdk)

---

## License

MIT – use it, learn from it, and build something awesome.
