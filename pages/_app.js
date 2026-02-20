import "../globals.css";
import Head from "next/head";
import Layout from "../components/Layout";
import { AuthProvider } from "../context/AuthContext";

export default function App({ Component, pageProps }) {
  // Use custom layout if page defines one, otherwise use default Layout
  const getLayout = Component.getLayout || ((page) => <Layout>{page}</Layout>);

  return (
    <>
      <Head>
        <link rel="icon" href="/logo.svg" type="image/svg+xml" />
      </Head>
      <AuthProvider>{getLayout(<Component {...pageProps} />)}</AuthProvider>
    </>
  );
}
