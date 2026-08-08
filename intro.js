document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject CSS for the splash screen
    const style = document.createElement('style');
    style.innerHTML = `
        #introSplash {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: #000 url('assets/blackhole.jpg') center/cover no-repeat;
            z-index: 99999;
            overflow: hidden;
            transition: opacity 1.5s ease;
        }
        #introCanvas {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 1;
        }
        
        /* The Outer Border */
        .sci-fi-border {
            position: absolute;
            top: 20px; left: 20px; right: 20px; bottom: 20px;
            border: 2px solid rgba(168, 85, 247, 0.4);
            border-radius: 15px;
            z-index: 3;
            pointer-events: none;
            box-shadow: inset 0 0 20px rgba(168, 85, 247, 0.2);
        }
        .sci-fi-border::before, .sci-fi-border::after {
            content: '';
            position: absolute;
            width: 40px; height: 40px;
            border: 2px solid #a855f7;
        }
        .sci-fi-border::before {
            top: -2px; left: -2px;
            border-right: none; border-bottom: none;
            border-top-left-radius: 15px;
        }
        .sci-fi-border::after {
            bottom: -2px; right: -2px;
            border-left: none; border-top: none;
            border-bottom-right-radius: 15px;
        }

        /* Container for UI */
        .ui-layer {
            position: absolute;
            top: 0; left: 0; width: 100%; height: 100%;
            z-index: 4;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            align-items: center;
            padding: 8vh 20px;
            box-sizing: border-box;
            pointer-events: none;
        }
        
        .troll-title-area {
            text-align: center;
            pointer-events: auto;
            text-transform: uppercase;
        }
        
        .troll-subtitle {
            font-family: 'Inter', sans-serif;
            font-size: 1.2rem;
            letter-spacing: 6px;
            color: rgba(255,255,255,0.8);
            margin-bottom: 15px;
            font-weight: 600;
        }
        
        .troll-subtitle::before, .troll-subtitle::after {
            content: ' ✦ ';
            opacity: 0.5;
        }

        .troll-title {
            font-family: 'Inter', sans-serif;
            font-size: 3.5rem;
            font-weight: 900;
            color: white;
            letter-spacing: 2px;
            margin-bottom: 20px;
            text-shadow: 0 0 30px rgba(255,255,255,0.2);
        }
        
        .highlight-50k {
            color: #a855f7;
            text-shadow: 0 0 20px #a855f7, 0 0 40px #a855f7;
            font-size: 4.5rem;
            vertical-align: middle;
        }
        
        .card-icon {
            font-size: 3rem;
            color: #a855f7;
            text-shadow: 0 0 15px #a855f7;
        }

        .troll-buttons-area {
            display: flex;
            gap: 40px;
            align-items: center;
            pointer-events: auto;
        }

        .btn-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        
        .btn-wrapper-ok {
            filter: drop-shadow(0 0 10px rgba(34, 211, 238, 0.5));
        }
        .btn-wrapper-no {
            filter: drop-shadow(0 0 10px rgba(248, 113, 113, 0.5));
            position: relative; 
            transition: left 0.1s ease, top 0.1s ease;
        }
        
        .sci-btn-border {
            padding: 2px;
            clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
            display: inline-block;
        }
        .sci-btn-border-ok { background: #22d3ee; }
        .sci-btn-border-no { background: #f87171; }

        .sci-btn {
            font-family: 'Inter', sans-serif;
            font-size: 1.4rem;
            font-weight: 800;
            padding: 18px 45px;
            background: rgba(0,0,0,0.8);
            border: none;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 12px;
            clip-path: polygon(15px 0, 100% 0, 100% calc(100% - 15px), calc(100% - 15px) 100%, 0 100%, 0 15px);
        }

        .sci-btn-ok { color: #22d3ee; }
        .sci-btn-ok:hover { background: rgba(34, 211, 238, 0.2); }
        .sci-btn-no { color: #f87171; }
        .sci-btn-no:hover { background: rgba(248, 113, 113, 0.2); }

        .btn-subtext {
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .btn-subtext-ok { color: #22d3ee; }
        .btn-subtext-no { color: #f87171; }

        .troll-footer {
            font-family: 'Inter', sans-serif;
            font-size: 0.8rem;
            letter-spacing: 4px;
            color: rgba(255,255,255,0.4);
            text-transform: uppercase;
            margin-top: 30px;
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
    trollContainer.style.width = '100%';
    trollContainer.style.height = '100%';
    trollContainer.innerHTML = `
        <div class="sci-fi-border"></div>
        
        <div class="ui-layer">
            <!-- TITLE AREA -->
            <div class="troll-title-area">
                <div class="troll-subtitle">BẠN CÓ SẴN LÒNG</div>
                <div class="troll-title">ĐẦU TƯ <span class="highlight-50k">50K</span> VÀO TÔI KHÔNG?</div>
                <div class="card-icon">💳</div>
            </div>

            <!-- BUTTONS AREA -->
            <div style="display: flex; flex-direction: column; align-items: center; pointer-events: auto;">
                <div class="troll-buttons-area">
                    <!-- OK BUTTON -->
                    <div class="btn-wrapper btn-wrapper-ok" id="btnOkWrapper">
                        <div class="sci-btn-border sci-btn-border-ok">
                            <button class="sci-btn sci-btn-ok" id="btnOk">
                                <span style="font-size: 2rem;">💸</span> ĐẦU TƯ
                            </button>
                        </div>
                        <div class="btn-subtext btn-subtext-ok">Hãy để 50K tạo nên điều đặc biệt ✨</div>
                    </div>
                    
                    <!-- NO BUTTON -->
                    <div class="btn-wrapper btn-wrapper-no" id="btnNoWrapper">
                        <div class="sci-btn-border sci-btn-border-no">
                            <button class="sci-btn sci-btn-no" id="btnNo">
                                <span style="font-size: 2rem;">🏃‍♂️</span> KHÔNG ĐỜI NÀO
                            </button>
                        </div>
                        <div class="btn-subtext btn-subtext-no">Ủa? Nghĩ lại đi mà... 🥺</div>
                    </div>
                </div>
                
                <!-- FOOTER -->
                <div class="troll-footer">LỰA CHỌN LÀ CỦA BẠN ❖ VŨ TRỤ CHỈ ĐANG CHỜ ĐỢI</div>
            </div>
        </div>
    `;

    introDiv.appendChild(trollContainer);
    document.body.appendChild(introDiv);
    document.body.classList.add('overflow-hidden');

    // 3. Canvas Logic
    const ctx = canvas.getContext('2d', { alpha: false });
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
    const trollTitleRect = document.querySelector('.troll-title-area');
    const introSplash = document.getElementById('introSplash');
    
    let trollScale = 1.0;
    let trollOpacity = 1.0;

    function runAway() {
        if (state !== 'waiting') return;
        
        trollScale *= 0.85;
        trollOpacity -= 0.2;
        
        btnNoWrapper.style.transform = `scale(${trollScale})`;
        btnNoWrapper.style.opacity = trollOpacity;
        btnNoWrapper.style.position = 'absolute';
        
        const noRect = btnNoWrapper.getBoundingClientRect();
        const splashRect = introSplash.getBoundingClientRect();
        
        const noWidth = noRect.width * trollScale;
        const noHeight = noRect.height * trollScale;
        
        const maxLeft = window.innerWidth - noWidth - 40; // 40px buffer from edges
        const maxTop = window.innerHeight - noHeight - 40;
        
        let newLeft, newTop;
        let isOverlapping = true;
        let attempts = 0;
        
        while (isOverlapping && attempts < 150) {
            newLeft = Math.max(40, Math.random() * maxLeft);
            newTop = Math.max(40, Math.random() * maxTop);
            
            const buffer = 40;
            // Avoid title area
            const titleBounds = trollTitleRect.getBoundingClientRect();
            const overlapTitle = 
                (newLeft + noWidth > titleBounds.left - buffer && newLeft < titleBounds.right + buffer) &&
                (newTop + noHeight > titleBounds.top - buffer && newTop < titleBounds.bottom + buffer);
                
            const overlapSelf = 
                (newLeft + noWidth > splashRect.left - buffer && newLeft < splashRect.right + buffer) &&
                (newTop + noHeight > splashRect.top - buffer && newTop < splashRect.bottom + buffer);
                
            if (!overlapTitle && !overlapSelf) {
                isOverlapping = false;
            }
            attempts++;
        }
        
        btnNoWrapper.style.left = newLeft + 'px';
        btnNoWrapper.style.top = newTop + 'px';
        btnNoWrapper.style.transform = `scale(${trollScale})`;
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
