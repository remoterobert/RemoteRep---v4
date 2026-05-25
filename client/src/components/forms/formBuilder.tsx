import React, { useEffect, useState } from 'react';
import { FieldValues, FormProvider, UseFormReturn } from 'react-hook-form';
import { CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import * as formFields from '../../services/formFields';
import { TextInput } from './textInput';
import { TextareaInput } from './textareaInput';
import { ComboboxInput } from './comboboxInput';
import { ComboboxInputWithAddNewItem } from './comboboxInputWithAddNewItem';
import { SelectInput } from './selectInput';
import { MultiselectInput } from './multiselectInput';
import { FileInput } from './fileInput';
import { ImageInput } from './imageInput';

const InputWrapper: React.FC<{
    children: React.ReactNode;
    label?: string;
    errors?: any;
    name: string;
    className?: string;
}> = ({ children, label, errors, name, className }) => {
    const getErrorLanguage = () => {
        const defaultErrorLanguage: any = { required: 'Required.' };

        switch (name) {
            case 'password':
                return 'Too weak.';
            case 'repeatPassword':
                return 'No match.';
            default:
                return (
                    defaultErrorLanguage[errors[name]?.type] ||
                    errors[name]?.type
                );
        }
    };

    return (
        // Just passing className does not work for some reason.
        <div
            // className={`${className === 'col-span-1' && 'col-span-1'} ${
            //     className === 'col-span-2' && 'col-span-2'
            // } ${className === 'col-span-3' && 'col-span-3'} ${
            //     className === 'col-span-4' && 'col-span-4'
            // } ${className === 'col-span-5' && 'col-span-5'} ${
            //     className === 'col-span-6' && 'col-span-6'
            // }`}
            className={className}
        >
            {label && (
                <label className="block text-sm font-medium text-gray-900 dark:text-white">
                    {label}
                </label>
            )}

            <div className="mt-2">{children}</div>

            {errors && errors[name] && (
                <span className="mt-1 text-xs text-red-500">
                    {getErrorLanguage()}
                </span>
            )}
        </div>
    );
};

const FormBuilder: React.FC<{
    formHook: UseFormReturn<FieldValues, any>;
    formName?: keyof typeof formFields.forms;
    formFieldsOverride?: any;
    formDataOverride?: any;
    getFunc?: () => Promise<any>;
    postFunc?: (data: any) => Promise<boolean>;
    readOnly?: boolean;
    submitText?: string;
}> = ({
    formHook,
    formName,
    formFieldsOverride,
    formDataOverride,
    getFunc,
    postFunc,
    readOnly,
    submitText,
}) => {
    const fields:
        | {
              name: string;
              type: string;
              label?: string;
              className?: string;
              accept?: string[];
              uploadFunc?: (files: any, callback: any) => void;
              options?: { display: string; value: string }[];
              selectedOptions?: { display: string; value: string }[];
              //   action?: () => {};
              //   text?: string;
              disabled?: boolean;
              placeholder?: string;
              prefix?:
                  | { type: 'static'; display: string }
                  | {
                        type: 'dynamic';
                        displays: { [key: string]: string };
                        controlling: string;
                    };
              validation: { [key: string]: any };
              newItemAddFunc?: () => void;
          }[]
        | undefined = formName ? formFields.get(formName) : formFieldsOverride;
    const [defaultValues, setDefaultValues] = useState<any>({});
    const [submitting, setSubmitting] = useState(false);
    const [saved, setSaved] = useState(false);
    const [loading, setLoading] = useState(!!getFunc);

    useEffect(() => {
        setLoading(true);
        setDefaultValues({});
        if (formDataOverride) {
            setDefaultValues(formDataOverride);
            setLoading(false);
        } else if (getFunc) {
            getFunc().then((data) => {
                setDefaultValues(data || {});
                setLoading(false);
            });
        } else {
            setLoading(false);
        }
    }, [formDataOverride]);

    return (
        <>
            <FormProvider {...formHook}>
                <form
                    onSubmit={formHook.handleSubmit((data) => {
                        setSubmitting(true);
                        if (postFunc) {
                            const processedData: { [key: string]: any } = {};
                            Object.entries(data).forEach(([k, v]) => {
                                const fieldPrefix = fields?.find(
                                    (f) => f.name === k
                                )?.prefix;
                                if (fieldPrefix) {
                                    if (fieldPrefix.type === 'static')
                                        processedData[k] =
                                            fieldPrefix.display + v;
                                    else
                                        processedData[k] =
                                            fieldPrefix.displays[
                                                formHook.getValues()[
                                                    fieldPrefix.controlling
                                                ]
                                            ] + v;
                                } else processedData[k] = v;
                            });
                            postFunc(processedData).then((res) => {
                                if (res) setSaved(true);
                                else setSaved(false);
                                setSubmitting(false);
                            });
                        } else {
                            setSaved(false);
                            setSubmitting(false);
                        }
                    })}
                    onChange={() => setSaved(false)}
                >
                    <div className="grid grid-cols-6 gap-4">
                        {loading && (
                            <ClockIcon className="h-8 w-8 text-primary" />
                        )}
                        {!loading &&
                            fields?.map((f, i) => (
                                <InputWrapper
                                    key={i}
                                    label={f.label}
                                    errors={formHook.formState.errors}
                                    name={f.name}
                                    className={f.className}
                                >
                                    {[
                                        'text',
                                        'password',
                                        'email',
                                        'tel',
                                        'number',
                                    ].includes(f.type) && (
                                        <TextInput
                                            type={f.type}
                                            name={f.name}
                                            defaultValue={defaultValues[f.name]}
                                            disabled={f.disabled || readOnly}
                                            placeholder={f.placeholder}
                                            prefix={f.prefix}
                                            validation={f.validation}
                                        />
                                    )}
                                    {f.type === 'textarea' && (
                                        <TextareaInput
                                            name={f.name}
                                            defaultValue={defaultValues[f.name]}
                                            disabled={f.disabled || readOnly}
                                            placeholder={f.placeholder}
                                            validation={f.validation}
                                        />
                                    )}
                                    {f.type === 'combobox' && (
                                        <ComboboxInput
                                            name={f.name}
                                            defaultValue={defaultValues[f.name]}
                                            options={f.options || []}
                                            disabled={f.disabled || readOnly}
                                            placeholder={f.placeholder}
                                            validation={f.validation}
                                        />
                                    )}
                                    {f.type === 'comboboxInputWithAddLogic' && (
                                        <ComboboxInputWithAddNewItem
                                            name={f.name}
                                            defaultValue={defaultValues[f.name]}
                                            options={f.options || []}
                                            disabled={f.disabled || readOnly}
                                            validation={f.validation}
                                            newItemAddFunc={f?.newItemAddFunc}
                                            selectedOptions={
                                                f?.selectedOptions || []
                                            }
                                        />
                                    )}
                                    {f.type === 'select' && (
                                        <SelectInput
                                            name={f.name}
                                            defaultValue={defaultValues[f.name]}
                                            options={f.options || []}
                                            disabled={f.disabled || readOnly}
                                            placeholder={f.placeholder}
                                            validation={f.validation}
                                        />
                                    )}
                                    {f.type === 'multiselect' && (
                                        <MultiselectInput
                                            name={f.name}
                                            defaultValue={defaultValues[f.name]}
                                            options={f.options || []}
                                            disabled={f.disabled || readOnly}
                                            validation={f.validation}
                                        />
                                    )}
                                    {f.type === 'file' && (
                                        <FileInput
                                            name={f.name}
                                            defaultValue={defaultValues[f.name]}
                                            disabled={f.disabled || readOnly}
                                            validation={f.validation}
                                            accept={f.accept}
                                            uploadFunc={f.uploadFunc}
                                        />
                                    )}
                                    {f.type === 'image' && (
                                        <ImageInput
                                            name={f.name}
                                            defaultValue={defaultValues[f.name]}
                                            disabled={f.disabled || readOnly}
                                            validation={f.validation}
                                            accept={f.accept}
                                            uploadFunc={f.uploadFunc}
                                        />
                                    )}
                                </InputWrapper>
                            ))}
                    </div>
                    {!readOnly && (
                        <div className="mt-6">
                            <button
                                type="submit"
                                className="inline-flex w-full min-w-max h-12 items-center justify-center rounded-full bg-interviewing px-3 py-2 text-sm font-semibold text-gray-100 shadow-sm hover:filter hover:brightness-[95%] sm:col-start-1 sm:mt-0 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500"
                                disabled={submitting || loading || saved}
                            >
                                {!saved ? (
                                    submitText || 'Save'
                                ) : (
                                    <CheckCircleIcon className="h-6 w-6 text-primary" />
                                )}
                            </button>
                        </div>
                    )}
                </form>
            </FormProvider>
        </>
    );
};

export default FormBuilder;
