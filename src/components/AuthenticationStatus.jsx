import React from 'react';

const AuthenticationStatus = ({ status }) => {
  if (!status) return null;

  return (
    <div>
      <p>{status.message}</p>
    </div>
  );
};

export default AuthenticationStatus;