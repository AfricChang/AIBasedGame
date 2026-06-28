class AudioManager {
    constructor() {
        this.sounds = {};
        this.enabled = true;
        this.volume = 0.5;
        this.init();
    }
    
    init() {
        // 创建音效对象
        this.sounds = {
            slice: this.createAudio('slice'),
            bomb: this.createAudio('bomb'),
            swoosh: this.createAudio('swoosh'),
            combo: this.createAudio('combo'),
            gameOver: this.createAudio('gameOver')
        };
    }
    
    createAudio(name) {
        // 使用Web Audio API创建音效
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // 为不同音效创建不同频率的音调
        const frequencies = {
            slice: [800, 1000, 1200], // 切割音效 - 清脆的高音
            bomb: [100, 150, 200],    // 爆炸音效 - 低沉的轰鸣
            swoosh: [400, 600],       // 挥动音效 - 中频
            combo: [1200, 1400, 1600], // 连击音效 - 更高的音调
            gameOver: [200, 150, 100]  // 游戏结束 - 下降音调
        };
        
        return {
            play: () => {
                if (!this.enabled) return;
                
                const freq = frequencies[name];
                if (!freq) return;
                
                try {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();
                    
                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);
                    
                    // 设置音效参数
                    if (name === 'slice') {
                        // 切割音效 - 快速的高音
                        oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(freq[1], audioContext.currentTime + 0.1);
                        gainNode.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.15);
                        oscillator.type = 'sine';
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.15);
                    } else if (name === 'bomb') {
                        // 爆炸音效 - 噪音加低频
                        oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(freq[1], audioContext.currentTime + 0.3);
                        gainNode.gain.setValueAtTime(this.volume * 0.5, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.4);
                        oscillator.type = 'sawtooth';
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.4);
                    } else if (name === 'swoosh') {
                        // 挥动音效 - 快速扫频
                        oscillator.frequency.setValueAtTime(freq[0], audioContext.currentTime);
                        oscillator.frequency.exponentialRampToValueAtTime(freq[1], audioContext.currentTime + 0.2);
                        gainNode.gain.setValueAtTime(this.volume * 0.2, audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                        oscillator.type = 'triangle';
                        oscillator.start();
                        oscillator.stop(audioContext.currentTime + 0.2);
                    } else if (name === 'combo') {
                        // 连击音效 - 上升音调
                        freq.forEach((f, i) => {
                            const osc = audioContext.createOscillator();
                            const gain = audioContext.createGain();
                            osc.connect(gain);
                            gain.connect(audioContext.destination);
                            
                            osc.frequency.setValueAtTime(f, audioContext.currentTime + i * 0.05);
                            gain.gain.setValueAtTime(this.volume * 0.2, audioContext.currentTime + i * 0.05);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.05 + 0.1);
                            osc.type = 'sine';
                            osc.start(audioContext.currentTime + i * 0.05);
                            osc.stop(audioContext.currentTime + i * 0.05 + 0.1);
                        });
                    } else if (name === 'gameOver') {
                        // 游戏结束音效 - 下降音调
                        freq.forEach((f, i) => {
                            const osc = audioContext.createOscillator();
                            const gain = audioContext.createGain();
                            osc.connect(gain);
                            gain.connect(audioContext.destination);
                            
                            osc.frequency.setValueAtTime(f, audioContext.currentTime + i * 0.2);
                            gain.gain.setValueAtTime(this.volume * 0.3, audioContext.currentTime + i * 0.2);
                            gain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + i * 0.2 + 0.3);
                            osc.type = 'square';
                            osc.start(audioContext.currentTime + i * 0.2);
                            osc.stop(audioContext.currentTime + i * 0.2 + 0.3);
                        });
                    }
                } catch (e) {
                    console.log('Audio playback failed:', e);
                }
            }
        };
    }
    
    play(soundName) {
        if (this.sounds[soundName]) {
            this.sounds[soundName].play();
        }
    }
    
    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
    }
    
    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// 导出音频管理器
window.AudioManager = AudioManager;