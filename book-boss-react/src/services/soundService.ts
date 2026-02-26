class SoundService {
    private audioContext: AudioContext | null = null;
    private enabled: boolean = true;

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    isEnabled() {
        return this.enabled;
    }

    setEnabled(val: boolean) {
        this.enabled = val;
    }

    playPop() {
        if (!this.enabled) return;

        try {
            if (!this.audioContext) this.init();
            if (this.audioContext?.state === 'suspended') {
                this.audioContext.resume();
            }

            const ctx = this.audioContext;
            if (!ctx) return;

            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'sine';

            // Subtle pop sound profile
            const now = ctx.currentTime;
            osc.frequency.setValueAtTime(800, now);
            osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);

            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

            osc.start(now);
            osc.stop(now + 0.05);
        } catch (e) {
            console.error('Audio playback failed', e);
        }
    }
}

export const soundService = new SoundService();
