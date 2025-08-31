
# Chess Analysis Platform - Core Implementation

import asyncio
import chess
import chess.pgn
import chess.engine
import requests
import json
import io
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from celery import Celery
import redis
import jwt
from passlib.context import CryptContext

# Database Models
Base = declarative_base()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    lichess_username = Column(String(50))
    password_hash = Column(String(255))
    created_at = Column(DateTime, default=datetime.utcnow)
    subscription_tier = Column(String(20), default='free')
    
    games = relationship("Game", back_populates="user")

class Game(Base):
    __tablename__ = 'games'
    
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    lichess_game_id = Column(String(50), unique=True)
    pgn = Column(Text)
    time_control = Column(String(20))
    user_color = Column(String(5))  # 'white' or 'black'
    user_rating = Column(Integer)
    opponent_rating = Column(Integer)
    result = Column(String(10))
    opening_eco = Column(String(10))
    opening_name = Column(String(100))
    played_at = Column(DateTime)
    analyzed = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="games")
    analysis = relationship("GameAnalysis", back_populates="game")

class GameAnalysis(Base):
    __tablename__ = 'game_analysis'
    
    id = Column(Integer, primary_key=True)
    game_id = Column(Integer, ForeignKey('games.id'))
    move_number = Column(Integer)
    position_fen = Column(String(100))
    stockfish_eval = Column(Float)
    move_played = Column(String(10))
    best_move = Column(String(10))
    eval_loss = Column(Float)
    move_quality = Column(String(20))  # 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'
    time_spent = Column(Float)
    game_phase = Column(String(20))  # 'opening', 'middlegame', 'endgame'
    
    game = relationship("Game", back_populates="analysis")

# Lichess API Client
class LichessClient:
    BASE_URL = "https://lichess.org/api"
    
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({'User-Agent': 'ChessAnalysisPlatform/1.0'})
    
    async def fetch_user_games(self, username: str, max_games: int = 100) -> List[Dict]:
        """Fetch user's recent games from Lichess"""
        url = f"{self.BASE_URL}/games/user/{username}"
        params = {
            'max': max_games,
            'rated': 'true',
            'perfType': 'blitz,rapid,classical',
            'format': 'json',
            'clocks': 'true',
            'evals': 'false',  # We'll do our own analysis
            'opening': 'true'
        }
        
        # Note: In real implementation, use aiohttp for async requests
        response = self.session.get(url, params=params, stream=True)
        games = []
        
        for line in response.iter_lines():
            if line:
                game_data = json.loads(line.decode('utf-8'))
                games.append(self._parse_game_data(game_data))
        
        return games
    
    def _parse_game_data(self, game_data: Dict) -> Dict:
        """Parse Lichess game data into our format"""
        return {
            'lichess_id': game_data['id'],
            'pgn': game_data['pgn'],
            'time_control': f"{game_data['clock']['initial']}+{game_data['clock']['increment']}",
            'white_player': game_data['players']['white']['user']['name'],
            'black_player': game_data['players']['black']['user']['name'],
            'white_rating': game_data['players']['white'].get('rating', 0),
            'black_rating': game_data['players']['black'].get('rating', 0),
            'result': game_data['status'],
            'opening': game_data.get('opening', {}),
            'played_at': datetime.fromtimestamp(game_data['createdAt'] / 1000)
        }

