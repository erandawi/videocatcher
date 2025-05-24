"use server";
import { runFlow } from '@genkit-ai/next/server';
import { getVideoInfoFlow, downloadVideoFlow } from '@/ai/flows/videoDownloader';
import { z } from 'zod';

const UrlSchema = z.string().url({ message: "Invalid URL format. Please enter a full URL (e.g., https://www.youtube.com/...)." }).refine(
  (url) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname === "www.youtube.com" || parsedUrl.hostname === "youtube.com" || parsedUrl.hostname === "youtu.be";
    } catch (e) {
      return false;
    }
  },
  { message: "URL must be a valid YouTube link (e.g., youtube.com or youtu.be)." }
);

interface VideoInfoSuccess {
  success: true;
  data: { title: string; qualities: string[] };
}
interface ActionError {
  success: false;
  error: string;
}

export async function getVideoInfoAction(formData: FormData): Promise<VideoInfoSuccess | ActionError> {
  const url = formData.get('url') as string;
  try {
    UrlSchema.parse(url); // Validate URL first
    const result = await runFlow(getVideoInfoFlow, { youtubeUrl: url });
    return { success: true, data: result };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: error.message || "Failed to get video info. Ensure the URL is correct and public." };
  }
}

interface DownloadSuccess {
  success: true;
  data: { success: boolean; message: string; filePath?: string };
}

export async function downloadVideoAction(formData: FormData): Promise<DownloadSuccess | ActionError> {
  const url = formData.get('url') as string;
  const quality = formData.get('quality') as string;

  try {
    UrlSchema.parse(url); // Validate URL
    if (!quality) {
      return { success: false, error: "Quality must be selected." };
    }
    const result = await runFlow(downloadVideoFlow, { youtubeUrl: url, quality });
    return { success: true, data: result };
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: error.message || "Failed to download video." };
  }
}

