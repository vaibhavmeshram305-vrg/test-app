from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import base64
import io
import hmac
import hashlib
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt as pyjwt
from fpdf import FPDF
import razorpay
#from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

# ---- Config ----
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "pvdesign_ai")
JWT_SECRET = os.getenv("JWT_SECRET", "secret")
RAZORPAY_KEY_ID = os.getenv("RAZORPAY_KEY_ID", "")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "")
EMERGENT_LLM_KEY = os.getenv("EMERGENT_LLM_KEY", "")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="PVDesign AI")
api_router = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


# =========================================================
# Models
# =========================================================
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    company: Optional[str] = None
    phone: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class UserPublic(BaseModel):
    id: str
    name: str
    email: EmailStr
    company: Optional[str] = None
    phone: Optional[str] = None
    plan: str = "Free"
    created_at: str

class AuthResponse(BaseModel):
    token: str
    user: UserPublic

class SizingInput(BaseModel):
    monthly_bill_inr: float = Field(..., gt=0)
    tariff_inr_per_unit: float = 8.0
    roof_area_sqft: float = Field(..., gt=0)
    state: str = "Maharashtra"
    shading_factor: float = 0.95  # 1 = no shade
    system_type: Literal["on_grid", "off_grid", "hybrid"] = "on_grid"

class SizingResult(BaseModel):
    monthly_units_kwh: float
    daily_units_kwh: float
    recommended_kw: float
    max_kw_by_area: float
    final_kw: float
    panels_count: int
    panel_wattage: int
    inverter_kw: float
    annual_generation_kwh: float
    co2_offset_tons_yr: float

class FinancialInput(BaseModel):
    system_kw: float
    monthly_bill_inr: float
    tariff_inr_per_unit: float = 8.0
    price_per_kw_inr: float = 55000
    subsidy_inr: float = 0.0
    escalation_pct: float = 5.0
    om_pct: float = 1.0
    years: int = 25

class FinancialResult(BaseModel):
    system_cost_inr: float
    net_cost_after_subsidy_inr: float
    year1_savings_inr: float
    lifetime_savings_inr: float
    payback_years: float
    roi_pct: float
    yearly_savings: List[float]

class BOMItem(BaseModel):
    category: str
    name: str
    brand: str
    quantity: float
    unit: str
    unit_price_inr: float
    total_inr: float

class BOMResult(BaseModel):
    items: List[BOMItem]
    subtotal_inr: float
    gst_inr: float
    total_inr: float

class ProjectCreate(BaseModel):
    name: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    sizing_input: SizingInput
    financial_input: Optional[FinancialInput] = None

class Project(BaseModel):
    id: str
    user_id: str
    name: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    sizing_input: SizingInput
    sizing_result: SizingResult
    financial_input: Optional[FinancialInput] = None
    financial_result: Optional[FinancialResult] = None
    bom_result: Optional[BOMResult] = None
    ai_summary: Optional[str] = None
    status: str = "draft"
    created_at: str
    updated_at: str

class ProjectUpdate(BaseModel):
    name: Optional[str] = None
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None
    customer_address: Optional[str] = None
    sizing_input: Optional[SizingInput] = None
    financial_input: Optional[FinancialInput] = None
    status: Optional[str] = None

class RazorpayOrderRequest(BaseModel):
    plan_id: Literal["pro", "business"]

class RazorpayVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: Literal["pro", "business"]


# =========================================================
# Helpers
# =========================================================
def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()

