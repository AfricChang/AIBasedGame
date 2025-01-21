class AudioManager {
    constructor() {
        this.sounds = {};
        this.muted = false;
        this.loaded = false;
        
        // 预加载音效
        Promise.all([
            this.loadSound('drop', 'sounds/drop.mp3'),
            this.loadSound('merge', 'sounds/merge.mp3'),
            this.loadSound('gameOver', 'sounds/gameover.mp3')
        ]).then(() => {
            console.log('All sounds loaded successfully');
            this.loaded = true;
        }).catch(error => {
            console.warn('Some sounds failed to load:', error);
            // 即使加载失败也设置为已加载，这样游戏可以继续运行
            this.loaded = true;
        });
    }

    loadSound(name, url) {
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            
            audio.addEventListener('canplaythrough', () => {
                this.sounds[name] = audio;
                resolve();
            }, { once: true });
            
            audio.addEventListener('error', (e) => {
                console.warn(`Error loading sound ${name}:`, e);
                reject(e);
            }, { once: true });
            
            audio.preload = 'auto';
            audio.src = url;
        });
    }

    play(name) {
        if (this.muted || !this.loaded) return;
        
        const sound = this.sounds[name];
        if (sound) {
            try {
                // 克隆音频对象以支持重叠播放
                const clone = sound.cloneNode();
                clone.volume = 0.3; // 降低音量
                clone.play().catch(e => {
                    console.warn(`Failed to play sound ${name}:`, e);
                });
                
                // 播放结束后删除克隆的音频对象
                clone.addEventListener('ended', () => {
                    clone.remove();
                }, { once: true });
            } catch (error) {
                console.warn(`Error playing sound ${name}:`, error);
            }
        }
    }

    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
}

// 导出音频管理器
window.AudioManager = AudioManager;
