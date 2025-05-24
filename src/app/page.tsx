import type { Metadata } from 'next';
import VideoCatcherForm from '@/components/video-catcher-form';

export const metadata: Metadata = {
  title: 'VideoCatcher - YouTube Video Downloader',
  description: 'Easily download YouTube videos by providing a URL and selecting your desired quality.',
};

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 md:p-12 lg:p-24">
      <div className="w-full max-w-2xl">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-primary">VideoCatcher</h1>
          <p className="text-muted-foreground">Download YouTube videos with ease.</p>
        </header>
        <VideoCatcherForm />
      </div>
    </main>
  );
}
