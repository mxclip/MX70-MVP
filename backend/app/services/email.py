import boto3
from typing import List
from botocore.exceptions import ClientError
from ..config import get_settings

settings = get_settings()

# Initialize SES client
ses_client = boto3.client(
    'ses',
    aws_access_key_id=settings.aws_access_key_id,
    aws_secret_access_key=settings.aws_secret_access_key,
    region_name=settings.ses_region
)

async def send_email(
    to_emails: List[str],
    subject: str,
    html_body: str,
    text_body: str = None
):
    """Send email via AWS SES"""
    try:
        response = ses_client.send_email(
            Source=settings.from_email,
            Destination={
                'ToAddresses': to_emails,
            },
            Message={
                'Subject': {
                    'Data': subject,
                    'Charset': 'UTF-8'
                },
                'Body': {
                    'Html': {
                        'Data': html_body,
                        'Charset': 'UTF-8'
                    },
                    'Text': {
                        'Data': text_body or html_body,
                        'Charset': 'UTF-8'
                    }
                }
            }
        )
        return response['MessageId']
    except ClientError as e:
        print(f"Email sending failed: {e.response['Error']['Message']}")
        return None

async def send_gig_claimed_notification(business_email: str, gig_title: str, clipper_email: str):
    """Notify business when their gig is claimed"""
    subject = f"Your gig '{gig_title}' has been claimed!"
    html_body = f"""
    <h2>Great news! 🎉</h2>
    <p>Your gig "<strong>{gig_title}</strong>" has been claimed by a clipper.</p>
    <p>Clipper: {clipper_email}</p>
    <p>You'll receive another notification when the video is submitted for review.</p>
    <p>Thanks for using MX70!</p>
    """
    
    await send_email([business_email], subject, html_body)

async def send_video_submitted_notification(business_email: str, gig_title: str, video_url: str):
    """Notify business when video is submitted"""
    subject = f"Video submitted for '{gig_title}'"
    html_body = f"""
    <h2>Video Submitted! 📹</h2>
    <p>A clipper has submitted their edited video for your gig "<strong>{gig_title}</strong>".</p>
    <p>Please review the video and approve it for payout in your dashboard.</p>
    <p><a href="{video_url}" target="_blank">View Video</a></p>
    <p>Login to your MX70 dashboard to approve or request changes.</p>
    """
    
    await send_email([business_email], subject, html_body)

async def send_payout_notification(clipper_email: str, amount: float, gig_title: str):
    """Notify clipper when payout is processed"""
    subject = f"Payment processed: ${amount:.2f} for '{gig_title}'"
    html_body = f"""
    <h2>Payment Processed! 💰</h2>
    <p>Congratulations! Your payout of <strong>${amount:.2f}</strong> has been processed for the gig "{gig_title}".</p>
    <p>The payment should appear in your account within 1-2 business days.</p>
    <p>Keep up the great work!</p>
    """
    
    await send_email([clipper_email], subject, html_body) 