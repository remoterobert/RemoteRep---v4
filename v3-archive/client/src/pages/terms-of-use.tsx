import type { NextPage } from 'next';

const TermsOfUse: NextPage = () => {
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

                    <h3 className="mt-2 font-bold text-2xl">Terms of Use</h3>

                    <p className="mt-2 text-md">
                        Welcome to RemoteRep.com ("we," "us," or
                        "RemoteRep.com"). These Terms of Use ("Terms") govern
                        your use of our job board platform and its services. By
                        accessing or using our platform, you agree to abide by
                        these Terms. If you do not agree with these Terms,
                        please refrain from using our services.
                    </p>
                    <p className="mt-2 text-md">
                        <b>User Accounts</b> <br /> 1. Account Creation: To
                        access certain features of our platform, you may need to
                        create a user account. You are responsible for providing
                        accurate and complete information during the
                        registration process.
                        <br />
                        2. Account Security: You are responsible for maintaining
                        the confidentiality of your account information,
                        including your username and password. You agree to
                        notify us immediately of any unauthorized use of your
                        account.
                    </p>
                    <p className="mt-2 text-md">
                        <b>User Conduct</b> <br /> 1. Prohibited Activities: You
                        agree not to engage in any activities that violate these
                        Terms, infringe upon our rights or the rights of others,
                        or are illegal. <br /> 2. Content Submission: Any
                        content you submit, including profile information and
                        communications, must be accurate, lawful, and not
                        violate any third-party rights.
                    </p>
                    <p className="mt-2 text-md">
                        <b>Privacy</b> <br />
                        Your use of our platform is also governed by our Privacy
                        Policy. By using our services, you consent to the
                        collection, use, and sharing of your information as
                        described in the Privacy Policy.
                    </p>
                    <p className="mt-2 text-md">
                        <b>Intellectual Property</b> <br /> 1. Platform Content:
                        All content on our platform, including text, graphics,
                        logos, and images, is our property or licensed to us and
                        is protected by intellectual property laws. <br /> 2.
                        User Content: By submitting content to our platform, you
                        grant us a non-exclusive, worldwide, royalty-free
                        license to use, reproduce, and distribute that content.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Third-Party Links and Services</b>
                        <br />
                        Our platform may contain links to third-party websites
                        or services. We do not endorse or control these
                        third-party sites and are not responsible for their
                        content or practices.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Limitation of Liability</b>
                        <br />
                        We strive to provide accurate and up-to-date
                        information, but we make no warranties or
                        representations regarding the accuracy or completeness
                        of our platform's content. Your use of our services is
                        at your own risk.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Termination</b>
                        <br />
                        We reserve the right to terminate or suspend your
                        account and access to our platform at our sole
                        discretion, without prior notice.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Changes to the Terms</b>
                        <br />
                        We may update these Terms from time to time. Any changes
                        will be effective upon posting the revised Terms on our
                        website.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Governing Law</b>
                        <br />
                        These Terms are governed by and construed in accordance
                        with the laws of the State of Georgia. Any disputes
                        arising out of these Terms or your use of our services
                        will be subject to the exclusive jurisdiction of the
                        courts of the State of Georgia.
                    </p>

                    <p className="mt-2 text-md">
                        <b>Contact Us</b>
                        <br />
                        If you have any questions about these Terms, please
                        contact us at support@remoterep.com.
                    </p>
                </div>
            </div>
        </>
    );
};

export default TermsOfUse;
