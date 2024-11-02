import React from 'react';
import WithdrawalForm from '../components/WithdrawalForm/WithdrawalForm';
import { useParams } from 'react-router-dom';

const WithdrawalFormView = () => {
  const { staffId } = useParams();

  return (
    <div className="withdrawal-form-view">
      <h1>Withdraw Work from Home Arrangement</h1>
      <WithdrawalForm  staffId={staffId}/>
    </div>
  );
};

export default WithdrawalFormView;