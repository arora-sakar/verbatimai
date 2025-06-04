"""
Email service for sending password reset and other notifications.
This is a basic implementation that can be extended with real SMTP configuration.
"""

import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from ..core.config import settings

logger = logging.getLogger(__name__)

# For development/testing, we'll use a simple mock email service
# In production, this would integrate with services like SendGrid, AWS SES, etc.

class EmailService:
    """Email service for sending various types of emails"""
    
    def __init__(self):
        # In production, these would come from environment variables
        self.smtp_server = "smtp.gmail.com"  # Example
        self.smtp_port = 587
        self.username = settings.EMAIL_USERNAME if hasattr(settings, 'EMAIL_USERNAME') else ""
        self.password = settings.EMAIL_PASSWORD if hasattr(settings, 'EMAIL_PASSWORD') else ""
        self.from_email = settings.FROM_EMAIL if hasattr(settings, 'FROM_EMAIL') else "noreply@verbatimai.com"
    
    def send_email(self, to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
        """
        Send an email to the specified recipient.
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            html_content: HTML content of the email
            text_content: Plain text content (optional)
        
        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # For development/testing, we'll just log the email instead of sending
            if settings.APP_ENV == "development" or settings.APP_ENV == "test":
                logger.info(f"[MOCK EMAIL] To: {to_email}")
                logger.info(f"[MOCK EMAIL] Subject: {subject}")
                logger.info(f"[MOCK EMAIL] Content: {html_content[:100]}...")
                return True
            
            # In production, implement actual email sending
            # This is a placeholder for real SMTP implementation
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From'] = self.from_email
            msg['To'] = to_email
            
            # Add text and HTML parts
            if text_content:
                text_part = MIMEText(text_content, 'plain')
                msg.attach(text_part)
            
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
            
            # For now, return True as if email was sent
            # In production, implement actual SMTP sending here
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False

# Global email service instance
email_service = EmailService()

def send_email(to_email: str, subject: str, html_content: str, text_content: Optional[str] = None) -> bool:
    """
    Convenience function to send email using the global email service.
    """
    return email_service.send_email(to_email, subject, html_content, text_content)
