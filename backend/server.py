from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv
from models import db
from routes.config import config
from routes.employee import employee
from routes.wfh_requests import dates
from routes.staff_apply import apply
from routes.manager_approve import approve
from routes.staff_requests import requests
from routes.staff_withdraw import withdraw
from routes.manager_view import manager_view
from routes.staff_cancel import staff_cancel
from routes.cron import cron

load_dotenv()

def create_app():
    app = Flask(__name__)

    if os.getenv("TESTING") == "True":
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://' # Use SQLite for testing
    else:
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL") # Use PostgreSQL for production
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    CORS(app, supports_credentials=True)

    app.register_blueprint(config)
    app.register_blueprint(employee)
    app.register_blueprint(dates)
    app.register_blueprint(apply)
    app.register_blueprint(approve)
    app.register_blueprint(requests)
    app.register_blueprint(withdraw)
    app.register_blueprint(manager_view)
    app.register_blueprint(staff_cancel)
    app.register_blueprint(cron)

    db.init_app(app)

    return app

app = create_app()

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
