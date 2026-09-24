/* ==========================================================================
   KDP Profit Machine - Interactive Anti-AI-Slop Script
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  initCtaBreakSections();
  initCheckoutScroll();
  initCountdown();
  initStickyBar();
  initVideoPlayer();
  initDimeSaleTicker();
  initPreviewerSimulator();
  initExitPopup();
  initPillRotator();
});



/* 1. Reusable CTA Break Sections */
function initCtaBreakSections() {
  const template = document.getElementById('cta-break-template');
  if (!template) return;

  document.querySelectorAll('[data-cta-break]').forEach(mount => {
    const section = template.content.firstElementChild.cloneNode(true);
    mount.replaceWith(section);
  });
}

/* 2. Checkout anchor scroll — keep full pricing block above sticky bar */
function initCheckoutScroll() {
  const checkoutTarget = document.getElementById('checkout');
  if (!checkoutTarget) return;

  document.querySelectorAll('a[href="#checkout"]').forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      scrollToCheckout(checkoutTarget);
    });
  });

  if (window.location.hash === '#checkout') {
    requestAnimationFrame(() => scrollToCheckout(checkoutTarget));
  }
}

function scrollToCheckout(target) {
  const stickyBar = document.getElementById('stickyBar');
  const stickyHeight = stickyBar ? stickyBar.offsetHeight + 20 : 0;
  const topGap = 24;
  const blockTop = target.getBoundingClientRect().top + window.scrollY;
  const blockHeight = target.offsetHeight;
  const viewportHeight = window.innerHeight;
  const availableHeight = viewportHeight - stickyHeight - topGap;

  let scrollTop;
  if (blockHeight <= availableHeight) {
    scrollTop = blockTop - topGap - (availableHeight - blockHeight) / 2;
  } else {
    scrollTop = blockTop - topGap;
  }

  window.scrollTo({
    top: Math.max(0, scrollTop),
    behavior: 'smooth'
  });

  history.pushState(null, '', '#checkout');
}

/* 3. Countdown Timer */
function initCountdown() {
  const timerElements = document.querySelectorAll('.timer-display');
  const countdownBlocks = document.querySelectorAll('.cta-countdown');
  let legacyDuration = 14 * 60 + 59;
  const endTime = getCountdownEndTime();

  function pad(value) {
    return String(value).padStart(2, '0');
  }

  function updateTimer() {
    const minutes = Math.floor(legacyDuration / 60);
    const seconds = legacyDuration % 60;
    const formatted = `${pad(minutes)}:${pad(seconds)}`;

    timerElements.forEach(el => {
      if (el) el.textContent = formatted;
    });

    if (legacyDuration > 0) legacyDuration--;
    else legacyDuration = 14 * 60 + 59;

    const diff = Math.max(0, endTime - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const secs = Math.floor((diff % (1000 * 60)) / 1000);

    countdownBlocks.forEach(block => {
      const daysEl = block.querySelector('[data-days]');
      const hoursEl = block.querySelector('[data-hours]');
      const minsEl = block.querySelector('[data-mins]');
      const secsEl = block.querySelector('[data-secs]');

      if (daysEl) daysEl.textContent = pad(days);
      if (hoursEl) hoursEl.textContent = pad(hours);
      if (minsEl) minsEl.textContent = pad(mins);
      if (secsEl) secsEl.textContent = pad(secs);
    });
  }

  updateTimer();
  setInterval(updateTimer, 1000);
}

function getCountdownEndTime() {
  const storageKey = 'kdp_profit_machine_cta_countdown_end';
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    const parsed = Number(stored);
    if (!Number.isNaN(parsed) && parsed > Date.now()) {
      return parsed;
    }
  }

  const endTime = Date.now() + (24 * 60 * 60 * 1000);
  localStorage.setItem(storageKey, String(endTime));
  return endTime;
}

/* 2. FAQ Accordion Handler */
function initFAQ() {
  const items = document.querySelectorAll('.accordion-item');

  items.forEach(item => {
    const question = item.querySelector('.accordion-q');
    if (!question) return;

    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');

      items.forEach(other => other.classList.remove('active'));

      if (!isActive) {
        item.classList.add('active');
      }
    });
  });
}

