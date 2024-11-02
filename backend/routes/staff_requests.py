from flask import Blueprint, request, jsonify
from util.staff_apply import *

requests = Blueprint('requests', __name__)

@requests.route("/api/<int:staff_id>/pending")
def get_pending(staff_id):
    employee = get_employee_by_id(staff_id)
    if not employee:
        return jsonify({"error": "Staff not found"}), 404
    
    employee_requests = WFHRequests.query.filter(
        (WFHRequests.staff_id == staff_id) & 
        (WFHRequests.request_status == 'Pending')
    ).all()
    if not employee_requests:
        return jsonify({"data": []}), 200

    data = [request.json() for request in employee_requests]

    return jsonify({"data":data}), 200

@requests.route("/api/request/<string:request_id>", methods=["GET"])
def get_request(request_id):
    # Call the utility function to get the request data by ID
    request_data = get_request_by_id(request_id)
    
    if not request_data:
        return jsonify({"error": "Request not found"}), 404

    # Check if this request is recurring by counting entries with the same request_id
    recurrence_records = WFHRequests.query.filter_by(request_id=request_id).all()
    is_recurring = len(recurrence_records) > 1

    # If recurring, include all dates in the response
    all_dates = []
    if is_recurring:
        all_dates = [{"specific_date": record.specific_date.strftime("%Y-%m-%d"), 
                      "is_am": record.is_am, 
                      "is_pm": record.is_pm} for record in recurrence_records]

    return jsonify({
        "data": request_data,
        "is_recurring": is_recurring,
        "all_dates": all_dates  # Include all dates for recurring requests
    }), 200


