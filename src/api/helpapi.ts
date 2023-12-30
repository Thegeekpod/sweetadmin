const token = localStorage.getItem('token')
export const apiHeaders =  {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    };
