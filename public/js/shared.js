// =======================================
// >> COOKIE HELPER FUNCTIONS
// =======================================

function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${value};expires=${expires.toUTCString()};path=/`;
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? match[2] : null;
}

// =======================================
// >> TYPEWRITER EFFECT
// =======================================

function initTypewriter() {
    const headers = document.querySelectorAll('.subpage-header h1');
    
    headers.forEach(header => {
        const originalText = header.textContent;
        
        // Clear header
        header.textContent = '';
        
        // Add prompt span
        const prompt = document.createElement('span');
        prompt.className = 'prompt';
        prompt.textContent = '> ';
        header.appendChild(prompt);
        
        // Add text container
        const textContainer = document.createElement('span');
        textContainer.className = 'typed-text';
        header.appendChild(textContainer);
        
        // Add cursor
        const cursor = document.createElement('span');
        cursor.className = 'cursor';
        header.appendChild(cursor);
        
        let i = 0;
        const typeChar = () => {
            if (i < originalText.length) {
                textContainer.textContent += originalText.charAt(i);
                i++;
                setTimeout(typeChar, 100);
            }
        };
        
        setTimeout(typeChar, 500);
    });
}

// =======================================
// >> RAIN SYSTEM 
// =======================================

class RainDrop {
    constructor(canvas, x, y, speedMultiplier = 1) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.baseSpeed = 15 + Math.random() * 5;
        this.speedMultiplier = speedMultiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
        this.length = 15 + Math.random() * 5;
        this.width = 1 + Math.random();
        this.bounced = false;
        this.isDead = false;
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
    }

    update(containerTop) {
        this.y += this.speed;
        
        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const isOverContainer = this.x >= containerRect.left && 
                              this.x <= containerRect.right;

        if (isOverContainer && !this.bounced && this.y > containerTop) {
            this.bounced = true;
            this.speed = -this.speed * 0.3;
            return true;
        }

        if (!isOverContainer && this.y > this.canvas.height) {
            this.isDead = true;
            return false;
        }

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
        this.isAnimating = false;
        this.canvas = document.getElementById('rainCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.drops = [];
        this.splashes = [];
        this.speedMultiplier = 1;
        this.resizeCanvas();
        this.container = document.querySelector('.container');
        this.containerTop = this.container.getBoundingClientRect().top;

        window.addEventListener('resize', () => this.resizeCanvas());
        
        window.addEventListener('scroll', () => this.updateContainerPosition());
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.updateContainerPosition();
        });

        this.resizeObserver = new ResizeObserver(() => {
            this.updateContainerPosition();
        });
        this.resizeObserver.observe(this.container);
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.drops.forEach(drop => drop.setSpeedMultiplier(multiplier));
    }

    updateContainerPosition() {
        const oldTop = this.containerTop;
        this.containerTop = this.container.getBoundingClientRect().top;
        
        const diff = this.containerTop - oldTop;
        this.splashes.forEach(particles => {
            particles.forEach(p => {
                p.y += diff;
            });
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createDrop() {
        const x = Math.random() * this.canvas.width;
        const y = -20;
        // Pass current speed multiplier to new drops
        this.drops.push(new RainDrop(this.canvas, x, y, this.speedMultiplier));
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
        if (!this.isAnimating) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    start() {
        this.isAnimating = true;
        this.animate();
    }

    stop() {
        this.isAnimating = false;
        this.drops = [];
        this.splashes = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// =======================================
// >> SNOW SYSTEM 
// =======================================

class SnowFlake {
    constructor(canvas, x, y, speedMultiplier = 1) {
        this.canvas = canvas;
        this.x = x;
        this.y = y;
        this.baseSpeed = 1 + Math.random() * 2;
        this.speedMultiplier = speedMultiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
        this.size = 2 + Math.random() * 3;
        this.wind = 0;
        this.swayAngle = Math.random() * Math.PI * 2;
        this.swaySpeed = 0.02 + Math.random() * 0.02;
        this.settled = false;
        this.settledX = 0;
        this.settledY = 0;
        this.opacity = 0.8;
        this.fadeStartTime = null;
        this.lifetime = 5000 + Math.random() * 5000;
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.speed = this.baseSpeed * this.speedMultiplier;
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
                    return true;
                }
            }
            return false;
        }


        this.swayAngle += this.swaySpeed;
        this.wind = Math.sin(this.swayAngle) * 0.5;
        this.x += this.wind;
        this.y += this.speed;

        const container = document.querySelector('.container');
        const containerRect = container.getBoundingClientRect();
        const isOverContainer = this.x >= containerRect.left && 
                              this.x <= containerRect.right;

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
        this.canvas = document.getElementById('rainCanvas');
        if (!this.canvas) {
            console.error('Canvas element not found');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        this.flakes = [];
        this.settledFlakes = [];
        
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

        initSystem();
        
        this.lastScrollY = window.scrollY;
        window.addEventListener('scroll', () => this.updateContainerPosition());
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            this.updateContainerPosition();
        });

        this.resizeObserver = new ResizeObserver(() => {
            this.containerRect = this.container.getBoundingClientRect();
            const oldTop = this.containerTop;
            this.containerTop = this.containerRect.top;

            const diff = this.containerTop - oldTop;
            this.settledFlakes.forEach(flake => {
                if (flake.settled) {
                    flake.settledY += diff;
                }
            });
        });
        this.resizeObserver.observe(this.container);
    }

    setSpeedMultiplier(multiplier) {
        this.speedMultiplier = multiplier;
        this.flakes.forEach(flake => flake.setSpeedMultiplier(multiplier));
    }

    updateContainerPosition() {
        this.containerRect = this.container.getBoundingClientRect();
        this.settledFlakes.forEach(flake => {
            if (flake.settled) {
                flake.settledY += (window.scrollY - this.lastScrollY);
            }
        });
        this.lastScrollY = window.scrollY;
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.containerRect = this.container.getBoundingClientRect();
    }

    createFlake() {
        const x = Math.random() * this.canvas.width;
        const y = -20;
        this.flakes.push(new SnowFlake(this.canvas, x, y, this.speedMultiplier));
    }

    update() {
        if (!this.isAnimating) return;

        if (Math.random() < 0.3) {
            this.createFlake();
        }

        this.containerRect = this.container.getBoundingClientRect();

        this.settledFlakes = this.settledFlakes.filter(flake => {
            const remove = flake.update(this.containerRect.top, this.containerRect.bottom, this.accumulation);
            return !remove;
        });
        
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
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        [...this.settledFlakes, ...this.flakes].forEach(flake => {
            flake.draw(this.ctx);
        });
    }

    start() {
        this.isAnimating = true;
        this.animate();
    }

    animate() {
        if (!this.isAnimating) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }

    stop() {
        this.isAnimating = false;
        this.flakes = [];
        this.settledFlakes = [];
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}

// =======================================
// >> WEATHER MANAGEMENT SYSTEM 
// =======================================

class WeatherManager {
    constructor() {
        this.rainSystem = null;
        this.snowSystem = null;
        this.isFirstVisit = !getCookie('weatherPreferencesSet');
        this.speedMultiplier = parseFloat(getCookie('weatherSpeed') || '1.0');
        this.initializeSystems();
        this.initializeUI();
        this.loadSettings();
    }

    initializeSystems() {
        this.rainSystem = new RainSystem();
        this.snowSystem = new SnowSystem();
    }

    async loadSettings() {
        if (this.isFirstVisit) {
            try {
                const response = await fetch('/api/config/weather');
                const config = await response.json();
                const useSnow = config.defaultWeather === 'snow';
                
                setCookie('rainEnabled', (!useSnow).toString());
                setCookie('snowEnabled', useSnow.toString());
                setCookie('weatherSpeed', '1.0');
                setCookie('weatherPreferencesSet', 'true');
                
                const rainToggle = document.getElementById('rainToggle');
                const snowToggle = document.getElementById('snowToggle');
                const speedSlider = document.getElementById('weatherSpeed');
                const speedValue = document.getElementById('speedValue');

                rainToggle.checked = !useSnow;
                snowToggle.checked = useSnow;
                speedSlider.value = 1.0;
                speedValue.textContent = '1x';

                if (useSnow) {
                    this.snowSystem.start();
                } else {
                    this.rainSystem.start();
                }
                return;
            } catch (err) {
                console.error('Failed to load weather config:', err);
                this.rainSystem.start();
                return;
            }
        }

        const rainEnabled = getCookie('rainEnabled') === 'true';
        const snowEnabled = getCookie('snowEnabled') === 'true';
        const speed = parseFloat(getCookie('weatherSpeed') || '1.0');

        const rainToggle = document.getElementById('rainToggle');
        const snowToggle = document.getElementById('snowToggle');
        const speedSlider = document.getElementById('weatherSpeed');
        const speedValue = document.getElementById('speedValue');

        rainToggle.checked = rainEnabled;
        snowToggle.checked = snowEnabled;
        speedSlider.value = speed;
        speedValue.textContent = `${speed}x`;

        this.rainSystem.stop();
        this.snowSystem.stop();

        if (snowEnabled) {
            this.snowSystem.start();
        } else if (rainEnabled) {
            this.rainSystem.start();
        }
        
        this.updateSpeed(speed);
    }

    initializeUI() {
        const weatherSettings = document.querySelector('.site-settings');
        const tab = document.querySelector('.settings-tab');
        
        tab.addEventListener('click', (e) => {
            e.stopPropagation();
            weatherSettings.classList.toggle('open');
        });

        document.addEventListener('click', (e) => {
            if (!weatherSettings.contains(e.target)) {
                weatherSettings.classList.remove('open');
            }
        });

        const rainToggle = document.getElementById('rainToggle');
        const snowToggle = document.getElementById('snowToggle');

        rainToggle.addEventListener('click', (e) => e.stopPropagation());
        snowToggle.addEventListener('click', (e) => e.stopPropagation());

        rainToggle.addEventListener('change', () => this.toggleRain(rainToggle.checked));
        snowToggle.addEventListener('change', () => this.toggleSnow(snowToggle.checked));

        const speedSlider = document.getElementById('weatherSpeed');
        speedSlider.min = "0.2";
        speedSlider.max = "3.0";
        speedSlider.step = "0.1";
        speedSlider.value = "1.0";

        const speedValue = document.getElementById('speedValue');

        speedSlider.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            speedValue.textContent = `${speed}x`;
            this.updateSpeed(speed);
        });

        const disableButton = document.getElementById('disableWeather');
        disableButton.addEventListener('click', () => {
            const rainToggle = document.getElementById('rainToggle');
            const snowToggle = document.getElementById('snowToggle');
            
            rainToggle.checked = false;
            snowToggle.checked = false;
            
            this.toggleRain(false);
            this.toggleSnow(false);
        });
    }

    updateSpeed(multiplier) {
        this.speedMultiplier = multiplier;
        setCookie('weatherSpeed', multiplier);
        
        if (this.rainSystem) {
            this.rainSystem.setSpeedMultiplier(multiplier);
        }
        
        if (this.snowSystem) {
            this.snowSystem.setSpeedMultiplier(multiplier);
        }
    }

    toggleRain(enabled) {
        if (enabled) {
            this.snowSystem?.stop();
            document.getElementById('snowToggle').checked = false;
            this.rainSystem.start();
            setCookie('snowEnabled', 'false');
        } else {
            this.rainSystem.stop();
        }
        setCookie('rainEnabled', enabled.toString());
    }

    toggleSnow(enabled) {
        if (enabled) {
            this.rainSystem?.stop();
            document.getElementById('rainToggle').checked = false;
            this.snowSystem.start();
            setCookie('rainEnabled', 'false');
        } else {
            this.snowSystem.stop();
        }
        setCookie('snowEnabled', enabled.toString());
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new WeatherManager();
    initTypewriter();
});