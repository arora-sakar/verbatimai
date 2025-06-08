from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from typing import Any, Union, Optional

from ..db.database import get_db
from ..models.models import User
from ..schemas.schemas import UserCreate, UserResponse, Token, TokenData, UserLogin, PasswordResetRequest, PasswordReset
from ..core.config import settings
from ..services.email_service import send_email as send_email_service

router = APIRouter()

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

# Helper functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Log token info (masked)
        token_prefix = token[:10] if len(token) > 10 else token
        print(f"Decoding token: {token_prefix}...")
        
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: int = payload.get("sub")
        print(f"Decoded user_id: {user_id}")
        
        if user_id is None:
            print("No user_id in token payload")
            raise credentials_exception
            
        token_data = TokenData(user_id=user_id)
    except JWTError as e:
        print(f"JWT Error: {str(e)}")
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        print(f"User with ID {token_data.user_id} not found in database")
        raise credentials_exception
        
    print(f"Authenticated user: {user.email}")
    return user

# Authentication endpoints
@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        business_name=user_data.business_name,
    )
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    return new_user

@router.post("/login", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Authenticate user
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login/json", response_model=dict)
def login_json(user_data: UserLogin, db: Session = Depends(get_db)):
    # Authenticate user
    user = db.query(User).filter(User.email == user_data.email).first()
    if not user or not verify_password(user_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires,
    )
    
    # Return user info and token
    return {
        "user": {
            "id": user.id,
            "email": user.email,
            "business_name": user.business_name,
        },
        "token": access_token,
    }

@router.get("/verify", response_model=UserResponse)
def verify_token(current_user: User = Depends(get_current_user)):
    """Verify token and return current user data"""
    return current_user

# Password Reset Functions
def create_password_reset_token(email: str) -> str:
    """Create a password reset token for the given email"""
    expire = datetime.utcnow() + timedelta(hours=1)  # Token expires in 1 hour
    to_encode = {
        "email": email,
        "type": "password_reset",
        "exp": expire
    }
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def verify_password_reset_token(token: str) -> Optional[str]:
    """Verify password reset token and return email if valid"""
    try:
        if not token:
            return None
            
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        
        # Check if this is a password reset token
        if payload.get("type") != "password_reset":
            return None
            
        email = payload.get("email")
        if email is None:
            return None
            
        return email
    except JWTError:
        return None

def generate_password_reset_email_template(email: str, token: str) -> str:
    """Generate HTML email template for password reset"""
    reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Password Reset Request</title>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background-color: #f8f9fa; padding: 20px; text-align: center; }}
            .content {{ padding: 20px; }}
            .button {{ 
                display: inline-block; 
                background-color: #007bff; 
                color: white; 
                padding: 12px 30px; 
                text-decoration: none; 
                border-radius: 5px; 
                margin: 20px 0;
            }}
            .footer {{ 
                background-color: #f8f9fa; 
                padding: 15px; 
                text-align: center; 
                font-size: 12px; 
                color: #666;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Password Reset Request</h1>
            </div>
            <div class="content">
                <p>Hi there,</p>
                <p>You recently requested to reset your password for your VerbatimAI account ({email}).</p>
                <p>To reset your password, please click the button below:</p>
                <p style="text-align: center;">
                    <a href="{reset_url}" class="button">Reset Your Password</a>
                </p>
                <p>If you can't click the button, copy and paste this link into your browser:</p>
                <p style="word-break: break-all;">{reset_url}</p>
                <p><strong>This link will expire in 1 hour for security reasons.</strong></p>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
                <p>Best regards,<br>The VerbatimAI Team</p>
            </div>
            <div class="footer">
                <p>This is an automated email. Please do not reply to this email.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_content

def send_password_reset_email(email: str, token: str) -> bool:
    """Send password reset email to user"""
    try:
        subject = "Password Reset Request"
        html_content = generate_password_reset_email_template(email, token)
        
        return send_email_service(
            to_email=email,
            subject=subject,
            html_content=html_content
        )
    except Exception as e:
        print(f"Failed to send password reset email: {str(e)}")
        return False

# Password Reset API Endpoints
@router.post("/request-password-reset")
def request_password_reset(request_data: PasswordResetRequest, db: Session = Depends(get_db)):
    """Request a password reset email"""
    # Look up user by email
    user = db.query(User).filter(User.email == request_data.email).first()
    
    # Always return success message for security (don't reveal if email exists)
    success_message = {
        "message": "If an account with that email exists, we've sent password reset instructions."
    }
    
    # If user exists, send reset email
    if user:
        reset_token = create_password_reset_token(user.email)
        
        # Log token for development purposes
        if settings.APP_ENV in ["development", "test"]:
            print(f"\n🔐 PASSWORD RESET TOKEN FOR TESTING:")
            print(f"📧 Email: {user.email}")
            print(f"🎫 Token: {reset_token}")
            print(f"🔗 Reset URL: {settings.FRONTEND_URL}/reset-password?token={reset_token}")
            print(f"⏰ Expires: 1 hour from now\n")
        
        # Send email
        email_sent = send_password_reset_email(user.email, reset_token)
        
        if not email_sent:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to send password reset email. Please try again later."
            )
    
    return success_message

@router.post("/reset-password")
def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    """Reset password using valid token"""
    # Verify the reset token
    email = verify_password_reset_token(reset_data.token)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token"
        )
    
    # Find user by email
    user = db.query(User).filter(User.email == email).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Update user's password
    user.hashed_password = get_password_hash(reset_data.new_password)
    db.commit()
    
    return {"message": "Password has been reset successfully"}