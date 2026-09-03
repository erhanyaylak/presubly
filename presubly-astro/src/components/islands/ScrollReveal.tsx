import { useEffect } from 'preact/hooks';

export default function ScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            observer.unobserve(e.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal,.reveal-l,.reveal-s').forEach((el) => {
      observer.observe(el);
    });

    // Hero bar animation
    setTimeout(() => {
      [['rb1', '91%'], ['rb2', '88%'], ['rb3', '79%'], ['rb4', '74%'], ['rb5', '96%']].forEach(([id, w], i) => {
        setTimeout(() => {
          const el = document.getElementById(id);
          if (el) el.style.width = w;
        }, i * 150);
      });
    }, 600);

    // Counter animation
    const counterObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const el = e.target as HTMLElement;
          const target = parseInt(el.dataset.count || '0');
          const txt = el.closest('.si')?.querySelector('.sl')?.textContent || '';
          let sfx = '';
          if (txt.includes('(K)')) sfx = 'K+';
          else if (txt.includes('(%)')) sfx = '%';
          let cur = 0;
          const step = Math.max(1, Math.ceil(target / 40));
          const timer = setInterval(() => {
            cur += step;
            if (cur >= target) { cur = target; clearInterval(timer); }
            el.textContent = cur + sfx;
          }, 30);
          counterObs.unobserve(el);
        });
      },
      { threshold: 0.5 }
    );

    document.querySelectorAll('.sn[data-count]').forEach((el) => {
      counterObs.observe(el);
    });

    // Nav scroll shadow
    const onScroll = () => {
      const nav = document.getElementById('nav');
      if (nav) nav.classList.toggle('scrolled', window.scrollY > 20);
    };
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return null;
}
