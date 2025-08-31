import chess
import chess.pgn
import chess.engine
import structlog
from datetime import datetime
from typing import List, Dict, Optional
from sqlalchemy.orm import Session

from app.config import settings
from app.database.models import Game, GameAnalysis
from app.core.celery_app import celery_app
from app.core.redis_client import update_analysis_progress

logger = structlog.get_logger()


class ChessAnalysisEngine:
    def __init__(self):
        self.stockfish_path = settings.stockfish_path
        self.threads = settings.stockfish_threads
        self.hash_size = settings.stockfish_hash_size
    
    async def analyze_game(self, game: Game) -> List[Dict]:
        """Comprehensive game analysis using Stockfish"""
        try:
            pgn_io = chess.pgn.StringIO(game.pgn)
            chess_game = chess.pgn.read_game(pgn_io)
            board = chess_game.board()
            
            analysis_results = []
            move_times = self._extract_move_times(chess_game)
            
            async with chess.engine.SimpleEngine.popen_uci(self.stockfish_path) as engine:
                # Configure engine
                engine.configure({
                    "Threads": self.threads,
                    "Hash": self.hash_size
                })
                
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
                    eval_loss = self._calculate_eval_loss(pre_eval, post_eval, board.turn)
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
                        'game_phase': game_phase,
                        'analysis_depth': 15,
                        'analysis_time': 0.1
                    })
            
            logger.info(f"Completed analysis for game {game.id}", 
                       game_id=game.id, moves_analyzed=len(analysis_results))
            return analysis_results
            
        except Exception as e:
            logger.error(f"Failed to analyze game {game.id}", error=str(e))
            raise
    
    def _score_to_centipawns(self, score) -> float:
        """Convert Stockfish score to centipawns"""
        if score.is_mate():
            return 10000 if score.mate() > 0 else -10000
        return float(score.score())
    
    def _calculate_eval_loss(self, pre_eval: float, post_eval: float, is_black_turn: bool) -> float:
        """Calculate evaluation loss for the move"""
        if is_black_turn:
            # For black's moves, we need to adjust perspective
            eval_loss = abs(-post_eval - (-pre_eval))
        else:
            # For white's moves
            eval_loss = abs(post_eval - pre_eval)
        
        return eval_loss
    
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
        # This is a simplified implementation
        # In a real implementation, you would parse clock times from PGN comments
        return move_times


# Celery task for background game analysis
@celery_app.task(bind=True)
def analyze_game_task(self, game_id: int):
    """Background task to analyze a single game"""
    try:
        from app.database.database import SessionLocal
        
        db = SessionLocal()
        
        # Get game from database
        game = db.query(Game).filter(Game.id == game_id).first()
        if not game:
            logger.error(f"Game {game_id} not found")
            return
        
        # Update game status
        game.analysis_started_at = datetime.utcnow()
        db.commit()
        
        # Update progress
        update_analysis_progress(game.user_id, {
            'status': 'analyzing',
            'current_game_id': game_id
        })
        
        # Perform analysis
        analysis_engine = ChessAnalysisEngine()
        analysis_results = analysis_engine.analyze_game(game)
        
        # Store analysis results
        for result in analysis_results:
            analysis = GameAnalysis(
                game_id=game_id,
                move_number=result['move_number'],
                position_fen=result['position_fen'],
                stockfish_eval=result['stockfish_eval'],
                move_played=result['move_played'],
                best_move=result['best_move'],
                eval_loss=result['eval_loss'],
                move_quality=result['move_quality'],
                time_spent=result['time_spent'],
                game_phase=result['game_phase'],
                analysis_depth=result['analysis_depth'],
                analysis_time=result['analysis_time']
            )
            db.add(analysis)
        
        # Mark game as analyzed
        game.analyzed = True
        game.analysis_completed_at = datetime.utcnow()
        db.commit()
        
        # Update progress
        progress = update_analysis_progress(game.user_id, {
            'games_completed': 1,  # Increment completed count
            'current_game_id': None
        })
        
        logger.info(f"Completed analysis for game {game_id}", 
                   game_id=game_id, moves_analyzed=len(analysis_results))
        
    except Exception as e:
        logger.error(f"Failed to analyze game {game_id}", error=str(e))
        
        # Update game status on failure
        try:
            game.analysis_started_at = None
            db.commit()
        except:
            pass
        
        # Update progress
        update_analysis_progress(game.user_id, {
            'games_failed': 1,  # Increment failed count
            'status': 'failed',
            'error_message': str(e)
        })
        raise
    finally:
        db.close()


# Service functions for API endpoints
async def get_game_analysis(game_id: int, user_id: int, db: Session) -> Optional[Dict]:
    """Get analysis for a specific game"""
    try:
        # Get game with analysis
        game = db.query(Game).filter(
            Game.id == game_id,
            Game.user_id == user_id
        ).first()
        
        if not game:
            return None
        
        # Get analysis data
        analysis_data = db.query(GameAnalysis).filter(
            GameAnalysis.game_id == game_id
        ).order_by(GameAnalysis.move_number).all()
        
        # Calculate summary statistics
        total_moves = len(analysis_data)
        blunders = sum(1 for a in analysis_data if a.move_quality == 'blunder')
        mistakes = sum(1 for a in analysis_data if a.move_quality == 'mistake')
        inaccuracies = sum(1 for a in analysis_data if a.move_quality == 'inaccuracy')
        
        avg_eval_loss = sum(a.eval_loss for a in analysis_data) / total_moves if total_moves > 0 else 0
        accuracy_score = max(0, 100 - (avg_eval_loss / 2))
        
        return {
            'game_info': {
                'id': game.id,
                'lichess_id': game.lichess_game_id,
                'time_control': game.time_control,
                'result': game.result,
                'opening': game.opening_name,
                'user_rating': game.user_rating,
                'opponent_rating': game.opponent_rating
            },
            'analysis': [
                {
                    'move_number': a.move_number,
                    'move_played': a.move_played,
                    'best_move': a.best_move,
                    'evaluation': a.stockfish_eval,
                    'eval_loss': a.eval_loss,
                    'quality': a.move_quality,
                    'time_spent': a.time_spent,
                    'phase': a.game_phase
                }
                for a in analysis_data
            ],
            'summary': {
                'total_moves': total_moves,
                'blunders': blunders,
                'mistakes': mistakes,
                'inaccuracies': inaccuracies,
                'average_eval_loss': round(avg_eval_loss, 2),
                'accuracy_score': round(accuracy_score, 1)
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get game analysis for game {game_id}", error=str(e))
        return None
