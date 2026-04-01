/**
 * FinTrack — Tour Interativo de Vieses Cognitivos
 * Um único arquivo autocontido. Inclua com <script src="/src/assets/js/tour.js"></script>
 * no final do <body> de qualquer página do projeto.
 */
(function () {
  'use strict';

  // ─── Dados das etapas ────────────────────────────────────────────────────────
  var STEPS = [
    {
      selector: '[data-tour="monthly-expenses"]',
      page: '/src/dashboard/index.html',
      bias: 'Viés de Aversão à Perda',
      where: 'Dashboard / Card "Despesas Mensais"',
      definition: 'A sensação ruim de perder algo é muito mais intensa do que a alegria de ganhar, o que nos faz tomar decisões focadas em prevenir perdas.',
      why: 'A sensação de prevenir perdas impacta as decisões, então foi incluído um limite de gastos numérico na barra de despesas para ajudar os usuários a evitar perdas financeiras e não ficarem no vermelho.'
    },
    {
      selector: '[data-tour="upgrade-now"]',
      page: '/src/dashboard/index.html',
      bias: 'Efeito Grátis',
      where: 'Dashboard / Sidebar — Botão "Upgrade Now"',
      definition: 'Oferecer um item totalmente gratuito pode gerar um impulso de ação ou compra muito maior do que oferecer um grande desconto.',
      why: 'Um item gratuito gera um impulso de ação maior, por isso o botão foi alterado para um teste grátis de modelo "freemium", reduzindo o atrito inicial do usuário.'
    },
    {
      selector: '[data-tour="budgets-banner"]',
      page: '/src/budgets/index.html',
      bias: 'Efeito Priming',
      where: 'Budgets / Banner do rodapé',
      definition: 'Nossas escolhas e decisões são diretamente influenciadas por associações que fazemos com estímulos recentes, como imagens, palavras, memórias ou até cheiros.',
      why: 'Como tomamos decisões baseadas em associações visuais e memórias, o banner recebeu imagens de conquistas (casa, viagens) para encorajar atitudes financeiras proativas e positivas.'
    },
    {
      selector: '[data-tour="create-budget"]',
      page: '/src/budgets/index.html',
      bias: 'Efeito Ancoragem',
      where: 'Budgets / Botão "+ Criar Novo Orçamento"',
      definition: 'A primeira informação que recebemos sobre um produto ou serviço funciona como uma base (âncora) e passa a definir o nosso julgamento de valor sobre ele.',
      why: 'A primeira informação recebida define o nosso julgamento de valor. Sugerir um valor baseado na média de gastos serve como âncora para facilitar a decisão na hora de criar um orçamento.'
    },
    {
      selector: '[data-tour="top-spending"]',
      page: '/src/reports/index.html',
      bias: 'Efeito Posição Serial',
      where: 'Reports / Lista "Top Spending"',
      definition: 'Ao visualizar uma série de informações, a nossa mente lembrará com muito mais facilidade do primeiro e do último item escaneado.',
      why: 'A nossa mente lembra mais do primeiro e do último item. Por isso, a maior despesa fica no início da lista e um dado encorajador de economia é injetado no final.'
    },
    {
      selector: '[data-tour="download-report"]',
      page: '/src/reports/index.html',
      bias: 'Viés da Regra do Pico-Fim',
      where: 'Reports / Ação final "Download Report"',
      definition: 'A nossa memória sobre um acontecimento não é exata; ela é um resumo focado nos momentos de emoção mais intensa (picos) e na forma exata como o evento terminou.',
      why: 'Como as memórias de eventos são resumidas aos picos de emoção e ao final, adicionou-se uma mensagem de celebração ao fim da jornada para encerrar a análise financeira de maneira positiva.'
    },
    {
      selector: '[data-tour="link-bank"]',
      page: '/src/accounts/index.html',
      bias: 'Viés de Mera Exposição',
      where: 'Accounts / Card "Vincular Novo Banco"',
      definition: 'O nosso cérebro desconfia do que é novo, mas quanto mais somos expostos a algo criando familiaridade, maior se torna a nossa aceitação em relação àquilo.',
      why: 'O cérebro desconfia do novo, mas a familiaridade aumenta a aceitação. Por isso, logos em escala de cinza de bancos já conhecidos foram adicionados para gerar confiança antes da conexão.'
    },
    {
      selector: '[data-tour="pro-offer"]',
      page: '/src/dashboard/index.html',
      bias: 'Viés do Desconto Hiperbólico',
      where: 'Dashboard / Sidebar — Oferta Pro',
      definition: 'Preferimos recompensas menores e imediatas em vez de esperar por opções melhores no futuro, pois somos impacientes por natureza.',
      why: 'Como somos impacientes e preferimos recompensas a curto prazo, a estratégia "Use agora, pague depois" foi aplicada para liberar as funções Pro instantaneamente, adiando a dor da cobrança.'
    }
  ];

  // ─── Estado ───────────────────────────────────────────────────────────────────
  var STORAGE_ACTIVE = 'fintrack_tour_active';
  var STORAGE_STEP   = 'fintrack_tour_step';

  var isActive     = false;
  var visibleSteps = [];   // etapas cujos elementos existem na página atual
  var visibleIdx   = 0;    // índice dentro de visibleSteps
  var spotlightEl  = null;
  var overlayEl    = null;
  var floatBtn     = null;

  // ─── Estilos injetados via JS ─────────────────────────────────────────────────
  function injectStyles() {
    if (document.getElementById('ft-tour-styles')) return;
    var s = document.createElement('style');
    s.id = 'ft-tour-styles';
    s.textContent = [
      "@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');",

      /* ── Overlay escuro ── */
      '#ft-tour-overlay{position:fixed;inset:0;z-index:99990;pointer-events:none;transition:opacity .3s}',
      '#ft-tour-overlay.ft-active{pointer-events:auto}',

      /* ── Spotlight (buraco de luz) ── */
      '.ft-spotlight{',
        'position:fixed;border-radius:12px;',
        'box-shadow:0 0 0 9999px rgba(0,0,0,.68);',
        'z-index:99991;pointer-events:none;',
        'transition:left .38s cubic-bezier(.4,0,.2,1),top .38s cubic-bezier(.4,0,.2,1),',
        'width .38s cubic-bezier(.4,0,.2,1),height .38s cubic-bezier(.4,0,.2,1);',
        'border:2px solid rgba(108,99,255,.55);}',

      /* ── Card explicativo ── */
      '#ft-tour-card{',
        'position:fixed;z-index:99992;width:364px;',
        'background:#1a1f2e;',
        'border:1px solid rgba(108,99,255,.28);border-radius:18px;padding:26px;',
        'box-shadow:0 28px 70px rgba(0,0,0,.55),0 0 0 1px rgba(108,99,255,.1);',
        'font-family:"Inter","Manrope",sans-serif;color:#f0f4ff;',
        'animation:ft-card-in .35s cubic-bezier(.34,1.56,.64,1);}',
      '@keyframes ft-card-in{from{opacity:0;transform:translateY(14px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}',

      '.ft-badge{display:inline-flex;align-items:center;gap:5px;font-size:10px;font-weight:700;',
        'letter-spacing:.09em;text-transform:uppercase;color:#8892a4;margin-bottom:7px;}',
      '.ft-badge-dot{width:7px;height:7px;border-radius:50%;background:#6c63ff;flex-shrink:0;}',

      '.ft-bias-name{font-size:19px;font-weight:800;line-height:1.2;margin-bottom:5px;',
        'background:linear-gradient(130deg,#a78bfa,#6c63ff);',
        '-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',

      '.ft-where{font-size:11px;font-weight:600;color:#8892a4;margin-bottom:16px;',
        'display:flex;align-items:center;gap:5px;}',

      '.ft-divider{height:1px;background:rgba(255,255,255,.07);margin:14px 0;}',

      '.ft-section{margin-bottom:13px;}',
      '.ft-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#6c63ff;margin-bottom:5px;}',
      '.ft-text{font-size:13px;color:#c8d0e0;line-height:1.6;}',

      '.ft-footer{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:20px;}',
      '.ft-progress-label{font-size:11px;font-weight:700;color:#8892a4;letter-spacing:.05em;}',
      '.ft-progress-label strong{color:#6c63ff;}',
      '.ft-dots{display:flex;gap:4px;margin-top:5px;}',
      '.ft-dot{width:6px;height:6px;border-radius:50%;background:rgba(108,99,255,.22);transition:all .3s}',
      '.ft-dot.ft-dot-done{background:rgba(108,99,255,.5);}',
      '.ft-dot.ft-dot-active{width:18px;border-radius:3px;background:#6c63ff;}',

      '.ft-btns{display:flex;gap:8px;align-items:center;flex-shrink:0;}',
      '.ft-btn-close{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);',
        'color:#8892a4;border-radius:9px;padding:8px 14px;font-size:12px;font-weight:600;',
        'cursor:pointer;font-family:"Inter","Manrope",sans-serif;transition:all .2s;}',
      '.ft-btn-close:hover{background:rgba(255,255,255,.12);color:#f0f4ff;}',
      '.ft-btn-next{background:linear-gradient(135deg,#6c63ff,#8b5cf6);border:none;color:#fff;',
        'border-radius:9px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;',
        'font-family:"Inter","Manrope",sans-serif;transition:all .22s;',
        'box-shadow:0 4px 18px rgba(108,99,255,.38);display:flex;align-items:center;gap:5px;}',
      '.ft-btn-next:hover{transform:translateY(-2px);box-shadow:0 7px 22px rgba(108,99,255,.55);}',
      '.ft-btn-next:active{transform:translateY(0);}',

      /* ── Botão flutuante ── */
      '#ft-float-btn{position:fixed;bottom:28px;right:28px;z-index:99989;',
        'background:linear-gradient(135deg,#6c63ff 0%,#8b5cf6 100%);color:#fff;border:none;',
        'border-radius:50px;padding:14px 22px;font-size:14px;font-weight:700;',
        'font-family:"Inter","Manrope",sans-serif;cursor:pointer;',
        'box-shadow:0 6px 28px rgba(108,99,255,.48),0 2px 8px rgba(0,0,0,.22);',
        'display:flex;align-items:center;gap:9px;',
        'transition:all .28s cubic-bezier(.34,1.56,.64,1);letter-spacing:.01em;}',
      '#ft-float-btn:hover{transform:translateY(-4px) scale(1.05);box-shadow:0 14px 38px rgba(108,99,255,.6),0 4px 12px rgba(0,0,0,.28);}',
      '#ft-float-btn:active{transform:translateY(-1px) scale(1.01);}',
      '.ft-pulse{width:8px;height:8px;border-radius:50%;background:#fff;animation:ft-pulse 2s infinite;flex-shrink:0;}',
      '@keyframes ft-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.55;transform:scale(.75)}}',

      /* ── Tela de conclusão ── */
      '#ft-summary{position:fixed;inset:0;z-index:99995;background:rgba(8,12,24,.96);',
        'backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;',
        'padding:20px;animation:ft-fade-in .4s ease;font-family:"Inter","Manrope",sans-serif;}',
      '@keyframes ft-fade-in{from{opacity:0}to{opacity:1}}',

      '.ft-sum-inner{background:#1a1f2e;border:1px solid rgba(108,99,255,.22);border-radius:24px;',
        'padding:36px 40px;max-width:620px;width:100%;max-height:90vh;overflow-y:auto;',
        'box-shadow:0 40px 100px rgba(0,0,0,.65);}',
      '.ft-sum-hd{text-align:center;margin-bottom:30px;}',
      '.ft-sum-emoji{font-size:50px;display:block;margin-bottom:14px;',
        'animation:ft-pop .5s cubic-bezier(.34,1.56,.64,1);}',
      '@keyframes ft-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}',
      '.ft-sum-title{font-size:24px;font-weight:800;color:#f0f4ff;margin-bottom:8px;}',
      '.ft-sum-sub{font-size:14px;color:#8892a4;line-height:1.55;}',
      '.ft-sum-sub strong{color:#a78bfa;}',

      '.ft-sum-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px;}',
      '@media(max-width:480px){.ft-sum-grid{grid-template-columns:1fr;}}',

      '.ft-sum-item{background:rgba(108,99,255,.07);border:1px solid rgba(108,99,255,.16);',
        'border-radius:12px;padding:14px;transition:all .2s;}',
      '.ft-sum-item:hover{background:rgba(108,99,255,.13);border-color:rgba(108,99,255,.32);transform:translateY(-2px);}',
      '.ft-sum-num{font-size:10px;font-weight:800;color:#6c63ff;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;}',
      '.ft-sum-bias{font-size:13px;font-weight:700;color:#f0f4ff;margin-bottom:3px;line-height:1.3;}',
      '.ft-sum-page{font-size:10px;color:#8892a4;font-weight:500;}',

      '.ft-sum-cta{width:100%;padding:15px;background:linear-gradient(135deg,#6c63ff,#8b5cf6);',
        'border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;',
        'font-family:"Inter","Manrope",sans-serif;cursor:pointer;transition:all .25s;',
        'box-shadow:0 6px 24px rgba(108,99,255,.42);}',
      '.ft-sum-cta:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(108,99,255,.58);}'
    ].join('');
    document.head.appendChild(s);
  }

  // ─── Botão flutuante ──────────────────────────────────────────────────────────
  function createFloatButton() {
    if (document.getElementById('ft-float-btn')) {
      floatBtn = document.getElementById('ft-float-btn');
      return;
    }
    floatBtn = document.createElement('button');
    floatBtn.id = 'ft-float-btn';
    floatBtn.setAttribute('aria-label', 'Iniciar apresentação dos vieses cognitivos');
    floatBtn.innerHTML =
      '<span aria-hidden="true">🧠</span>' +
      '<span>Iniciar Apresentação</span>' +
      '<span class="ft-pulse" aria-hidden="true"></span>';
    floatBtn.addEventListener('click', onFloatClick);
    document.body.appendChild(floatBtn);
  }

  function onFloatClick() {
    if (isActive) return;
    startTour();
  }

  // ─── Overlay ──────────────────────────────────────────────────────────────────
  function createOverlay() {
    if (document.getElementById('ft-tour-overlay')) {
      overlayEl = document.getElementById('ft-tour-overlay');
      return;
    }
    overlayEl = document.createElement('div');
    overlayEl.id = 'ft-tour-overlay';
    document.body.appendChild(overlayEl);
  }

  // ─── Spotlight ────────────────────────────────────────────────────────────────
  function ensureSpotlight() {
    if (!spotlightEl) {
      spotlightEl = document.createElement('div');
      spotlightEl.className = 'ft-spotlight';
      document.body.appendChild(spotlightEl);
    }
  }

  function updateSpotlight(el) {
    ensureSpotlight();
    var pad = 10;
    var r = el.getBoundingClientRect();
    spotlightEl.style.left   = (r.left - pad) + 'px';
    spotlightEl.style.top    = (r.top  - pad) + 'px';
    spotlightEl.style.width  = (r.width  + pad * 2) + 'px';
    spotlightEl.style.height = (r.height + pad * 2) + 'px';
    spotlightEl.style.display = 'block';
  }

  function hideSpotlight() {
    if (spotlightEl) spotlightEl.style.display = 'none';
  }

  // ─── Posicionamento do card ───────────────────────────────────────────────────
  function positionCard(cardEl, targetRect) {
    var W   = 364;
    var H   = cardEl.offsetHeight || 450;
    var vw  = window.innerWidth;
    var vh  = window.innerHeight;
    var pad = 14;
    var gap = 16;
    var sp  = 10; // spotlight padding

    // Candidatos: direita, esquerda, abaixo, acima
    var candidates = [
      { left: targetRect.right  + sp + gap,         top: targetRect.top  - sp },
      { left: targetRect.left   - sp - W - gap,     top: targetRect.top  - sp },
      { left: targetRect.left   - sp,               top: targetRect.bottom + sp + gap },
      { left: targetRect.left   - sp,               top: targetRect.top  - sp - H - gap }
    ];

    var chosen = null;
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c.left >= pad && c.left + W <= vw - pad &&
          c.top  >= pad && c.top  + H <= vh - pad) {
        chosen = c;
        break;
      }
    }

    // Fallback: centralizado verticalmente
    if (!chosen) {
      chosen = {
        left: Math.max(pad, (vw - W) / 2),
        top:  Math.max(pad, (vh - H) / 2)
      };
    }

    // Clamp final
    chosen.left = Math.max(pad, Math.min(vw - W - pad, chosen.left));
    chosen.top  = Math.max(pad, Math.min(vh - H - pad, chosen.top));

    cardEl.style.left = chosen.left + 'px';
    cardEl.style.top  = chosen.top  + 'px';
  }

  // ─── Renderizar card ──────────────────────────────────────────────────────────
  function renderCard(step, idx, total) {
    var existing = document.getElementById('ft-tour-card');
    if (existing) existing.remove();

    var isLast = (idx === total - 1);
    var card   = document.createElement('div');
    card.id    = 'ft-tour-card';

    // Dots de progresso
    var dots = '';
    for (var i = 0; i < total; i++) {
      var cls = 'ft-dot';
      if      (i < idx)  cls += ' ft-dot-done';
      else if (i === idx) cls += ' ft-dot-active';
      dots += '<div class="' + cls + '" aria-hidden="true"></div>';
    }

    card.innerHTML =
      '<div class="ft-badge"><span class="ft-badge-dot"></span>Viés Cognitivo</div>' +
      '<div class="ft-bias-name">' + step.bias + '</div>' +
      '<div class="ft-where">' +
        '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="flex-shrink:0" aria-hidden="true">' +
          '<path d="M6 1L1 4v7h4V8h2v3h4V4L6 1z" stroke="#8892a4" stroke-width="1.2" fill="none" stroke-linejoin="round"/>' +
        '</svg>' +
        step.where +
      '</div>' +
      '<div class="ft-divider"></div>' +
      '<div class="ft-section">' +
        '<div class="ft-label">📖 Definição</div>' +
        '<div class="ft-text">' + step.definition + '</div>' +
      '</div>' +
      '<div class="ft-section">' +
        '<div class="ft-label">💡 Por que foi aplicado</div>' +
        '<div class="ft-text">' + step.why + '</div>' +
      '</div>' +
      '<div class="ft-divider"></div>' +
      '<div class="ft-footer">' +
        '<div>' +
          '<div class="ft-progress-label"><strong>' + (idx + 1) + '</strong> / ' + total + '</div>' +
          '<div class="ft-dots" role="tablist" aria-label="Progresso do tour">' + dots + '</div>' +
        '</div>' +
        '<div class="ft-btns">' +
          '<button class="ft-btn-close" id="ft-close-btn">✕ Fechar</button>' +
          '<button class="ft-btn-next" id="ft-next-btn">' +
            (isLast ? 'Concluir ✓' : 'Próximo →') +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(card);

    document.getElementById('ft-close-btn').addEventListener('click', closeTour);
    document.getElementById('ft-next-btn').addEventListener('click', function () {
      if (isLast) {
        finishTour();
      } else {
        advanceStep();
      }
    });

    return card;
  }

  // ─── Lógica principal ─────────────────────────────────────────────────────────

  /** Descobre quais etapas têm elementos presentes na página atual */
  function buildVisibleSteps() {
    visibleSteps = [];
    for (var i = 0; i < STEPS.length; i++) {
      var el = document.querySelector(STEPS[i].selector);
      if (el) {
        visibleSteps.push({ step: STEPS[i], globalIdx: i, element: el });
      }
    }
  }

  /** Determina a URL da página onde a próxima etapa ausente deve ser carregada */
  function pageForGlobalStep(globalIdx) {
    return STEPS[globalIdx] ? STEPS[globalIdx].page : null;
  }

  function startTour() {
    isActive = true;
    sessionStorage.setItem(STORAGE_ACTIVE, '1');

    buildVisibleSteps();

    if (visibleSteps.length === 0) {
      // Página sem etapas — navega para o dashboard (etapa 0)
      sessionStorage.setItem(STORAGE_STEP, '0');
      window.location.href = '/src/dashboard/index.html';
      return;
    }

    // Verifica se há um passo salvo (retorno de navegação cross-page)
    var saved = parseInt(sessionStorage.getItem(STORAGE_STEP) || '0', 10);
    sessionStorage.removeItem(STORAGE_STEP);

    // Encontra o índice visível que corresponde ao passo global salvo
    var startVisible = 0;
    for (var i = 0; i < visibleSteps.length; i++) {
      if (visibleSteps[i].globalIdx >= saved) {
        startVisible = i;
        break;
      }
    }

    visibleIdx = startVisible;
    showStep(visibleIdx);
  }

  function showStep(idx) {
    if (idx >= visibleSteps.length) {
      // Tenta avançar para a próxima página
      navigateToNextPage();
      return;
    }

    visibleIdx = idx;
    var info = visibleSteps[idx];
    var el   = info.element;

    // Scroll suave até o elemento
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Ativa overlay
    overlayEl.classList.add('ft-active');

    // Aguarda o scroll completar antes de posicionar tudo
    setTimeout(function () {
      updateSpotlight(el);
      var card = renderCard(info.step, idx, visibleSteps.length);

      // Aguarda o card ser renderizado para medir altura
      requestAnimationFrame(function () {
        var r = el.getBoundingClientRect();
        positionCard(card, r);
      });
    }, 380);
  }

  function advanceStep() {
    // Anima saída do card atual
    var card = document.getElementById('ft-tour-card');
    if (card) {
      card.style.transition = 'opacity .18s ease, transform .18s ease';
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(-10px) scale(.97)';
      setTimeout(function () {
        showStep(visibleIdx + 1);
      }, 180);
    } else {
      showStep(visibleIdx + 1);
    }
  }

  /**
   * Quando não há mais etapas visíveis, calcula o próximo passo global
   * e navega para a sua página.
   */
  function navigateToNextPage() {
    if (visibleSteps.length === 0) {
      finishTour();
      return;
    }

    var lastGlobal = visibleSteps[visibleSteps.length - 1].globalIdx;
    var nextGlobal = lastGlobal + 1;

    if (nextGlobal >= STEPS.length) {
      finishTour();
      return;
    }

    var targetPage = pageForGlobalStep(nextGlobal);
    if (!targetPage) {
      finishTour();
      return;
    }

    sessionStorage.setItem(STORAGE_STEP, String(nextGlobal));
    cleanup(false); // não apaga STORAGE_ACTIVE para retomar na próxima página
    window.location.href = targetPage;
  }

  function closeTour() {
    isActive = false;
    sessionStorage.removeItem(STORAGE_ACTIVE);
    sessionStorage.removeItem(STORAGE_STEP);
    cleanup(true);
  }

  function finishTour() {
    isActive = false;
    sessionStorage.removeItem(STORAGE_ACTIVE);
    sessionStorage.removeItem(STORAGE_STEP);
    cleanup(true);
    showSummary();
  }

  function cleanup(resetActive) {
    var card = document.getElementById('ft-tour-card');
    if (card) card.remove();
    if (overlayEl) overlayEl.classList.remove('ft-active');
    hideSpotlight();
    if (resetActive) isActive = false;
  }

  // ─── Tela de conclusão ────────────────────────────────────────────────────────
  function showSummary() {
    var existing = document.getElementById('ft-summary');
    if (existing) existing.remove();

    var items = STEPS.map(function (s, i) {
      return (
        '<div class="ft-sum-item">' +
          '<div class="ft-sum-num">Etapa ' + (i + 1) + '</div>' +
          '<div class="ft-sum-bias">' + s.bias + '</div>' +
          '<div class="ft-sum-page">' + s.where + '</div>' +
        '</div>'
      );
    }).join('');

    var summary = document.createElement('div');
    summary.id = 'ft-summary';
    summary.setAttribute('role', 'dialog');
    summary.setAttribute('aria-modal', 'true');
    summary.setAttribute('aria-label', 'Resumo do tour de vieses cognitivos');

    summary.innerHTML =
      '<div class="ft-sum-inner">' +
        '<div class="ft-sum-hd">' +
          '<span class="ft-sum-emoji" aria-hidden="true">🎉</span>' +
          '<div class="ft-sum-title">Apresentação concluída!</div>' +
          '<div class="ft-sum-sub">' +
            'Você explorou <strong>8 vieses cognitivos</strong> aplicados no FinTrack.<br>' +
            'Cada detalhe foi cuidadosamente pensado para uma melhor experiência financeira.' +
          '</div>' +
        '</div>' +
        '<div class="ft-sum-grid">' + items + '</div>' +
        '<button class="ft-sum-cta" id="ft-sum-close">✓ Entendido — Obrigado!</button>' +
      '</div>';

    document.body.appendChild(summary);

    document.getElementById('ft-sum-close').addEventListener('click', function () {
      summary.style.transition = 'opacity .3s';
      summary.style.opacity    = '0';
      setTimeout(function () { summary.remove(); }, 300);
    });

    // Fecha também pelo botão flutuante (reiniciar)
    if (floatBtn) {
      floatBtn.addEventListener('click', function onReinit() {
        var s = document.getElementById('ft-summary');
        if (s) s.remove();
        floatBtn.removeEventListener('click', onReinit);
        floatBtn.addEventListener('click', onFloatClick);
        startTour();
      }, { once: true });
    }
  }

  // ─── Reposicionamento em resize / scroll ──────────────────────────────────────
  function onReposition() {
    if (!isActive || visibleIdx >= visibleSteps.length) return;
    var el = visibleSteps[visibleIdx].element;
    updateSpotlight(el);
    var card = document.getElementById('ft-tour-card');
    if (card) positionCard(card, el.getBoundingClientRect());
  }

  // ─── Inicialização ────────────────────────────────────────────────────────────
  function init() {
    injectStyles();
    createFloatButton();
    createOverlay();

    // Retomar tour após navegação cross-page
    if (sessionStorage.getItem(STORAGE_ACTIVE) === '1') {
      // Pequeno delay para garantir que o DOM esteja pronto
      setTimeout(startTour, 120);
    }

    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
