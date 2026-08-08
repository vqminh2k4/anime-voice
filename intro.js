document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject CSS for the splash screen
    const style = document.createElement('style');
    style.innerHTML = `
        #introSplash {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: radial-gradient(circle at center, #0a0a20 0%, #000000 60%);
            z-index: 99999;
            display: flex;
            justify-content: center;
            align-items: center;
            overflow: hidden;
            transition: opacity 1.5s ease;
        }
        #introCanvas {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 1;
        }
        @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&display=swap');

        :root {
            --white: #F5F3FF;
            --gray: #A9A4BD;
            --purple: #9B6CFF;
            --violet: #6C4DFF;
            --cyan: #54D9FF;
            --pink: #FF5FD7;
        }

        .troll-container {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            width: 100%;
            position: absolute;
            z-index: 10;
            pointer-events: none;
            font-family: 'Rajdhani', sans-serif;
        }
        .troll-container * {
            pointer-events: auto;
        }

        .hud-frame {
            position: relative;
            width: 100vw;
            height: 100vh;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            padding-top: 4vh;
            border: 1px solid rgba(169, 164, 189, 0.15);
            clip-path: polygon(
                40px 0, calc(100% - 40px) 0, 
                100% 40px, 100% calc(100% - 40px), 
                calc(100% - 40px) 100%, 40px 100%, 
                0 calc(100% - 40px), 0 40px
            );
            background: transparent;
        }

        .hud-corner {
            position: absolute;
            width: 30px;
            height: 30px;
            border: 2px solid var(--purple);
            opacity: 0.4;
        }
        .hud-corner.top-left { top: 0; left: 0; border-right: none; border-bottom: none; }
        .hud-corner.top-right { top: 0; right: 0; border-left: none; border-bottom: none; }
        .hud-corner.bottom-left { bottom: 0; left: 0; border-right: none; border-top: none; }
        .hud-corner.bottom-right { bottom: 0; right: 0; border-left: none; border-top: none; }

        .mockup-pretitle {
            font-size: 1.2rem;
            font-weight: 600;
            letter-spacing: 0.6em;
            color: var(--gray);
            text-transform: uppercase;
            margin-bottom: 20px;
        }

        .mockup-title {
            font-size: 3.5rem;
            font-weight: 700;
            color: var(--white);
            text-transform: uppercase;
            line-height: 1.2;
            text-align: center;
            margin-bottom: 40px;
        }
        .gradient-text {
            background: linear-gradient(90deg, var(--purple), var(--pink), var(--cyan));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            font-size: 1.35em;
            font-weight: 700;
            text-shadow: 0 0 15px rgba(155, 108, 255, 0.15);
            padding: 0 5px;
        }

        .hud-logo-container {
            margin-bottom: 40px;
            animation: float 4s ease-in-out infinite;
            filter: drop-shadow(0 0 15px rgba(155, 108, 255, 0.4));
        }
        .hud-logo-svg {
            width: 55px;
            height: 55px;
        }
        @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
            100% { transform: translateY(0px); }
        }

        .troll-buttons-area {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 40px;
            margin-top: 60px;
            perspective: 1000px;
        }

        .hud-btn {
            position: relative;
            width: 330px;
            padding: 18px 25px;
            display: flex;
            align-items: center;
            gap: 20px;
            background: linear-gradient(145deg, rgba(30, 40, 60, 0.8), rgba(10, 15, 25, 0.95));
            border-radius: 16px;
            cursor: pointer;
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease, border-color 0.4s ease;
            text-align: left;
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-top: 1px solid rgba(255, 255, 255, 0.25);
            border-bottom: 4px solid;
            backdrop-filter: blur(10px);
            transform-style: preserve-3d;
            box-shadow: 
                0 15px 35px rgba(0,0,0,0.6),
                inset 0 2px 10px rgba(255,255,255,0.05);
        }

        .hud-btn::before {
            content: '';
            position: absolute;
            inset: 0;
            background: radial-gradient(circle at top left, rgba(255,255,255,0.08), transparent 70%);
            border-radius: 14px;
            pointer-events: none;
        }

        .hud-btn::after {
            content: '///';
            position: absolute;
            bottom: 6px; right: 15px;
            font-size: 9px;
            letter-spacing: 3px;
            opacity: 0.4;
            color: inherit;
            font-weight: 700;
            transform: translateZ(10px);
        }

        .hud-btn > * {
            z-index: 1;
            position: relative;
            transform: translateZ(20px);
            transition: transform 0.4s ease;
        }

        .btn-icon {
            width: 48px;
            height: 48px;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-shrink: 0;
            transition: all 0.3s ease;
            position: relative;
            color: inherit;
        }
        
        .btn-icon::before {
            content: '';
            position: absolute;
            inset: 0;
            background: currentColor;
            clip-path: polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%);
            opacity: 0.1;
            transition: all 0.3s ease;
            z-index: -1;
        }

        .btn-icon svg {
            width: 24px;
            height: 24px;
            stroke: currentColor;
        }

        .btn-content {
            display: flex;
            flex-direction: column;
        }
        .btn-label {
            font-size: 1.4rem;
            font-weight: 700;
            letter-spacing: 2px;
            transition: all 0.3s ease;
            text-shadow: none;
        }
        .btn-line {
            width: 0px;
            height: 1px;
            margin: 6px 0;
            background: currentColor;
            transition: all 0.4s ease;
        }
        .btn-desc {
            font-size: 0.85rem;
            color: var(--gray);
            font-weight: 500;
            line-height: 1.3;
            opacity: 0.8;
        }

        /* OK BUTTON - CYAN */
        .hud-btn-ok { 
            border-bottom-color: #1a6d8c;
            color: var(--cyan); 
        }
        .hud-btn-ok .btn-label { color: #E0F7FF; }
        .hud-btn-ok:hover { 
            border-bottom-color: var(--cyan);
            transform: translateY(-10px) rotateX(10deg) rotateY(-5deg);
            box-shadow: 
                0 25px 40px rgba(84, 217, 255, 0.2), 
                0 10px 15px rgba(0,0,0,0.8),
                inset 0 2px 15px rgba(84, 217, 255, 0.2);
        }
        .hud-btn-ok:hover > * {
            transform: translateZ(30px);
        }
        .hud-btn-ok:hover .btn-icon::before { opacity: 0.3; }
        .hud-btn-ok:hover .btn-line { width: 100%; box-shadow: 0 0 8px var(--cyan); }
        .hud-btn-ok:hover .btn-label { text-shadow: 0 0 15px rgba(84, 217, 255, 0.6); }

        /* NO BUTTON - PINK/RED */
        .hud-btn-no { 
            border-bottom-color: #8c1a53;
            color: var(--pink); 
        }
        .hud-btn-no .btn-label { color: #FFE4F5; }
        .hud-btn-no:hover { 
            border-bottom-color: var(--pink);
            transform: translateY(-10px) rotateX(10deg) rotateY(5deg);
            box-shadow: 
                0 25px 40px rgba(255, 95, 215, 0.2), 
                0 10px 15px rgba(0,0,0,0.8),
                inset 0 2px 15px rgba(255, 95, 215, 0.2);
        }
        .hud-btn-no:hover > * {
            transform: translateZ(30px);
        }
        .hud-btn-no:hover .btn-icon::before { opacity: 0.3; }
        .hud-btn-no:hover .btn-line { width: 100%; box-shadow: 0 0 8px var(--pink); }
        .hud-btn-no:hover .btn-label { text-shadow: 0 0 15px rgba(255, 95, 215, 0.6); }

        .btn-wrapper-no {
            transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .btn-wrapper-ok {
            transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        
        .troll-footer {
            position: absolute;
            bottom: 30px;
            color: var(--gray);
            font-size: 0.85rem;
            letter-spacing: 5px;
            color: rgba(255,255,255,0.4);
            text-transform: uppercase;
        }
    `;
    document.head.appendChild(style);

    // 2. Inject HTML
    const introDiv = document.createElement('div');
    introDiv.id = 'introSplash';
    
    const canvas = document.createElement('canvas');
    canvas.id = 'introCanvas';
    introDiv.appendChild(canvas);

    const trollContainer = document.createElement('div');
    trollContainer.className = 'troll-container';
    trollContainer.innerHTML = `
        <div class="hud-frame">
            <div class="hud-corner top-left"></div>
            <div class="hud-corner top-right"></div>
            <div class="hud-corner bottom-left"></div>
            <div class="hud-corner bottom-right"></div>

            <div class="mockup-pretitle">BẠN CÓ SẴN LÒNG</div>
            <h1 class="mockup-title">ĐẦU TƯ <span class="gradient-text">50K</span> VÀO TÔI KHÔNG?</h1>
            
            <div class="hud-logo-container">
                <svg class="hud-logo-svg" viewBox="0 0 24 24" fill="none" stroke="url(#logoGradient)" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                    <defs>
                        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#9B6CFF" />
                            <stop offset="100%" stop-color="#54D9FF" />
                        </linearGradient>
                    </defs>
                    <rect x="2" y="5" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="2" y1="10" x2="22" y2="10"></line>
                    <line x1="6" y1="14" x2="10" y2="14"></line>
                    <circle cx="16" cy="14" r="1"></circle>
                </svg>
            </div>

            <div class="troll-buttons-area">
                <div class="btn-wrapper btn-wrapper-ok" id="btnOkWrapper">
                    <button class="hud-btn hud-btn-ok" id="btnOk">
                        <div class="btn-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                                <polygon points="12 6 17 9 17 15 12 18 7 15 7 9 12 6" />
                                <circle cx="12" cy="12" r="2" />
                            </svg>
                        </div>
                        <div class="btn-content">
                            <div class="btn-label">ĐẦU TƯ</div>
                            <div class="btn-line"></div>
                            <div class="btn-desc">Hãy để 50K tạo nên<br>điều đặc biệt ✨</div>
                        </div>
                    </button>
                </div>
                
                <div class="btn-wrapper btn-wrapper-no" id="btnNoWrapper">
                    <button class="hud-btn hud-btn-no" id="btnNo">
                        <div class="btn-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M18 6L6 18" />
                                <path d="M6 6l12 12" />
                                <rect x="4" y="4" width="16" height="16" rx="2" stroke-dasharray="2 3" />
                            </svg>
                        </div>
                        <div class="btn-content">
                            <div class="btn-label">KHÔNG ĐỜI NÀO</div>
                            <div class="btn-line"></div>
                            <div class="btn-desc">Ủa? Nghĩ lại đi mà... 🥺</div>
                        </div>
                    </button>
                </div>
            </div>

            <div class="troll-footer">LỰA CHỌN LÀ CỦA BẠN</div>
        </div>
    `;

    introDiv.appendChild(trollContainer);
    document.body.appendChild(introDiv);
    document.body.classList.add('overflow-hidden');

    // 3. Canvas Logic
    const ctx = canvas.getContext('2d', { alpha: true });
    let width, height, cx, cy;
    const numStars = 2000;
    const stars = [];
    const maxZ = 2000;
    
    let state = 'waiting'; // waiting -> warping -> flashing -> fading -> finished
    let progress = 0; 
    let warpTime = 0;
    const warpDuration = 7.0; // 7 seconds warp

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
        cx = width / 2;
        cy = height / 2;
    }

    window.addEventListener('resize', resize);
    resize();

    // Init stars
    for (let i = 0; i < numStars; i++) {
        stars.push({
            x: (Math.random() - 0.5) * (width * 10),
            y: (Math.random() - 0.5) * (height * 10),
            z: Math.random() * maxZ,
            pz: Math.random() * maxZ
        });
    }

    // 4. Troll logic for NO button
    const btnNoWrapper = document.getElementById('btnNoWrapper');
    let trollScaleNo = 1.0;
    let trollScaleOk = 1.0;
    
    let currentTx = 0;
    let currentTy = 0;
    let originalNoRect = null;

    const btnOkWrapper = document.getElementById('btnOkWrapper');
    btnOkWrapper.style.transition = 'transform 0.3s ease';
    btnNoWrapper.style.transition = 'transform 0.2s ease';

    const trollContainerRect = document.querySelector('.troll-container');

    function runAway() {
        if (state !== 'waiting') return;
        
        if (!originalNoRect) {
            originalNoRect = btnNoWrapper.getBoundingClientRect();
        }
        
        trollScaleNo *= 0.85; // Shrink NO
        trollScaleOk *= 1.15; // Grow OK
        
        btnOkWrapper.style.transform = `scale(${trollScaleOk})`;
        
        const noWidth = originalNoRect.width * trollScaleNo;
        const noHeight = originalNoRect.height * trollScaleNo;
        
        const maxLeft = window.innerWidth - noWidth - 20;
        const maxTop = window.innerHeight - noHeight - 20;
        
        let newLeft, newTop;
        let isOverlapping = true;
        let attempts = 0;
        
        while (isOverlapping && attempts < 150) {
            newLeft = Math.max(20, Math.random() * maxLeft);
            newTop = Math.max(20, Math.random() * maxTop);
            
            const buffer = 30;
            const containerBox = trollContainerRect.getBoundingClientRect();
            
            const overlapContainer = 
                (newLeft + noWidth > containerBox.left - buffer && newLeft < containerBox.right + buffer) &&
                (newTop + noHeight > containerBox.top - buffer && newTop < containerBox.bottom + buffer);
                
            if (!overlapContainer) {
                isOverlapping = false;
            }
            attempts++;
        }
        
        currentTx = newLeft - originalNoRect.left;
        currentTy = newTop - originalNoRect.top;
        
        btnNoWrapper.style.transform = `translate(${currentTx}px, ${currentTy}px) scale(${trollScaleNo})`;
    }

    btnNoWrapper.addEventListener('mouseenter', runAway);
    btnNoWrapper.addEventListener('click', runAway);
    btnNoWrapper.addEventListener('touchstart', (e) => {
        e.preventDefault();
        runAway();
    }, { passive: false });

    // 5. Warp logic for OK button
    const btnOk = document.getElementById('btnOk');
    btnOk.addEventListener('click', startWarp);
    btnOk.addEventListener('touchstart', startWarp);

    function startWarp() {
        if (state !== 'waiting') return;
        trollContainer.style.opacity = '0'; // Hide buttons
        state = 'warping';
        warpTime = 0;
    }

    // Easing func
    function easeInOutQuad(t) {
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    // 6. Draw loop
    function draw() {
        if (state === 'finished') return;
        
        requestAnimationFrame(draw);
        
        warpTime += 0.016; // roughly 60fps
        
        ctx.clearRect(0, 0, width, height);

        let easedProgress = 0;
        
        if (state === 'warping') {
            easedProgress = Math.min(warpTime / warpDuration, 1);
            
            if (easedProgress >= 1 && state === 'warping') {
                state = 'flashing';
                introDiv.style.background = '#fff';
                canvas.style.opacity = '0';
                
                setTimeout(() => {
                    state = 'fading';
                    introDiv.style.opacity = '0';
                    setTimeout(() => {
                        state = 'finished';
                        introDiv.remove();
                        document.body.classList.remove('overflow-hidden');
                        document.body.classList.add('loaded'); // Start main app
                    }, 1500);
                }, 100);
                return;
            }
        }
        
        // --- DRAW STARS ---
        // Stars speed up exponentially as we warp
        let speed = state === 'warping' ? 8 + Math.pow(easedProgress, 2) * 300 : 1.0; 
        
        for (let i = 0; i < numStars; i++) {
            const star = stars[i];
            
            // Move star forward (camera flies into the tunnel)
            star.z -= speed;

            if (star.z <= 0) {
                star.z = maxZ;
                star.pz = maxZ; // Reset previous Z so we don't draw a line across the screen
                star.x = (Math.random() - 0.5) * (width * 10);
                star.y = (Math.random() - 0.5) * (height * 10);
            }

            const fov = 400; // Wider FOV for dramatic tunnel effect
            const x = (star.x * fov) / star.z + cx;
            const y = (star.y * fov) / star.z + cy;
            
            const px = (star.x * fov) / star.pz + cx;
            const py = (star.y * fov) / star.pz + cy;
            
            star.pz = star.z;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(x, y);
            
            const intensity = Math.max(0, 1 - (star.z / maxZ));
            // Color ranges from purple to cyan depending on position
            const color = star.x > 0 ? `rgba(6, 182, 212, ${intensity})` : `rgba(168, 85, 247, ${intensity})`;
            
            ctx.strokeStyle = color;
            ctx.lineWidth = intensity * 3;
            ctx.stroke();
        }
    }

    draw();
});
