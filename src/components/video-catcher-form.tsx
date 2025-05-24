"use client";

import type { ChangeEvent, FormEvent } from 'react';
import { useState, useEffect, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { getVideoInfoAction, downloadVideoAction } from '@/app/actions';
import { Link as LinkIcon, Download, Settings2, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

interface VideoInfo {
  title: string;
  qualities: string[];
}

type Status = 'idle' | 'fetching_info' | 'info_loaded' | 'downloading' | 'completed' | 'error';

export default function VideoCatcherForm() {
  const [url, setUrl] = useState('');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'downloading') {
      setDownloadProgress(0); // Reset progress
      let currentProgress = 0;
      progressIntervalRef.current = setInterval(() => {
        currentProgress += 5; // Simulate progress increment
        if (currentProgress < 95) {
          setDownloadProgress(currentProgress);
        } else {
          // Stop at 95% to wait for actual completion
          if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
        }
      }, 200); // Adjust interval for smoother/faster simulation
    } else {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      if (status === 'completed') {
        setDownloadProgress(100);
      } else if (status !== 'downloading') {
         // setDownloadProgress(0); // Reset if not downloading or completed (e.g. error or new fetch)
      }
    }
    return () => {
      if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);
    };
  }, [status]);


  const handleGetVideoInfo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url) {
      setMessage("Please enter a YouTube URL.");
      setStatus('error');
      return;
    }
    setStatus('fetching_info');
    setMessage(null);
    setVideoInfo(null);
    setSelectedQuality('');
    setDownloadProgress(0);

    const formData = new FormData();
    formData.append('url', url);

    const result = await getVideoInfoAction(formData);

    if (result.success && result.data) {
      setVideoInfo(result.data);
      setStatus('info_loaded');
      if (result.data.qualities.length > 0) {
        setSelectedQuality(result.data.qualities[0]);
      }
    } else {
      setMessage(result.error || "Failed to fetch video information.");
      setStatus('error');
    }
  };

  const handleDownloadVideo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!url || !selectedQuality) {
      setMessage("URL and quality are required.");
      setStatus('error');
      return;
    }
    setStatus('downloading');
    setMessage(null);
    setDownloadProgress(0);

    const formData = new FormData();
    formData.append('url', url);
    formData.append('quality', selectedQuality);

    const result = await downloadVideoAction(formData);
    
    if (progressIntervalRef.current) clearInterval(progressIntervalRef.current); // Clear simulation

    if (result.success && result.data?.success) {
      setMessage(result.data.message + (result.data.filePath ? ` Saved to: ${result.data.filePath}` : ''));
      setStatus('completed');
      setDownloadProgress(100);
    } else {
      setMessage(result.error || result.data?.message || "Failed to download video.");
      setStatus('error');
      setDownloadProgress(0); // Reset progress on error
    }
  };

  const isLoading = status === 'fetching_info' || status === 'downloading';

  return (
    <Card className="w-full shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <Download className="h-7 w-7 text-primary" />
          <span>Download Video</span>
        </CardTitle>
        <CardDescription>Enter a YouTube URL to download the video.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleGetVideoInfo} className="space-y-4">
          <div>
            <Label htmlFor="youtube-url" className="mb-2 flex items-center gap-2">
              <LinkIcon className="h-4 w-4" /> YouTube URL
            </Label>
            <div className="flex gap-2">
              <Input
                id="youtube-url"
                type="url"
                placeholder="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                value={url}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                disabled={isLoading}
                required
                className="flex-grow"
              />
              <Button type="submit" disabled={isLoading || !url} className="bg-accent hover:bg-accent/90 text-accent-foreground">
                {status === 'fetching_info' ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  "Get Info"
                )}
              </Button>
            </div>
          </div>
        </form>

        {videoInfo && status === 'info_loaded' && (
          <form onSubmit={handleDownloadVideo} className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold text-lg">{videoInfo.title}</h3>
            <div>
              <Label htmlFor="quality-select" className="mb-2 flex items-center gap-2">
                <Settings2 className="h-4 w-4" /> Select Quality
              </Label>
              <Select
                value={selectedQuality}
                onValueChange={setSelectedQuality}
                disabled={isLoading}
              >
                <SelectTrigger id="quality-select">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  {videoInfo.qualities.map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={isLoading || !selectedQuality} className="w-full">
              {status === 'downloading' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  <Download className="mr-2 h-5 w-5" /> Download
                </>
              )}
            </Button>
          </form>
        )}

        {(status === 'downloading' || status === 'completed') && (
          <div className="space-y-2 pt-4">
            <Label>{status === 'downloading' ? 'Downloading...' : 'Progress'}</Label>
            <Progress value={downloadProgress} className="w-full [&>div]:bg-primary" />
            {status === 'downloading' && <p className="text-sm text-muted-foreground text-center">{downloadProgress}%</p>}
          </div>
        )}

        {message && (
          <Alert variant={status === 'error' ? 'destructive' : 'default'} className="mt-4">
            {status === 'error' ? <AlertTriangle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
            <AlertTitle>{status === 'error' ? 'Error' : (status === 'completed' ? 'Success' : 'Notification')}</AlertTitle>
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
      </CardContent>
      { (status === 'idle' || status === 'error' || status === 'completed') && url && videoInfo &&
        <CardFooter>
            <Button variant="link" onClick={() => {
                setUrl('');
                setVideoInfo(null);
                setSelectedQuality('');
                setStatus('idle');
                setMessage(null);
                setDownloadProgress(0);
            }} className="text-sm text-muted-foreground p-0 h-auto">
                Start over with a new URL
            </Button>
        </CardFooter>
      }
    </Card>
  );
}
