# VerbatimAI

A comprehensive feedback analysis platform for small businesses, providing AI-powered sentiment analysis and intelligent topic extraction to help business owners transform customer feedback into actionable business insights.

## 🎯 Overview

VerbatimAI empowers small business owners to understand their customers better by automatically analyzing feedback from multiple sources and providing clear, actionable insights without requiring technical expertise.

## ✨ Current Features

### 🔐 User Management
- Secure user authentication and registration
- Password reset functionality
- User profile management

### 📊 Feedback Analysis
- **AI-Powered Sentiment Analysis**: Automatic positive/negative/neutral classification
- **Intelligent Topic Extraction**: Identifies key business themes using 8 standardized categories:
  - Product Quality
  - Customer Service  
  - Shipping & Delivery
  - Pricing & Value
  - User Experience
  - Payment & Billing
  - Website & App
  - Communication

### 📈 Analytics Dashboard
- **Sentiment Overview**: Visual breakdown of feedback sentiment distribution
- **Top Topics Analysis**: Most frequently mentioned positive and negative themes
- **Interactive Filtering**: Click-through navigation from charts to detailed feedback
- **Recent Feedback Feed**: Chronological view of latest customer feedback

### 🔍 Advanced Filtering & Search
- Filter by sentiment (positive/negative/neutral)
- Filter by source
- Filter by topic categories
- Full-text search across all feedback

### 📥 Feedback Collection
- **CSV Upload**: Bulk import of existing feedback data
- **Manual Entry**: Quick individual feedback addition
- **Universal Format Support**: Works with exports from any review platform

### 💡 User Experience
- **Modal-based Detail Views**: Professional feedback detail modals
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Real-time Updates**: Live data updates and loading states
- **Intuitive Navigation**: Clean, business-focused interface

## 🏗️ Project Structure

```
verbatimai/
├── backend/               # Python FastAPI application
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── services/     # Business logic and AI analysis
│   │   ├── models/       # Database models
│   │   └── schemas/      # Pydantic schemas
│   ├── alembic/          # Database migrations
│   └── tests/            # Backend tests
├── frontend/             # React application
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Application pages
│   │   ├── services/     # API client
│   │   └── store/        # State management
│   └── tests/            # Frontend tests
└── docs/                 # Project documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and npm/yarn
- **Python** 3.9+
- **PostgreSQL** 12+
- **AI API Access** (Claude or OpenAI API key)

### Quick Setup

1. **Clone the repository**:
```bash
git clone <repository-url>
cd verbatimai
```

2. **Backend Setup**:
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Setup environment
cp .env.example .env
# Edit .env with your database and API credentials

# Initialize database
alembic upgrade head

# Start backend server
python run.py
```

3. **Frontend Setup**:
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

4. **Access the application**:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

## 🧪 Testing

Comprehensive testing framework with high coverage:

```bash
# Setup testing (first time only)
chmod +x setup_testing.sh
./setup_testing.sh

# Run all tests
./run_tests.sh

# Backend tests only
cd backend && ./run_tests.sh

# Frontend tests only  
cd frontend && ./run_tests.sh
```

**Test Coverage**:
- Backend: 70%+ coverage with unit and integration tests
- Frontend: Component and page-level testing
- See [TESTING_FRAMEWORK.md](docs/TESTING_FRAMEWORK.md) for details

## 📋 Development Status

### ✅ Completed Features
- Core authentication system
- CSV feedback upload and processing
- AI-powered sentiment and topic analysis
- Interactive analytics dashboard
- Advanced filtering and search
- Modal-based feedback details
- Responsive UI with Tailwind CSS

### 🚧 In Progress
- Enhanced topic confidence scoring
- Performance optimizations
- Mobile experience improvements

### 📅 Upcoming Features
- Web widget for website integration
- Business impact scoring
- Topic trend analysis
- Similar feedback detection
- ROI calculator for improvements

## 🛠️ Technology Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **AI/ML**: Claude API, OpenAI API
- **Authentication**: JWT tokens
- **Testing**: pytest with high coverage

### Frontend
- **Framework**: React 18 with Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: React Query
- **Routing**: React Router
- **Charts**: Chart.js
- **Testing**: Vitest + Testing Library

### DevOps
- **Database Migrations**: Alembic
- **Environment Management**: python-dotenv
- **Code Quality**: ESLint, Prettier
- **Testing**: Automated test suites

## 📖 Documentation

- [Recommended Improvements](docs/recommended-improvements.md) - Future enhancement roadmap
- [MVP Specification](docs/SMB%20Feedback%20Insights%20MVP%20Specification.md) - Original project requirements
- [AI Service Analysis](docs/AI_Service_Analysis_Report.md) - Technical analysis of AI implementation
- [Testing Framework](docs/TESTING_FRAMEWORK.md) - Testing documentation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For questions, feature requests, or bug reports:
- Open an issue on GitHub
- Check the [documentation](docs/) for detailed guides
- Review the [recommended improvements](docs/recommended-improvements.md) for upcoming features

---

**Built for small businesses who want to understand their customers better and make data-driven improvements to their products and services.**