def hash_pw(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_pw(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def make_token(user_id: str) -> str:
    payload = {
    "sub": user_id,
    "iat": datetime.now(timezone.utc),
    "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return pyjwt.encode(payload, JWT_SECRET, algorithm="HS256")

async def get_current_user(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization.split(" ")[1]
    try:
        payload = pyjwt.decode(token, JWT_SECRET, algorithms=["HS256"])
        user_id = payload["sub"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": user_id}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

def to_public_user(user: dict) -> UserPublic:
    return UserPublic(
        id=user["id"],
        name=user["name"],
        email=user["email"],
        company=user.get("company"),
        phone=user.get("phone"),
        plan=user.get("plan", "free"),
        created_at=user["created_at"],
    )


# =========================================================
# Solar calculators
# =========================================================
STATE_SUN_HOURS = {
    "Rajasthan": 5.5, "Gujarat": 5.4, "Maharashtra": 5.2, "Karnataka": 5.3,
    "Tamil Nadu": 5.3, "Andhra Pradesh": 5.3, "Telangana": 5.3, "Madhya Pradesh": 5.2,
    "Uttar Pradesh": 4.9, "Delhi": 5.0, "Punjab": 4.9, "Haryana": 5.0,
    "West Bengal": 4.7, "Kerala": 4.9, "Odisha": 4.9,
}

def calc_sizing(inp: SizingInput) -> SizingResult:
    monthly_units = inp.monthly_bill_inr / inp.tariff_inr_per_unit
    daily_units = monthly_units / 30.0
    sun_hours = STATE_SUN_HOURS.get(inp.state, 5.0)
    perf_ratio = 0.75 * inp.shading_factor  # includes losses
    recommended_kw = daily_units / (sun_hours * perf_ratio)
    # 100 sqft per kW approx for rooftop
    max_kw_by_area = inp.roof_area_sqft / 100.0
    final_kw = round(min(recommended_kw, max_kw_by_area), 2)
    if final_kw < 1:
        final_kw = round(recommended_kw, 2)
    panel_wattage = 550
    panels_count = max(1, int((final_kw * 1000) / panel_wattage) + (1 if (final_kw * 1000) % panel_wattage else 0))
    # inverter sized 90-110% of DC
    if inp.system_type == "off_grid":
        inverter_kw = round(final_kw * 1.1, 2)
    else:
        inverter_kw = round(final_kw * 1.0, 2)
    annual_gen = final_kw * sun_hours * 365 * perf_ratio
    co2 = annual_gen * 0.00082  # tons CO2 per kWh (India grid)
    return SizingResult(
        monthly_units_kwh=round(monthly_units, 1),
        daily_units_kwh=round(daily_units, 2),
        recommended_kw=round(recommended_kw, 2),
        max_kw_by_area=round(max_kw_by_area, 2),
        final_kw=final_kw,
        panels_count=panels_count,
        panel_wattage=panel_wattage,
        inverter_kw=inverter_kw,
        annual_generation_kwh=round(annual_gen, 0),
        co2_offset_tons_yr=round(co2, 2),
    )

def calc_financial(fin: FinancialInput, sizing: SizingResult) -> FinancialResult:
    system_cost = fin.system_kw * fin.price_per_kw_inr
    net_cost = max(0.0, system_cost - fin.subsidy_inr)
    annual_gen = sizing.annual_generation_kwh
    year1_savings = annual_gen * fin.tariff_inr_per_unit
    yearly_savings = []
    cumulative = 0.0
    payback = 0.0
    for y in range(1, fin.years + 1):
        tariff = fin.tariff_inr_per_unit * ((1 + fin.escalation_pct / 100) ** (y - 1))
        gross = annual_gen * tariff * (0.995 ** (y - 1))  # 0.5% panel degradation
        om = system_cost * (fin.om_pct / 100)
        net = gross - om
        cumulative += net
        yearly_savings.append(round(net, 0))
        if payback == 0.0 and cumulative >= net_cost:
            prev = cumulative - net
            frac = (net_cost - prev) / net if net > 0 else 0
            payback = round((y - 1) + frac, 1)
    if payback == 0.0:
        payback = fin.years
    lifetime = round(sum(yearly_savings), 0)
    roi_pct = round(((lifetime - net_cost) / net_cost) * 100, 1) if net_cost > 0 else 0.0
    return FinancialResult(
        system_cost_inr=round(system_cost, 0),
        net_cost_after_subsidy_inr=round(net_cost, 0),
        year1_savings_inr=round(year1_savings, 0),
        lifetime_savings_inr=lifetime,
        payback_years=payback,
        roi_pct=roi_pct,
        yearly_savings=yearly_savings,
    )

def generate_bom(sizing: SizingResult, system_kw: float) -> BOMResult:
    kw = system_kw
    items: List[BOMItem] = []
    # Panels
    items.append(BOMItem(category="Modules", name=f"{sizing.panel_wattage}W Mono PERC Solar Panel",
                        brand="Waaree", quantity=sizing.panels_count, unit="pcs",
                        unit_price_inr=13500, total_inr=sizing.panels_count * 13500))
    # Inverter
    items.append(BOMItem(category="Inverter", name=f"{sizing.inverter_kw}kW String Inverter",
                        brand="Growatt", quantity=1, unit="pcs",
                        unit_price_inr=round(sizing.inverter_kw * 7000, 0),
                        total_inr=round(sizing.inverter_kw * 7000, 0)))
    # Mounting Structure
    items.append(BOMItem(category="Structure", name="GI Mounting Structure",
                        brand="Local", quantity=kw, unit="kW",
                        unit_price_inr=4500, total_inr=round(kw * 4500, 0)))
    # DC Cables
    items.append(BOMItem(category="Cables", name="4 sqmm DC Solar Cable",
                        brand="Polycab", quantity=kw * 40, unit="mtr",
                        unit_price_inr=90, total_inr=round(kw * 40 * 90, 0)))
    # AC Cables
    items.append(BOMItem(category="Cables", name="6 sqmm AC Cable",
                        brand="Havells", quantity=kw * 20, unit="mtr",
                        unit_price_inr=110, total_inr=round(kw * 20 * 110, 0)))
    # ACDB / DCDB
    items.append(BOMItem(category="Protection", name="ACDB + DCDB Combo",
                        brand="Havells", quantity=1, unit="set",
                        unit_price_inr=6500, total_inr=6500))
    # Earthing
    items.append(BOMItem(category="Earthing", name="Earthing Kit (3 pits)",
                        brand="Local", quantity=1, unit="set",
                        unit_price_inr=8500, total_inr=8500))
    # Lightning Arrestor
    items.append(BOMItem(category="Safety", name="Lightning Arrestor",
                        brand="Local", quantity=1, unit="pcs",
                        unit_price_inr=3500, total_inr=3500))
    # Installation labor
    items.append(BOMItem(category="Services", name="Installation & Commissioning",
                        brand="—", quantity=kw, unit="kW",
                        unit_price_inr=4000, total_inr=round(kw * 4000, 0)))
    subtotal = sum(i.total_inr for i in items)
    gst = subtotal * 0.138  # 13.8% blended GST
    return BOMResult(
        items=items,
        subtotal_inr=round(subtotal, 0),
        gst_inr=round(gst, 0),
        total_inr=round(subtotal + gst, 0),
    )


# =========================================================
# Routes: Auth
# =========================================================
@api_router.get("/")
async def root():
    return {"service": "PVDesign AI", "version": "1.0"}

@api_router.post("/auth/signup", response_model=AuthResponse)
async def signup(payload: SignupRequest):
    existing = await db.users.find_one({"email": payload.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "name": payload.name,
        "email": payload.email.lower(),
        "password": hash_pw(payload.password),
        "company": payload.company,
        "phone": payload.phone,
        "plan": "free",
        "projects_count": 0,
        "created_at": now_iso(),
    }
    await db.users.insert_one(user_doc)
    return AuthResponse(token=make_token(user_id), user=to_public_user(user_doc))

@api_router.post("/auth/login", response_model=AuthResponse)
async def login(payload: LoginRequest):
    user = await db.users.find_one({"email": payload.email.lower()})
    if not user or not verify_pw(payload.password, user.get("password", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    return AuthResponse(token=make_token(user["id"]), user=to_public_user(user))

@api_router.get("/auth/me", response_model=UserPublic)
async def me(user=Depends(get_current_user)):
    return to_public_user(user)


# =========================================================
# Routes: Calculators (stateless)
# =========================================================
@api_router.post("/calc/sizing", response_model=SizingResult)
async def calc_sizing_route(inp: SizingInput):
    return calc_sizing(inp)

@api_router.post("/calc/financial", response_model=FinancialResult)
async def calc_financial_route(fin: FinancialInput):
    # We need sizing → derive from system_kw
    sizing_inp = SizingInput(
        monthly_bill_inr=fin.monthly_bill_inr,
        tariff_inr_per_unit=fin.tariff_inr_per_unit,
        roof_area_sqft=fin.system_kw * 100,
        state="Maharashtra",
    )
    sizing = calc_sizing(sizing_inp)
    return calc_financial(fin, sizing)


# =========================================================
# Routes: Projects
# =========================================================
FREE_PROJECT_LIMIT = 3

@api_router.get("/projects", response_model=List[Project])
async def list_projects(user=Depends(get_current_user)):
    docs = await db.projects.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    return [Project(**d) for d in docs]

@api_router.post("/projects", response_model=Project)
async def create_project(payload: ProjectCreate, user=Depends(get_current_user)):
    plan = user.get("plan", "free")
    count = await db.projects.count_documents({"user_id": user["id"]})
    if plan == "free" and count >= FREE_PROJECT_LIMIT:
        raise HTTPException(status_code=402, detail=f"Free plan limit reached ({FREE_PROJECT_LIMIT} projects). Upgrade to Pro.")

    sizing = calc_sizing(payload.sizing_input)
    fin_input = payload.financial_input or FinancialInput(
        system_kw=sizing.final_kw,
        monthly_bill_inr=payload.sizing_input.monthly_bill_inr,
        tariff_inr_per_unit=payload.sizing_input.tariff_inr_per_unit,
    )
    fin_result = calc_financial(fin_input, sizing)
    bom = generate_bom(sizing, sizing.final_kw)

    project_id = str(uuid.uuid4())
    now = now_iso()
    proj = {
        "id": project_id,
        "user_id": user["id"],
        "name": payload.name,
        "customer_name": payload.customer_name,
        "customer_phone": payload.customer_phone,
        "customer_address": payload.customer_address,
        "sizing_input": payload.sizing_input.model_dump(),
        "sizing_result": sizing.model_dump(),
        "financial_input": fin_input.model_dump(),
        "financial_result": fin_result.model_dump(),
        "bom_result": bom.model_dump(),
        "ai_summary": None,
        "status": "draft",
        "created_at": now,
        "updated_at": now,
    }
    await db.projects.insert_one(proj)
    proj.pop("_id", None)
    return Project(**proj)

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, user=Depends(get_current_user)):
    doc = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**doc)

@api_router.patch("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, payload: ProjectUpdate, user=Depends(get_current_user)):
    doc = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    update = {k: v for k, v in payload.model_dump(exclude_none=True).items()}
    if "sizing_input" in update:
        s_in = SizingInput(**update["sizing_input"])
        sizing = calc_sizing(s_in)
        update["sizing_result"] = sizing.model_dump()
        fin_in_data = update.get("financial_input") or doc.get("financial_input") or FinancialInput(
            system_kw=sizing.final_kw,
            monthly_bill_inr=s_in.monthly_bill_inr,
            tariff_inr_per_unit=s_in.tariff_inr_per_unit,
        ).model_dump()
        fin_in = FinancialInput(**fin_in_data)
        update["financial_input"] = fin_in.model_dump()
        update["financial_result"] = calc_financial(fin_in, sizing).model_dump()
        update["bom_result"] = generate_bom(sizing, sizing.final_kw).model_dump()
    update["updated_at"] = now_iso()
    await db.projects.update_one({"id": project_id}, {"$set": update})
    doc = await db.projects.find_one({"id": project_id}, {"_id": 0})
    return Project(**doc)

@api_router.delete("/projects/{project_id}")
async def delete_project(project_id: str, user=Depends(get_current_user)):
    res = await db.projects.delete_one({"id": project_id, "user_id": user["id"]})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"ok": True}


# =========================================================
# Routes: AI Proposal + PDF
# =========================================================
@api_router.post("/projects/{project_id}/ai-summary")
async def ai_summary(project_id: str, user=Depends(get_current_user)):
    doc = await db.projects.find_one(
        {"id": project_id, "user_id": user["id"]},
        {"_id": 0}
    )

    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")

    summary = (
        f"Dear {doc['customer_name']}, based on your requirements we propose a "
        f"{doc['sizing_result']['final_kw']} kW rooftop solar system that will generate "
        f"approximately {doc['sizing_result']['annual_generation_kwh']:,.0f} kWh annually "
        f"and offset {doc['sizing_result']['co2_offset_tons_yr']} tons of CO2 each year.\n\n"
        f"The system pays for itself in "
        f"{doc['financial_result']['payback_years']} years with year-1 savings of "
        f"INR {doc['financial_result']['year1_savings_inr']:,.0f}, delivering a "
        f"25-year ROI of {doc['financial_result']['roi_pct']}%. "
        f"This is a smart, future-proof investment."
    )

    await db.projects.update_one(
        {"id": project_id},
        {
            "$set": {
                "ai_summary": summary,
                "updated_at": now_iso()
            }
        }
    )

    return {"summary": summary}
def build_pdf(project: dict) -> bytes:
    pdf = FPDF()
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    # Header band
    pdf.set_fill_color(10, 82, 55)
    pdf.rect(0, 0, 210, 30, style="F")
    pdf.set_text_color(255, 255, 255)
    pdf.set_font("Helvetica", "B", 20)
    pdf.set_xy(10, 8)
    pdf.cell(0, 8, "PVDesign AI  -  Solar Proposal", ln=1)
    pdf.set_font("Helvetica", "", 10)
    pdf.set_xy(10, 18)
    pdf.cell(0, 6, f"Project: {project['name']}", ln=1)

    pdf.set_text_color(28, 32, 36)
    pdf.ln(20)

    def h2(text):
        pdf.set_font("Helvetica", "B", 13)
        pdf.set_text_color(10, 82, 55)
        pdf.cell(0, 8, text, ln=1)
        pdf.set_text_color(28, 32, 36)

    def kv(k, v):
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(70, 6, k, border=0)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(0, 6, str(v), ln=1)

    h2("Customer Details")
    kv("Name", project["customer_name"])
    if project.get("customer_phone"):
        kv("Phone", project["customer_phone"])
    if project.get("customer_address"):
        kv("Address", project["customer_address"])
    pdf.ln(3)

    sr = project["sizing_result"]
    h2("System Design")
    kv("System capacity", f"{sr['final_kw']} kW")
    kv("Panels", f"{sr['panels_count']} x {sr['panel_wattage']}W")
    kv("Inverter", f"{sr['inverter_kw']} kW")
    kv("Annual generation", f"{sr['annual_generation_kwh']:,.0f} kWh")
    kv("CO2 offset / year", f"{sr['co2_offset_tons_yr']} tons")
    pdf.ln(3)

    fr = project.get("financial_result") or {}
    if fr:
        h2("Financial Summary")
        kv("System cost", f"INR {fr['system_cost_inr']:,.0f}")
        kv("Net cost (after subsidy)", f"INR {fr['net_cost_after_subsidy_inr']:,.0f}")
        kv("Year-1 savings", f"INR {fr['year1_savings_inr']:,.0f}")
        kv("Payback period", f"{fr['payback_years']} years")
        kv("25-yr ROI", f"{fr['roi_pct']}%")
        kv("Lifetime savings", f"INR {fr['lifetime_savings_inr']:,.0f}")
        pdf.ln(3)

    bom = project.get("bom_result") or {}
    if bom:
        h2("Bill of Materials")
        pdf.set_font("Helvetica", "B", 9)
        pdf.set_fill_color(233, 236, 239)
        pdf.cell(60, 6, "Item", border=0, fill=True)
        pdf.cell(30, 6, "Brand", border=0, fill=True)
        pdf.cell(30, 6, "Qty", border=0, fill=True)
        pdf.cell(35, 6, "Unit Price", border=0, fill=True)
        pdf.cell(35, 6, "Total", border=0, fill=True, ln=1)
        pdf.set_font("Helvetica", "", 9)
        for it in bom["items"]:
            pdf.cell(60, 6, it["name"][:35], border=0)
            pdf.cell(30, 6, it["brand"], border=0)
            pdf.cell(30, 6, f"{it['quantity']:g} {it['unit']}", border=0)
            pdf.cell(35, 6, f"INR {it['unit_price_inr']:,.0f}", border=0)
            pdf.cell(35, 6, f"INR {it['total_inr']:,.0f}", border=0, ln=1)
        pdf.ln(2)
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(155, 6, "Subtotal", border=0)
        pdf.cell(35, 6, f"INR {bom['subtotal_inr']:,.0f}", border=0, ln=1)
        pdf.cell(155, 6, "GST (13.8%)", border=0)
        pdf.cell(35, 6, f"INR {bom['gst_inr']:,.0f}", border=0, ln=1)
        pdf.set_fill_color(232, 245, 233)
        pdf.cell(155, 8, "Grand Total", border=0, fill=True)
        pdf.cell(35, 8, f"INR {bom['total_inr']:,.0f}", border=0, fill=True, ln=1)
        pdf.ln(3)

    if project.get("ai_summary"):
        h2("Executive Summary")
        pdf.set_font("Helvetica", "", 10)
        # Strip non-latin1 chars to avoid FPDF unicode error
        safe = project["ai_summary"].encode("latin-1", "ignore").decode("latin-1")
        pdf.multi_cell(0, 5, safe)

    out = pdf.output(dest="S")
    if isinstance(out, str):
        out = out.encode("latin-1")
    return bytes(out)


@api_router.post("/projects/{project_id}/pdf")
async def generate_pdf(project_id: str, user=Depends(get_current_user)):
    doc = await db.projects.find_one({"id": project_id, "user_id": user["id"]}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Project not found")
    pdf_bytes = build_pdf(doc)
    b64 = base64.b64encode(pdf_bytes).decode()
    return {"filename": f"{doc['name'].replace(' ', '_')}_proposal.pdf", "pdf_base64": b64}


# =========================================================
# Routes: Subscription (Razorpay)
# =========================================================
PLANS = {
    "free":     {"id": "free",     "name": "Free",     "price_inr": 0,    "features": ["3 projects", "Basic calculators", "PDF export"]},
    "pro":      {"id": "pro",      "name": "Pro",      "price_inr": 999,  "features": ["Unlimited projects", "AI proposals", "Priority support"]},
    "business": {"id": "business", "name": "Business", "price_inr": 2999, "features": ["Everything in Pro", "Team access (5 users)", "White-label branding"]},
}

@api_router.get("/plans")
async def get_plans():
    return list(PLANS.values())

def _rzp_client():
    if RAZORPAY_KEY_ID.startswith("rzp_") and RAZORPAY_KEY_SECRET and RAZORPAY_KEY_SECRET != "placeholder_secret":
        return razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))
    return None

@api_router.post("/subscription/order")
async def create_subscription_order(payload: RazorpayOrderRequest, user=Depends(get_current_user)):
    plan = PLANS.get(payload.plan_id)
    if not plan or plan["price_inr"] <= 0:
        raise HTTPException(status_code=400, detail="Invalid plan")
    amount_paise = plan["price_inr"] * 100
    rzp = _rzp_client()
    if rzp is None:
        # Mock order
        order = {
            "id": f"order_mock_{uuid.uuid4().hex[:12]}",
            "amount": amount_paise,
            "currency": "INR",
            "status": "created",
            "mock": True,
        }
    else:
        try:
            order = rzp.order.create({
                "amount": amount_paise, "currency": "INR",
                "receipt": f"rcpt_{user['id'][:8]}_{payload.plan_id}",
                "notes": {"user_id": user["id"], "plan_id": payload.plan_id},
            })
            order["mock"] = False
        except Exception as e:
            logger.exception("Razorpay order failed")
            raise HTTPException(status_code=500, detail=f"Razorpay error: {e}")
    return {
        "order_id": order["id"], "amount": order["amount"], "currency": order["currency"],
        "key_id": RAZORPAY_KEY_ID, "plan": plan, "mock": order.get("mock", False),
    }

@api_router.post("/subscription/verify")
async def verify_subscription(payload: RazorpayVerifyRequest, user=Depends(get_current_user)):
    plan = PLANS.get(payload.plan_id)
    if not plan:
        raise HTTPException(status_code=400, detail="Invalid plan")
    is_mock = payload.razorpay_order_id.startswith("order_mock_")
    verified = False
    if is_mock:
        verified = True
    else:
        try:
            body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
            expected = hmac.new(RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
            verified = hmac.compare_digest(expected, payload.razorpay_signature)
        except Exception:
            verified = False
    if not verified:
        raise HTTPException(status_code=400, detail="Signature verification failed")
    await db.users.update_one({"id": user["id"]}, {"$set": {"plan": payload.plan_id, "plan_updated_at": now_iso()}})
    await db.payments.insert_one({
        "id": str(uuid.uuid4()), "user_id": user["id"], "plan_id": payload.plan_id,
        "order_id": payload.razorpay_order_id, "payment_id": payload.razorpay_payment_id,
        "amount_inr": plan["price_inr"], "created_at": now_iso(), "mock": is_mock,
    })
    return {"ok": True, "plan": payload.plan_id, "mock": is_mock}


# =========================================================
# App wiring
# =========================================================
app.include_router(api_router)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()