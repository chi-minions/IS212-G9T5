import React, { useState } from 'react';
import { useParams } from 'react-router-dom';

const WFHRequestForm = () => {
  const { staffId } = useParams();
  // State to manage form inputs
  const [formData, setFormData] = useState({
    staff_id: staffId, // Set from URL parameter
    request_type: 'Ad-hoc',
    start_date: '',
    end_date: '',
    recurrence_days: '',  // Changed from array to single value
    is_am: false,        // Changed from 0/1 to boolean
    is_pm: false,        // Changed from 0/1 to boolean
    apply_date: new Date().toISOString().split('T')[0],
    request_reason: ''
  });

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle the recurrence day selection
  const handleRecurrenceDay = (day) => {
    setFormData(prev => ({
      ...prev,
      recurrence_days: prev.recurrence_days === day ? '' : day
    }));
  };

  // Map day letter to full day name
  const dayMapping = {
    'M': 'monday',
    'T': 'tuesday',
    'W': 'wednesday',
    'R': 'thursday',
    'F': 'friday',
    'S': 'saturday',
    'U': 'sunday'
  };

  // Form submission logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prepare the payload according to the backend expectations
    const payload = {
      staff_id: formData.staff_id,
      request_type: formData.request_type,
      start_date: formData.start_date,
      end_date: formData.request_type === 'Ad-hoc' ? formData.start_date : formData.end_date,
      recurrence_days: formData.request_type === 'Recurring' ? 
        dayMapping[formData.recurrence_days] || formData.recurrence_days : null,
      is_am: formData.is_am,
      is_pm: formData.is_pm,
      apply_date: formData.apply_date,
      request_reason: formData.request_reason
    };

    console.log(payload);

    try {
      const response = await fetch('http://localhost:5001/api/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });

      const result = await response.json();
      if (response.ok) {
        alert('WFH request submitted successfully!');
        console.log('Success:', result);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request');
    }
  };

  return (
    <div className="wfh-request-container" style={{ padding: '20px' }}>
      <h2>Apply Work from Home Arrangement</h2>
      <form onSubmit={handleSubmit}>
        {/* Request Type Selection */}
        <div>
          <label>Select type of arrangement</label>
          <select
            name="request_type"
            value={formData.request_type}
            onChange={handleInputChange}
            style={{ padding: '8px', marginBottom: '15px' }}
          >
            <option value="Ad-hoc">Ad-hoc</option>
            <option value="Recurring">Recurring</option>
          </select>
        </div>

        {/* For Ad-hoc Requests */}
        {formData.request_type === 'Ad-hoc' && (
          <div>
            <label>Select Date</label>
            <input
              type="date"
              name="start_date"
              value={formData.start_date}
              onChange={handleInputChange}
              style={{ padding: '8px', marginBottom: '15px' }}
            />
          </div>
        )}

        {/* For Recurring Requests */}
        {formData.request_type === 'Recurring' && (
          <>
            <div>
              <label>Select Start date</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleInputChange}
                style={{ padding: '8px', marginBottom: '15px' }}
              />
            </div>
            <div>
              <label>Select End date</label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleInputChange}
                style={{ padding: '8px', marginBottom: '15px' }}
              />
            </div>

            {/* Recurrence Day Selection */}
            <div>
              <label>Select recurring day:</label>
              <div>
                {Object.entries(dayMapping).map(([key, value]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleRecurrenceDay(key)}
                    style={{
                      margin: '5px',
                      padding: '10px',
                      backgroundColor: formData.recurrence_days === key ? '#007bff' : '#ccc',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                    }}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Timing Selection */}
        <div>
          <label>Select Timing</label>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <label style={{ marginRight: '20px' }}>
              <input
                type="checkbox"
                name="is_am"
                checked={formData.is_am}
                onChange={handleInputChange}
              />
              AM
            </label>
            <label>
              <input
                type="checkbox"
                name="is_pm"
                checked={formData.is_pm}
                onChange={handleInputChange}
              />
              PM
            </label>
          </div>
        </div>

        {/* Request Reason */}
        <div>
          <label>Please state reason for work from home arrangement</label>
          <textarea
            name="request_reason"
            value={formData.request_reason}
            onChange={handleInputChange}
            style={{ width: '100%', padding: '8px', marginTop: '10px' }}
          />
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px', 
            marginTop: '20px', 
            backgroundColor: '#007bff', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '5px' 
          }}
        >
          Submit
        </button>
      </form>
    </div>
  );
};

export default WFHRequestForm;



