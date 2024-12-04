class RainDrop {
    constructor(canvas, x, y) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.speed = 15 + Math.random() * 5;
        this.length = 15 + Math.random() * 5;
        this.width = 1 + Math.random();
        this.bounced = false;
        this.isDead = false;
    }

    update(containerTop) {
        this.y += this.speed;
        
        // Get container bounds
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const isOverContainer = this.x >= containerRect.left && 
                              this.x <= containerRect.right;

        // Handle drops over container
        if (isOverContainer && !this.bounced && this.y > containerTop) {
            this.bounced = true;
            this.speed = -this.speed * 0.3;
            return true;
        }

        // Handle drops that miss container
        if (!isOverContainer && this.y > this.canvas.height) {
            this.isDead = true;
            return false;
        }

        // Handle bounced drops
        if (this.bounced) {
            this.speed += 0.8;
            if (Math.abs(this.speed) < 0.5) {
                this.isDead = true;
                return false;
            }
        }

        return false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(174, 194, 224, 0.5)';
        ctx.lineWidth = this.width;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();
    }
}

class RainSystem {
    constructor() {
        this.canvas = document.getElementById('rainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.drops = [];
        this.splashes = [];
        this.resizeCanvas();
        this.container = document.querySelector('.container');
        this.containerTop = this.container.getBoundingClientRect().top;

        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createDrop() {
        const x = Math.random() * this.canvas.width;
        const y = -20;
        this.drops.push(new RainDrop(this.canvas, x, y));
    }

    createSplash(x, y) {
        const particleCount = 3 + Math.floor(Math.random() * 3);
        const particles = [];

        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI / 4) + (Math.random() * Math.PI / 2);
            const speed = 1 + Math.random() * 2;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: -Math.sin(angle) * speed,
                alpha: 1
            });
        }

        this.splashes.push(particles);
    }

    update() {
        if (Math.random() < 0.5) {
            this.createDrop();
        }

        this.drops = this.drops.filter(drop => {
            const shouldCreateSplash = drop.update(this.containerTop);
            if (shouldCreateSplash) {
                this.createSplash(drop.x, drop.y);
            }
            return !drop.isDead;
        });

        this.splashes = this.splashes.filter(particles => {
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.1;
                p.alpha -= 0.03;
            });
            return particles.some(p => p.alpha > 0);
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drops.forEach(drop => drop.draw(this.ctx));

        this.splashes.forEach(particles => {
            particles.forEach(p => {
                this.ctx.beginPath();
                this.ctx.strokeStyle = `rgba(174, 194, 224, ${p.alpha})`;
                this.ctx.lineWidth = 1;
                this.ctx.moveTo(p.x, p.y);
                this.ctx.lineTo(p.x + p.vx, p.y + p.vy);
                this.ctx.stroke();
            });
        });
    }

    animate() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

class SnowFlake {
    constructor(canvas, x, y) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.size = 2 + Math.random() * 3;
        this.speed = 1 + Math.random() * 2;
        this.wind = 0;
        this.swayAngle = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.02 + Math.random() * 0.02;
        this.settled = false;
        this.settledX = 0;
        this.settledY = 0;
        this.opacity = 0.8;
        this.fadeStartTime = null;
        this.lifetime = 5000 + Math.random() * 5000; // Random lifetime between 5-10 seconds
    }

    update(containerTop, containerBottom, accumulation) {
        if (this.settled) {
            if (!this.fadeStartTime) {
                this.fadeStartTime = Date.now();
            }
            
            const elapsed = Date.now() - this.fadeStartTime;
            if (elapsed > this.lifetime) {
                this.opacity = Math.max(0, 0.8 * (1 - (elapsed - this.lifetime) / 1000));
                if (this.opacity <= 0) {
                    return true; // Remove flake
                }
            }
            return false;
        }

        // Update sway motion
        this.swayAngle += this.swaySpeed;
        this.wind = Math.sin(this.swayAngle) * 0.5;
        this.x += this.wind;
        this.y += this.speed;

        // Get container bounds
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const isOverContainer = this.x >= containerRect.left && 
                              this.x <= containerRect.right;

        // Check for settling
        if (isOverContainer) {
            const relativeX = Math.floor(this.x - containerRect.left);
            if (relativeX >= 0 && relativeX < accumulation.length) {
                const settlementY = containerTop + accumulation[relativeX];
                
                if (this.y >= settlementY) {
                    this.settled = true;
                    this.settledX = this.x;
                    this.settledY = settlementY;
                    return true;
                }
            }
        } else if (this.y > this.canvas.height) {
            // Remove flakes that fall off screen
            this.settled = true;
            return false;
        }

        return false;
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.arc(
            this.settled ? this.settledX : this.x,
            this.settled ? this.settledY : this.y,
            this.size,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
}

class SnowSystem {
    constructor() {
        console.log('Initializing SnowSystem');
        this.canvas = document.getElementById('rainCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.flakes = [];
        this.settledFlakes = [];
        
        // Wait for container to be available
        const initSystem = () => {
            this.container = document.querySelector('.container');
            if (!this.container) {
                console.error('Container not found, retrying...');
                setTimeout(initSystem, 100);
                return;
            }
            
            this.containerRect = this.container.getBoundingClientRect();
            this.accumulation = new Array(Math.ceil(this.containerRect.width)).fill(0);
            this.maxSnowHeight = 50;
            this.isAnimating = false;

            this.resizeCanvas();
            window.addEventListener('resize', () => this.resizeCanvas());
            this.start();
        };

        // Start initialization
        initSystem();
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.containerRect = this.container.getBoundingClientRect();
    }

    createFlake() {
        const x = Math.random() * this.canvas.width;
        const y = -20;
        this.flakes.push(new SnowFlake(this.canvas, x, y));
    }

    update() {
        if (Math.random() < 0.3) {
            this.createFlake();
        }

        // Update and remove faded flakes
        this.settledFlakes = this.settledFlakes.filter(flake => !flake.update());
        
        // Update falling flakes
        for (let i = this.flakes.length - 1; i >= 0; i--) {
            const flake = this.flakes[i];
            if (flake.update(this.containerRect.top, this.containerRect.bottom, this.accumulation)) {
                if (flake.settled) {
                    this.settledFlakes.push(flake);
                }
                this.flakes.splice(i, 1);
            }
        }
    }

    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw all flakes
        [...this.settledFlakes, ...this.flakes].forEach(flake => {
            flake.draw(this.ctx);
        });
    }

    start() {
        console.log('Starting animation');
        this.isAnimating = true;
        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', () => {
    // new SnowSystem();
    
    const rainSystem = new RainSystem();
    rainSystem.animate();
});