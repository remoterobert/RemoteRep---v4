import '../styles/globals.css';
import type { AppProps } from 'next/app';
import Layout from 'components/layouts';
import AuthContainer from 'components/containers/authContainer';
import OnboardingContainer from 'components/containers/onboardingContainer';
import AppContainer from 'components/containers/appContainer';
import ImpersonationContainer from 'components/containers/impersonationContainer';
import Head from 'next/head';
import NotificationsContainer from 'components/containers/notificationsContainer';
import { NotificationProvider } from 'contexts/NotificationContext';
import HotjarContainer from 'components/containers/hotjarContainer';

export default function App({ Component, pageProps }: AppProps) {
    return (
        <>
            <Head>
                <title>RemoteRep.com</title>
            </Head>
            <HotjarContainer>
                <NotificationProvider>
                    <ImpersonationContainer>
                        <AuthContainer>
                            <OnboardingContainer>
                                <AppContainer>
                                    <NotificationsContainer>
                                        <Layout>
                                            <Component {...pageProps} />
                                        </Layout>
                                    </NotificationsContainer>
                                </AppContainer>
                            </OnboardingContainer>
                        </AuthContainer>
                    </ImpersonationContainer>
                </NotificationProvider>
            </HotjarContainer>
        </>
    );
}
