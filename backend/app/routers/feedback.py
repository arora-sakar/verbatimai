from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from fastapi.responses import JSONResponse
import re
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
import pandas as pd
import io
import csv  # Import csv module for quoting constants
import json

from ..db.database import get_db
from ..models.models import User, FeedbackItem
from ..schemas.schemas import FeedbackCreate, FeedbackResponse
from ..schemas.reanalyze import FeedbackFilterParams, ReanalyzeRequest
from ..routers.auth import get_current_user
from ..services.ai_service import analyze_feedback
from ..services.universal_review_importer import universal_importer
from ..core.config import settings

# Custom JSON encoder to handle datetime objects
class DateTimeEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# Custom JSONResponse class that uses our DateTimeEncoder
class CustomJSONResponse(JSONResponse):
    def render(self, content) -> bytes:
        return json.dumps(
            content,
            ensure_ascii=False,
            allow_nan=False,
            indent=None,
            separators=(",", ":"),
            cls=DateTimeEncoder,  # Use our custom encoder
        ).encode("utf-8")

router = APIRouter()

@router.post("/", response_model=FeedbackResponse, status_code=status.HTTP_201_CREATED)
async def create_feedback(
    feedback_data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a single feedback item"""
    # Check usage limits
    if await check_usage_limits(db, current_user):
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=f"Free tier limit of {settings.FREE_TIER_FEEDBACK_LIMIT} feedback items per month reached",
        )
    
    # Create feedback item
    new_feedback = FeedbackItem(
        feedback_text=feedback_data.feedback_text,
        source=feedback_data.source,
        rating=feedback_data.rating,
        customer_name=feedback_data.customer_name,
        customer_email=feedback_data.customer_email,
        owner_id=current_user.id,
    )
    
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    # Analyze feedback asynchronously
    await analyze_and_update_feedback(db, new_feedback)
    
    return new_feedback

@router.get("/supported-formats")
async def get_supported_formats(
    current_user: User = Depends(get_current_user)
):
    """
    Return information about supported CSV formats and column mappings
    """
    try:
        return universal_importer.get_supported_formats()
    except Exception as e:
        print(f"Error in get_supported_formats: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving supported formats: {str(e)}"
        )

@router.post("/upload-csv", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_csv_feedback(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload and process CSV file with feedback"""
    # Check file size
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the {settings.MAX_UPLOAD_SIZE / (1024 * 1024)}MB limit",
        )
    
    # Read CSV file
    try:
        # Read CSV file and handle missing values
        contents = await file.read()
        
        try:
            # First try to preview the file to detect possible issues
            csv_content = contents.decode('utf-8')
            
            # Check for common CSV issues before parsing
            lines = csv_content.split('\n')
            header = lines[0].strip().split(',')
            header_count = len(header)
            
            # Check if any lines have inconsistent column counts
            for i, line in enumerate(lines[1:], 1):
                if line.strip():  # Skip empty lines
                    # Count commas not inside quotes
                    in_quotes = False
                    comma_count = 0
                    for char in line:
                        if char == '"':
                            in_quotes = not in_quotes
                        elif char == ',' and not in_quotes:
                            comma_count += 1
                    
                    field_count = comma_count + 1
                    if field_count != header_count:
                        # Provide a more helpful error message with sample line content
                        line_preview = line[:50] + "..." if len(line) > 50 else line
                        raise HTTPException(
                            status_code=status.HTTP_400_BAD_REQUEST,
                            detail=f"CSV Format Error: Line {i+1} has {field_count} columns when {header_count} were expected.\n\nPossible issues:\n1. Unquoted commas in text fields\n2. Missing or extra commas\n3. Incorrect quoting\n\nProblematic line preview: {line_preview}\n\nTip: All text containing commas should be enclosed in double quotes (\"text, with commas\")."
                        )
            
            # Try to parse the CSV with pandas
            df = pd.read_csv(
                io.StringIO(csv_content),
                on_bad_lines='warn',  # Warn about bad lines but don't fail
                quoting=csv.QUOTE_MINIMAL,  # Handle quoted fields with commas
                escapechar='\\',  # Allow escaping of special characters
                skipinitialspace=True,  # Skip spaces after delimiter
                encoding='utf-8',  # Ensure proper encoding
                engine='python'  # Use the more flexible Python parser
            )
            
            # Replace NaN values with None (will become NULL in the database)
            df = df.where(pd.notnull(df), None)
        except HTTPException:
            # Re-raise our custom formatted exceptions
            raise
        except Exception as csv_error:
            # More user-friendly error message for CSV parsing issues
            error_message = str(csv_error)
            
            if "Expected" in error_message and "fields" in error_message and "saw" in error_message:
                # Format a more user-friendly message for inconsistent column counts
                line_match = re.search(r'line (\d+)', error_message)
                line_number = line_match.group(1) if line_match else "some"
                
                expected_match = re.search(r'Expected (\d+) fields', error_message)
                expected = expected_match.group(1) if expected_match else "a certain number of"
                
                saw_match = re.search(r'saw (\d+)', error_message)
                saw = saw_match.group(1) if saw_match else "a different number of"
                
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CSV Format Error: Line {line_number} has {saw} columns when {expected} were expected.\n\nHow to fix this:\n1. Make sure all text fields containing commas are enclosed in double quotes\n2. Check line {line_number} for missing or extra commas\n3. Consider opening your CSV in a spreadsheet application to fix formatting issues\n\nExpected format: feedback_text,source,rating,customer_id\nExample: \"Great service, very responsive\",Email,5,customer123"
                )
            elif "could not convert string to float" in error_message:
                # Handle numeric conversion errors
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CSV Format Error: A column expected to be numeric contains text.\n\nPossible issues:\n1. Rating column contains non-numeric values\n2. Columns are in the wrong order\n\nPlease check your CSV file and ensure numeric columns only contain numbers."
                )
            else:
                # Handle other CSV parsing errors
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"CSV Parsing Error: There's an issue with your file format.\n\nDetails: {error_message}\n\nPlease check that:\n1. Your CSV has the required 'feedback_text' column\n2. Text with commas is properly quoted\n3. Each row has the same number of columns as the header"
                )
        
        # Validate CSV structure
        if 'feedback_text' not in df.columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV must contain a 'feedback_text' column",
            )
        
        # Map columns
        columns_map = {
            'date': 'created_at',
            'source': 'source',
            'customer_id': 'customer_name',
        }
        
        # Process each row
        created_count = 0
        failed_count = 0
        new_feedback_items = []  # Keep track of created feedback items
        
        for _, row in df.iterrows():
            # Check usage limits
            if await check_usage_limits(db, current_user):
                break
            
            try:
                # Skip rows with empty feedback_text
                if row['feedback_text'] is None or pd.isna(row['feedback_text']) or str(row['feedback_text']).strip() == '':
                    print(f"Skipping row with empty feedback_text")
                    failed_count += 1
                    continue
                    
                feedback_data = {
                    'feedback_text': str(row['feedback_text']),  # Ensure it's a string
                    'source': row.get('source', 'CSV Upload') if not pd.isna(row.get('source')) else 'CSV Upload',
                    'customer_name': row.get('customer_id') if not pd.isna(row.get('customer_id')) else None,
                    'owner_id': current_user.id,
                }
                
                # Handle rating - convert to integer if present
                if 'rating' in row and row['rating'] is not None and not pd.isna(row['rating']):
                    try:
                        feedback_data['rating'] = int(row['rating'])
                    except (ValueError, TypeError):
                        # If rating can't be converted to int, skip it
                        pass
                
                new_feedback = FeedbackItem(**feedback_data)
                db.add(new_feedback)
                new_feedback_items.append(new_feedback)  # Add to our tracking list
                created_count += 1
            except Exception as e:
                print(f"Error processing row: {str(e)}")
                failed_count += 1
        
        # Commit all changes
        try:
            db.commit()
        except Exception as e:
            db.rollback()  # Rollback the transaction on error
            print(f"Database error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error saving feedback: {str(e)}",
            )
        
        # Only process feedback items if the commit was successful
        print(f"Analyzing {len(new_feedback_items)} feedback items...")
        for feedback_item in new_feedback_items:
            try:
                await analyze_and_update_feedback(db, feedback_item)
                print(f"Analyzed feedback item {feedback_item.id}: {feedback_item.sentiment}")
            except Exception as e:
                print(f"Error analyzing feedback item: {str(e)}")
        
        return {
            "status": "success",
            "created": created_count,
            "failed": failed_count,
            "total": created_count + failed_count,
        }
    
    except HTTPException:
        # Re-raise custom HTTP exceptions
        raise
    except Exception as e:
        # General error handler
        error_message = str(e)
        status_code = status.HTTP_400_BAD_REQUEST
        
        # Provide more specific guidance based on common error patterns
        if "memory" in error_message.lower():
            detail = f"The file is too large to process. Please keep files under {settings.MAX_UPLOAD_SIZE / (1024 * 1024)}MB or split into smaller files."
        elif "encoding" in error_message.lower():
            detail = f"File encoding error: {error_message}. Please save your CSV file with UTF-8 encoding and try again."
        elif "feedback_text" in error_message.lower():
            detail = "The CSV file must contain a 'feedback_text' column. Please check your column headers."
        else:
            detail = f"Error processing CSV file: {error_message}. Please check the file format and try again."
        
        raise HTTPException(
            status_code=status_code,
            detail=detail
        )



