# SaaS Automation Platform

A full-stack platform for purchasing and managing automation services for WhatsApp, Website Chatbot, Instagram, and TikTok.

## Features

- User registration and authentication
- Service selection and pricing
- Payment integration with Paystack
- Dashboard with purchased services
- Admin panel for viewing users and payments

## Tech Stack

- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Frontend**: HTML, CSS, JavaScript
- **Authentication**: JWT
- **Payment**: Paystack

## Setup Instructions

1. **Clone the repository** (or navigate to the project folder)

2. **Setup**:
   - Copy `.env.example` to `.env` and fill in the values:
     ```
     MONGODB_URL=mongodb://localhost:27017/saas-automation
     JWT_SECRET=your_jwt_secret_here
     PAYSTACK_SECRET_KEY=your_paystack_secret_key
     PAYSTACK_PUBLIC_KEY=your_paystack_public_key
     PORT=5000
     ```
   - Install dependencies: `npm install`
   - Start the server: `npm start` or `npm run dev`

3. **Access the application**:
   - Open `http://localhost:5000` in your browser to access the landing page

4. **Database**:
   - Ensure MongoDB is running locally or update MONGODB_URL to your MongoDB instance

5. **Payment**:
   - Sign up for Paystack and get your keys
   - Update the keys in `.env`
   - In `frontend/public/js/paystack.js`, replace the public key placeholder

## Usage

- Register or login
- Select automation services
- Proceed to payment
- View purchased services on dashboard

## API Endpoints

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/payments/purchases` - Get user purchases
- `GET /api/admin/users` - Get all users (admin)
- `GET /api/admin/purchases` - Get all purchases (admin)

## Security

- Passwords are hashed with bcrypt
- JWT tokens for authentication
- Input validation
- CORS enabled

## Notes

- For production, serve the frontend with a proper web server
- Add role-based access for admin features
- Implement proper error handling and logging