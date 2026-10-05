// ---- mobile menu ----

const toggle = document.querySelector('.nav-toggle');
const navLinks = document.querySelector('.nav-right');

if (toggle && navLinks) {

    toggle.addEventListener('click', () => {
        const open = navLinks.classList.toggle('open');
        toggle.setAttribute('aria-expanded', open);
    });

    navLinks.addEventListener('click', (e) => {
        if (e.target.tagName === 'A') {
            navLinks.classList.remove('open');

            if (toggle) {
                toggle.setAttribute('aria-expanded', 'false');
            }
        }
    });
}


// ---- sliding cards ----

function initSlider(root) {

    const track = root.querySelector('.track');
    const slides = [...root.querySelectorAll('.slide')];
    const dotsBox = root.querySelector('.dots');
    const prev = root.querySelector('.prev');
    const next = root.querySelector('.next');

    if (!track || !slides.length || !dotsBox || !prev || !next) {
        return;
    }

    const last = slides.length - 1;
    let index = 0;

    const dots = slides.map((_, i) => {

        const b = document.createElement('button');

        b.setAttribute(
            'aria-label',
            'Go to card ' + (i + 1)
        );

        b.addEventListener('click', () => go(i));

        dotsBox.appendChild(b);

        return b;
    });


    function go(n) {

        index = Math.max(0, Math.min(last, n));

        track.style.transform =
            `translateX(-${index * 100}%)`;

        slides.forEach((slide, i) => {

            slide.classList.toggle(
                'active',
                i === index
            );

            slide.inert = i !== index;

            slide.setAttribute(
                'aria-hidden',
                i !== index
            );
        });

        dots.forEach((dot, i) => {

            dot.classList.toggle(
                'on',
                i === index
            );
        });

        prev.disabled = index === 0;
        next.disabled = index === last;
    }


    // Previous / next buttons

    prev.addEventListener('click', () => {
        go(index - 1);
    });

    next.addEventListener('click', () => {
        go(index + 1);
    });


    // Keyboard arrows

    root.addEventListener('keydown', (e) => {

        if (e.key === 'ArrowRight') {
            go(index + 1);
        }

        if (e.key === 'ArrowLeft') {
            go(index - 1);
        }
    });


    // Swipe on touch screens

    let startX = 0;

    root.addEventListener(
        'touchstart',
        (e) => {
            startX = e.touches[0].clientX;
        },
        { passive: true }
    );

    root.addEventListener(
        'touchend',
        (e) => {

            const dx =
                e.changedTouches[0].clientX - startX;

            if (Math.abs(dx) > 50) {
                go(index + (dx < 0 ? 1 : -1));
            }
        }
    );


    // Start at first slide

    go(0);
}


document
    .querySelectorAll('[data-slider]')
    .forEach(initSlider);


// ---- contact form ----

const form = document.getElementById('contactForm');
const note = document.getElementById('formNote');

if (form && note) {

    form.addEventListener('submit', (e) => {

        e.preventDefault();

        // TODO: send these values to your Spring Boot endpoint

        note.textContent =
            'Thanks, your message is on its way.';

        form.reset();
    });
}