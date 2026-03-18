(function () {
    const FADE_MS = 1200;
    const FADE_STEP = 20;
    const MAX_VOL = 1;

    const songNames = {
        'music/prologue.mp3':  'ahitmanin [Imarhan]',
        'music/movement1.mp3': '180db_[130] [Aphex Twin]',
        'music/movement2.mp3': 'Early Summer [Ryo Fukui]',
        'music/movement3.mp3': 'Colonial Mentality [Fela Kuti]',
        'music/movement4.mp3': 'Alech [Dalton]',
        'music/movement5.mp3': 'D.A.N.C.E [Justice]',
    };

    const sectionMap = [
        { selector: '.cover-container, .opener, .prologue',    src: 'music/prologue.mp3' },
        { selector: '.movement-i',  src: 'music/movement1.mp3' },
        { selector: '.movement-ii', src: 'music/movement2.mp3' },
        { selector: '.movement-iii',src: 'music/movement3.mp3' },
        { selector: '.movement-iv', src: 'music/movement4.mp3' },
        { selector: '.movement-v',  src: 'music/movement5.mp3' },
    ];

    const tracks = sectionMap.map(entry => {
        const audio = new Audio(entry.src);
        audio.loop = true;
        audio.volume = 0;
        audio.preload = 'auto';
        return { audio, selector: entry.selector, fadeId: null };
    });

    let musicOn = false;
    let activeTrack = null;
    const btn = document.querySelector('.music-button');
    const nowPlaying = document.querySelector('.now-playing');

    function updateNowPlaying() {
        if (!musicOn || !activeTrack) {
            nowPlaying.textContent = '';
            nowPlaying.style.display = 'none';
            return;
        }
        const name = songNames[activeTrack.audio.src.replace(/^.*\/music\//, 'music/')] || '';
        nowPlaying.textContent = name;
        nowPlaying.style.display = name ? 'block' : 'none';
    }

    function setButtonState() {
        btn.style.opacity = musicOn ? '1' : '0.4';
    }

    function stopFade(t) {
        if (t.fadeId) { clearInterval(t.fadeId); t.fadeId = null; }
    }

    function fadeIn(t) {
        stopFade(t);
        t.audio.play().catch(() => {});
        const steps = Math.ceil(FADE_MS / FADE_STEP);
        let step = 0;
        t.fadeId = setInterval(() => {
            step++;
            t.audio.volume = Math.min(MAX_VOL, MAX_VOL * (step / steps));
            if (step >= steps) stopFade(t);
        }, FADE_STEP);
    }

    function fadeOut(t) {
        stopFade(t);
        const startVol = t.audio.volume;
        if (startVol === 0) { t.audio.pause(); return; }
        const steps = Math.ceil(FADE_MS / FADE_STEP);
        let step = 0;
        t.fadeId = setInterval(() => {
            step++;
            t.audio.volume = Math.max(0, startVol * (1 - step / steps));
            if (step >= steps) {
                stopFade(t);
                t.audio.volume = 0;
                t.audio.pause();
            }
        }, FADE_STEP);
    }

    function switchTo(newTrack) {
        if (newTrack === activeTrack) return;
        const old = activeTrack;
        activeTrack = newTrack;
        if (!musicOn) return;
        tracks.forEach(t => {
            if (t !== newTrack) fadeOut(t);
        });
        if (newTrack) fadeIn(newTrack);
        updateNowPlaying();
    }

    btn.addEventListener('click', () => {
        musicOn = !musicOn;
        setButtonState();
        if (musicOn) {
            if (activeTrack) {
                activeTrack.audio.volume = MAX_VOL;
                activeTrack.audio.play().catch(() => {});
            }
        } else {
            tracks.forEach(t => {
                stopFade(t);
                t.audio.pause();
                t.audio.volume = 0;
            });
        }
        updateNowPlaying();
    });

    const visibleRatios = new Map();

    const observer = new IntersectionObserver(entries => {
        entries.forEach(e => visibleRatios.set(e.target, e.intersectionRatio));

        let best = null;
        let bestRatio = 0;
        for (const t of tracks) {
            const el = document.querySelector(t.selector);
            const ratio = visibleRatios.get(el) || 0;
            if (ratio > bestRatio) { bestRatio = ratio; best = t; }
        }

        if (best && best !== activeTrack) switchTo(best);
    }, { threshold: [0, 0.1, 0.25, 0.5, 0.75, 1] });

    tracks.forEach(t => {
        const el = document.querySelector(t.selector);
        if (el) observer.observe(el);
    });

    setButtonState();

    const elapsedEl = document.getElementById('elapsed-seconds');
    const pageStart = Date.now();
    setInterval(() => {
        elapsedEl.textContent = Math.floor((Date.now() - pageStart) / 1000);
    }, 1000);

    let flashOn = true;
    let flashInterval1 = null;
    let flashInterval2 = null;
    const flashBtn = document.querySelector('.flash-toggle');

    const alohaColors = ['#FFC3CA', '#DAFFE9', '#DAF1FF', '#FFFFDA', '#F8DAFF'];
    const alohaColors2 = ['#FF8FA3', '#8BD4A0', '#7EC8E3', '#F5E663', '#D49BFF', '#A0724A', '#8B5C2A', '#C4956A'];

    const alohaEl = document.getElementById('aloha-xanadu');
    let words1 = [];
    if (alohaEl) {
        const p = alohaEl.querySelector('p');
        p.innerHTML = p.innerHTML.replace(/(\S+)/g, '<span class="aloha-word">$1</span>');
        words1 = p.querySelectorAll('.aloha-word');
    }

    const alohaEl2 = document.getElementById('aloha-xanadu-2');
    let words2 = [];
    if (alohaEl2) {
        const p2 = alohaEl2.querySelector('p');
        p2.innerHTML = p2.innerHTML.replace(/(\S+)/g, '<span class="aloha-word-2">$1</span>');
        words2 = p2.querySelectorAll('.aloha-word-2');
    }

    function cycleColors1() {
        words1.forEach(w => {
            w.style.color = alohaColors[Math.floor(Math.random() * alohaColors.length)];
        });
    }
    function cycleColors2() {
        words2.forEach(w => {
            w.style.color = alohaColors2[Math.floor(Math.random() * alohaColors2.length)];
        });
    }

    function resetColors() {
        words1.forEach(w => w.style.color = '');
        words2.forEach(w => w.style.color = '');
    }

    function startFlash() {
        cycleColors1();
        cycleColors2();
        flashInterval1 = setInterval(cycleColors1, 50);
        flashInterval2 = setInterval(cycleColors2, 50);
    }

    function stopFlash() {
        clearInterval(flashInterval1);
        clearInterval(flashInterval2);
        flashInterval1 = null;
        flashInterval2 = null;
        resetColors();
    }

    flashBtn.style.opacity = flashOn ? '1' : '0.4';
    startFlash();

    flashBtn.addEventListener('click', () => {
        flashOn = !flashOn;
        flashBtn.style.opacity = flashOn ? '1' : '0.4';
        if (flashOn) {
            startFlash();
        } else {
            stopFlash();
        }
    });
    function generateTornClip(el) {
        const buf = 6;
        const w = el.offsetWidth + buf * 2;
        const h = el.offsetHeight + buf * 2;
        const step = 12;
        const jag = buf;
        const pts = [];

        for (let x = 0; x <= w; x += step) {
            pts.push(`${x}px ${Math.random() * jag}px`);
        }
        for (let y = 0; y <= h; y += step) {
            pts.push(`${w - Math.random() * jag}px ${y}px`);
        }
        for (let x = w; x >= 0; x -= step) {
            pts.push(`${x}px ${h - Math.random() * jag}px`);
        }
        for (let y = h; y >= 0; y -= step) {
            pts.push(`${Math.random() * jag}px ${y}px`);
        }

        el.style.setProperty('--torn-clip', `polygon(${pts.join(', ')})`);
    }

    function applyTornEdges() {
        document.querySelectorAll('.quote-block p').forEach(generateTornClip);
    }

    document.fonts.ready.then(applyTornEdges);
    window.addEventListener('resize', applyTornEdges);

    const landscapeModal = document.getElementById('landscape-modal');
    const landscapeDismiss = document.getElementById('landscape-dismiss');
    let landscapeDismissed = false;

    function checkLandscapeWarning() {
        if (!landscapeDismissed && window.innerWidth < 654) {
            landscapeModal.classList.add('visible');
        } else {
            landscapeModal.classList.remove('visible');
        }
    }

    checkLandscapeWarning();
    window.addEventListener('resize', checkLandscapeWarning);

    landscapeDismiss.addEventListener('click', () => {
        landscapeDismissed = true;
        landscapeModal.classList.remove('visible');
    });
})();
