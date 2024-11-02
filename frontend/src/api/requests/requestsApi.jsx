import axios from 'axios';
import config from '../../config/config';

const BASE_URL = config.ENDPOINT_BE_URL;

export const fetchWfhRequests = async (staffId) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/staff/${staffId}/all_wfh_dates`);
    console.log("fetchRequests -> response", response)
    return response.data;
  } catch (error) {
    if (error.response?.status === 404) {
      throw new Error('No WFH requests found for this staff member.');
    }
    throw new Error('Failed to fetch requests. Please try again later.');
  }
};

export const cancelWfhRequest = async (staffId, requestId, specificDate) => {
  try {
    const formattedDate = new Date(specificDate).toISOString().split('T')[0];
    const response = await axios.put(
      `${BASE_URL}/api/staff/${staffId}/cancel_request/${requestId}/${formattedDate}`,
      {},
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Failed to cancel request.');
    } else if (error.request) {
      throw new Error('Network error. Please check your connection.');
    }
    throw new Error('An unexpected error occurred.');
  }
};