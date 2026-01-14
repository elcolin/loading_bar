#!/usr/bin/env python3
"""
Custom HTTP server that handles BrokenPipeError gracefully.

This server extends Python's SimpleHTTPRequestHandler to suppress
BrokenPipeError exceptions that occur when clients disconnect early.
This is a common occurrence with browsers and is not a critical error.

Usage:
    python3 server.py [port]

Default port is 8000 if not specified.
"""

import http.server
import socketserver
import sys
import os
import errno


class QuietHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """
    Custom HTTP request handler that suppresses BrokenPipeError exceptions.
    
    BrokenPipeError occurs when the client closes the connection before
    the server finishes sending data. This is normal behavior for browsers
    and shouldn't clutter the server logs with stack traces.
    """
    
    def log_error(self, format, *args):
        """
        Override log_error to suppress BrokenPipeError messages.
        
        We still log other errors normally, but BrokenPipeError and
        ConnectionResetError are common when browsers disconnect early
        and don't need to be logged as errors.
        """
        # Check if this is a BrokenPipeError or ConnectionResetError
        if args:
            error_msg = str(args[0])
            if "Broken pipe" in error_msg or "Connection reset" in error_msg:
                # Silently ignore these common client disconnect errors
                return
        
        # Log other errors normally
        super().log_error(format, *args)
    
    def finish(self):
        """
        Override finish to catch BrokenPipeError when closing the connection.
        """
        try:
            super().finish()
        except (BrokenPipeError, ConnectionResetError):
            # Client disconnected before we finished sending
            # This is normal, just ignore it
            pass
    
    def handle_one_request(self):
        """
        Override handle_one_request to catch BrokenPipeError during request processing.
        """
        try:
            super().handle_one_request()
        except (BrokenPipeError, ConnectionResetError):
            # Client disconnected during request
            # This is normal, just ignore it
            pass


class ReusableTCPServer(socketserver.TCPServer):
    """
    TCP server that allows immediate address reuse.
    
    This prevents "Address already in use" errors when restarting the server.
    """
    allow_reuse_address = True


def run_server(port=8000):
    """
    Start the HTTP server on the specified port.
    
    Args:
        port: The port number to listen on (default: 8000)
    """
    try:
        with ReusableTCPServer(("", port), QuietHTTPRequestHandler) as httpd:
            print(f"Server running at http://localhost:{port}/")
            print(f"Serving files from: {os.getcwd()}")
            print("Press Ctrl+C to stop the server")
            print("-" * 60)
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n" + "-" * 60)
        print("Server stopped.")
    except PermissionError:
        print(f"Error: Permission denied to bind to port {port}")
        print(f"Try using a port number above 1024, or run with sudo")
        sys.exit(1)
    except OSError as e:
        if e.errno == errno.EADDRINUSE:  # Address already in use
            print(f"Error: Port {port} is already in use")
            print(f"Try a different port or stop the process using port {port}")
        elif e.errno == errno.EACCES:  # Permission denied (on some systems)
            print(f"Error: Permission denied to bind to port {port}")
            print(f"Try using a port number above 1024, or run with sudo")
        else:
            print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    # Get port from command line argument or use default
    port = 8000
    if len(sys.argv) > 1:
        try:
            port = int(sys.argv[1])
            if port < 1 or port > 65535:
                raise ValueError("Port must be between 1 and 65535")
        except ValueError as e:
            print(f"Error: Invalid port number - {e}")
            print(f"Usage: {sys.argv[0]} [port]")
            sys.exit(1)
    
    run_server(port)
