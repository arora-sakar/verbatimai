# SMB Feedback Insights

A comprehensive feedback analysis tool for small businesses, providing AI-powered sentiment analysis and topic extraction to help business owners make data-driven decisions based on customer feedback.

## Project Structure

The project is divided into two main components:

- **Frontend**: React application built with Vite, React Router, React Query, and Tailwind CSS
- **Backend**: Python API built with FastAPI, SQLAlchemy, and PostgreSQL

## Features

- User authentication and registration
- CSV upload for batch feedback processing
- Manual feedback entry
- AI-powered sentiment analysis
- Topic extraction from feedback text
- Dashboard with sentiment overview and key insights
- Filterable feedback list
- Google My Business integration (planned)
- Web widget for collecting feedback (planned)

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Python 3.9+
- PostgreSQL

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Create a virtual environment:

```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Create a `.env` file based on `.env.example`:

```bash
cp .env.example .env
```

5. Edit the `.env` file to set up your database connection and API keys.

6. Initialize the database:

```bash
alembic upgrade head
```

7. Run the server:

```bash
python run.py
```

The backend API will be available at http://localhost:8000.

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

The frontend application will be available at http://localhost:3000.

## Testing

The project includes a comprehensive testing framework covering both backend and frontend:

### Running Tests

```bash
# Setup testing framework (first time only)
chmod +x setup_testing.sh
./setup_testing.sh

# Run all tests
./run_tests.sh

# Run backend tests only
cd backend && ./run_tests.sh

# Run frontend tests only
cd frontend && ./run_tests.sh
```

### Test Coverage
- Backend: Unit and integration tests with 70%+ coverage
- Frontend: Component and page tests
- See `TESTING_FRAMEWORK.md` for detailed documentation

## Development Roadmap

The project is being developed in sprints, following the roadmap:

1. **Sprint 1**: Core Authentication & CSV Upload ✅ 75% Complete
2. **Sprint 2**: AI Analysis & Basic Dashboard
3. **Sprint 3**: Advanced Dashboard & Filtering
4. **Sprint 4**: GMB Integration & Web Widget
5. **Sprint 5**: Pricing, Polish & Launch Prep

## License

[MIT License](LICENSE)

## Contact

For any questions or feedback, please open an issue on GitHub.