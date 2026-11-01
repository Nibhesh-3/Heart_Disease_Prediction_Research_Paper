from sqlalchemy import Column, Float, ForeignKey, Integer, String, create_engine, DateTime
from sqlalchemy.orm import declarative_base, relationship, sessionmaker
from dotenv import load_dotenv
import os
from datetime import datetime
load_dotenv(verbose=True)
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

Redis_url = os.getenv("REDIS_URL")

connect_args = (
    {"check_same_thread": False}
    if DATABASE_URL.startswith("sqlite")
    else {}
)

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    pool_pre_ping=True
)
Base = declarative_base()
Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)



class UserModel(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True, unique=True)
    name = Column(String, index=True)
    username=Column(String, index=True, unique=True)
    email = Column(String, unique=True, index=True)
    password = Column(String, unique=False, index=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow)

class PatientdataModel(Base):
    __tablename__ = 'patientdata'
    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), index=True)
    name = Column(String, index=True)

    # Input data – 13 UCI Heart Disease features
    age = Column(Float, nullable=True)
    sex = Column(Float, nullable=True)
    cp = Column(Float, nullable=True)
    trestbps = Column(Float, nullable=True)
    chol = Column(Float, nullable=True)
    fbs = Column(Float, nullable=True)
    restecg = Column(Float, nullable=True)
    thalach = Column(Float, nullable=True)
    exang = Column(Float, nullable=True)
    oldpeak = Column(Float, nullable=True)
    slope = Column(Float, nullable=True)
    ca = Column(Float, nullable=True)
    thal = Column(Float, nullable=True)

    # Output
    prediction_code = Column(Integer, nullable=True)
    risk_score = Column(Float, nullable=True)
    prediction = Column(String, nullable=True)
    clinical_guidance = Column(String, nullable=True)

Base.metadata.create_all(bind=engine)

# Auto-migrate missing columns for existing PostgreSQL / SQLite tables
def _ensure_columns():
    from sqlalchemy import text
    try:
        with engine.connect() as conn:
            if DATABASE_URL.startswith("postgresql"):
                conn.execute(text("ALTER TABLE patientdata ADD COLUMN IF NOT EXISTS risk_score FLOAT;"))
                conn.commit()
            elif DATABASE_URL.startswith("sqlite"):
                # SQLite fallback
                try:
                    conn.execute(text("ALTER TABLE patientdata ADD COLUMN risk_score FLOAT;"))
                    conn.commit()
                except Exception:
                    pass
    except Exception as e:
        print(f"Schema verification note: {e}")

_ensure_columns()


def get_db():
    db = Session()
    try:
        yield db
    finally:
        db.close()


