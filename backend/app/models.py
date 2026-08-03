"""
Pydantic request/response models for the API.
"""

from typing import Optional

from pydantic import BaseModel, Field


# ---------------------------------------------------------------------------
# Request bodies
# ---------------------------------------------------------------------------
class DeckRequest(BaseModel):
    cards: list[str]
    levels: Optional[dict[str, int]] = None

    class Config:
        json_schema_extra = {
            "example": {
                "cards": ["Arrows", "Baby Dragon", "Bandit", "Cannon",
                          "Electro Wizard", "Ice Golem", "Knight", "Tombstone"],
                "levels": {"Arrows": 11, "Baby Dragon": 11},
            }
        }


class MatchupRequest(BaseModel):
    deck1_cards: list[str]
    deck1_levels: Optional[dict[str, int]] = None
    deck1_trophies: int = 11500
    deck2_cards: list[str]
    deck2_levels: Optional[dict[str, int]] = None
    deck2_trophies: int = 11500

    class Config:
        json_schema_extra = {
            "example": {
                "deck1_cards": ["Arrows", "Baby Dragon", "Bandit", "Cannon",
                                "Electro Wizard", "Ice Golem", "Knight", "Tombstone"],
                "deck1_levels": {"Arrows": 11},
                "deck1_trophies": 11500,
                "deck2_cards": ["Goblin Barrel", "Princess", "Skeleton Army",
                                "Inferno Tower", "Musketeer", "Knight", "Ice Spirit", "Fireball"],
                "deck2_trophies": 11500,
            }
        }


class SwapRequest(BaseModel):
    cards: list[str]
    levels: Optional[dict[str, int]] = None


# ---------------------------------------------------------------------------
# Query parameters
# ---------------------------------------------------------------------------
class PaginationParams(BaseModel):
    page: int = Field(default=1, ge=1, description="Page number (1-indexed)")
    page_size: int = Field(default=20, ge=1, le=200, description="Items per page")


class LeaderboardFilter(BaseModel):
    min_games: int = Field(default=5, ge=1, description="Minimum matches played to include")
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=200)


class DataFilter(BaseModel):
    min_games: int = Field(default=5, ge=1)
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=50, ge=1, le=500)
