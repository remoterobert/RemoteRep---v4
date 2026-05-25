import FormBuilder from 'components/forms/formBuilder';
import React from 'react';
import { useForm } from 'react-hook-form';
import { DELETE_CONFIRM_MESSAGE } from '../../services/constants';
import apiRequest from 'services/apiRequest';
import { signOut } from 'services/authentication';
import * as localData from '../../services/localData';
import { useRouter } from 'next/router';

const DeleteAccount: React.FC<{
    user: any;
    handleClose: () => void;
}> = ({ handleClose, user }) => {
    const deleteForm = useForm();
    const router = useRouter();

    const handleSubmit = async () => {
        try {
            await apiRequest(
                'DELETE',
                user.accountType === 'talent'
                    ? `/talent/${user.id}`
                    : `/client/${user.id}`
            );
            handleClose();
            signOut();
            localData.set('impersonator', null);
            router.replace('/authentication/sign-in');
            return true;
        } catch (error) {
            return false;
        }
    };

    return (
        <div>
            <p className="text-md text-gray-900">
                To delete your account please type:{' '}
                <span className="font-bold">{DELETE_CONFIRM_MESSAGE}</span>
                <br />
                This action cannot be undone.
                <div className="mt-10">
                    <FormBuilder
                        formHook={deleteForm}
                        formName="deleteAccount"
                        submitText="Delete"
                        postFunc={handleSubmit}
                    />
                </div>
            </p>
        </div>
    );
};

export default DeleteAccount;
