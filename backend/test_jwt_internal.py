#!/usr/bin/env python3
"""
Internal JWT test using Flask app context
"""
from app import create_app
from flask_jwt_extended import create_access_token, decode_token
import jwt

def test_jwt_internal():
    print("Testing JWT internally...")
    
    app = create_app()
    
    with app.app_context():
        print(f"JWT_SECRET_KEY: {app.config['JWT_SECRET_KEY']}")
        
        # Create a token
        token = create_access_token(identity=3)
        print(f"Created token: {token[:50]}...")
        
        try:
            # Try to decode it manually using PyJWT
            decoded = jwt.decode(token, app.config['JWT_SECRET_KEY'], algorithms=['HS256'])
            print(f"Manual decode successful: {decoded}")
        except Exception as e:
            print(f"Manual decode failed: {e}")
        
        try:
            # Try to decode it using Flask-JWT-Extended
            decoded = decode_token(token)
            print(f"Flask-JWT decode successful: {decoded}")
        except Exception as e:
            print(f"Flask-JWT decode failed: {e}")

if __name__ == '__main__':
    test_jwt_internal()
