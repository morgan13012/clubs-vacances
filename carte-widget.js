(function () {
  var BASE_URL = 'https://morgan13012.github.io/clubs-vacances/';
  var CARTE_URL = BASE_URL + 'carte-clubs-vacances30_avec_copyright_TM.html';
  var container = document.getElementById('carte-clubs-vacances');

  if (!container) {
    console.error('Carte clubs vacances : élément #carte-clubs-vacances introuvable.');
    return;
  }

  // Style du conteneur
  container.style.width = '80%';
  container.style.height = '70vh';
  container.style.margin = '0 auto';
  container.style.position = 'relative';
  container.style.overflow = 'hidden';

  // Loader temporaire
  container.innerHTML = '<p style="text-align:center;padding-top:20%;color:#888;">Chargement de la carte…</p>';

  fetch(CARTE_URL)
    .then(function (response) {
      if (!response.ok) throw new Error('Erreur HTTP ' + response.status);
      return response.text();
    })
    .then(function (html) {
      var parser = new DOMParser();
      var doc = parser.parseFromString(html, 'text/html');

      container.innerHTML = '';

      // 1) Injecter les <style> du <head>
      var styles = doc.querySelectorAll('head style, head link[rel="stylesheet"]');
      styles.forEach(function (el) {
        var clone = document.importNode(el, true);
        container.appendChild(clone);
      });

      // 2) Collecter les scripts externes du <head>
      var headScripts = doc.querySelectorAll('head script[src]');
      var scriptsToLoad = [];

      headScripts.forEach(function (el) {
        var src = el.getAttribute('src');
        if (src && !src.startsWith('http') && !src.startsWith('//')) {
          src = BASE_URL + src;
        }
        scriptsToLoad.push({ src: src, content: null });
      });

      // 3) Injecter le contenu du <body>
      var bodyContent = doc.body ? doc.body.innerHTML : doc.documentElement.innerHTML;
      var wrapper = document.createElement('div');
      wrapper.className = 'carte-clubs-wrapper';
      wrapper.style.width = '100%';
      wrapper.style.height = '100%';
      wrapper.innerHTML = bodyContent;
      container.appendChild(wrapper);

      // 4) Collecter les scripts inline et body scripts
      var bodyScripts = doc.querySelectorAll('body script');
      bodyScripts.forEach(function (el) {
        var src = el.getAttribute('src');
        if (src) {
          if (!src.startsWith('http') && !src.startsWith('//')) {
            src = BASE_URL + src;
          }
          scriptsToLoad.push({ src: src, content: null });
        } else if (el.textContent.trim()) {
          scriptsToLoad.push({ src: null, content: el.textContent });
        }
      });

      // Scripts inline du head
      var headInlineScripts = doc.querySelectorAll('head script:not([src])');
      headInlineScripts.forEach(function (el) {
        if (el.textContent.trim()) {
          scriptsToLoad.push({ src: null, content: el.textContent });
        }
      });

      // 5) Charger les scripts séquentiellement
      function loadNextScript(index) {
        if (index >= scriptsToLoad.length) return;
        var scriptInfo = scriptsToLoad[index];
        var script = document.createElement('script');

        if (scriptInfo.src) {
          script.src = scriptInfo.src;
          script.onload = function () {
            loadNextScript(index + 1);
          };
          script.onerror = function () {
            console.warn('Carte widget : impossible de charger ' + scriptInfo.src);
            loadNextScript(index + 1);
          };
        } else {
          script.textContent = scriptInfo.content;
        }

        document.body.appendChild(script);

        if (!scriptInfo.src) {
          loadNextScript(index + 1);
        }
      }

      // Retirer les <script> du wrapper (déjà gérés)
      var injectedScripts = wrapper.querySelectorAll('script');
      injectedScripts.forEach(function (el) {
        el.remove();
      });

      loadNextScript(0);
    })
    .catch(function (err) {
      container.innerHTML = '<p style="text-align:center;padding-top:20%;color:red;">Erreur de chargement de la carte.</p>';
      console.error('Carte clubs vacances :', err);
    });
})();
