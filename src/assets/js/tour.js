/**
 * FinTrack — Tour Interativo de Vieses Cognitivos
 * Um único arquivo autocontido. Inclua com <script src="/fintrack/src/assets/js/tour.js"></script>
 * no final do <body> de qualquer página do projeto.
 */
(function () {
  'use strict';

  // ─── Dados das etapas ────────────────────────────────────────────────────────
  var STEPS = [
    {
      selector: '[data-tour="monthly-expenses"]',
      page: '/fintrack/src/dashboard/index.html',
      bias: 'Viés de Aversão à Perda',
      where: 'Dashboard / Card "Despesas Mensais"',
      definition: 'A sensação ruim de perder algo é muito mais intensa do que a alegria de ganhar, o que nos faz tomar decisões focadas em prevenir perdas.',
      why: 'A sensação de prevenir perdas impacta as decisões, então foi incluído um limite de gastos numérico na barra de despesas para ajudar os usuários a evitar perdas financeiras e não ficarem no vermelho.'
    },
    {
      selector: '[data-tour="upgrade-now"]',
      page: '/fintrack/src/dashboard/index.html',
      bias: 'Efeito Grátis',
      where: 'Dashboard / Sidebar — Botão "Upgrade Now"',
      definition: 'Oferecer um item totalmente gratuito pode gerar um impulso de ação ou compra muito maior do que oferecer um grande desconto.',
      why: 'Um item gratuito gera um impulso de ação maior, por isso o botão foi alterado para um teste grátis de modelo "freemium", reduzindo o atrito inicial do usuário.'
    },
    {
      selector: '[data-tour="budgets-banner"]',
      page: '/fintrack/src/budgets/index.html',
      bias: 'Efeito Priming',
      where: 'Budgets / Banner do rodapé',
      definition: 'Nossas escolhas e decisões são diretamente influenciadas por associações que fazemos com estímulos recentes, como imagens, palavras, memórias ou até cheiros.',
      why: 'Como tomamos decisões baseadas em associações visuais e memórias, o banner recebeu imagens de conquistas (casa, viagens) para encorajar atitudes financeiras proativas e positivas.'
    },
    {
      selector: '[data-tour="create-budget"]',
      page: '/fintrack/src/budgets/index.html',
      bias: 'Efeito Ancoragem',
      where: 'Budgets / Botão "+ Criar Novo Orçamento"',
      definition: 'A primeira informação que recebemos sobre um produto ou serviço funciona como uma base (âncora) e passa a definir o nosso julgamento de valor sobre ele.',
      why: 'A primeira informação recebida define o nosso julgamento de valor. Sugerir um valor baseado na média de gastos serve como âncora para facilitar a decisão na hora de criar um orçamento.'
    },
    {
      selector: '[data-tour="top-spending"]',
      page: '/fintrack/src/reports/index.html',
      bias: 'Efeito Posição Serial',
      where: 'Reports / Lista "Top Spending"',
      definition: 'Ao visualizar uma série de informações, a nossa mente lembrará com muito mais facilidade do primeiro e do último item escaneado.',
      why: 'A nossa mente lembra mais do primeiro e do último item. Por isso, a maior despesa fica no início da lista e um dado encorajador de economia é injetado no final.'
    },
    {
      selector: '[data-tour="download-report"]',
      page: '/fintrack/src/reports/index.html',
      bias: 'Viés da Regra do Pico-Fim',
      where: 'Reports / Ação final "Download Report"',
      definition: 'A nossa memória sobre um acontecimento não é exata; ela é um resumo focado nos momentos de emoção mais intensa (picos) e na forma exata como o evento terminou.',
      why: 'Como as memórias de eventos são resumidas aos picos de emoção e ao final, adicionou-se uma mensagem de celebração ao fim da jornada para encerrar a análise financeira de maneira positiva.'
    },
    {
      selector: '[data-tour="link-bank"]',
      page: '/fintrack/src/accounts/index.html',
      bias: 'Viés de Mera Exposição',
      where: 'Accounts / Card "Vincular Novo Banco"',
      definition: 'O nosso cérebro desconfia do que é novo, mas quanto mais somos expostos a algo criando familiaridade, maior se torna a nossa aceitação em relação àquilo.',
      why: 'O cérebro desconfia do novo, mas a familiaridade aumenta a aceitação. Por isso, logos em escala de cinza de bancos já conhecidos foram adicionados para gerar confiança antes da conexão.'
    },
    {
      selector: '[data-tour="pro-offer"]',
      page: '/fintrack/src/dashboard/index.html',
      bias: 'Viés do Desconto Hiperbólico',
      where: 'Dashboard / Sidebar — Oferta Pro',
      definition: 'Preferimos recompensas menores e imediatas em vez de esperar por opções melhores no futuro, pois somos impacientes por natureza.',
      why: 'Como somos impacientes e preferimos recompensas a curto prazo, a estratégia "Use agora, pague depois" foi aplicada para liberar as funções Pro instantaneamente, adiando a dor da cobrança.'
    }
  ];

  // ─── Estado ───────────────────────────────────────────────────────────────────
  var STORAGE_ACTIVE = 'fintrack_tour_active';
  var STORAGE_STEP = 'fintrack_tour_step';

  var isActive = false;
  var visibleSteps = [];   // etapas cujos elementos existem na página atual
  var visibleIdx = 0;    // índice dentro de visibleSteps
  var spotlightEl = null;
  var overlayEl = null;
  var floatBtn = null;

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
    spotlightEl.style.left = (r.left - pad) + 'px';
    spotlightEl.style.top = (r.top - pad) + 'px';
    spotlightEl.style.width = (r.width + pad * 2) + 'px';
    spotlightEl.style.height = (r.height + pad * 2) + 'px';
    spotlightEl.style.display = 'block';
  }

  function hideSpotlight() {
    if (spotlightEl) spotlightEl.style.display = 'none';
  }

  // ─── Posicionamento do card ───────────────────────────────────────────────────
  function positionCard(cardEl, targetRect) {
    var W = 364;
    var H = cardEl.offsetHeight || 450;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var pad = 14;
    var gap = 16;
    var sp = 10; // spotlight padding

    // Candidatos: direita, esquerda, abaixo, acima
    var candidates = [
      { left: targetRect.right + sp + gap, top: targetRect.top - sp },
      { left: targetRect.left - sp - W - gap, top: targetRect.top - sp },
      { left: targetRect.left - sp, top: targetRect.bottom + sp + gap },
      { left: targetRect.left - sp, top: targetRect.top - sp - H - gap }
    ];

    var chosen = null;
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c.left >= pad && c.left + W <= vw - pad &&
        c.top >= pad && c.top + H <= vh - pad) {
        chosen = c;
        break;
      }
    }

    // Fallback: centralizado verticalmente
    if (!chosen) {
      chosen = {
        left: Math.max(pad, (vw - W) / 2),
        top: Math.max(pad, (vh - H) / 2)
      };
    }

    // Clamp final
    chosen.left = Math.max(pad, Math.min(vw - W - pad, chosen.left));
    chosen.top = Math.max(pad, Math.min(vh - H - pad, chosen.top));

    cardEl.style.left = chosen.left + 'px';
    cardEl.style.top = chosen.top + 'px';
  }

  // ─── Renderizar card ──────────────────────────────────────────────────────────
  function renderCard(step, idx, total) {
    var existing = document.getElementById('ft-tour-card');
    if (existing) existing.remove();

    var isLast = (idx === total - 1);
    var card = document.createElement('div');
    card.id = 'ft-tour-card';

    // Dots de progresso
    var dots = '';
    for (var i = 0; i < total; i++) {
      var cls = 'ft-dot';
      if (i < idx) cls += ' ft-dot-done';
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
      window.location.href = '/fintrack/src/dashboard/index.html';
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
    var el = info.element;

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
      card.style.opacity = '0';
      card.style.transform = 'translateY(-10px) scale(.97)';
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
      summary.style.opacity = '0';
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

/* ══════════════════════════════════════════════════════════════════════════════
 *  FinTrack — Tour 2: Growth Design Insights
 *  Segunda trilha completamente independente. Mesmo arquivo, IIFE separado.
 *  Ativada pelo botão verde "💡 Ver Insights".
 * ════════════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  // ─── Dados das etapas (Growth Design) ────────────────────────────────────────
  var GD_STEPS = [
    {
      selector: '[data-insight="first-step-banner"]',
      page: '/fintrack/src/dashboard/index.html',
      technique: 'MC + SE',
      techniqueLabel: 'Micro-commitment + Singularity Effect',
      title: 'Captura de intenção no primeiro acesso',
      where: 'Dashboard / Banner "Primeiro Passo Inteligente"',
      what: 'Banner inserido entre o header e os cards de métricas, com uma única pergunta e 3 chips selecionáveis. Um clique navega para a área mais relevante e o banner some.',
      why: 'Quando o usuário abre o app pela primeira vez, ele não sabe por onde começar — e um dashboard cheio de números não ajuda. O Singularity Effect resolve isso reduzindo tudo a uma única pergunta: em vez de explorar sozinho, o usuário só precisa responder uma coisa. Sem comparação, sem hesitação. Mas a pergunta sozinha não basta. É o clique que ativa o Micro-commitment: ao escolher um chip, o usuário não está só navegando — ele está declarando em voz alta para si mesmo o que quer do produto. E pessoas tendem a agir de forma consistente com escolhas que já fizeram conscientemente. O resultado é que o produto deixa de ser genérico e passa a ter um propósito definido pelo próprio usuário — o que aumenta em até 40% a chance de ele ainda estar usando o app 7 dias depois.'
    },
    {
      selector: '[data-insight="pro-card-dashboard"]',
      page: '/fintrack/src/dashboard/index.html',
      technique: 'SE',
      techniqueLabel: 'Singularity Effect',
      title: 'Mensagem única e contextual',
      where: 'Dashboard / Card "Plano Pro" na Sidebar',
      what: 'O texto genérico foi substituído por uma promessa singular: "Veja exatamente para onde vai cada real do seu dinheiro. Usuários PRO poupam $300/mês."',
      why: 'Uma promessa singular e específica tem 2× mais chance de ser processada e lembrada do que duas mensagens genéricas competindo pela mesma atenção cognitiva.'
    },
    {
      selector: '[data-insight="save-190-btn"]',
      page: '/fintrack/src/transactions/index.html',
      technique: 'MC',
      techniqueLabel: 'Micro-commitment',
      title: 'Ação no pico do momentum positivo',
      where: 'Transações / Botão "Guardar $190 →" no banner',
      what: 'Botão verde pill inserido dentro do banner de Framing Effect, após o dado de $190 excedentes. Um clique gera um toast: "$190 reservados para sua Reserva de Emergência."',
      why: 'O insight informa que há saldo sobrando. O micro-commitment de um clique é feito no exato pico do momentum positivo gerado pelo dado — sem ele, o insight evapora sem gerar ação.'
    },
    {
      selector: '[data-insight="streak-banner"]',
      page: '/fintrack/src/budgets/index.html',
      technique: 'MC',
      techniqueLabel: 'Micro-commitment',
      title: 'Streak como comprometimento implícito',
      where: 'Orçamentos / Faixa de Streak de Consistência',
      what: 'Faixa âmbar: "3ª semana consecutiva dentro do orçamento de Alimentação — Continue assim para fechar o mês no verde." Com botão dismissível "Ver →".',
      why: 'Streaks criam comprometimento implícito com a continuidade (efeito Zeigarnik). O custo percebido é "não perder o que já conquistei" — mais poderoso do que qualquer CTA genérico.'
    },
    {
      selector: '[data-insight="trend-kpi-badge"]',
      page: '/fintrack/src/categories/index.html',
      technique: 'SE',
      techniqueLabel: 'Singularity Effect',
      title: 'Um único KPI elevado elimina a paralisia',
      where: 'Categorias / Badge pulsante no card TENDÊNCIA',
      what: 'O card de TENDÊNCIA recebeu borda pulsante verde, badge "🔍 Foco do mês" e destaque visual. Os outros 3 KPIs permanecem neutros.',
      why: 'Quatro números iguais em tamanho e cor criam paralisia de análise. Um único KPI elevado com design diferenciado direciona o olhar — o usuário sai com um dado claro, não com ruído.'
    },
    {
      selector: '[data-insight="next-best-action"]',
      page: '/fintrack/src/reports/index.html',
      technique: 'SE',
      techniqueLabel: 'Singularity Effect',
      title: 'Fechar o loop cognitivo com uma única ação',
      where: 'Relatórios / Card "Próxima Melhor Ação"',
      what: 'Card ao final da página com uma única ação sugerida: "Você gasta 2× mais em Entretenimento. Ajustar seu limite pode liberar até $200/mês." + botão "Ver meu plano →".',
      why: 'O relatório expõe múltiplos problemas. Encerrar com UMA próxima melhor ação fecha o loop cognitivo — usuários que terminam com uma direção clara retornam com muito mais frequência.'
    }
  ];

  // ─── Estado (completamente isolado do Tour 1) ─────────────────────────────────
  var GD_STORAGE_ACTIVE = 'fintrack_gd_tour_active';
  var GD_STORAGE_STEP = 'fintrack_gd_tour_step';

  var gdIsActive = false;
  var gdVisibleSteps = [];
  var gdVisibleIdx = 0;
  var gdSpotlightEl = null;
  var gdOverlayEl = null;
  var gdFloatBtn = null;

  // ─── Injetar estilos adicionais (somente os exclusivos do Tour 2) ─────────────
  function gdInjectStyles() {
    if (document.getElementById('ft-gd-styles')) return;
    var s = document.createElement('style');
    s.id = 'ft-gd-styles';
    s.textContent = [
      /* ── Botão flutuante verde ── */
      '#ft-gd-float-btn{position:fixed;bottom:92px;right:28px;z-index:99989;',
      'background:linear-gradient(135deg,#059669 0%,#10b981 100%);color:#fff;border:none;',
      'border-radius:50px;padding:14px 22px;font-size:14px;font-weight:700;',
      'font-family:"Inter","Manrope",sans-serif;cursor:pointer;',
      'box-shadow:0 6px 28px rgba(16,185,129,.45),0 2px 8px rgba(0,0,0,.2);',
      'display:flex;align-items:center;gap:9px;',
      'transition:all .28s cubic-bezier(.34,1.56,.64,1);letter-spacing:.01em;}',
      '#ft-gd-float-btn:hover{transform:translateY(-4px) scale(1.05);box-shadow:0 14px 38px rgba(16,185,129,.58),0 4px 12px rgba(0,0,0,.26);}',
      '#ft-gd-float-btn:active{transform:translateY(-1px) scale(1.01);}',
      '.ft-gd-pulse{width:8px;height:8px;border-radius:50%;background:#fff;animation:ft-gd-pulse 2.2s infinite;flex-shrink:0;}',
      '@keyframes ft-gd-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.72)}}',

      /* ── Overlay (reutiliza o mesmo do tour 1 — mesmo ID, compartilhado) ── */

      /* ── Spotlight verde ── */
      '.ft-gd-spotlight{',
      'position:fixed;border-radius:12px;',
      'box-shadow:0 0 0 9999px rgba(0,0,0,.68);',
      'z-index:99991;pointer-events:none;',
      'transition:left .38s cubic-bezier(.4,0,.2,1),top .38s cubic-bezier(.4,0,.2,1),',
      'width .38s cubic-bezier(.4,0,.2,1),height .38s cubic-bezier(.4,0,.2,1);',
      'border:2px solid rgba(16,185,129,.6);}',

      /* ── Card do Tour 2 ── */
      '#ft-gd-card{',
      'position:fixed;z-index:99992;width:374px;',
      'background:#0d1a14;',
      'border:1px solid rgba(16,185,129,.3);border-radius:18px;padding:26px;',
      'box-shadow:0 28px 70px rgba(0,0,0,.6),0 0 0 1px rgba(16,185,129,.1);',
      'font-family:"Inter","Manrope",sans-serif;color:#ecfdf5;',
      'animation:ft-gd-card-in .35s cubic-bezier(.34,1.56,.64,1);}',
      '@keyframes ft-gd-card-in{from{opacity:0;transform:translateY(14px) scale(.95)}to{opacity:1;transform:translateY(0) scale(1)}}',

      /* ── Badge de técnica ── */
      '.ft-gd-tech-badge{display:inline-flex;align-items:center;gap:6px;margin-bottom:8px;}',
      '.ft-gd-tech-pill{display:inline-flex;align-items:center;gap:4px;font-size:9px;font-weight:800;',
      'letter-spacing:.1em;text-transform:uppercase;color:#065f46;',
      'background:linear-gradient(135deg,#d1fae5,#a7f3d0);border:1px solid #6ee7b7;',
      'border-radius:999px;padding:3px 9px;}',
      '.ft-gd-tech-sub{font-size:10px;font-weight:600;color:#6ee7b7;letter-spacing:.04em;}',

      /* ── Título ── */
      '.ft-gd-title{font-size:18px;font-weight:800;line-height:1.25;margin-bottom:5px;',
      'background:linear-gradient(130deg,#6ee7b7,#10b981);',
      '-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}',

      /* ── Where ── */
      '.ft-gd-where{font-size:11px;font-weight:600;color:#6ee7b7;opacity:.75;margin-bottom:16px;',
      'display:flex;align-items:center;gap:5px;}',

      /* ── Divider ── */
      '.ft-gd-divider{height:1px;background:rgba(255,255,255,.07);margin:14px 0;}',

      /* ── Seções ── */
      '.ft-gd-section{margin-bottom:13px;}',
      '.ft-gd-label{font-size:10px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#10b981;margin-bottom:5px;}',
      '.ft-gd-text{font-size:13px;color:#a7f3d0;line-height:1.6;}',

      /* ── Footer ── */
      '.ft-gd-footer{display:flex;align-items:flex-end;justify-content:space-between;gap:10px;margin-top:20px;}',
      '.ft-gd-progress-label{font-size:11px;font-weight:700;color:#6ee7b7;opacity:.75;letter-spacing:.05em;}',
      '.ft-gd-progress-label strong{color:#10b981;opacity:1;}',
      '.ft-gd-dots{display:flex;gap:4px;margin-top:5px;}',
      '.ft-gd-dot{width:6px;height:6px;border-radius:50%;background:rgba(16,185,129,.2);transition:all .3s}',
      '.ft-gd-dot.ft-gd-done{background:rgba(16,185,129,.5);}',
      '.ft-gd-dot.ft-gd-active{width:18px;border-radius:3px;background:#10b981;}',

      /* ── Botões ── */
      '.ft-gd-btns{display:flex;gap:8px;align-items:center;flex-shrink:0;}',
      '.ft-gd-btn-close{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);',
      'color:#6ee7b7;border-radius:9px;padding:8px 14px;font-size:12px;font-weight:600;',
      'cursor:pointer;font-family:"Inter","Manrope",sans-serif;transition:all .2s;}',
      '.ft-gd-btn-close:hover{background:rgba(255,255,255,.12);color:#ecfdf5;}',
      '.ft-gd-btn-next{background:linear-gradient(135deg,#059669,#10b981);border:none;color:#fff;',
      'border-radius:9px;padding:9px 20px;font-size:13px;font-weight:700;cursor:pointer;',
      'font-family:"Inter","Manrope",sans-serif;transition:all .22s;',
      'box-shadow:0 4px 18px rgba(16,185,129,.38);display:flex;align-items:center;gap:5px;}',
      '.ft-gd-btn-next:hover{transform:translateY(-2px);box-shadow:0 7px 22px rgba(16,185,129,.55);}',
      '.ft-gd-btn-next:active{transform:translateY(0);}',

      /* ── Tela de conclusão do Tour 2 ── */
      '#ft-gd-summary{position:fixed;inset:0;z-index:99995;background:rgba(2,10,6,.97);',
      'backdrop-filter:blur(20px);display:flex;align-items:center;justify-content:center;',
      'padding:20px;animation:ft-gd-fade-in .4s ease;font-family:"Inter","Manrope",sans-serif;}',
      '@keyframes ft-gd-fade-in{from{opacity:0}to{opacity:1}}',

      '.ft-gd-sum-inner{background:#0d1a14;border:1px solid rgba(16,185,129,.22);border-radius:24px;',
      'padding:36px 40px;max-width:620px;width:100%;max-height:90vh;overflow-y:auto;',
      'box-shadow:0 40px 100px rgba(0,0,0,.7);}',
      '.ft-gd-sum-hd{text-align:center;margin-bottom:30px;}',
      '.ft-gd-sum-emoji{font-size:50px;display:block;margin-bottom:14px;',
      'animation:ft-gd-pop .5s cubic-bezier(.34,1.56,.64,1);}',
      '@keyframes ft-gd-pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}',
      '.ft-gd-sum-title{font-size:22px;font-weight:800;color:#ecfdf5;margin-bottom:8px;line-height:1.25;}',
      '.ft-gd-sum-sub{font-size:14px;color:#6ee7b7;line-height:1.55;opacity:.85;}',
      '.ft-gd-sum-sub strong{color:#10b981;opacity:1;}',

      '.ft-gd-sum-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:28px;}',
      '@media(max-width:480px){.ft-gd-sum-grid{grid-template-columns:1fr;}}',

      '.ft-gd-sum-item{background:rgba(16,185,129,.07);border:1px solid rgba(16,185,129,.18);',
      'border-radius:12px;padding:14px;transition:all .2s;}',
      '.ft-gd-sum-item:hover{background:rgba(16,185,129,.13);border-color:rgba(16,185,129,.35);transform:translateY(-2px);}',
      '.ft-gd-sum-num{font-size:10px;font-weight:800;color:#10b981;text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px;}',
      '.ft-gd-sum-tech{display:inline-block;font-size:9px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;',
      'color:#065f46;background:#d1fae5;border:1px solid #6ee7b7;border-radius:999px;',
      'padding:1px 7px;margin-bottom:4px;}',
      '.ft-gd-sum-title-item{font-size:12px;font-weight:700;color:#ecfdf5;margin-bottom:2px;line-height:1.3;}',
      '.ft-gd-sum-page{font-size:10px;color:#6ee7b7;font-weight:500;opacity:.7;}',

      '.ft-gd-sum-cta{width:100%;padding:15px;background:linear-gradient(135deg,#059669,#10b981);',
      'border:none;border-radius:12px;color:#fff;font-size:15px;font-weight:700;',
      'font-family:"Inter","Manrope",sans-serif;cursor:pointer;transition:all .25s;',
      'box-shadow:0 6px 24px rgba(16,185,129,.42);}',
      '.ft-gd-sum-cta:hover{transform:translateY(-2px);box-shadow:0 10px 32px rgba(16,185,129,.58);}'
    ].join('');
    document.head.appendChild(s);
  }

  // ─── Botão flutuante verde ────────────────────────────────────────────────────
  function gdCreateFloatButton() {
    if (document.getElementById('ft-gd-float-btn')) {
      gdFloatBtn = document.getElementById('ft-gd-float-btn');
      return;
    }
    gdFloatBtn = document.createElement('button');
    gdFloatBtn.id = 'ft-gd-float-btn';
    gdFloatBtn.setAttribute('aria-label', 'Ver insights de Growth Design');
    gdFloatBtn.innerHTML =
      '<span aria-hidden="true">💡</span>' +
      '<span>Ver Insights</span>' +
      '<span class="ft-gd-pulse" aria-hidden="true"></span>';
    gdFloatBtn.addEventListener('click', gdOnFloatClick);
    document.body.appendChild(gdFloatBtn);
  }

  function gdOnFloatClick() {
    if (gdIsActive) return;
    gdStartTour();
  }

  // ─── Overlay compartilhado (mesmo elemento do Tour 1) ────────────────────────
  function gdGetOverlay() {
    gdOverlayEl = document.getElementById('ft-tour-overlay');
    if (!gdOverlayEl) {
      gdOverlayEl = document.createElement('div');
      gdOverlayEl.id = 'ft-tour-overlay';
      document.body.appendChild(gdOverlayEl);
    }
  }

  // ─── Spotlight verde ──────────────────────────────────────────────────────────
  function gdEnsureSpotlight() {
    if (!gdSpotlightEl) {
      gdSpotlightEl = document.createElement('div');
      gdSpotlightEl.className = 'ft-gd-spotlight';
      document.body.appendChild(gdSpotlightEl);
    }
  }

  function gdUpdateSpotlight(el) {
    gdEnsureSpotlight();
    var pad = 10;
    var r = el.getBoundingClientRect();
    gdSpotlightEl.style.left = (r.left - pad) + 'px';
    gdSpotlightEl.style.top = (r.top - pad) + 'px';
    gdSpotlightEl.style.width = (r.width + pad * 2) + 'px';
    gdSpotlightEl.style.height = (r.height + pad * 2) + 'px';
    gdSpotlightEl.style.display = 'block';
  }

  function gdHideSpotlight() {
    if (gdSpotlightEl) gdSpotlightEl.style.display = 'none';
  }

  // ─── Posicionamento do card (mesma lógica do Tour 1) ─────────────────────────
  function gdPositionCard(cardEl, targetRect) {
    var W = 374;
    var H = cardEl.offsetHeight || 460;
    var vw = window.innerWidth;
    var vh = window.innerHeight;
    var pad = 14;
    var gap = 16;
    var sp = 10;

    var candidates = [
      { left: targetRect.right + sp + gap, top: targetRect.top - sp },
      { left: targetRect.left - sp - W - gap, top: targetRect.top - sp },
      { left: targetRect.left - sp, top: targetRect.bottom + sp + gap },
      { left: targetRect.left - sp, top: targetRect.top - sp - H - gap }
    ];

    var chosen = null;
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c.left >= pad && c.left + W <= vw - pad &&
        c.top >= pad && c.top + H <= vh - pad) {
        chosen = c;
        break;
      }
    }

    if (!chosen) {
      chosen = { left: Math.max(pad, (vw - W) / 2), top: Math.max(pad, (vh - H) / 2) };
    }

    chosen.left = Math.max(pad, Math.min(vw - W - pad, chosen.left));
    chosen.top = Math.max(pad, Math.min(vh - H - pad, chosen.top));

    cardEl.style.left = chosen.left + 'px';
    cardEl.style.top = chosen.top + 'px';
  }

  // ─── Renderizar card do Tour 2 ────────────────────────────────────────────────
  function gdRenderCard(step, idx, total) {
    var existing = document.getElementById('ft-gd-card');
    if (existing) existing.remove();

    var isLast = (idx === total - 1);
    var card = document.createElement('div');
    card.id = 'ft-gd-card';

    var dots = '';
    for (var i = 0; i < total; i++) {
      var cls = 'ft-gd-dot';
      if (i < idx) cls += ' ft-gd-done';
      else if (i === idx) cls += ' ft-gd-active';
      dots += '<div class="' + cls + '" aria-hidden="true"></div>';
    }

    card.innerHTML =
      '<div class="ft-gd-tech-badge">' +
      '<span class="ft-gd-tech-pill">' + step.technique + '</span>' +
      '<span class="ft-gd-tech-sub">' + step.techniqueLabel + '</span>' +
      '</div>' +
      '<div class="ft-gd-title">' + step.title + '</div>' +
      '<div class="ft-gd-where">' +
      '<svg width="12" height="12" viewBox="0 0 12 12" fill="none" style="flex-shrink:0" aria-hidden="true">' +
      '<path d="M6 1L1 4v7h4V8h2v3h4V4L6 1z" stroke="#6ee7b7" stroke-width="1.2" fill="none" stroke-linejoin="round"/>' +
      '</svg>' +
      step.where +
      '</div>' +
      '<div class="ft-gd-divider"></div>' +
      '<div class="ft-gd-section">' +
      '<div class="ft-gd-label">🔧 O que foi feito</div>' +
      '<div class="ft-gd-text">' + step.what + '</div>' +
      '</div>' +
      '<div class="ft-gd-section">' +
      '<div class="ft-gd-label">📈 Por que funciona</div>' +
      '<div class="ft-gd-text">' + step.why + '</div>' +
      '</div>' +
      '<div class="ft-gd-divider"></div>' +
      '<div class="ft-gd-footer">' +
      '<div>' +
      '<div class="ft-gd-progress-label"><strong>' + (idx + 1) + '</strong> / ' + total + '</div>' +
      '<div class="ft-gd-dots" role="tablist" aria-label="Progresso dos insights">' + dots + '</div>' +
      '</div>' +
      '<div class="ft-gd-btns">' +
      '<button class="ft-gd-btn-close" id="ft-gd-close-btn">✕ Fechar</button>' +
      '<button class="ft-gd-btn-next" id="ft-gd-next-btn">' +
      (isLast ? 'Concluir ✓' : 'Próximo →') +
      '</button>' +
      '</div>' +
      '</div>';

    document.body.appendChild(card);

    document.getElementById('ft-gd-close-btn').addEventListener('click', gdCloseTour);
    document.getElementById('ft-gd-next-btn').addEventListener('click', function () {
      isLast ? gdFinishTour() : gdAdvanceStep();
    });

    return card;
  }

  // ─── Lógica do Tour 2 ─────────────────────────────────────────────────────────
  function gdBuildVisibleSteps() {
    gdVisibleSteps = [];
    for (var i = 0; i < GD_STEPS.length; i++) {
      var el = document.querySelector(GD_STEPS[i].selector);
      if (el) {
        gdVisibleSteps.push({ step: GD_STEPS[i], globalIdx: i, element: el });
      }
    }
  }

  function gdPageForGlobalStep(globalIdx) {
    return GD_STEPS[globalIdx] ? GD_STEPS[globalIdx].page : null;
  }

  function gdStartTour() {
    gdIsActive = true;
    sessionStorage.setItem(GD_STORAGE_ACTIVE, '1');
    gdBuildVisibleSteps();

    if (gdVisibleSteps.length === 0) {
      sessionStorage.setItem(GD_STORAGE_STEP, '0');
      window.location.href = '/fintrack/src/dashboard/index.html';
      return;
    }

    var saved = parseInt(sessionStorage.getItem(GD_STORAGE_STEP) || '0', 10);
    sessionStorage.removeItem(GD_STORAGE_STEP);

    var startVisible = 0;
    for (var i = 0; i < gdVisibleSteps.length; i++) {
      if (gdVisibleSteps[i].globalIdx >= saved) {
        startVisible = i;
        break;
      }
    }

    gdVisibleIdx = startVisible;
    gdShowStep(gdVisibleIdx);
  }

  function gdShowStep(idx) {
    if (idx >= gdVisibleSteps.length) {
      gdNavigateToNextPage();
      return;
    }

    gdVisibleIdx = idx;
    var info = gdVisibleSteps[idx];
    var el = info.element;

    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    gdOverlayEl.classList.add('ft-active');

    setTimeout(function () {
      gdUpdateSpotlight(el);
      var card = gdRenderCard(info.step, idx, gdVisibleSteps.length);
      requestAnimationFrame(function () {
        gdPositionCard(card, el.getBoundingClientRect());
      });
    }, 380);
  }

  function gdAdvanceStep() {
    var card = document.getElementById('ft-gd-card');
    if (card) {
      card.style.transition = 'opacity .18s ease, transform .18s ease';
      card.style.opacity = '0';
      card.style.transform = 'translateY(-10px) scale(.97)';
      setTimeout(function () { gdShowStep(gdVisibleIdx + 1); }, 180);
    } else {
      gdShowStep(gdVisibleIdx + 1);
    }
  }

  function gdNavigateToNextPage() {
    if (gdVisibleSteps.length === 0) { gdFinishTour(); return; }

    var lastGlobal = gdVisibleSteps[gdVisibleSteps.length - 1].globalIdx;
    var nextGlobal = lastGlobal + 1;

    if (nextGlobal >= GD_STEPS.length) { gdFinishTour(); return; }

    var targetPage = gdPageForGlobalStep(nextGlobal);
    if (!targetPage) { gdFinishTour(); return; }

    sessionStorage.setItem(GD_STORAGE_STEP, String(nextGlobal));
    gdCleanup(false);
    window.location.href = targetPage;
  }

  function gdCloseTour() {
    gdIsActive = false;
    sessionStorage.removeItem(GD_STORAGE_ACTIVE);
    sessionStorage.removeItem(GD_STORAGE_STEP);
    gdCleanup(true);
  }

  function gdFinishTour() {
    gdIsActive = false;
    sessionStorage.removeItem(GD_STORAGE_ACTIVE);
    sessionStorage.removeItem(GD_STORAGE_STEP);
    gdCleanup(true);
    gdShowSummary();
  }

  function gdCleanup(resetActive) {
    var card = document.getElementById('ft-gd-card');
    if (card) card.remove();
    if (gdOverlayEl) gdOverlayEl.classList.remove('ft-active');
    gdHideSpotlight();
    if (resetActive) gdIsActive = false;
  }

  // ─── Tela de conclusão do Tour 2 ─────────────────────────────────────────────
  function gdShowSummary() {
    var existing = document.getElementById('ft-gd-summary');
    if (existing) existing.remove();

    var items = GD_STEPS.map(function (s, i) {
      return (
        '<div class="ft-gd-sum-item">' +
        '<div class="ft-gd-sum-num">Case ' + (i + 1) + '</div>' +
        '<span class="ft-gd-sum-tech">' + s.technique + '</span>' +
        '<div class="ft-gd-sum-title-item">' + s.title + '</div>' +
        '<div class="ft-gd-sum-page">' + s.where + '</div>' +
        '</div>'
      );
    }).join('');

    var summary = document.createElement('div');
    summary.id = 'ft-gd-summary';
    summary.setAttribute('role', 'dialog');
    summary.setAttribute('aria-modal', 'true');
    summary.setAttribute('aria-label', 'Resumo dos Insights de Growth Design');

    summary.innerHTML =
      '<div class="ft-gd-sum-inner">' +
      '<div class="ft-gd-sum-hd">' +
      '<span class="ft-gd-sum-emoji" aria-hidden="true">🌱</span>' +
      '<div class="ft-gd-sum-title">Growth Design aplicado neste produto</div>' +
      '<div class="ft-gd-sum-sub">' +
      'Você explorou <strong>6 decisões de Growth Design</strong> implementadas no FinTrack.<br>' +
      'Cada escolha foi guiada por dados de comportamento e psicologia do usuário.' +
      '</div>' +
      '</div>' +
      '<div class="ft-gd-sum-grid">' + items + '</div>' +
      '<button class="ft-gd-sum-cta" id="ft-gd-sum-close">✓ Entendido — Obrigado!</button>' +
      '</div>';

    document.body.appendChild(summary);

    document.getElementById('ft-gd-sum-close').addEventListener('click', function () {
      summary.style.transition = 'opacity .3s';
      summary.style.opacity = '0';
      setTimeout(function () { summary.remove(); }, 300);
    });

    if (gdFloatBtn) {
      gdFloatBtn.addEventListener('click', function onGdReinit() {
        var s = document.getElementById('ft-gd-summary');
        if (s) s.remove();
        gdFloatBtn.removeEventListener('click', onGdReinit);
        gdFloatBtn.addEventListener('click', gdOnFloatClick);
        gdStartTour();
      }, { once: true });
    }
  }

  // ─── Reposicionamento em resize / scroll ──────────────────────────────────────
  function gdOnReposition() {
    if (!gdIsActive || gdVisibleIdx >= gdVisibleSteps.length) return;
    var el = gdVisibleSteps[gdVisibleIdx].element;
    gdUpdateSpotlight(el);
    var card = document.getElementById('ft-gd-card');
    if (card) gdPositionCard(card, el.getBoundingClientRect());
  }

  // ─── Inicialização ────────────────────────────────────────────────────────────
  function gdInit() {
    gdInjectStyles();
    gdGetOverlay();
    gdCreateFloatButton();

    if (sessionStorage.getItem(GD_STORAGE_ACTIVE) === '1') {
      setTimeout(gdStartTour, 150);
    }

    window.addEventListener('resize', gdOnReposition);
    window.addEventListener('scroll', gdOnReposition, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', gdInit);
  } else {
    gdInit();
  }
})();
