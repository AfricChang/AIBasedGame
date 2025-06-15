/**
 * ��Ƶ������ - ʹ��Web Audio API������Ϸ��Ч
 */
class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterVolume = 0.3;
        this.enabled = true;
        this.initAudioContext();
    }

    /**
     * ��ʼ����Ƶ������
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
     * �ָ���Ƶ�����ģ��û�������
     */
    resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    /**
     * ��������
     */
    createOscillator(frequency, type = 'sine') {
        if (!this.enabled || !this.audioContext) return null;
        
        const oscillator = this.audioContext.createOscillator();
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        return oscillator;
    }

    /**
     * ��������ڵ�
     */
    createGain(volume = 1) {
        if (!this.enabled || !this.audioContext) return null;
        
        const gainNode = this.audioContext.createGain();
        gainNode.gain.setValueAtTime(volume * this.masterVolume, this.audioContext.currentTime);
        return gainNode;
    }

    /**
     * ���������Ч
     */
    playShoot() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(800, 'square');
        const gainNode = this.createGain(0.1);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // ����˥��
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);
    }

    /**
     * ���ŵл������Ч
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
     * ���ű�ը��Ч
     */
    playExplosion() {
        if (!this.enabled) return;
        
        // ��������Ч��
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
     * ���ŵл���������Ч
     */
    playHit() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(200, 'square');
        const gainNode = this.createGain(0.06);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // Ƶ���½�
        oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.2);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.2);
    }

    /**
     * ���ŵ����ռ���Ч
     */
    playPowerUp() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(523, 'sine'); // C5
        const gainNode = this.createGain(0.08);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // ��������
        oscillator.frequency.exponentialRampToValueAtTime(1047, this.audioContext.currentTime + 0.3); // C6
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.3);
    }

    /**
     * �������������Ч
     */
    playPlayerHurt() {
        if (!this.enabled) return;
        
        const oscillator = this.createOscillator(150, 'sawtooth');
        const gainNode = this.createGain(0.1);
        
        if (!oscillator || !gainNode) return;
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        // ��Ч��
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime);
        oscillator.frequency.setValueAtTime(100, this.audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(150, this.audioContext.currentTime + 0.2);
        
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.4);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.4);
    }

    /**
     * ������Ϸ������Ч
     */
    playGameOver() {
        if (!this.enabled) return;
        
        // �½�����
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
     * ���ű������֣��򵥵�ѭ��������
     */
    playBackgroundMusic() {
        if (!this.enabled || this.backgroundMusic) return;
        
        this.backgroundMusic = true;
        this.playBackgroundLoop();
    }

    /**
     * ֹͣ��������
     */
    stopBackgroundMusic() {
        this.backgroundMusic = false;
    }

    /**
     * ��������ѭ��
     */
    playBackgroundLoop() {
        if (!this.backgroundMusic || !this.enabled) return;
        
        const notes = [261, 294, 329, 349, 392, 440, 493, 523]; // C�������
        const randomNote = notes[Math.floor(Math.random() * notes.length)];
        
        const oscillator = this.createOscillator(randomNote, 'sine');
        const gainNode = this.createGain(0.02); // �ܵ͵�����
        
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
        
        // ������������һ������
        setTimeout(() => this.playBackgroundLoop(), 1500 + Math.random() * 1000);
    }

    /**
     * ����������
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    /**
     * �л���Ч����
     */
    toggleSound() {
        this.enabled = !this.enabled;
        if (!this.enabled) {
            this.stopBackgroundMusic();
        }
        return this.enabled;
    }
}