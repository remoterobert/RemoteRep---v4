import axios from 'axios';
import * as localData from './localData';
import countries from './countries';
import apiRequest from './apiRequest';
import {
    DELETE_CONFIRM_MESSAGE,
    DELETE_CONFIRM_MESSAGE_ADMIN,
} from './constants';

// TODO: type definitions

const forms = {
    talentSignUp: [
        {
            className: 'col-span-6',
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'john@doe.com',
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'password',
            type: 'password',
            label: 'Password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                pattern:
                    /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/,
            },
        },
        {
            className: 'col-span-3',
            name: 'repeatPassword',
            type: 'password',
            label: 'Repeat password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                validate: (value: any, formValues: any) =>
                    formValues?.password === value,
            },
        },
        {
            className: 'col-span-3',
            name: 'firstName',
            type: 'text',
            label: 'First name',
            placeholder: 'John',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'lastName',
            type: 'text',
            label: 'Last name',
            placeholder: 'Doe',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'city',
            type: 'text',
            label: 'City',
            placeholder: 'San Francisco',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'state',
            type: 'text',
            label: 'State',
            placeholder: 'California',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'zip',
            type: 'text',
            label: 'ZIP code',
            placeholder: '94101',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'country',
            type: 'combobox',
            label: 'Country',
            // placeholder: 'US',
            options: countries.map((c) => {
                return { display: c.name, value: c.code };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-6',
            name: 'phone',
            type: 'tel',
            label: 'Phone number',
            placeholder: '0000000000',
            prefix: {
                type: 'dynamic',
                displays: (() => {
                    const cacheMap: { [key: string]: string } = {};
                    countries.forEach((c) => {
                        cacheMap[c.code] = c.dial_code;
                    });
                    return cacheMap;
                })(),
                controlling: 'country',
            },
            validation: {
                required: true,
                pattern: /^([0-9]){6,14}$/,
            },
        },
    ],
    clientSignUp: [
        {
            className: 'col-span-6',
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'john@doe.com',
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'password',
            type: 'password',
            label: 'Password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                pattern:
                    /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/,
            },
        },
        {
            className: 'col-span-3',
            name: 'repeatPassword',
            type: 'password',
            label: 'Repeat password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                validate: (value: any, formValues: any) =>
                    formValues?.password === value,
            },
        },
        {
            className: 'col-span-3',
            name: 'firstName',
            type: 'text',
            label: 'First name',
            placeholder: 'John',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'lastName',
            type: 'text',
            label: 'Last name',
            placeholder: 'Doe',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-6',
            name: 'companyName',
            type: 'text',
            label: 'Company name',
            placeholder: 'Doe & Co.',
            validation: { required: true, minLength: 2, maxLength: 100 },
        },
        {
            className: 'col-span-3',
            name: 'city',
            type: 'text',
            label: 'City',
            placeholder: 'San Francisco',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'state',
            type: 'text',
            label: 'State',
            placeholder: 'California',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'zip',
            type: 'text',
            label: 'ZIP code',
            placeholder: '94101',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'country',
            type: 'combobox',
            label: 'Country',
            // placeholder: 'US',
            options: countries.map((c) => {
                return { display: c.name, value: c.code };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-6',
            name: 'phone',
            type: 'tel',
            label: 'Phone number',
            placeholder: '0000000000',
            prefix: {
                type: 'dynamic',
                displays: (() => {
                    const cacheMap: { [key: string]: string } = {};
                    countries.forEach((c) => {
                        cacheMap[c.code] = c.dial_code;
                    });
                    return cacheMap;
                })(),
                controlling: 'country',
            },
            validation: {
                required: true,
                pattern: /^([0-9]){6,14}$/,
            },
        },
    ],
    signIn: [
        {
            className: 'col-span-6',
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'john@doe.com',
            validation: { required: true },
        },
        {
            className: 'col-span-6',
            name: 'password',
            type: 'password',
            label: 'Password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                pattern:
                    /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/,
            },
        },
    ],
    forgotPassword: [
        {
            className: 'col-span-6',
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'john@doe.com',
            validation: { required: true },
        },
    ],
    resetPassword: [
        {
            className: 'col-span-6',
            name: 'password',
            type: 'password',
            label: 'Password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                pattern:
                    /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/,
            },
        },
        {
            className: 'col-span-6',
            name: 'repeatPassword',
            type: 'password',
            label: 'Repeat password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                validate: (value: any, formValues: any) =>
                    formValues?.password === value,
            },
        },
    ],
    talentProfile: [
        {
            className: 'col-span-6',
            name: 'photoUrl',
            type: 'image',
            label: 'Photo',
            accept: ['.png', '.jpg', '.jpeg'],
            validation: { required: true },
            uploadFunc: async (files: any, callback: any) => {
                if (files.length !== 1) return;
                const file = files[0];

                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/', {
                    method: 'GET',
                });

                const { publicUrl } = await res.json();

                axios
                    .post(`${publicUrl}/files/profile`, formData, {
                        headers: {
                            Authorization: localData.get('user.token'),
                        },
                    })
                    .then((apiRes) => {
                        callback(apiRes?.data?.path);
                    })
                    .catch((apiErr) => {
                        console.error(apiErr);
                    });
            },
        },
        {
            className: 'col-span-6',
            name: 'headline',
            type: 'text',
            label: 'Headline',
            placeholder: 'Write an eye-catching title',
            validation: { required: true, minLength: 10, maxLength: 80 },
        },
        {
            className: 'col-span-6',
            name: 'videoUrl',
            type: 'text',
            label: 'Introduction video (optional)',
            placeholder: 'https://www.loom.com/share/your-video',
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'about',
            type: 'textarea',
            label: 'About',
            placeholder: 'Write a few sentences about yourself',
            validation: { required: true, minLength: 100, maxLength: 5000 },
        },
    ],
    talentExperience: [
        {
            className: 'col-span-3',
            name: 'education',
            type: 'select',
            label: 'Education',
            options: [
                'High school',
                'Some college',
                'Associate degree',
                "Bachelor's degree",
                "Master's degree",
                'Doctorate',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'yearsOfExperience',
            type: 'number',
            label: 'Years of experience',
            validation: { required: false, min: 0, max: 100 },
        },
        {
            className: 'col-span-3',
            name: 'industries',
            type: 'multiselect',
            label: 'Industries',
            options: [
                'Affiliate marketing networks',
                'Artificial intelligence and machine learning companies',
                'Cloud storage and hosting services',
                'Content marketing agencies',
                'Cryptocurrency and blockchain companies',
                'Customer relationship management (CRM) software vendors',
                'Cybersecurity software providers',
                'Data analytics and business intelligence firms',
                'Digital marketing agencies',
                'E-commerce platforms',
                'E-learning platforms and Learning Management Systems (LMS)',
                'E-sports and online gaming platforms',
                'Email marketing services',
                'Freelance marketplaces',
                'Graphic design services',
                'Influencer marketing platforms',
                'Internet of Things (IoT) providers',
                'Language learning platforms',
                'Mobile app development companies',
                'Online advertising platforms',
                'Online art and design marketplaces',
                'Online auction and marketplace platforms',
                'Online automotive parts and services',
                'Online beauty and skincare products',
                'Online course providers',
                'Online dating and matchmaking services',
                'Online food ordering and delivery platforms',
                'Online fundraising and crowdfunding platforms',
                'Online gardening and landscaping services',
                'Online gift and specialty product sales',
                'Online insurance providers',
                'Online job boards',
                'Online office supply and stationery sales',
                'Online payment processing companies',
                'Online recruitment and staffing agencies',
                'Online research and data collection firms',
                'Online specialty food and beverage sales',
                'Online streaming services and content providers',
                'Online survey and polling tools',
                'Online ticketing and event management platforms',
                'Online travel agencies and booking platforms',
                'Online tutoring services',
                'Podcasting and audio content platforms',
                'Project management software providers',
                'Remote baby and childcare product sales',
                'Remote book and eBook sales',
                'Remote car sales and leasing services',
                'Remote coaching and personal development services',
                'Remote customer support services',
                'Remote electronics and gadget sales',
                'Remote event planning services',
                'Remote fashion and clothing sales',
                'Remote financial services and banking platforms',
                'Remote healthcare and telemedicine services',
                'Remote home improvement and maintenance services',
                'Remote legal and consultation services',
                'Remote music and audio production services',
                'Remote pet care and product sales',
                'Remote photography and image editing services',
                'Remote public relations agencies',
                'Remote real estate services',
                'Remote sports and outdoor equipment sales',
                'Remote translation services',
                'Renewable energy technology firms',
                'Search engine optimization (SEO) companies',
                'Smart home technology vendors',
                'Social media management firms',
                'Software as a Service (SaaS) companies',
                'Subscription box services',
                'Telecommunications providers',
                'Video production companies',
                'Virtual and remote collaboration tools',
                'Virtual assistant and chatbot providers',
                'Virtual event platforms',
                'Virtual fitness and wellness platforms',
                'Virtual office space providers',
                'Virtual reality and augmented reality developers',
                'Web development agencies',
                'Webinar and video conferencing platforms',
                'Website analytics and monitoring services',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'salesRoles',
            type: 'multiselect',
            label: 'Roles',
            options: [
                'Appointment-setter',
                'SDR',
                'BDR',
                'Account executive',
                'Closer',
                'Sales management',
                'Executive',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'salesTypes',
            type: 'multiselect',
            label: 'Sales types',
            options: ['B2B', 'B2C', 'B2G'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'decisionMakers',
            type: 'multiselect',
            label: 'Decision-makers',
            options: ['Small business', 'C-suite', 'Consumer', 'Other'].map(
                (o: string) => {
                    return { value: o, display: o };
                }
            ),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'salesEnvironments',
            type: 'multiselect',
            label: 'Sales environments',
            options: [
                'In-person',
                'Phone',
                'Zoom / video conference',
                'Door-to-door',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'salesCycles',
            type: 'multiselect',
            label: 'Sales cycles',
            options: [
                '1 call',
                '1 week',
                '1 month',
                '6 months',
                '6 months+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'dealAmounts',
            type: 'multiselect',
            label: 'Average deal amounts',
            options: [
                '$0 - $5000',
                '$5000 - $20,000',
                '$20,000 - $50,000',
                '$50,000 - $100,000',
                '$100,000 - $500,000',
                '$500,000 - $1M',
                '$1M+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'salesVolumes',
            type: 'multiselect',
            label: 'Average annual sales volumes',
            options: [
                '$0 - $100,000',
                '$100,000 - $250,000',
                '$250,000 - $500,000',
                '$500,000 - $1M',
                '$1M - $2M',
                '$2M - $5M',
                '$5M+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'leadTypes',
            type: 'multiselect',
            label: 'Lead types',
            options: ['Inbound', 'Outbound'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'technologies',
            type: 'multiselect',
            label: 'Technologies',
            options: [
                'Google Drive',
                'Zoom',
                'Google Meet',
                'Google Calendar',
                'Powerpoint',
                'Keynote',
                'Canva',
                'Docusign',
                'Salesforce',
                'Hubspot',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
    ],
    talentGoals: [
        {
            className: 'col-span-3',
            name: 'companyAge',
            type: 'number',
            label: 'Minimum company age',
            validation: { required: false, min: 0, max: 100 },
        },
        {
            className: 'col-span-3',
            name: 'companyHeadcount',
            type: 'number',
            label: 'Minimum company headcount',
            validation: { required: false, min: 0, max: 1000 },
        },
        {
            className: 'col-span-3',
            name: 'industries',
            type: 'multiselect',
            label: 'Industries',
            options: [
                'Affiliate marketing networks',
                'Artificial intelligence and machine learning companies',
                'Cloud storage and hosting services',
                'Content marketing agencies',
                'Cryptocurrency and blockchain companies',
                'Customer relationship management (CRM) software vendors',
                'Cybersecurity software providers',
                'Data analytics and business intelligence firms',
                'Digital marketing agencies',
                'E-commerce platforms',
                'E-learning platforms and Learning Management Systems (LMS)',
                'E-sports and online gaming platforms',
                'Email marketing services',
                'Freelance marketplaces',
                'Graphic design services',
                'Influencer marketing platforms',
                'Internet of Things (IoT) providers',
                'Language learning platforms',
                'Mobile app development companies',
                'Online advertising platforms',
                'Online art and design marketplaces',
                'Online auction and marketplace platforms',
                'Online automotive parts and services',
                'Online beauty and skincare products',
                'Online course providers',
                'Online dating and matchmaking services',
                'Online food ordering and delivery platforms',
                'Online fundraising and crowdfunding platforms',
                'Online gardening and landscaping services',
                'Online gift and specialty product sales',
                'Online insurance providers',
                'Online job boards',
                'Online office supply and stationery sales',
                'Online payment processing companies',
                'Online recruitment and staffing agencies',
                'Online research and data collection firms',
                'Online specialty food and beverage sales',
                'Online streaming services and content providers',
                'Online survey and polling tools',
                'Online ticketing and event management platforms',
                'Online travel agencies and booking platforms',
                'Online tutoring services',
                'Podcasting and audio content platforms',
                'Project management software providers',
                'Remote baby and childcare product sales',
                'Remote book and eBook sales',
                'Remote car sales and leasing services',
                'Remote coaching and personal development services',
                'Remote customer support services',
                'Remote electronics and gadget sales',
                'Remote event planning services',
                'Remote fashion and clothing sales',
                'Remote financial services and banking platforms',
                'Remote healthcare and telemedicine services',
                'Remote home improvement and maintenance services',
                'Remote legal and consultation services',
                'Remote music and audio production services',
                'Remote pet care and product sales',
                'Remote photography and image editing services',
                'Remote public relations agencies',
                'Remote real estate services',
                'Remote sports and outdoor equipment sales',
                'Remote translation services',
                'Renewable energy technology firms',
                'Search engine optimization (SEO) companies',
                'Smart home technology vendors',
                'Social media management firms',
                'Software as a Service (SaaS) companies',
                'Subscription box services',
                'Telecommunications providers',
                'Video production companies',
                'Virtual and remote collaboration tools',
                'Virtual assistant and chatbot providers',
                'Virtual event platforms',
                'Virtual fitness and wellness platforms',
                'Virtual office space providers',
                'Virtual reality and augmented reality developers',
                'Web development agencies',
                'Webinar and video conferencing platforms',
                'Website analytics and monitoring services',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'salesRoles',
            type: 'multiselect',
            label: 'Roles',
            options: [
                'Appointment-setter',
                'SDR',
                'BDR',
                'Account executive',
                'Closer',
                'Sales management',
                'Executive',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'commitment',
            type: 'multiselect',
            label: 'Commitment',
            options: [
                'Full-time',
                'Part-time',
                'Temporary',
                'Internship',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'benefits',
            type: 'multiselect',
            label: 'Benefits',
            options: [
                'Health insurance',
                'Dental coverage',
                'Vision coverage',
                '401k',
                'Stock options',
                'None',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'compensationTypes',
            type: 'multiselect',
            label: 'Compensation types',
            options: [
                'Salary',
                'Base + comission',
                'Comission-only',
                'Draw against comission',
                'Hourly',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-3',
            name: 'minimumCompensation',
            type: 'number',
            label: 'Minimum total annual compensation in USD',
            validation: { required: false, min: 0, max: 1000000 },
        },
    ],
    talentFiles: [
        {
            className: 'col-span-6',
            name: 'resume',
            type: 'file',
            label: 'Résumé',
            accept: ['.pdf'],
            validation: { required: false },
            uploadFunc: async (files: any, callback: any) => {
                if (files.length !== 1) return;
                const file = files[0];

                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/', {
                    method: 'GET',
                });

                const { publicUrl } = await res.json();

                axios
                    .post(`${publicUrl}/files/resume`, formData, {
                        headers: {
                            Authorization: localData.get('user.token'),
                        },
                    })
                    .then((apiRes) => {
                        callback(apiRes?.data?.path);
                    })
                    .catch((apiErr) => {
                        console.error(apiErr);
                    });
            },
        },
    ],
    clientProfile: [
        {
            className: 'col-span-6',
            name: 'photoUrl',
            type: 'image',
            label: 'Photo',
            accept: ['.png', '.jpg', '.jpeg'],
            validation: { required: true },
            uploadFunc: async (files: any, callback: any) => {
                if (files.length !== 1) return;
                const file = files[0];

                const formData = new FormData();
                formData.append('file', file);

                const res = await fetch('/api/', {
                    method: 'GET',
                });

                const { publicUrl } = await res.json();

                axios
                    .post(`${publicUrl}/files/profile`, formData, {
                        headers: {
                            Authorization: localData.get('user.token'),
                        },
                    })
                    .then((apiRes) => {
                        callback(apiRes?.data?.path);
                    })
                    .catch((apiErr) => {
                        console.error(apiErr);
                    });
            },
        },
        {
            className: 'col-span-3',
            name: 'companyAge',
            type: 'number',
            label: 'Company age',
            validation: { required: true, min: 0, max: 100 },
        },
        {
            className: 'col-span-3',
            name: 'companyHeadcount',
            type: 'number',
            label: 'Company headcount',
            validation: { required: true, min: 0, max: 1000 },
        },
        {
            className: 'col-span-6',
            name: 'industry',
            type: 'select',
            label: 'Industry',
            options: [
                'Affiliate marketing networks',
                'Artificial intelligence and machine learning companies',
                'Cloud storage and hosting services',
                'Content marketing agencies',
                'Cryptocurrency and blockchain companies',
                'Customer relationship management (CRM) software vendors',
                'Cybersecurity software providers',
                'Data analytics and business intelligence firms',
                'Digital marketing agencies',
                'E-commerce platforms',
                'E-learning platforms and Learning Management Systems (LMS)',
                'E-sports and online gaming platforms',
                'Email marketing services',
                'Freelance marketplaces',
                'Graphic design services',
                'Influencer marketing platforms',
                'Internet of Things (IoT) providers',
                'Language learning platforms',
                'Mobile app development companies',
                'Online advertising platforms',
                'Online art and design marketplaces',
                'Online auction and marketplace platforms',
                'Online automotive parts and services',
                'Online beauty and skincare products',
                'Online course providers',
                'Online dating and matchmaking services',
                'Online food ordering and delivery platforms',
                'Online fundraising and crowdfunding platforms',
                'Online gardening and landscaping services',
                'Online gift and specialty product sales',
                'Online insurance providers',
                'Online job boards',
                'Online office supply and stationery sales',
                'Online payment processing companies',
                'Online recruitment and staffing agencies',
                'Online research and data collection firms',
                'Online specialty food and beverage sales',
                'Online streaming services and content providers',
                'Online survey and polling tools',
                'Online ticketing and event management platforms',
                'Online travel agencies and booking platforms',
                'Online tutoring services',
                'Podcasting and audio content platforms',
                'Project management software providers',
                'Remote baby and childcare product sales',
                'Remote book and eBook sales',
                'Remote car sales and leasing services',
                'Remote coaching and personal development services',
                'Remote customer support services',
                'Remote electronics and gadget sales',
                'Remote event planning services',
                'Remote fashion and clothing sales',
                'Remote financial services and banking platforms',
                'Remote healthcare and telemedicine services',
                'Remote home improvement and maintenance services',
                'Remote legal and consultation services',
                'Remote music and audio production services',
                'Remote pet care and product sales',
                'Remote photography and image editing services',
                'Remote public relations agencies',
                'Remote real estate services',
                'Remote sports and outdoor equipment sales',
                'Remote translation services',
                'Renewable energy technology firms',
                'Search engine optimization (SEO) companies',
                'Smart home technology vendors',
                'Social media management firms',
                'Software as a Service (SaaS) companies',
                'Subscription box services',
                'Telecommunications providers',
                'Video production companies',
                'Virtual and remote collaboration tools',
                'Virtual assistant and chatbot providers',
                'Virtual event platforms',
                'Virtual fitness and wellness platforms',
                'Virtual office space providers',
                'Virtual reality and augmented reality developers',
                'Web development agencies',
                'Webinar and video conferencing platforms',
                'Website analytics and monitoring services',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
    ],
    changeEmail: [
        {
            className: 'col-span-6',
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'john@doe.com',
            validation: { required: true },
        },
    ],
    editContact: [
        {
            className: 'col-span-3',
            name: 'firstName',
            type: 'text',
            label: 'First name',
            placeholder: 'John',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'lastName',
            type: 'text',
            label: 'Last name',
            placeholder: 'Doe',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'city',
            type: 'text',
            label: 'City',
            placeholder: 'San Francisco',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'state',
            type: 'text',
            label: 'State',
            placeholder: 'California',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'zip',
            type: 'text',
            label: 'ZIP code',
            placeholder: '94101',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'country',
            type: 'combobox',
            label: 'Country',
            options: countries.map((c) => {
                return { display: c.name, value: c.code };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-6',
            name: 'phone',
            type: 'tel',
            label: 'Phone number',
            placeholder: '0000000000',
            prefix: {
                type: 'dynamic',
                displays: (() => {
                    const cacheMap: { [key: string]: string } = {};
                    countries.forEach((c) => {
                        cacheMap[c.code] = c.dial_code;
                    });
                    return cacheMap;
                })(),
                controlling: 'country',
            },
            validation: {
                required: true,
                pattern: /^([0-9]){6,14}$/,
            },
        },
    ],
    editContactClient: [
        {
            className: 'col-span-3',
            name: 'firstName',
            type: 'text',
            label: 'First name',
            placeholder: 'John',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'lastName',
            type: 'text',
            label: 'Last name',
            placeholder: 'Doe',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-6',
            name: 'companyName',
            type: 'text',
            label: 'Company name',
            placeholder: 'Doe & Co.',
            validation: { required: true, minLength: 2, maxLength: 100 },
        },
        {
            className: 'col-span-3',
            name: 'city',
            type: 'text',
            label: 'City',
            placeholder: 'San Francisco',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'state',
            type: 'text',
            label: 'State',
            placeholder: 'California',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'zip',
            type: 'text',
            label: 'ZIP code',
            placeholder: '94101',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'country',
            type: 'combobox',
            label: 'Country',
            options: countries.map((c) => {
                return { display: c.name, value: c.code };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-6',
            name: 'phone',
            type: 'tel',
            label: 'Phone number',
            placeholder: '0000000000',
            prefix: {
                type: 'dynamic',
                displays: (() => {
                    const cacheMap: { [key: string]: string } = {};
                    countries.forEach((c) => {
                        cacheMap[c.code] = c.dial_code;
                    });
                    return cacheMap;
                })(),
                controlling: 'country',
            },
            validation: {
                required: true,
                pattern: /^([0-9]){6,14}$/,
            },
        },
    ],
    countries: [
        {
            className: 'col-span-6',
            name: 'country',
            type: 'multiselect',
            label: 'Country',
            options: countries.map((c) => {
                return { display: c.name, value: c.code };
            }),
            validation: { required: false },
        },
    ],
    clientFilters: [
        {
            className: 'col-span-6',
            name: 'companyAge',
            type: 'number',
            label: 'Minimum company age',
            validation: { required: false, min: 0, max: 100 },
        },
        {
            className: 'col-span-6',
            name: 'companyHeadcount',
            type: 'number',
            label: 'Minimum company headcount',
            validation: { required: false, min: 0, max: 1000 },
        },
        {
            className: 'col-span-6',
            name: 'industry',
            type: 'multiselect',
            label: 'Industries',
            options: [
                'Affiliate marketing networks',
                'Artificial intelligence and machine learning companies',
                'Cloud storage and hosting services',
                'Content marketing agencies',
                'Cryptocurrency and blockchain companies',
                'Customer relationship management (CRM) software vendors',
                'Cybersecurity software providers',
                'Data analytics and business intelligence firms',
                'Digital marketing agencies',
                'E-commerce platforms',
                'E-learning platforms and Learning Management Systems (LMS)',
                'E-sports and online gaming platforms',
                'Email marketing services',
                'Freelance marketplaces',
                'Graphic design services',
                'Influencer marketing platforms',
                'Internet of Things (IoT) providers',
                'Language learning platforms',
                'Mobile app development companies',
                'Online advertising platforms',
                'Online art and design marketplaces',
                'Online auction and marketplace platforms',
                'Online automotive parts and services',
                'Online beauty and skincare products',
                'Online course providers',
                'Online dating and matchmaking services',
                'Online food ordering and delivery platforms',
                'Online fundraising and crowdfunding platforms',
                'Online gardening and landscaping services',
                'Online gift and specialty product sales',
                'Online insurance providers',
                'Online job boards',
                'Online office supply and stationery sales',
                'Online payment processing companies',
                'Online recruitment and staffing agencies',
                'Online research and data collection firms',
                'Online specialty food and beverage sales',
                'Online streaming services and content providers',
                'Online survey and polling tools',
                'Online ticketing and event management platforms',
                'Online travel agencies and booking platforms',
                'Online tutoring services',
                'Podcasting and audio content platforms',
                'Project management software providers',
                'Remote baby and childcare product sales',
                'Remote book and eBook sales',
                'Remote car sales and leasing services',
                'Remote coaching and personal development services',
                'Remote customer support services',
                'Remote electronics and gadget sales',
                'Remote event planning services',
                'Remote fashion and clothing sales',
                'Remote financial services and banking platforms',
                'Remote healthcare and telemedicine services',
                'Remote home improvement and maintenance services',
                'Remote legal and consultation services',
                'Remote music and audio production services',
                'Remote pet care and product sales',
                'Remote photography and image editing services',
                'Remote public relations agencies',
                'Remote real estate services',
                'Remote sports and outdoor equipment sales',
                'Remote translation services',
                'Renewable energy technology firms',
                'Search engine optimization (SEO) companies',
                'Smart home technology vendors',
                'Social media management firms',
                'Software as a Service (SaaS) companies',
                'Subscription box services',
                'Telecommunications providers',
                'Video production companies',
                'Virtual and remote collaboration tools',
                'Virtual assistant and chatbot providers',
                'Virtual event platforms',
                'Virtual fitness and wellness platforms',
                'Virtual office space providers',
                'Virtual reality and augmented reality developers',
                'Web development agencies',
                'Webinar and video conferencing platforms',
                'Website analytics and monitoring services',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'lastActivity',
            type: 'select',
            label: 'Last activity',
            options: ['This week', 'This month'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
    ],
    changePassword: [
        {
            className: 'col-span-6',
            name: 'currentPassword',
            type: 'password',
            label: 'Current password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                pattern:
                    /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/,
            },
        },
        {
            className: 'col-span-3',
            name: 'newPassword',
            type: 'password',
            label: 'New password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                pattern:
                    /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/,
            },
        },
        {
            className: 'col-span-3',
            name: 'repeatPassword',
            type: 'password',
            label: 'Repeat password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                validate: (value: any, formValues: any) =>
                    formValues?.newPassword === value,
            },
        },
    ],
    listingBasics: [
        {
            className: 'col-span-6',
            name: 'title',
            type: 'text',
            label: 'Title',
            placeholder: 'Give your listing a title',
            validation: { required: true, minLength: 10, maxLength: 80 },
        },
        {
            className: 'col-span-6',
            name: 'description',
            type: 'textarea',
            label: 'Description',
            placeholder:
                'Write a few sentences about requirements, responsibilities, and benefits',
            validation: { required: true, minLength: 100, maxLength: 5000 },
        },
    ],
    listingInstructions: [
        {
            className: 'col-span-6',
            name: 'instructions',
            type: 'textarea',
            label: 'Application instructions (optional)',
            placeholder:
                'Provide information on how talent can apply to this listing',
            validation: { required: false, minLength: 100, maxLength: 5000 },
        },
        {
            className: 'col-span-6',
            name: 'calendarLink',
            type: 'text',
            label: 'Calendar link (optional)',
            placeholder:
                'Insert a link that talent you invite can use to schedule an interview',
            validation: { required: false },
        },
    ],
    listingRequirements: [
        {
            className: 'col-span-3',
            name: 'education',
            type: 'multiselect',
            label: 'Education',
            options: [
                'High school',
                'Some college',
                'Associate degree',
                "Bachelor's degree",
                "Master's degree",
                'Doctorate',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'yearsOfExperience',
            type: 'number',
            label: 'Years of experience',
            validation: { required: true, min: 0, max: 100 },
        },
        {
            className: 'col-span-3',
            name: 'industries',
            type: 'multiselect',
            label: 'Industries',
            options: [
                'Affiliate marketing networks',
                'Artificial intelligence and machine learning companies',
                'Cloud storage and hosting services',
                'Content marketing agencies',
                'Cryptocurrency and blockchain companies',
                'Customer relationship management (CRM) software vendors',
                'Cybersecurity software providers',
                'Data analytics and business intelligence firms',
                'Digital marketing agencies',
                'E-commerce platforms',
                'E-learning platforms and Learning Management Systems (LMS)',
                'E-sports and online gaming platforms',
                'Email marketing services',
                'Freelance marketplaces',
                'Graphic design services',
                'Influencer marketing platforms',
                'Internet of Things (IoT) providers',
                'Language learning platforms',
                'Mobile app development companies',
                'Online advertising platforms',
                'Online art and design marketplaces',
                'Online auction and marketplace platforms',
                'Online automotive parts and services',
                'Online beauty and skincare products',
                'Online course providers',
                'Online dating and matchmaking services',
                'Online food ordering and delivery platforms',
                'Online fundraising and crowdfunding platforms',
                'Online gardening and landscaping services',
                'Online gift and specialty product sales',
                'Online insurance providers',
                'Online job boards',
                'Online office supply and stationery sales',
                'Online payment processing companies',
                'Online recruitment and staffing agencies',
                'Online research and data collection firms',
                'Online specialty food and beverage sales',
                'Online streaming services and content providers',
                'Online survey and polling tools',
                'Online ticketing and event management platforms',
                'Online travel agencies and booking platforms',
                'Online tutoring services',
                'Podcasting and audio content platforms',
                'Project management software providers',
                'Remote baby and childcare product sales',
                'Remote book and eBook sales',
                'Remote car sales and leasing services',
                'Remote coaching and personal development services',
                'Remote customer support services',
                'Remote electronics and gadget sales',
                'Remote event planning services',
                'Remote fashion and clothing sales',
                'Remote financial services and banking platforms',
                'Remote healthcare and telemedicine services',
                'Remote home improvement and maintenance services',
                'Remote legal and consultation services',
                'Remote music and audio production services',
                'Remote pet care and product sales',
                'Remote photography and image editing services',
                'Remote public relations agencies',
                'Remote real estate services',
                'Remote sports and outdoor equipment sales',
                'Remote translation services',
                'Renewable energy technology firms',
                'Search engine optimization (SEO) companies',
                'Smart home technology vendors',
                'Social media management firms',
                'Software as a Service (SaaS) companies',
                'Subscription box services',
                'Telecommunications providers',
                'Video production companies',
                'Virtual and remote collaboration tools',
                'Virtual assistant and chatbot providers',
                'Virtual event platforms',
                'Virtual fitness and wellness platforms',
                'Virtual office space providers',
                'Virtual reality and augmented reality developers',
                'Web development agencies',
                'Webinar and video conferencing platforms',
                'Website analytics and monitoring services',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'salesRoles',
            type: 'multiselect',
            label: 'Roles',
            options: [
                'Appointment-setter',
                'SDR',
                'BDR',
                'Account executive',
                'Closer',
                'Sales management',
                'Executive',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'salesTypes',
            type: 'multiselect',
            label: 'Sales types',
            options: ['B2B', 'B2C', 'B2G'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'decisionMakers',
            type: 'multiselect',
            label: 'Decision-makers',
            options: ['Small business', 'C-suite', 'Consumer', 'Other'].map(
                (o: string) => {
                    return { value: o, display: o };
                }
            ),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'salesEnvironments',
            type: 'multiselect',
            label: 'Sales environments',
            options: [
                'In-person',
                'Phone',
                'Zoom / video conference',
                'Door-to-door',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'salesCycles',
            type: 'multiselect',
            label: 'Sales cycles',
            options: [
                '1 call',
                '1 week',
                '1 month',
                '6 months',
                '6 months+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'dealAmounts',
            type: 'multiselect',
            label: 'Average deal amounts',
            options: [
                '$0 - $5000',
                '$5000 - $20,000',
                '$20,000 - $50,000',
                '$50,000 - $100,000',
                '$100,000 - $500,000',
                '$500,000 - $1M',
                '$1M+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'salesVolumes',
            type: 'multiselect',
            label: 'Average annual sales volumes',
            options: [
                '$0 - $100,000',
                '$100,000 - $250,000',
                '$250,000 - $500,000',
                '$500,000 - $1M',
                '$1M - $2M',
                '$2M - $5M',
                '$5M+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'leadTypes',
            type: 'multiselect',
            label: 'Lead types',
            options: ['Inbound', 'Outbound'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'technologies',
            type: 'multiselect',
            label: 'Technologies',
            options: [
                'Google Drive',
                'Zoom',
                'Google Meet',
                'Google Calendar',
                'Powerpoint',
                'Keynote',
                'Canva',
                'Docusign',
                'Salesforce',
                'Hubspot',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
    ],
    listingDetails: [
        {
            className: 'col-span-3',
            name: 'salesRole',
            type: 'select',
            label: 'Role',
            options: [
                'Appointment-setter',
                'SDR',
                'BDR',
                'Account executive',
                'Closer',
                'Sales management',
                'Executive',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'commitment',
            type: 'select',
            label: 'Commitment',
            options: [
                'Full-time',
                'Part-time',
                'Temporary',
                'Internship',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'benefits',
            type: 'multiselect',
            label: 'Benefits',
            options: [
                'Health insurance',
                'Dental coverage',
                'Vision coverage',
                '401k',
                'Stock options',
                'None',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'compensationType',
            type: 'select',
            label: 'Compensation type',
            options: [
                'Salary',
                'Base + comission',
                'Comission-only',
                'Draw against comission',
                'Hourly',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'minimumCompensation',
            type: 'number',
            label: 'Minimum total annual compensation in USD',
            validation: { required: true, min: 0, max: 1000000 },
        },
    ],
    listingFilters: [
        {
            className: 'col-span-6',
            name: 'salesRoles',
            type: 'multiselect',
            label: 'Role',
            options: [
                'Appointment-setter',
                'SDR',
                'BDR',
                'Account executive',
                'Closer',
                'Sales management',
                'Executive',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'commitments',
            type: 'multiselect',
            label: 'Commitment',
            options: [
                'Full-time',
                'Part-time',
                'Temporary',
                'Internship',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'benefits',
            type: 'multiselect',
            label: 'Benefits',
            options: [
                'Health insurance',
                'Dental coverage',
                'Vision coverage',
                '401k',
                'Stock options',
                'None',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'compensationTypes',
            type: 'multiselect',
            label: 'Compensation type',
            options: [
                'Salary',
                'Base + comission',
                'Comission-only',
                'Draw against comission',
                'Hourly',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'minimumCompensation',
            type: 'number',
            label: 'Minimum total annual compensation in USD',
            validation: { required: false, min: 0, max: 1000000 },
        },
        {
            className: 'col-span-6',
            name: 'lastActivity',
            type: 'select',
            label: 'Last activity',
            options: ['This week', 'This month'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
    ],
    talentFilters: [
        {
            className: 'col-span-6',
            name: 'education',
            type: 'multiselect',
            label: 'Education',
            options: [
                'High school',
                'Some college',
                'Associate degree',
                "Bachelor's degree",
                "Master's degree",
                'Doctorate',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'yearsOfExperience',
            type: 'number',
            label: 'Years of experience',
            validation: { required: false, min: 0, max: 100 },
        },
        {
            className: 'col-span-6',
            name: 'industries',
            type: 'multiselect',
            label: 'Industries',
            options: [
                'Affiliate marketing networks',
                'Artificial intelligence and machine learning companies',
                'Cloud storage and hosting services',
                'Content marketing agencies',
                'Cryptocurrency and blockchain companies',
                'Customer relationship management (CRM) software vendors',
                'Cybersecurity software providers',
                'Data analytics and business intelligence firms',
                'Digital marketing agencies',
                'E-commerce platforms',
                'E-learning platforms and Learning Management Systems (LMS)',
                'E-sports and online gaming platforms',
                'Email marketing services',
                'Freelance marketplaces',
                'Graphic design services',
                'Influencer marketing platforms',
                'Internet of Things (IoT) providers',
                'Language learning platforms',
                'Mobile app development companies',
                'Online advertising platforms',
                'Online art and design marketplaces',
                'Online auction and marketplace platforms',
                'Online automotive parts and services',
                'Online beauty and skincare products',
                'Online course providers',
                'Online dating and matchmaking services',
                'Online food ordering and delivery platforms',
                'Online fundraising and crowdfunding platforms',
                'Online gardening and landscaping services',
                'Online gift and specialty product sales',
                'Online insurance providers',
                'Online job boards',
                'Online office supply and stationery sales',
                'Online payment processing companies',
                'Online recruitment and staffing agencies',
                'Online research and data collection firms',
                'Online specialty food and beverage sales',
                'Online streaming services and content providers',
                'Online survey and polling tools',
                'Online ticketing and event management platforms',
                'Online travel agencies and booking platforms',
                'Online tutoring services',
                'Podcasting and audio content platforms',
                'Project management software providers',
                'Remote baby and childcare product sales',
                'Remote book and eBook sales',
                'Remote car sales and leasing services',
                'Remote coaching and personal development services',
                'Remote customer support services',
                'Remote electronics and gadget sales',
                'Remote event planning services',
                'Remote fashion and clothing sales',
                'Remote financial services and banking platforms',
                'Remote healthcare and telemedicine services',
                'Remote home improvement and maintenance services',
                'Remote legal and consultation services',
                'Remote music and audio production services',
                'Remote pet care and product sales',
                'Remote photography and image editing services',
                'Remote public relations agencies',
                'Remote real estate services',
                'Remote sports and outdoor equipment sales',
                'Remote translation services',
                'Renewable energy technology firms',
                'Search engine optimization (SEO) companies',
                'Smart home technology vendors',
                'Social media management firms',
                'Software as a Service (SaaS) companies',
                'Subscription box services',
                'Telecommunications providers',
                'Video production companies',
                'Virtual and remote collaboration tools',
                'Virtual assistant and chatbot providers',
                'Virtual event platforms',
                'Virtual fitness and wellness platforms',
                'Virtual office space providers',
                'Virtual reality and augmented reality developers',
                'Web development agencies',
                'Webinar and video conferencing platforms',
                'Website analytics and monitoring services',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'salesRoles',
            type: 'multiselect',
            label: 'Roles',
            options: [
                'Appointment-setter',
                'SDR',
                'BDR',
                'Account executive',
                'Closer',
                'Sales management',
                'Executive',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'salesTypes',
            type: 'multiselect',
            label: 'Sales types',
            options: ['B2B', 'B2C', 'B2G'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'decisionMakers',
            type: 'multiselect',
            label: 'Decision-makers',
            options: ['Small business', 'C-suite', 'Consumer', 'Other'].map(
                (o: string) => {
                    return { value: o, display: o };
                }
            ),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'salesEnvironments',
            type: 'multiselect',
            label: 'Sales environments',
            options: [
                'In-person',
                'Phone',
                'Zoom / video conference',
                'Door-to-door',
                'Other',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'salesCycles',
            type: 'multiselect',
            label: 'Sales cycles',
            options: [
                '1 call',
                '1 week',
                '1 month',
                '6 months',
                '6 months+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'dealAmounts',
            type: 'multiselect',
            label: 'Average deal amounts',
            options: [
                '$0 - $5000',
                '$5000 - $20,000',
                '$20,000 - $50,000',
                '$50,000 - $100,000',
                '$100,000 - $500,000',
                '$500,000 - $1M',
                '$1M+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'salesVolumes',
            type: 'multiselect',
            label: 'Average annual sales volumes',
            options: [
                '$0 - $100,000',
                '$100,000 - $250,000',
                '$250,000 - $500,000',
                '$500,000 - $1M',
                '$1M - $2M',
                '$2M - $5M',
                '$5M+',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'leadTypes',
            type: 'multiselect',
            label: 'Lead types',
            options: ['Inbound', 'Outbound'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'technologies',
            type: 'multiselect',
            label: 'Technologies',
            options: [
                'Google Drive',
                'Zoom',
                'Google Meet',
                'Google Calendar',
                'Powerpoint',
                'Keynote',
                'Canva',
                'Docusign',
                'Salesforce',
                'Hubspot',
            ].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
        {
            className: 'col-span-6',
            name: 'lastActivity',
            type: 'select',
            label: 'Last activity',
            options: ['This week', 'This month'].map((o: string) => {
                return { value: o, display: o };
            }),
            validation: { required: false },
        },
    ],
    adminRegister: [
        {
            className: 'col-span-3',
            name: 'accountType',
            type: 'select',
            label: 'Account type',
            options: [
                { value: 'talent', display: 'Talent' },
                { value: 'client', display: 'Client' },
                { value: 'administrator', display: 'Administrator' },
            ],
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'creationReference',
            type: 'text',
            label: 'Reference',
            validation: { required: true },
        },
        {
            className: 'col-span-6',
            name: 'email',
            type: 'email',
            label: 'Email',
            placeholder: 'john@doe.com',
            validation: { required: true },
        },
        {
            className: 'col-span-3',
            name: 'firstName',
            type: 'text',
            label: 'First name',
            placeholder: 'John',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'lastName',
            type: 'text',
            label: 'Last name',
            placeholder: 'Doe',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-6',
            name: 'companyName',
            type: 'text',
            label: 'Company name',
            placeholder: 'Doe & Co.',
            validation: { required: false, minLength: 2, maxLength: 100 },
        },
        {
            className: 'col-span-3',
            name: 'city',
            type: 'text',
            label: 'City',
            placeholder: 'San Francisco',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'state',
            type: 'text',
            label: 'State',
            placeholder: 'California',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'zip',
            type: 'text',
            label: 'ZIP code',
            placeholder: '94101',
            validation: { required: true, minLength: 2 },
        },
        {
            className: 'col-span-3',
            name: 'country',
            type: 'combobox',
            label: 'Country',
            // placeholder: 'US',
            options: countries.map((c) => {
                return { display: c.name, value: c.code };
            }),
            validation: { required: true },
        },
        {
            className: 'col-span-6',
            name: 'phone',
            type: 'tel',
            label: 'Phone number',
            placeholder: '0000000000',
            prefix: {
                type: 'dynamic',
                displays: (() => {
                    const cacheMap: { [key: string]: string } = {};
                    countries.forEach((c) => {
                        cacheMap[c.code] = c.dial_code;
                    });
                    return cacheMap;
                })(),
                controlling: 'country',
            },
            validation: {
                required: true,
                pattern: /^([0-9]){6,14}$/,
            },
        },
    ],
    listingApplication: [
        {
            className: 'col-span-6',
            name: 'applicationMessage',
            type: 'textarea',
            label: 'Application message',
            placeholder:
                'Send a short message alongside your application (optional)',
            validation: { required: false, minLength: 1, maxLength: 400 },
        },
    ],
    deleteAccount: [
        {
            className: 'col-span-6',
            name: 'deleteConfirmation',
            type: 'text',
            label: 'Delete confirmation',
            placeholder: '',
            validation: {
                required: true,
                validate: (_: any, formValues: any) =>
                    formValues?.deleteConfirmation === DELETE_CONFIRM_MESSAGE,
            },
        },
    ],
    deleteAccountByAdmin: [
        {
            className: 'col-span-6',
            name: 'deleteConfirmation',
            type: 'text',
            label: 'Delete confirmation',
            placeholder: '',
            validation: {
                required: true,
                validate: (_: any, formValues: any) =>
                    formValues?.deleteConfirmation ===
                    DELETE_CONFIRM_MESSAGE_ADMIN,
            },
        },
    ],
    adminChangePassword: [
        {
            className: 'col-span-3',
            name: 'password',
            type: 'password',
            label: 'Password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                pattern:
                    /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/,
            },
        },
        {
            className: 'col-span-3',
            name: 'repeatPassword',
            type: 'password',
            label: 'Repeat password',
            placeholder:
                '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
            validation: {
                required: true,
                validate: (value: any, formValues: any) =>
                    formValues?.password === value,
            },
        },
    ],
    addCommission: [
        {
            className: 'col-span-6',
            name: 'revenue',
            type: 'number',
            label: 'Revenue in USD cents (ex: 100 = $1.00)',
            validation: { required: true, min: 1, valueAsNumber: true },
        },
        {
            className: 'col-span-6',
            name: 'commission',
            type: 'number',
            label: 'Commission in USD cents (ex: 100 = $1.00)',
            validation: { required: true, min: 1, valueAsNumber: true },
        },
    ],
};

const get = (name: keyof typeof forms) => {
    return forms[name];
};
export { forms, get };
