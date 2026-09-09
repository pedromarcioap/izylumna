import React from 'react';
import { ClientVoterModal, ClientVoterModalProps } from './ClientVoterModal';

export type ClientVoterIdentityModalProps = ClientVoterModalProps;
export const ClientVoterIdentityModal: React.FC<ClientVoterIdentityModalProps> = (props) => {
  return <ClientVoterModal {...props} />;
};

export { ClientVoterModal };
