/**
 * @file This file contains all the drawing functions for the game assets.
 */

const GameAssets = {
    drawPlayer(ctx, player) {
        const { x, y, width, height } = player;
        // 保存当前状态
        ctx.save();
        
        // 飞机主体 - 使用渐变色
        const gradient = ctx.createLinearGradient(x - width/2, y - height/2, x + width/2, y + height/2);
        gradient.addColorStop(0, '#4a90e2');
        gradient.addColorStop(0.5, '#357abd');
        gradient.addColorStop(1, '#1e5f99');
        
        // 绘制飞机主体（椭圆形）
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, width/2, height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 飞机机头（三角形）
        ctx.fillStyle = '#2c5aa0';
        ctx.beginPath();
        ctx.moveTo(x, y - height/2 - 8);
        ctx.lineTo(x - 8, y - height/2 + 5);
        ctx.lineTo(x + 8, y - height/2 + 5);
        ctx.closePath();
        ctx.fill();
        
        // 飞机机翼
        ctx.fillStyle = '#5ba3f5';
        ctx.beginPath();
        ctx.ellipse(x - 12, y + 5, 8, 15, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 12, y + 5, 8, 15, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 飞机尾翼
        ctx.fillStyle = '#3d7bc6';
        ctx.beginPath();
        ctx.ellipse(x - 6, y + height/2 - 3, 4, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 6, y + height/2 - 3, 4, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 驾驶舱窗口
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.ellipse(x, y - 5, 6, 8, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 飞机装饰线条
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x - width/3, y - height/4);
        ctx.lineTo(x + width/3, y - height/4);
        ctx.stroke();
        
        // 恢复状态
        ctx.restore();
    },

    drawBullet(ctx, bullet) {
        const { x, y, width, height, isEnemy } = bullet;
        if (isEnemy) {
            ctx.fillStyle = '#ff4444'; // 红色敌机子弹
        } else {
            ctx.fillStyle = '#ffff00'; // 黄色玩家子弹
        }
        ctx.fillRect(x - width / 2, y - height / 2, width, height);
    },

    drawEnemy(ctx, enemy) {
        ctx.save();
        
        switch(enemy.type) {
            case 'scout':
                this.drawScout(ctx, enemy);
                break;
            case 'fighter':
                this.drawFighter(ctx, enemy);
                break;
            case 'bomber':
                this.drawBomber(ctx, enemy);
                break;
            case 'gunship':
                this.drawGunship(ctx, enemy);
                break;
            case 'boss':
                this.drawBoss(ctx, enemy);
                break;
            default:
                this.drawBasicEnemy(ctx, enemy);
        }
        
        // 绘制血量条（多血量敌机）
        if (enemy.maxHealth > 1) {
            this.drawHealthBar(ctx, enemy);
        }
        
        ctx.restore();
    },

    drawScout(ctx, enemy) {
        const { x, y, width, height } = enemy;
        const gradient = ctx.createLinearGradient(x - width/2, y - height/2, x + width/2, y + height/2);
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#00cc66');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        // 机头朝下：顶点在下方
        ctx.moveTo(x, y + height/2);
        ctx.lineTo(x - width/2, y - height/2);
        ctx.lineTo(x + width/2, y - height/2);
        ctx.closePath();
        ctx.fill();
        
        // 引擎光（位置调整到机尾上方）
        ctx.fillStyle = '#88ffaa';
        ctx.beginPath();
        ctx.ellipse(x, y - height/3, 2, 3, 0, 0, 2 * Math.PI);
        ctx.fill();
    },

    drawFighter(ctx, enemy) {
        const { x, y, width, height } = enemy;
        const gradient = ctx.createLinearGradient(x - width/2, y - height/2, x + width/2, y + height/2);
        gradient.addColorStop(0, '#ff4444');
        gradient.addColorStop(1, '#cc0000');
        
        // 主体
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, width/2, height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 机翼
        ctx.fillStyle = '#ff6666';
        ctx.beginPath();
        ctx.ellipse(x - 10, y + 5, 6, 12, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(x + 10, y + 5, 6, 12, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 驾驶舱
        ctx.fillStyle = '#ffaaaa';
        ctx.beginPath();
        ctx.ellipse(x, y - 3, 4, 6, 0, 0, 2 * Math.PI);
        ctx.fill();
    },

    drawBomber(ctx, enemy) {
        const { x, y, width, height } = enemy;
        const gradient = ctx.createLinearGradient(x - width/2, y - height/2, x + width/2, y + height/2);
        gradient.addColorStop(0, '#ff8800');
        gradient.addColorStop(1, '#cc6600');
        
        // 主体
        ctx.fillStyle = gradient;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // 机翼
        ctx.fillStyle = '#ffaa44';
        ctx.fillRect(x - width/2 - 5, y, width + 10, 8);
        
        // 引擎（减小尾焰效果）
        ctx.fillStyle = '#ff6600';
        ctx.fillRect(x - 6, y + height/2 - 1, 2, 4);
        ctx.fillRect(x + 4, y + height/2 - 1, 2, 4);
        
        // 驾驶舱
        ctx.fillStyle = '#ffcc88';
        ctx.fillRect(x - 6, y - height/2, 12, 10);
    },

    drawGunship(ctx, enemy) {
        const { x, y, width, height } = enemy;
        const gradient = ctx.createLinearGradient(x - width/2, y - height/2, x + width/2, y + height/2);
        gradient.addColorStop(0, '#8844ff');
        gradient.addColorStop(1, '#6622cc');
        
        // 主体
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(x, y, width/2, height/2, 0, 0, 2 * Math.PI);
        ctx.fill();
        
        // 武器系统
        ctx.fillStyle = '#aa66ff';
        ctx.fillRect(x - 3, y + height/2, 6, 8);
        
        // 侧翼武器
        ctx.fillStyle = '#9955ee';
        ctx.fillRect(x - 12, y + 3, 4, 10);
        ctx.fillRect(x + 8, y + 3, 4, 10);
        
        // 驾驶舱
        ctx.fillStyle = '#ccaaff';
        ctx.beginPath();
        ctx.ellipse(x, y - 5, 5, 7, 0, 0, 2 * Math.PI);
        ctx.fill();
    },

    drawBoss(ctx, enemy) {
        const { x, y, width, height } = enemy;
        const gradient = ctx.createLinearGradient(x - width/2, y - height/2, x + width/2, y + height/2);
        gradient.addColorStop(0, '#444444');
        gradient.addColorStop(0.5, '#222222');
        gradient.addColorStop(1, '#000000');
        
        // 主体
        ctx.fillStyle = gradient;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // 大型机翼
        ctx.fillStyle = '#666666';
        ctx.fillRect(x - width/2 - 8, y - 5, width + 16, 12);
        
        // 多个引擎（减小尾焰效果）
        ctx.fillStyle = '#ff4444';
        for (let i = -1; i <= 1; i++) {
            ctx.fillRect(x + i * 8 - 1, y + height/2 - 1, 2, 3);
        }
        
        // 装甲板
        ctx.fillStyle = '#888888';
        ctx.fillRect(x - width/3, y - height/3, width * 2/3, height * 2/3);
        
        // 驾驶舱
        ctx.fillStyle = '#ff8888';
        ctx.beginPath();
        ctx.ellipse(x, y - 8, 8, 10, 0, 0, 2 * Math.PI);
        ctx.fill();
    },

    drawBasicEnemy(ctx, enemy) {
        const { x, y, width, height } = enemy;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x - width / 2, y - height / 2, width, height);
        
        ctx.fillStyle = '#aa0000';
        ctx.fillRect(x - 3, y - height / 2, 6, 15);
        ctx.fillRect(x - 12, y, 24, 3);
    },

    drawHealthBar(ctx, enemy) {
        const { x, y, width, height, health, maxHealth } = enemy;
        const barWidth = width;
        const barHeight = 4;
        const healthPercent = health / maxHealth;
        
        // 背景
        ctx.fillStyle = '#333333';
        ctx.fillRect(x - barWidth/2, y - height/2 - 8, barWidth, barHeight);
        
        // 血量
        ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillRect(x - barWidth/2, y - height/2 - 8, barWidth * healthPercent, barHeight);
    },

    drawMissile(ctx, missile) {
        const { x, y, width, height, velocityX, velocityY, trail } = missile;
        // 绘制尾迹
        for (let i = 0; i < trail.length; i++) {
            const alpha = (i + 1) / trail.length;
            const point = trail[i];
            
            ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.6})`;
            ctx.beginPath();
            ctx.arc(point.x, point.y, 2 * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制导弹主体
        const halfWidth = width / 2;
        const halfHeight = height / 2;
        
        // 计算导弹朝向角度
        const angle = Math.atan2(velocityY, velocityX) + Math.PI / 2;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        
        // 导弹主体（红色）
        ctx.fillStyle = '#ff3300';
        ctx.fillRect(-halfWidth, -halfHeight, width, height);
        
        // 导弹头部（更亮的红色）
        ctx.fillStyle = '#ff6600';
        ctx.beginPath();
        ctx.moveTo(0, -halfHeight);
        ctx.lineTo(-halfWidth * 0.7, -halfHeight + 6);
        ctx.lineTo(halfWidth * 0.7, -halfHeight + 6);
        ctx.closePath();
        ctx.fill();
        
        // 导弹尾部推进器光效
        ctx.fillStyle = '#00aaff';
        ctx.fillRect(-2, halfHeight - 4, 4, 8);
        
        ctx.restore();
        
        // 绘制导弹光晕效果
        ctx.fillStyle = 'rgba(255, 100, 0, 0.4)';
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 额外的外层光晕
        ctx.fillStyle = 'rgba(255, 50, 0, 0.2)';
        ctx.beginPath();
        ctx.arc(x, y, 18, 0, Math.PI * 2);
        ctx.fill();
    },

    drawObstacle(ctx, obstacle) {
        const { x, y, width, height, rotation } = obstacle;
        ctx.save();
        
        // 移动到障碍物中心
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // 绘制主体 - 灰色金属质感
        const gradient = ctx.createLinearGradient(-width/2, -height/2, width/2, height/2);
        gradient.addColorStop(0, '#666666');
        gradient.addColorStop(0.5, '#888888');
        gradient.addColorStop(1, '#444444');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-width/2, -height/2, width, height);
        
        // 绘制边框
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.strokeRect(-width/2, -height/2, width, height);
        
        // 绘制警告标识
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('!', 0, 5);
        
        // 绘制装饰线条
        ctx.strokeStyle = '#aaaaaa';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-width/3, -height/3);
        ctx.lineTo(width/3, -height/3);
        ctx.moveTo(-width/3, height/3);
        ctx.lineTo(width/3, height/3);
        ctx.stroke();
        
                ctx.restore();
    },

    drawParticle(ctx, particle) {
        const { x, y, life, maxLife, color } = particle;
        const alpha = life / maxLife;
        
        ctx.fillStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.arc(x, y, 2 * alpha, 0, Math.PI * 2);
                ctx.fill();
    },

    drawPowerUp(ctx, powerUp) {
        const { x, y, type } = powerUp;
        ctx.save();
        ctx.translate(x, y);

        // Base shape
        ctx.fillStyle = '#ffcc00';
        ctx.beginPath();
        ctx.arc(0, 0, 15, 0, Math.PI * 2);
        ctx.fill();

        // Icon based on type
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let symbol = '';
        switch (type) {
            case 'shield':
                symbol = 'S';
                break;
            case 'bullet':
                symbol = 'B';
                break;
            case 'wingman':
                symbol = 'W';
                break;
            case 'missile':
                symbol = 'M';
                break;
        }
        ctx.fillText(symbol, 0, 1);

                ctx.restore();
    },

    drawBackground(ctx, width, height) {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = 'rgba(0, 4, 40, 1)';
        ctx.fillRect(0, 0, width, height);
    },

    drawStars(ctx, width, height) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % width;
            const y = (i * 73 + Date.now() * 0.01) % height;
            ctx.fillRect(x, y, 1, 1);
        }
    },

    drawShield(ctx, player) {
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#00FFFF';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(player.x, player.y, 35, 0, Math.PI * 2);
        ctx.stroke();

        // 添加闪烁效果
        const time = Date.now() * 0.01;
        ctx.globalAlpha = 0.3 + Math.sin(time) * 0.2;
        ctx.fillStyle = '#00FFFF';
        ctx.fill();
        ctx.restore();
    },

    drawWingman(ctx, wingman) {
        const { x, y, width, height } = wingman;
        ctx.save();
        ctx.translate(x, y);

        // Wingman body
        ctx.fillStyle = '#c0c0c0';
        ctx.beginPath();
        ctx.moveTo(0, -height / 2);
        ctx.lineTo(-width / 2, height / 2);
        ctx.lineTo(width / 2, height / 2);
        ctx.closePath();
        ctx.fill();

        // Cockpit
        ctx.fillStyle = '#87ceeb';
        ctx.beginPath();
        ctx.arc(0, -5, 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
};