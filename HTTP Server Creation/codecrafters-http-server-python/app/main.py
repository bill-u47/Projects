import socket  # noqa: F401
import re

def main():
    # You can use print statements as follows for debugging, they'll be visible when running tests.
    print("Logs from your program will appear here!")
    server_socket = socket.create_server(("localhost", 4221), reuse_port=True)
    
    conn, _ = server_socket.accept()  # wait for client
    msg = conn.recv(1024).decode("ascii")
    # extract request url with regex
    m = re.match(r"^(?:GET|POST|PUT|DELETE|HEAD|OPTIONS|PATCH)\s+(\S+)", msg)
    url = m.group(1)
    if url == "/echo/{str}":
        conn.send(b"HTTP/1.1 200 OK\r\nContent-Type: text/plain\r\nContent-Length: 3\r\n\r\nabc")
    elif url == "/":
        conn.send(b"HTTP/1.1 200 OK\r\n\r\n")
    else:
        conn.send(b"HTTP/1.1 404 Not Found\r\n\r\n")
   

    server_socket.accept() # wait for client


if __name__ == "__main__":
    main()


test test