@router.get("/")
async def get_feedback(
    skip: Optional[int] = Query(0, ge=0),
    limit: Optional[int] = Query(20, ge=1, le=100),
    sentiment: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get paginated feedback items with optional filtering"""
    # Log request parameters
    print(f"Get feedback params - skip: {skip}, limit: {limit}, sentiment: {sentiment}, source: {source}, search: {search}")
    
    # Convert parameters to correct types
    try:
        skip = int(skip) if skip is not None else 0
        limit = int(limit) if limit is not None else 20
        # Ensure limit is within bounds
        limit = min(max(1, limit), 100)
    except ValueError as e:
        print(f"Parameter conversion error: {str(e)}")
        skip = 0
        limit = 20
    
    # Get user ID
    user_id = current_user.id
    print(f"User ID: {user_id}")

    query = db.query(FeedbackItem).filter(FeedbackItem.owner_id == user_id)
    
    # Apply filters
    if sentiment and sentiment in ['positive', 'negative', 'neutral']:
        query = query.filter(FeedbackItem.sentiment == sentiment)
    
    if source:
        query = query.filter(FeedbackItem.source == source)
    
    if search:
        query = query.filter(FeedbackItem.feedback_text.ilike(f"%{search}%"))
    
    # Get total count before pagination
    total = query.count()
    
    # Apply pagination
    items = query.order_by(FeedbackItem.created_at.desc()).offset(skip).limit(limit).all()
    
    # Convert SQLAlchemy models to JSON-compatible format
    items_data = []
    for item in items:
        item_dict = {
            "id": item.id,
            "feedback_text": item.feedback_text,
            "source": item.source,
            "rating": item.rating,
            "sentiment": item.sentiment,
            "topics": item.topics,
            "created_at": item.created_at,
            "customer_name": item.customer_name,
            "customer_email": item.customer_email
        }
        items_data.append(item_dict)
    
    # Create a response with total count header and proper datetime handling
    response = CustomJSONResponse(
        content=items_data,
        headers={"X-Total-Count": str(total)}
    )
    
    return response

@router.get("/{feedback_id}", response_model=FeedbackResponse)
async def get_feedback_by_id(
    feedback_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific feedback item by ID"""
    feedback = db.query(FeedbackItem).filter(
        FeedbackItem.id == feedback_id,
        FeedbackItem.owner_id == current_user.id
    ).first()
    
    if not feedback:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Feedback not found",
        )
    
    return feedback

