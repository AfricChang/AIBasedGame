class AudioManager {
    constructor() {
        this.muted = true; // 默认静音
        this.enabled = false; // 暂时禁用整个系统
    }

    // 保持所有方法的接口，但暂时不执行任何操作
    play(soundType) {
        // 暂时禁用
        return;
    }

    toggleMute() {
        this.muted = !this.muted;
        localStorage.setItem('breakoutMuted', this.muted);
        return this.muted;
    }

    isMuted() {
        return this.muted;
    }

    resumeAudioContext() {
        // 暂时禁用
        return;
    }
}
