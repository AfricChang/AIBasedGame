/**
 * ��Ч������ - Ϊ������������Ϸ�ṩ��Ч֧��
 */
class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.loaded = false;
        this.volume = 0.3;
        
        // Ԥ������Ч
        this.initSounds();
    }

    /**
     * ��ʼ����Чϵͳ
     */
    initSounds() {
        // ʹ��Web Audio API������Ч
        this.audioContext = null;
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createSounds();
            this.loaded = true;
        } catch (e) {
            console.warn('Web Audio API not supported, using fallback');
            this.loaded = true;
        }
    }

    /**
     * ������Ч
     */
    createSounds() {
        // �����ƶ���Ч
        this.sounds.move = this.createTone(220, 0.1, 'sine');
        
        // �����ͷ���Ч
        this.sounds.release = this.createTone(440, 0.3, 'triangle');
        
        // ������Ч
        this.sounds.combo = this.createTone(660, 0.2, 'square');
        
        // ����ʹ����Ч
        this.sounds.tool = this.createTone(330, 0.15, 'sawtooth');
        
        // ʤ����Ч
        this.sounds.victory = this.createMelody([523, 659, 784, 1047], 0.5);
        
        // ʧ����Ч
        this.sounds.gameOver = this.createTone(147, 0.8, 'triangle');
        
        // ��ť�����Ч
        this.sounds.click = this.createTone(800, 0.05, 'sine');
    }

    /**
     * ������������Ч
     */
    createTone(frequency, duration, type = 'sine') {
        return () => {
            if (!this.audioContext || this.muted) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        };
    }

    /**
     * ����������Ч
     */
    createMelody(frequencies, noteDuration) {
        return () => {
            if (!this.audioContext || this.muted) return;
            
            frequencies.forEach((freq, index) => {
                setTimeout(() => {
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, this.audioContext.currentTime + 0.01);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + noteDuration * 0.8);
                    
                    oscillator.start(this.audioContext.currentTime);
                    oscillator.stop(this.audioContext.currentTime + noteDuration * 0.8);
                }, index * noteDuration * 200);
            });
        };
    }

    /**
     * ������Ч
     */
    play(soundName) {
        if (!this.loaded || this.muted || !this.sounds[soundName]) return;
        
        try {
            // �ָ���Ƶ�����ģ��û�������
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.sounds[soundName]();
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }

    /**
     * �л�����״̬
     */
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    /**
     * ��������
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * ����������Ч����������������������
     */
    playCombo(comboCount) {
        if (!this.audioContext || this.muted) return;
        
        const baseFreq = 440;
        const frequency = baseFreq + (comboCount * 50);
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.type = 'square';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(this.volume * 0.7, this.audioContext.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }
}

// ������Ч������
window.AudioManager = AudioManager;