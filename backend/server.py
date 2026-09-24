from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, BeforeValidator
from typing import List, Optional, Annotated
from bson import ObjectId
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI()
api_router = APIRouter(prefix="/api")

logger = logging.getLogger(__name__)

# ---------- Constants ----------
VALID_STATUSES = [
    "Pending_Review",
    "Approved_For_Rewrite",
    "Rewritten_Pending_Publish",
    "Published",
]
VALID_MEDIA_TYPES = ["photo", "video"]


# ---------- Mongo helpers ----------
PyObjectId = Annotated[str, BeforeValidator(str)]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# ---------- Models ----------
class NewsItemBase(BaseModel):
    original_url: str
    original_title: str
    original_content: str
    rewritten_title: Optional[str] = ""
    rewritten_content: Optional[str] = ""
    media_url: Optional[str] = ""
    media_type: str = "photo"  # photo | video
    status: str = "Pending_Review"


class NewsItemCreate(NewsItemBase):
    pass


class NewsItemUpdate(BaseModel):
    original_url: Optional[str] = None
    original_title: Optional[str] = None
    original_content: Optional[str] = None
    rewritten_title: Optional[str] = None
    rewritten_content: Optional[str] = None
    media_url: Optional[str] = None
    media_type: Optional[str] = None


class StatusUpdate(BaseModel):
    status: str


class NewsItem(NewsItemBase):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: str = Field(default_factory=now_iso)
    updated_at: str = Field(default_factory=now_iso)


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Newsroom Admin API"}


@api_router.get("/news/stats")
async def get_stats():
    counts = {s: 0 for s in VALID_STATUSES}
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}}}]
    async for row in db.news_items.aggregate(pipeline):
        if row["_id"] in counts:
            counts[row["_id"]] = row["count"]
    counts["total"] = sum(counts[s] for s in VALID_STATUSES)
    return counts


@api_router.get("/news", response_model=List[NewsItem])
async def list_news(status: Optional[str] = None):
    query = {}
    if status and status != "all":
        if status not in VALID_STATUSES:
            raise HTTPException(status_code=400, detail="Invalid status filter")
        query["status"] = status
    docs = await db.news_items.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    return docs


@api_router.get("/news/{item_id}", response_model=NewsItem)
async def get_news(item_id: str):
    doc = await db.news_items.find_one({"id": item_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="News item not found")
    return doc


@api_router.post("/news", response_model=NewsItem)
async def create_news(payload: NewsItemCreate):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    if payload.media_type not in VALID_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Invalid media_type")
    item = NewsItem(**payload.model_dump())
    await db.news_items.insert_one(item.model_dump())
    return item


@api_router.patch("/news/{item_id}", response_model=NewsItem)
async def update_news(item_id: str, payload: NewsItemUpdate):
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    if "media_type" in updates and updates["media_type"] not in VALID_MEDIA_TYPES:
        raise HTTPException(status_code=400, detail="Invalid media_type")
    updates["updated_at"] = now_iso()
    result = await db.news_items.find_one_and_update(
        {"id": item_id}, {"$set": updates}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="News item not found")
    result.pop("_id", None)
    return result


@api_router.patch("/news/{item_id}/status", response_model=NewsItem)
async def update_status(item_id: str, payload: StatusUpdate):
    if payload.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail="Invalid status")
    result = await db.news_items.find_one_and_update(
        {"id": item_id},
        {"$set": {"status": payload.status, "updated_at": now_iso()}},
        return_document=True,
    )
    if not result:
        raise HTTPException(status_code=404, detail="News item not found")
    result.pop("_id", None)
    return result


@api_router.delete("/news/{item_id}")
async def delete_news(item_id: str):
    result = await db.news_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="News item not found")
    return {"success": True}


