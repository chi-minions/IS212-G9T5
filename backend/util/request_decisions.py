from datetime import date
from models import *

def create_request_decision(data):
    try: 
        # Get the maximum decision_id and increment by 1
        max_id = db.session.query(func.max(RequestDecisions.decision_id)).scalar()
        next_id = 1 if max_id is None else max_id + 1
        
        decision = RequestDecisions(
                decision_id=next_id,  # Set the generated ID
                request_id=data["request_id"],
                manager_id=data["manager_id"],
                decision_status=data["decision_status"],
                decision_date = date.today(),
                decision_notes=data["decision_notes"]
            )

        db.session.add(decision)
        db.session.commit()

        return {
            "message": "Manager's request decision successfully created.",
            "decision": decision.json()
        }
        
    except Exception as e:
        db.session.rollback()
        return {"error": str(e)}