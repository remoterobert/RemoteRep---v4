import React from 'react';
import { DELETE_CONFIRM_MESSAGE_ADMIN } from 'services/constants';
import FormBuilder from 'components/forms/formBuilder';
import { useForm } from 'react-hook-form';
import apiRequest from 'services/apiRequest';

const DeleteUser: React.FC<{
    user: any;
    handleClose: () => void;
    setUpdate: () => void;
}> = ({ user, handleClose, setUpdate }) => {
    const deleteForm = useForm();

    const handleSubmit = async () => {
        try {
            await apiRequest('DELETE', `/admin/users/${user.id}`);
            handleClose();
            setUpdate();
            return true;
        } catch (error) {
            return false;
        }
    };

    return (
        <div>
            <p className="text-md text-gray-900">
                To delete this account please type:{' '}
                <span className="font-bold">
                    {DELETE_CONFIRM_MESSAGE_ADMIN}
                </span>
                <br />
                This action cannot be undone.
                <div className="mt-10">
                    <FormBuilder
                        formHook={deleteForm}
                        formName="deleteAccountByAdmin"
                        submitText="Delete"
                        postFunc={handleSubmit}
                    />
                </div>
            </p>
        </div>
    );
};

export default DeleteUser;
