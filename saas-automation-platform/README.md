# SaaS Automation Platform

A professional WhatsApp automation backend for receiving inbound messages, applying per-user rules, and sending replies through the Meta WhatsApp Cloud API.

## Features

- User registration and authentication
- WhatsApp connection management with Meta credentials
- Per-user rule engine for trigger and response matching
- Inbound webhook receiver for Meta WhatsApp events
- Outbound message sender for instant replies
- Payment integration with Paystack
- Admin panel for viewing users and payments

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: JWT
- **WhatsApp**: Meta WhatsApp Cloud API
- **Payment**: Paystack

## Setup Instructions

1. **Clone the repository** and install dependencies:
   - `npm install`

2. **Create your environment file**:
   - Copy `.env.example` to `.env`
   - Fill in the values for MongoDB, JWT, Paystack, and Meta WhatsApp credentials.

3. **Start the server**:
   - `npm start` or `npm run dev`

4. **Access the app**:
   - Open `http://localhost:5000` in your browser.

5. **WhatsApp configuration**:
   - Create a Meta WhatsApp Business account.
   - Obtain your Phone Number ID and Access Token from Meta.
   - Set the webhook URL to `https://your-domain.com/webhook`.
   - Configure the verify token using `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

## WhatsApp Automation Flow

1. A user sends a message in WhatsApp.
2. Meta sends the event to your webhook.
3. The backend finds the matching WhatsApp connection and the user’s rules.
4. The automation engine selects the best reply.
5. The backend sends the reply back through the Meta API.

## API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/purchases` - Get user purchases
- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/purchases` - Get all purchases (admin)
- `POST /api/whatsapp/connect` - Save Meta WhatsApp connection credentials
- `GET /api/whatsapp/connection` - Fetch WhatsApp connection details
- `POST /api/whatsapp/rules` - Create a rule for a user
- `GET /api/whatsapp/rules` - List rules for a user
- `DELETE /api/whatsapp/rules/:id` - Delete a rule
- `GET /webhook` - Meta webhook verification
- `POST /webhook` - Receive inbound WhatsApp messages

## Security

- Passwords are hashed with bcrypt
- JWT tokens are used for authentication
- Input validation is enabled
- CORS is enabled

## Notes

- For production, deploy the app behind HTTPS so the webhook is publicly reachable.
- Use a managed MongoDB instance in production.
- Add role-based access for admin features if needed.