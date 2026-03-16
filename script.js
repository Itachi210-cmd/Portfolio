document.addEventListener('DOMContentLoaded', () => {

    /* ======================================
       1. SMOOTH SCROLLING
    ====================================== */
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
                const mobileMenu = document.getElementById('mobile-menu');
                if (mobileMenu && mobileMenu.classList.contains('active')) {
                    mobileMenu.classList.remove('active');
                }
            }
        });
    });

    /* ======================================
       2. MOBILE MENU TOGGLE
    ====================================== */
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const closeMenu  = document.getElementById('close-menu');

    if (hamburger && mobileMenu && closeMenu) {
        hamburger.addEventListener('click', () => mobileMenu.classList.add('active'));
        closeMenu.addEventListener('click',  () => mobileMenu.classList.remove('active'));
        mobileMenu.addEventListener('click', (e) => {
            if (e.target === mobileMenu) mobileMenu.classList.remove('active');
        });
    }

    /* ======================================
       3. TYPING ANIMATION
    ====================================== */
    const roles = [
        'Web Developer',
        'App Developer',
        'Flutter Developer',
        'Python Enthusiast',
        'Full-Stack Learner'
    ];
    const typedEl = document.getElementById('typed-text');
    let roleIdx = 0, charIdx = 0, deleting = false;

    function type() {
        if (!typedEl) return;
        const currentRole = roles[roleIdx];
        if (!deleting) {
            typedEl.textContent = currentRole.substring(0, charIdx + 1);
            charIdx++;
            if (charIdx === currentRole.length) {
                deleting = true;
                setTimeout(type, 1800);
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
        setTimeout(type, deleting ? 60 : 110);
    }
    type();

    /* ======================================
       4. ACTIVE NAV SCROLLSPY
    ====================================== */
    const sections   = document.querySelectorAll('section[id]');
    const navLinks   = document.querySelectorAll('.nav-links .nav-link');

    function updateActiveNav() {
        let currentSection = '';
        sections.forEach(sec => {
            const secTop = sec.offsetTop - 100;
            if (window.scrollY >= secTop) {
                currentSection = sec.getAttribute('id');
            }
        });
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === currentSection) {
                link.classList.add('active');
            }
        });
    }

    /* ======================================
       5. NAVBAR SCROLL EFFECT
    ====================================== */
    const header = document.getElementById('header');
    function handleScroll() {
        if (window.scrollY > 50) {
            header.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        } else {
            header.style.boxShadow = 'none';
        }
        updateActiveNav();
    }
    window.addEventListener('scroll', handleScroll);

    /* ======================================
       6. SCROLL REVEAL ANIMATION
    ====================================== */
    const animatedEls = document.querySelectorAll('.animate-on-scroll');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    animatedEls.forEach(el => revealObserver.observe(el));

    /* ======================================
       7. SKILL BAR ANIMATION
    ====================================== */
    const skillBars = document.querySelectorAll('.skill-bar-fill');
    const barObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const width = target.getAttribute('data-width');
                target.style.width = width + '%';
                barObserver.unobserve(target);
            }
        });
    }, { threshold: 0.4 });

    skillBars.forEach(bar => barObserver.observe(bar));

    /* ======================================
       8. CONTACT FORM HANDLER
    ====================================== */
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', function (e) {
            const btn = this.querySelector('.form-submit-btn');
            btn.innerHTML = '<i class="fas fa-check"></i> Message Sent!';
            btn.style.background = 'linear-gradient(135deg, #34d399, #10b981)';
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Send Message';
                btn.style.background = '';
            }, 3000);
        });
    }

});
