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

        /* Premium landing-page refinement */
        #introSplash {
            background:
                radial-gradient(circle at 50% 35%, rgba(115, 73, 255, 0.18), transparent 24rem),
                radial-gradient(circle at 18% 82%, rgba(0, 214, 255, 0.08), transparent 20rem),
                #05050a;
        }
        #introSplash::before,
        #introSplash::after {
            content: '';
            position: absolute;
            inset: 0;
            pointer-events: none;
        }
        #introSplash::before {
            opacity: 0.28;
            background-image: linear-gradient(rgba(126, 110, 224, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(126, 110, 224, 0.08) 1px, transparent 1px);
            background-size: 48px 48px;
            mask-image: radial-gradient(ellipse at center, black, transparent 70%);
        }
        #introSplash::after {
            background: linear-gradient(90deg, rgba(0,0,0,0.75), transparent 22%, transparent 78%, rgba(0,0,0,0.75));
        }
        .hud-frame {
            justify-content: center;
            padding: clamp(28px, 5vh, 64px) 24px;
            border-color: rgba(180, 168, 255, 0.14);
            background: linear-gradient(135deg, rgba(255,255,255,0.025), transparent 36%);
        }
        .hud-frame::before {
            content: '';
            position: absolute;
            width: min(78vw, 980px);
            height: min(78vw, 680px);
            border: 1px solid rgba(172, 130, 255, 0.10);
            border-radius: 50%;
            box-shadow: 0 0 100px rgba(106, 75, 255, 0.12), inset 0 0 90px rgba(32, 17, 73, 0.26);
            pointer-events: none;
        }
        .mockup-pretitle {
            position: relative;
            z-index: 1;
            margin: 0 0 18px;
            padding: 8px 13px;
            border: 1px solid rgba(180, 168, 255, 0.24);
            border-radius: 999px;
            background: rgba(13, 12, 27, 0.72);
            box-shadow: 0 10px 30px rgba(0,0,0,0.25);
            color: #c9c4e5;
            font-size: clamp(0.65rem, 1vw, 0.78rem);
            letter-spacing: 0.32em;
        }
        .mockup-title {
            position: relative;
            z-index: 1;
            max-width: 830px;
            margin: 0;
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
            font-size: clamp(2.25rem, 5vw, 4.8rem);
            font-weight: 800;
            letter-spacing: -0.055em;
            line-height: 1.03;
            text-wrap: balance;
        }
        .gradient-text {
            background: linear-gradient(110deg, #81e5ff 5%, #bc6cff 47%, #ff73d4 95%);
            -webkit-background-clip: text;
            font-size: inherit;
            filter: drop-shadow(0 0 18px rgba(169, 105, 255, 0.38));
        }
        .hud-logo-container {
            position: relative;
            z-index: 1;
            display: grid;
            place-items: center;
            width: 126px;
            height: 126px;
            margin: 28px 0 22px;
            border: 1px solid rgba(131, 213, 255, 0.55);
            border-radius: 50%;
            background: radial-gradient(circle at 36% 30%, #6358df 0, #222258 35%, #0c1028 68%, #05060f 100%);
            box-shadow: 0 0 0 9px rgba(116, 87, 255, 0.06), 0 0 0 10px rgba(113, 222, 255, 0.16), 0 0 55px rgba(117, 82, 255, 0.72), inset 0 1px 12px rgba(255,255,255,0.36);
            animation: orb-breathe 4s ease-in-out infinite;
        }
        .hud-logo-container::before,
        .hud-logo-container::after { content: ''; position: absolute; border-radius: 50%; pointer-events: none; }
        .hud-logo-container::before { inset: -20px; border: 1px dashed rgba(105, 232, 255, 0.55); animation: orbit 11s linear infinite; }
        .hud-logo-container::after { inset: -38px; border: 1px solid rgba(196, 105, 255, 0.18); box-shadow: 0 0 26px rgba(211, 105, 255, 0.18); }
        .hud-logo-svg { display: none; }
        .orb-value { position: relative; z-index: 1; color: #fff; font: 800 2.4rem/1 Inter, ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.09em; text-shadow: 0 3px 18px #0a0b28; }
        .orb-value small { display: block; margin-top: 5px; color: #9ceaff; font-size: 0.52rem; letter-spacing: 0.22em; text-align: center; }
        @keyframes orbit { to { transform: rotate(360deg); } }
        @keyframes orb-breathe { 50% { transform: translateY(-4px) scale(1.035); box-shadow: 0 0 0 12px rgba(116, 87, 255, 0.035), 0 0 0 13px rgba(113, 222, 255, 0.20), 0 0 80px rgba(117, 82, 255, 0.85), inset 0 1px 12px rgba(255,255,255,0.36); } }
        .intro-proof {
            position: relative;
            z-index: 1;
            display: flex;
            justify-content: center;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 20px;
        }
        .intro-proof span {
            padding: 6px 10px;
            border-radius: 999px;
            color: rgba(239, 237, 255, 0.68);
            background: rgba(255,255,255,0.045);
            border: 1px solid rgba(255,255,255,0.08);
            font: 600 0.70rem/1 Inter, ui-sans-serif, system-ui, sans-serif;
            letter-spacing: 0.03em;
        }
        .troll-buttons-area {
            position: relative;
            z-index: 2;
            gap: 16px;
            margin-top: 4px;
        }
        .hud-btn {
            width: min(360px, calc(50vw - 34px));
            min-height: 132px;
            padding: 22px 24px;
            border: 1px solid rgba(255,255,255,0.12);
            border-bottom-width: 1px;
            border-radius: 18px;
            background: linear-gradient(135deg, rgba(36, 38, 59, 0.94), rgba(10, 11, 20, 0.94));
        }
        .hud-btn-ok {
            border-color: rgba(105, 222, 255, 0.45);
            box-shadow: 0 18px 45px rgba(0,0,0,0.42), inset 0 1px 0 rgba(255,255,255,0.12);
        }
        .hud-btn-ok::before { background: radial-gradient(circle at 15% 0%, rgba(59, 227, 255, 0.25), transparent 45%); }
        .hud-btn-no { border-color: rgba(211, 121, 220, 0.27); opacity: 0.78; }
        .hud-btn:hover { opacity: 1; }
        .hud-btn-ok:hover { transform: translateY(-6px); }
        .hud-btn-no:hover { transform: translateY(-4px); }
        .btn-label {
            font-family: Inter, ui-sans-serif, system-ui, sans-serif;
            font-size: clamp(1rem, 1.4vw, 1.2rem);
            letter-spacing: 0;
        }
        .btn-kicker { margin-bottom: 6px; color: currentColor; font: 700 0.61rem/1 Inter, ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.14em; opacity: 0.9; }
        .btn-desc { font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 0.78rem; }
        .troll-footer { bottom: 20px; font-size: 0.62rem; letter-spacing: 0.28em; }
        @media (max-width: 700px) {
            .hud-frame { justify-content: center; clip-path: none; border-left: 0; border-right: 0; }
            .hud-corner { display: none; }
            .mockup-title { max-width: 510px; }
            .intro-proof { max-width: 330px; }
            .troll-buttons-area { width: min(100%, 420px); flex-direction: column; }
            .btn-wrapper { width: 100%; }
            .hud-btn { width: 100%; min-height: 96px; padding: 16px 18px; }
            .btn-icon { width: 42px; height: 42px; }
            .troll-footer { display: none; }
        }

        /* Abstract music-studio direction — no character artwork */
        #introSplash { background: radial-gradient(circle at 50% 41%, rgba(90, 61, 188, 0.20), transparent 24rem), radial-gradient(circle at 19% 77%, rgba(0, 203, 255, 0.08), transparent 27rem), #07070c; }
        #introSplash::before {
            opacity: 0.16;
            background-image: linear-gradient(135deg, transparent 48%, rgba(255, 172, 191, 0.2) 49%, transparent 50%);
            background-size: 34px 34px;
            mask-image: linear-gradient(90deg, black, transparent 78%);
        }
        #introSplash::after { background: radial-gradient(ellipse at center, transparent 33%, rgba(0,0,0,0.56) 100%); z-index: 1; }
        .hud-frame { align-items: center; padding: clamp(38px, 7vh, 80px) 28px; border: 0; background: transparent; clip-path: none; }
        .hud-frame::before { width: min(92vw, 1080px); height: min(82vh, 720px); left: 50%; top: 50%; transform: translate(-50%, -50%); border-radius: 26px; border-color: rgba(150, 139, 255, 0.12); box-shadow: inset 0 0 75px rgba(105, 77, 215, 0.06); }
        .hud-corner { display: none; }
        .mockup-pretitle, .mockup-title, .hud-logo-container, .intro-proof, .troll-buttons-area, .troll-footer { z-index: 3; }
        .mockup-pretitle { margin-bottom: 14px; padding: 0; border: 0; border-radius: 0; background: transparent; box-shadow: none; color: #91ddff; font: 700 0.68rem/1 Inter, ui-sans-serif, system-ui, sans-serif; letter-spacing: 0.30em; }
        .mockup-pretitle::before { content: '◆'; margin-right: 9px; color: #bb8cff; }
        .mockup-title { max-width: 820px; text-align: center; font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: clamp(2.65rem, 5.2vw, 5.7rem); font-weight: 800; letter-spacing: -0.075em; line-height: 0.95; text-shadow: 0 5px 30px rgba(0,0,0,0.52); }
        .gradient-text { background: linear-gradient(100deg, #63d7ff, #ac85ff 52%, #fb67bf); -webkit-background-clip: text; filter: none; }
        .hud-logo-container { width: 84px; height: 84px; margin: 28px 0 18px; border-color: rgba(124, 217, 255, 0.52); background: linear-gradient(145deg, rgba(58, 85, 168, 0.92), rgba(34, 20, 85, 0.92)); box-shadow: 0 0 0 7px rgba(108, 117, 255, 0.08), 0 18px 44px rgba(18, 44, 137, 0.40), inset 0 1px 10px rgba(255,255,255,0.20); animation: none; }
        .hud-logo-container::before { inset: 7px; border: 1px solid rgba(169, 234, 255, 0.38); animation: none; }
        .hud-logo-container::after { inset: -12px; border: 1px solid rgba(174, 123, 255, 0.23); box-shadow: none; }
        .orb-value { font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 1.65rem; }
        .orb-value small { color: #bcefff; font-family: Inter, sans-serif; }
        .intro-proof { justify-content: center; margin-bottom: 28px; }
        .intro-proof span { color: #bed0e8; background: rgba(19, 29, 57, 0.58); border-color: rgba(139, 198, 255, 0.14); font-family: Inter, sans-serif; }
        .troll-buttons-area { justify-content: center; gap: 14px; margin-top: 0; }
        .hud-btn { width: min(330px, calc(42vw - 22px)); min-height: 116px; padding: 19px 20px; border-radius: 14px; background: linear-gradient(135deg, rgba(28, 38, 72, 0.96), rgba(12, 13, 28, 0.96)); box-shadow: 0 18px 38px rgba(0,0,0,0.34); }
        .hud-btn::after { content: 'AI VOICE LAB'; bottom: 9px; right: 12px; color: rgba(174, 212, 255, 0.35); font-family: Inter, sans-serif; font-size: 0.48rem; letter-spacing: 0.12em; }
        .hud-btn-ok { border-color: rgba(97, 211, 255, 0.62); }
        .hud-btn-ok::before { background: linear-gradient(135deg, rgba(41, 191, 255, 0.22), transparent 58%); }
        .hud-btn-no { border-color: rgba(186, 142, 255, 0.28); }
        .hud-btn-ok:hover, .hud-btn-no:hover { transform: translateY(-5px); }
        .btn-icon::before { background: #4fd2ff; }
        .btn-label { font-family: Inter, ui-sans-serif, system-ui, sans-serif; font-size: 1.04rem; letter-spacing: -0.02em; }
        .btn-kicker { color: #82dcff; }
        .btn-desc { color: #aebbd1; }
        .troll-footer { left: 50%; bottom: 28px; transform: translateX(-50%); color: rgba(186, 203, 239, 0.42); }
        .audio-stage { position: absolute; z-index: 2; inset: auto 50% 15% auto; width: min(70vw, 890px); height: 260px; transform: translateX(50%); display: flex; align-items: center; justify-content: center; gap: clamp(5px, 0.8vw, 12px); pointer-events: none; opacity: 0.66; }
        .audio-stage::before { content: 'VOICE / SIGNAL / 50K'; position: absolute; top: -22px; color: rgba(147, 217, 255, 0.5); font: 600 0.60rem/1 Inter, sans-serif; letter-spacing: 0.32em; }
        .audio-stage i { width: clamp(7px, 1.1vw, 13px); height: var(--h); border-radius: 999px; background: linear-gradient(180deg, rgba(110, 225, 255, 0.12), rgba(149, 102, 255, 0.8), rgba(255, 91, 193, 0.14)); box-shadow: 0 0 16px rgba(127, 128, 255, 0.25); animation: equalize 2.2s ease-in-out infinite alternate; animation-delay: var(--d); }
        @keyframes equalize { to { transform: scaleY(0.58); opacity: 0.42; } }
        @media (max-width: 700px) { .hud-frame { align-items: center; padding: 68px 24px 34px; } .mockup-pretitle, .mockup-title { text-align: center; } .mockup-title { max-width: 480px; font-size: clamp(2.45rem, 12vw, 4.2rem); } .audio-stage { width: 90vw; height: 185px; bottom: 18%; opacity: 0.34; } .troll-buttons-area { align-items: stretch; } .hud-btn { width: 100%; } }

        /* Larger hero composition */
        .hud-frame::before { width: min(96vw, 1260px); height: min(88vh, 820px); border-radius: 34px; }
        .mockup-title { max-width: 970px; font-size: clamp(3.1rem, 6.2vw, 6.8rem); }
        .hud-logo-container { width: 108px; height: 108px; margin: 34px 0 22px; }
        .orb-value { font-size: 2.15rem; }
        .intro-proof { margin-bottom: 34px; gap: 10px; }
        .intro-proof span { padding: 8px 13px; font-size: 0.76rem; }
        .troll-buttons-area { gap: 18px; }
        .hud-btn { width: min(385px, calc(48vw - 28px)); min-height: 138px; padding: 24px 25px; }
        .btn-icon { width: 54px; height: 54px; }
        .btn-icon svg { width: 27px; height: 27px; }
        .btn-label { font-size: 1.22rem; }
        .btn-desc { font-size: 0.84rem; }
        .audio-stage { width: min(86vw, 1160px); height: 410px; bottom: 10%; gap: clamp(7px, 1.15vw, 17px); opacity: 0.78; }
        .audio-stage::before { top: -36px; font-size: 0.7rem; letter-spacing: 0.48em; }
        .audio-stage i { width: clamp(10px, 1.45vw, 18px); box-shadow: 0 0 24px rgba(127, 128, 255, 0.38); }
        .signal-watermark { position: absolute; z-index: 2; left: 50%; top: 46%; transform: translate(-50%, -50%); color: transparent; font: 900 clamp(12rem, 33vw, 32rem)/0.76 Inter, ui-sans-serif, system-ui, sans-serif; letter-spacing: -0.12em; -webkit-text-stroke: 1px rgba(155, 171, 255, 0.10); text-shadow: 0 0 80px rgba(106, 90, 255, 0.15); pointer-events: none; }
        @media (max-width: 700px) { .mockup-title { font-size: clamp(2.6rem, 13vw, 4.55rem); } .hud-logo-container { width: 94px; height: 94px; } .hud-btn { min-height: 110px; } .audio-stage { height: 255px; bottom: 14%; } .signal-watermark { font-size: 52vw; } }
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

            <div class="signal-watermark" aria-hidden="true">50K</div>
            <div class="audio-stage" aria-hidden="true">
                <i style="--h: 18%; --d: .2s"></i><i style="--h: 35%; --d: .7s"></i><i style="--h: 61%; --d: .1s"></i><i style="--h: 44%; --d: 1.1s"></i><i style="--h: 82%; --d: .4s"></i><i style="--h: 55%; --d: .9s"></i><i style="--h: 96%; --d: .3s"></i><i style="--h: 64%; --d: 1.2s"></i><i style="--h: 42%; --d: .5s"></i><i style="--h: 78%; --d: .8s"></i><i style="--h: 53%; --d: .15s"></i><i style="--h: 31%; --d: 1s"></i><i style="--h: 16%; --d: .6s"></i>
            </div>

            <div class="mockup-pretitle">MỘT LỜI MỜI NHO NHỎ</div>
            <h1 class="mockup-title">CÙNG TÔI TẠO NÊN ĐIỀU THÚ VỊ VỚI <span class="gradient-text">50K</span>?</h1>
            
            <div class="hud-logo-container" aria-label="Gói hỗ trợ 50 nghìn đồng">
                <div class="orb-value">50K<small>SUPPORT PASS</small></div>
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

            <div class="intro-proof" aria-label="Thông tin gói hỗ trợ">
                <span>✦ 50.000đ một lần</span>
                <span>✦ Mở khóa trải nghiệm</span>
                <span>✦ Chỉ mất vài giây</span>
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
                            <div class="btn-kicker">LỰA CHỌN ĐỀ XUẤT</div>
                            <div class="btn-label">Ừ, MÌNH ĐỒNG HÀNH</div>
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
                            <div class="btn-kicker">MÌNH CẦN THÊM THỜI GIAN</div>
                            <div class="btn-label">ĐỂ MÌNH SUY NGHĨ</div>
                            <div class="btn-line"></div>
                            <div class="btn-desc">Ủa? Nghĩ lại đi mà... 🥺</div>
                        </div>
                    </button>
                </div>
            </div>

            <div class="troll-footer">KHÔNG ÁP LỰC • LỰA CHỌN LÀ CỦA BẠN</div>
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
