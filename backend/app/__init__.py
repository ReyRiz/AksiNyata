import os
from dotenv import load_dotenv
from flask import Flask, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from flask_sqlalchemy import SQLAlchemy
from datetime import timedelta

# Load environment variables
load_dotenv()

# Initialize SQLAlchemy
db = SQLAlchemy()

def create_app():
    app = Flask(__name__, static_folder='static')
    
    # Configure the app
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-dev-key')
    app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URI', 'sqlite:///aksi_nyata.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    # Use a consistent JWT secret key for debugging
    app.config['JWT_SECRET_KEY'] = '6a49dc5bf2e5cb7d8c01beb51fb20c29471745398e5abc67'
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    app.config['JWT_REFRESH_TOKEN_EXPIRES'] = timedelta(days=30)
    app.config['UPLOAD_FOLDER'] = os.path.join(app.static_folder, 'uploads')
    
    # Initialize extensions
    CORS(app, 
         resources={
             r"/api/*": {
                 "origins": ["http://localhost:3000", "http://localhost:3001"],
                 "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
                 "allow_headers": ["Content-Type", "Authorization", "X-Requested-With"],
                 "supports_credentials": True,
                 "expose_headers": ["Content-Type", "Authorization"]
             }
         })
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Setup JWT error handlers
    from app.utils.jwt_utils import setup_jwt_error_handlers
    setup_jwt_error_handlers(app, jwt)
    
    # Ensure the upload directory exists
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.campaigns import campaigns_bp
    from app.routes.donations import donations_bp
    from app.routes.users import users_bp
    from app.routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(campaigns_bp, url_prefix='/api/campaigns')
    app.register_blueprint(donations_bp, url_prefix='/api/donations')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Create database tables
    with app.app_context():
        db.create_all()
    
    # Route untuk serve static files (gambar upload)
    @app.route('/static/uploads/<path:filename>')
    def uploaded_file(filename):
        upload_path = app.config['UPLOAD_FOLDER']
        return send_from_directory(upload_path, filename)
    
    return app