# Chess Analysis Engine
class ChessAnalysisEngine:
    def __init__(self, stockfish_path: str = "/usr/local/bin/stockfish"):
        self.stockfish_path = stockfish_path
        self.redis_client = redis.Redis(host='localhost', port=6379, db=0)
    
    async def analyze_game(self, game: Game) -> List[Dict]:
        """Comprehensive game analysis"""
        pgn_io = io.StringIO(game.pgn)
        chess_game = chess.pgn.read_game(pgn_io)
        board = chess_game.board()
        
        analysis_results = []
        move_times = self._extract_move_times(chess_game)
        
        async with chess.engine.SimpleEngine.popen_uci(self.stockfish_path) as engine:
            for i, move in enumerate(chess_game.mainline_moves()):
                # Analyze position before move
                pre_analysis = await engine.analyse(
                    board, 
                    chess.engine.Limit(time=0.1, depth=15),
                    multipv=3
                )
                
                # Get best move and evaluation
                best_move = pre_analysis['pv'][0][0] if pre_analysis['pv'] else None
                pre_eval = self._score_to_centipawns(pre_analysis['score'].white())
                
                # Make the actual move
                board.push(move)
                
                # Analyze position after move
                post_analysis = await engine.analyse(
                    board, 
                    chess.engine.Limit(time=0.1, depth=15)
                )
                post_eval = self._score_to_centipawns(post_analysis['score'].white())
                
                # Calculate move quality
                eval_loss = abs(post_eval - pre_eval)
                if board.turn == chess.BLACK:  # Adjust for black's perspective
                    eval_loss = abs(-post_eval - (-pre_eval))
                
                move_quality = self._categorize_move_quality(eval_loss)
                game_phase = self._determine_game_phase(board)
                
                analysis_results.append({
                    'move_number': i + 1,
                    'position_fen': board.fen(),
                    'move_played': str(move),
                    'best_move': str(best_move) if best_move else None,
                    'stockfish_eval': post_eval,
                    'eval_loss': eval_loss,
                    'move_quality': move_quality,
                    'time_spent': move_times.get(i, 0),
                    'game_phase': game_phase
                })
        
        return analysis_results
    
    def _score_to_centipawns(self, score) -> float:
        """Convert Stockfish score to centipawns"""
        if score.is_mate():
            return 10000 if score.mate() > 0 else -10000
        return float(score.score())
    
    def _categorize_move_quality(self, eval_loss: float) -> str:
        """Categorize move quality based on evaluation loss"""
        if eval_loss <= 10:
            return 'excellent'
        elif eval_loss <= 25:
            return 'good'
        elif eval_loss <= 50:
            return 'inaccuracy'
        elif eval_loss <= 100:
            return 'mistake'
        else:
            return 'blunder'
    
    def _determine_game_phase(self, board: chess.Board) -> str:
        """Determine current game phase"""
        piece_count = len(board.piece_map())
        
        if piece_count > 28:
            return 'opening'
        elif piece_count > 12:
            return 'middlegame'
        else:
            return 'endgame'
    
    def _extract_move_times(self, game) -> Dict[int, float]:
        """Extract time spent on each move from PGN"""
        move_times = {}
        # Parse clock times from PGN comments
        # Implementation depends on PGN format
        return move_times

# Celery Configuration
celery_app = Celery(
    'chess_analyzer',
    broker='redis://localhost:6379/0',
    backend='redis://localhost:6379/0'
)

@celery_app.task
async def fetch_and_store_games(user_id: int, lichess_username: str):
    """Background task to fetch and store user games"""
    lichess_client = LichessClient()
    games_data = await lichess_client.fetch_user_games(lichess_username, max_games=500)
    
    # Store games in database
    for game_data in games_data:
        await store_game_in_db(user_id, game_data)
    
    # Trigger analysis for all games
    game_ids = await get_user_game_ids(user_id)
    for game_id in game_ids:
        analyze_game_task.delay(game_id)

@celery_app.task
async def analyze_game_task(game_id: int):
    """Background task to analyze a single game"""
    try:
        game = await get_game_by_id(game_id)
        analysis_engine = ChessAnalysisEngine()
        
        # Update progress
        await update_analysis_progress(game.user_id, game_id, 'analyzing')
        
        # Perform analysis
        analysis_results = await analysis_engine.analyze_game(game)
        
        # Store results
        await store_analysis_results(game_id, analysis_results)
        
        # Mark game as analyzed
        await mark_game_analyzed(game_id)
        
        # Update progress
        await update_analysis_progress(game.user_id, game_id, 'completed')
        
    except Exception as e:
        await update_analysis_progress(game.user_id, game_id, 'failed')
        raise e

