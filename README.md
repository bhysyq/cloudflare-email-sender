# Free Email Sender API

Free and open source email sending API with Cloudflare workers and email forwarding.

> Due Cloudflare limitations, with this API you can only send email to [verified email addresses](https://developers.cloudflare.com/email-routing/setup/email-routing-addresses/#destination-addresses).

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/bhysyq/cloudflare-email-sender)

## Features

- **Send Emails**: Send emails by making a `POST` request to the `/send` endpoint.
- **Authorization**: Secures the endpoint with a Bearer token.
- **JSON Payload**: Accepts email details (`from`, `to`, `subject`, `content`) in JSON format.
- **Smart Content Detection**: Automatically detects HTML content and sets appropriate content type.
- **Flexible Sender Configuration**: Optional sender name and email with fallback to environment variables.
- **Content Type Validation**: Validates MIME content types for security.

## Prerequisites

- [Cloudflare Account](https://dash.cloudflare.com/sign-up)
- [Cloudflare Workers](https://workers.cloudflare.com/)

## Setup

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/cloudflare-email-sender.git
cd cloudflare-email-sender
```

### 2. Install Dependencies

If you're using modules or packages, install them accordingly.

### 3. Configure Wrangler

Update the `wrangler.toml` file:

- Replace `"email-sender"` with your desired worker name.
- Replace `"TODO_UPDATE_AUTH_TOKEN"` with a secure token for authorization or set manually the `AUTH_TOKEN` environment variable.
- Replace `"TODO_UPDATE_SENDER_NAME"` with your email address or the destination configured in Cloudflare Email Routing.
- Replace `"TODO_UPDATE_SENDER_EMAIL"` with your desired sender name.

### 4. Set Up Environment Variables

The following variables are used in your `wrangler.toml` under `[vars]`:

- `AUTH_TOKEN`: Used to validate incoming requests
- `SENDER_EMAIL`: Default sender email address (used when `from` is not provided in request)
- `SENDER_NAME`: Default sender name (used when `senderName` is not provided in request)

### 5. Bind the Email Service

The `EMAIL` binding is required to use Cloudflare's email service. Ensure you have Email Routing set up in your Cloudflare dashboard.

## Deployment

### Option 1: Deploy to Cloudflare Workers (Recommended)

Click the "Deploy to Cloudflare Workers" button above for one-click deployment.

### Option 2: Manual Deployment

Deploy the worker using Wrangler:

```bash
wrangler publish
```

## Usage

### Endpoint

- **URL**: `https://your-worker-domain/send`
- **Method**: `POST`
- **Headers**:
  - `Authorization: Bearer your_authorization_token`
  - `Content-Type: application/json`
- **Body**:

  ```json
  {
    "from": "sender@example.com",        // Optional - uses SENDER_EMAIL if not provided
    "to": "recipient@example.com",       // Required
    "subject": "Hello World",            // Required
    "content": "<h1>It works!</h1>",     // Required (renamed from 'html')
    "senderName": "Your Name",           // Optional - uses SENDER_NAME if not provided
    "contentType": "text/html"           // Optional - auto-detected if not provided
  }
  ```

### Example Request

```bash
curl -X POST https://your-worker-domain/send \
  -H "Authorization: Bearer your_authorization_token" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "recipient@example.com",
    "subject": "Hello World",
    "content": "<h1>It works!</h1><p>This is HTML content</p>",
    "from": "sender@example.com",
    "senderName": "Your Name",
    "contentType": "text/html"
  }'
```

### Parameter Details

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `to` | string | Yes | Recipient email address |
| `subject` | string | Yes | Email subject |
| `content` | string | Yes | Email content (HTML or plain text) |
| `from` | string | No | Sender email (uses `SENDER_EMAIL` env var if not provided) |
| `senderName` | string | No | Sender name (uses `SENDER_NAME` env var, then `from` email if not provided) |
| `contentType` | string | No | MIME content type (auto-detected if not provided) |

### Supported Content Types

- `text/plain` - Plain text content
- `text/html` - HTML content

### Responses

- **200 OK**: Email sent successfully.
- **400 Bad Request**: Missing required fields, invalid JSON, missing "from" parameter, or invalid contentType.
- **401 Unauthorized**: Missing or malformed `Authorization` header.
- **403 Forbidden**: Invalid authorization token.
- **404 Not Found**: Endpoint not found.
- **405 Method Not Allowed**: HTTP method not allowed.
- **500 Internal Server Error**: An error occurred on the server.

## License

This project is licensed under the MIT License.
