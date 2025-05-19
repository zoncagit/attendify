"""
Package principal de l'application AttendanceBackend.

Ce package contient la configuration de l'application, les modèles de données,
les routes et la logique métier pour la gestion des présences.
"""

# Version de l'application
__version__ = "1.0.0"

# Import des éléments principaux
from .main import app
from .config import settings

# Export des éléments principaux
__all__ = ["app", "settings"]