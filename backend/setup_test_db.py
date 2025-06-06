#!/usr/bin/env python3
"""
Python-based PostgreSQL test database setup
Alternative to the bash script for cross-platform compatibility
"""
import subprocess
import sys
import os
import time

def check_postgresql():
    """Check if PostgreSQL is installed and running"""
    try:
        # Check if psql command exists
        subprocess.run(['psql', '--version'], capture_output=True, check=True)
        print("✅ PostgreSQL found")
        return True
    except (subprocess.CalledProcessError, FileNotFoundError):
        print("❌ PostgreSQL is not installed!")
        print("Please install PostgreSQL first:")
        print("  macOS: brew install postgresql")
        print("  Ubuntu: sudo apt-get install postgresql postgresql-contrib")
        print("  Windows: Download from https://www.postgresql.org/download/")
        return False

def check_postgresql_running():
    """Check if PostgreSQL service is running"""
    try:
        subprocess.run(['pg_isready'], capture_output=True, check=True)
        print("✅ PostgreSQL is running")
        return True
    except subprocess.CalledProcessError:
        print("📢 PostgreSQL is not running. Please start it manually:")
        print("  macOS: brew services start postgresql")
        print("  Linux: sudo systemctl start postgresql")
        print("  Windows: Start PostgreSQL service from Services panel")
        return False

def create_test_database():
    """Create the test database"""
    db_user = os.getenv('POSTGRES_USER', os.getenv('USER', 'postgres'))
    db_name = 'test_verbatimai'
    
    print(f"📦 Creating test database '{db_name}'...")
    
    try:
        # Drop existing database if it exists
        subprocess.run([
            'psql', '-U', db_user, '-d', 'postgres', 
            '-c', f'DROP DATABASE IF EXISTS {db_name};'
        ], capture_output=True)
        
        # Create new database
        result = subprocess.run([
            'psql', '-U', db_user, '-d', 'postgres', 
            '-c', f'CREATE DATABASE {db_name};'
        ], capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Test database '{db_name}' created")
            return db_user, db_name
        else:
            print(f"❌ Failed to create database: {result.stderr}")
            return None, None
            
    except Exception as e:
        print(f"❌ Error creating database: {e}")
        return None, None

def run_sample_test():
    """Run a sample integration test to verify setup"""
    print("🧪 Running sample integration test...")
    
    try:
        result = subprocess.run([
            sys.executable, '-m', 'pytest',
            'tests/integration/test_auth_api.py::TestUserRegistration::test_register_new_user',
            '-v'
        ], capture_output=True, text=True, timeout=30)
        
        if result.returncode == 0:
            print("✅ Sample test passed! Integration tests are working.")
            return True
        else:
            print("❌ Sample test failed:")
            print(result.stdout)
            print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print("❌ Test timed out")
        return False
    except Exception as e:
        print(f"❌ Error running test: {e}")
        return False

def main():
    print("🔧 Setting up PostgreSQL for Integration Tests")
    print("=" * 50)
    
    # Check PostgreSQL installation
    if not check_postgresql():
        return False
    
    # Check if PostgreSQL is running
    if not check_postgresql_running():
        return False
    
    # Create test database
    db_user, db_name = create_test_database()
    if not db_user or not db_name:
        return False
    
    # Set environment variable
    test_db_url = f"postgresql://{db_user}@localhost:5432/{db_name}"
    os.environ['TEST_DATABASE_URL'] = test_db_url
    
    print(f"🔧 Environment configured:")
    print(f"   TEST_DATABASE_URL={test_db_url}")
    
    # Run sample test
    if run_sample_test():
        print("\n🎉 Setup complete! Integration tests are ready.")
        print("\n📋 To run integration tests:")
        print(f"   export TEST_DATABASE_URL=\"{test_db_url}\"")
        print("   python -m pytest tests/integration/ -v")
        return True
    else:
        print("\n❌ Setup completed but tests are not working correctly.")
        print("Please check the error messages above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
