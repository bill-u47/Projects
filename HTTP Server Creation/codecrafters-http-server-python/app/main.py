import socket
import threading
import re
from urllib.parse import urlparse

def handle_connection(conn):
    msg = conn.recv(1024).decode("ascii")
    if not msg.strip():
        conn.close()
        return
        
    # Match request line (GET, POST, etc.)
    m = re.match(r"^(?:GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+(\S+)", msg)
    if not m:
        conn.send(b"HTTP/1.1 400 Bad Request\r\n\r\n")
        conn.close()
        return
        
    url = m.group(1)
        
        # Extract User-Agent header
    user_agent = None
    for line in msg.split("\r\n"):
        if line.lower().startswith("user-agent:"):
            user_agent = line[len("User-Agent:"):].strip()

        # Handle /user-agent request
    if url == "/user-agent" and user_agent is not None:
        body = user_agent
        count = len(body)
        UAresponse = (
            "HTTP/1.1 200 OK\r\n"
            "Content-Type: text/plain\r\n"
            f"Content-Length: {count}\r\n"
            "\r\n"
            f"{body}"
        )
        conn.send(UAresponse.encode("ascii"))

        # Handle /echo/{text} request
    elif url.startswith("/echo/"):
        path = urlparse(url).path
        echo_part = path.replace('/echo/', '')
        body = echo_part
        count = len(body)
        response = ("HTTP/1.1 200 OK\r\n" "Content-Type: text/plain\r\n" f"Content-Length: {count}\r\n" "\r\n"f"{body}")
        conn.send(response.encode("ascii"))
    elif url == "/":
        conn.send(b"HTTP/1.1 200 OK\r\n\r\n")
    else:
        conn.send(b"HTTP/1.1 404 Not Found\r\n\r\n")
    
   
    conn.close()

def main():
    server_socket = socket.create_server(("localhost", 4221), reuse_port=True)
    print("Server is listening on http://localhost:4221")

    while True:
        conn, _ = server_socket.accept()
        # Handle each connection in a new thread to allow multiple concurrent connections
        threading.Thread(target=handle_connection, args=(conn,)).start()

if __name__ == "__main__":
    main()
