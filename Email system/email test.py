import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
import os
from typing import Optional
from dotenv.main import load_dotenv
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

load_dotenv()
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
        
        print(f"Email successfully sent to {receiver_email}")
        return True
        
    except smtplib.SMTPAuthenticationError:
        print("Authentication failed. Please check your email and app password.")
        return False
    except smtplib.SMTPException as e:
        print(f"An error occurred while sending the email: {str(e)}")
        return False
    except Exception as e:
        print(f"An unexpected error occurred: {str(e)}")
        return False
    finally:
        try:
            server.quit()
        except:
            pass

@app.route('/set_reminder', methods=['POST'])
def set_reminder():
    try:        
        data = request.json
        
        # Extract data from request
        reminder_name = data.get('reminderName')
        receiver_email = data.get('email')
        reminder_date = data.get('reminderDate')
        reminder_time = data.get('reminderTime')
        
        # Validate required fields
        if not all([reminder_name, receiver_email, reminder_date, reminder_time]):
            return jsonify({
                'status': 'error',
                'message': 'Missing required fields'
            }), 400
            
        # Format the reminder message
        subject = f"Reminder: {reminder_name}"
        message = f"""
        Hello!

        This is a reminder for: {reminder_name}
        Scheduled for: {reminder_date} at {reminder_time}

        Best regards,
        Your Reminder System
        """
        
        # Get sender email from environment variables
        sender_email = os.environ.get("SENDER_EMAIL")
        if not sender_email:
            return jsonify({
                'status': 'error',
                'message': 'Sender email not configured'
            }), 500
            
        # Send the email
        success = send_email(
            sender_email=sender_email,
            receiver_email=receiver_email,
            subject=subject,
            message=message
        )
        
        if success:
            return jsonify({
                'status': 'success',
                'message': 'Reminder set and email sent successfully'
            }), 200
        else:
            return jsonify({
                'status': 'error',
                'message': 'Failed to send email'
            }), 500
            
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500


#Make the html site and then use the user input to determine what the date, reminder contents, etc will be.
def main():
    if datetime.datetime.today().weekday() == 5:
        try:
            sender_email = input("SENDER EMAIL: ").strip()
            receiver_email = input("RECEIVER EMAIL: ").strip()
            subject = input("SUBJECT: ").strip()
            message = input("MESSAGE: ").strip()
            send_email(sender_email, receiver_email, subject, message)
            
        except KeyboardInterrupt:
            print("\nProgram terminated by user.")
        except Exception as e:
            print(f"An error occurred: {str(e)}")
    else:
        print("This script only runs on Thursdays.")

if __name__ == "__main__":
    main()