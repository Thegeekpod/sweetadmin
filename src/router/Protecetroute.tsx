import React, { PropsWithChildren, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const PrivateRoute: React.FC<PropsWithChildren<{}>> = ({ children }) => {
  const { token, checkAuthValidity } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthentication = async () => {
      const isValid = await checkAuthValidity();
      if (!isValid) {
        navigate('/auth/cover-login');
      }
    };

    checkAuthentication();
  }, [checkAuthValidity, navigate]);

  return <>{children}</>;
};

export default PrivateRoute;
