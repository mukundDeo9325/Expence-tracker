import asyncio
from contextlib import suppress
from fastapi import FastAPI, APIRouter, HTTPException, Query, Response
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import ASCENDING, DESCENDING, IndexModel
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from pymongo import UpdateOne
from typing import List, Literal, Optional
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# One entry per collection: every field a route filters, sorts or dedupes on. Add the index in the same edit as the query.
INDEXES: dict[str, list[IndexModel]] = {
    "status_checks": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("timestamp", DESCENDING)], name="timestamp_desc"),
    ],
    "expenses": [
        IndexModel([("id", ASCENDING)], name="id", unique=True),
        IndexModel([("createdAt", DESCENDING)], name="createdAt_desc"),
    ],
}


async def ensure_indexes() -> None:
    for collection, models in INDEXES.items():
        for model in models:  # one at a time so a bad spec skips only itself
            try:
                await db[collection].create_indexes([model])
            except Exception as exc:  # never block boot on an index; the log line names what to fix
                logging.getLogger(__name__).error("ensure_indexes(%s.%s): %s", collection, model.document["name"], exc)

# Create the main app without a prefix
app = FastAPI()

# Probe endpoint for the deployer and pod health checks: root-level (not /api), no DB call.
@app.get("/health", include_in_schema=False)
@app.head("/health", include_in_schema=False)
async def health():
    return {"status": "ok"}

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# Define Models
class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

Category = Literal["Groceries", "Fuel", "Electricity", "Eating out", "Recharge"]


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    amount: float = Field(gt=0)
    category: Category
    note: str = ""
    createdAt: datetime = Field(default_factory=_utc_now)


class ExpenseCreate(BaseModel):
    amount: float = Field(gt=0)
    category: Category
    note: Optional[str] = ""


class ExpenseBulk(BaseModel):
    expenses: List[Expense] = Field(max_length=5000)


def _as_utc(value: datetime) -> datetime:
    # MongoDB returns naive datetimes (always UTC); mark them so clients get a "Z" suffix.
    return value if value.tzinfo else value.replace(tzinfo=timezone.utc)


# Add your routes to the router instead of directly to app
@api_router.get("/")
async def root():
    return {"message": "Hello World"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks(limit: int = Query(20, ge=1, le=100)):
    status_checks = await db.status_checks.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit).to_list(limit)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/expenses", response_model=Expense, status_code=201)
async def create_expense(input: ExpenseCreate):
    expense = Expense(amount=input.amount, category=input.category, note=input.note or "")
    await db.expenses.insert_one(expense.model_dump())
    return expense

@api_router.get("/expenses", response_model=List[Expense])
async def list_expenses(limit: int = Query(100, ge=1, le=1000)):
    rows = await db.expenses.find({}, {"_id": 0}).sort("createdAt", -1).limit(limit).to_list(limit)
    return [Expense(**{**row, "createdAt": _as_utc(row["createdAt"])}) for row in rows]

@api_router.delete("/expenses/{expense_id}", status_code=204)
async def delete_expense(expense_id: str):
    result = await db.expenses.delete_one({"id": expense_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return Response(status_code=204)

@api_router.post("/expenses/bulk")
async def bulk_save_expenses(input: ExpenseBulk):
    # Upsert by id so a backup can be repeated without creating duplicates.
    if not input.expenses:
        return {"saved": 0}
    operations = [
        UpdateOne({"id": item.id}, {"$set": item.model_dump()}, upsert=True)
        for item in input.expenses
    ]
    await db.expenses.bulk_write(operations, ordered=False)
    return {"saved": len(operations)}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def start_index_build():
    app.state.index_task = asyncio.create_task(ensure_indexes())  # background: a big index build must not block boot

@app.on_event("shutdown")
async def shutdown_db_client():
    app.state.index_task.cancel()  # stop a build still running before its client closes
    with suppress(asyncio.CancelledError):
        await app.state.index_task
    client.close()