# Insights Generator
class InsightsGenerator:
    def __init__(self):
        pass
    
    async def generate_user_insights(self, user_id: int) -> Dict:
        """Generate comprehensive insights for a user"""
        games = await get_user_games_with_analysis(user_id)
        
        insights = {
            'overall_stats': self._calculate_overall_stats(games),
            'performance_by_phase': self._analyze_phase_performance(games),
            'time_management': self._analyze_time_management(games),
            'opening_repertoire': self._analyze_opening_performance(games),
            'improvement_trends': self._calculate_improvement_trends(games),
            'playing_style': self._determine_playing_style(games),
            'strengths_weaknesses': self._identify_strengths_weaknesses(games)
        }
        
        return insights
    
    def _calculate_overall_stats(self, games: List[Game]) -> Dict:
        """Calculate overall performance statistics"""
        if not games:
            return {}
        
        analyzed_games = [g for g in games if g.analyzed]
        total_moves = sum(len(g.analysis) for g in analyzed_games)
        
        blunders = sum(1 for g in analyzed_games for a in g.analysis if a.move_quality == 'blunder')
        mistakes = sum(1 for g in analyzed_games for a in g.analysis if a.move_quality == 'mistake')
        inaccuracies = sum(1 for g in analyzed_games for a in g.analysis if a.move_quality == 'inaccuracy')
        
        avg_eval_loss = sum(a.eval_loss for g in analyzed_games for a in g.analysis) / total_moves if total_moves > 0 else 0
        
        return {
            'games_analyzed': len(analyzed_games),
            'total_moves': total_moves,
            'avg_eval_loss': round(avg_eval_loss, 2),
            'blunders_per_game': round(blunders / len(analyzed_games), 2) if analyzed_games else 0,
            'mistakes_per_game': round(mistakes / len(analyzed_games), 2) if analyzed_games else 0,
            'accuracy_score': self._calculate_accuracy_score(analyzed_games)
        }
    
    def _calculate_accuracy_score(self, games: List[Game]) -> float:
        """Calculate overall accuracy score (0-100)"""
        if not games:
            return 0
        
        total_moves = 0
        total_accuracy = 0
        
        for game in games:
            for analysis in game.analysis:
                # Accuracy based on evaluation loss
                move_accuracy = max(0, 100 - (analysis.eval_loss / 2))
                total_accuracy += move_accuracy
                total_moves += 1
        
        return round(total_accuracy / total_moves, 1) if total_moves > 0 else 0

