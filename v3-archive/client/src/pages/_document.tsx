import Document, {
    Html,
    Head,
    Main,
    NextScript,
    DocumentContext,
} from 'next/document';

class MyDocument extends Document {
    static async getInitialProps(ctx: DocumentContext) {
        const initialProps = await Document.getInitialProps(ctx);
        return { ...initialProps };
    }

    render() {
        return (
            <Html className="h-full bg-white scrollbar-thin scrollbar-thumb-gray-500 scrollbar-track-slate-300">
                <Head>
                    <link
                        rel="preconnect"
                        href="https://rsms.me/inter/inter.css"
                    />
                </Head>
                <body className="h-full select-none bg-white dark:bg-darkBackground">
                    <Main />
                    <NextScript />
                </body>
            </Html>
        );
    }
}

export default MyDocument;
