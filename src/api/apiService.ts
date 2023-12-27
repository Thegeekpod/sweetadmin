import axios from 'axios';

const API_URL = 'your_api_url';

export const loginUser = async (credentials: { username: string; password: string }) => {
    try {
      const response = await axios.post(`${API_URL}/login`, credentials);
      return response.data;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || 'An error occurred');
      // Or if using unknown:
      // throw new Error((error as Error).response?.data?.message || 'An error occurred');
    }
  };
// Other API methods...