# Training Recommendations System
class TrainingRecommendationEngine:
    def __init__(self):
        self.weakness_thresholds = {
            'tactical': 75,
            'positional': 70,
            'endgame': 65,
            'opening': 60,
            'time_management': 70
        }
    
    async def generate_recommendations(self, user_id: int) -> List[Dict]:
        """Generate personalized training recommendations"""
        insights = await InsightsGenerator().generate_user_insights(user_id)
        user_profile = await get_user_profile(user_id)
        
        recommendations = []
        
        # Tactical training recommendations
        if insights['strengths_weaknesses']['tactical_score'] < self.weakness_thresholds['tactical']:
            recommendations.append({
                'type': 'tactical_puzzles',
                'priority': 'high',
                'title': 'Improve Tactical Vision',
                'description': f'Your tactical accuracy is {insights["strengths_weaknesses"]["tactical_score"]}%. Focus on pattern recognition.',
                'specific_areas': self._identify_tactical_weaknesses(insights),
                'recommended_puzzles_per_day': 15,
                'difficulty_range': (user_profile.rating - 200, user_profile.rating + 100),
                'estimated_improvement_time': '2-3 weeks'
            })
        
        # Opening recommendations
        if insights['opening_repertoire']['preparation_score'] < self.weakness_thresholds['opening']:
            weak_openings = insights['opening_repertoire']['weak_openings']
            recommendations.append({
                'type': 'opening_study',
                'priority': 'medium',
                'title': 'Strengthen Opening Repertoire',
                'description': f'Low preparation in {len(weak_openings)} opening variations.',
                'specific_openings': weak_openings[:3],  # Top 3 weakest
                'study_method': 'repertoire_building',
                'lines_to_learn': 5,
                'estimated_study_time': '30 minutes/day'
            })
        
        # Endgame training
        if insights['performance_by_phase']['endgame_accuracy'] < self.weakness_thresholds['endgame']:
            recommendations.append({
                'type': 'endgame_study',
                'priority': 'medium',
                'title': 'Master Basic Endgames',
                'description': f'Endgame accuracy: {insights["performance_by_phase"]["endgame_accuracy"]}%',
                'fundamental_positions': ['king_pawn_endgames', 'rook_endgames', 'queen_endgames'],
                'practice_method': 'position_drilling',
                'sessions_per_week': 3
            })
        
        # Time management
        if insights['time_management']['efficiency_score'] < self.weakness_thresholds['time_management']:
            recommendations.append({
                'type': 'time_management',
                'priority': 'high',
                'title': 'Improve Time Management',
                'description': 'You\'re spending too much time on routine positions.',
                'techniques': ['move_categorization', 'calculation_depth_control'],
                'practice_games': 'bullet_training',
                'target_improvement': '20% faster decision making'
            })
        
        return sorted(recommendations, key=lambda x: {'high': 3, 'medium': 2, 'low': 1}[x['priority']], reverse=True)
    
    def _identify_tactical_weaknesses(self, insights: Dict) -> List[str]:
        """Identify specific tactical pattern weaknesses"""
        # This would analyze game positions to identify weak tactical themes
        return ['pins', 'forks', 'discovered_attacks', 'deflection']

# Database Operations
async def store_game_in_db(user_id: int, game_data: Dict):
    """Store a game in the database"""
    # Implementation would use SQLAlchemy session
    pass

async def get_game_by_id(game_id: int) -> Game:
    """Retrieve a game by ID"""
    # Implementation would query database
    pass

async def store_analysis_results(game_id: int, analysis_results: List[Dict]):
    """Store game analysis results"""
    # Implementation would bulk insert analysis data
    pass

async def mark_game_analyzed(game_id: int):
    """Mark a game as analyzed"""
    # Implementation would update game record
    pass

async def update_analysis_progress(user_id: int, game_id: int, status: str):
    """Update analysis progress in Redis"""
    redis_client = redis.Redis()
    progress_key = f"analysis_progress:{user_id}"
    
    current_progress = redis_client.hgetall(progress_key)
    games_total = int(current_progress.get(b'games_total', 0))
    games_completed = int(current_progress.get(b'games_completed', 0))
    
    if status == 'completed':
        games_completed += 1
    
    redis_client.hset(progress_key, mapping={
        'games_total': games_total,
        'games_completed': games_completed,
        'percentage': (games_completed / games_total * 100) if games_total > 0 else 0,
        'current_game': game_id,
        'status': status,
        'updated_at': datetime.utcnow().isoformat()
    })
    
    redis_client.expire(progress_key, 86400)  # 24 hours

# FastAPI Application
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
import bcrypt

app = FastAPI(title="Chess Analysis Platform API")
security = HTTPBearer()

# Pydantic Models
class UserRegistration(BaseModel):
    email: str
    lichess_username: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class AnalysisStatus(BaseModel):
    games_total: int
    games_completed: int
    percentage: float
    status: str
    estimated_completion: Optional[str] = None

