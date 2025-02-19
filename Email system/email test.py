from flask import Flask, request, jsonify
from flask_cors import CORS
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import smtplib
import os
import re
from typing import Optional
from dotenv import load_dotenv
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
import aiosmtplib
import asyncio
from email.message import EmailMessage
from typing import Collection, List, Tuple, Union


month = ""
app = Flask(__name__)
CORS(app)
__file__ = r"C:\Users\User\Documents\GitHub\Projects\Email system\.env"
load_dotenv(os.path.join(os.path.dirname(__file__), '.env'))

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
    num: Union[str, int], 
    msg: str, 
    subj: str,
    carrier: str = "verizon",
    email: Optional[str] = None,
    pword: Optional[str] = None
) -> Tuple[dict, str]:
    email = email or os.environ.get("SENDER_EMAIL")
    pword = pword or os.environ.get("phoneCode")
    to_email = carrier_list.get(carrier.lower(), "vtext.com")

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


async def send_txts(
    nums: Collection[Union[str, int]], carrier: str, email: str, pword: str, msg: str, subj: str
) -> List[Tuple[dict, str]]:
    tasks = [send_txt(n, msg, subj, carrier, email, pword) for n in set(nums)]
    return await asyncio.gather(*tasks)


if __name__ == "__main__":
    _num = "7206269971"
    carrier: str = "verizon"
    _carrier = carrier_list.get(carrier.lower(), "vtext.com")
    attached = f"{_num}@{_carrier}"
    _msg = "rah rah ah ah ah"
    _subj = "Dummy subj"
    
    asyncio.run(send_txt(_num, _msg, _subj, attached ))


def send_email(
    receiver_email: str,
    subject: str,
    message: str,
    phone_number: Optional[str] = None
):
    try:
        sender_email = os.environ.get("SENDER_EMAIL")
        password = os.environ.get("phoneCode")
        
        if not all([sender_email, password]):
            raise ValueError("Missing email credentials")

        # Send email
        server = smtplib.SMTP("smtp.gmail.com", 587)
        server.starttls()
        
        msg = MIMEMultipart()
        msg['From'] = sender_email
        msg['To'] = receiver_email
        msg['Subject'] = subject
        msg.attach(MIMEText(message, 'plain'))
        
        server.login(sender_email, password)
        server.send_message(msg)
        print("Email sent successfully")

        # Send SMS if phone number provided
        if phone_number:
            asyncio.run(send_txt(
                num=phone_number,
                msg=message,
                subj=subject
            ))
        
        return True
        
    except Exception as e:
        print(f"Email error: {str(e)}")
        return False
    finally:
        try:
            server.quit()
        except:
            pass

def get_interval_seconds(interval, unit):
    unit_conversions = {
        'minute(s)' : 60,
        'hour(s)': 3600,
        'day(s)': 86400,
        'week(s)': 604800,
        'month(s)': 2592000  #if month is 30 days
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
        phoneNum_data = data.get('phoneNumb_data')
        sender_email = os.environ.get("SENDER_EMAIL")

        
        if not all([reminder_name, receiver_email, reminder_date, reminder_time]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400
        if not sender_email:
            return jsonify({
                'status': 'error',
                'message': 'Sender email not configured'
            }), 500

        # Schedule the reminder
        datetime_str = f"{reminder_date} {reminder_time}"
        reminder_datetime = datetime.strptime(datetime_str, '%Y-%m-%d %H:%M')
        
        message = f"""
        What's poppin

        you MUST do this: {reminder_name}
        You set this for {reminder_date} at {reminder_time}
        This repeats every {repeat_data['interval']} {repeat_data['unit']}

        This was a message from Andrew's Bot
        """

        if repeat_data and repeat_data.get('interval') and repeat_data.get('unit'):
            # Set up recurring reminder
            interval_seconds = get_interval_seconds(
                repeat_data['interval'],
                repeat_data['unit']
            )
            
            scheduler.add_job(
                send_email,
                'interval',
                seconds=interval_seconds,
                start_date=reminder_datetime,
                args=[receiver_email, f"Reminder: {reminder_name}", message, phoneNum_data]
            )
            response_message = 'Success'
        else:
            # Set up one-time reminder
            scheduler.add_job(
                send_email,
                'date',
                run_date=reminder_datetime,
                args=[sender_email, receiver_email, phoneNum_data, f"Reminder: {reminder_name}", message]
            )
            
            response_message = 'Successfully made'

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