import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import datetime
import os
from typing import Optional
from dotenv.main import load_dotenv

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


#Make the html site and then use the user input to determine what the date, reminder contents, etc will be.
def main():
    if datetime.datetime.today().weekday() == 3:
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