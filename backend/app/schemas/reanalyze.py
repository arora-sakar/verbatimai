# DEPRECATED: Re-analyze feature removed
# This file is kept for reference only
# Remove this file when confident the feature won't be needed

# from pydantic import BaseModel
# from typing import List, Optional
# from datetime import datetime

# class FeedbackFilterParams(BaseModel):
#     sentiment: Optional[str] = None
#     source: Optional[str] = None
#     date_from: Optional[datetime] = None
#     date_to: Optional[datetime] = None

# class ReanalyzeRequest(BaseModel):
#     filter_params: Optional[FeedbackFilterParams] = None
#     specific_ids: Optional[List[int]] = None