# ---------- Seed ----------
SEED_ITEMS = [
    {
        "original_url": "https://apnews.com/article/global-climate-summit-2026",
        "original_title": "World Leaders Convene for Emergency Climate Summit in Geneva",
        "original_content": "Representatives from 47 nations gathered in Geneva on Tuesday for an emergency climate summit aimed at accelerating the transition to renewable energy. The talks, expected to run through the week, follow a record-breaking heatwave that affected large parts of the Northern Hemisphere. Delegates are under pressure to finalize binding emission targets ahead of the year-end deadline.",
        "rewritten_title": "",
        "rewritten_content": "",
        "media_url": "https://images.unsplash.com/photo-1771340590060-be598dfb81bd?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "media_type": "photo",
        "status": "Pending_Review",
    },
    {
        "original_url": "https://reuters.com/tech/ai-chip-breakthrough-2026",
        "original_title": "Startup Unveils Chip That Cuts AI Training Costs by Half",
        "original_content": "A little-known semiconductor startup announced a new processor architecture it claims can reduce the cost of training large AI models by nearly 50 percent. The company says early benchmarks show significant energy savings, though independent verification is still pending. Investors have poured over $200 million into the firm this year.",
        "rewritten_title": "",
        "rewritten_content": "",
        "media_url": "https://images.pexels.com/photos/7596918/pexels-photo-7596918.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "media_type": "photo",
        "status": "Pending_Review",
    },
    {
        "original_url": "https://bbc.com/news/health-nutrition-study-2026",
        "original_title": "Large Study Links Mediterranean Diet to Longer Lifespan",
        "original_content": "A decade-long study following 30,000 participants has found a strong association between adherence to a Mediterranean-style diet and increased longevity. Researchers noted a 20 percent reduction in cardiovascular events among the highest-adherence group. Nutritionists caution that lifestyle factors also play a substantial role.",
        "rewritten_title": "",
        "rewritten_content": "",
        "media_url": "https://images.pexels.com/photos/10464437/pexels-photo-10464437.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        "media_type": "photo",
        "status": "Approved_For_Rewrite",
    },
    {
        "original_url": "https://apnews.com/article/space-mission-launch-2026",
        "original_title": "Private Mission Successfully Launches Toward Lunar Orbit",
        "original_content": "A privately funded spacecraft lifted off early Wednesday, beginning a multi-day journey toward lunar orbit. The mission carries scientific instruments designed to map water ice deposits near the moon's south pole. If successful, it would mark the first fully commercial mission to reach lunar orbit.",
        "rewritten_title": "Commercial Spacecraft Begins Historic Journey to the Moon",
        "rewritten_content": "A privately backed spacecraft launched before dawn on Wednesday, kicking off a multi-day trip toward lunar orbit. On board are scientific tools built to chart water-ice deposits near the moon's south pole. Success would make it the first entirely commercial mission ever to reach the moon's orbit — a milestone for the private space industry.",
        "media_url": "https://images.unsplash.com/photo-1785807047596-3f3abd23df6a?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "media_type": "photo",
        "status": "Rewritten_Pending_Publish",
    },
    {
        "original_url": "https://reuters.com/markets/economy-jobs-report-2026",
        "original_title": "Economy Adds More Jobs Than Expected in May",
        "original_content": "The national economy added 280,000 jobs last month, well above analyst forecasts of 190,000. The unemployment rate held steady at 3.8 percent. Wage growth moderated slightly, offering some relief to policymakers watching for inflationary pressure.",
        "rewritten_title": "May Jobs Report Beats Forecasts With 280,000 New Positions",
        "rewritten_content": "Employers added 280,000 jobs in May, comfortably beating the 190,000 that analysts had predicted. Unemployment stayed flat at 3.8 percent, while wage growth cooled slightly — a welcome sign for policymakers keeping a close eye on inflation.",
        "media_url": "https://images.unsplash.com/photo-1586339949916-3e9457bef6d3?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
        "media_type": "photo",
        "status": "Published",
    },
]


@api_router.post("/news/seed")
async def seed_news(force: bool = False):
    existing = await db.news_items.count_documents({})
    if existing > 0 and not force:
        return {"seeded": False, "message": "Data already exists", "count": existing}
    if force:
        await db.news_items.delete_many({})
    items = [NewsItem(**data).model_dump() for data in SEED_ITEMS]
    await db.news_items.insert_many(items)
    return {"seeded": True, "count": len(items)}


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)


@app.on_event("startup")
async def seed_on_startup():
    count = await db.news_items.count_documents({})
    if count == 0:
        items = [NewsItem(**data).model_dump() for data in SEED_ITEMS]
        await db.news_items.insert_many(items)
        logger.info("Seeded %d news items on startup", len(items))


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
