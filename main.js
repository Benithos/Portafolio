// main.js

// Helper: Custom smooth scroll with controllable duration
function smoothScrollTo(targetY, duration = 1200) {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // EaseInOutQuad easing
        const ease = progress < 0.5 
            ? 2 * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 2) / 2;

        window.scrollTo(0, startY + distance * ease);

        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }

    requestAnimationFrame(animate);
}

// Helper: Shuffle array (Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


// ───────────────────────────────────────────────
//   Page setup & smooth scroll restoration
// ───────────────────────────────────────────────
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('pageshow', e => { 
    if (e.persisted) window.scrollTo(0, 0); 
});


// ───────────────────────────────────────────────
//   Theme & Language toggle
// ───────────────────────────────────────────────
const themeBtn = document.getElementById('themeToggle');
const langBtn = document.getElementById('langBtn');
const body = document.body;

function updateThemeUI() {
    themeBtn.textContent = body.classList.contains('light-theme') ? '☀️' : '🌙';
}

themeBtn.addEventListener('click', () => { 
    body.classList.toggle('light-theme'); 
    updateThemeUI(); 
});

const languages = ['EN', 'ES', 'FR'];
let langIndex = 0;
langBtn.addEventListener('click', () => { 
    langIndex = (langIndex + 1) % languages.length; 
    langBtn.textContent = languages[langIndex]; 
});

updateThemeUI();


// ───────────────────────────────────────────────
//   Page load animation (reveal elements)
// ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    const hold = 500, fade = 700, overlap = 500;
    document.body.classList.add('page-loading');

    const overlay = document.createElement('div');
    overlay.className = 'page-overlay';
    document.body.appendChild(overlay);

    setTimeout(() => requestAnimationFrame(() => overlay.classList.add('fade-out')), hold);

    const revealStartAt = hold + Math.max(0, fade - overlap);

    setTimeout(() => {
        const nodeList = document.querySelectorAll(
            '.topbar, header, nav, main, .card, .card *, footer, .category-selector, .gallery-section'
        );
        const elems = Array.from(new Set(Array.from(nodeList)))
            .filter(Boolean)
            .filter(el => !el.closest('.social-btn'));

        elems.forEach((el, i) => {
            el.classList.add('reveal');
            el.style.setProperty('--delay', `${i * 120}ms`);
        });

        document.body.classList.remove('page-loading');
        requestAnimationFrame(() => elems.forEach(el => el.classList.add('animate')));

        // Show gallery section and load initial content
        setTimeout(() => {
            const gallerySection = document.querySelector('.gallery-section');
            if (gallerySection) gallerySection.classList.add('visible');

            switchContent('all');
        }, revealStartAt + 400);

    }, revealStartAt);

    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
});


// ───────────────────────────────────────────────
//   Category buttons + scroll reveal logic
// ───────────────────────────────────────────────

const categoryContainer = document.querySelector('.category-container');
const categoryBtns = document.querySelectorAll('.category-btn');
const scales = [0.95, 0.98, 1, 0.98, 0.95];

// Initial button setup
categoryBtns.forEach((btn, index) => {
    btn.setAttribute('data-pos', index);
    btn.style.setProperty('--pos', index);
    btn.style.setProperty('--scale', scales[index]);
    if (index === 2) btn.classList.add('selected');
});

// IntersectionObserver for progressive item reveal
let observer;

function initGalleryObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.08
    });

    document.querySelectorAll('.gallery-item').forEach(item => observer.observe(item));
}

// Switch content with shuffle on "all"
function switchContent(category) {
    const newContainer = document.querySelector(`.${category}-container`);
    if (!newContainer) return;

    const currentActive = document.querySelector('.content-container.active');

    if (currentActive) {
        currentActive.classList.remove('active');
        currentActive.querySelectorAll('.gallery-item.visible').forEach(item => {
            item.classList.remove('visible');
        });
        setTimeout(() => currentActive.style.display = 'none', 280);
    }

    setTimeout(() => {
        newContainer.style.display = 'block';
        void newContainer.offsetWidth;
        newContainer.classList.add('active');

        // Shuffle only "all" category
        if (category === 'all') {
            const gallery = newContainer.querySelector('.gallery');
            if (gallery) {
                const items = Array.from(gallery.children);
                shuffleArray(items);
                gallery.innerHTML = '';
                items.forEach(item => gallery.appendChild(item));
            }
        }

        // Re-observe new items
        setTimeout(() => {
            newContainer.querySelectorAll('.gallery-item:not(.visible)').forEach(item => {
                observer.observe(item);
            });
        }, 120);
    }, currentActive ? 280 : 0);
}

initGalleryObserver();


// ───────────────────────────────────────────────
//   Category button click handler (merged)
// ───────────────────────────────────────────────
categoryContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;

    const clickedPos = parseInt(btn.getAttribute('data-pos'));
    const center = 2;

    // Rotate only if not already center
    if (clickedPos !== center) {
        const shift = clickedPos - center;

        categoryBtns.forEach((b) => {
            let pos = parseInt(b.getAttribute('data-pos'));
            let newPos = (pos - shift + 5) % 5;
            b.setAttribute('data-pos', newPos);
            b.style.setProperty('--pos', newPos);
            b.style.setProperty('--scale', scales[newPos]);
            b.classList.toggle('selected', newPos === center);
        });
    }

    // Switch content
    const selectedBtn = document.querySelector('.category-btn.selected');
    const currentCategory = selectedBtn.getAttribute('data-category');
    switchContent(currentCategory);

    // Always scroll to category row
    setTimeout(() => {
        const selector = document.querySelector('.category-selector');
        if (!selector) return;

        const topbarHeight = document.querySelector('.topbar')?.offsetHeight || 0;
        const extraPadding = 16;
        const targetY = selector.getBoundingClientRect().top 
                      + window.pageYOffset 
                      - topbarHeight 
                      - extraPadding;

        smoothScrollTo(targetY, 700);
    }, 400);
});


// ───────────────────────────────────────────────
//   Scroll-based background blur fade
// ───────────────────────────────────────────────
let lastScrollY = window.scrollY;

window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    const blurLayer = document.querySelector('.bg-blur-layer');
    const hero = document.querySelector('.hero');
    if (!blurLayer || !hero) return;

    const heroBottom = hero.getBoundingClientRect().bottom;

    // Fade in when scrolled past hero (down)
    if (heroBottom <= 0 && currentScrollY > lastScrollY) {
        blurLayer.style.opacity = '1';
    } 
    // Fade out when hero re-enters view (up)
    else if (heroBottom > 0 && currentScrollY < lastScrollY) {
        blurLayer.style.opacity = '0';
    }

    lastScrollY = currentScrollY;
});