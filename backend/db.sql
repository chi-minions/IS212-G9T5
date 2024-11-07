-- Drop existing types
DROP TYPE IF EXISTS request_status CASCADE;
DROP TYPE IF EXISTS decision_status CASCADE;

-- Drop existing tables
DROP TABLE IF EXISTS work_from_home_request_dates CASCADE;
DROP TABLE IF EXISTS work_from_home_requests CASCADE;
DROP TABLE IF EXISTS requestdecisions CASCADE;
DROP TABLE IF EXISTS WFHRequestLogs CASCADE;
DROP TABLE IF EXISTS WithdrawDecisions CASCADE;
DROP TABLE IF EXISTS RequestDecisions CASCADE;
DROP TABLE IF EXISTS WFHRequests CASCADE;

-- Create types
CREATE TYPE request_status AS ENUM ('Pending', 'Approved', 'Rejected', 'Cancelled', 'Withdrawn', 'Pending_Withdraw');
CREATE TYPE decision_status AS ENUM ('Approved', 'Rejected');

-- WFHRequests Table
CREATE TABLE WFHRequests (
    request_id VARCHAR(36),
    specific_date DATE,
    staff_id INT,
    manager_id INT,
    is_am BOOLEAN,
    is_pm BOOLEAN,
    request_status request_status,
    apply_date DATE,
    request_reason TEXT,
    PRIMARY KEY (request_id, specific_date),
    FOREIGN KEY (staff_id) REFERENCES employee(staff_id),
    FOREIGN KEY (manager_id) REFERENCES employee(staff_id)
);

-- RequestDecisions Table
CREATE TABLE RequestDecisions (
    decision_id SERIAL PRIMARY KEY,
    request_id VARCHAR(36),
    specific_date DATE,
    manager_id INT,
    decision_date DATE,
    decision_status decision_status,
    decision_notes TEXT,
    FOREIGN KEY (request_id, specific_date) REFERENCES WFHRequests(request_id, specific_date),
    FOREIGN KEY (manager_id) REFERENCES employee(staff_id)
);

-- WithdrawDecisions Table
CREATE TABLE WithdrawDecisions (
    withdraw_decision_id SERIAL PRIMARY KEY,
    request_id VARCHAR(36),
    specific_date DATE,
    manager_id INT,
    decision_date DATE,
    decision_status decision_status,
    decision_notes TEXT,
    FOREIGN KEY (request_id, specific_date) REFERENCES WFHRequests(request_id, specific_date),
    FOREIGN KEY (manager_id) REFERENCES employee(staff_id)
);

-- WFHRequestLogs Table
CREATE TABLE WFHRequestLogs (
    log_datetime TIMESTAMP,
    request_id VARCHAR(36),
    specific_date DATE,
    request_status_log request_status,
    apply_date_log DATE,
    reason_log TEXT,
    PRIMARY KEY (log_datetime, request_id, specific_date),
    FOREIGN KEY (request_id, specific_date) REFERENCES WFHRequests(request_id, specific_date)
);