# Authentication
class AuthService:
    def __init__(self, secret_key: str = "your-secret-key"):
        self.secret_key = secret_key
        self.pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    
    def hash_password(self, password: str) -> str:
        return self.pwd_context.hash(password)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return self.pwd_context.verify(plain_password, hashed_password)
    
    def create_token(self, user_data: dict) -> str:
        return jwt.encode(user_data, self.secret_key, algorithm="HS256")
    
    def verify_token(self, token: str) -> dict:
        try:
            return jwt.decode(token, self.secret_key, algorithms=["HS256"])
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")

auth_service = AuthService()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user"""
    try:
        payload = auth_service.verify_token(credentials.credentials)
        return payload
    except:
        raise HTTPException(status_code=401, detail="Invalid authentication")

# API Endpoints
@app.post("/auth/register")
async def register_user(user_data: UserRegistration, background_tasks: BackgroundTasks):
    """Register a new user and start game analysis"""
    try:
        # Hash password
        password_hash = auth_service.hash_password(user_data.password)
        
        # Create user (implementation would save to database)
        user_id = await create_user_in_db(
            email=user_data.email,
            lichess_username=user_data.lichess_username,
            password_hash=password_hash
        )
        
        # Start background game fetching and analysis
        background_tasks.add_task(fetch_and_store_games, user_id, user_data.lichess_username)
        
        # Create access token
        token = auth_service.create_token({"user_id": user_id, "email": user_data.email})
        
        return {
            "message": "Registration successful. Game analysis started.",
            "user_id": user_id,
            "access_token": token,
            "token_type": "bearer"
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/auth/login")
async def login_user(user_data: UserLogin):
    """Authenticate user and return token"""
    user = await get_user_by_email(user_data.email)
    
    if not user or not auth_service.verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token = auth_service.create_token({"user_id": user.id, "email": user.email})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id
    }

@app.get("/analysis/status")
async def get_analysis_status(current_user: dict = Depends(get_current_user)):
    """Get current analysis progress"""
    user_id = current_user["user_id"]
    redis_client = redis.Redis()
    progress_key = f"analysis_progress:{user_id}"
    
    progress_data = redis_client.hgetall(progress_key)
    
    if not progress_data:
        return {"status": "no_analysis_running", "message": "No analysis in progress"}
    
    games_total = int(progress_data.get(b'games_total', 0))
    games_completed = int(progress_data.get(b'games_completed', 0))
    percentage = float(progress_data.get(b'percentage', 0))
    
    # Estimate completion time
    if percentage > 0 and percentage < 100:
        # Simple estimation based on progress rate
        estimated_minutes = int((100 - percentage) * 2)  # Rough estimate
        estimated_completion = f"{estimated_minutes} minutes"
    else:
        estimated_completion = None
    
    return {
        "games_total": games_total,
        "games_completed": games_completed,
        "percentage": round(percentage, 1),
        "status": progress_data.get(b'status', b'').decode(),
        "estimated_completion": estimated_completion,
        "is_complete": percentage >= 100
    }

@app.get("/insights")
async def get_user_insights(current_user: dict = Depends(get_current_user)):
    """Get comprehensive user insights and analysis"""
    user_id = current_user["user_id"]
    
    # Check if analysis is complete
    status = await get_analysis_status_from_db(user_id)
    if not status["is_complete"]:
        return {
            "message": "Analysis still in progress",
            "progress": status,
            "insights_available": False
        }
    
    # Generate insights
    insights_generator = InsightsGenerator()
    insights = await insights_generator.generate_user_insights(user_id)
    
    return {
        "insights_available": True,
        "data": insights,
        "generated_at": datetime.utcnow().isoformat()
    }

@app.get("/recommendations")
async def get_training_recommendations(current_user: dict = Depends(get_current_user)):
    """Get personalized training recommendations"""
    user_id = current_user["user_id"]
    
    recommendation_engine = TrainingRecommendationEngine()
    recommendations = await recommendation_engine.generate_recommendations(user_id)
    
    return {
        "recommendations": recommendations,
        "total_count": len(recommendations),
        "generated_at": datetime.utcnow().isoformat()
    }

@app.get("/games/{game_id}/analysis")
async def get_game_analysis(game_id: int, current_user: dict = Depends(get_current_user)):
    """Get detailed analysis for a specific game"""
    user_id = current_user["user_id"]
    
    # Verify game belongs to user
    game = await get_game_with_analysis(game_id, user_id)
    if not game:
        raise HTTPException(status_code=404, detail="Game not found")
    
    return {
        "game_info": {
            "id": game.id,
            "lichess_id": game.lichess_game_id,
            "time_control": game.time_control,
            "result": game.result,
            "opening": game.opening_name,
            "user_rating": game.user_rating,
            "opponent_rating": game.opponent_rating
        },
        "analysis": [
            {
                "move_number": a.move_number,
                "move_played": a.move_played,
                "best_move": a.best_move,
                "evaluation": a.stockfish_eval,
                "eval_loss": a.eval_loss,
                "quality": a.move_quality,
                "time_spent": a.time_spent,
                "phase": a.game_phase
            }
            for a in game.analysis
        ],
        "summary": await generate_game_summary(game)
    }

@app.post("/games/reanalyze")
async def reanalyze_games(
    background_tasks: BackgroundTasks,
    current_user: dict = Depends(get_current_user)
):
    """Trigger re-analysis of user's games"""
    user_id = current_user["user_id"]
    
    # Get all user game IDs
    game_ids = await get_user_game_ids(user_id)
    
    # Clear existing analysis
    await clear_user_analysis(user_id)
    
    # Trigger re-analysis
    for game_id in game_ids:
        background_tasks.add_task(analyze_game_task, game_id)
    
    return {
        "message": f"Re-analysis started for {len(game_ids)} games",
        "games_queued": len(game_ids)
    }

