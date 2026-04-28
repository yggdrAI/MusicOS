from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import Column, String, JSON, select
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class SongMetadata(Base):
    __tablename__ = "song_metadata"
    song_id = Column(String, primary_key=True, index=True)
    metadata = Column(JSON)

async def init_db(engine):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

async def save_metadata(session: AsyncSession, song_id: str, metadata: dict):
    obj = SongMetadata(song_id=song_id, metadata=metadata)
    session.add(obj)
    await session.commit()

async def get_metadata(session: AsyncSession, song_id: str):
    result = await session.execute(select(SongMetadata).where(SongMetadata.song_id == song_id))
    obj = result.scalar_one_or_none()
    return obj.metadata if obj else None
