import socket  # noqa: F401
import re
from urllib.parse import urlparse

connection_count = 0

def main():
    server_socket = socket.create_server(("localhost", 4221), reuse_port=True)    
    print("Logs from your program will appear here!")
    while True:  
        conn, _ = server_socket.accept()  # wait for client
        msg = conn.recv(1024).decode("ascii")
        m = re.match(r"^(?:GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+(\S+)", msg)
        url = m.group(1)
        ##

        user_agent = None #for the header
        for line in msg.split("\r\n"):
            lowered_line = line.lower()
            if lowered_line.startswith("user-agent"):
                user_agent = line[len("User-Agent:"):].strip()
                
        if url == "/user-agent" and user_agent is not None:
            body = user_agent
            count = len(body)
            UAresponse = ("HTTP/1.1 200 OK\r\n" "Content-Type: text/plain\r\n" f"Content-Length: {count}\r\n" "\r\n" f"{user_agent}")
            conn.send(UAresponse.encode("ascii"))
        elif "/echo/" in url and "/user-agent" not in url:
            path = urlparse(url).path  
            echo_part = path.replace('/echo/', '')  
            body = echo_part
            count = len(body)
            response = ("HTTP/1.1 200 OK\r\n" "Content-Type: text/plain\r\n" f"Content-Length: {count}\r\n" "\r\n" f"{body}")
            conn.send(response.encode("ascii"))
        else:
            conn.send(b"HTTP/1.1 404 Not Found\r\n\r\n")
        
        conn.close()

if __name__ == "__main__":
    main()

