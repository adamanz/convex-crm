"use client";

import * as React from "react";
import { useRef, useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Download,
  RotateCcw,
  Loader2,
} from "lucide-react";

// =============================================================================
// Types
// =============================================================================

interface TranscriptionSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
  confidence?: number;
}

interface CallRecordingPlayerProps {
  audioUrl: string | null;
  duration: number; // in seconds
  segments?: TranscriptionSegment[];
  onTimeUpdate?: (currentTime: number) => void;
  onSegmentClick?: (segment: TranscriptionSegment) => void;
  className?: string;
}

// =============================================================================
// Helper Functions
// =============================================================================

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

// =============================================================================
// Waveform Visualization Component
// =============================================================================

interface WaveformProps {
  audioUrl: string | null;
  currentTime: number;
  duration: number;
  onSeek: (time: number) => void;
  isPlaying: boolean;
}

function Waveform({ audioUrl, currentTime, duration, onSeek, isPlaying }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [waveformData, setWaveformData] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Generate waveform data from audio
  useEffect(() => {
    if (!audioUrl) return;

    const generateWaveform = async () => {
      setIsLoading(true);
      try {
        const audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const response = await fetch(audioUrl);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        const rawData = audioBuffer.getChannelData(0);
        const samples = 100; // Number of bars
        const blockSize = Math.floor(rawData.length / samples);
        const filteredData: number[] = [];

        for (let i = 0; i < samples; i++) {
          let blockStart = blockSize * i;
          let sum = 0;
          for (let j = 0; j < blockSize; j++) {
            sum += Math.abs(rawData[blockStart + j]);
          }
          filteredData.push(sum / blockSize);
        }

        // Normalize
        const multiplier = Math.pow(Math.max(...filteredData), -1);
        const normalizedData = filteredData.map((n) => n * multiplier);

        setWaveformData(normalizedData);
        audioContext.close();
      } catch (error) {
        console.error("Error generating waveform:", error);
        // Generate placeholder waveform
        setWaveformData(Array(100).fill(0).map(() => Math.random() * 0.5 + 0.25));
      } finally {
        setIsLoading(false);
      }
    };

    generateWaveform();
  }, [audioUrl]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveformData.length === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const barWidth = width / waveformData.length;
    const progressRatio = duration > 0 ? currentTime / duration : 0;
    const progressX = width * progressRatio;

    ctx.clearRect(0, 0, width, height);

    waveformData.forEach((value, index) => {
      const x = index * barWidth;
      const barHeight = value * height * 0.8;
      const y = (height - barHeight) / 2;

      // Played portion
      if (x < progressX) {
        ctx.fillStyle = isPlaying
          ? "hsl(221.2, 83.2%, 53.3%)" // primary color
          : "hsl(221.2, 83.2%, 43.3%)";
      } else {
        ctx.fillStyle = "hsl(240, 4.8%, 75%)"; // muted
      }

      ctx.fillRect(x, y, barWidth - 1, barHeight);
    });
  }, [waveformData, currentTime, duration, isPlaying]);

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || duration <= 0) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    const newTime = ratio * duration;
    onSeek(Math.max(0, Math.min(duration, newTime)));
  };

  return (
    <div className="relative w-full h-16 bg-muted/30 rounded-lg overflow-hidden">
      {isLoading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <canvas
          ref={canvasRef}
          className="w-full h-full cursor-pointer"
          onClick={handleClick}
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CallRecordingPlayer({
  audioUrl,
  duration,
  segments,
  onTimeUpdate,
  onSegmentClick,
  className,
}: CallRecordingPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadeddata", handleLoadedData);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("canplay", handleCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadeddata", handleLoadedData);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("canplay", handleCanPlay);
    };
  }, [onTimeUpdate]);

  // Sync volume with audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, audioUrl]);

  const handleSeek = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  }, []);

  const handleSliderChange = useCallback(
    (value: number[]) => {
      handleSeek(value[0]);
    },
    [handleSeek]
  );

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value[0]);
    if (value[0] > 0) {
      setIsMuted(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
  }, [isMuted]);

  const skipBack = useCallback(() => {
    handleSeek(Math.max(0, currentTime - 10));
  }, [currentTime, handleSeek]);

  const skipForward = useCallback(() => {
    handleSeek(Math.min(duration, currentTime + 10));
  }, [currentTime, duration, handleSeek]);

  const restart = useCallback(() => {
    handleSeek(0);
    if (!isPlaying && audioRef.current) {
      audioRef.current.play();
      setIsPlaying(true);
    }
  }, [handleSeek, isPlaying]);

  const cyclePlaybackRate = useCallback(() => {
    const rates = [1, 1.25, 1.5, 1.75, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextIndex = (currentIndex + 1) % rates.length;
    setPlaybackRate(rates[nextIndex]);
  }, [playbackRate]);

  const handleDownload = useCallback(() => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = `call-recording-${Date.now()}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }, [audioUrl]);

  // Find active segment based on current time
  const activeSegment = segments?.find(
    (s) => currentTime >= s.start && currentTime <= s.end
  );

  if (!audioUrl) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-8 rounded-lg bg-muted/30 text-muted-foreground",
          className
        )}
      >
        No recording available
      </div>
    );
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Hidden audio element */}
      <audio ref={audioRef} src={audioUrl} preload="metadata" />

      {/* Waveform visualization */}
      <Waveform
        audioUrl={audioUrl}
        currentTime={currentTime}
        duration={duration}
        onSeek={handleSeek}
        isPlaying={isPlaying}
      />

      {/* Progress slider */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground w-10 text-right">
          {formatTime(currentTime)}
        </span>
        <Slider
          value={[currentTime]}
          max={duration}
          step={0.1}
          onValueChange={handleSliderChange}
          className="flex-1"
        />
        <span className="text-xs text-muted-foreground w-10">
          {formatTime(duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        {/* Left controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={restart}
            title="Restart"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={skipBack}
            title="Skip back 10s"
          >
            <SkipBack className="h-4 w-4" />
          </Button>

          <Button
            variant="default"
            size="icon"
            className="h-10 w-10"
            onClick={togglePlay}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="h-5 w-5" />
            ) : (
              <Play className="h-5 w-5 ml-0.5" />
            )}
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={skipForward}
            title="Skip forward 10s"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
        </div>

        {/* Center - Playback rate */}
        <Button
          variant="outline"
          size="sm"
          onClick={cyclePlaybackRate}
          className="text-xs min-w-[60px]"
        >
          {playbackRate}x
        </Button>

        {/* Right controls */}
        <div className="flex items-center gap-2">
          {/* Volume */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.01}
              onValueChange={handleVolumeChange}
              className="w-20"
            />
          </div>

          {/* Download */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            title="Download recording"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Active segment indicator */}
      {activeSegment && (
        <div
          className={cn(
            "p-3 rounded-lg bg-primary/5 border border-primary/20",
            "cursor-pointer hover:bg-primary/10 transition-colors"
          )}
          onClick={() => onSegmentClick?.(activeSegment)}
        >
          {activeSegment.speaker && (
            <span className="text-xs font-medium text-primary mr-2">
              {activeSegment.speaker}:
            </span>
          )}
          <span className="text-sm">{activeSegment.text}</span>
        </div>
      )}
    </div>
  );
}

export default CallRecordingPlayer;
