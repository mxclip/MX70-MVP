# MX70 - Performance-Based Micro-Influencer Marketplace

MX70 is an MVP for a performance-based micro-influencer marketplace platform that connects small businesses (starting with NYC eateries/stores) with "clippers" (content creators/editors) to create videos that drive exposure and potential ROI growth.

## 🎯 Key Features

### For Businesses
- **Post Gigs**: Create video projects with custom goals and story types
- **Upload Raw Footage**: Provide source material for content creators
- **Track Performance**: Monitor views, likes, and ROI metrics
- **Self-Promo Credits**: Earn credits through promotional posts
- **Escrow System**: Secure payment processing

### For Clippers (Content Creators)
- **Take Lessons**: Complete training modules on compelling content creation
- **Get Certified**: Pass quizzes to unlock gig claiming abilities
- **Claim Gigs**: Browse and claim available video editing opportunities
- **Performance Bonuses**: Earn base pay ($100) + tiered bonuses based on engagement
- **Dashboard Analytics**: Track earnings and performance metrics

## 🏗️ Tech Stack

- **Backend**: Python 3.10 with FastAPI
- **Frontend**: React 18 with Tailwind CSS
- **Database**: PostgreSQL
- **Authentication**: JWT tokens with bcrypt password hashing
- **Payments**: Stripe integration (stubbed for MVP)
- **Development**: Docker Compose for local setup

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd MX70
```

### 2. Environment Setup
```bash
# Copy environment template (backend)
cp backend/.env.example backend/.env

# Edit backend/.env with your settings if needed
# For local development, the defaults should work
```

### 3. Start the Application
```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

### 5. Create Your First Account
1. Navigate to http://localhost:3000
2. Click "Sign up"
3. Choose your role:
   - **Business Owner**: Post gigs and track performance
   - **Content Creator (Clipper)**: Take lessons and claim gigs

## 📖 User Workflows

### Business Workflow
1. **Sign Up** as a business owner
2. **Post a Gig** with budget, goals, and story type
3. **Wait for Clippers** to claim and complete your gig
4. **Review Submissions** and approve for payout
5. **Track Performance** through the dashboard

### Clipper Workflow
1. **Sign Up** as a content creator
2. **Take Lessons** in the Learning Center
3. **Pass Quizzes** to get certified (70% passing grade)
4. **Browse Marketplace** for available gigs
5. **Claim and Complete** gigs by editing and posting videos
6. **Earn Money** through base pay + performance bonuses

## 💰 Monetization Model

### Platform Fees
- **Business Fee**: 8% on gig budgets
- **Clipper Fee**: 10-15% on earnings

### Bonus Structure for Clippers
- **Base Pay**: $100 per completed gig
- **Minimum Thresholds**: 300 views, 30 likes
- **Tiered Bonuses**:
  - Views: $0.005-$0.015 per view (based on tiers)
  - Likes: $0.03-$0.07 per like (based on tiers)
  - Outcomes: $0.10 per outcome (30% weight)
- **Maximum Bonus**: $75 cap per gig

### Credits System
- **Self-Promo**: $10 credit for qualifying posts (300+ views, 30+ likes)
- **Gig Posting**: $5 credit per gig posted
- **Monthly Cap**: $15 from self-promotion

## 🏗️ Architecture

### Backend Structure
```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI app & routing
│   ├── database.py          # Database configuration
│   ├── models.py            # SQLAlchemy models
│   ├── schemas.py           # Pydantic schemas
│   ├── auth.py              # Authentication utilities
│   └── routers/             # API route modules
│       ├── gigs.py          # Gig management
│       ├── lessons.py       # Learning system
│       ├── payments.py      # Payment processing
│       └── dashboard.py     # Analytics & dashboard
├── requirements.txt
└── Dockerfile
```

### Frontend Structure
```
frontend/
├── src/
│   ├── main.jsx            # React entry point
│   ├── App.jsx             # Main app component
│   ├── contexts/
│   │   └── AuthContext.jsx # Authentication state
│   ├── components/
│   │   └── Layout.jsx      # Main layout component
│   └── pages/              # Page components
│       ├── Login.jsx
│       ├── Signup.jsx
│       ├── Dashboard.jsx
│       ├── GigWizard.jsx
│       ├── Marketplace.jsx
│       ├── Lessons.jsx
│       └── LessonDetail.jsx
├── package.json
└── Dockerfile
```

### Database Schema
- **Users**: Authentication and role management
- **Gigs**: Job postings with budgets and requirements
- **Submissions**: Video submissions with performance metrics
- **Lessons**: Training content with quizzes
- **Certifications**: User qualifications
- **Credits**: User credit balance tracking
- **SelfPromos**: Self-promotion post tracking

## 🔧 Development

### Running Without Docker
1. **Backend**:
   ```bash
   cd backend
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

2. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Database**: Install PostgreSQL locally and update connection string

### API Endpoints
- `POST /signup` - User registration
- `POST /token` - User login
- `GET /users/me` - Current user info
- `POST /gigs/post-gig` - Create new gig
- `GET /gigs/available` - Browse available gigs
- `POST /gigs/{id}/claim` - Claim a gig
- `GET /lessons/` - Get all lessons
- `POST /lessons/{id}/complete-quiz` - Submit quiz
- `GET /dashboard/` - Dashboard data
- `GET /dashboard/analytics` - User analytics

Full API documentation available at http://localhost:8000/docs

## 🎯 MVP Scope & Limitations

This is a **Minimum Viable Product** designed for beta testing with:
- **Target**: 10 businesses, 20 clippers by October 31, 2025
- **Geography**: NYC local market (foot-traffic focus)
- **Manual Reviews**: Bonus verification and content approval
- **Stubbed Features**: Stripe payments (development mode)
- **No AI/ML**: Simple rule-based systems

## 🔐 Security Features
- JWT token authentication
- Bcrypt password hashing
- Role-based access control
- Input validation with Pydantic
- CORS protection

## 🚀 Production Deployment

For production deployment, consider:
1. **Environment Variables**: Set secure secrets
2. **Database**: Use managed PostgreSQL service
3. **Stripe**: Configure live payment processing
4. **Hosting**: Deploy to Heroku, AWS, or similar
5. **Domain**: Configure custom domain and SSL
6. **Monitoring**: Add error tracking and analytics

## 📞 Support

For questions or issues:
1. Check the API documentation at `/docs`
2. Review this README
3. Contact the development team

## 📄 License

This project is proprietary software for MX70 platform development.

---

**Built with ❤️ for the creator economy** 