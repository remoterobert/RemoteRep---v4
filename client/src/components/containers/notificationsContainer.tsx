import { Fragment, useState, useEffect } from 'react';
import { Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/20/solid';
import {
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import { TNotificationIcons } from 'types';
import { useNotification } from 'contexts/NotificationContext';
import * as localData from '../../services/localData';
import { useRouter } from 'next/router';

const DEFAULT_ICONS: TNotificationIcons = {
    success: CheckCircleIcon,
    warning: ExclamationTriangleIcon,
    error: ShieldExclamationIcon,
    info: InformationCircleIcon,
};

function classNames(...classes: any) {
    return classes.filter(Boolean).join(' ');
}

export default function NotificationsContainer({
    children,
}: {
    children: React.ReactNode;
}) {
    const { notifications, removeNotification } = useNotification();

    const [impersonating, setImpersonating] = useState(false);

    const router = useRouter();

    useEffect(() => {
        if (!router.isReady) return;

        setImpersonating(!!localData.get('impersonator')?.id);
    }, [router.isReady, router.pathname]);

    return (
        <>
            <div
                aria-live="assertive"
                className={`fixed bottom-0 ${
                    impersonating ? 'sm:top-16' : 'sm:top-0'
                } sm:right-0 flex flex-col justify-end sm:justify-start items-end gap-2 px-4 py-6 sm:p-6 z-50`}
            >
                {notifications.map(
                    ({ id, text, title, type = 'info', actions, icon }) => {
                        const Icon = icon || DEFAULT_ICONS[type];
                        return (
                            <div
                                key={id}
                                className="flex w-[90vw] sm:w-80 flex-col items-center sm:items-end"
                            >
                                <Transition
                                    show={true}
                                    appear={true}
                                    as={Fragment}
                                    enter="transform ease-out duration-300 transition"
                                    enterFrom="translate-y-2 opacity-0 sm:translate-y-0 sm:translate-x-2"
                                    enterTo="translate-y-0 opacity-100 sm:translate-x-0"
                                    leave="transition ease-in duration-100"
                                    leaveFrom="opacity-100"
                                    leaveTo="opacity-0"
                                >
                                    <div className="z-50 pointer-events-auto w-full max-w-sm rounded-lg bg-white shadow-lg ring-1 ring-black ring-opacity-5">
                                        <div className="p-4">
                                            <div className="flex items-start">
                                                <div className="flex-shrink-0 pt-0.5">
                                                    <Icon
                                                        className={
                                                            type === 'success'
                                                                ? 'text-success h-6 w-6'
                                                                : type ===
                                                                  'error'
                                                                ? 'text-danger h-6 w-6'
                                                                : type ===
                                                                  'warning'
                                                                ? 'text-warning h-6 w-6'
                                                                : 'text-primary h-6 w-6'
                                                        }
                                                        aria-hidden="true"
                                                    />
                                                </div>
                                                <div className="ml-3 w-0 flex-1">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {title}
                                                    </p>
                                                    <p className="mt-1 text-sm text-gray-500">
                                                        {text}
                                                    </p>
                                                    {actions && (
                                                        <div className="mt-4 flex">
                                                            {actions?.map(
                                                                ({
                                                                    text,
                                                                    onClick,
                                                                    isPrimary,
                                                                }) => (
                                                                    <button
                                                                        type="button"
                                                                        className={classNames(
                                                                            !isPrimary
                                                                                ? 'bg-white text-gray-900 focus-visible:outline-gray-900'
                                                                                : type ===
                                                                                  'success'
                                                                                ? 'bg-success text-white focus-visible:outline-info-600'
                                                                                : type ===
                                                                                  'error'
                                                                                ? 'bg-danger text-white focus-visible:outline-info-600'
                                                                                : type ===
                                                                                  'warning'
                                                                                ? 'bg-warning text-white focus-visible:outline-info-600'
                                                                                : 'bg-primary text-white focus-visible:outline-primary',
                                                                            'border-2 ml-3 inline-flex items-center rounded-md px-2.5 py-1.5 text-sm font-semibold shadow-sm hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2'
                                                                        )}
                                                                        onClick={
                                                                            onClick
                                                                        }
                                                                    >
                                                                        {text}
                                                                    </button>
                                                                )
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4 flex flex-shrink-0">
                                                    <button
                                                        type="button"
                                                        className={classNames(
                                                            type === 'success'
                                                                ? 'focus:ring-success'
                                                                : type ===
                                                                  'error'
                                                                ? 'focus:ring-danger'
                                                                : type ===
                                                                  'warning'
                                                                ? 'focus:ring-warning'
                                                                : 'focus:ring-primary',
                                                            'inline-flex rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2'
                                                        )}
                                                        onClick={() => {
                                                            removeNotification(
                                                                id
                                                            );
                                                        }}
                                                    >
                                                        <span className="sr-only">
                                                            Close
                                                        </span>
                                                        <XMarkIcon
                                                            className="h-5 w-5"
                                                            aria-hidden="true"
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Transition>
                            </div>
                        );
                    }
                )}
            </div>
            {children}
        </>
    );
}
