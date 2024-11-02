from flask import Blueprint, jsonify
from models import WFHRequests, WFHRequestLogs, db
from datetime import datetime, timezone, timedelta
 

staff_cancel = Blueprint('staff_cancel', __name__)

@staff_cancel.route('/api/staff/<int:staff_id>/cancel_request/<string:request_id>/<string:specific_date>', methods=['PUT'])
def cancel_pending_request(staff_id, request_id, specific_date):
    try:
        # Parse the specific_date from the string to a date object
        specific_date = datetime.strptime(specific_date, '%Y-%m-%d').date()
    except ValueError:
        return jsonify({"error": "Invalid date format, please use YYYY-MM-DD"}), 400

    # Fetch the WFH request based on the composite key (request_id and specific_date) and staff_id
    wfh_request = WFHRequests.query.filter_by(request_id=request_id, specific_date=specific_date, staff_id=staff_id).first()

    if not wfh_request:
        return jsonify({"error": "Request not found"}), 404

    # Check if the request is in a pending status
    if wfh_request.request_status != 'Pending':
        return jsonify({"error": "Only pending requests can be cancelled"}), 400

    # Get the current date
    current_date = datetime.now(timezone.utc).date()

    # Define the new allowable timeframe (2 weeks forward and 2 weeks back from the specific date)
    two_weeks_ago = specific_date - timedelta(days=14)
    two_weeks_later = specific_date + timedelta(days=14)

    if not (two_weeks_ago <= current_date <= two_weeks_later):
        return jsonify({"error": f"Cancellation allowed only for requests within 2 weeks from the specific date of {specific_date}"}), 400

    # Update the request status to 'Cancelled' and set the reason
    wfh_request.request_status = 'Cancelled'
    cancellation_reason = "Staff cancelled pending request" 

    
    # Log the cancellation in WFHRequestLogs
    log_entry = WFHRequestLogs(
        request_id=wfh_request.request_id,
        specific_date=wfh_request.specific_date,
        request_status_log='Cancelled',
        apply_date_log=wfh_request.apply_date,
        reason_log=cancellation_reason,
        log_datetime=datetime.now(timezone.utc)
    )

    # Add the log entry to the database
    db.session.add(log_entry)

    # Commit the changes to WFHRequests and WFHRequestLogs
    db.session.commit()

    

    return jsonify({"message": "Request cancelled successfully"}), 200
