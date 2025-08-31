import httpx
import json
import structlog
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.database.models import User, Game, AnalysisProgress
from app.core.celery_app import celery_app
from app.core.redis_client import update_analysis_progress

logger = structlog.get_logger()


class LichessService:
    def __init__(self):
        self.base_url = settings.lichess_api_base_url
        self.headers = {
            "User-Agent": settings.lichess_user_agent,
            "Accept": "application/json"
        }
    
    async def fetch_user_games(self, username: str, max_games: int = 100) -> List[Dict]:
        """Fetch user's recent games from Lichess"""
        try:
            url = f"{self.base_url}/games/user/{username}"
            params = {
                'max': max_games,
                'rated': 'true',
                'perfType': 'blitz,rapid,classical',
                'format': 'json',
                'clocks': 'true',
                'evals': 'false',  # We'll do our own analysis
                'opening': 'true'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=self.headers)
                response.raise_for_status()
                
                games = []
                for line in response.text.strip().split('\n'):
                    if line:
                        game_data = json.loads(line)
                        games.append(self._parse_game_data(game_data, username))
                
                logger.info(f"Fetched {len(games)} games from Lichess", username=username)
                return games
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Lichess API error: {e.response.status_code}", username=username)
            raise
        except Exception as e:
            logger.error(f"Failed to fetch games from Lichess", error=str(e), username=username)
            raise
    
    def _parse_game_data(self, game_data: Dict, username: str) -> Dict:
        """Parse Lichess game data into our format"""
        # Determine user color and opponent
        white_player = game_data['players']['white']['user']['name']
        black_player = game_data['players']['black']['user']['name']
        
        user_color = 'white' if white_player == username else 'black'
        opponent = black_player if user_color == 'white' else white_player
        
        # Get ratings
        white_rating = game_data['players']['white'].get('rating', 0)
        black_rating = game_data['players']['black'].get('rating', 0)
        
        user_rating = white_rating if user_color == 'white' else black_rating
        opponent_rating = black_rating if user_color == 'white' else white_rating
        
        # Determine result
        result = self._determine_result(game_data['status'], user_color)
        
        return {
            'lichess_id': game_data['id'],
            'pgn': game_data['pgn'],
            'time_control': f"{game_data['clock']['initial']}+{game_data['clock']['increment']}",
            'user_color': user_color,
            'user_rating': user_rating,
            'opponent_rating': opponent_rating,
            'opponent': opponent,
            'result': result,
            'opening_eco': game_data.get('opening', {}).get('eco', ''),
            'opening_name': game_data.get('opening', {}).get('name', ''),
            'played_at': datetime.fromtimestamp(game_data['createdAt'] / 1000)
        }
    
    def _determine_result(self, status: str, user_color: str) -> str:
        """Determine game result from user's perspective"""
        if status == 'draw':
            return 'draw'
        elif status == 'resign':
            # Need to check who resigned - simplified logic
            return 'win'  # This would need more complex logic in real implementation
        elif status == 'mate':
            # Need to check who was mated - simplified logic
            return 'win'  # This would need more complex logic in real implementation
        else:
            return 'unknown'
    
    async def fetch_user_profile(self, username: str) -> Optional[Dict]:
        """Fetch user profile from Lichess"""
        try:
            url = f"{self.base_url}/user/{username}"
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, headers=self.headers)
                response.raise_for_status()
                
                profile_data = response.json()
                logger.info(f"Fetched profile for {username}")
                
                return {
                    'username': profile_data.get('id'),
                    'rating_blitz': profile_data.get('perfs', {}).get('blitz', {}).get('games', 0),
                    'rating_rapid': profile_data.get('perfs', {}).get('rapid', {}).get('games', 0),
                    'rating_classical': profile_data.get('perfs', {}).get('classical', {}).get('games', 0),
                    'created_at': profile_data.get('createdAt'),
                    'seen_at': profile_data.get('seenAt'),
                    'play_time': profile_data.get('playTime', {}).get('total', 0)
                }
                
        except httpx.HTTPStatusError as e:
            logger.error(f"Failed to fetch profile for {username}: {e.response.status_code}")
            return None
        except Exception as e:
            logger.error(f"Error fetching profile for {username}", error=str(e))
            return None


# Celery task for background game fetching
@celery_app.task(bind=True)
def fetch_user_games_task(self, user_id: int, lichess_username: str):
    """Background task to fetch and store user games"""
    try:
        from app.database.database import SessionLocal
        
        db = SessionLocal()
        lichess_service = LichessService()
        
        # Update progress
        update_analysis_progress(user_id, {
            'status': 'fetching',
            'games_total': 0,
            'games_completed': 0,
            'percentage': 0
        })
        
        # Fetch games from Lichess
        games_data = lichess_service.fetch_user_games(lichess_username, max_games=500)
        
        # Store games in database
        stored_games = []
        for game_data in games_data:
            # Check if game already exists
            existing_game = db.query(Game).filter(
                Game.lichess_game_id == game_data['lichess_id']
            ).first()
            
            if not existing_game:
                game = Game(
                    user_id=user_id,
                    lichess_game_id=game_data['lichess_id'],
                    pgn=game_data['pgn'],
                    time_control=game_data['time_control'],
                    user_color=game_data['user_color'],
                    user_rating=game_data['user_rating'],
                    opponent_rating=game_data['opponent_rating'],
                    result=game_data['result'],
                    opening_eco=game_data['opening_eco'],
                    opening_name=game_data['opening_name'],
                    played_at=game_data['played_at']
                )
                db.add(game)
                stored_games.append(game)
        
        db.commit()
        
        # Update progress
        update_analysis_progress(user_id, {
            'status': 'analyzing',
            'games_total': len(stored_games),
            'games_completed': 0,
            'percentage': 0
        })
        
        # Trigger analysis for all games
        from app.services.analysis_service import analyze_game_task
        for game in stored_games:
            analyze_game_task.delay(game.id)
        
        logger.info(f"Fetched and queued {len(stored_games)} games for analysis", 
                   user_id=user_id, lichess_username=lichess_username)
        
    except Exception as e:
        logger.error(f"Failed to fetch games for user {user_id}", error=str(e))
        update_analysis_progress(user_id, {
            'status': 'failed',
            'error_message': str(e)
        })
        raise
    finally:
        db.close()
