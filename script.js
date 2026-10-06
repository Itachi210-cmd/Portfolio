/* ============================================================
   script.js  –  Clean 3D Portfolio Controller
   Three.js Bridge + Lenis Smooth Scroll + GSAP ScrollTrigger
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ======================================
       1. THREE.JS INITIALIZATION
    ====================================== */
    function initThreeScene() {
        const check = setInterval(() => {
            if (window.__THREE_API) {
                clearInterval(check);
                const { initScene, isWebGLAvailable } = window.__THREE_API;
                const canvas = document.getElementById('three-canvas');

                if (canvas && isWebGLAvailable() && !prefersReducedMotion) {
                    initScene(canvas);
                } else if (canvas) {
                    canvas.style.display = 'none';
                    document.body.style.background = 'radial-gradient(ellipse at center, #181335 0%, #0d0b1a 80%)';
                }
            }
        }, 60);

        // Cancel polling after 5 seconds if not available
        setTimeout(() => clearInterval(check), 5000);
    }
    initThreeScene();

    /* ======================================
       2. LENIS SMOOTH SCROLL & GSAP SETUP
    ====================================== */
    let lenis;
    if (!prefersReducedMotion && typeof Lenis !== 'undefined') {
        lenis = new Lenis({
            duration: 1.1,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            smoothWheel: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);

        // Sync with GSAP ScrollTrigger
        lenis.on('scroll', () => {
            if (typeof ScrollTrigger !== 'undefined') {
                ScrollTrigger.update();
            }
        });
    }

    /* ======================================
       3. GSAP SCROLLTRIGGER ANIMATIONS
    ====================================== */
    if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
        gsap.registerPlugin(ScrollTrigger);

        if (lenis) {
            ScrollTrigger.scrollerProxy(document.body, {
                scrollTop(value) {
                    if (arguments.length) {
                        lenis.scrollTo(value, { immediate: true });
                    }
                    return lenis.scroll;
                },
                getBoundingClientRect() {
                    return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
                },
                pinType: document.body.style.transform ? 'transform' : 'fixed',
            });
            ScrollTrigger.defaults({ scroller: document.body });
        }

        /* --- 3D Camera scroll sync --- */
        ScrollTrigger.create({
            trigger: 'body',
            start: 'top top',
            end: 'bottom bottom',
            onUpdate: (self) => {
                if (window.__THREE_API && window.__THREE_API.setScrollProgress) {
                    window.__THREE_API.setScrollProgress(self.progress);
                }
            }
        });

        /* --- Hero Entrance Timeline --- */
        const heroTl = gsap.timeline({ delay: 0.15 });
        heroTl
            .from('.greeting', { opacity: 0, y: 25, duration: 0.6, ease: 'power2.out' })
            .from('.hero-text h1', { opacity: 0, y: 35, duration: 0.7, ease: 'power3.out' }, '-=0.35')
            .from('.typing-wrapper', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, '-=0.35')
            .from('.tagline', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, '-=0.3')
            .from('.hero-btns', { opacity: 0, y: 20, duration: 0.5, ease: 'power2.out' }, '-=0.3')
            .from('.hero-social a', { opacity: 0, scale: 0.5, stagger: 0.1, duration: 0.4, ease: 'back.out(2)' }, '-=0.3')
            .from('.hero-avatar', { opacity: 0, scale: 0.85, duration: 0.9, ease: 'back.out(1.5)' }, '-=0.6')
            .from('.floating-badge', { opacity: 0, scale: 0.5, stagger: 0.12, duration: 0.5, ease: 'back.out(2)' }, '-=0.4');

        /* --- Staggered Card Reveals --- */
        const cardGroups = [
            '.about-cards-grid .info-card',
            '.projects-grid .project-card',
            '.cert-grid .cert-card',
            '.skills-grid .skill-category',
            '.stats-grid .stat-item',
        ];

        cardGroups.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            if (elements.length === 0) return;

            ScrollTrigger.create({
                trigger: elements[0].parentElement,
                start: 'top 85%',
                once: true,
                onEnter: () => {
                    gsap.fromTo(elements,
                        { opacity: 0, y: 35 },
                        { opacity: 1, y: 0, duration: 0.65, stagger: 0.12, ease: 'power2.out' }
                    );
                }
            });
        });

        /* --- Skill Progress Bars --- */
        document.querySelectorAll('.skill-bar-fill').forEach(bar => {
            ScrollTrigger.create({
                trigger: bar,
                start: 'top 90%',
                once: true,
                onEnter: () => {
                    const width = bar.getAttribute('data-width');
                    gsap.to(bar, { width: width + '%', duration: 1.2, ease: 'power2.out' });
                }
            });
        });

        ScrollTrigger.refresh();
    }

    /* ======================================
       4. 3D TILT ON PROJECT CARDS
    ====================================== */
    const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (!isTouch && !prefersReducedMotion) {
        document.querySelectorAll('[data-tilt]').forEach(card => {
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                const rotateX = ((y - centerY) / centerY) * -6;
                const rotateY = ((x - centerX) / centerX) * 6;
                card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
            });

            card.addEventListener('mouseleave', () => {
                card.style.transform = 'perspective(800px) rotateX(0deg) rotateY(0deg) translateY(0px)';
            });
        });
    }

    /* ======================================
       5. HERO TYPING EFFECT
    ====================================== */
    const roles = [
        'AI Automation & Full Stack Developer',
        'Next.js & React Developer',
        'Flutter & Mobile Developer',
        'FastAPI & Backend Engineer',
        'Data Analyst & Python Developer'
    ];
    const typedEl = document.getElementById('typed-text');
    let roleIdx = 0, charIdx = 0, deleting = false;

    function runTyping() {
        if (!typedEl) return;
        const currentRole = roles[roleIdx];

        if (!deleting) {
            typedEl.textContent = currentRole.substring(0, charIdx + 1);
            charIdx++;
            if (charIdx === currentRole.length) {
                deleting = true;
                setTimeout(runTyping, 1800);
                return;
            }
        } else {
            typedEl.textContent = currentRole.substring(0, charIdx - 1);
            charIdx--;
            if (charIdx === 0) {
                deleting = false;
                roleIdx = (roleIdx + 1) % roles.length;
            }
        }
        setTimeout(runTyping, deleting ? 50 : 100);
    }
    runTyping();

    /* ======================================
       6. STATS COUNTER ANIMATION
    ====================================== */
    const statNumbers = document.querySelectorAll('.stat-number');
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.getAttribute('data-count'), 10);
                let current = 0;
                const stepTime = 60;
                const timer = setInterval(() => {
                    current += 1;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = current;
                }, stepTime);
                counterObserver.unobserve(el);
            }
        });
    }, { threshold: 0.5 });
    statNumbers.forEach(num => counterObserver.observe(num));

    /* ======================================
       7. NAVBAR SCROLL EFFECT & ACTIVE SPY
    ====================================== */
    const header = document.getElementById('header');
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links .nav-link');

    function onScrollHandler() {
        if (window.scrollY > 40) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // Active link spy
        let currentId = '';
        sections.forEach(sec => {
            const top = sec.offsetTop - 120;
            if (window.scrollY >= top) {
                currentId = sec.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === currentId) {
                link.classList.add('active');
            }
        });
    }
    window.addEventListener('scroll', onScrollHandler, { passive: true });

    /* ======================================
       8. SMOOTH SCROLLING FOR NAV ANCHORS
    ====================================== */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(target, { offset: -70 });
                } else {
                    target.scrollIntoView({ behavior: 'smooth' });
                }
                const mobileMenu = document.getElementById('mobile-menu');
                const menuOverlay = document.getElementById('menu-overlay');
                if (mobileMenu) mobileMenu.classList.remove('active');
                if (menuOverlay) menuOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    });

    /* ======================================
       9. MOBILE MENU TOGGLE
    ====================================== */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu = document.getElementById('close-menu');
    const menuOverlay = document.getElementById('menu-overlay');

    function closeMobileMenu() {
        if (mobileMenu) mobileMenu.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    function openMobileMenu() {
        if (mobileMenu) mobileMenu.classList.add('active');
        if (menuOverlay) menuOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    if (hamburger) hamburger.addEventListener('click', openMobileMenu);
    if (closeMenu) closeMenu.addEventListener('click', closeMobileMenu);
    if (menuOverlay) menuOverlay.addEventListener('click', closeMobileMenu);

    /* ======================================
       10. BACK TO TOP BUTTON
    ====================================== */
    const backToTop = document.getElementById('back-to-top');
    if (backToTop) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 450) {
                backToTop.classList.add('visible');
            } else {
                backToTop.classList.remove('visible');
            }
        }, { passive: true });

        backToTop.addEventListener('click', () => {
            if (lenis) {
                lenis.scrollTo(0);
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }

});
