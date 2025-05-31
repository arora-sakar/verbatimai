#!/usr/bin/env python3
"""
Standalone script to test if your Anthropic API key is working
Uses only Python standard library - no external dependencies!
Run this from anywhere: python test_api_key_simple.py
"""

import json
import os
import urllib.request
import urllib.parse
import urllib.error
import ssl

def load_env_file(env_path=".env"):
    """Simple .env file loader using only standard library"""
    env_vars = {}
    
    if not os.path.exists(env_path):
        return env_vars
    
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    # Remove quotes if present
                    value = value.strip().strip('"').strip("'")
                    env_vars[key.strip()] = value
                    # Also set in os.environ for consistency
                    os.environ[key.strip()] = value
    except Exception as e:
        print(f"Warning: Could not read .env file: {e}")
    
    return env_vars

def test_claude_api():
    """Test if Claude API key is working using only standard library"""
    
    # Load .env file
    env_vars = load_env_file()
    
    # Get API key from environment or .env file
    api_key = env_vars.get("AI_API_KEY") or os.getenv("AI_API_KEY", "")
    model_name = env_vars.get("AI_MODEL_NAME") or os.getenv("AI_MODEL_NAME", "claude-3-5-sonnet-20241022")
    
    print(f"🧪 Testing Claude API...")
    print(f"📁 Working directory: {os.getcwd()}")
    print(f"📁 Looking for .env file: {os.path.exists('.env')}")
    print(f"🔑 API Key configured: {'Yes' if api_key else 'No'}")
    
    if api_key:
        # Show first/last few chars for debugging without exposing full key
        masked_key = f"{api_key[:15]}...{api_key[-10:]}" if len(api_key) > 25 else "***"
        print(f"🔑 API Key preview: {masked_key}")
        print(f"🔑 API Key length: {len(api_key)}")
    
    print(f"🤖 Model: {model_name}")
    print("-" * 50)
    
    if not api_key or api_key == "your_api_key_here":
        print("❌ No valid API key configured!")
        print("💡 Make sure to:")
        print("   1. Create a .env file in this directory")
        print("   2. Add: AI_API_KEY=sk-ant-api03-your-actual-key-here")
        print("   3. Get your API key from: https://console.anthropic.com/")
        return False
    
    try:
        print("🌐 Making API request...")
        
        # Prepare the request data
        data = {
            "model": model_name,
            "max_tokens": 50,
            "messages": [
                {
                    "role": "user",
                    "content": "Say 'API key is working!' and nothing else."
                }
            ]
        }
        
        # Convert to JSON
        json_data = json.dumps(data).encode('utf-8')
        
        # Create the request
        url = "https://api.anthropic.com/v1/messages"
        req = urllib.request.Request(url, data=json_data)
        
        # Add headers
        req.add_header('x-api-key', api_key)
        req.add_header('anthropic-version', '2023-06-01')
        req.add_header('content-type', 'application/json')
        
        # Make the request
        try:
            with urllib.request.urlopen(req, timeout=15) as response:
                response_data = response.read().decode('utf-8')
                status_code = response.getcode()
                
                print(f"📡 Status Code: {status_code}")
                
                if status_code == 200:
                    result = json.loads(response_data)
                    content = result.get("content", [{}])[0].get("text", "")
                    print(f"✅ SUCCESS! API Response: {content}")
                    
                    usage = result.get('usage', {})
                    if usage:
                        print(f"💰 Usage - Input tokens: {usage.get('input_tokens', 'N/A')}")
                        print(f"💰 Usage - Output tokens: {usage.get('output_tokens', 'N/A')}")
                    
                    return True
                else:
                    print(f"❌ UNEXPECTED SUCCESS CODE: {status_code}")
                    print(f"🔍 Response: {response_data}")
                    return False
                    
        except urllib.error.HTTPError as e:
            status_code = e.code
            error_response = e.read().decode('utf-8')
            
            print(f"📡 Status Code: {status_code}")
            
            if status_code == 401:
                print(f"❌ AUTHENTICATION FAILED (401)")
                print(f"🔍 Response: {error_response}")
                print("💡 This means your API key is invalid or expired")
                print("   - Check your API key in the Anthropic Console")
                print("   - Make sure it starts with 'sk-ant-api03-'")
                print("   - Verify there are no extra spaces or characters")
            elif status_code == 400:
                print(f"❌ BAD REQUEST (400)")
                print(f"🔍 Response: {error_response}")
                print("💡 This usually means:")
                print("   - Invalid model name")
                print("   - Malformed request")
            elif status_code == 429:
                print(f"❌ RATE LIMITED (429)")
                print(f"🔍 Response: {error_response}")
                print("💡 You're making too many requests, try again later")
            else:
                print(f"❌ HTTP ERROR ({status_code})")
                print(f"🔍 Response: {error_response}")
            
            return False
            
    except urllib.error.URLError as e:
        print(f"❌ CONNECTION ERROR: {e}")
        print("💡 Check your internet connection")
        return False
    except socket.timeout:
        print(f"❌ TIMEOUT: Request took longer than 15 seconds")
        print("💡 Check your internet connection")
        return False
    except json.JSONDecodeError as e:
        print(f"❌ JSON DECODE ERROR: {e}")
        print("💡 Received invalid JSON response")
        return False
    except Exception as e:
        print(f"❌ UNEXPECTED EXCEPTION: {str(e)}")
        print(f"🔍 Exception type: {type(e).__name__}")
        return False

def main():
    """Main function"""
    print("🚀 Starting Anthropic API Key Test (Standard Library Version)")
    print("=" * 60)
    
    # Check if .env file exists
    env_file = ".env"
    if os.path.exists(env_file):
        print(f"✅ Found .env file: {os.path.abspath(env_file)}")
    else:
        print(f"⚠️  No .env file found in: {os.getcwd()}")
        print("💡 Create a .env file with your API key")
    
    print()
    
    # Run the test
    success = test_claude_api()
    
    print()
    print("=" * 60)
    if success:
        print("🎉 API key test PASSED! Your Claude integration should work.")
    else:
        print("🚨 API key test FAILED! Fix the issues above before proceeding.")
        print()
        print("🔧 Quick fixes to try:")
        print("   1. Double-check your API key in .env file")
        print("   2. Get a new API key from https://console.anthropic.com/")
        print("   3. Make sure .env file is in the same directory as this script")
        print("   4. Verify your internet connection")
    
    return success

if __name__ == "__main__":
    import socket  # Import here to avoid issues if not available
    main()