/* 3. Sticky Bottom CTA Bar */
function initStickyBar() {
  const stickyBar = document.getElementById('stickyBar');
  if (!stickyBar) return;

  const updateStickyBar = () => {
    if (window.scrollY > 600) {
      stickyBar.style.transform = 'translateY(0)';
      document.body.classList.add('has-sticky-bar');
    } else {
      stickyBar.style.transform = 'translateY(100%)';
      document.body.classList.remove('has-sticky-bar');
    }
  };

  window.addEventListener('scroll', updateStickyBar);
  updateStickyBar();
}

/* 4. VSL Player */
function initVideoPlayer() {
  const playBtn = document.getElementById('playBtn');
  const vslContainer = document.getElementById('vslInner');

  if (playBtn && vslContainer) {
    playBtn.addEventListener('click', () => {
      vslContainer.innerHTML = `
        <iframe 
          src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1&rel=0" 
          title="KDP Profit Machine Demo"
          frameborder="0" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen
          style="position: absolute; top:0; left:0; width:100%; height:100%; border-radius:18px;"
        ></iframe>
      `;
    });
  }
}

/* 5. Dime-Sale Live Ticker */
function initDimeSaleTicker() {
  const priceDisplays = document.querySelectorAll('.dime-price');
  let basePrice = 17.00;

  setInterval(() => {
    basePrice += 0.05;
    if (basePrice > 19.95) basePrice = 17.00;

    priceDisplays.forEach(el => {
      el.textContent = `$${basePrice.toFixed(2)}`;
    });
  }, 18000);
}

/* 6. Signature Component: Interactive KDP Print Previewer Status Simulator */
function initPreviewerSimulator() {
  const simItems = document.querySelectorAll('.sim-item');
  if (simItems.length === 0) return;

  // Pulse glow effect on spec items
  let idx = 0;
  setInterval(() => {
    simItems.forEach(item => item.style.borderColor = '#34d399');
    if (simItems[idx]) {
      simItems[idx].style.borderColor = '#fbbf24';
    }
    idx = (idx + 1) % simItems.length;
  }, 2500);
}

/* 7. Exit-Intent Popup Handler */
function initExitPopup() {
  const overlay = document.getElementById('exitPopupOverlay');
  const closeBtn = document.getElementById('exitPopupClose');
  const ctaBtn = document.getElementById('exitPopupCta');
  if (!overlay) return;

  let hasShown = false;

  function showPopup() {
    if (hasShown || sessionStorage.getItem('kdp_exit_popup_shown')) return;
    overlay.classList.add('active');
    overlay.setAttribute('aria-hidden', 'false');
    hasShown = true;
    sessionStorage.setItem('kdp_exit_popup_shown', 'true');
  }

  function hidePopup() {
    overlay.classList.remove('active');
    overlay.setAttribute('aria-hidden', 'true');
  }

  // Detect mouse leaving viewport from top boundary (Desktop Exit-Intent)
  document.addEventListener('mouseleave', (e) => {
    if (e.clientY <= 15) {
      showPopup();
    }
  });

  // Close when clicking Close (X) button
  if (closeBtn) {
    closeBtn.addEventListener('click', hidePopup);
  }

  // Close when clicking backdrop outside modal
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      hidePopup();
    }
  });

  // Hide popup on CTA button click
  if (ctaBtn) {
    ctaBtn.addEventListener('click', () => {
      hidePopup();
    });
  }

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('active')) {
      hidePopup();
    }
  });
}

/* 8. Dark Pill Bar 3-Item Group Rotator */
function initPillRotator() {
  const container = document.getElementById('pillRotatorGroup');
  if (!container) return;

  const groups = [
    ['Ebooks', 'Word Search', 'Sudoku'],
    ['Coloring Books', 'Planners', 'Crosswords'],
    ['Activity Books', 'Math Workbook', 'Journals']
  ];

  let currentIdx = 0;

  setInterval(() => {
    container.classList.add('changing');
    setTimeout(() => {
      currentIdx = (currentIdx + 1) % groups.length;
      const currentGroup = groups[currentIdx];

      const word1 = container.querySelector('.pill-word-1');
      const word2 = container.querySelector('.pill-word-2');
      const word3 = container.querySelector('.pill-word-3');

      if (word1) word1.textContent = currentGroup[0];
      if (word2) word2.textContent = currentGroup[1];
      if (word3) word3.textContent = currentGroup[2];

      container.classList.remove('changing');
    }, 350);
  }, 2600);
}
