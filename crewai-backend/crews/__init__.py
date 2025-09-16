"""
CrewAI Crews Module
Strategic crews for different operational priorities
"""

from .base_crew import BaseCrew
from .system_health_crew import SystemHealthCrew

__all__ = [
    'BaseCrew',
    'SystemHealthCrew'
]