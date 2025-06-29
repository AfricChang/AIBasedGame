// 性能优化配置文件
// 根据设备性能自动调整游戏设置

class PerformanceConfig {
    constructor() {
        this.deviceType = this.detectDeviceType();
        this.performanceLevel = this.detectPerformanceLevel();
        this.config = this.getOptimalConfig();
    }
    
    detectDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase();
        if (/mobile|android|iphone|ipad|tablet/.test(userAgent)) {
            return 'mobile';
        }
        return 'desktop';
    }
    
    detectPerformanceLevel() {
        // 基于硬件并发数和内存估算性能等级
        const cores = navigator.hardwareConcurrency || 2;
        const memory = navigator.deviceMemory || 2;
        
        if (cores >= 8 && memory >= 8) {
            return 'high';
        } else if (cores >= 4 && memory >= 4) {
            return 'medium';
        } else {
            return 'low';
        }
    }
    
    getOptimalConfig() {
        const configs = {
            high: {
                targetFPS: 60,
                maxParticles: 8,
                physicsIterations: {
                    position: 6,
                    velocity: 4,
                    constraint: 2
                },
                enableShadows: true,
                enableParticles: true,
                textureQuality: 'high',
                maxFruits: 100
            },
            medium: {
                targetFPS: 45,
                maxParticles: 6,
                physicsIterations: {
                    position: 4,
                    velocity: 3,
                    constraint: 1
                },
                enableShadows: false,
                enableParticles: true,
                textureQuality: 'medium',
                maxFruits: 80
            },
            low: {
                targetFPS: 30,
                maxParticles: 4,
                physicsIterations: {
                    position: 3,
                    velocity: 2,
                    constraint: 1
                },
                enableShadows: false,
                enableParticles: false,
                textureQuality: 'low',
                maxFruits: 60
            }
        };
        
        // 移动设备额外优化
        if (this.deviceType === 'mobile') {
            const config = configs[this.performanceLevel];
            config.targetFPS = Math.min(config.targetFPS, 45);
            config.maxParticles = Math.max(config.maxParticles - 2, 2);
            config.enableShadows = false;
            return config;
        }
        
        return configs[this.performanceLevel];
    }
    
    // 动态调整性能设置
    adjustForFPS(currentFPS) {
        if (currentFPS < this.config.targetFPS * 0.8) {
            // FPS过低，降低设置
            this.config.maxParticles = Math.max(this.config.maxParticles - 1, 2);
            this.config.enableParticles = false;
            console.log('Performance adjusted: reduced particles');
        } else if (currentFPS > this.config.targetFPS * 1.1 && this.performanceLevel !== 'high') {
            // FPS充足，可以提升设置
            this.config.maxParticles = Math.min(this.config.maxParticles + 1, 8);
            this.config.enableParticles = true;
            console.log('Performance adjusted: increased particles');
        }
    }
    
    getConfig() {
        return this.config;
    }
}

// 导出配置类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceConfig;
} else {
    window.PerformanceConfig = PerformanceConfig;
}