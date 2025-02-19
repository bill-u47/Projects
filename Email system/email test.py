from flask import Flask, request, jsonify
from flask_cors import CORS
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import smtplib
import os
import re
from typing import Optional, Collection, List, Tuple, Union
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import aiosmtplib
import asyncio
from email.message import EmailMessage

app = Flask(__name__)
CORS(app)
load_dotenv()

scheduler = BackgroundScheduler()
scheduler.start()

carrier_list = {
    "verizon": "vtext.com",
    "tmobile": "tmomail.net",
    "sprint": "messaging.sprintpcs.com",
    "at&t": "txt.att.net",
    "boost": "smsmyboostmobile.com",
    "cricket": "sms.cricketwireless.net",
    "uscellular": "email.uscc.net", 
}

async def send_txt(
    num: Union[str, int], carrier: str, email: str, pword: str, msg: str, subj: str
) -> Tuple[dict, str]:
    to_email = carrier_list[carrier]

    message = EmailMessage()
    message["From"] = email
    message["To"] = f"{num}@{to_email}"
    message["Subject"] = subj
    message.set_content(msg)

    HOST = 'smtp.gmail.com'
    send_kws = dict(username=email, password=pword, hostname=HOST, port=587, start_tls=True)
    res = await aiosmtplib.send(message, **send_kws)
    msg = "failed" if not re.search(r"\sOK\s", res[1]) else "succeeded"
    print(f"SMS notification {msg}")
    return res

def send_email(
    sender_email: str,
    receiver_email: str,
    subject: str,
    message: str,
    password: Optional[str] = None
):
    try:
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        if password is None:
            password = os.environ.get("GMAIL_APP_PASSWORD")
            if not password:
                raise ValueError("No password provided and GMAIL_APP_PASSWORD not found in environment variables")
        
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        msg.attach(MIMEText(message, 'plain'))
        
        server.login(sender_email, password)
        server.send_message(msg)
        print("Email notification sent successfully")
        return True
        
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False
    finally:
        try:
            server.quit()
        except:
            pass

async def send_reminder_notifications(
    sender_email: str,
    receiver_email: str,
    phone_data: dict,
    subject: str,
    message: str
):
    # Send email
    email_sent = send_email(sender_email, receiver_email, subject, message)
    
    # Send SMS if phone data is provided
    if phone_data and phone_data.get('number') and phone_data.get('carrier'):
        password = os.environ.get("GMAIL_APP_PASSWORD")
        sms_message = f"{subject}\n\n{message}"  # Simplified message for SMS
        await send_txt(
            phone_data['number'],
            phone_data['carrier'].lower(),
            sender_email,
            password,
            sms_message,
            subject
        )

def get_interval_seconds(interval, unit):
    unit_conversions = {
        'minute(s)': 60,
        'hour(s)': 3600,
        'day(s)': 86400,
        'week(s)': 604800,
        'month(s)': 2592000
    }
    return int(interval) * unit_conversions.get(unit, 60)

@app.route('/set_reminder', methods=['POST'])
def set_reminder():
    try:
        data = request.json
        reminder_name = data.get('reminderName')
        receiver_email = data.get('email')
        reminder_date = data.get('reminderDate')
        reminder_time = data.get('reminderTime')
        repeat_data = data.get('repeat')
        phone_data = data.get('phone_data')  # Expected format: {"number": "1234567890", "carrier": "verizon"}
        
        if not all([reminder_name, receiver_email, reminder_date, reminder_time]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400

        sender_email = os.environ.get("SENDER_EMAIL")
        if not sender_email:
            return jsonify({
                'status': 'error',
                'message': 'Sender email not configured'
            }), 500

        datetime_str = f"{reminder_date} {reminder_time}"
        reminder_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
        
        message = f"""
        Reminder Alert!

        Task: {reminder_name}
        Scheduled for: {reminder_date} at {reminder_time}
        {"This repeats every " + str(repeat_data['interval']) + " " + repeat_data['unit'] if repeat_data else "This is a one-time reminder"}

        Sent by Reminder System
        """

        if repeat_data and repeat_data.get('interval') and repeat_data.get('unit'):
            interval_seconds = get_interval_seconds(
                repeat_data['interval'],
                repeat_data['unit']
            )
            
            scheduler.add_job(
                lambda: asyncio.run(send_reminder_notifications(
                    sender_email, receiver_email, phone_data,
                    f"Reminder: {reminder_name}", message
                )),
                'interval',
                seconds=interval_seconds,
                start_date=reminder_datetime
            )
            response_message = 'Recurring reminder set successfully'
        else:
            scheduler.add_job(
                lambda: asyncio.run(send_reminder_notifications(
                    sender_email, receiver_email, phone_data,
                    f"Reminder: {reminder_name}", message
                )),
                'date',
                run_date=reminder_datetime
            )
            response_message = 'One-time reminder set successfully'

        return jsonify({
            'status': 'success',
            'message': response_message
        }), 200

    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == "__main__":
    app.run(debug=True)