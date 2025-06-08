#!/usr/bin/env python3
"""
Railway deployment script for VerbatimAI backend
Handles port configuration and starts the FastAPI application
"""
import os
import subprocess
import sys

def main():
    # Get port from environment variable, default to 8000
    port = os.environ.get('PORT', '8000')
    
    # Validate port is a number
    try:
        port_int = int(port)
        if port_int < 1 or port_int > 65535:
            raise ValueError(f"Port {port_int} is out of valid range")
    except ValueError as e:
        print(f"Error: Invalid port '{port}': {e}")
        sys.exit(1)
    
    # Print startup info
    environment = os.environ.get('ENVIRONMENT', 'development')
    print(f"🚀 Starting VerbatimAI backend")
    print(f"   Environment: {environment}")
    print(f"   Port: {port}")
    print(f"   Host: 0.0.0.0")
    
    # Build uvicorn command
    cmd = [
        'python', '-m', 'uvicorn',
        'app.main:app',
        '--host', '0.0.0.0',
        '--port', port
    ]
    
    # Add reload for development
    if environment == 'development':
        cmd.append('--reload')
        print(f"   Reload: enabled (development mode)")
    
    print(f"   Command: {' '.join(cmd)}")
    print("=" * 50)
    
    # Execute uvicorn
    try:
        subprocess.run(cmd, check=True)
    except subprocess.CalledProcessError as e:
        print(f"Error starting server: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\nShutting down server...")
        sys.exit(0)

if __name__ == '__main__':
    main()
