AI-Powered Bootcamp Applicant CRM
A full-stack application that manages bootcamp applicant journeys from initial application through nurturing, payment, and onboarding using AI-powered Q&A and automated workflows.
🚀 Features
Core Features

Lead Capture: Web form collecting applicant details (name, email, phone, country, motivation)
FAQ AI Agent: RAG-powered chatbot answering common questions with confidence scoring
Pipeline Management: Automated stage progression (New → Ready → Paid → Scheduled)
Admin Dashboard: View and manage all leads with their current status
Interaction Logging: All FAQ sessions stored and summarized for admin review

Additional Features

Nurture Sequences: Automated follow-up messaging
Payment Gating: Mock payment processing with stage updates
Scheduling Integration: Onboarding call scheduling system
Analytics Dashboard: Funnel metrics and lead progression tracking

🏗️ Architecture
Tech Stack
Frontend: React.js with Tailwind CSS
Backend: Node.js with Express
Database: PostgreSQL / SQLite
AI/ML: OpenAI API for RAG implementation
Payment: Stripe (test mode)
Scheduling: Calendly integration

📋 Prerequisites
Node.js (v16+ recommended)
npm or yarn
PostgreSQL (or SQLite for development)
OpenAI API key
Stripe account (test mode)

🛠️ Installation & Setup
1. Clone the Repository
bashgit clone https://github.com/witharthur/lunartech-bootcamp-crm
cd ai-bootcamp-crm
2. Install Dependencies
bash# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
npm install
3. Environment Configuration
Copy the example environment file and configure your variables:
bashcp .env.example .env
Fill in your environment variables:
env# Database
DATABASE_URL=postgresql://username:password@localhost:5432/bootcamp_crm

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key

# Application
PORT=3001
FRONTEND_URL=http://localhost:3000
JWT_SECRET=your_jwt_secret_here

# Email (optional - for nurture sequences)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
4. Database Setup
bashcd backend
npm run db:migrate
npm run db:seed
5. Start the Application
Open two terminal windows:
Terminal 1 - Backend:
bashcd backend
npm run dev
Terminal 2 - Frontend:
bashcd frontend
npm start
The application will be available at:



🎮 Usage Guide
For Applicants

Apply: Fill out the application form at /apply
Get Confirmation: Receive immediate confirmation page and email
Ask Questions: Use the FAQ chatbot to get instant answers
Complete Payment: When ready, proceed to payment (test mode)
Schedule Onboarding: Book your onboarding call after payment

For Admins

View Dashboard: Access admin panel at /admin
Track Leads: Monitor all applicants and their pipeline stages
Review Interactions: See FAQ chat logs and escalations
Manage Pipeline: Manually update lead stages if needed
Analytics: View funnel metrics and conversion rates

🤖 FAQ Agent Usage
The AI agent can answer questions about:

Tuition and pricing
Prerequisites and requirements
Job guarantee and outcomes
Program duration and schedule
Application process
Technical requirements

Example Questions

"What are the prerequisites for the bootcamp?"
"How much does the program cost?"
"Do you offer a job guarantee?"
"What programming languages will I learn?"

Escalation Handling
If the AI has low confidence in an answer, it will:

Politely explain it needs human assistance
Log the question for admin review
Provide contact information for follow-up

📊 Pipeline Stages
StageDescriptionActions AvailableNewInitial application submittedSend nurture emails, FAQ accessReadyQualified and ready for paymentPayment processingPaidPayment completed successfullyScheduling accessScheduledOnboarding call scheduledPreparation materials
🧪 Testing
Run Tests
bash# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
Test Data
Use the seed script to generate sample leads:
bashcd backend
npm run db:seed
This creates 15-20 synthetic leads across different pipeline stages.
Test Payment
Use Stripe test card numbers:

Success: 4242 4242 4242 4242
Declined: 4000 0000 0000 0002

🎥 Demo Video
A 15-minute walkthrough video demonstrating:

Complete applicant journey from form submission to scheduling
FAQ agent interactions with various question types
Admin dashboard functionality
Pipeline progression and state management
Payment and scheduling flows

Link to Demo Video
🔒 Security & Compliance

✅ No sensitive data in repository
✅ Environment variables for all secrets
✅ GDPR-compliant consent handling
✅ Input validation and sanitization
✅ Rate limiting on API endpoints
✅ Synthetic test data only

🚀 Deployment
Environment Setup

Set up production database (PostgreSQL recommended)
Configure environment variables for production
Set up domain and SSL certificates

Docker Deployment
bashdocker-compose up -d
Manual Deployment
bash# Build frontend
cd frontend
npm run build

# Start backend
cd ../backend
npm start
🔧 Configuration
FAQ Knowledge Base
Edit faq.yml to customize the AI agent's knowledge base:
yamlfaqs:
  - question: "What are the prerequisites?"
    answer: "Basic computer literacy and motivation to learn..."
    keywords: ["prerequisites", "requirements", "qualifications"]
    confidence: 0.9
Pipeline Automation
Configure nurture sequences in backend/src/config/nurture.js:
javascriptconst sequences = {
  welcome: { delay: 0, template: 'welcome' },
  followup: { delay: 24 * 60 * 60 * 1000, template: 'followup' },
  reminder: { delay: 7 * 24 * 60 * 60 * 1000, template: 'reminder' }
};
🐛 Troubleshooting
Common Issues

Database Connection: Ensure PostgreSQL is running and credentials are correct
OpenAI API: Verify API key has sufficient credits and permissions
Port Conflicts: Check if ports 3000/3001 are available
CORS Issues: Ensure frontend URL is configured in backend CORS settings

Logs
Check application logs:
bash# Backend logs
cd backend
npm run logs

# Database logs
tail -f /var/log/postgresql/postgresql.log
📈 Future Enhancements
See docs/postmortem.md for detailed improvement plans:

Advanced lead scoring algorithms
Integration with CRM systems (HubSpot, Salesforce)
Multi-language support
Advanced analytics and reporting
Mobile app development
Webhook integrations



Built with ❤️ for LunarTech's AI Engineering Internship Program
