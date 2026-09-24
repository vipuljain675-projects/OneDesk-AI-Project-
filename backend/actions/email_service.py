"""
email_service.py
Autonomous Email Dispatcher for OneDesk AI.
Sends real HTML emails in the background using Resend API.
"""
import os
import resend
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")


def send_background_email(
    to_email: str,
    subject: str,
    body_text: str,
    employee_name: str = "Employee",
    employee_email: str = "",
    leave_type: str = "Casual Leave",
    dates: str = ""
) -> dict:
    """
    Directly dispatches a real enterprise email to the recipient's inbox.
    Includes Reply-To header pointing back to the employee's personal email.
    """
    if not RESEND_API_KEY:
        print("⚠️ [email_service] RESEND_API_KEY not configured. Skipping background send.")
        return {
            "sent": False,
            "reason": "API key not configured"
        }

    resend.api_key = RESEND_API_KEY

    # Clean any template placeholders left by LLM
    clean_name = employee_name if employee_name and employee_name.lower() != "employee" else "Vipul Jain"
    clean_body = (
        body_text
        .replace("[Your Name]", clean_name)
        .replace("[Name]", clean_name)
        .replace("[Employee Name]", clean_name)
        .replace("[Your Designation]", "Product Engineering")
        .replace("[Designation]", "Product Engineering")
        .replace("[Employee ID]", "EMP001")
        .replace("[Colleague Name]", "a team colleague")
        .replace("[Colleague's Name]", "a team colleague")
    )

    # Format paragraph lines for HTML
    html_paragraphs = "".join(
        f"<p style='margin: 0 0 12px 0; line-height: 1.6; color: #334155;'>{line}</p>"
        for line in clean_body.split("\n\n") if line.strip()
    )

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>{subject}</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #F8FAFC; padding: 24px 12px; margin: 0;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
        
        <!-- Header -->
        <div style="background-color: #0078D4; padding: 20px 24px; color: #FFFFFF;">
          <div style="display: flex; align-items: center; justify-content: space-between;">
            <h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.3px;">OneDesk AI Enterprise Dispatch</h2>
            <span style="font-size: 11px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px; font-weight: 600;">Automated Memo</span>
          </div>
          <p style="margin: 6px 0 0 0; font-size: 13px; opacity: 0.9;">Employee Time-Off & Leave Application</p>
        </div>

        <!-- Meta Summary Box -->
        <div style="background-color: #F0FDF4; border-bottom: 1px solid #DCFCE7; padding: 14px 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 12.5px;">
            <tr>
              <td style="color: #166534; font-weight: 600; padding: 3px 0;">Applicant:</td>
              <td style="color: #15803D; font-weight: 700; text-align: right;">{clean_name} {f'({employee_email})' if employee_email else ''}</td>
            </tr>
            <tr>
              <td style="color: #166534; font-weight: 600; padding: 3px 0;">Request Type:</td>
              <td style="color: #15803D; font-weight: 700; text-align: right;">{leave_type}</td>
            </tr>
            {f'<tr><td style="color: #166534; font-weight: 600; padding: 3px 0;">Dates:</td><td style="color: #15803D; font-weight: 700; text-align: right;">{dates}</td></tr>' if dates else ''}
            <tr>
              <td style="color: #166534; font-weight: 600; padding: 3px 0;">Status:</td>
              <td style="color: #15803D; font-weight: 700; text-align: right;">Pending Manager Approval</td>
            </tr>
          </table>
        </div>

        <!-- Letter Body -->
        <div style="padding: 24px; font-size: 14px;">
          {html_paragraphs}
        </div>

        <!-- Footer -->
        <div style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 16px 24px; font-size: 11.5px; color: #94A3B8; text-align: center;">
          <p style="margin: 0;">This email was drafted and autonomously dispatched via <strong>OneDesk AI</strong> on behalf of <strong>{clean_name}</strong>.</p>
          {f'<p style="margin: 4px 0 0 0; color: #64748B;">Reply directly to this email to contact {clean_name}.</p>' if employee_email else ''}
          <p style="margin: 4px 0 0 0;">OneDesk AI Workplace Workspace • Microsoft Innovate 2026</p>
        </div>

      </div>
    </body>
    </html>
    """

    try:
        payload = {
            "from": f"{clean_name} via OneDesk AI <onboarding@resend.dev>",
            "to": [to_email],
            "subject": subject,
            "html": html_content,
            "text": clean_body,
        }
        if employee_email and "@" in employee_email:
            payload["reply_to"] = employee_email

        response = resend.Emails.send(payload)
        print(f"✅ [email_service] Real email dispatched via Resend to {to_email} (ID: {response.get('id')})")
        return {
            "sent": True,
            "id": response.get("id"),
            "recipient": to_email,
            "message": f"Real email dispatched to {to_email} via OneDesk Bot!"
        }
    except Exception as e:
        err_msg = str(e)
        print(f"⚠️ [email_service] Resend dispatch note: {err_msg}")
        return {
            "sent": False,
            "error": err_msg,
            "recipient": to_email,
            "message": f"Dispatch recorded for {to_email} ({err_msg})"
        }
