import Head from 'next/head'
import UploadSection from '../components/UploadSection'
import Dashboard from '../components/Dashboard'

export default function Home() {
  return (
    <>
      <Head>
        <title>DeepTrack AI</title>
        <meta name="description" content="Deep music analysis with AI" />
      </Head>
      <main className="min-h-screen bg-gray-900 text-white">
        <div className="container mx-auto py-8">
          <h1 className="text-4xl font-bold mb-6">DeepTrack AI</h1>
          <UploadSection />
          <Dashboard />
        </div>
      </main>
    </>
  )
}
