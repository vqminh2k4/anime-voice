document.addEventListener('DOMContentLoaded', () => {
    // 1. Inject CSS for the splash screen
    const style = document.createElement('style');
    style.innerHTML = `
        #introSplash {
            position: fixed;
            top: 0; left: 0; width: 100vw; height: 100vh;
            background: #000;
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
        .troll-container {
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 40px;
            margin-top: -100px;
        }
        .sci-btn {
            font-family: 'Inter', sans-serif;
            font-size: 1.2rem;
            font-weight: 800;
            padding: 15px 40px;
            border: none;
            border-radius: 50px;
            cursor: pointer;
            text-transform: uppercase;
            letter-spacing: 2px;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .sci-btn-ok {
            background: transparent;
            color: #22d3ee;
            border: 2px solid #22d3ee;
            box-shadow: 0 0 20px rgba(34, 211, 238, 0.2);
        }
        .sci-btn-ok:hover {
            background: rgba(34, 211, 238, 0.1);
            box-shadow: 0 0 30px rgba(34, 211, 238, 0.6), inset 0 0 30px rgba(34, 211, 238, 0.4);
        }
        .sci-btn-no {
            background: transparent;
            color: #f87171;
            border: 2px solid #f87171;
            box-shadow: 0 0 20px rgba(248, 113, 113, 0.2);
        }
        .sci-btn-no:hover {
            background: rgba(248, 113, 113, 0.1);
            box-shadow: 0 0 30px rgba(239, 68, 68, 0.6), inset 0 0 30px rgba(239, 68, 68, 0.4);
        }
        .troll-buttons-area {
            display: flex;
            gap: 30px;
            align-items: center;
        }
        .btn-wrapper {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
        }
        .btn-wrapper-no {
            position: relative; 
            transition: left 0.1s ease, top 0.1s ease;
        }
        .btn-subtext {
            font-family: 'Inter', sans-serif;
            font-size: 0.9rem;
            font-weight: 500;
        }
        .btn-subtext-ok { color: #22d3ee; }
        .btn-subtext-no { color: #f87171; }
        .troll-footer {
            position: absolute;
            bottom: 30px;
            font-family: 'Inter', sans-serif;
            font-size: 0.8rem;
            letter-spacing: 4px;
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
        <div style="text-align: center; color: white;">
            <h1 style="font-family: 'Inter', sans-serif; font-size: 3rem; margin-bottom: 15px; letter-spacing: 3px; font-weight: 900; background: linear-gradient(90deg, #22d3ee, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">KHỞI ĐỘNG VŨ TRỤ</h1>
            <p style="font-family: 'Inter', sans-serif; font-size: 1.2rem; color: rgba(255,255,255,0.7); font-weight: 300;">Hệ thống yêu cầu nạp năng lượng (50K) để tiếp tục</p>
        </div>
        <div class="troll-buttons-area">
            <div class="btn-wrapper btn-wrapper-ok" id="btnOkWrapper">
                <button class="sci-btn sci-btn-ok" id="btnOk">
                    <span style="font-size: 2rem;">💸</span> ĐẦU TƯ
                </button>
                <div class="btn-subtext btn-subtext-ok">Hãy để 50K tạo nên điều đặc biệt ✨</div>
            </div>
            
            <div class="btn-wrapper btn-wrapper-no" id="btnNoWrapper">
                <button class="sci-btn sci-btn-no" id="btnNo" style="display: flex; flex-direction: column; align-items: center; justify-content: center; line-height: 1.3; padding: 15px 30px; gap: 0;">
                    <div style="display: flex; align-items: center; justify-content: center; width: 100%;">
                        <span style="font-size: 1.8rem; margin-right: 8px;">🏃‍♂️</span> KHÔNG ĐỜI
                    </div>
                    <div style="margin-top: 4px; text-align: center; width: 100%;">NÀO</div>
                </button>
                <div class="btn-subtext btn-subtext-no">Ủa? Nghĩ lại đi mà... 🥺</div>
            </div>
        </div>
        <div class="troll-footer">LỰA CHỌN LÀ CỦA BẠN ❖ VŨ TRỤ CHỈ ĐANG CHỜ ĐỢI</div>
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
    const trollContainerRect = document.querySelector('.troll-container');
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
        
        const maxLeft = window.innerWidth - noWidth - 20;
        const maxTop = window.innerHeight - noHeight - 20;
        
        let newLeft, newTop;
        let isOverlapping = true;
        let attempts = 0;
        
        while (isOverlapping && attempts < 150) {
            newLeft = Math.max(20, Math.random() * maxLeft);
            newTop = Math.max(20, Math.random() * maxTop);
            
            const buffer = 30;
            const overlapContainer = 
                (newLeft + noWidth > trollContainerRect.getBoundingClientRect().left - buffer && newLeft < trollContainerRect.getBoundingClientRect().right + buffer) &&
                (newTop + noHeight > trollContainerRect.getBoundingClientRect().top - buffer && newTop < trollContainerRect.getBoundingClientRect().bottom + buffer);
                
            const overlapSelf = 
                (newLeft + noWidth > splashRect.left - buffer && newLeft < splashRect.right + buffer) &&
                (newTop + noHeight > splashRect.top - buffer && newTop < splashRect.bottom + buffer);
                
            if (!overlapContainer && !overlapSelf) {
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
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, width, height);

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
