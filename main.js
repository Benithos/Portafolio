// script.js

// Custom smooth scroll function with controllable duration
function smoothScrollTo(targetY, duration = 1400) {
    const startY = window.pageYOffset;
    const distance = targetY - startY;
    const startTime = performance.now();

    function animate(time) {
        const elapsed = time - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // EaseInOutQuad easing – smooth acceleration and deceleration
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


if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
window.scrollTo(0, 0);
window.addEventListener('pageshow', e => { 
    if (e.persisted) window.scrollTo(0,0); 
});

const themeBtn = document.getElementById('themeToggle');
const langBtn = document.getElementById('langBtn');
const body = document.body;

function updateThemeUI(){
    themeBtn.textContent = body.classList.contains('light-theme') ? '☀️' : '🌙';
}

themeBtn.addEventListener('click', () => { 
    body.classList.toggle('light-theme'); 
    updateThemeUI(); 
});

const languages = ['EN','ES','FR'];
let langIndex = 0;
langBtn.addEventListener('click', () => { 
    langIndex = (langIndex+1) % languages.length; 
    langBtn.textContent = languages[langIndex]; 
});

updateThemeUI();

document.addEventListener('DOMContentLoaded', () => {
    const hold = 500, fade = 700, overlap = 500;
    document.body.classList.add('page-loading');
    const overlay = document.createElement('div');
    overlay.className = 'page-overlay';
    document.body.appendChild(overlay);
    setTimeout(()=> requestAnimationFrame(()=> overlay.classList.add('fade-out')), hold);

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

        setTimeout(() => {
            document.querySelector('.gallery-section').classList.add('visible');
            const initialCategory = 'all';
            switchContent(initialCategory);
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
    if (index === 2) {
        btn.classList.add('selected');
    }
});

// IntersectionObserver for progressive reveal
let observer;

function initGalleryObserver() {
    if (observer) observer.disconnect();

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // one-time reveal
            }
        });
    }, {
        root: null,
        rootMargin: '0px 0px -100px 0px',
        threshold: 0.08
    });

    document.querySelectorAll('.gallery-item').forEach(item => {
        observer.observe(item);
    });
}

// Example: shuffle when loading the "all" category
function switchContent(category) {
    const newContainer = document.querySelector(`.${category}-container`);
    if (!newContainer) return;

    const currentActive = document.querySelector('.content-container.active');

    if (currentActive) {
        currentActive.classList.remove('active');
        currentActive.querySelectorAll('.gallery-item.visible').forEach(item => {
            item.classList.remove('visible');
        });
        setTimeout(() => {
            currentActive.style.display = 'none';
        }, 280);
    }

    setTimeout(() => {
        newContainer.style.display = 'block';
        void newContainer.offsetWidth;
        newContainer.classList.add('active');

        // ─── Randomize order only for the "all" gallery ───
        if (category === 'all') {
            const gallery = newContainer.querySelector('.gallery');
            if (gallery) {
                const items = Array.from(gallery.children);
                shuffleArray(items);
                
                // Remove all children and re-append in new order
                gallery.innerHTML = '';
                items.forEach(item => gallery.appendChild(item));
            }
        }

        // Re-observe for scroll reveal
        setTimeout(() => {
            newContainer.querySelectorAll('.gallery-item:not(.visible)').forEach(item => {
                observer.observe(item);
            });
        }, 120);
    }, currentActive ? 280 : 0);
}

initGalleryObserver();

// Click handler for category buttons
categoryContainer.addEventListener('click', (e) => {
    const btn = e.target.closest('.category-btn');
    if (!btn) return;

    const clickedPos = parseInt(btn.getAttribute('data-pos'));
    const center = 2;

    // Only rotate if it's NOT already the center button
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

    // Always get the current selected category and switch content
    const selectedBtn = document.querySelector('.category-btn.selected');
    const currentCategory = selectedBtn.getAttribute('data-category');
    switchContent(currentCategory);

    // Always scroll to the category row (even if already selected)
    setTimeout(() => {
        const selector = document.querySelector('.category-selector');
        if (!selector) return;

        const topbarHeight = document.querySelector('.topbar')?.offsetHeight || 0;
        const extraPadding = 16;
        
        const targetY = selector.getBoundingClientRect().top 
                      + window.pageYOffset 
                      - topbarHeight 
                      - extraPadding;

        smoothScrollTo(targetY, 700); // your slow scroll
    }, 400);
});

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}