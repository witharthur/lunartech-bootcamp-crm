AI-Powered Bootcamp Applicant CRM
Full-stack CRM managing bootcamp applications with AI-powered Q&A and automated workflows.
Features

Lead Capture: Application form with instant confirmation
FAQ AI Agent: RAG-powered chatbot answering common questions
Pipeline Management: Auto-progression (New → Ready → Paid → Scheduled)
Admin Dashboard: Lead tracking and interaction logs
Payment & Scheduling: Mock payment processing and onboarding calls

Quick Start
Prerequisites

Node.js 16+
PostgreSQL
OpenAI API key

# Clone and install
git clone https://github.com/witharthur/lunartech-bootcamp-crm
cd lunartech
npm run install:all

# Configure environment
cp .env.example .env
# Edit .env with your API keys

# Setup database
npm run db:setup
npm run db:seed

# Start application
npm run dev

Usage
For Applicants

Fill application form at /apply
Ask questions using FAQ chatbot
Complete payment when ready
Schedule onboarding call

For Admins

View all leads at /admin
Track pipeline progression
Review FAQ interactions
Monitor funnel analytics

Environment Variables
envDATABASE_URL=postgresql://user:pass@localhost:5432/crm
OPENAI_API_KEY=your_openai_key
STRIPE_SECRET_KEY=sk_test_your_stripe_key
PORT=3001
FRONTEND_URL=http://localhost:3000
Testing
bashnpm test                    # Run all tests
npm run test:integration   # Integration tests
npm run db:seed           # Generate test data
Use Stripe test card: 4242 4242 4242 4242
Pipeline Stages

New: Initial application
Ready: Qualified for payment
Paid: Payment completed
Scheduled: Onboarding booked

Tech Stack

Frontend: React 
Backend: Node.js + Express
Database: PostgreSQL
AI: OpenAI API (RAG)
Payment: Stripe (test mode)
=======
# lunartech
This repository initialized.
>>>>>>> 9673f251c9d61005c16ab3bbebb483ba648375ff
