import type { NextPage } from 'next';

const PrivacyPolicy: NextPage = () => {
    return (
        <>
            <div className="shadow-lg w-full h-16 py-4 px-8">
                <img
                    className="absolute w-auto h-8"
                    src="/white-logo-with-text.svg"
                />
            </div>

            <img
                className="absolute inset-0 h-full w-full object-cover filter blur-xs -z-10"
                src="/sign-up-background.jpg"
            />

            <div className="flex items-center justify-center h-full w-full overflow-clip -mt-16">
                <div className="absolute bg-white shadow-xl rounded-xl w-[80vw] h-[80vh] overflow-x-auto p-8">
                    <span className="text-xs">Last updated: 8/15/2023</span>

                    <h3 className="mt-2 font-bold text-2xl">Privacy Policy</h3>

                    <p className="mt-2 text-md">
                        RemoteRep.com ("we," "us," or "RemoteRep.com") is
                        committed to protecting your privacy and ensuring the
                        security of your personal information. This Privacy
                        Policy outlines how we collect, use, share, and protect
                        the information you provide when using our job board
                        platform.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Information We Collect</b> <br /> When you use our
                        job board, we may collect the following types of
                        information: <br /> 1. Personal Information: This
                        includes your name, contact details, and other
                        information you provide while creating or updating your
                        profile.
                        <br />
                        2. Professional Information: Information related to your
                        education, work experience, skills, and other details
                        relevant to potential employers.
                        <br />
                        3. Communication Data: Information you provide when
                        communicating with us, such as through contact forms,
                        emails, or customer support inquiries.
                    </p>

                    <p className="mt-2 text-md">
                        <b>How We Use Your Information</b>
                        <br />
                        We use the information collected for the following
                        purposes:
                        <br /> 1. Job Matching: We use your profile information
                        to match you with suitable job opportunities and
                        employers. <br /> 2. Network Sharing: With your explicit
                        consent, as indicated by checking the designated
                        checkbox, we may share your profile and personal
                        information with our trusted network of partners,
                        employers, and industry contacts. This aims to enhance
                        collaboration and increase your job prospects. <br /> 3.
                        Communication: We may use your information to
                        communicate with you regarding job opportunities,
                        updates, and other relevant information. <br /> 4.
                        Improvement: We analyze user data to improve our
                        platform's functionality, user experience, and the
                        effectiveness of our services. Data Sharing and Security
                    </p>

                    <p className="mt-2 text-md">
                        <b>Data Sharing and Security</b>
                        <br />
                        We take the security of your information seriously. We
                        will not share your personal information without your
                        consent except in the following cases:
                        <br /> 1. Consent: When you explicitly consent to
                        sharing your profile and personal information with our
                        network. <br /> 2. Legal Obligations: If required by
                        law, we may share your information to comply with legal
                        processes. <br /> 3. Service Providers: We may engage
                        trusted third-party service providers to assist us in
                        delivering our services, subject to strict data
                        protection standards.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Your Choices</b>
                        <br />
                        You can update your profile information and
                        communication preferences at any time.
                        <br /> You can withdraw your consent for sharing your
                        information with our network by updating your
                        preferences. <br /> You can opt-out of receiving
                        promotional communications from us.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Data Retention</b>
                        <br />
                        We will retain your personal information for as long as
                        necessary to fulfill the purposes outlined in this
                        policy and as required by law.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Changes to this Privacy Policy</b>
                        <br />
                        We may update this Privacy Policy from time to time. Any
                        changes will be effective upon posting the revised
                        policy on our website.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Contact Us</b>
                        <br />
                        If you have any questions about this Privacy Policy or
                        our data practices, please contact us at
                        support@remoterep.com.
                    </p>
                </div>
            </div>
        </>
    );
};

export default PrivacyPolicy;
