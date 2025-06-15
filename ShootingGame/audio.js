/**
 * 音频管理器 - 使用Web Audio API生成游戏音效
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.enabled = true;
        this.initAudioContext();
    }

    /**
     * 初始化音频上下文
     */
    initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    /**
     * 恢复音频上下文（用户交互后）
     */
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * 创建振荡器
     */
    createOscillator(frequency, type = 'sine') {
        if (!this.enabled || !this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return oscillator;
    }

    /**
     * 创建增益节点
     */
    createGain(volume = 1) {
        if (!this.enabled || !this.audioContext) return null;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        return gainNode;
    }

    /**
     * 播放射击音效
     */
    playShoot() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(800, 'square');
        const gainNode = this.createGain(0.1);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 快速衰减
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * 播放敌机射击音效
     */
    playEnemyShoot() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(400, 'sawtooth');
        const gainNode = this.createGain(0.08);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
    }

    /**
     * 播放爆炸音效
     */
    playExplosion() {
        if (!this.enabled) return;
        
        // 创建噪音效果
        const bufferSize = this.audioContext.sampleRate * 0.3;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        
        const gainNode = this.createGain(0.15);
        if (!gainNode) return;
        
        source.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        source.start();
    }

    /**
     * 播放敌机被击中音效
     */
    playHit() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(200, 'square');
        const gainNode = this.createGain(0.06);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 频率下降
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    /**
     * 播放道具收集音效
     */
    playPowerUp() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(523, 'sine'); // C5
        const gainNode = this.createGain(0.08);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 上升音调
        oscillator.frequency.exponentialRampToValueAtTime(1047, this.audioContext.currentTime + 0.3); // C6
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * 播放玩家受伤音效
     */
    playPlayerHurt() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(150, 'sawtooth');
        const gainNode = this.createGain(0.1);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // 震荡效果
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    /**
     * 播放游戏结束音效
     */
    playGameOver() {
        if (!this.enabled) return;
        
        // 下降音阶
        const frequencies = [523, 466, 415, 349, 294, 247, 220];
        
        frequencies.forEach((freq, index) => {
            setTimeout(() => {
                const oscillator = this.createOscillator(freq, 'sine');
                const gainNode = this.createGain(0.1);
                
                if (!oscillator || !gainNode) return;
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
            }, index * 200);
        });
    }

    /**
     * 播放背景音乐（简单的循环音调）
     */
    playBackgroundMusic() {
        if (!this.enabled || this.backgroundMusic) return;
        
        this.backgroundMusic = true;
        this.playBackgroundLoop();
    }

    /**
     * 停止背景音乐
     */
    stopBackgroundMusic() {
        this.backgroundMusic = false;
    }

    /**
     * 背景音乐循环
     */
    playBackgroundLoop() {
        if (!this.backgroundMusic || !this.enabled) return;
        
        const notes = [261, 294, 329, 349, 392, 440, 493, 523]; // C大调音阶
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        
        const oscillator = this.createOscillator(randomNote, 'sine');
        const gainNode = this.createGain(0.02); // 很低的音量
        
        if (!oscillator || !gainNode) {
            setTimeout(() => this.playBackgroundLoop(), 2000);
            return;
        }
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.02 * this.masterVolume, this.audioContext.currentTime + 0.5);
        gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 1.5);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 1.5);
        
        // 随机间隔播放下一个音符
        setTimeout(() => this.playBackgroundLoop(), 1500 + Math.random() * 1000);
    }

    /**
     * 设置主音量
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * 切换音效开关
     */
    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBackgroundMusic();
        }
        return this.enabled;
    }
}