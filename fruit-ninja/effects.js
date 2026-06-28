class EffectsManager {
    constructor(ctx, canvas) {
        this.ctx = ctx;
        this.canvas = canvas;
        this.effects = [];
    }
    
    // 创建切割效果
    createSliceEffect(x, y, angle, color) {
        const effect = {
            type: 'slice',
            x: x,
            y: y,
            angle: angle,
            color: color,
            life: 20,
            maxLife: 20,
            width: 80,
            height: 4
        };
        this.effects.push(effect);
    }
    
    // 创建水果爆炸效果
    createFruitExplosion(x, y, color, emoji) {
        // 创建水果片段
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 / 6) * i;
            const speed = 3 + Math.random() * 4;
            
            this.effects.push({
                type: 'fruitPiece',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                emoji: emoji,
                rotation: Math.random() * Math.PI * 2,
                rotationSpeed: (Math.random() - 0.5) * 0.3,
                life: 60,
                maxLife: 60,
                scale: 0.8 + Math.random() * 0.4
            });
        }
        
        // 创建彩色粒子
        for (let i = 0; i < 12; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 6;
            
            this.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 1,
                color: color,
                size: 2 + Math.random() * 4,
                life: 40,
                maxLife: 40
            });
        }
    }
    
    // 创建炸弹爆炸效果
    createBombExplosion(x, y) {
        // 创建火花效果
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 4 + Math.random() * 8;
            
            this.effects.push({
                type: 'spark',
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: ['#ff4757', '#ff6b35', '#ffa502', '#ff3838'][Math.floor(Math.random() * 4)],
                size: 3 + Math.random() * 3,
                life: 50,
                maxLife: 50
            });
        }
        
        // 创建冲击波
        this.effects.push({
            type: 'shockwave',
            x: x,
            y: y,
            radius: 0,
            maxRadius: 100,
            life: 30,
            maxLife: 30
        });
    }
    
    // 创建连击效果
    createComboEffect(x, y, comboCount) {
        const colors = ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'];
        const color = colors[Math.min(comboCount - 1, colors.length - 1)];
        
        this.effects.push({
            type: 'combo',
            x: x,
            y: y,
            text: `${comboCount}x连击!`,
            color: color,
            scale: 0.5,
            targetScale: 1.5,
            life: 60,
            maxLife: 60,
            vy: -2
        });
        
        // 添加星星效果
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 / 8) * i;
            const distance = 30 + Math.random() * 20;
            
            this.effects.push({
                type: 'star',
                x: x + Math.cos(angle) * distance,
                y: y + Math.sin(angle) * distance,
                color: color,
                size: 4 + Math.random() * 4,
                life: 40,
                maxLife: 40,
                twinkle: Math.random() * Math.PI * 2
            });
        }
    }
    
    // 创建得分效果
    createScoreEffect(x, y, points) {
        this.effects.push({
            type: 'score',
            x: x,
            y: y,
            text: `+${points}`,
            color: '#fff',
            scale: 1,
            life: 40,
            maxLife: 40,
            vy: -3
        });
    }
    
    // 更新所有效果
    update() {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            effect.life--;
            
            // 根据效果类型更新
            switch (effect.type) {
                case 'fruitPiece':
                    effect.x += effect.vx;
                    effect.y += effect.vy;
                    effect.vy += 0.3; // 重力
                    effect.rotation += effect.rotationSpeed;
                    break;
                    
                case 'particle':
                case 'spark':
                    effect.x += effect.vx;
                    effect.y += effect.vy;
                    effect.vy += 0.2; // 重力
                    effect.vx *= 0.98; // 空气阻力
                    break;
                    
                case 'shockwave':
                    const progress = 1 - (effect.life / effect.maxLife);
                    effect.radius = effect.maxRadius * progress;
                    break;
                    
                case 'combo':
                    effect.y += effect.vy;
                    effect.scale = effect.targetScale * (1 - effect.life / effect.maxLife) + 0.5;
                    break;
                    
                case 'score':
                    effect.y += effect.vy;
                    effect.vy *= 0.95;
                    break;
                    
                case 'star':
                    effect.twinkle += 0.2;
                    break;
            }
            
            // 移除生命结束的效果
            if (effect.life <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    // 绘制所有效果
    draw() {
        this.effects.forEach(effect => {
            const alpha = effect.life / effect.maxLife;
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            switch (effect.type) {
                case 'slice':
                    this.drawSlice(effect);
                    break;
                case 'fruitPiece':
                    this.drawFruitPiece(effect);
                    break;
                case 'particle':
                case 'spark':
                    this.drawParticle(effect);
                    break;
                case 'shockwave':
                    this.drawShockwave(effect);
                    break;
                case 'combo':
                    this.drawCombo(effect);
                    break;
                case 'score':
                    this.drawScore(effect);
                    break;
                case 'star':
                    this.drawStar(effect);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    drawSlice(effect) {
        this.ctx.save();
        this.ctx.translate(effect.x, effect.y);
        this.ctx.rotate(effect.angle);
        
        const gradient = this.ctx.createLinearGradient(-effect.width/2, 0, effect.width/2, 0);
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'transparent');
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(-effect.width/2, -effect.height/2, effect.width, effect.height);
        this.ctx.restore();
    }
    
    drawFruitPiece(effect) {
        this.ctx.save();
        this.ctx.translate(effect.x, effect.y);
        this.ctx.rotate(effect.rotation);
        this.ctx.scale(effect.scale, effect.scale);
        
        this.ctx.font = '20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(effect.emoji, 0, 0);
        this.ctx.restore();
    }
    
    drawParticle(effect) {
        this.ctx.fillStyle = effect.color;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.size, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawShockwave(effect) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawCombo(effect) {
        this.ctx.save();
        this.ctx.translate(effect.x, effect.y);
        this.ctx.scale(effect.scale, effect.scale);
        
        // 绘制文字阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(effect.text, 2, 2);
        
        // 绘制文字
        this.ctx.fillStyle = effect.color;
        this.ctx.fillText(effect.text, 0, 0);
        this.ctx.restore();
    }
    
    drawScore(effect) {
        this.ctx.save();
        this.ctx.translate(effect.x, effect.y);
        this.ctx.scale(effect.scale, effect.scale);
        
        // 绘制文字阴影
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(effect.text, 1, 1);
        
        // 绘制文字
        this.ctx.fillStyle = effect.color;
        this.ctx.fillText(effect.text, 0, 0);
        this.ctx.restore();
    }
    
    drawStar(effect) {
        const twinkleAlpha = (Math.sin(effect.twinkle) + 1) / 2;
        this.ctx.globalAlpha *= twinkleAlpha;
        
        this.ctx.fillStyle = effect.color;
        this.ctx.save();
        this.ctx.translate(effect.x, effect.y);
        
        // 绘制星星形状
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (i * Math.PI * 2) / 5 - Math.PI / 2;
            const x = Math.cos(angle) * effect.size;
            const y = Math.sin(angle) * effect.size;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
            
            const innerAngle = ((i + 0.5) * Math.PI * 2) / 5 - Math.PI / 2;
            const innerX = Math.cos(innerAngle) * (effect.size * 0.4);
            const innerY = Math.sin(innerAngle) * (effect.size * 0.4);
            this.ctx.lineTo(innerX, innerY);
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    
    // 清除所有效果
    clear() {
        this.effects = [];
    }
}

// 导出效果管理器
window.EffectsManager = EffectsManager;