# Helper functions (implementations would connect to actual database)
async def create_user_in_db(email: str, lichess_username: str, password_hash: str) -> int:
    """Create user in database and return user ID"""
    # Implementation would use SQLAlchemy
    return 1  # Placeholder

async def get_user_by_email(email: str):
    """Get user by email"""
    # Implementation would query database
    pass

async def get_analysis_status_from_db(user_id: int) -> Dict:
    """Get analysis completion status from database"""
    # Implementation would check database
    return {"is_complete": True}

async def get_game_with_analysis(game_id: int, user_id: int):
    """Get game with analysis data"""
    # Implementation would query database with joins
    pass

async def generate_game_summary(game: Game) -> Dict:
    """Generate summary statistics for a game"""
    if not game.analysis:
        return {}
    
    total_moves = len(game.analysis)
    blunders = sum(1 for a in game.analysis if a.move_quality == 'blunder')
    mistakes = sum(1 for a in game.analysis if a.move_quality == 'mistake')
    inaccuracies = sum(1 for a in game.analysis if a.move_quality == 'inaccuracy')
    
    avg_eval_loss = sum(a.eval_loss for a in game.analysis) / total_moves
    
    return {
        "total_moves": total_moves,
        "blunders": blunders,
        "mistakes": mistakes,
        "inaccuracies": inaccuracies,
        "average_eval_loss": round(avg_eval_loss, 2),
        "accuracy_score": round(max(0, 100 - (avg_eval_loss / 2)), 1)
    }

async def get_user_game_ids(user_id: int) -> List[int]:
    """Get all game IDs for a user"""
    # Implementation would query database
    return []

async def clear_user_analysis(user_id: int):
    """Clear existing analysis data for re-analysis"""
    # Implementation would delete analysis records
    pass

async def get_user_games_with_analysis(user_id: int) -> List[Game]:
    """Get user games with analysis data"""
    # Implementation would query database
    return []

async def get_user_profile(user_id: int):
    """Get user profile information"""
    # Implementation would query database
    class MockProfile:
        rating = 1500
    return MockProfile()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)