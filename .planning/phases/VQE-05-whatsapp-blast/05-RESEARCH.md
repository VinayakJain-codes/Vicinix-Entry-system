# Phase 5: WhatsApp Blast - Research

## Goal
Integration with Meta WhatsApp API to blast messages, handle rate limits (max 80/sec), and queue mechanisms.

## Tech Stack & Tooling
- **WhatsApp API**: Meta Cloud API for WhatsApp Business.
- **Throttling**: JavaScript `Promise` and `setTimeout`.
- **Backend**: Next.js Server Actions.

## Implementation Strategy

### 1. API Configuration
Need standard environment variables:
`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`.

The endpoint is `https://graph.facebook.com/v19.0/${WHATSAPP_PHONE_NUMBER_ID}/messages`.

### 2. Rate Limiting Logic
To stay under the 80 msgs/second limit (1 msg per 12.5ms), we enforce a hard 15ms delay loop.
```javascript
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (const student of studentsToBlast) {
  await sendWhatsAppMessage(student);
  await delay(15); 
}
```

### 3. Vercel Execution Limits
As discovered in Phase 4, serverless limits apply. Blasting 1,000 messages with 15ms delay takes ~15 seconds of pure waiting time, plus network latency (~100ms per request concurrently or sequentially).
Sequential sending of 1,000 messages will timeout (1,000 * 115ms = 115 seconds).
Instead, we should dispatch concurrent batches or rely on the client to orchestrate batches.
**Optimized approach**: Client requests a batch of 50 students. Server Action sends 50 messages (using `Promise.all` with staggered starts to respect 15ms limit) and updates the DB. This takes less than 2 seconds per batch. The client loops until all are sent.

### 4. Database Updates
Update the `qr_status` to `sent` for the successfully blasted students.

## Risks & Pitfalls
- **API Errors**: Phone numbers from the roster might be invalid or not on WhatsApp. We must handle Meta API 400 responses gracefully without halting the blast.
- **Template Approval**: Meta requires pre-approved templates. For testing and development, we assume the template is approved or we use a freeform message if within a 24-hour window (not applicable for bulk blasts, must use a template).

## Validation Architecture
- Verify the 15ms stagger logic prevents HTTP 429 Too Many Requests.
- Verify invalid numbers are marked as `failed` while valid ones are marked as `sent`.
