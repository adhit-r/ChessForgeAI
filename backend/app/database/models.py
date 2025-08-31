from sqlalchemy import Column, Integer, String, Boolean, DateTime, Float, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import uuid


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    lichess_username = Column(String(50), index=True)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    subscription_tier = Column(String(20), default="free")
    is_active = Column(Boolean, default=True)
    
    # Relationships
    games = relationship("Game", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, email='{self.email}', lichess_username='{self.lichess_username}')>"


class Game(Base):
    __tablename__ = "games"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    lichess_game_id = Column(String(50), unique=True, index=True)
    pgn = Column(Text, nullable=False)
    time_control = Column(String(20))
    user_color = Column(String(5))  # 'white' or 'black'
    user_rating = Column(Integer)
    opponent_rating = Column(Integer)
    result = Column(String(10))  # 'win', 'loss', 'draw'
    opening_eco = Column(String(10))
    opening_name = Column(String(100))
    played_at = Column(DateTime(timezone=True))
    analyzed = Column(Boolean, default=False)
    analysis_started_at = Column(DateTime(timezone=True))
    analysis_completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    user = relationship("User", back_populates="games")
    analysis = relationship("GameAnalysis", back_populates="game", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Game(id={self.id}, lichess_id='{self.lichess_game_id}', result='{self.result}')>"


class GameAnalysis(Base):
    __tablename__ = "game_analysis"
    
    id = Column(Integer, primary_key=True, index=True)
    game_id = Column(Integer, ForeignKey("games.id"), nullable=False)
    move_number = Column(Integer, nullable=False)
    position_fen = Column(String(100), nullable=False)
    stockfish_eval = Column(Float)
    move_played = Column(String(10), nullable=False)
    best_move = Column(String(10))
    eval_loss = Column(Float)
    move_quality = Column(String(20))  # 'excellent', 'good', 'inaccuracy', 'mistake', 'blunder'
    time_spent = Column(Float)  # seconds
    game_phase = Column(String(20))  # 'opening', 'middlegame', 'endgame'
    analysis_depth = Column(Integer)
    analysis_time = Column(Float)  # seconds spent analyzing this move
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    game = relationship("Game", back_populates="analysis")
    
    def __repr__(self):
        return f"<GameAnalysis(id={self.id}, game_id={self.game_id}, move_number={self.move_number})>"


class UserInsights(Base):
    __tablename__ = "user_insights"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    overall_stats = Column(JSON)
    performance_by_phase = Column(JSON)
    time_management = Column(JSON)
    opening_repertoire = Column(JSON)
    improvement_trends = Column(JSON)
    playing_style = Column(JSON)
    strengths_weaknesses = Column(JSON)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<UserInsights(id={self.id}, user_id={self.user_id})>"


class TrainingRecommendation(Base):
    __tablename__ = "training_recommendations"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    recommendation_type = Column(String(50), nullable=False)  # 'tactical', 'opening', 'endgame', etc.
    priority = Column(String(20), nullable=False)  # 'high', 'medium', 'low'
    title = Column(String(200), nullable=False)
    description = Column(Text)
    specific_areas = Column(JSON)  # Array of specific areas to focus on
    difficulty_range = Column(JSON)  # Min/max rating range
    estimated_time = Column(String(50))  # e.g., "2-3 weeks", "30 minutes/day"
    is_completed = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    
    def __repr__(self):
        return f"<TrainingRecommendation(id={self.id}, user_id={self.user_id}, type='{self.recommendation_type}')>"


class AnalysisProgress(Base):
    __tablename__ = "analysis_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    games_total = Column(Integer, default=0)
    games_completed = Column(Integer, default=0)
    games_failed = Column(Integer, default=0)
    current_game_id = Column(Integer, ForeignKey("games.id"))
    status = Column(String(20), default="idle")  # 'idle', 'fetching', 'analyzing', 'completed', 'failed'
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True))
    error_message = Column(Text)
    
    def __repr__(self):
        return f"<AnalysisProgress(id={self.id}, user_id={self.user_id}, status='{self.status}')>"
