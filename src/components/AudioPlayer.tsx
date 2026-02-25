import React, { useEffect, useRef, useState, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Volume2, VolumeX, Download, Gauge } from "lucide-react";
import { Button } from "./ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";

interface AudioPlayerProps {
    url: string;
    captionsUrl?: string;
    className?: string;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ url, captionsUrl, className }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    const wavesurferRef = useRef<WaveSurfer | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);

    useEffect(() => {
        if (!containerRef.current || !audioRef.current) return;

        const ws = WaveSurfer.create({
            container: containerRef.current,
            media: audioRef.current,
            waveColor: "#4f46e5", // indigo-600
            progressColor: "#818cf8", // indigo-400
            cursorColor: "#ffffff",
            barWidth: 2,
            barRadius: 3,
            cursorWidth: 1,
            height: 40,
            normalize: true,
        });

        wavesurferRef.current = ws;

        ws.on("play", () => setIsPlaying(true));
        ws.on("pause", () => setIsPlaying(false));
        ws.on("timeupdate", (time) => setCurrentTime(time));
        ws.on("ready", (duration) => setDuration(duration));

        return () => {
            ws.destroy();
        };
    }, []);

    const togglePlay = useCallback(() => {
        if (wavesurferRef.current) {
            wavesurferRef.current.playPause();
        }
    }, []);

    const handleVolumeChange = useCallback((newVolume: number) => {
        setVolume(newVolume);
        setIsMuted(newVolume === 0);
        if (wavesurferRef.current) {
            wavesurferRef.current.setVolume(newVolume);
        }
    }, []);

    const toggleMute = useCallback(() => {
        if (wavesurferRef.current) {
            if (isMuted) {
                wavesurferRef.current.setVolume(volume || 1);
                setIsMuted(false);
            } else {
                wavesurferRef.current.setVolume(0);
                setIsMuted(true);
            }
        }
    }, [isMuted, volume]);

    const handlePlaybackRateChange = useCallback((rate: string) => {
        const rateFloat = parseFloat(rate);
        setPlaybackRate(rateFloat);
        if (wavesurferRef.current) {
            wavesurferRef.current.setPlaybackRate(rateFloat);
        }
    }, []);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className={`flex flex-col gap-2 p-3 bg-card border rounded-xl shadow-sm ${className}`}>
            <audio ref={audioRef} src={url} crossOrigin="anonymous">
                {captionsUrl && (
                    <track
                        kind="captions"
                        src={captionsUrl}
                        srcLang="en"
                        label="English"
                        default
                    />
                )}
            </audio>

            <div className="flex items-center gap-3">
                <Button
                    variant="ghost"
                    size="icon"
                    type="button"
                    className="h-8 w-8 rounded-full shrink-0"
                    onClick={togglePlay}
                >
                    {isPlaying ? <Pause className="h-4 w-4 fill-current" /> : <Play className="h-4 w-4 fill-current ml-0.5" />}
                </Button>

                <div ref={containerRef} className="flex-1 cursor-pointer min-h-[40px]" />

                <div className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0 min-w-[70px] text-right">
                    {formatTime(currentTime)} / {formatTime(duration)}
                </div>
            </div>

            <div className="flex items-center justify-between gap-4 mt-1">
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        onClick={toggleMute}
                    >
                        {isMuted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <div className="w-20 flex items-center">
                        <input
                            type="range"
                            min="0"
                            max="1"
                            step="0.01"
                            value={isMuted ? 0 : volume}
                            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                            className="w-full h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-muted/50 rounded-md px-1 py-0.5">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        <Select
                            value={playbackRate.toString()}
                            onValueChange={handlePlaybackRateChange}
                        >
                            <SelectTrigger className="h-6 w-[65px] border-none bg-transparent text-[10px] font-bold focus:ring-0">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                                    <SelectItem key={rate} value={rate.toString()} className="text-[10px]">
                                        {rate}x
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" asChild>
                        <a href={url} download target="_blank" rel="noopener noreferrer">
                            <Download className="h-4 w-4" />
                        </a>
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AudioPlayer;
