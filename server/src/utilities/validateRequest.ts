import Joi from 'joi';
import { Request, Response, NextFunction } from 'express';

const schemas = {
    register: Joi.object({
        accountType: Joi.string().valid('talent', 'client').required(),
        email: Joi.string().email().case('lower').required(),
        password: Joi.string()
            .pattern(
                /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/
            )
            .required(),
        repeatPassword: Joi.ref('password'),
        firstName: Joi.string().min(2).required(),
        lastName: Joi.string().min(2).required(),
        country: Joi.string().min(2).max(2).required(),
        city: Joi.string().min(2).required(),
        state: Joi.string().min(2).required(),
        zip: Joi.string().min(2).required(),
        phone: Joi.string()
            .regex(/^\+(?:[0-9] ?){6,14}[0-9]$/)
            .required(),
        creationReference: Joi.string().required(),
        companyName: Joi.string().min(2).max(100),
        affiliateCode: Joi.string(),
    }),
    login: Joi.object({
        email: Joi.string().email().case('lower').required(),
        password: Joi.string()
            .pattern(
                /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/
            )
            .required(),
        userTimeZone: Joi.string(),
    }),
    verifyEmail: Joi.object({
        code: Joi.string().required(),
        id: Joi.string().required(),
    }),
    forgotPassword: Joi.object({
        email: Joi.string().email().case('lower').required(),
    }),
    resetPassword: Joi.object({
        id: Joi.string().required(),
        code: Joi.string().required(),
        password: Joi.string()
            .pattern(
                /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/
            )
            .required(),
        repeatPassword: Joi.ref('password'),
    }),
    changePassword: Joi.object({
        currentPassword: Joi.string()
            .pattern(
                /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/
            )
            .required(),
        newPassword: Joi.string()
            .pattern(
                /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/
            )
            .required(),
        repeatPassword: Joi.ref('newPassword'),
    }),
    deleteTalent: Joi.object({
        id: Joi.string().required(),
    }),
    patchTalent: Joi.object({
        profile: Joi.object({
            photoUrl: Joi.string(),
            videoUrl: Joi.string(),
            headline: Joi.string().min(10).max(80),
            about: Joi.string().min(100).max(5000),
        }),
        experience: Joi.object({
            education: Joi.string().valid(
                'High school',
                'Some college',
                'Associate degree',
                "Bachelor's degree",
                "Master's degree",
                'Doctorate'
            ),
            yearsOfExperience: Joi.number().min(0).max(100),
            industries: Joi.array().items(
                Joi.string().valid(
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
                    'Other'
                )
            ),
            salesRoles: Joi.array().items(
                Joi.string().valid(
                    'Appointment-setter',
                    'SDR',
                    'BDR',
                    'Account executive',
                    'Closer',
                    'Sales management',
                    'Executive',
                    'Other'
                )
            ),
            salesTypes: Joi.array().items(
                Joi.string().valid('B2B', 'B2C', 'B2G')
            ),
            decisionMakers: Joi.array().items(
                Joi.string().valid(
                    'Small business',
                    'C-suite',
                    'Consumer',
                    'Other'
                )
            ),
            salesEnvironments: Joi.array().items(
                Joi.string().valid(
                    'In-person',
                    'Phone',
                    'Zoom / video conference',
                    'Door-to-door',
                    'Other'
                )
            ),
            salesCycles: Joi.array().items(
                Joi.string().valid(
                    '1 call',
                    '1 week',
                    '1 month',
                    '6 months',
                    '6 months+'
                )
            ),
            dealAmounts: Joi.array().items(
                Joi.string().valid(
                    '$0 - $5000',
                    '$5000 - $20,000',
                    '$20,000 - $50,000',
                    '$50,000 - $100,000',
                    '$100,000 - $500,000',
                    '$500,000 - $1M',
                    '$1M+'
                )
            ),
            salesVolumes: Joi.array().items(
                Joi.string().valid(
                    '$0 - $100,000',
                    '$100,000 - $250,000',
                    '$250,000 - $500,000',
                    '$500,000 - $1M',
                    '$1M - $2M',
                    '$2M - $5M',
                    '$5M+'
                )
            ),
            leadTypes: Joi.array().items(
                Joi.string().valid('Inbound', 'Outbound')
            ),
            technologies: Joi.array().items(
                Joi.string().valid(
                    'Google Drive',
                    'Zoom',
                    'Google Meet',
                    'Google Calendar',
                    'Powerpoint',
                    'Keynote',
                    'Canva',
                    'Docusign',
                    'Salesforce',
                    'Hubspot'
                )
            ),
        }),
        goals: Joi.object({
            companyAge: Joi.number().min(0).max(100),
            companyHeadcount: Joi.number().min(0).max(1000),
            industries: Joi.array().items(
                Joi.string().valid(
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
                    'Other'
                )
            ),
            salesRoles: Joi.array().items(
                Joi.string().valid(
                    'Appointment-setter',
                    'SDR',
                    'BDR',
                    'Account executive',
                    'Closer',
                    'Sales management',
                    'Executive',
                    'Other'
                )
            ),
            commitment: Joi.array().items(
                Joi.string().valid(
                    'Full-time',
                    'Part-time',
                    'Temporary',
                    'Internship',
                    'Other'
                )
            ),
            benefits: Joi.array().items(
                Joi.string().valid(
                    'Health insurance',
                    'Dental coverage',
                    'Vision coverage',
                    '401k',
                    'Stock options',
                    'None'
                )
            ),
            compensationTypes: Joi.array().items(
                Joi.string().valid(
                    'Salary',
                    'Base + comission',
                    'Comission-only',
                    'Draw against comission',
                    'Hourly'
                )
            ),
            minimumCompensation: Joi.number().min(0).max(1000000),
        }),
        files: Joi.object({
            resume: Joi.string(),
        }),
        onboardingComplete: Joi.boolean(),
    }),
    patchClient: Joi.object({
        profile: Joi.object({
            photoUrl: Joi.string(),
            companyAge: Joi.number().min(0).max(100),
            companyHeadcount: Joi.number().min(0).max(1000),
            industry: Joi.string().valid(
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
                'Other'
            ),
        }),
        onboardingComplete: Joi.boolean(),
    }),
    changeEmailRequest: Joi.object({
        email: Joi.string().email().case('lower').required(),
    }),
    changeEmail: Joi.object({
        id: Joi.string().required(),
        code: Joi.string().required(),
        email: Joi.string().email().case('lower').required(),
    }),
    editContact: Joi.object({
        firstName: Joi.string().min(2).required(),
        lastName: Joi.string().min(2).required(),
        country: Joi.string().min(2).max(2).required(),
        city: Joi.string().min(2).required(),
        state: Joi.string().min(2).required(),
        zip: Joi.string().min(2).required(),
        phone: Joi.string()
            .regex(/^\+(?:[0-9] ?){6,14}[0-9]$/)
            .required(),
        companyName: Joi.string().min(2).max(100),
    }),
    createListing: Joi.object({
        basics: Joi.object({
            title: Joi.string().min(10).max(80).required(),
            description: Joi.string().min(100).max(5000).required(),
        }).required(),
        instructions: Joi.object({
            instructions: Joi.string().allow('').min(100).max(5000),
            calendarLink: Joi.string().allow(''),
        }),
        details: Joi.object({
            salesRole: Joi.string()
                .valid(
                    'Appointment-setter',
                    'SDR',
                    'BDR',
                    'Account executive',
                    'Closer',
                    'Sales management',
                    'Executive',
                    'Other'
                )
                .required(),
            commitment: Joi.string()
                .valid(
                    'Full-time',
                    'Part-time',
                    'Temporary',
                    'Internship',
                    'Other'
                )
                .required(),
            benefits: Joi.array()
                .items(
                    Joi.string().valid(
                        'Health insurance',
                        'Dental coverage',
                        'Vision coverage',
                        '401k',
                        'Stock options',
                        'None'
                    )
                )
                .required(),
            compensationType: Joi.string()
                .valid(
                    'Salary',
                    'Base + comission',
                    'Comission-only',
                    'Draw against comission',
                    'Hourly'
                )
                .required(),
            minimumCompensation: Joi.number().min(0).max(1000000),
        }).required(),
        requirements: Joi.object({
            education: Joi.array()
                .items(
                    Joi.string().valid(
                        'High school',
                        'Some college',
                        'Associate degree',
                        "Bachelor's degree",
                        "Master's degree",
                        'Doctorate'
                    )
                )
                .required(),
            yearsOfExperience: Joi.number().min(0).max(100).required(),
            industries: Joi.array()
                .items(
                    Joi.string().valid(
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
                        'Other'
                    )
                )
                .required(),
            salesRoles: Joi.array()
                .items(
                    Joi.string().valid(
                        'Appointment-setter',
                        'SDR',
                        'BDR',
                        'Account executive',
                        'Closer',
                        'Sales management',
                        'Executive',
                        'Other'
                    )
                )
                .required(),
            salesTypes: Joi.array()
                .items(Joi.string().valid('B2B', 'B2C', 'B2G'))
                .required(),
            decisionMakers: Joi.array()
                .items(
                    Joi.string().valid(
                        'Small business',
                        'C-suite',
                        'Consumer',
                        'Other'
                    )
                )
                .required(),
            salesEnvironments: Joi.array()
                .items(
                    Joi.string().valid(
                        'In-person',
                        'Phone',
                        'Zoom / video conference',
                        'Door-to-door',
                        'Other'
                    )
                )
                .required(),
            salesCycles: Joi.array()
                .items(
                    Joi.string().valid(
                        '1 call',
                        '1 week',
                        '1 month',
                        '6 months',
                        '6 months+'
                    )
                )
                .required(),
            dealAmounts: Joi.array()
                .items(
                    Joi.string().valid(
                        '$0 - $5000',
                        '$5000 - $20,000',
                        '$20,000 - $50,000',
                        '$50,000 - $100,000',
                        '$100,000 - $500,000',
                        '$500,000 - $1M',
                        '$1M+'
                    )
                )
                .required(),
            salesVolumes: Joi.array()
                .items(
                    Joi.string().valid(
                        '$0 - $100,000',
                        '$100,000 - $250,000',
                        '$250,000 - $500,000',
                        '$500,000 - $1M',
                        '$1M - $2M',
                        '$2M - $5M',
                        '$5M+'
                    )
                )
                .required(),
            leadTypes: Joi.array()
                .items(Joi.string().valid('Inbound', 'Outbound'))
                .required(),
            technologies: Joi.array()
                .items(
                    Joi.string().valid(
                        'Google Drive',
                        'Zoom',
                        'Google Meet',
                        'Google Calendar',
                        'Powerpoint',
                        'Keynote',
                        'Canva',
                        'Docusign',
                        'Salesforce',
                        'Hubspot'
                    )
                )
                .required(),
        }).required(),
    }),
    patchListing: Joi.object({
        basics: Joi.object({
            title: Joi.string().min(10).max(80).required(),
            description: Joi.string().min(100).max(5000).required(),
        }),
        instructions: Joi.object({
            instructions: Joi.string().allow('').min(100).max(5000),
            calendarLink: Joi.string().allow(''),
        }),
        details: Joi.object({
            salesRole: Joi.string()
                .valid(
                    'Appointment-setter',
                    'SDR',
                    'BDR',
                    'Account executive',
                    'Closer',
                    'Sales management',
                    'Executive',
                    'Other'
                )
                .required(),
            commitment: Joi.string()
                .valid(
                    'Full-time',
                    'Part-time',
                    'Temporary',
                    'Internship',
                    'Other'
                )
                .required(),
            benefits: Joi.array()
                .items(
                    Joi.string().valid(
                        'Health insurance',
                        'Dental coverage',
                        'Vision coverage',
                        '401k',
                        'Stock options',
                        'None'
                    )
                )
                .required(),
            compensationType: Joi.string()
                .valid(
                    'Salary',
                    'Base + comission',
                    'Comission-only',
                    'Draw against comission',
                    'Hourly'
                )
                .required(),
            minimumCompensation: Joi.number().min(0).max(1000000),
        }),
        requirements: Joi.object({
            education: Joi.array()
                .items(
                    Joi.string().valid(
                        'High school',
                        'Some college',
                        'Associate degree',
                        "Bachelor's degree",
                        "Master's degree",
                        'Doctorate'
                    )
                )
                .required(),
            yearsOfExperience: Joi.number().min(0).max(100).required(),
            industries: Joi.array()
                .items(
                    Joi.string().valid(
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
                        'Other'
                    )
                )
                .required(),
            salesRoles: Joi.array()
                .items(
                    Joi.string().valid(
                        'Appointment-setter',
                        'SDR',
                        'BDR',
                        'Account executive',
                        'Closer',
                        'Sales management',
                        'Executive',
                        'Other'
                    )
                )
                .required(),
            salesTypes: Joi.array()
                .items(Joi.string().valid('B2B', 'B2C', 'B2G'))
                .required(),
            decisionMakers: Joi.array()
                .items(
                    Joi.string().valid(
                        'Small business',
                        'C-suite',
                        'Consumer',
                        'Other'
                    )
                )
                .required(),
            salesEnvironments: Joi.array()
                .items(
                    Joi.string().valid(
                        'In-person',
                        'Phone',
                        'Zoom / video conference',
                        'Door-to-door',
                        'Other'
                    )
                )
                .required(),
            salesCycles: Joi.array()
                .items(
                    Joi.string().valid(
                        '1 call',
                        '1 week',
                        '1 month',
                        '6 months',
                        '6 months+'
                    )
                )
                .required(),
            dealAmounts: Joi.array()
                .items(
                    Joi.string().valid(
                        '$0 - $5000',
                        '$5000 - $20,000',
                        '$20,000 - $50,000',
                        '$50,000 - $100,000',
                        '$100,000 - $500,000',
                        '$500,000 - $1M',
                        '$1M+'
                    )
                )
                .required(),
            salesVolumes: Joi.array()
                .items(
                    Joi.string().valid(
                        '$0 - $100,000',
                        '$100,000 - $250,000',
                        '$250,000 - $500,000',
                        '$500,000 - $1M',
                        '$1M - $2M',
                        '$2M - $5M',
                        '$5M+'
                    )
                )
                .required(),
            leadTypes: Joi.array()
                .items(Joi.string().valid('Inbound', 'Outbound'))
                .required(),
            technologies: Joi.array()
                .items(
                    Joi.string().valid(
                        'Google Drive',
                        'Zoom',
                        'Google Meet',
                        'Google Calendar',
                        'Powerpoint',
                        'Keynote',
                        'Canva',
                        'Docusign',
                        'Salesforce',
                        'Hubspot'
                    )
                )
                .required(),
        }),
    }),
    listingApplication: Joi.object({
        listingId: Joi.string().required(),
        applicationMessage: Joi.string(),
    }),
    bookmarkClient: Joi.object({
        clientId: Joi.string().required(),
        bookmarked: Joi.boolean().required(),
    }),
    bookmarkListing: Joi.object({
        listingId: Joi.string().required(),
        bookmarked: Joi.boolean().required(),
    }),
    bookmarkTalent: Joi.object({
        talentId: Joi.string().required(),
        bookmarked: Joi.boolean().required(),
    }),
    patchApplication: Joi.object({
        talentId: Joi.string().required(),
        applicationStatus: Joi.string().valid(
            'invited',
            'applied',
            'interviewing',
            'shortlisted',
            'hired'
        ),
        applicationRating: Joi.number().integer().valid(-1, 0, 1),
    }),
    postApplication: Joi.object({
        talentId: Joi.string().required(),
    }),
    createChat: Joi.object({
        target: Joi.string().required(),
    }),
    getChatMessages: Joi.object({
        chatId: Joi.string().required(),
    }),
    sendMessage: Joi.object({
        message: Joi.string().max(5000).required(),
    }),
    editMessage: Joi.object({
        message: Joi.string().max(5000).required(),
    }),
    adminPatchUser: Joi.object({
        accountType: Joi.string().valid('talent', 'client', 'administrator'),
        authority: Joi.number().valid(99, 100, 101, 200, 201),
        administratorNote: Joi.string().allow(''),
        administratorTags: Joi.array().min(0),
        privilegedAccount: Joi.boolean(),
    }),
    adminRegister: Joi.object({
        accountType: Joi.string()
            .valid('talent', 'client', 'administrator')
            .required(),
        creationReference: Joi.string().required(),
        email: Joi.string().email().case('lower').required(),
        firstName: Joi.string().min(2).required(),
        lastName: Joi.string().min(2).required(),
        country: Joi.string().min(2).max(2).required(),
        city: Joi.string().min(2).required(),
        state: Joi.string().min(2).required(),
        zip: Joi.string().min(2).required(),
        phone: Joi.string()
            .regex(/^\+(?:[0-9] ?){6,14}[0-9]$/)
            .required(),
        companyName: Joi.string().min(2).max(100),
    }),
    verifyPayment: Joi.object({
        sessionId: Joi.string().required(),
        product: Joi.string().valid('listing', 'access').required(),
        userId: Joi.string().required(),
        listingId: Joi.string().when('product', {
            is: 'listing',
            then: Joi.required(),
            otherwise: Joi.forbidden(),
        }),
    }),
    vapid: Joi.object({
        userId: Joi.string().required(),
        endpoint: Joi.string().required(),
        keys: Joi.object({
            p256dh: Joi.string().required(),
            auth: Joi.string().required(),
        }),
    }),
    adminResetPassword: Joi.object({
        password: Joi.string()
            .pattern(
                /^(?:(?=.*[a-z])(?:(?=.*[A-Z])(?=.*[\d\W])|(?=.*\W)(?=.*\d))|(?=.*\W)(?=.*[A-Z])(?=.*\d)).{8,}$/
            )
            .required(),
        repeatPassword: Joi.ref('password'),
    }),
    patchAffiliate: Joi.object({
        affiliateAccess: Joi.string().valid('active', 'suspended'),
        revenue: Joi.number(),
        commission: Joi.number(),
    }),
    bulkBookmark: Joi.object({
        talentIds: Joi.array().items(Joi.string()).min(1).required(),
    }),
    patchVisibility: Joi.object({ visibility: Joi.boolean().required() }),
};

export default async function validateRequest(
    req: Request,
    res: Response,
    next: NextFunction,
    schemaName: keyof typeof schemas
) {
    try {
        await schemas[schemaName].validateAsync(req.body);
        next();
    } catch (err) {
        next({ status: 400, message: err.message });
    }
}
