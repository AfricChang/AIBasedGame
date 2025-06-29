/**
 * 音效管理器 - 为动物消消消游戏提供音效支持
 */
class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.loaded = false;
        this.volume = 0.3;
        
        // 预加载音效
        this.initSounds();
    }

    /**
     * 初始化音效系统
     */
    initSounds() {
        // 使用Web Audio API创建音效
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
     * 创建音效
     */
    createSounds() {
        // 动物移动音效
        this.sounds.move = this.createTone(220, 0.1, 'sine');
        
        // 动物释放音效
        this.sounds.release = this.createTone(440, 0.3, 'triangle');
        
        // 连击音效
        this.sounds.combo = this.createTone(660, 0.2, 'square');
        
        // 道具使用音效
        this.sounds.tool = this.createTone(330, 0.15, 'sawtooth');
        
        // 胜利音效
        this.sounds.victory = this.createMelody([523, 659, 784, 1047], 0.5);
        
        // 失败音效
        this.sounds.gameOver = this.createTone(147, 0.8, 'triangle');
        
        // 按钮点击音效
        this.sounds.click = this.createTone(800, 0.05, 'sine');
    }

    /**
     * 创建单音调音效
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
     * 创建旋律音效
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
     * 播放音效
     */
    play(soundName) {
        if (!this.loaded || this.muted || !this.sounds[soundName]) return;
        
        try {
            // 恢复音频上下文（用户交互后）
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
            
            this.sounds[soundName]();
        } catch (e) {
            console.warn('Error playing sound:', e);
        }
    }

    /**
     * 切换静音状态
     */
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }

    /**
     * 设置音量
     */
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 播放连击音效（根据连击数调整音调）
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

// 导出音效管理器
window.AudioManager = AudioManager;