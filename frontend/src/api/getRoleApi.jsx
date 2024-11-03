import config from '../config/config';

const BASE_URL = config.ENDPOINT_BE_URL;
console.log("getRoleApi", BASE_URL);

export const getRole = async (staffId) => {
    try {
        const response = await fetch(`${BASE_URL}/api/role/${staffId}`); // Fixed URL construction
        if (!response.ok) {
            throw new Error(`Error fetching role data: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        throw error;
    }
};

export default getRole;