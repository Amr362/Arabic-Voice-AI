import { useState, useRef, useEffect } from "react";
import { Play, Pause, Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AudioPlayerProps {
  src: string;
  label?: string;
}

export function AudioPlayer({ src, label }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress(audio.duration ? (audio.currentTime / audio.duration) * 100 : 0);
    };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => setPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [src]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (playing) {
      audio.pause();
      setPlaying(false);
    } else {
      await audio.play();
      setPlaying(true);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    audio.currentTime = ratio * audio.duration;
  };

  const formatTime = (s: number) => {
    if (!isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = label ? `${label}.mp3` : "arabvoice-audio.mp3";
    a.target = "_blank";
    a.click();
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3" data-testid="audio-player">
      <audio ref={audioRef} src={src} preload="metadata" />

      {label && <p className="text-sm text-muted-foreground truncate">{label}</p>}

      {/* Waveform-style bars */}
      <div className="flex items-center gap-[3px] h-8">
        {Array.from({ length: 40 }).map((_, i) => {
          const barProgress = (i / 40) * 100;
          const filled = barProgress <= progress;
          const height = 4 + Math.sin(i * 0.8) * 10 + Math.sin(i * 0.3) * 8 + 8;
          return (
            <div
              key={i}
              className={`rounded-full flex-shrink-0 transition-colors duration-100 ${filled ? "bg-primary" : "bg-border"} ${playing && filled ? "animate-pulse" : ""}`}
              style={{ width: 3, height: `${Math.max(4, height)}px` }}
            />
          );
        })}
      </div>

      {/* Seek bar */}
      <div
        className="h-1 bg-border rounded-full cursor-pointer relative"
        onClick={handleSeek}
        data-testid="audio-seek-bar"
      >
        <div
          className="h-1 bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="default"
            className="h-9 w-9 rounded-full"
            onClick={togglePlay}
            data-testid="button-play-pause"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={handleDownload}
          data-testid="button-download"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
