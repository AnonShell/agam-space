import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    const version = process.env.NEXT_PUBLIC_APP_VERSION || 'dev';
    const commit = process.env.NEXT_PUBLIC_BUILD_COMMIT || 'unknown';

    return (
      <Html lang='en'>
        <Head>
          {/* Build metadata for integrity verification */}
          <meta name='agam-version' content={version} />
          <meta name='agam-commit' content={commit} />

          {/* Favicons */}
          <link rel='icon' href='/favicon.ico' />
          <link rel='icon' type='image/svg+xml' href='/favicon.svg' />
          <link rel='icon' type='image/png' sizes='32x32' href='/favicon-32x32.png' />
          <link rel='icon' type='image/png' sizes='16x16' href='/favicon-16x16.png' />
          <link rel='icon' type='image/png' sizes='96x96' href='/favicon-96x96.png' />
          <link rel='apple-touch-icon' sizes='180x180' href='/apple-touch-icon.png' />
          <link rel='manifest' href='/site.webmanifest' />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
