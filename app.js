/**
 * Kurumi Music Cover
 * App Logic
 */

document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const els = {
        inputCard: document.getElementById('inputCard'),
        featuresBar: document.querySelector('.features-bar'),
        urlInput: document.getElementById('urlInput'),
        btnGenerate: document.getElementById('btnGenerate'),
        dropZone: document.getElementById('dropZone'),
        fileInput: document.getElementById('fileInput'),
        
        processingPanel: document.getElementById('processingPanel'),
        clockTicks: document.getElementById('clockTicks'),
        processingMsg: document.getElementById('processingMsg'),
        progressBar: document.getElementById('progressBar'),
        
        resultPanel: document.getElementById('resultPanel'),
        resultSourceLabel: document.getElementById('resultSourceLabel'),
        audioPlayer: document.getElementById('audioPlayer'),
        btnPlayPause: document.getElementById('btnPlayPause'),
        iconPlay: document.getElementById('iconPlay'),
        iconPause: document.getElementById('iconPause'),
        audioProgress: document.getElementById('audioProgress'),
        audioProgressFill: document.getElementById('audioProgressFill'),
        audioProgressThumb: document.getElementById('audioProgressThumb'),
        timeCurrent: document.getElementById('timeCurrent'),
        timeTotal: document.getElementById('timeTotal'),
        waveformDisplay: document.getElementById('waveformDisplay'),
        btnDownload: document.getElementById('btnDownload'),
        btnNewCover: document.getElementById('btnNewCover'),
        volumeProgress: document.getElementById('volumeProgress'),
        volumeFill: document.getElementById('volumeFill'),
        volumeThumb: document.getElementById('volumeThumb'),
        
        toastContainer: document.getElementById('toastContainer'),
        
        // NEW HOYOVERSE UI ELEMENTS
        processingMainTitle: document.getElementById('processingMainTitle'),
        processingSubTitle: document.getElementById('processingSubTitle'),
        progressPercentageText: document.getElementById('progressPercentageText'),
        processingAvatarImg: document.getElementById('processingAvatarImg'),
        processingTip: document.getElementById('processingTip'),
        processingETA: document.getElementById('processingETA'),
        timelineSteps: [
            document.getElementById('step1'),
            document.getElementById('step2'),
            document.getElementById('step3'),
            document.getElementById('step4')
        ],
        timelineLines: [
            document.getElementById('timelineLine1'),
            document.getElementById('timelineLine2'),
            document.getElementById('timelineLine3')
        ],
        resultAvatar: document.getElementById('resultAvatar'),
        resultTitle: document.getElementById('resultTitle'),
        resultCanvas: document.getElementById('resultCanvas'),
        processingCanvas: document.getElementById('processingCanvas'),
        btnCancelJob: document.getElementById('btnCancelJob')
    };

    // Visualizer state
    let visCtx = null;
    let audioCtx = null;
    let analyser = null;
    let dataArray = null;
    let bufferLength = null;
    let sourceNode = null;
    let visParticles = [];
    let visAnimationId = null;

    // State
    const state = {
        isProcessing: false,
        isPlaying: false,
        currentJobId: null,
        serverUrl: 'http://127.0.0.1:7869',
        isDuetMode: false,
        selectedVoice: null,
        selectedVoice2: null,
        get apiEndpoint() {
            return this.serverUrl + '/cover';
        }
    };

    // Check server status in background (optional, just for network tab)
    fetch(state.serverUrl + '/health', { headers: { 'ngrok-skip-browser-warning': '1' } }).catch(() => {});


    // Setup Clock Ticks
    for (let i = 0; i < 60; i++) {
        if (i % 5 === 0) continue; // Skip main hours
        const tick = document.createElement('div');
        tick.className = 'clock-tick';
        tick.style.transform = `translateX(-50%) rotate(${i * 6}deg)`;
        if (els.clockTicks) els.clockTicks.appendChild(tick);
    }
    
    // Initialize Theme
    updateTheme(state.selectedVoice);

    // Setup Fake Waveform
    for (let i = 0; i < 30; i++) {
        const bar = document.createElement('div');
        bar.className = 'wave-bar';
        bar.style.height = `${Math.random() * 40 + 10}%`;
        if (els.waveformDisplay) els.waveformDisplay.appendChild(bar);
    }

    // Particles
    initParticles();

    // Event Listeners
    
    // Duet Toggle
    const duetToggle = document.getElementById('duetToggle');
    if (duetToggle) {
        duetToggle.addEventListener('change', (e) => {
            state.isDuetMode = e.target.checked;
            document.body.classList.toggle('is-duet', state.isDuetMode);
            
            // If turned off, revert to single selection
            if (!state.isDuetMode) {
                state.selectedVoice2 = null;
                voiceOptions.forEach(o => {
                    if (o.dataset.voice !== state.selectedVoice) {
                        o.classList.remove('active');
                    }
                });
                updateTheme(state.selectedVoice);
            }
        });
    }

    // DEBUG SHORTCUT: Shift + T to jump to result screen
    document.addEventListener('keydown', (e) => {
        if (e.shiftKey && e.key === 'T') {
            console.log("DEV MODE: Jumping to Result Panel");
            fetch('audio/miku_voice_clip.mp3')
                .then(res => res.blob())
                .then(blob => {
                    showResult(blob, "Dev Test Mode (Bypass API)");
                })
                .catch(err => console.error("Test audio error:", err));
        }
    });

    // Preload voice files for instant playback
    const preloadedVoices = {
        'kurumi': new Audio('audio/ara_ara.mp3'),
        'elaina': new Audio('audio/elaina_watashi_wa.mp3'),
        'miku': new Audio('audio/miku_voice_clip.mp3'),
        'mirai': new Audio('audio/mirai.mp3?v=' + Date.now())
    };
    
    let currentCharacterAudio = null;
    
    function playCharacterVoice(voice) {
        if (currentCharacterAudio) {
            try {
                currentCharacterAudio.pause();
                currentCharacterAudio.currentTime = 0;
            } catch (e) {
                console.log("Audio pause error:", e);
            }
        }
        
        currentCharacterAudio = preloadedVoices[voice];
        if (currentCharacterAudio) {
            currentCharacterAudio.currentTime = 0;
            currentCharacterAudio.play().catch(e => {
                console.log("Cannot play voice (file missing or autoplay blocked):", e);
            });
        }
    }

    const chibiImage = document.getElementById('chibiImage');
    if (chibiImage) {
        chibiImage.addEventListener('click', () => {
            if (state.selectedVoice) {
                playCharacterVoice(state.selectedVoice);
            }
        });
    }

    // Voice Selection
    const voiceOptions = document.querySelectorAll('.voice-option');
    voiceOptions.forEach(opt => {
        opt.addEventListener('click', () => {
            const voice = opt.dataset.voice;
            
            if (state.isDuetMode) {
                // Duet Mode Logic
                if (opt.classList.contains('active')) {
                    // Cannot deselect if it's the only one
                    if (!state.selectedVoice2) return;
                    
                    opt.classList.remove('active');
                    if (state.selectedVoice === voice) {
                        state.selectedVoice = state.selectedVoice2;
                        state.selectedVoice2 = null;
                    } else {
                        state.selectedVoice2 = null;
                    }
                } else {
                    playCharacterVoice(voice);
                    // Select new voice
                    if (state.selectedVoice && state.selectedVoice2) {
                        // Already 2 selected, replace the second one
                        document.querySelector(`.voice-option[data-voice="${state.selectedVoice2}"]`).classList.remove('active');
                        state.selectedVoice2 = voice;
                        opt.classList.add('active');
                    } else if (state.selectedVoice) {
                        state.selectedVoice2 = voice;
                        opt.classList.add('active');
                    } else {
                        state.selectedVoice = voice;
                        opt.classList.add('active');
                    }
                }
                
                // Set theme to Duet or primary voice
                if (state.selectedVoice && state.selectedVoice2) {
                    updateTheme('duet');
                } else {
                    updateTheme(state.selectedVoice);
                }
            } else {
                // Solo Mode Logic
                playCharacterVoice(voice);
                voiceOptions.forEach(o => o.classList.remove('active'));
                opt.classList.add('active');
                state.selectedVoice = voice;
                state.selectedVoice2 = null;
                updateTheme(state.selectedVoice);
            }
        });
    });
    
    function updateTheme(voiceMode) {
        const root = document.documentElement;
        const chibiImg = document.getElementById('chibiImage');
        
        if (voiceMode === 'duet') {
            const v1 = state.selectedVoice;
            const v2 = state.selectedVoice2;
            const name1 = v1.charAt(0).toUpperCase() + v1.slice(1);
            if (chibiImg) chibiImg.style.display = 'none';
            const name2 = v2.charAt(0).toUpperCase() + v2.slice(1);
            
            // Dynamic Split Screen (V2 on left, V1 on right as requested)
            const bgLeft = `song ca/${v2}_trai.png`;
            const bgRight = `song ca/${v1}_phai.png`;
            
            document.body.style.backgroundImage = `
                linear-gradient(to right, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 50%, rgba(0,0,0,0) 60%),
                url('${bgLeft.replace(' ', '%20')}'), 
                url('${bgRight.replace(' ', '%20')}')
            `;
            document.body.style.backgroundPosition = `center, left center, right center`;
            document.body.style.backgroundSize = `100% 100%, 50% 100%, 50% 100%`;
            document.body.style.backgroundRepeat = `no-repeat, no-repeat, no-repeat`;
            // Temporarily use Kurumi's theme colors for Duet until phase 2
            root.style.setProperty('--clr-red', '#d31027'); 
            root.style.setProperty('--clr-red-bright', '#ff2a3a');
            root.style.setProperty('--clr-red-dark', '#8b0000');
            root.style.setProperty('--clr-border', 'rgba(220, 20, 40, 0.5)');
            root.style.setProperty('--clr-border-glow', 'rgba(255, 30, 50, 0.8)');
            
            document.querySelector('.hero-eyebrow').innerHTML = `DUET MODE <svg viewBox="0 0 24 24"><path d="M12 18.5l-3-2-2-4 1-3 3 1 1-1v4l2 1zM20 9l-4-1-2 3v3l2 4 4 1-1-3 2-2-3-3zM4 9l4-1 2 3v3l-2 4-4 1 1-3-2-2 3-3z"/></svg>`;
            document.querySelector('.hero-title').innerHTML = `${name2} <span class="highlight">x</span> ${name1}`;
            if (document.querySelector('.hero-desc')) document.querySelector('.hero-desc').textContent = `Paste a YouTube link or upload your audio file. Our AI will split the vocals and create a stunning duet cover.`;
            const procTitle = document.getElementById('processingMainTitle');
            if (procTitle) procTitle.textContent = `${name2} & ${name1} are singing...`;
            if (els.resultTitle) els.resultTitle.textContent = `${name2} x ${name1} Duet`;
            els.resultAvatar.style.backgroundImage = `url('avatar/avatar_${state.selectedVoice}.png')`;
            const subtitle = document.getElementById('logoSubtitle');
            if (subtitle) subtitle.textContent = `AI DUET COVER`;
            return;
        }
        
        if (voiceMode === 'elaina') {
                document.body.style.backgroundImage = "url('elaina/anh_nen.png')";
                if (chibiImg) {
                    chibiImg.style.display = 'block';
                    chibiImg.src = "elaina/anh_nho - Copy.png";
                    chibiImg.className = "chibi-image chibi-elaina";
                }
                
                // Elaina Theme (Purple/White)
                root.style.setProperty('--clr-red', '#9b59b6');
                root.style.setProperty('--clr-red-bright', '#af7ac5');
                root.style.setProperty('--clr-red-dark', '#76448a');
                root.style.setProperty('--clr-border', 'rgba(155, 89, 182, 0.5)');
                root.style.setProperty('--clr-border-glow', 'rgba(175, 122, 197, 0.8)');
                
                document.querySelector('.hero-eyebrow').innerHTML = `ELAINA • WANDERING WITCH <svg viewBox="0 0 24 24"><path d="M12 18.5l-3-2-2-4 1-3 3 1 1-1v4l2 1zM20 9l-4-1-2 3v3l2 4 4 1-1-3 2-2-3-3zM4 9l4-1 2 3v3l-2 4-4 1 1-3-2-2 3-3z"/></svg>`;
                document.querySelector('.hero-title').innerHTML = `Turn Any Song Into<br><span class="highlight">An Elaina Cover</span>`;
                if (document.querySelector('.hero-desc')) document.querySelector('.hero-desc').textContent = `Paste a YouTube link or upload your audio file. Our AI will transform the vocals into Elaina's enchanting voice.`;
                const procTitle = document.getElementById('processingMainTitle');
                if (procTitle) procTitle.textContent = `Elaina is singing...`;
                if (els.resultTitle) els.resultTitle.textContent = `Elaina (Wandering Witch)`;
                els.resultAvatar.style.backgroundImage = `url('avatar/avatar_elaina.png')`;
                const subtitle = document.getElementById('logoSubtitle');
                if (subtitle) subtitle.textContent = `イレイナ AI Cover`;
            } else if (voiceMode === 'miku') {
                document.body.style.backgroundImage = "url('miku/anh_nen.png')";
                if (chibiImg) {
                    chibiImg.style.display = 'block';
                    chibiImg.src = "miku/anh_nho_backup.png";
                    chibiImg.className = "chibi-image chibi-miku";
                }
                
                // Miku Theme (Cyan/Teal)
                root.style.setProperty('--clr-red', '#06b6d4'); 
                root.style.setProperty('--clr-red-bright', '#22d3ee');
                root.style.setProperty('--clr-red-dark', '#0891b2');
                root.style.setProperty('--clr-border', 'rgba(6, 182, 212, 0.5)');
                root.style.setProperty('--clr-border-glow', 'rgba(34, 211, 238, 0.8)');
                
                document.querySelector('.hero-eyebrow').innerHTML = `NAKANO MIKU • QUINTESSENTIAL QUINTUPLETS <svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>`;
                document.querySelector('.hero-title').innerHTML = `Turn Any Song Into<br><span class="highlight">A Miku Cover</span>`;
                if (document.querySelector('.hero-desc')) document.querySelector('.hero-desc').textContent = `Paste a YouTube link or upload your audio file. Our AI will transform the vocals into Nakano Miku's iconic voice.`;
                const procTitle = document.getElementById('processingMainTitle');
                if (procTitle) procTitle.textContent = `Miku is singing...`;
                if (els.resultTitle) els.resultTitle.textContent = `Nakano Miku (Quintessential Quintuplets)`;
                els.resultAvatar.style.backgroundImage = `url('avatar/avatar_miku.png')`;
                const subtitle = document.getElementById('logoSubtitle');
                if (subtitle) subtitle.textContent = `中野三玖 AI Cover`;
        } else if (voiceMode === 'kurumi') {
            document.body.style.backgroundImage = "url('img/anh_nen.png')";
            if (chibiImg) {
                chibiImg.style.display = 'block';
                chibiImg.src = "img/anh_nho.png";
                chibiImg.className = "chibi-image chibi-kurumi";
            }
            
            root.style.setProperty('--clr-red', '#d31027'); 
            root.style.setProperty('--clr-red-bright', '#ff2a3a');
            root.style.setProperty('--clr-red-dark', '#8b0000');
            root.style.setProperty('--clr-border', 'rgba(220, 20, 40, 0.5)');
            root.style.setProperty('--clr-border-glow', 'rgba(255, 30, 50, 0.8)');
            
            document.querySelector('.hero-eyebrow').innerHTML = `TOKISAKI KURUMI • DATE A LIVE <svg viewBox="0 0 24 24"><path d="M12 18.5l-3-2-2-4 1-3 3 1 1-1v4l2 1zM20 9l-4-1-2 3v3l2 4 4 1-1-3 2-2-3-3zM4 9l4-1 2 3v3l-2 4-4 1 1-3-2-2 3-3z"/></svg>`;
            document.querySelector('.hero-title').innerHTML = `Turn Any Song Into<br><span class="highlight">A Kurumi Cover</span>`;
            if (document.querySelector('.hero-desc')) document.querySelector('.hero-desc').textContent = `Paste a YouTube link or upload your audio file. Our AI will transform the vocals into Kurumi Tokisaki's enchanting voice.`;
            const procTitle = document.getElementById('processingMainTitle');
            if (procTitle) procTitle.textContent = `Kurumi is singing...`;
            if (els.resultTitle) els.resultTitle.textContent = `Kurumi Tokisaki (Date A Live)`;
            els.resultAvatar.style.backgroundImage = `url('avatar/avatar_kurumi.png')`;
            const subtitle = document.getElementById('logoSubtitle');
            if (subtitle) subtitle.textContent = `時崎狂三 AI Cover`;
        } else if (voiceMode === 'mirai') {
            document.body.style.backgroundImage = "url('Mirai_Kuriyama/anh_nen.png')"; 
            if (chibiImg) {
                chibiImg.style.display = 'block';
                chibiImg.src = "Mirai_Kuriyama/anh_nho.png"; 
                chibiImg.className = "chibi-image chibi-mirai";
            }
            
            root.style.setProperty('--clr-red', '#ff6b81'); 
            root.style.setProperty('--clr-red-bright', '#ff879b');
            root.style.setProperty('--clr-red-dark', '#ff4d66');
            root.style.setProperty('--clr-border', 'rgba(255, 107, 129, 0.5)');
            root.style.setProperty('--clr-border-glow', 'rgba(255, 135, 155, 0.8)');
            
            document.querySelector('.hero-eyebrow').innerHTML = `MIRAI KURIYAMA • BEYOND THE BOUNDARY <svg viewBox="0 0 24 24"><path d="M12 18.5l-3-2-2-4 1-3 3 1 1-1v4l2 1zM20 9l-4-1-2 3v3l2 4 4 1-1-3 2-2-3-3zM4 9l4-1 2 3v3l-2 4-4 1 1-3-2-2 3-3z"/></svg>`;
            document.querySelector('.hero-title').innerHTML = `Turn Any Song Into<br><span class="highlight">A Mirai Cover</span>`;
            if (document.querySelector('.hero-desc')) document.querySelector('.hero-desc').textContent = `Paste a YouTube link or upload your audio file. Our AI will transform the vocals into Mirai Kuriyama's enchanting voice.`;
            const procTitle = document.getElementById('processingMainTitle');
            if (procTitle) procTitle.textContent = `Mirai is singing...`;
            if (els.resultTitle) els.resultTitle.textContent = `Mirai Kuriyama (Beyond the Boundary)`;
            els.resultAvatar.style.backgroundImage = `url('avatar/avatar_mirai.png')`;
            const subtitle = document.getElementById('logoSubtitle');
            if (subtitle) subtitle.textContent = `栗山未来 AI Cover`;
        } else {
            // Default Generic Theme (No character selected)
            document.body.style.backgroundImage = "url('anh_nen/nen1.png')";
            if (chibiImg) chibiImg.style.display = 'none';
            
            root.style.setProperty('--clr-red', '#888'); 
            root.style.setProperty('--clr-red-bright', '#aaa');
            root.style.setProperty('--clr-red-dark', '#555');
            root.style.setProperty('--clr-border', 'rgba(150, 150, 150, 0.5)');
            root.style.setProperty('--clr-border-glow', 'rgba(150, 150, 150, 0.8)');
            
            document.querySelector('.hero-eyebrow').innerHTML = `AI VOICE CONVERTER <svg viewBox="0 0 24 24"><path d="M12 18.5l-3-2-2-4 1-3 3 1 1-1v4l2 1zM20 9l-4-1-2 3v3l2 4 4 1-1-3 2-2-3-3zM4 9l4-1 2 3v3l-2 4-4 1 1-3-2-2 3-3z"/></svg>`;
            document.querySelector('.hero-title').innerHTML = `Select A Character<br><span class="highlight">To Start Singing</span>`;
            if (document.querySelector('.hero-desc')) document.querySelector('.hero-desc').textContent = `Choose a voice model above, then paste a YouTube link or upload your audio file.`;
        }
    }

    els.btnGenerate.addEventListener('click', () => {
        if (!state.selectedVoice) {
            showToast('Please select a character first!', 'error');
            return;
        }
        const url = els.urlInput.value.trim();
        if (!url) {
            showToast('Please enter a YouTube or music URL', 'error');
            return;
        }
        if (url.toLowerCase() === 'test') {
            console.log("DEV MODE: Jumping to Result Panel via test keyword");
            fetch('audio/miku_voice_clip.mp3')
                .then(res => res.blob())
                .then(blob => {
                    showResult(blob, "Dev Test Mode (Bypass API)");
                })
                .catch(err => {
                    console.error("Test audio error:", err);
                    alert("Lỗi load nhạc (hãy bật Live Server lên nhé): " + err.message);
                });
            return;
        }
        processUrl(url);
    });

    els.urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') els.btnGenerate.click();
    });

    els.dropZone.addEventListener('click', () => els.fileInput.click());
    els.fileInput.addEventListener('change', (e) => {
        if (e.target.files.length) processFile(e.target.files[0]);
    });

    els.dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        els.dropZone.classList.add('drag-active');
    });
    els.dropZone.addEventListener('dragleave', () => {
        els.dropZone.classList.remove('drag-active');
    });
    els.dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        els.dropZone.classList.remove('drag-active');
        if (e.dataTransfer.files.length) processFile(e.dataTransfer.files[0]);
    });

    if (els.btnNewCover) {
        els.btnNewCover.addEventListener('click', () => {
            els.urlInput.value = '';
            if (state.isPlaying) togglePlay();
            URL.revokeObjectURL(els.audioPlayer.src);
            resetUI();
        });
    }

    const btnBackToInput = document.getElementById('btnBackToInput');
    if (btnBackToInput) {
        btnBackToInput.addEventListener('click', (e) => {
            e.preventDefault(); // Ngăn trình duyệt nhảy trang
            els.urlInput.value = '';
            if (state.isPlaying) togglePlay();
            if (els.audioPlayer.src) URL.revokeObjectURL(els.audioPlayer.src);
            resetUI();
        });
    }

    // Audio Player controls
    els.btnPlayPause.addEventListener('click', togglePlay);
    els.audioPlayer.addEventListener('timeupdate', updateProgress);
    els.audioPlayer.addEventListener('loadedmetadata', () => {
        if (els.timeTotal) els.timeTotal.textContent = formatTime(els.audioPlayer.duration);
    });
    els.audioPlayer.addEventListener('ended', () => {
        state.isPlaying = false;
        els.iconPlay.style.display = 'block';
        els.iconPause.style.display = 'none';
        if (els.resultPanel) els.resultPanel.classList.remove('is-playing');
        animateWaveform(false);
    });
    
    // Drag slider support
    let isDragging = false;
    els.audioProgress.addEventListener('mousedown', (e) => {
        isDragging = true;
        updateProgressFromEvent(e);
    });
    document.addEventListener('mousemove', (e) => {
        if (isDragging) updateProgressFromEvent(e);
    });
    document.addEventListener('mouseup', () => {
        isDragging = false;
        isDraggingVolume = false;
    });
    
    // Volume slider support
    let isDraggingVolume = false;
    if (els.volumeProgress) {
        els.volumeProgress.addEventListener('mousedown', (e) => {
            isDraggingVolume = true;
            updateVolumeFromEvent(e);
        });
        document.addEventListener('mousemove', (e) => {
            if (isDraggingVolume) updateVolumeFromEvent(e);
        });
    }

    function updateVolumeFromEvent(e) {
        if (!els.volumeProgress) return;
        const rect = els.volumeProgress.getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        
        // Update UI
        if (els.volumeFill) els.volumeFill.style.width = `${pos * 100}%`;
        if (els.volumeThumb) els.volumeThumb.style.left = `${pos * 100}%`;
        
        // Update Audio
        if (els.audioPlayer) els.audioPlayer.volume = pos;
    }
    
    function updateProgressFromEvent(e) {
        const rect = els.audioProgress.getBoundingClientRect();
        let pos = (e.clientX - rect.left) / rect.width;
        pos = Math.max(0, Math.min(1, pos));
        
        // Cập nhật giao diện slider ngay lập tức
        els.audioProgressFill.style.width = `${pos * 100}%`;
        if (els.audioProgressThumb) els.audioProgressThumb.style.left = `${pos * 100}%`;
        
        // Tính giờ
        if (els.audioPlayer.duration) {
            const time = pos * els.audioPlayer.duration;
            els.audioPlayer.currentTime = time;
            if (els.timeCurrent) els.timeCurrent.textContent = formatTime(time);
        }
    }
    
    function formatTime(seconds) {
        if (isNaN(seconds)) return '0:00';
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function updateProgress() {
        if (isDragging) return; // Không update từ audio nếu user đang kéo tay
        const duration = els.audioPlayer.duration;
        const current = els.audioPlayer.currentTime;
        if (duration > 0) {
            const percent = (current / duration) * 100;
            els.audioProgressFill.style.width = `${percent}%`;
            if (els.audioProgressThumb) els.audioProgressThumb.style.left = `${percent}%`;
            if (els.timeCurrent) els.timeCurrent.textContent = formatTime(current);
        }
    }

    if (els.btnCancelJob) {
        els.btnCancelJob.addEventListener('click', async () => {
            if (!state.currentJobId) {
                resetUI();
                state.isProcessing = false;
                return;
            }
            try {
                els.btnCancelJob.textContent = 'ĐANG HỦY...';
                await fetch(state.serverUrl + '/cancel', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'ngrok-skip-browser-warning': '1'
                    },
                    body: JSON.stringify({ job_id: state.currentJobId })
                });
            } catch (e) {
                console.error("Cancel failed:", e);
            }
            if (state.progressInterval) clearInterval(state.progressInterval);
            state.isProcessing = false;
            state.currentJobId = null;
            els.btnCancelJob.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg> HỦY YÊU CẦU';
            resetUI();
            showToast('Đã hủy yêu cầu!', 'warning');
        });
    }

    // Core Logic
    async function processUrl(url) {
        if (state.isProcessing) return;
        state.isProcessing = true;
        
        showProcessingPanel('Sending request to server...');
        
        let voicePayload = state.selectedVoice;
        if (state.isDuetMode && state.selectedVoice2) {
            const n1 = state.selectedVoice.charAt(0).toUpperCase() + state.selectedVoice.slice(1);
            const n2 = state.selectedVoice2.charAt(0).toUpperCase() + state.selectedVoice2.slice(1);
            voicePayload = `Song ca (${n2} x ${n1})`;
        }
        
        try {
            const response = await fetch(state.apiEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '1'
                },
                body: JSON.stringify({ 
                    url, 
                    voice: voicePayload,
                    primary_voice: state.selectedVoice,
                    secondary_voice: state.selectedVoice2,
                    is_duet: state.isDuetMode,
                    duet_strategy: document.getElementById('duetStrategy') ? document.getElementById('duetStrategy').value : 'auto'
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(()=>({}));
                throw new Error(err.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            if (data.job_id) {
                pollJob(data.job_id, `Cover from URL`);
            } else {
                throw new Error("No job_id returned");
            }
        } catch (e) {
            console.warn("Local API failed:", e.message);
            // Fallback to Fly.io
            try {
                els.processingSubTitle.textContent = "AI Offline. Đang mượn Fly.io tải bản gốc...";
                const flyEndpoint = `https://api-server-quiet-sun-776.fly.dev/api/youtube?q=${encodeURIComponent(url)}`;
                const flyRes = await fetch(flyEndpoint);
                if (!flyRes.ok) throw new Error("Fly.io tải thất bại");
                const blob = await flyRes.blob();
                showResult(blob, "Bản Gốc (AI Đang Tắt)");
            } catch (flyErr) {
                console.error("Fly.io error:", flyErr);
                showToast("Máy chủ Tải nhạc và AI đều đang offline!", 'error');
                resetUI();
            }
            state.isProcessing = false;
        }
    }

    // Handle file upload
    async function processFile(file) {
        if (!state.selectedVoice) {
            showToast('Please select a character first!', 'error');
            return;
        }
        
        if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {return;}
        state.isProcessing = true;
        
        showProcessingPanel(`Sending ${file.name} to server...`);
        
        let voicePayload = state.selectedVoice;
        if (state.isDuetMode && state.selectedVoice2) {
            const n1 = state.selectedVoice.charAt(0).toUpperCase() + state.selectedVoice.slice(1);
            const n2 = state.selectedVoice2.charAt(0).toUpperCase() + state.selectedVoice2.slice(1);
            voicePayload = `Song ca (${n2} x ${n1})`;
        }
        
        try {
            const base64Data = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(new Error("Failed to read file"));
                reader.readAsDataURL(file);
            });

            const response = await fetch(state.apiEndpoint, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'ngrok-skip-browser-warning': '1'
                },
                body: JSON.stringify({ 
                    file_data: base64Data,
                    filename: file.name,
                    voice: voicePayload,
                    primary_voice: state.selectedVoice,
                    secondary_voice: state.selectedVoice2,
                    is_duet: state.isDuetMode,
                    duet_strategy: document.getElementById('duetStrategy') ? document.getElementById('duetStrategy').value : 'auto'
                })
            });

            if (!response.ok) {
                const err = await response.json().catch(()=>({}));
                throw new Error(err.error || `Server error: ${response.status}`);
            }

            const data = await response.json();
            if (data.job_id) {
                pollJob(data.job_id, `Cover of ${file.name}`);
            } else {
                throw new Error("No job_id returned");
            }
        } catch (e) {
            console.error(e);
            showToast(e.message, 'error');
            resetUI();
            state.isProcessing = false;
        }
    }

    function showProcessingPanel(msg) {
        els.inputCard.style.display = 'none';
        if (els.featuresBar) els.featuresBar.style.display = 'none';
        els.resultPanel.style.display = 'none';
        els.processingPanel.style.display = 'block';
        els.processingMainTitle.textContent = "🎙 AI ĐANG TỔNG HỢP GIỌNG NÓI";
        els.processingSubTitle.textContent = msg;
        els.progressBar.style.width = '0%';
        els.progressPercentageText.textContent = '0%';
        
        // Reset timeline
        els.timelineSteps.forEach(el => el.classList.remove('active'));
        els.timelineSteps[0].classList.add('active');
        els.timelineLines.forEach(el => el.style.width = '0%');
        
        // Update Avatar based on selected voice
        const avatarMap = {
            'kurumi': 'avatar/avatar_kurumi.png',
            'elaina': 'avatar/avatar_elaina.png',
            'miku': 'avatar/avatar_miku.png',
            'mirai': 'avatar/avatar_mirai.png'
        };
        if (els.processingAvatarImg) {
            els.processingAvatarImg.src = avatarMap[state.selectedVoice] || 'avatar/avatar_kurumi.png';
        }
        
        startProcessingVisualizer();
    }

    function showResult(blob, sourceText) {
        document.body.classList.add('is-playing');
        els.inputCard.style.display = 'none';
        if (els.featuresBar) els.featuresBar.style.display = 'none';
        els.processingPanel.style.display = 'none';
        els.resultPanel.style.display = 'block';
        if (els.resultCanvas) els.resultCanvas.style.display = 'block';
        
        // Update Result Avatar and Title
        if (state.isDuetMode && state.selectedVoice && state.selectedVoice2) {
            // Use duet split avatar or first voice avatar
            els.resultAvatar.style.backgroundImage = `url('avatar/avatar_${state.selectedVoice}.png')`;
            const name1 = state.selectedVoice.charAt(0).toUpperCase() + state.selectedVoice.slice(1);
            const name2 = state.selectedVoice2.charAt(0).toUpperCase() + state.selectedVoice2.slice(1);
            if (els.resultTitle) els.resultTitle.textContent = `${name1} x ${name2}`;
            els.btnDownload.download = `${state.selectedVoice}_x_${state.selectedVoice2}_cover.mp3`;
        } else {
            const voice = state.selectedVoice || 'kurumi';
            els.resultAvatar.style.backgroundImage = `url('avatar/avatar_${voice}.png')`;
            const name1 = voice.charAt(0).toUpperCase() + voice.slice(1);
            if (els.resultTitle) els.resultTitle.textContent = `${name1} AI Cover`;
            els.btnDownload.download = `${voice}_cover.mp3`;
        }
        
        const audioUrl = URL.createObjectURL(blob);
        els.audioPlayer.src = audioUrl;
        els.btnDownload.href = audioUrl;
        els.resultSourceLabel.textContent = sourceText;
        
        // Bắt đầu nhạc luôn
        togglePlay();
    }

    function resetUI() {
        document.body.classList.remove('is-playing');
        els.processingPanel.style.display = 'none';
        els.resultPanel.style.display = 'none';
        if (els.resultCanvas) els.resultCanvas.style.display = 'none';
        els.inputCard.style.display = 'block';
        if (els.featuresBar) els.featuresBar.style.display = 'block';
        
        // Reset slider
        els.audioProgressFill.style.width = '0%';
        if (els.audioProgressThumb) els.audioProgressThumb.style.left = '0%';
        if (els.timeCurrent) els.timeCurrent.textContent = '0:00';
    }

    let startTime = 0;
    const STEP_LABELS = {
        'idle':        'Waiting...',
        'uploading':   '📤 Uploading file...',
        'downloading': '⬇️ Downloading audio...',
        'separating':  '🎵 Extracting vocals...',
        'converting':  '🎙️ Applying Kurumi voice...',
        'mixing':      '🎚️ Mixing vocals & music...',
        'encoding':    '🎧 Encoding MP3...',
    };

    const TIPS = [
        "💡 Mẹo: AI đang giữ nguyên cảm xúc bài hát, để bản cover chân thực nhất nhé!",
        "🎵 Đừng đóng trình duyệt trong lúc render.",
        "🎧 Nhâm nhi một tách trà trong lúc đợi nhé!",
        "✨ AI đang phân tích từng nhịp điệu của bài hát...",
        "🎙 Giọng của AI rất hợp với các bài hát nhẹ nhàng đấy!"
    ];

    function pollJob(job_id, sourceText) {
        state.currentJobId = job_id;
        startTime = Date.now();
        const timerEl = document.getElementById('processingTimer');
        const etaEl = els.processingETA;
        
        els.progressBar.style.width = '5%';
        els.progressPercentageText.textContent = '5%';
        els.processingSubTitle.textContent = 'Job started...';
        if (timerEl) timerEl.textContent = '00:00';
        if (etaEl) etaEl.textContent = '--:--';
        
        // Setup tips cycling
        let tipIndex = 0;
        let tipInterval;
        if (els.processingTip) {
            els.processingTip.textContent = TIPS[0];
            tipInterval = setInterval(() => {
                tipIndex = (tipIndex + 1) % TIPS.length;
                els.processingTip.style.opacity = '0';
                setTimeout(() => {
                    els.processingTip.textContent = TIPS[tipIndex];
                    els.processingTip.style.opacity = '1';
                }, 300);
            }, 5000);
            els.processingTip.style.transition = 'opacity 0.3s ease';
        }

        state.progressInterval = setInterval(async () => {
            // Elapsed clock
            const elapsedSec = Math.floor((Date.now() - startTime) / 1000);
            const eMin = Math.floor(elapsedSec / 60).toString().padStart(2, '0');
            const eSec = (elapsedSec % 60).toString().padStart(2, '0');
            if (timerEl) timerEl.textContent = `${eMin}:${eSec}`;

            try {
                const r = await fetch(state.serverUrl + '/job/' + job_id, {
                    method: 'GET',
                    cache: 'no-store',
                    headers: { 'ngrok-skip-browser-warning': '1' }
                });
                if (!r.ok) throw new Error();
                const data = await r.json();

                if (data.status === 'error') {
                    throw new Error(data.error || "Server processing failed");
                }
                
                if (data.status === 'pending_approval') {
                    els.processingSubTitle.textContent = '⏳ Đang chờ Admin phê duyệt yêu cầu trên điện thoại...';
                    els.progressBar.style.width = '100%';
                    els.progressPercentageText.textContent = 'Waiting';
                    els.progressBar.style.animation = 'pulse 1s infinite alternate';
                    if (etaEl) etaEl.textContent = 'Chờ duyệt';
                    return;
                } else if (data.status === 'queued') {
                    els.processingSubTitle.textContent = '⏳ Yêu cầu đã được duyệt! Đang xếp hàng chờ tới lượt...';
                    els.progressBar.style.width = '100%';
                    els.progressPercentageText.textContent = 'Queued';
                    els.progressBar.style.animation = 'pulse 1s infinite alternate';
                    if (etaEl) etaEl.textContent = 'Đang xếp hàng';
                    return;
                } else {
                    els.progressBar.style.animation = '';
                }
                
                if (data.status === 'done' || data.status === 'completed' || data.status === 'success') {
                    clearInterval(state.progressInterval);
                    clearInterval(tipInterval);
                    const totalTime = timerEl ? timerEl.textContent : '00:00';
                    els.processingSubTitle.textContent = `🎉 Hoàn tất! Tổng thời gian chạy: ${totalTime}`;
                    els.progressBar.style.width = '100%';
                    els.progressBar.style.background = 'linear-gradient(90deg, #00f2fe, #4facfe)';
                    els.progressPercentageText.textContent = '100%';
                    
                    els.timelineSteps.forEach(el => el.classList.add('active'));
                    els.timelineLines.forEach(el => el.style.width = '100%');
                    
                    setTimeout(async () => {
                        try {
                            const dlRes = await fetch(state.serverUrl + '/download/' + job_id, {
                                headers: { 'ngrok-skip-browser-warning': '1' }
                            });
                            if (!dlRes.ok) throw new Error("Download failed");
                            
                            const blob = await dlRes.blob();
                            showResult(blob, sourceText);
                            showToast('Conversion complete!', 'success');
                            state.isProcessing = false;
                        } catch (e) {
                            showToast(e.message, 'error');
                            resetUI();
                        }
                    }, 1000);
                    return;
                }

                if (data.progress) {
                    const p = data.progress;
                    const label = STEP_LABELS[p.step] || 'Processing...';
                    els.processingSubTitle.textContent = label;

                    if (p.pct > 0) {
                        els.progressBar.style.width = `${p.pct}%`;
                        els.progressPercentageText.textContent = `${Math.floor(p.pct)}%`;
                        
                        // Update timeline
                        els.timelineSteps[0].classList.add('active'); // always active
                        // Line 1: Phân tích (0% - 10%)
                        if (p.pct >= 10) { els.timelineLines[0].style.width = '100%'; els.timelineSteps[1].classList.add('active'); }
                        else { els.timelineLines[0].style.width = `${(p.pct/10)*100}%`; els.timelineSteps[1].classList.remove('active'); }
                        
                        // Line 2: Lọc nhiễu (10% - 60%)
                        if (p.pct >= 60) { els.timelineLines[1].style.width = '100%'; els.timelineSteps[2].classList.add('active'); }
                        else if (p.pct > 10) { els.timelineLines[1].style.width = `${((p.pct-10)/50)*100}%`; els.timelineSteps[2].classList.remove('active'); }
                        else { els.timelineLines[1].style.width = '0%'; els.timelineSteps[2].classList.remove('active'); }
                        
                        // Line 3: AI Cover (60% - 85%)
                        if (p.pct >= 85) { els.timelineLines[2].style.width = '100%'; els.timelineSteps[3].classList.add('active'); }
                        else if (p.pct > 60) { els.timelineLines[2].style.width = `${((p.pct-60)/25)*100}%`; els.timelineSteps[3].classList.remove('active'); }
                        else { els.timelineLines[2].style.width = '0%'; els.timelineSteps[3].classList.remove('active'); }
                    }

                    if (p.eta && p.step === 'separating') {
                        const parts = p.eta.split(':').map(Number);
                        const etaSec = (parts[0] || 0) * 60 + (parts[1] || 0);
                        etaEl.textContent = `${etaSec} giây`;
                    } else if (p.eta) {
                        etaEl.textContent = p.eta;
                    } else if (etaEl) {
                        etaEl.textContent = '--:--';
                    }
                }
            } catch (err) {
                console.error("Polling error:", err);
                if (err.message && err.message !== "Failed to fetch") {
                    clearInterval(state.progressInterval);
                    clearInterval(tipInterval);
                    showToast(err.message, 'error');
                    resetUI();
                    state.isProcessing = false;
                }
            }
        }, 1000);
    }

    function togglePlay() {
        if (state.isPlaying) {
            els.audioPlayer.pause();
            els.iconPlay.style.display = 'block';
            els.iconPause.style.display = 'none';
        } else {
            if (!audioCtx) initVisualizer(); // Init audio context on first play interaction
            if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
            
            els.audioPlayer.play();
            els.iconPlay.style.display = 'none';
            els.iconPause.style.display = 'block';
        }
        state.isPlaying = !state.isPlaying;
        if (els.resultPanel) els.resultPanel.classList.toggle('is-playing', state.isPlaying);
        animateWaveform(state.isPlaying);
    }

    function initVisualizer() {
        if (!els.resultCanvas) return;
        
        // Full screen background setup
        // Use document.documentElement.clientWidth to exclude scrollbar width, keeping it perfectly centered!
        els.resultCanvas.width = document.documentElement.clientWidth;
        els.resultCanvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            if (els.resultCanvas) {
                els.resultCanvas.width = document.documentElement.clientWidth;
                els.resultCanvas.height = window.innerHeight;
            }
        });
        
        visCtx = els.resultCanvas.getContext('2d');
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.2; // Tăng kịch trần độ nhạy của Web Audio API (Mặc định 0.8 rất chậm)
        bufferLength = analyser.frequencyBinCount;
        dataArray = new Uint8Array(bufferLength);
        
        sourceNode = audioCtx.createMediaElementSource(els.audioPlayer);
        sourceNode.connect(analyser);
        analyser.connect(audioCtx.destination);
        
        // Init particles
        for(let i=0; i<30; i++) {
            visParticles.push({
                x: Math.random() * els.resultCanvas.width,
                y: Math.random() * els.resultCanvas.height,
                size: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * 1,
                speedY: (Math.random() - 0.5) * 1,
                alpha: Math.random() * 0.5 + 0.1
            });
        }
        
        drawVisualizer();
    }

    const VIS_THEMES = {
        'elaina': {
            glowColor: '#bc13fe',
            coreColor: '#f875ff',
            waveOffset: 120, 
            particles: { 
                type: 'text', 
                text: ['⭐', '✨', '🌙', '🦋', '🔮', '📖', '💎', '☄️'], 
                colors: 'rgba(255, 100, 255, ' 
            },
            drawBackground: function(ctx, w, h, time, intensity) {
                // Background: Bầu trời sao thiên hà
                ctx.save();
                ctx.fillStyle = `rgba(30, 10, 50, ${0.3 + intensity * 0.2})`;
                ctx.fillRect(0, 0, w, h);
                // Sao lấp lánh (vẽ vài điểm ngẫu nhiên bằng cách băm tọa độ theo thời gian)
                for(let i=0; i<30; i++) {
                    let x = (Math.sin(i*123 + time*0.2) * 0.5 + 0.5) * w;
                    let y = (Math.cos(i*321 + time*0.3) * 0.5 + 0.5) * h;
                    let r = Math.sin(time*5 + i) * 1.5 + 1.5;
                    ctx.fillStyle = `rgba(255, 200, 255, ${0.3 + intensity * 0.7})`;
                    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI*2); ctx.fill();
                }
                ctx.restore();
            },
            drawRing: function(ctx, centerX, centerY, radius, time, intensity = 0) {
                ctx.save();
                ctx.translate(centerX, centerY);
                const scale = 1 + (intensity * 0.2); 
                ctx.scale(scale, scale);
                
                // Vòng phép thuật (Magic Glyphs)
                // Vòng 1 (Trong cùng)
                ctx.save();
                ctx.rotate(time * 1.2); // Tăng tốc độ quay
                ctx.beginPath();
                ctx.arc(0, 0, radius + 15, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(188, 19, 254, ${0.5 + intensity * 0.5})`;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                // Vẽ Rune giả (các chấm và gạch)
                ctx.setLineDash([4, 6, 12, 6]);
                ctx.beginPath();
                ctx.arc(0, 0, radius + 12, 0, Math.PI * 2);
                ctx.stroke();
                ctx.setLineDash([]);
                ctx.restore();

                // Vòng 2 (Giữa) quay ngược
                ctx.save();
                ctx.rotate(-time * 1.5); // Tăng tốc độ quay
                ctx.beginPath();
                ctx.arc(0, 0, radius + 25, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(248, 117, 255, ${0.7 + intensity * 0.5})`;
                ctx.lineWidth = 2 + (intensity * 2);
                ctx.stroke();
                
                // Ngôi sao 6 cánh (Star of David)
                ctx.beginPath();
                for(let i=0; i<6; i++) {
                    const a = i * Math.PI / 3;
                    const r2 = (i%2===0) ? radius + 25 : radius + 15;
                    ctx.lineTo(Math.cos(a)*r2, Math.sin(a)*r2);
                }
                ctx.closePath();
                ctx.strokeStyle = `rgba(255, 255, 255, 0.4)`;
                ctx.stroke();
                ctx.restore();

                // Vòng 3 (Ngoài cùng)
                ctx.save();
                ctx.rotate(time * 0.3);
                ctx.beginPath();
                ctx.arc(0, 0, radius + 35, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(100, 50, 255, 0.4)`;
                ctx.lineWidth = 1;
                ctx.stroke();
                ctx.restore();

                ctx.restore();
            }
        },
        'kurumi': {
            glowColor: '#ff1e1e',
            coreColor: '#ffbaba',
            waveOffset: 120, 
            particles: { 
                type: 'text', 
                text: ['🌹', '🦋', '❤️', '🔥', '🩸', '⏰', '⚙️', '✨'], 
                colors: 'rgba(255, 30, 30, ' 
            },
            drawBackground: function(ctx, w, h, time, intensity) {
                // Không gian đỏ sương đen
                ctx.save();
                const grad = ctx.createRadialGradient(w/2, h/2, 50, w/2, h/2, w);
                grad.addColorStop(0, `rgba(40, 0, 0, ${0.2 + intensity * 0.3})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0.8)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                // Đồng hồ Zafkiel mờ khổng lồ
                ctx.translate(w/2, h/2);
                ctx.rotate(time * 0.1); // Xoay rất chậm
                ctx.globalAlpha = 0.1 + intensity * 0.1;
                ctx.strokeStyle = '#ff1e1e';
                ctx.lineWidth = 2;
                ctx.beginPath(); ctx.arc(0, 0, h, 0, Math.PI*2); ctx.stroke();
                ctx.beginPath(); ctx.arc(0, 0, h - 20, 0, Math.PI*2); ctx.stroke();
                
                const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
                ctx.font = 'bold 30px "Times New Roman", serif';
                ctx.fillStyle = '#ff1e1e';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                for (let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI / 6) - Math.PI / 2;
                    const nx = Math.cos(angle) * (h - 50);
                    const ny = Math.sin(angle) * (h - 50);
                    ctx.save(); ctx.translate(nx, ny); ctx.rotate(angle + Math.PI/2);
                    ctx.fillText(numerals[i], 0, 0); ctx.restore();
                }
                ctx.restore();
            },
            drawRing: function(ctx, centerX, centerY, radius, time, intensity = 0) {
                const rotation = (time * 2.5) % (Math.PI * 2); // Xoay nhanh hơn
                ctx.save();
                ctx.translate(centerX, centerY);
                
                const scale = 1 + (intensity * 0.35); 
                ctx.scale(scale, scale);
                ctx.rotate(rotation);
                
                // Outer thick ring
                ctx.beginPath();
                ctx.arc(0, 0, radius + 40, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(184, 10, 30, ${0.8 + intensity * 0.2})`;
                ctx.lineWidth = 6 + (intensity * 4);
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#FF3D5E';
                ctx.stroke();
                
                // Inner thin ring
                ctx.beginPath();
                ctx.arc(0, 0, radius + 15, 0, Math.PI * 2);
                ctx.strokeStyle = `rgba(255, 61, 94, ${0.5 + intensity * 0.5})`;
                ctx.lineWidth = 2;
                ctx.shadowBlur = 0;
                ctx.stroke();
                
                // Roman Numerals
                const numerals = ['XII', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
                ctx.font = 'bold 16px "Times New Roman", serif';
                ctx.fillStyle = '#FFD9E1';
                ctx.shadowBlur = 5;
                ctx.shadowColor = '#FF3D5E';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                
                for (let i = 0; i < 12; i++) {
                    const angle = (i * Math.PI / 6) - Math.PI / 2;
                    const nx = Math.cos(angle) * (radius + 28); // Inside the outer ring
                    const ny = Math.sin(angle) * (radius + 28);
                    ctx.save();
                    ctx.translate(nx, ny);
                    ctx.rotate(angle + Math.PI/2);
                    ctx.fillText(numerals[i], 0, 0);
                    ctx.restore();
                }
                
                // Clock Hands
                // Second hand (rotates continuously)
                ctx.rotate(time * 0.5);
                ctx.beginPath();
                ctx.moveTo(0, 10);
                ctx.lineTo(0, -radius - 5);
                ctx.strokeStyle = `rgba(255, 61, 94, ${0.8 + intensity * 0.5})`;
                ctx.lineWidth = 1;
                ctx.stroke();
                
                // Minute hand (rotates only when playing/intensity > 0)
                // We'll simulate its movement using an accumulated value if possible, or just time * intensity
                ctx.rotate(-time * 0.1 * (1 + intensity * 5));
                ctx.beginPath();
                ctx.moveTo(0, 8);
                ctx.lineTo(0, -radius + 5);
                ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 + intensity * 0.5})`;
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Center pin
                ctx.beginPath();
                ctx.arc(0, 0, 4, 0, Math.PI * 2);
                ctx.fillStyle = '#FF3D5E';
                ctx.fill();

                ctx.restore();
            }
        },
        'miku': {
            glowColor: '#38bdf8', 
            coreColor: '#e0f2fe',
            waveOffset: 120, 
            particles: { 
                type: 'text', 
                text: ['🎵', '🌸', '🍃', '🦋', '💙', '✨'], 
                colors: 'rgba(56, 189, 248, ' 
            },
            drawBackground: function(ctx, w, h, time, intensity) {
                ctx.save();
                const grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, `rgba(10, 20, 40, ${0.4 + intensity * 0.2})`);
                grad.addColorStop(0.7, 'rgba(5, 10, 25, 0.8)');
                grad.addColorStop(1, 'rgba(0, 30, 60, 0.9)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);
                
                ctx.beginPath();
                for(let x=0; x<=w; x+=20) {
                    let y = h - 20 + Math.sin(x*0.05 + time) * 5 + Math.cos(x*0.02 - time*0.5) * 3;
                    if(x===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
                }
                ctx.lineTo(w, h); ctx.lineTo(0, h);
                ctx.fillStyle = `rgba(56, 189, 248, ${0.1 + intensity * 0.15})`;
                ctx.fill();
                ctx.restore();
            },
            drawRing: function(ctx, centerX, centerY, radius, time, intensity = 0) {
                ctx.save();
                ctx.translate(centerX, centerY);
                
                const scale = 1 + (intensity * 0.3);
                ctx.scale(scale, scale);
                
                ctx.globalAlpha = 0.8 + (intensity * 0.2);
                
                ctx.beginPath();
                ctx.arc(0, 0, radius + 15, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(56, 189, 248, 0.2)';
                ctx.lineWidth = 4;
                ctx.stroke();

                ctx.lineWidth = 4 + (intensity * 4);
                ctx.lineCap = 'round';
                
                const numArcs = 4;
                for(let i=0; i<numArcs; i++) {
                    ctx.save();
                    ctx.rotate(time * (2 + i*0.5) + i * Math.PI/2);
                    ctx.beginPath();
                    let arcLen = Math.PI/3 + intensity * Math.PI/2;
                    ctx.arc(0, 0, radius + 15 + i*8, 0, arcLen);
                    ctx.strokeStyle = `rgba(56, 189, 248, ${0.6 + intensity*0.4})`;
                    ctx.stroke();
                    ctx.restore();
                }
                
                ctx.rotate(-time * 1.5);
                ctx.font = '14px Arial';
                ctx.fillStyle = `rgba(224, 242, 254, ${0.5 + intensity * 0.5})`;
                ctx.fillText('🎵', 0, -(radius + 35 + intensity * 10));
                ctx.fillText('♪', 0, radius + 35 + intensity * 10);
                
                ctx.restore();
            }
        },
        'mirai': {
            glowColor: '#ff6b81',
            coreColor: '#ffeef0',
            particles: { 
                type: 'text', 
                text: ['🌸', '🩸', '⚔️', '✨', '🥀', '👓', '🩸', '🌸'], 
                colors: 'rgba(255, 107, 129, ' 
            },
            particleColor: 'rgba(255, 107, 129, 0.8)',
            particleCore: 'rgba(255, 255, 255, 0.9)'
        }
    };

    function drawThemeVisualizer(ctx, canvas, dataArray, bufferLength, time, isSimulating, particlesArr) {
        if (state.isDuetMode && state.selectedVoice && state.selectedVoice2) {
            drawDuetVisualizer(ctx, canvas, dataArray, bufferLength, time, isSimulating, particlesArr);
            return;
        }

        const width = canvas.width;
        const height = canvas.height;
        const centerY = isSimulating ? height / 2 : height / 2 - 50;
        const centerX = width / 2;
        
        const themeName = state.selectedVoice || 'elaina';
        const theme = VIS_THEMES[themeName] || VIS_THEMES['elaina'];
        
        ctx.clearRect(0, 0, width, height);

        // 1. Lõi Web Audio & Tính toán lực đập (globalIntensity)
        let intensity = 0;
        if (!isSimulating && dataArray) {
            let sum = 0;
            const beatLength = Math.floor(bufferLength / 3); // Lọc Bass (Low frequency)
            for (let i = 0; i < beatLength; i++) sum += dataArray[i];
            intensity = (sum / beatLength) / 255;
            
            // Làm mượt (Smooth interpolation)
            state.smoothIntensity = state.smoothIntensity || 0;
            state.smoothIntensity = state.smoothIntensity * 0.8 + intensity * 0.2;
            intensity = Math.pow(state.smoothIntensity, 1.5);
        } else {
            intensity = Math.max(0, Math.sin(time * 8)) * 0.4;
        }

        // Draw Theme Background
        if (theme.drawBackground) {
            theme.drawBackground(ctx, width, height, time, intensity);
        }

        // 5. Camera Shake
        ctx.save();
        if (intensity > 0.4) {
            const shake = (intensity - 0.4) * 8; // Rung tới 4px
            ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
        }

        // 6. Background Reactive (Cập nhật CSS biến từ JS)
        document.body.style.filter = `brightness(${100 + intensity * 60}%)`;

        // 4. Hệ thống Hạt Vật Lý Mới (Advanced Physics Engine)
        if (intensity > 0.5 && Math.random() > 0.3 && particlesArr.length < 80) { // Giảm số lượng tối đa xuống 80 để mượt hơn
            particlesArr.push({
                x: centerX,
                y: centerY,
                size: Math.random() * 0.5 + 0.5, // Dùng size làm hệ số scale (0.5 -> 1.0) thay vì pixel
                speedX: (Math.random() - 0.5) * 15 * intensity,
                speedY: (Math.random() - 0.5) * 15 * intensity,
                alpha: 1.0,
                type: 'burst'
            });
        }
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = '20px Arial'; // SET FONT 1 LẦN DUY NHẤT ĐỂ TRÁNH LAG (RẤT QUAN TRỌNG)
        
        particlesArr.forEach((p, idx) => {
            let speedMult = 1 + (intensity * 5); // Base speed multiplier cao hơn
            let char = theme.particles.text[idx % theme.particles.text.length];
            
            // Vật lý đặc trưng theo Theme
            if (themeName === 'kurumi') {
                // Hạt bay lên trên (lửa/bướm)
                p.speedY -= 0.15; // Gravity âm mạnh hơn để bốc cao
                if (char === '🦋') {
                    p.speedX += Math.sin(time*4 + idx)*0.5; // Bướm bay lắc mạnh
                }
            } else if (themeName === 'elaina') {
                // Bụi sao rơi xuống chéo
                p.speedY += 0.05; // Rơi nhanh hơn
                p.speedX += 0.03;
                if (char === '🦋') {
                    if (intensity < 0.3) speedMult = 0.3; // Bướm đậu khi hết bass
                    else speedMult = 6;
                }
            } else if (themeName === 'miku') {
                // Nốt nhạc trôi bồng bềnh nhẹ
                p.speedY -= 0.03;
                if (char === '🌸' || char === '🍃') {
                    p.speedY += 0.06; // Hoa rơi nhanh hơn
                    p.speedX += Math.sin(time*2 + idx)*0.2;
                }
            }
            
            // Cản gió (Friction) ít đi để bay được xa hơn
            p.speedX *= 0.99;
            p.speedY *= 0.99;
            
            p.x += p.speedX * speedMult;
            p.y += p.speedY * speedMult;
            
            if (p.type === 'burst') p.alpha -= 0.01;
            
            if (p.alpha <= 0 || p.x < -20 || p.x > width+20 || p.y < -20 || p.y > height+20) {
                if (p.type === 'burst') {
                    particlesArr.splice(idx, 1);
                    return;
                }
                // Respawn random edge
                p.x = Math.random() * width;
                p.y = (themeName === 'kurumi') ? height + 10 : (themeName === 'miku' && Math.random()>0.5 ? -10 : Math.random() * height);
                p.speedX = (Math.random() - 0.5) * 2;
                p.speedY = (Math.random() - 0.5) * 2;
                p.alpha = Math.random() * 0.5 + 0.3;
            }
            
            ctx.fillStyle = theme.particles.colors + p.alpha + ')';
            
            ctx.save();
            ctx.translate(p.x, p.y);
            // Xoay hạt ngẫu nhiên và Scale bằng hệ số (Thay vì đổi ctx.font)
            ctx.rotate(time * (idx%3===0 ? 1 : -1) * 0.5 + idx);
            // Kích thước thật = base size (20px) * p.size
            ctx.scale(p.size, p.size);
            ctx.fillText(char, 0, 0);
            ctx.restore();
        });

        // 8. Ring Particles (Orbiting)
        if (!state.orbitParticles) {
            state.orbitParticles = [];
            for (let i = 0; i < 15; i++) {
                state.orbitParticles.push({ 
                    angle: Math.random() * Math.PI * 2, 
                    dist: 90 + Math.random() * 30, 
                    speed: (Math.random() * 0.03 + 0.01) * (Math.random() > 0.5 ? 1 : -1),
                    char: ['✦', '✧', '✨'][Math.floor(Math.random() * 3)]
                });
            }
        }
        
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Font tĩnh 20px cho Orbit, dùng scale để phóng to
        ctx.font = '20px Arial'; 
        
        state.orbitParticles.forEach(op => {
            op.angle += op.speed * (1 + intensity * 3);
            const ox = centerX + Math.cos(op.angle) * (op.dist + intensity * 40);
            const oy = centerY + Math.sin(op.angle) * (op.dist + intensity * 40);
            
            ctx.fillStyle = theme.particles.colors + (0.5 + intensity * 0.5) + ')';
            
            ctx.save();
            ctx.translate(ox, oy);
            // Scale dựa trên bass
            const opScale = 0.5 + intensity * 0.5;
            ctx.scale(opScale, opScale);
            ctx.fillText(op.char, 0, 0);
            ctx.restore();
        });

        const avatarRadius = 75;
        
        // 2 & 7. Avatar Pulse & Bloom
        ctx.save();
        const avatarScale = 1 + (intensity * 0.15); // Scale 1 -> 1.15
        ctx.translate(centerX, centerY);
        ctx.scale(avatarScale, avatarScale);
        
        // Cache Avatar Image to prevent flickering on every frame
        if (!state.avatarCache) state.avatarCache = {};
        if (!state.avatarCache[themeName]) {
            const img = new Image();
            const avatarMap = { 'kurumi': 'avatar/avatar_kurumi.png', 'elaina': 'avatar/avatar_elaina.png', 'miku': 'avatar/avatar_miku.png', 'mirai': 'avatar/avatar_mirai.png' };
            img.src = avatarMap[themeName] || 'avatar/avatar_kurumi.png';
            state.avatarCache[themeName] = img;
        }
        const avatarImg = state.avatarCache[themeName];
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
        ctx.clip();
        
        // Bloom effect on avatar when bass is strong
        if (intensity > 0.4) {
            // KHONG dung 'lighter' o day vi no se lam trang bech va chay sang (overexpose) buc anh avatar
            // ctx.globalCompositeOperation = 'lighter'; 
            ctx.shadowBlur = 25 * intensity;
            ctx.shadowColor = theme.glowColor;
        }

        if (avatarImg.complete && avatarImg.naturalWidth > 0) {
            ctx.drawImage(avatarImg, -avatarRadius, -avatarRadius, avatarRadius * 2, avatarRadius * 2);
        }
        ctx.restore();

        // Draw avatar core ring
        ctx.beginPath();
        ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
        ctx.strokeStyle = theme.coreColor;
        ctx.lineWidth = 3;
        ctx.stroke();
        
        ctx.restore(); // Restore scale and translation for Avatar Image

        // Draw Avatar Ring (3. Ring rotating handled inside theme)
        if (theme.drawRing) theme.drawRing(ctx, centerX, centerY, avatarRadius, time, intensity);

        // 3. Sóng Âm (Waveform) - Smooth Interpolation
        if (theme.drawWaveform) {
            theme.drawWaveform(ctx, centerX, centerY, avatarRadius, dataArray, bufferLength, time, intensity, isSimulating);
        } else {
            // Sóng âm dưới đáy màn hình (Mirrored EQ)
            const barWidth = 12; 
            const spacing = 3;
            const halfBars = Math.floor(width / (barWidth + spacing) / 2);
            const maxBars = halfBars * 2;
            const totalWidth = maxBars * (barWidth + spacing);
            const startX = centerX - (totalWidth / 2);
            const bottomY = height;
            
            // Fix mảng bị NaN khi resize màn hình
            if (!state.smoothBars || state.smoothBars.length !== maxBars) {
                state.smoothBars = new Array(maxBars).fill(0);
            }

            for (let i = 0; i < maxBars; i++) {
                let targetVal = 0;
                if (isSimulating) {
                    const wave1 = Math.sin(i * 0.2 + time * 5) * 30;
                    const wave2 = Math.sin(i * 0.1 - time * 3) * 50;
                    targetVal = Math.max(5, Math.abs(wave1 + wave2) + 10);
                } else {
                    let mappedI = i < halfBars ? (halfBars - 1 - i) : (i - halfBars);
                    // Dùng đường cong nhẹ để lấy tần số mượt hơn
                    const freqRatio = Math.pow(mappedI / halfBars, 1.2); 
                    const dataIndex = Math.floor(freqRatio * (bufferLength * 0.35));
                    
                    const rVal = (dataArray ? dataArray[dataIndex] : 0) / 255;
                    const beatScale = 1 + (intensity * 0.5);
                    targetVal = Math.max(4, Math.pow(rVal, 1.4) * (height * 0.35) * beatScale);
                }
                
                state.smoothBars[i] = state.smoothBars[i] * 0.4 + targetVal * 0.6;
                const h = Math.max(4, Math.min(height * 0.6, state.smoothBars[i]));
                
                const x = startX + i * (barWidth + spacing);
                const y = bottomY - h;
                
                // 1. Thân cột tối màu (tạo cảm giác hình khối)
                ctx.fillStyle = 'rgba(10, 5, 5, 0.7)';
                ctx.shadowBlur = 0;
                ctx.fillRect(x, y, barWidth, h);
                
                // 2. Đỉnh cột phát sáng (Glowing Cap)
                ctx.fillStyle = theme.glowColor || '#FF3D5E';
                ctx.shadowBlur = 15 + (intensity * 25);
                ctx.shadowColor = theme.glowColor || '#FF3D5E';
                // Đỉnh sáng dày 4px
                ctx.fillRect(x, y, barWidth, 4);
                
                // 3. Đổ bóng mờ xuống dọc thân để tạo cảm giác Neon phản chiếu
                const grad = ctx.createLinearGradient(0, y, 0, y + h);
                grad.addColorStop(0, theme.glowColor ? theme.glowColor + 'aa' : 'rgba(255, 61, 94, 0.6)');
                grad.addColorStop(0.3, theme.glowColor ? theme.glowColor + '00' : 'rgba(255, 61, 94, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(x, y + 4, barWidth, h - 4);
            }
            
            ctx.shadowBlur = 0;
            ctx.globalAlpha = 1.0; 
        }
        
        ctx.restore(); // Restore Camera Shake
    }

    // ==========================================
    // DUET MODE VISUALIZER (Bản sắc Song Ca)
    // ==========================================
    function drawDuetVisualizer(ctx, canvas, dataArray, bufferLength, time, isSimulating, particlesArr) {
        const width    = canvas.width;
        const height   = canvas.height;
        const centerY  = height / 2;

        const centerLeft  = width * 0.20;
        const centerRight = width * 0.80;
        const centerX     = width * 0.50;

        const theme1 = VIS_THEMES[state.selectedVoice2] || VIS_THEMES['elaina'];
        const theme2 = VIS_THEMES[state.selectedVoice]  || VIS_THEMES['kurumi'];

        ctx.clearRect(0, 0, width, height);

        // --- INTENSITY & BREATHING ---
        let iLeft = 0, iRight = 0;
        if (!isSimulating && dataArray) {
            let sumL = 0, sumR = 0;
            const third = Math.floor(bufferLength / 3);
            for (let i = 0; i < third; i++) sumL += dataArray[i];
            for (let i = third; i < third*2; i++) sumR += dataArray[i];
            iLeft  = (sumL / third) / 255;
            iRight = (sumR / third) / 255;
            state.smoothILeft  = (state.smoothILeft  || 0) * 0.75 + iLeft  * 0.25;
            state.smoothIRight = (state.smoothIRight || 0) * 0.75 + iRight * 0.25;
            iLeft  = Math.pow(state.smoothILeft,  1.5);
            iRight = Math.pow(state.smoothIRight, 1.5);
        } else {
            iLeft  = Math.max(0, Math.sin(time * 1.8)) * 0.45;
            iRight = Math.max(0, Math.cos(time * 1.8)) * 0.45;
        }
        const maxI = Math.max(iLeft, iRight);
        document.body.style.filter = `brightness(${100 + maxI * 15}%)`;

        const breathing = Math.sin(time * 1.5) * 0.5 + 0.5; // 0 to 1
        const globalGlowMod = 1 + breathing * 0.25;

        // --- SOFT BACKGROUND BLOOM (Preserving dark contrast) ---
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const bgBloom = ctx.createRadialGradient(centerX, centerY, height * 0.1, centerX, centerY, width * 0.5);
        bgBloom.addColorStop(0, 'rgba(180, 100, 255, 0.05)'); 
        bgBloom.addColorStop(0.5, 'rgba(100, 150, 255, 0.02)'); 
        bgBloom.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bgBloom;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();

        // --- SIZING ---
        const avatarRadius = width * 0.042;
        const heartBaseSize = (width * 0.012) * 1.15; // Increased further from 0.95 to 1.15
        const heartRingInner = heartBaseSize * 2.8;
        const heartRingMiddle = heartBaseSize * 3.8;
        const heartRingOuter = heartBaseSize * 5.0;

        // --- GLOBAL GRADIENT (Distinct Left/Right colors blending at center) ---
        const waveGrad = ctx.createLinearGradient(0, 0, width, 0);
        waveGrad.addColorStop(0.0,  theme1.glowColor);
        waveGrad.addColorStop(0.2,  theme1.glowColor); // Avatar 1 is pure
        waveGrad.addColorStop(0.8,  theme2.glowColor); // Avatar 2 is pure
        waveGrad.addColorStop(1.0,  theme2.glowColor);

        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; 

        // --- 4. DISCRETE CONTINUOUS CLUSTERS (Liquid Water, 4 Gaps) ---
        ctx.save();
        ctx.globalCompositeOperation = 'lighter'; 
        
        const barSpacing = 2.2;
        
        // The exact anchor points where the wave MUST pinch to ZERO height
        const p0 = 0;
        const p1 = centerLeft;
        const p2 = centerX;
        const p3 = centerRight;
        const p4 = width;

        const nBars = Math.floor(width / barSpacing);
        const targetHeights = new Float32Array(nBars);
        const rawFft = new Float32Array(nBars);

        for (let i = 0; i < nBars; i++) {
            const xPos = i * barSpacing;
            let ratio = -1; 
            
            if (xPos >= p0 && xPos <= p1) ratio = (xPos - p0) / (p1 - p0);
            else if (xPos >= p1 && xPos <= p2) ratio = (xPos - p1) / (p2 - p1);
            else if (xPos >= p2 && xPos <= p3) ratio = (xPos - p2) / (p3 - p2);
            else if (xPos >= p3 && xPos <= p4) ratio = (xPos - p3) / (p4 - p3);

            if (ratio !== -1) {
                let val = 0;
                // symRatio peaks at 1 in the middle of the gap, 0 at edges
                const symRatio = Math.sin(ratio * Math.PI); 
                if (dataArray && bufferLength > 0) {
                    const bin = Math.floor(Math.pow(1.0 - symRatio, 1.2) * (bufferLength * 0.3));
                    val = (dataArray[bin] || 0) / 255.0; 
                } else if (isSimulating) {
                    val = Math.abs(Math.sin(symRatio * 12 - time * 3)) * 0.4 
                        + Math.abs(Math.sin(symRatio * 25 - time * 5)) * 0.3 
                        + 0.2;
                }
                rawFft[i] = val;
            }
        }
        
        // Spatial Smoothing
        const smoothFft = new Float32Array(nBars);
        const blurRadius = 4;
        for (let i = 0; i < nBars; i++) {
            if (rawFft[i] === 0) continue; 
            let sum = 0, weightSum = 0;
            for (let j = -blurRadius; j <= blurRadius; j++) {
                const idx = i + j;
                if (idx >= 0 && idx < nBars && rawFft[idx] > 0) {
                    const weight = Math.exp(-(j * j) / (2 * blurRadius));
                    sum += rawFft[idx] * weight;
                    weightSum += weight;
                }
            }
            smoothFft[i] = weightSum > 0 ? sum / weightSum : 0;
        }

        const pump = 0.4 + maxI * 1.8; 

        // User's custom amplitude envelope
        const envProfile = [0.02, 0.05, 0.10, 0.18, 0.30, 0.45, 0.60, 0.45, 0.30, 0.18, 0.10, 0.05, 0.02];
        const getEnvelope = (r) => {
            const idx = Math.max(0, Math.min(1, r)) * (envProfile.length - 1);
            const i0 = Math.floor(idx);
            const i1 = Math.min(envProfile.length - 1, i0 + 1);
            const f = idx - i0;
            return envProfile[i0] * (1 - f) + envProfile[i1] * f;
        };

        for (let i = 0; i < nBars; i++) {
            const xPos = i * barSpacing;
            let ratio = -1;
            
            if (xPos >= p0 && xPos <= p1) ratio = (xPos - p0) / (p1 - p0);
            else if (xPos >= p1 && xPos <= p2) ratio = (xPos - p1) / (p2 - p1);
            else if (xPos >= p2 && xPos <= p3) ratio = (xPos - p2) / (p3 - p2);
            else if (xPos >= p3 && xPos <= p4) ratio = (xPos - p3) / (p4 - p3);

            if (ratio !== -1) {
                const envelope = getEnvelope(ratio);
                const h = Math.pow(smoothFft[i], 0.7);
                
                // All 4 gaps now use the exact same amplitude scale (0.22 * pump)
                const scale = 0.22 * pump;
                
                // Apply the exact envelope shape to the dynamic height
                targetHeights[i] = (0.02 + h * 0.98) * envelope * height * scale; 
            }
        }

        // Clamp jumps 
        const maxJump = barSpacing * 1.5; 
        for (let i = 1; i < nBars; i++) {
            if (targetHeights[i] > targetHeights[i-1] + maxJump) targetHeights[i] = targetHeights[i-1] + maxJump;
            else if (targetHeights[i] < targetHeights[i-1] - maxJump) targetHeights[i] = targetHeights[i-1] - maxJump;
        }
        for (let i = nBars - 2; i >= 0; i--) {
            if (targetHeights[i] > targetHeights[i+1] + maxJump) targetHeights[i] = targetHeights[i+1] + maxJump;
            else if (targetHeights[i] < targetHeights[i+1] - maxJump) targetHeights[i] = targetHeights[i+1] - maxJump;
        }

        if (!state.spec || state.spec.length !== nBars) state.spec = new Float32Array(nBars);
        for (let i = 0; i < nBars; i++) {
            state.spec[i] = state.spec[i] * 0.8 + targetHeights[i] * 0.2; 
        }

        // --- RENDER BARS WITH PEAK CAPS (Style 4) ---
        ctx.shadowBlur = 15 * globalGlowMod;
        ctx.shadowColor = '#cc88ff';
        
        ctx.strokeStyle = waveGrad; 

        const ekgW = heartBaseSize * 1.7; // Reverted back to 1.7

        // 1. Draw Vertical Bars (Dimmer)
        ctx.globalAlpha = 0.4; 
        ctx.lineWidth = 1.5; 
        ctx.lineCap = 'round'; 
        ctx.beginPath();
        for (let i = 0; i < nBars; i++) {
            if (i % 2 !== 0) continue; // Space out bars for a clean equalizer look
            const xPos = i * barSpacing;
            if (Math.abs(xPos - centerX) <= ekgW) continue; // Skip inside heart for EKG

            const h = state.spec[i];
            ctx.moveTo(xPos, centerY - h);
            ctx.lineTo(xPos, centerY + h);
        }
        ctx.stroke();

        // 2. Draw Peak Caps (Brighter, Thicker Dots)
        ctx.shadowBlur = 20 * globalGlowMod; // Extra glow for the caps
        ctx.globalAlpha = 1.0; 
        ctx.lineWidth = 3.2; 
        ctx.lineCap = 'round'; 
        ctx.beginPath();
        for (let i = 0; i < nBars; i++) {
            if (i % 2 !== 0) continue; 
            const xPos = i * barSpacing;
            if (Math.abs(xPos - centerX) <= ekgW) continue; // Skip inside heart for EKG

            const h = state.spec[i];
            
            // Top Cap
            ctx.moveTo(xPos, centerY - h);
            ctx.lineTo(xPos, centerY - h + 0.1);
            
            // Bottom Cap
            if (h > 1.5) {
                ctx.moveTo(xPos, centerY + h);
                ctx.lineTo(xPos, centerY + h + 0.1);
            }
        }
        ctx.stroke();

        // 3. Draw the EKG inside the heart
        const ekgH = heartBaseSize * 1.0 * (0.4 + maxI * 0.6); // Scale amplitude safely
        
        const drawEKGPath = () => {
            ctx.beginPath();
            ctx.moveTo(centerX - ekgW, centerY); 
            ctx.lineTo(centerX - ekgW * 0.6, centerY);
            ctx.lineTo(centerX - ekgW * 0.5, centerY - ekgH * 0.3); // Spike UP
            ctx.lineTo(centerX - ekgW * 0.4, centerY + ekgH * 0.15); // Dip DOWN
            ctx.lineTo(centerX - ekgW * 0.3, centerY); // Flat
            ctx.lineTo(centerX - ekgW * 0.2, centerY); // Flat
            ctx.lineTo(centerX - ekgW * 0.15, centerY - ekgH * 0.1); // Tiny UP
            
            // Main Heartbeat Spike
            ctx.lineTo(centerX, centerY - ekgH * 1.0); // HUGE UP
            ctx.lineTo(centerX + ekgW * 0.1, centerY + ekgH * 0.8); // HUGE DOWN
            
            ctx.lineTo(centerX + ekgW * 0.2, centerY - ekgH * 0.3); // Medium UP
            ctx.lineTo(centerX + ekgW * 0.3, centerY); // Flat
            ctx.lineTo(centerX + ekgW * 0.45, centerY); // Flat
            ctx.lineTo(centerX + ekgW * 0.5, centerY + ekgH * 0.2); // Dip DOWN
            ctx.lineTo(centerX + ekgW * 0.6, centerY - ekgH * 0.35); // Peak UP
            ctx.lineTo(centerX + ekgW * 0.7, centerY); // Flat
            
            ctx.lineTo(centerX + ekgW, centerY);
            ctx.stroke();
        };

        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        ctx.shadowBlur = 0; // Disable shadowBlur since we use multi-stroke for gradient glow

        // Outer Glow (Thickest)
        ctx.globalAlpha = 0.25;
        ctx.lineWidth = 12.0;
        ctx.strokeStyle = waveGrad; // Use the global gradient for perfect seamless matching
        drawEKGPath();

        // Base Glow
        ctx.globalAlpha = 0.5;
        ctx.lineWidth = 6.0;
        drawEKGPath();

        // Inner Glow
        ctx.globalAlpha = 1.0;
        ctx.lineWidth = 2.5;
        drawEKGPath();

        // Bright Core (White)
        ctx.lineWidth = 1.0;
        ctx.strokeStyle = '#ffffff';
        drawEKGPath();

        ctx.restore();

        // --- 3. HEART HUD ---
        ctx.save();
        ctx.translate(centerX, centerY);

        const haloPulse = 1 + maxI * 0.3 + breathing * 0.15;
        const haloGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, heartRingOuter * 2.5);
        haloGrad.addColorStop(0, 'rgba(255, 100, 200, 0.1)'); 
        haloGrad.addColorStop(0.4, 'rgba(180, 80, 255, 0.04)');
        haloGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.save();
        ctx.scale(haloPulse, haloPulse);
        ctx.fillStyle = haloGrad;
        ctx.beginPath(); ctx.arc(0, 0, heartRingOuter * 2.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();

        const hPulse = 1 + maxI * 0.15 + breathing * 0.05;
        ctx.scale(hPulse, hPulse);
        const heartThemeColor = '#cc88ff';

        ctx.beginPath(); ctx.arc(0, 0, heartRingOuter, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(200, 100, 255, 0.03)'; ctx.shadowBlur = 10; ctx.fill();

        // Refined HUD Rings (Slightly thinner, multi-pass bloom)
        const renderRing = (radius, angleOffset, angleSpan, w, color, baseAlpha, dash) => {
            ctx.save();
            ctx.rotate(angleOffset);
            if (dash) ctx.setLineDash(dash);
            ctx.strokeStyle = color;
            ctx.shadowColor = color;
            
            const drawPath = () => {
                ctx.beginPath(); ctx.arc(0, 0, radius, 0, angleSpan); ctx.stroke();
            };

            ctx.lineWidth = w * 1.5; ctx.shadowBlur = 15 * globalGlowMod; ctx.globalAlpha = baseAlpha * 0.25; drawPath();
            ctx.lineWidth = w * 0.8; ctx.shadowBlur = 5 * globalGlowMod; ctx.globalAlpha = baseAlpha; drawPath();
            ctx.restore();
        };

        renderRing(heartRingInner, time * 0.3, Math.PI * 1.7, 1.4, '#ffffff', 0.6);
        renderRing(heartRingMiddle, -time * 0.1, Math.PI * 2, 2.0 + maxI * 1.2, heartThemeColor, 0.8);
        renderRing(heartRingMiddle + 4, time * 0.2, Math.PI * 2, 1.4, '#ff88dd', 0.45);
        renderRing(heartRingOuter, -time * 0.15, Math.PI * 2, 1.4, heartThemeColor, 0.35, [12, 8]);
        // Extra subtle tick ring
        renderRing(heartRingOuter + 6, time * 0.05, Math.PI * 2, 2.5, '#88aaff', 0.25, [2, 18]);

        // Heart Layers (Multi-layer glow without extreme brightness)
        ctx.save();
        ctx.translate(0, -13); // Shift heart graphic up 13px to visually center it

        const hp = new Path2D();
        const hs = heartBaseSize * 2.0; // 2x scale as requested
        hp.moveTo(0,        -hs * 0.15);
        hp.bezierCurveTo( hs*0.1,  -hs*0.65,  hs*0.9, -hs*0.65,  hs*0.9, -hs*0.0);
        hp.bezierCurveTo( hs*0.9,   hs*0.45,  hs*0.5,  hs*0.75,       0,  hs*1.1);
        hp.bezierCurveTo(-hs*0.5,   hs*0.75, -hs*0.9,  hs*0.45, -hs*0.9, -hs*0.0);
        hp.bezierCurveTo(-hs*0.9,  -hs*0.65, -hs*0.1, -hs*0.65,       0, -hs*0.15);

        const drawHeartLayer = (blur, color, width, alpha) => {
            ctx.shadowBlur = (blur * 0.5) * globalGlowMod;
            ctx.shadowColor = color;
            ctx.strokeStyle = color;
            ctx.lineWidth = width;
            ctx.globalAlpha = alpha;
            ctx.stroke(hp);
        };
        
        // Use original base size for stroke so the lines stay sharp despite 2x size
        const hw = heartBaseSize;
        drawHeartLayer(45, '#ff44aa', hw * 0.5, 0.1);
        drawHeartLayer(26, '#ff66bb', hw * 0.25, 0.2);
        drawHeartLayer(14, '#ff88cc', hw * 0.1, 0.4); 
        drawHeartLayer(6,  '#ffaadd', 2, 0.6);        
        drawHeartLayer(2,  '#ffccff', 1.5, 0.75);
        drawHeartLayer(0,  '#ffffff', 1, 0.4); 
        
        ctx.restore(); // Restore the local -5px translation for the heart graphic
        ctx.restore(); // Restore the global centerX, centerY translation for the entire Heart HUD

        // --- 4. AVATAR HUD ---
        const drawAvatar = (cx, iLocal, themeObj, tName, rotateSign) => {
            ctx.save();
            ctx.translate(cx, centerY);
            
            const avaHalo = ctx.createRadialGradient(0, 0, avatarRadius * 0.8, 0, 0, avatarRadius * 2.2);
            avaHalo.addColorStop(0, `${themeObj.glowColor}22`);
            avaHalo.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = avaHalo;
            ctx.beginPath(); ctx.arc(0, 0, avatarRadius * 2.2, 0, Math.PI*2); ctx.fill();

            ctx.beginPath(); ctx.arc(0, 0, avatarRadius + 40, 0, Math.PI * 2);
            ctx.fillStyle = `${themeObj.glowColor}05`; ctx.shadowBlur = 10; ctx.fill();

            ctx.scale(1 + iLocal * 0.06 + breathing * 0.015, 1 + iLocal * 0.06 + breathing * 0.015);

            if (!state.avatarCache) state.avatarCache = {};
            if (!state.avatarCache[tName]) {
                const img = new Image();
                img.src = `avatar/avatar_${tName}.png`;
                state.avatarCache[tName] = img;
            }
            const aImg = state.avatarCache[tName];

            ctx.save();
            ctx.globalCompositeOperation = 'source-over';
            ctx.beginPath(); ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2); 
            ctx.clip();
            if (aImg.complete && aImg.naturalWidth > 0) {
                ctx.drawImage(aImg, -avatarRadius, -avatarRadius, avatarRadius*2, avatarRadius*2);
            }
            const innerShadow = ctx.createRadialGradient(0, 0, avatarRadius * 0.7, 0, 0, avatarRadius);
            innerShadow.addColorStop(0, 'rgba(0,0,0,0)');
            innerShadow.addColorStop(1, `${themeObj.glowColor}88`);
            ctx.fillStyle = innerShadow;
            ctx.fillRect(-avatarRadius, -avatarRadius, avatarRadius*2, avatarRadius*2);
            ctx.restore();

            ctx.beginPath(); ctx.arc(0, 0, avatarRadius, 0, Math.PI * 2);
            ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 1; ctx.shadowBlur = 5; ctx.shadowColor = '#ffffff'; ctx.stroke();

            // Refined Multi-pass Avatar Rings
            renderRing(avatarRadius + 4, 0, Math.PI * 2, 2.0 + iLocal * 2.5, themeObj.glowColor, 0.85);
            renderRing(avatarRadius + 16, time * 0.15 * rotateSign, Math.PI * 2, 1.5, themeObj.glowColor, 0.7, [Math.PI * (avatarRadius + 16) * 0.3, 15]);
            renderRing(avatarRadius + 26, -time * 0.08 * rotateSign, Math.PI * 2, 1.3, themeObj.glowColor, 0.4);
            
            // Extra translucent HUD details
            renderRing(avatarRadius + 32, time * 0.1 * rotateSign, Math.PI * 2, 1.0, '#ffffff', 0.2, [4, 12]);
            renderRing(avatarRadius + 38, 0, Math.PI * 2, 1.0, themeObj.glowColor, 0.15);

            ctx.save();
            ctx.rotate(-time * 0.08 * rotateSign);
            ctx.beginPath(); ctx.arc(avatarRadius + 26, 0, 1.5, 0, Math.PI*2);
            ctx.fillStyle = '#ffccff';
            ctx.shadowBlur = 8 * 0.6; ctx.shadowColor = '#ffccff';
            ctx.globalAlpha = 0.8; ctx.fill();
            ctx.restore();

            ctx.restore();
        };

        drawAvatar(centerLeft,  iLeft,  theme1, state.selectedVoice2 || 'elaina', 1);
        drawAvatar(centerRight, iRight, theme2, state.selectedVoice  || 'miku', -1);

        ctx.restore(); 
    }

    let lastDrawTime = Date.now();
    
    function drawVisualizer() {
        visAnimationId = requestAnimationFrame(drawVisualizer);
        if (!els.resultCanvas) return;
        
        const now = Date.now();
        const dt = (now - lastDrawTime) / 1000;
        lastDrawTime = now;
        
        // Calculate intensity independently for time accumulation
        let timeIntensity = 0;
        if (analyser && dataArray) {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            const beatLength = Math.floor(bufferLength / 3);
            for (let i = 0; i < beatLength; i++) sum += dataArray[i];
            timeIntensity = Math.pow((sum / beatLength) / 255, 1.5);
        }
        
        // Accumulate time (speed up on bass)
        state.accumTime = (state.accumTime || 0) + dt * (1 + timeIntensity * 3);

        drawThemeVisualizer(visCtx, els.resultCanvas, dataArray, bufferLength, state.accumTime, false, visParticles);
    }
    
    // -- Processing Simulation Visualizer --
    let procVisAnimationId = null;
    let procParticles = [];
    
    function startProcessingVisualizer() {
        const canvas = els.processingCanvas;
        if (!canvas) return;
        
        // Initialize particles if empty
        if (procParticles.length === 0) {
            for(let i=0; i<30; i++) {
                procParticles.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    size: Math.random() * 2 + 1,
                    speedX: (Math.random() - 0.5) * 1.5,
                    speedY: (Math.random() - 0.5) * 1.5,
                    alpha: Math.random() * 0.5 + 0.1
                });
            }
        }
        
        if (procVisAnimationId) cancelAnimationFrame(procVisAnimationId);
        simulateProcessingVisualizer();
    }

    function simulateProcessingVisualizer() {
        if (!state.isProcessing) return;
        procVisAnimationId = requestAnimationFrame(simulateProcessingVisualizer);
        if (!els.processingCanvas) return;
        drawThemeVisualizer(els.processingCanvas.getContext('2d'), els.processingCanvas, null, 0, Date.now()/1000, true, procParticles);
    }



    function formatTime(seconds) {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    function animateWaveform(active) {
        const bars = document.querySelectorAll('.wave-bar');
        bars.forEach(bar => {
            if (active) {
                bar.classList.add('active');
                bar.style.height = `${Math.random() * 80 + 20}%`;
            } else {
                bar.classList.remove('active');
                bar.style.height = '20%';
            }
        });
        
        if (active) {
            state.waveInterval = setInterval(() => {
                bars.forEach(bar => {
                    bar.style.height = `${Math.random() * 80 + 20}%`;
                });
            }, 150);
        } else {
            clearInterval(state.waveInterval);
        }
    }

    // Toast
    function showToast(msg, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        let icon = 'ℹ️';
        if (type === 'success') icon = '✓';
        if (type === 'error') icon = '✕';
        if (type === 'warning') icon = '⚠️';

        toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-msg">${msg}</span>`;
        els.toastContainer.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('toast-out');
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    // Particles Background
    function initParticles() {
        const canvas = document.getElementById('particles-canvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 2 + 0.5;
                this.speedY = Math.random() * -0.5 - 0.2;
                this.speedX = Math.random() * 0.4 - 0.2;
                this.opacity = Math.random() * 0.5 + 0.1;
            }
            update() {
                this.y += this.speedY;
                this.x += this.speedX;
                if (this.y < -10) {
                    this.y = height + 10;
                    this.x = Math.random() * width;
                }
            }
            draw() {
                ctx.fillStyle = `rgba(200, 16, 46, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 50; i++) particles.push(new Particle());

        function animate() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(animate);
        }
        animate();
    }
});

// --- BẢO MẬT: CHỐNG F12 VÀ CHUỘT PHẢI ---
document.addEventListener('contextmenu', event => event.preventDefault());
document.addEventListener('keydown', event => {
    if (event.keyCode === 123) { event.preventDefault(); return false; }
    if (event.ctrlKey && event.shiftKey && event.keyCode === 73) { event.preventDefault(); return false; }
    if (event.ctrlKey && event.keyCode === 85) { event.preventDefault(); return false; }
});








