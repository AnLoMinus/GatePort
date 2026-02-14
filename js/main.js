// ============================================
// PortalVerse - Main JavaScript
// ============================================

class PortalVerse {
    constructor() {
        this.portals = document.querySelectorAll('.portal');
        this.mainGate = document.getElementById('mainGate');
        this.energyCircuits = document.getElementById('energyCircuits');
        this.energyBeams = document.getElementById('energyBeams');
        this.sparksContainer = document.getElementById('sparksContainer');
        this.activeBeam = null;
        
        // Cache למיקומים כדי למנוע forced reflows
        this.positionsCache = {
            mainGate: null,
            portals: [],
            lastUpdate: 0
        };
        this.animationFrameId = null;
        this.needsUpdate = false;
        
        this.init();
    }
    
    init() {
        // המתן ל-DOM להיות מוכן
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
            return;
        }
        
        // בדיקה אם יש תמונת רקע
        this.checkBackgroundImage();
        
        // עדכון cache ראשוני
        this.updatePositionsCache();
        
        this.createEnergyCircuits();
        this.createSparks();
        this.setupPortalHovers();
        this.setupMainGate();
        this.startAnimations();
    }
    
    // בדיקה אם יש תמונת רקע
    checkBackgroundImage() {
        const cosmicBg = document.querySelector('.cosmic-background');
        if (!cosmicBg) return;
        
        // נסה קבצים שונים
        const possiblePaths = [
            'assets/background.jpg',
            'assets/background.png',
            'assets/background.webp',
            '../assets/background.jpg',
            '../assets/background.png',
            '../assets/background.webp'
        ];
        
        let tried = 0;
        const img = new Image();
        
        img.onload = () => {
            cosmicBg.classList.add('has-background-image');
            cosmicBg.style.backgroundImage = `url('${img.src}')`;
        };
        
        const tryNext = () => {
            if (tried < possiblePaths.length) {
                img.src = possiblePaths[tried++];
            } else {
                // אין תמונת רקע, נשתמש ב-fallback
                cosmicBg.classList.remove('has-background-image');
            }
        };
        
        img.onerror = tryNext;
        tryNext();
    }
    
    // עדכון cache של מיקומים
    updatePositionsCache() {
        const now = performance.now();
        // עדכון רק כל 100ms כדי למנוע forced reflows
        if (now - this.positionsCache.lastUpdate < 100) {
            return;
        }
        
        const mainGateRect = this.mainGate.getBoundingClientRect();
        this.positionsCache.mainGate = {
            x: mainGateRect.left + mainGateRect.width / 2,
            y: mainGateRect.top + mainGateRect.height / 2,
            width: mainGateRect.width,
            height: mainGateRect.height
        };
        
        this.positionsCache.portals = Array.from(this.portals).map(portal => {
            const rect = portal.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2,
                width: rect.width,
                height: rect.height
            };
        });
        
        this.positionsCache.lastUpdate = now;
    }
    
    // יצירת מעגלים חשמליים בין השערים
    createEnergyCircuits() {
        const svg = this.energyCircuits;
        if (!svg) return;
        
        const portals = Array.from(this.portals);
        const mainGateCenter = this.positionsCache.mainGate;
        
        if (!mainGateCenter) {
            // אם אין cache, ננסה שוב אחרי קצת זמן
            setTimeout(() => this.createEnergyCircuits(), 50);
            return;
        }
        
        portals.forEach((portal, index) => {
            const portalCenter = this.positionsCache.portals[index];
            
            // קו מהשער הראשי לפורטל
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('x1', mainGateCenter.x);
            line.setAttribute('y1', mainGateCenter.y);
            line.setAttribute('x2', portalCenter.x);
            line.setAttribute('y2', portalCenter.y);
            line.setAttribute('stroke', 'url(#energyGradient)');
            line.setAttribute('stroke-width', '2');
            line.setAttribute('opacity', '0.3');
            line.setAttribute('stroke-dasharray', '10,5');
            line.style.animation = `circuit-pulse ${3 + index * 0.5}s infinite`;
            svg.appendChild(line);
            
            // נקודות אנרגיה לאורך הקו
            for (let i = 0; i < 5; i++) {
                const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                const t = i / 4;
                const x = mainGateCenter.x + (portalCenter.x - mainGateCenter.x) * t;
                const y = mainGateCenter.y + (portalCenter.y - mainGateCenter.y) * t;
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
                circle.setAttribute('r', '3');
                circle.setAttribute('fill', '#00ffff');
                circle.setAttribute('opacity', '0.6');
                circle.style.animation = `energy-dot-move ${2 + i * 0.3}s infinite`;
                circle.style.animationDelay = `${i * 0.2}s`;
                svg.appendChild(circle);
            }
        });
        
        // הוספת אנימציות CSS
        this.addCircuitAnimations();
    }
    
    addCircuitAnimations() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes circuit-pulse {
                0%, 100% { opacity: 0.2; stroke-dashoffset: 0; }
                50% { opacity: 0.5; stroke-dashoffset: -15; }
            }
            @keyframes energy-dot-move {
                0%, 100% { 
                    opacity: 0.4;
                    r: 3;
                }
                50% { 
                    opacity: 0.8;
                    r: 5;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    // יצירת ניצוצות קוסמיים שעוקבים אחרי העכבר
    createSparks() {
        this.mouseX = 0;
        this.mouseY = 0;
        this.sparkTrail = [];
        
        // מעקב אחרי מיקום העכבר
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            this.createMouseSpark(e.clientX, e.clientY);
        }, { passive: true });
        
        // יצירת ניצוצות אקראיים
        setInterval(() => {
            const existingSparks = this.sparksContainer.querySelectorAll('.spark');
            if (existingSparks.length < 30) {
                this.createRandomSpark();
            }
        }, 400);
        
        // יצירת מעגלים חשמליים סביב העכבר
        setInterval(() => {
            this.createElectricCircle(this.mouseX, this.mouseY);
        }, 800);
    }
    
    // יצירת ניצוץ סביב העכבר
    createMouseSpark(x, y) {
        // יצירת מספר ניצוצות סביב העכבר
        for (let i = 0; i < 2; i++) {
            const spark = document.createElement('div');
            spark.className = 'spark spark-mouse';
            
            // מיקום סביב העכבר
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 40;
            const sparkX = x + Math.cos(angle) * radius;
            const sparkY = y + Math.sin(angle) * radius;
            
            // כיוון תנועה מהעכבר החוצה
            const distance = 30 + Math.random() * 70;
            const moveX = Math.cos(angle) * distance;
            const moveY = Math.sin(angle) * distance;
            
            // צבע אקראי
            const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00', '#ff6b9d'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            spark.style.cssText = `
                left: ${sparkX}px;
                top: ${sparkY}px;
                --spark-x: ${moveX}px;
                --spark-y: ${moveY}px;
                background: ${color};
                box-shadow: 0 0 15px ${color}, 0 0 30px ${color};
                width: 6px;
                height: 6px;
            `;
            
            this.sparksContainer.appendChild(spark);
            
            setTimeout(() => {
                if (spark.parentNode) {
                    spark.remove();
                }
            }, 1500);
        }
    }
    
    // יצירת ניצוץ אקראי
    createRandomSpark() {
        const spark = document.createElement('div');
        spark.className = 'spark';
        
        // מיקום אקראי
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        
        // כיוון תנועה אקראי
        const angle = Math.random() * Math.PI * 2;
        const distance = 50 + Math.random() * 100;
        const sparkX = Math.cos(angle) * distance;
        const sparkY = Math.sin(angle) * distance;
        
        // צבע אקראי
        const colors = ['#00ffff', '#ff00ff', '#ffff00', '#00ff00'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        spark.style.cssText = `
            left: ${x}px;
            top: ${y}px;
            --spark-x: ${sparkX}px;
            --spark-y: ${sparkY}px;
            background: ${color};
            box-shadow: 0 0 10px ${color};
        `;
        
        this.sparksContainer.appendChild(spark);
        
        setTimeout(() => {
            if (spark.parentNode) {
                spark.remove();
            }
        }, 2000);
    }
    
    // יצירת מעגל חשמלי סביב העכבר
    createElectricCircle(x, y) {
        if (x === 0 && y === 0) return; // אם העכבר לא זז
        
        const circle = document.createElement('div');
        circle.className = 'electric-circle';
        
        const size = 50 + Math.random() * 100;
        const colors = ['#00ffff', '#ff00ff', '#0080ff'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        circle.style.cssText = `
            position: absolute;
            left: ${x - size/2}px;
            top: ${y - size/2}px;
            width: ${size}px;
            height: ${size}px;
            border: 2px solid ${color};
            border-radius: 50%;
            box-shadow: 
                0 0 20px ${color},
                0 0 40px ${color},
                inset 0 0 20px ${color};
            opacity: 0.8;
            pointer-events: none;
            z-index: 1;
        `;
        
        this.sparksContainer.appendChild(circle);
        
        // אנימציה של התרחבות
        let scale = 1;
        let opacity = 0.8;
        const animation = () => {
            scale += 0.05;
            opacity -= 0.02;
            circle.style.transform = `scale(${scale})`;
            circle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animation);
            } else {
                if (circle.parentNode) {
                    circle.remove();
                }
            }
        };
        
        requestAnimationFrame(animation);
    }
    
    // הגדרת hover על פורטלים
    setupPortalHovers() {
        this.portals.forEach(portal => {
            portal.addEventListener('mouseenter', (e) => {
                this.createEnergyBeam(portal);
            });
            
            portal.addEventListener('mouseleave', (e) => {
                this.removeEnergyBeam();
            });
            
            portal.addEventListener('click', (e) => {
                const portalName = portal.getAttribute('data-name');
                console.log(`Navigating to: ${portalName}`);
                // כאן תוכל להוסיף ניווט אמיתי
            });
        });
    }
    
    // יצירת קו אנרגיה מהשער הראשי לפורטל
    createEnergyBeam(portal) {
        this.removeEnergyBeam();
        
        // עדכון cache לפני יצירת הקו
        this.updatePositionsCache();
        
        const mainGateCenter = this.positionsCache.mainGate;
        const portalIndex = Array.from(this.portals).indexOf(portal);
        const portalCenter = this.positionsCache.portals[portalIndex];
        
        if (!mainGateCenter || !portalCenter) return;
        
        // חישוב מרחק וזווית
        const dx = portalCenter.x - mainGateCenter.x;
        const dy = portalCenter.y - mainGateCenter.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        
        // יצירת קו אנרגיה
        const beam = document.createElement('div');
        beam.className = 'energy-beam active';
        beam.style.width = distance + 'px';
        beam.style.left = mainGateCenter.x + 'px';
        beam.style.top = mainGateCenter.y + 'px';
        beam.style.transform = `rotate(${angle}deg)`;
        beam.style.transformOrigin = '0 0';
        
        // צבע לפי פורטל
        const portalType = portal.classList[1]; // portal-gs, portal-cg, etc.
        const color = this.getPortalColor(portalType);
        beam.style.background = `linear-gradient(90deg, transparent 0%, ${color} 50%, transparent 100%)`;
        beam.style.boxShadow = `0 0 10px ${color}, 0 0 20px ${color}`;
        
        this.energyBeams.appendChild(beam);
        this.activeBeam = beam;
        
        // אפקט על השער הראשי
        this.mainGate.classList.add('gate-active');
        
        // אפקט על הפורטל
        portal.classList.add('portal-active');
    }
    
    // הסרת קו אנרגיה
    removeEnergyBeam() {
        if (this.activeBeam) {
            this.activeBeam.classList.remove('active');
            setTimeout(() => {
                if (this.activeBeam && this.activeBeam.parentNode) {
                    this.activeBeam.remove();
                }
            }, 300);
            this.activeBeam = null;
        }
        
        this.mainGate.classList.remove('gate-active');
        this.portals.forEach(portal => {
            portal.classList.remove('portal-active');
        });
    }
    
    // קבלת צבע לפי סוג פורטל
    getPortalColor(portalType) {
        const colors = {
            'portal-gs': '#4a90e2',
            'portal-cg': '#ff6b6b',
            'portal-kh': '#51cf66',
            'portal-ps': '#9775fa',
            'portal-dh': '#ffd43b',
            'portal-dl': '#ff8787',
            'portal-sk': '#ff6b9d',
            'portal-mg': '#845ef7'
        };
        return colors[portalType] || '#00ffff';
    }
    
    // הגדרת שער ראשי
    setupMainGate() {
        this.mainGate.addEventListener('click', () => {
            console.log('Main Gate clicked');
            // כאן תוכל להוסיף פעולה
        });
    }
    
    // התחלת אנימציות
    startAnimations() {
        // שימוש ב-requestAnimationFrame במקום setInterval
        this.animate();
        
        // עדכון cache בעת resize או scroll
        let resizeTimer;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                this.updatePositionsCache();
                this.needsUpdate = true;
            }, 100);
        });
        
        window.addEventListener('scroll', () => {
            this.needsUpdate = true;
        }, { passive: true });
    }
    
    // אנימציה עם requestAnimationFrame
    animate() {
        if (this.needsUpdate) {
            this.updatePositionsCache();
            this.needsUpdate = false;
        }
        
        this.updateEnergyCircuits();
        this.animationFrameId = requestAnimationFrame(() => this.animate());
    }
    
    // עדכון מעגלים חשמליים (ללא forced reflows)
    updateEnergyCircuits() {
        // עדכון cache רק אם צריך
        if (this.needsUpdate) {
            this.updatePositionsCache();
        }
        
        const lines = this.energyCircuits.querySelectorAll('line');
        const circles = this.energyCircuits.querySelectorAll('circle');
        const mainGateCenter = this.positionsCache.mainGate;
        
        if (!mainGateCenter) return;
        
        // עדכון קווים (batch update)
        const lineUpdates = [];
        lines.forEach((line, index) => {
            if (this.positionsCache.portals[index]) {
                const portalCenter = this.positionsCache.portals[index];
                lineUpdates.push({
                    element: line,
                    x1: mainGateCenter.x,
                    y1: mainGateCenter.y,
                    x2: portalCenter.x,
                    y2: portalCenter.y
                });
            }
        });
        
        // עדכון כל הקווים בבת אחת
        lineUpdates.forEach(update => {
            update.element.setAttribute('x1', update.x1);
            update.element.setAttribute('y1', update.y1);
            update.element.setAttribute('x2', update.x2);
            update.element.setAttribute('y2', update.y2);
        });
        
        // עדכון נקודות אנרגיה
        const time = performance.now() / 1000;
        circles.forEach((circle, index) => {
            const lineIndex = Math.floor(index / 5);
            const dotIndex = index % 5;
            
            if (this.positionsCache.portals[lineIndex]) {
                const portalCenter = this.positionsCache.portals[lineIndex];
                const t = (dotIndex / 4) + (time % 2) * 0.1;
                const tMod = t % 1;
                const x = mainGateCenter.x + (portalCenter.x - mainGateCenter.x) * tMod;
                const y = mainGateCenter.y + (portalCenter.y - mainGateCenter.y) * tMod;
                
                circle.setAttribute('cx', x);
                circle.setAttribute('cy', y);
            }
        });
    }
}

// התחלה כשהדף נטען
let portalVerseInstance = null;

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        portalVerseInstance = new PortalVerse();
    });
} else {
    portalVerseInstance = new PortalVerse();
}