@router.post("/reanalyze", response_model=dict)
async def reanalyze_feedback(
    request_data: ReanalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Re-analyze feedback items using the current sentiment analysis algorithm"""
    # In a production system, you'd want to check for admin privileges here
    # if not current_user.is_admin:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Admin privileges required for this operation"
    #     )
    
    # Build query based on filter params or specific IDs
    query = db.query(FeedbackItem).filter(FeedbackItem.owner_id == current_user.id)
    
    if request_data.specific_ids:
        # Process specific feedback items by ID
        query = query.filter(FeedbackItem.id.in_(request_data.specific_ids))
    elif request_data.filter_params:
        # Apply filters if provided
        filter_params = request_data.filter_params
        if filter_params.sentiment:
            query = query.filter(FeedbackItem.sentiment == filter_params.sentiment)
        if filter_params.source:
            query = query.filter(FeedbackItem.source == filter_params.source)
        if filter_params.date_from:
            query = query.filter(FeedbackItem.created_at >= filter_params.date_from)
        if filter_params.date_to:
            query = query.filter(FeedbackItem.created_at <= filter_params.date_to)
    
    # Get feedback items to re-analyze
    items_to_process = query.all()
    
    # Process in batches to avoid overwhelming the system
    batch_size = 50
    total_items = len(items_to_process)
    processed_count = 0
    changed_count = 0
    
    print(f"Starting re-analysis of {total_items} feedback items")
    
    # Process items in batches
    for i in range(0, total_items, batch_size):
        batch = items_to_process[i:i+batch_size]
        
        for item in batch:
            old_sentiment = item.sentiment
            
            # Re-analyze using current algorithm
            try:
                result = await analyze_feedback(item.feedback_text, item.rating)
                item.sentiment = result.get("sentiment")
                
                # Ensure topics is a list for PostgreSQL ARRAY type
                topics = result.get("topics", [])
                if not isinstance(topics, list):
                    # Convert any non-list type to list
                    topics = [str(topics)] if topics else []
                
                # Ensure all items are strings and limit to 5 topics
                item.topics = [str(topic) for topic in topics if topic][:5]
                item.processed_at = datetime.now()
                
                # Count items where sentiment changed
                if old_sentiment != item.sentiment:
                    changed_count += 1
                    print(f"Sentiment changed for item {item.id}: {old_sentiment} -> {item.sentiment}")
                
                processed_count += 1
            except Exception as e:
                print(f"Error re-analyzing feedback item {item.id}: {str(e)}")
        
        # Commit changes for this batch
        db.commit()
        print(f"Processed batch: {i}-{min(i+batch_size, total_items)} of {total_items}")
    
    return {
        "status": "success",
        "processed": processed_count,
        "changed": changed_count,
        "total": total_items
    }

# Helper functions
async def check_usage_limits(db: Session, user: User) -> bool:
    """Check if user has reached the free tier feedback limit"""
    # This is a simplified implementation
    # In a real app, you'd track monthly usage and reset counters
    
    # Count feedback items for current user
    count = db.query(FeedbackItem).filter(FeedbackItem.owner_id == user.id).count()
    
    # Return True if limit reached
    return count >= settings.FREE_TIER_FEEDBACK_LIMIT

async def analyze_and_update_feedback(db: Session, feedback: FeedbackItem):
    """Analyze feedback using AI service and update the database"""
    try:
        print(f"Starting analysis for feedback: '{feedback.feedback_text[:50]}...'")
        
        # Call AI service to analyze feedback with rating
        result = await analyze_feedback(feedback.feedback_text, feedback.rating)
        print(f"Analysis result: {result}")
        
        # Update feedback with analysis results
        feedback.sentiment = result.get("sentiment")
        
        # Ensure topics is a list for PostgreSQL ARRAY type
        topics = result.get("topics", [])
        if not isinstance(topics, list):
            # Convert any non-list type to list
            topics = [str(topics)] if topics else []
        
        # Ensure all items are strings and limit to 5 topics
        feedback.topics = [str(topic) for topic in topics if topic][:5]
        feedback.processed_at = datetime.now()
        
        db.commit()
        print(f"Updated feedback item {feedback.id} with sentiment: {feedback.sentiment}, topics: {feedback.topics}")
    except Exception as e:
        print(f"Error analyzing feedback: {str(e)}")
        # Rollback the transaction on error
        db.rollback()
        # In a real app, you'd want better error handling and retry logic

@router.post("/upload-universal", response_model=dict, status_code=status.HTTP_201_CREATED)
async def upload_universal_reviews(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Universal review uploader that accepts CSV exports from any platform
    """
    
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    # Check file size
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds the {settings.MAX_UPLOAD_SIZE / (1024 * 1024)}MB limit",
        )
    
    try:
        # Read CSV content
        content = await file.read()
        csv_content = content.decode('utf-8')
        df = pd.read_csv(io.StringIO(csv_content))
        
        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty")
        
        # Detect platform
        platform = universal_importer.detect_platform(df.columns.tolist())
        
        # Map columns to universal format
        mapped_df = universal_importer.map_columns(df, platform)
        
        # Validate and clean data
        clean_df, validation_stats = universal_importer.validate_and_clean(mapped_df)
        
        if clean_df.empty:
            raise HTTPException(
                status_code=400, 
                detail="No valid review data found after processing"
            )
        
        # Convert to FeedbackItem records
        feedback_items = []
        for _, row in clean_df.iterrows():
            # Check usage limits
            if await check_usage_limits(db, current_user):
                break
                
            # Create comprehensive feedback text
            feedback_text = ""
            if pd.notna(row.get('rating')):
                feedback_text += f"Rating: {row['rating']}/5 stars. "
            if row.get('comment'):
                feedback_text += str(row['comment'])
            
            if not feedback_text.strip():
                feedback_text = f"{row.get('rating', 'No')}/5 star rating (no comment)"
            
            feedback_item = FeedbackItem(
                feedback_text=feedback_text,
                source=row.get('source', platform.title()),
                rating=row.get('rating') if pd.notna(row.get('rating')) else None,
                customer_name=row.get('reviewer_name'),
                date=row.get('date') if pd.notna(row.get('date')) else None,
                imported_via='universal_csv',
                original_platform=platform,
                owner_id=current_user.id
            )
            
            feedback_items.append(feedback_item)
        
        # Batch insert
        db.add_all(feedback_items)
        db.commit()
        
        # Trigger AI analysis for all items
        analyzed_count = 0
        for item in feedback_items:
            try:
                await analyze_and_update_feedback(db, item)
                analyzed_count += 1
            except Exception as e:
                print(f"AI analysis failed for item {item.id}: {str(e)}")
        
        # Get source breakdown
        source_breakdown = {}
        for item in feedback_items:
            source = item.source
            source_breakdown[source] = source_breakdown.get(source, 0) + 1
        
        return {
            "message": f"Successfully imported {len(feedback_items)} reviews",
            "detected_platform": platform,
            "imported_count": len(feedback_items),
            "analyzed_count": analyzed_count,
            "source_breakdown": source_breakdown,
            "validation_stats": validation_stats
        }
        
    except pd.errors.EmptyDataError:
        raise HTTPException(status_code=400, detail="CSV file is empty or corrupted")
    except UnicodeDecodeError:
        raise HTTPException(status_code=400, detail="Unable to decode CSV file. Please ensure it's UTF-8 encoded")
    except Exception as e:
        print(f"Universal CSV upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")



@router.post("/validate-csv")
async def validate_csv_format(file: UploadFile = File(...)):
    """
    Validate CSV format without importing (preview functionality)
    """
    # Check file size before processing
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        return {
            "valid": False,
            "error": f"File size ({file.size / (1024 * 1024):.1f}MB) exceeds the {settings.MAX_UPLOAD_SIZE / (1024 * 1024)}MB limit",
            "suggestions": [
                f"Please reduce file size to under {settings.MAX_UPLOAD_SIZE / (1024 * 1024)}MB",
                "Consider splitting large files into smaller chunks",
                "Remove unnecessary columns or rows"
            ]
        }
    
    try:
        content = await file.read()
        csv_content = content.decode('utf-8')
        return universal_importer.preview_csv(csv_content)
        
    except Exception as e:
        return {
            "valid": False,
            "error": str(e),
            "suggestions": [
                "Ensure file is a valid CSV",
                "Check that required columns exist",
                "Verify data format matches expected types"
            ]
        }