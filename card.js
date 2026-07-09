gsap.set(getCardContent(active), { x:0, y:0, opacity: 0 });
gsap.set(detailsActive, { opacity:0, aIndex: 22, x: -200 });
gsap.set(detailsInactive, { opacity: 0, aIndex: 12 });
gsap.set(`${detailsInactive} .text`, { y:100 });
gsap.set(`${detailsInactive} .title-1`, { y:100 });
gsap.set(`${detailsInactive} .title-2`, { y:100 });
gsap.set(`${detailsInactive} .dec`, { y:50 });
gsap.set(`${detailsInactive} .cta`, { y:60 });

gsap.set(".progress-sub-foreground", { 
    width: 500 * (1 / order.length) * (active + 1) });