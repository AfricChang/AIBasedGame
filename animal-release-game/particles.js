/**
 * 粒子效果系统 - 为动物消消消游戏提供视觉特效
 */
class ParticleSystem {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.animationId = null;
        this.isRunning = false;
        
        this.setupCanvas();
        this.startAnimation();
    }

    /**
     * 设置画布
     */
    setupCanvas() {
        // 设置画布大小以覆盖游戏区域
        const gameBoard = document.querySelector('.game-board');
        if (gameBoard) {
            const rect = gameBoard.getBoundingClientRect();
            this.canvas.width = rect.width;
            this.canvas.height = rect.height;
            this.canvas.style.position = 'absolute';
            this.canvas.style.top = '0';
            this.canvas.style.left = '0';
            this.canvas.style.pointerEvents = 'none';
            this.canvas.style.zIndex = '10';
        }
    }

    /**
     * 创建粒子
     */
    createParticle(x, y, options = {}) {
        const particle = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * (options.speed || 4),
            vy: (Math.random() - 0.5) * (options.speed || 4) - 2,
            life: options.life || 1.0,
            maxLife: options.life || 1.0,
            size: options.size || Math.random() * 4 + 2,
            color: options.color || this.getRandomColor(),
            gravity: options.gravity || 0.1,
            bounce: options.bounce || 0.7,
            type: options.type || 'circle'
        };
        
        this.particles.push(particle);
    }

    /**
     * 获取随机颜色
     */
    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    /**
     * 创建爆炸效果
     */
    createExplosion(x, y, count = 15, options = {}) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = options.speed || 3;
            
            this.createParticle(x, y, {
                vx: Math.cos(angle) * speed * (0.5 + Math.random() * 0.5),
                vy: Math.sin(angle) * speed * (0.5 + Math.random() * 0.5),
                life: 0.8 + Math.random() * 0.4,
                size: 3 + Math.random() * 3,
                color: options.color || this.getRandomColor(),
                gravity: 0.05,
                type: 'star'
            });
        }
    }

    /**
     * 创建连击效果
     */
    createComboEffect(x, y, comboCount) {
        const colors = ['#FFD700', '#FF6347', '#FF1493', '#9370DB'];
        const color = colors[Math.min(comboCount - 1, colors.length - 1)];
        
        // 创建环形粒子效果
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const radius = 30 + comboCount * 10;
            
            this.createParticle(
                x + Math.cos(angle) * radius,
                y + Math.sin(angle) * radius,
                {
                    vx: Math.cos(angle) * 2,
                    vy: Math.sin(angle) * 2,
                    life: 1.2,
                    size: 4 + comboCount,
                    color: color,
                    gravity: 0,
                    type: 'diamond'
                }
            );
        }
    }

    /**
     * 创建路径轨迹效果
     */
    createTrail(startX, startY, endX, endY) {
        const distance = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
        const steps = Math.floor(distance / 10);
        
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            const x = startX + (endX - startX) * progress;
            const y = startY + (endY - startY) * progress;
            
            setTimeout(() => {
                this.createParticle(x, y, {
                    vx: (Math.random() - 0.5) * 2,
                    vy: (Math.random() - 0.5) * 2,
                    life: 0.5,
                    size: 2,
                    color: '#4ECDC4',
                    gravity: 0.02,
                    type: 'circle'
                });
            }, i * 50);
        }
    }

    /**
     * 创建道具使用效果
     */
    createToolEffect(x, y, toolType) {
        let color, count, pattern;
        
        switch (toolType) {
            case 'shuffle':
                color = '#9B59B6';
                count = 25;
                pattern = 'spiral';
                break;
            case 'flip':
                color = '#E67E22';
                count = 20;
                pattern = 'wave';
                break;
            case 'hint':
                color = '#F1C40F';
                count = 15;
                pattern = 'pulse';
                break;
            default:
                color = '#3498DB';
                count = 20;
                pattern = 'explosion';
        }
        
        this.createPatternEffect(x, y, count, color, pattern);
    }

    /**
     * 创建图案效果
     */
    createPatternEffect(x, y, count, color, pattern) {
        for (let i = 0; i < count; i++) {
            let vx, vy;
            
            switch (pattern) {
                case 'spiral':
                    const angle = (Math.PI * 2 * i) / count + Date.now() * 0.01;
                    const radius = 2 + i * 0.5;
                    vx = Math.cos(angle) * radius;
                    vy = Math.sin(angle) * radius;
                    break;
                case 'wave':
                    vx = Math.sin(i * 0.5) * 4;
                    vy = Math.cos(i * 0.3) * 4;
                    break;
                case 'pulse':
                    const pulseAngle = (Math.PI * 2 * i) / count;
                    vx = Math.cos(pulseAngle) * 3;
                    vy = Math.sin(pulseAngle) * 3;
                    break;
                default:
                    vx = (Math.random() - 0.5) * 6;
                    vy = (Math.random() - 0.5) * 6;
            }
            
            this.createParticle(x, y, {
                vx: vx,
                vy: vy,
                life: 1.0 + Math.random() * 0.5,
                size: 3 + Math.random() * 2,
                color: color,
                gravity: 0.05,
                type: 'star'
            });
        }
    }

    /**
     * 更新粒子
     */
    updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // 更新位置
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += particle.gravity;
            
            // 边界反弹
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -particle.bounce;
                particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            }
            
            if (particle.y > this.canvas.height) {
                particle.vy *= -particle.bounce;
                particle.y = this.canvas.height;
            }
            
            // 更新生命值
            particle.life -= 0.016; // 约60fps
            
            // 移除死亡粒子
            if (particle.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    /**
     * 渲染粒子
     */
    renderParticles() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.save();
            
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            
            this.ctx.translate(particle.x, particle.y);
            
            switch (particle.type) {
                case 'circle':
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, particle.size, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
                    
                case 'star':
                    this.drawStar(particle.size);
                    break;
                    
                case 'diamond':
                    this.drawDiamond(particle.size);
                    break;
            }
            
            this.ctx.restore();
        });
    }

    /**
     * 绘制星形
     */
    drawStar(size) {
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            const innerAngle = ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
            const innerX = Math.cos(innerAngle) * size * 0.5;
            const innerY = Math.sin(innerAngle) * size * 0.5;
            this.ctx.lineTo(innerX, innerY);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 绘制菱形
     */
    drawDiamond(size) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);
        this.ctx.lineTo(size, 0);
        this.ctx.lineTo(0, size);
        this.ctx.lineTo(-size, 0);
        this.ctx.closePath();
        this.ctx.fill();
    }

    /**
     * 开始动画循环
     */
    startAnimation() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        const animate = () => {
            if (!this.isRunning) return;
            
            this.updateParticles();
            this.renderParticles();
            
            this.animationId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    /**
     * 停止动画
     */
    stopAnimation() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    /**
     * 清除所有粒子
     */
    clear() {
        this.particles = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * 调整画布大小
     */
    resize() {
        this.setupCanvas();
    }
}

// 导出粒子系统
window.ParticleSystem = ParticleSystem;