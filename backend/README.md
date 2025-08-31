# ChessForgeAI Backend

A robust, modular FastAPI backend for the ChessForgeAI chess analysis platform.

## 🏗️ Architecture

```
backend/
├── app/
│   ├── api/                 # API endpoints
│   │   ├── auth.py         # Authentication endpoints
│   │   ├── analysis.py     # Game analysis endpoints
│   │   ├── insights.py     # User insights endpoints
│   │   └── recommendations.py # Training recommendations
│   ├── core/               # Core functionality
│   │   ├── security.py     # JWT authentication
│   │   ├── celery_app.py   # Background task processing
│   │   └── redis_client.py # Redis caching
│   ├── database/           # Database layer
│   │   ├── database.py     # Database connection
│   │   └── models.py       # SQLAlchemy models
│   ├── services/           # Business logic
│   │   ├── lichess_service.py # Lichess API integration
│   │   └── analysis_service.py # Chess analysis engine
│   ├── utils/              # Utility functions
│   ├── config.py           # Configuration management
│   └── main.py             # FastAPI application
├── tests/                  # Test suite
├── requirements.txt        # Python dependencies
├── Dockerfile             # Container configuration
├── docker-compose.yml     # Local development setup
└── README.md              # This file
```

## 🚀 Features

- **FastAPI** - Modern, fast web framework
- **PostgreSQL** - Primary database with SQLAlchemy ORM
- **Redis** - Caching and Celery backend
- **Celery** - Background task processing
- **Stockfish** - Chess engine for game analysis
- **JWT Authentication** - Secure user authentication
- **Lichess Integration** - Fetch and analyze games
- **Comprehensive Logging** - Structured logging with structlog

## 🛠️ Setup

### Prerequisites

- Python 3.11+
- Docker and Docker Compose
- PostgreSQL (for production)
- Redis (for production)

### Local Development

1. **Clone and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Start services with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run the application:**
   ```bash
   uvicorn app.main:app --reload
   ```

### Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=postgresql://chessforge:chessforge_password@localhost:5432/chessforge

# Redis
REDIS_URL=redis://localhost:6379/0

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Security
SECRET_KEY=your-secret-key-change-in-production

# Application
DEBUG=true
ALLOWED_ORIGINS=["http://localhost:3000"]

# Stockfish
STOCKFISH_PATH=/usr/local/bin/stockfish
```

## 📚 API Documentation

Once the application is running, visit:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health Check**: http://localhost:8000/health

## 🔧 API Endpoints

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `GET /auth/profile` - Get user profile
- `POST /auth/refresh-games` - Refresh games from Lichess

### Analysis
- `GET /analysis/status` - Get analysis progress
- `GET /analysis/games/{game_id}` - Get game analysis

### Insights
- `GET /insights/` - Get user insights

### Recommendations
- `GET /recommendations/` - Get training recommendations

## 🐳 Deployment

### Railway Deployment

1. **Create Railway project:**
   ```bash
   railway login
   railway init
   ```

2. **Add PostgreSQL and Redis services:**
   ```bash
   railway add postgresql
   railway add redis
   ```

3. **Set environment variables:**
   ```bash
   railway variables set DATABASE_URL=${{Postgres.DATABASE_URL}}
   railway variables set REDIS_URL=${{Redis.REDIS_URL}}
   railway variables set SECRET_KEY=your-production-secret-key
   ```

4. **Deploy:**
   ```bash
   railway up
   ```

### Docker Deployment

1. **Build and run:**
   ```bash
   docker build -t chessforge-backend .
   docker run -p 8000:8000 chessforge-backend
   ```

## 🔄 Background Tasks

The application uses Celery for background task processing:

- **Game Fetching** - Fetch games from Lichess
- **Game Analysis** - Analyze games with Stockfish
- **Insights Generation** - Generate user insights
- **Recommendations** - Generate training recommendations

### Running Celery Workers

```bash
# Start Celery worker
celery -A app.core.celery_app worker --loglevel=info

# Start Celery beat (for scheduled tasks)
celery -A app.core.celery_app beat --loglevel=info
```

## 🧪 Testing

```bash
# Run tests
pytest

# Run tests with coverage
pytest --cov=app

# Run specific test file
pytest tests/test_auth.py
```

## 📊 Monitoring

- **Health Check**: `/health` endpoint
- **Structured Logging**: JSON-formatted logs
- **Error Tracking**: Comprehensive error handling
- **Performance Monitoring**: Request/response timing

## 🔒 Security

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt password hashing
- **CORS Protection** - Configurable CORS settings
- **Input Validation** - Pydantic model validation
- **Rate Limiting** - API rate limiting (configurable)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.
