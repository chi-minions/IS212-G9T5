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

from app.utils import celery_init_app
from app import task
from celery.schedules import crontab

load_dotenv()

def create_app():
    app = Flask(__name__)

    if os.getenv("TESTING") == "True":
        # Use SQLite for testing
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite://'
        CELERY_BROKER_URL = "redis://localhost:6379"
        CELERY_RESULT_BACKEND = "redis://localhost:6379"
        
    else:
        # Use PostgreSQL for production
        app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv("DATABASE_URL")
        CELERY_BROKER_URL = os.getenv("CELERY_BROKER_URL")
        CELERY_RESULT_BACKEND = os.getenv("CELERY_RESULT_BACKEND")

    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config.from_mapping(
        CELERY=dict(
            broker_url=CELERY_BROKER_URL,
            result_backend=CELERY_RESULT_BACKEND,
            task_ignore_result=True,
            beat_schedule={
                # FOR TESTING
                # "task-every-min": {
                #     "task": "app.task.hello_world",
                #     "schedule": crontab(minute='*'),
                # },
                "task-auto-rej-every-night-midnight": {
                    "task": "app.task.auto_reject",
                    "schedule": crontab(hour=0, minute=0),
                }
            },
        ),
    )

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

    celery_init_app(app)

    return app

app = create_app()

# Run the app
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
