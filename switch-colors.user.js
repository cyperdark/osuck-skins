// ==UserScript==
// @name         osu-dynamic-beatmaps-color
// @namespace    http://tampermonkey.net/
// @version      0.1.0
// @description  updating beatmap page color to match difficulty icon color hue
// @author       cyperdark
// @match        http://osu.ppy.sh/*
// @match        https://osu.ppy.sh/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=ppy.sh
// @grant        none
// @updateURL    https://github.com/cyperdark/osuck-skins/raw/main/switch-colors.user.js
// @downloadURL  https://github.com/cyperdark/osuck-skins/raw/main/switch-colors.user.js
// ==/UserScript==

(function () {
  'use strict';

  window.onload = () => {
    /**
     * source https://gist.github.com/mjackson/5311256
     */
    function rgbToHsl(rgb) {
      let [r, g, b] = rgb.split(',').map(Number);
      r /= 255, g /= 255, b /= 255;

      var max = Math.max(r, g, b), min = Math.min(r, g, b);
      var h, s, l = (max + min) / 2;

      if (max == min) {
        h = s = 0; // achromatic
      } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r: h = (g - b) / d + (g < b ? 6 : 0); break;
          case g: h = (b - r) / d + 2; break;
          case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
      };

      return [h, s, l];
    };


    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    };


    function change_hue(target) {
      if (!target) return;
      try {
        const element = target?.childNodes?.[0];
        if (!element) return;

        const og_rgb = element.computedStyleMap().get('--diff')[0];
        const rgb = og_rgb.replace('rgb(', '').replace(')', '');
        const hue = og_rgb.includes('rgb') ? Math.round(rgbToHsl(rgb)[0] * 360) : 0;

        console.log('Class changed:', { rgb, hue });

        document.body.style.setProperty('--base-hue-override', hue);
        document.body.classList.add('-bypass');
        if (hue == 0) document.body.classList.add('dark-theme-hack');
        else document.body.classList.remove('dark-theme-hack');
      } catch (error) {
        console.log(error, { target });
      };
    };


    function some_css() {
      const style = document.createElement('style');
      style.innerHTML = `.dark-theme-hack {--hsl-p: 0, 0%, 50%;--hsl-h1: 0, 0%, 70%;--hsl-h2: 0, 0%, 45%;--hsl-c1: 0, 0%, 100%;--hsl-c2: 0, 0%, 90%;--hsl-l1: 0, 0%, 80%;--hsl-l2: 0, 0%, 75%;--hsl-l3: 0, 0%, 70%;--hsl-l4: 0, 0%, 50%;--hsl-d1: 0, 0%, 35%;--hsl-d2: 0, 0%, 30%;--hsl-d3: 0, 0%, 25%;--hsl-d4: 0, 0%, 20%;--hsl-d5: 0, 0%, 15%;--hsl-d6: 0, 0%, 10%;--hsl-f1: 0, 0%, 60%;--hsl-b1: 0, 0%, 40%;--hsl-b2: 0, 0%, 30%;--hsl-b3: 0, 0%, 25%;--hsl-b4: 0, 0%, 20%;--hsl-b5: 0, 0%, 15%;--hsl-b6: 0, 0%, 10%;--hsl-pink-1: 0, 0%, 60%;--hsl-purple-1: 0, 0%, 60%;--hsl-blue-1: 0, 0%, 60%;--hsl-green-1: 0, 0%, 60%;--hsl-orange-1: 0, 0%, 60%;--hsl-red-1: 0, 0%, 60%;--hsl-darkorange-1: 0, 0%, 60%;--beatmapset-graveyard-bg: #000;--beatmapset-graveyard-colour: #939393;--beatmapset-wip-bg: #FF9966;--beatmapset-pending-bg: #FFD966;--beatmapset-qualified-bg: #66CCFF;--beatmapset-approved-bg: #B3FF66;--beatmapset-ranked-bg: #B3FF66;--beatmapset-loved-bg: #FF66AB;} .dark-theme-hack .nav2-header__triangles {filter:grayscale(1);}`;
      document.head.appendChild(style);
    };



    function callback(mutationsList) {
      for (let mutation of mutationsList) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && mutation.target.classList.contains('beatmapset-beatmap-picker__beatmap--active')) {
          change_hue(mutation.target);
        }

        else if (mutation.target.classList.contains('beatmapset-scoreboard__main')) {
          change_hue(document.querySelector('.beatmapset-beatmap-picker__beatmap--active'));
        };
      };
    };


    change_hue(document.querySelector('.beatmapset-beatmap-picker__beatmap--active'));
    some_css();

    const observer = new MutationObserver(callback);
    observer.observe(document, { attributes: true, attributeFilter: ['class'], subtree: true });


    window.addEventListener('popstate', (event) => {
      console.log('test', window.location.href);

    });

    navigation.addEventListener('navigate', async () => {
      console.log('page changed', window.location.pathname);

      if (!window.location.pathname.startsWith('/beatmapsets/')) return;
      console.log('waiting');
      while (document.querySelector('.beatmapset-beatmap-picker__beatmap--active') == null) {
        await sleep(250);
      };

      change_hue(document.querySelector('.beatmapset-beatmap-picker__beatmap--active'));
    });
  }
})();
