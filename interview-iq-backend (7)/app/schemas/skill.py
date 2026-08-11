from pydantic import BaseModel

from app.schemas.common import ORMModel


class SkillOut(ORMModel):
    id: int
    name: str
    category: str


class UserSkillIn(BaseModel):
    name: str
    proficiency: str = "BEGINNER"


class UserSkillOut(ORMModel):
    id: int
    skill: SkillOut
    proficiency: str
    source: str
