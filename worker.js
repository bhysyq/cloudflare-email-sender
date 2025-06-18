import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === '/send') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }

      const authHeader = request.headers.get('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return new Response('Unauthorized', { status: 401 });
      }

      const token = authHeader.slice('Bearer '.length).trim();
      if (token !== env.AUTH_TOKEN) {
        return new Response('Forbidden', { status: 403 });
      }

      let data;
      try {
        data = await request.json();
      } catch (e) {
        return new Response('Bad Request: Invalid JSON', { status: 400 });
      }

      const { from, to, subject, content, contentType, senderName } = data;
      if (!to || !subject || !content) {
        return new Response('Bad Request: Missing required fields', { status: 400 });
      }

      // Handle 'from' parameter - make it optional
      const fromEmail = from || env.SENDER_EMAIL;
      if (!fromEmail) {
        return new Response('Bad Request: Missing "from" parameter', { status: 400 });
      }

      // Validate contentType if provided
      if (contentType && !isValidContentType(contentType)) {
        return new Response('Bad Request: Invalid contentType. Must be a valid MIME type like "text/plain" or "text/content"', { status: 400 });
      }

      // Handle sender name - get from request first, then env, then use from email
      const finalSenderName = senderName || env.SENDER_NAME || fromEmail;

      try {
        await sendEmail(env, fromEmail, to, subject, content, contentType, finalSenderName);
        return new Response('Email sent successfully');
      } catch (e) {
        return new Response(`Internal Server Error: ${e.message}`, { status: 500 });
      }
    } else {
      return new Response('Endpoint not found', { status: 404 });
    }
  }
};

// Validate MIME content type
function isValidContentType(contentType) {
  // Basic MIME type validation pattern
  const mimeTypePattern = /^[a-zA-Z0-9!#$&\-\^_]*\/[a-zA-Z0-9!#$&\-\^_]*(\s*;\s*[a-zA-Z0-9!#$&\-\^_]*=[a-zA-Z0-9!#$&\-\^_]*)*$/;
  
  // Common email content types
  const allowedTypes = [
    'text/plain',
    'text/html',
  ];
  
  // Check if it's a valid MIME type format
  if (!mimeTypePattern.test(contentType)) {
    return false;
  }
  
  // Check if it's in our allowed list (for security)
  return allowedTypes.includes(contentType.toLowerCase());
}

async function sendEmail(env, from, to, subject, content, contentType, senderName) {
  const rawMessage = createMimeMessage();
  rawMessage.setSender({ name: senderName, addr: from });
  rawMessage.setRecipient(to);
  rawMessage.setSubject(subject);
  
  // Intelligent content type detection
  let finalContentType = 'text/plain';
  
  if (contentType) {
    // Use provided contentType if available
    finalContentType = contentType;
  } else {
    // Auto-detect HTML content
    const htmlPattern = /<[^>]*>/;
    if (htmlPattern.test(content)) {
      finalContentType = 'text/html';
    }
  }
  
  rawMessage.addMessage({
    contentType: finalContentType,
    data: content
  });

  const message = new EmailMessage(
    from,
    to,
    rawMessage.asRaw()
  );

  await env.EMAIL.send(message);
}
