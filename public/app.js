const translations = {
  en: {
    homeLabel:'Kube Resilience Lab home',
    skip:'Skip to dashboard',workspace:'WORKSPACE',overview:'Overview',experiments:'Experiments',evidence:'Evidence',fieldGuide:'Field guide',bounded:'Bounded by design',boundedHint:'One demo service. Automatic fault expiry. No cluster-wide access.',authorRole:'DEVOPS ENGINEER',engineering:'ENGINEERING',heroEyebrow:'OBSERVE. DISRUPT. UNDERSTAND.',heroTitle:'Resilience, made visible.',heroDescription:'Introduce a failure. Watch the response. Keep the evidence.',connecting:'Connecting',awaitingService:'Awaiting service telemetry',waiting:'Waiting for data',availability:'HTTP success rate',availabilityHint:'Requests returning HTTP 2xx',latency:'p95 response time',goodRequests:'Good requests',goodHint:'Successful and within threshold',budget:'Window error budget',budgetHint:'Remaining · 99% good-request objective',liveTelemetry:'LIVE TELEMETRY',responseTimeline:'Every request tells a story.',responseTime:'Response time',failedRequest:'Failed request',chartEmpty:'Your first observation is on its way.',chartEmptyHint:'The controller samples the demo service every second.',windowHint:'Rolling window · up to 180 observations',controlledExperiments:'CONTROLLED EXPERIMENTS',experimentsTitle:'Find the weak point. Safely.',experimentsIntro:'A short baseline, a bounded disruption, then a measured recovery.',latencyTitle:'Slow response',latencyDescription:'Add 650 ms of latency to expose slow requests and budget consumption.',latencyTag:'LATENCY INJECTION',errorsTitle:'Intermittent errors',errorsDescription:'Return HTTP 503 on alternating requests and observe availability.',errorsTag:'HTTP FAILURE',readinessTitle:'Readiness loss',readinessDescription:'Fail the readiness probe. In Kubernetes, watch service traffic lose its endpoint.',readinessTag:'TRAFFIC ROUTING',livenessTitle:'Liveness failure',livenessDescription:'Fail the liveness probe and observe recovery after Kubernetes restarts the container.',livenessTag:'KUBERNETES ONLY',modeAwaiting:'Connecting to determine the available experiment capabilities.',experimentControl:'EXPERIMENT CONTROL',duration:'Disruption duration',controlKey:'Control key',required:'Required to run',keyHint:'From your local launcher or setup script. Kept in memory for this page only.',runExperiment:'Run experiment',stopExperiment:'Stop and reset',autoReset:'Faults expire automatically. Maximum 60 seconds.',experimentJourney:'EXPERIMENT JOURNEY',baseline:'Baseline',disruption:'Disruption',recovery:'Recovery',baselineHint:'Observe normal behavior',disruptionHint:'Introduce the fault',recoveryHint:'Measure the response',evidenceHint:'Export what happened',downloadReport:'Download JSON report ↗',observations:'OBSERVATIONS, NOT ASSUMPTIONS',evidenceTitle:'The proof is in the data.',evidenceIntro:'Real samples, phase summaries and timestamps. Evidence you can inspect and share.',recentExperiments:'Recent experiments',noReports:'No experiments yet',noReportsHint:'Run your first scenario to create a downloadable evidence report.',reportRetention:'Latest 20 reports · held in memory until the controller restarts',eventStream:'Event stream',live:'LIVE',noEvents:'Waiting for controller events.',fieldGuideUpper:'FIELD GUIDE',guideTitle:'A failure is a learning opportunity.',guideIntro:'Understand what this lab measures, what Kubernetes changes, and where the limits are.',builtToUnderstand:'BUILT TO UNDERSTAND, NOT JUST TO BREAK.',guideQ1:'What makes a request “good”?',guideA1:'A good request returns HTTP 2xx within 300 ms. The lab aims for 99% good requests in the current rolling window. Error budget is the remaining allowance for bad requests in that window. This is a learning signal, not a production SLA or a long-term SLO assessment.',guideQ2:'What changes when I use Kubernetes?',guideA2:'Local mode demonstrates latency and HTTP failures. A readiness fault changes the health endpoint locally, but only Kubernetes uses it to remove the pod from service traffic. Liveness experiments are available only in Kubernetes, where the kubelet can restart the container. The lab observes HTTP behavior; it does not claim to measure pod restart counts.',guideQ3:'What does an evidence report include?',guideA3:'Each JSON report contains the environment, scenario, timestamps, actual request samples, event history and separate baseline, impact and recovery summaries. Recovery time is an observation within a bounded recovery phase; a missing value does not prove recovery happened. Export reports before restarting the controller.',guideQ4:'How are experiments contained?',guideA4:'The controller targets one configured demo service. Write actions require a control key, and the target automatically expires injected faults after at most 60 seconds. There is no arbitrary URL input, shell execution, Kubernetes API access or cluster-wide disruption. Use a dedicated local lab environment.',footerCredit:'Designed & built by Ahmed Fakhfakh',footerNote:'REAL REQUESTS. HONEST EVIDENCE.',local:'LOCAL LAB',kubernetes:'KUBERNETES',connected:'Telemetry connected',disconnected:'Connection lost',updated:'Updated',healthy:'HTTP reachable',unhealthy:'HTTP unreachable',instance:'INSTANCE',uptime:'UPTIME',threshold:'{ms} ms good-request threshold',budgetCaption:'Remaining · {target}% good-request objective',requests:'{count} requests',seconds:'{value} seconds',keyPlaceholder:'Paste your LAB_TOKEN',modeLocal:'Local mode: latency and HTTP faults are observable. Readiness only changes the health endpoint; Kubernetes routing and container restarts require a cluster.',modeKubernetes:'Kubernetes mode: readiness affects service endpoints; liveness can trigger a container restart. Results reflect HTTP observations from this controller.',connectionError:'The controller is unreachable. Displayed observations may be stale. Reconnecting automatically.',actionRunning:'Experiment requested. The baseline is being observed.',actionStopped:'Experiment cancelled. Check the event stream for the target reset result.',actionFailed:'The action could not be completed.',missingKey:'Paste the control key from your setup script first.',busy:'Sending request…',complete:'Complete',cancelled:'Cancelled',failed:'Failed',fault:'Disruption',phaseCountdown:'{seconds}s remaining in this phase',phaseFinishing:'Waiting for the controller to finish this phase…',recovered:'Observed recovery: {seconds}s',noRecovery:'Recovery was not confirmed in the observation window.',cancelledNote:'Cancelled. Review the report for reset and recovery observations.',failedNote:'Experiment failed. Inspect events and the report for details.',reportDownloadLabel:'Download {scenario} report from {date}',recoveryShort:'recovery {seconds}s',recoveryUnconfirmed:'recovery unconfirmed',chartTitle:'Response time over the rolling sample window',chartDescription:'{count} actual samples. Response times range from {min} to {max} milliseconds. {failures} failed requests.',chartWaiting:'Waiting for real request samples.',thresholdChart:'GOOD REQUEST ≤ {ms} MS',phaseAnnouncement:'{scenario}: {phase}',requestStartError:'Unable to start the experiment',stopError:'Unable to stop the experiment',languageLabel:'Language',navLabel:'Main navigation',scenarioLabel:'Failure scenarios',reportJson:'JSON ↓',sourceMessage:'Controller event',faultClear:'Fault cleared',experimentStart:'Experiment started',experimentComplete:'Experiment complete',sampleError:'Observation error'
  },
  fr: {
    homeLabel:'Accueil Kube Resilience Lab',
    skip:'Aller au tableau de bord',workspace:'ESPACE DE TRAVAIL',overview:'Vue d’ensemble',experiments:'Expériences',evidence:'Rapports',fieldGuide:'Guide pratique',bounded:'Un périmètre maîtrisé',boundedHint:'Un service de démonstration. Expiration automatique. Aucun accès global au cluster.',authorRole:'INGÉNIEUR DEVOPS',engineering:'INGÉNIERIE',heroEyebrow:'OBSERVER. PERTURBER. COMPRENDRE.',heroTitle:'La résilience, en pratique.',heroDescription:'Provoquez une panne. Observez la réponse. Conservez les preuves.',connecting:'Connexion',awaitingService:'En attente de télémétrie',waiting:'En attente de données',availability:'Succès HTTP',availabilityHint:'Requêtes avec une réponse HTTP 2xx',latency:'Temps de réponse p95',goodRequests:'Requêtes conformes',goodHint:'Réussies et sous le seuil de latence',budget:'Budget d’erreur glissant',budgetHint:'Restant · objectif de 99 % de conformité',liveTelemetry:'TÉLÉMÉTRIE EN DIRECT',responseTimeline:'Chaque requête raconte une histoire.',responseTime:'Temps de réponse',failedRequest:'Requête échouée',chartEmpty:'Votre première observation arrive.',chartEmptyHint:'Le contrôleur interroge le service chaque seconde.',windowHint:'Fenêtre glissante · jusqu’à 180 observations',controlledExperiments:'EXPÉRIENCES CONTRÔLÉES',experimentsTitle:'Trouvez le point faible. En sécurité.',experimentsIntro:'Une courte référence, une perturbation limitée, puis une récupération mesurée.',latencyTitle:'Réponse lente',latencyDescription:'Ajoutez 650 ms de latence pour observer les requêtes lentes et le budget consommé.',latencyTag:'INJECTION DE LATENCE',errorsTitle:'Erreurs intermittentes',errorsDescription:'Renvoyez une erreur HTTP 503 une requête sur deux et observez la disponibilité.',errorsTag:'ÉCHEC HTTP',readinessTitle:'Perte de disponibilité',readinessDescription:'Faites échouer la sonde readiness. Dans Kubernetes, observez le retrait du point de terminaison.',readinessTag:'ROUTAGE DU TRAFIC',livenessTitle:'Échec de vivacité',livenessDescription:'Faites échouer la sonde liveness et observez la récupération après le redémarrage du conteneur.',livenessTag:'KUBERNETES UNIQUEMENT',modeAwaiting:'Connexion en cours pour déterminer les expériences disponibles.',experimentControl:'PILOTAGE DE L’EXPÉRIENCE',duration:'Durée de la perturbation',controlKey:'Clé de contrôle',required:'Requise pour lancer',keyHint:'Fournie par le lanceur ou le script d’installation. Conservée uniquement en mémoire dans cette page.',runExperiment:'Lancer l’expérience',stopExperiment:'Arrêter et réinitialiser',autoReset:'Les pannes expirent automatiquement. Maximum 60 secondes.',experimentJourney:'DÉROULEMENT DE L’EXPÉRIENCE',baseline:'Référence',disruption:'Perturbation',recovery:'Récupération',baselineHint:'Observer le fonctionnement normal',disruptionHint:'Introduire la panne',recoveryHint:'Mesurer la réponse',evidenceHint:'Exporter les observations',downloadReport:'Télécharger le rapport JSON ↗',observations:'DES OBSERVATIONS, PAS DES SUPPOSITIONS',evidenceTitle:'Les données font foi.',evidenceIntro:'Échantillons réels, synthèses par phase et horodatages. Des résultats à examiner et à partager.',recentExperiments:'Expériences récentes',noReports:'Aucune expérience pour le moment',noReportsHint:'Lancez un premier scénario pour créer un rapport téléchargeable.',reportRetention:'20 derniers rapports · en mémoire jusqu’au redémarrage du contrôleur',eventStream:'Flux d’événements',live:'DIRECT',noEvents:'En attente des événements du contrôleur.',fieldGuideUpper:'GUIDE PRATIQUE',guideTitle:'Une panne est une occasion d’apprendre.',guideIntro:'Comprenez les mesures du laboratoire, le rôle de Kubernetes et les limites de l’expérience.',builtToUnderstand:'CONÇU POUR COMPRENDRE LES PANNES.',guideQ1:'Qu’est-ce qu’une requête « conforme » ?',guideA1:'Une requête conforme reçoit une réponse HTTP 2xx en moins de 300 ms, seuil inclus. Le laboratoire vise 99 % de conformité dans la fenêtre glissante actuelle. Le budget d’erreur représente la marge restante pour les requêtes non conformes de cette fenêtre. Il s’agit d’un indicateur pédagogique, pas d’un SLA de production ni d’une évaluation de SLO à long terme.',guideQ2:'Qu’est-ce qui change avec Kubernetes ?',guideA2:'Le mode local permet d’observer la latence et les erreurs HTTP. Une panne readiness modifie la sonde de santé en local, mais seul Kubernetes l’utilise pour retirer le pod du trafic du Service. Les expériences liveness sont disponibles uniquement dans Kubernetes, où le kubelet peut redémarrer le conteneur. Le laboratoire observe le comportement HTTP ; il ne mesure pas le nombre de redémarrages des pods.',guideQ3:'Que contient un rapport ?',guideA3:'Chaque rapport JSON contient l’environnement, le scénario, les horodatages, les échantillons réels, les événements et les synthèses des phases de référence, d’impact et de récupération. Le temps de récupération est une observation dans une phase limitée ; une valeur absente ne confirme pas la récupération. Exportez les rapports avant de redémarrer le contrôleur.',guideQ4:'Comment les expériences sont-elles limitées ?',guideA4:'Le contrôleur cible un seul service de démonstration configuré. Les actions nécessitent une clé de contrôle, et la cible fait expirer les pannes après 60 secondes au maximum. Aucune URL arbitraire, exécution de commande, utilisation de l’API Kubernetes ou perturbation globale du cluster n’est autorisée. Utilisez un environnement local dédié.',footerCredit:'Conçu et développé par Ahmed Fakhfakh',footerNote:'REQUÊTES RÉELLES. PREUVES VÉRIFIABLES.',local:'LABORATOIRE LOCAL',kubernetes:'KUBERNETES',connected:'Télémétrie connectée',disconnected:'Connexion perdue',updated:'Mis à jour',healthy:'HTTP accessible',unhealthy:'HTTP inaccessible',instance:'INSTANCE',uptime:'ACTIF DEPUIS',threshold:'Seuil de conformité : {ms} ms',budgetCaption:'Restant · objectif de {target} % de conformité',requests:'{count} requêtes',seconds:'{value} secondes',keyPlaceholder:'Collez votre LAB_TOKEN',modeLocal:'Mode local : latence et erreurs HTTP sont observables. Readiness modifie uniquement la sonde ; le routage et les redémarrages nécessitent Kubernetes.',modeKubernetes:'Mode Kubernetes : readiness agit sur les points de terminaison ; liveness peut déclencher un redémarrage. Les résultats sont les observations HTTP du contrôleur.',connectionError:'Le contrôleur est inaccessible. Les observations affichées peuvent être anciennes. Reconnexion automatique en cours.',actionRunning:'Expérience demandée. La phase de référence est en cours.',actionStopped:'Expérience annulée. Consultez les événements pour vérifier le résultat de la réinitialisation.',actionFailed:'L’action n’a pas pu être effectuée.',missingKey:'Collez d’abord la clé de contrôle fournie par le script d’installation.',busy:'Envoi en cours…',complete:'Terminée',cancelled:'Annulée',failed:'Échec',fault:'Perturbation',phaseCountdown:'{seconds} s restantes dans cette phase',phaseFinishing:'En attente de la fin de phase côté contrôleur…',recovered:'Récupération observée : {seconds} s',noRecovery:'La récupération n’a pas été confirmée dans la fenêtre d’observation.',cancelledNote:'Expérience annulée. Consultez le rapport pour les observations de réinitialisation et de récupération.',failedNote:'L’expérience a échoué. Consultez les événements et le rapport.',reportDownloadLabel:'Télécharger le rapport {scenario} du {date}',recoveryShort:'récupération : {seconds} s',recoveryUnconfirmed:'récupération non confirmée',chartTitle:'Temps de réponse sur la fenêtre glissante',chartDescription:'{count} échantillons réels. Temps de réponse entre {min} et {max} millisecondes. {failures} requêtes échouées.',chartWaiting:'En attente de véritables échantillons.',thresholdChart:'CONFORME ≤ {ms} MS',phaseAnnouncement:'{scenario} : {phase}',requestStartError:'Impossible de lancer l’expérience',stopError:'Impossible d’arrêter l’expérience',languageLabel:'Langue',navLabel:'Navigation principale',scenarioLabel:'Scénarios de panne',reportJson:'JSON ↓',sourceMessage:'Événement du contrôleur',faultClear:'Panne réinitialisée',experimentStart:'Expérience lancée',experimentComplete:'Expérience terminée',sampleError:'Erreur d’observation'
  }
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const activeStatuses = new Set(['baseline','fault','recovery']);
let language = 'en';
try { language = localStorage.getItem('kube-lab-language') === 'fr' ? 'fr' : 'en'; } catch { /* Storage is optional. */ }
let state = null;
let selectedScenario = 'latency';
let connected = false;
let busy = false;
let pollInFlight = false;
let lastUpdated = null;
let lastAnnouncement = '';
let reportFingerprint = '';
let eventFingerprint = '';
let messageKey = '';
let messageDetail = '';
let messageIsError = false;

function t(key, values = {}) {
  let value = translations[language][key] ?? translations.en[key] ?? key;
  for (const [name, replacement] of Object.entries(values)) value = value.replaceAll(`{${name}}`, String(replacement));
  return value;
}
function number(value, decimals = 1) {
  return Number.isFinite(value) ? new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {maximumFractionDigits:decimals}).format(value) : '—';
}
function time(value, seconds = false) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {hour:'2-digit',minute:'2-digit',...(seconds ? {second:'2-digit'} : {})}).format(date) : '—';
}
function dateTime(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat(language === 'fr' ? 'fr-FR' : 'en-GB', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(date) : '—';
}
function uptime(value) {
  if (!Number.isFinite(value)) return '—';
  if (value < 60) return `${Math.floor(value)}s`;
  if (value < 3600) return `${Math.floor(value / 60)}m ${Math.floor(value % 60)}s`;
  return `${Math.floor(value / 3600)}h ${Math.floor(value % 3600 / 60)}m`;
}
function scenarioName(scenario) { return t(`${scenario}Title`); }
function isActive() { return activeStatuses.has(state?.experiment?.status); }
function setMetric(id, value, suffix, bad = false) {
  const element = $(id);
  element.replaceChildren(document.createTextNode(number(value)), Object.assign(document.createElement('span'), {textContent:suffix}));
  element.classList.toggle('is-bad', bad && value !== null);
}
function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
function setLanguage(next) {
  language = next === 'fr' ? 'fr' : 'en';
  try { localStorage.setItem('kube-lab-language', language); } catch { /* Continue without persistence. */ }
  document.documentElement.lang = language;
  $$('[data-i18n]').forEach(node => { node.textContent = t(node.dataset.i18n); });
  $$('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
  $('.language-switch').setAttribute('aria-label', t('languageLabel'));
  $('.brand').setAttribute('aria-label', t('homeLabel'));
  $('.sidebar').setAttribute('aria-label', t('navLabel'));
  $$('.nav-link').forEach(link => link.setAttribute('aria-label',t(link.querySelector('[data-i18n]').dataset.i18n)));
  $('.scenario-grid').setAttribute('aria-label', t('scenarioLabel'));
  $('#control-key').placeholder = t('keyPlaceholder');
  $$('#duration option').forEach(option => { option.textContent = t('seconds', {value:option.value}); });
  reportFingerprint = '';
  eventFingerprint = '';
  renderState();
  renderMessage();
}
function renderConnection() {
  const indicator = $('#connection-indicator');
  indicator.classList.toggle('connected', connected);
  indicator.classList.toggle('disconnected', !connected && lastUpdated !== null);
  $('#connection-label').textContent = t(connected ? 'connected' : lastUpdated ? 'disconnected' : 'connecting');
  $('#last-updated').textContent = lastUpdated ? `${t('updated')} ${time(lastUpdated, true)}` : t('awaitingService');
  $('#connection-alert').textContent = t('connectionError');
}
function renderState() {
  renderConnection();
  $('#selected-scenario-title').textContent = scenarioName(selectedScenario);
  if (!state) {
    $('#environment-badge').textContent = '—';
    $('#sample-count').textContent = t('requests',{count:0});
    $('#threshold-label').textContent = t('threshold',{ms:300});
    renderChart([]);
    updateControls();
    return;
  }
  $('#environment-badge').textContent = t(state.environment === 'kubernetes' ? 'kubernetes' : 'local');
  $('#target-name').textContent = state.target.name;
  $('#target-status').textContent = t(state.target.reachable ? 'healthy' : 'unhealthy');
  $('#target-status').className = state.target.reachable ? 'healthy' : 'unhealthy';
  $('#instance-label').replaceChildren(document.createTextNode(`${t('instance')} `), element('b', '', state.target.instance || '—'));
  $('#instance-label').title = state.target.instance || '';
  $('#uptime-label').replaceChildren(document.createTextNode(`${t('uptime')} `), element('b', '', uptime(state.summary.uptimeSeconds)));
  setMetric('#success-value', state.summary.successRate, '%', state.summary.successRate < state.policy.availabilityTarget);
  setMetric('#latency-value', state.summary.p95Ms, 'ms', state.summary.p95Ms > state.policy.latencyThresholdMs);
  setMetric('#good-value', state.summary.goodRate, '%', state.summary.goodRate < state.policy.availabilityTarget);
  setMetric('#budget-value', state.summary.budgetRemaining, '%', state.summary.budgetRemaining === 0);
  $('#budget-bar').style.width = `${Math.min(100,Math.max(0,state.summary.budgetRemaining || 0))}%`;
  $('#threshold-label').textContent = t('threshold',{ms:number(state.policy.latencyThresholdMs,0)});
  $('#budget-caption').textContent = t('budgetCaption',{target:number(state.policy.availabilityTarget,0)});
  $('#sample-count').textContent = t('requests',{count:number(state.summary.requests,0)});
  $('#mode-explanation').textContent = t(state.environment === 'kubernetes' ? 'modeKubernetes' : 'modeLocal');
  if (selectedScenario === 'liveness' && state.environment !== 'kubernetes') selectScenario('latency');
  renderChart(state.samples);
  renderExperiment();
  renderReports();
  renderEvents();
  updateControls();
}

function svgNode(name, attributes = {}, text) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', name);
  for (const [key, value] of Object.entries(attributes)) node.setAttribute(key, String(value));
  if (text !== undefined) node.textContent = text;
  return node;
}
function renderChart(input) {
  const samples = (Array.isArray(input) ? input : []).filter(sample => Number.isFinite(sample.latencyMs) && Number.isFinite(new Date(sample.at).getTime()));
  const svg = $('#telemetry-chart');
  const width = Math.max(260,svg.clientWidth || 1000), height = Math.max(170,svg.clientHeight || 220), left = 42, right = 15, top = 20, bottom = 28;
  svg.setAttribute('viewBox',`0 0 ${width} ${height}`);
  const plotWidth = width-left-right, plotHeight = height-top-bottom;
  const threshold = state?.policy?.latencyThresholdMs ?? 300;
  const maximum = Math.max(threshold * 1.6, ...samples.map(sample => sample.latencyMs * 1.15));
  const yMaximum = Math.ceil(maximum / (maximum > 1600 ? 500 : 200)) * (maximum > 1600 ? 500 : 200);
  const y = value => top + plotHeight - (Math.max(0, value) / yMaximum * plotHeight);
  const firstTime = samples.length ? new Date(samples[0].at).getTime() : 0;
  const lastTime = samples.length ? new Date(samples.at(-1).at).getTime() : 0;
  const duration = Math.max(lastTime-firstTime,1000);
  const x = sample => samples.length === 1 ? left + plotWidth/2 : left + (new Date(sample.at).getTime()-firstTime)/duration*plotWidth;
  svg.replaceChildren(svgNode('title',{id:'chart-title'},t('chartTitle')),svgNode('desc',{id:'chart-description'},samples.length ? t('chartDescription',{count:samples.length,min:number(Math.min(...samples.map(sample=>sample.latencyMs))),max:number(Math.max(...samples.map(sample=>sample.latencyMs))),failures:samples.filter(sample=>!sample.ok).length}) : t('chartWaiting')));
  const defs = svgNode('defs');
  const gradient = svgNode('linearGradient',{id:'area-gradient',x1:'0',y1:'0',x2:'0',y2:'1'});
  gradient.append(svgNode('stop',{offset:'0%','stop-color':'#64d8c1','stop-opacity':'.19'}),svgNode('stop',{offset:'100%','stop-color':'#64d8c1','stop-opacity':'0'}));
  defs.append(gradient);svg.append(defs);
  for (let index=0;index<=4;index++) {
    const value = yMaximum/4*index;
    svg.append(svgNode('line',{x1:left,y1:y(value),x2:width-right,y2:y(value),class:'chart-grid'}),svgNode('text',{x:left-10,y:y(value)+3,'text-anchor':'end',class:'chart-axis-label'},number(value,0)));
  }
  svg.append(svgNode('text',{x:left-10,y:9,'text-anchor':'end',class:'chart-axis-label'},'ms'));
  svg.append(svgNode('line',{x1:left,y1:y(threshold),x2:width-right,y2:y(threshold),class:'chart-threshold'}),svgNode('text',{x:width-right,y:y(threshold)-7,'text-anchor':'end',class:'chart-threshold-label'},t('thresholdChart',{ms:threshold})));
  if (samples.length) {
    const points = samples.map(sample=>`${x(sample).toFixed(2)},${y(sample.latencyMs).toFixed(2)}`);
    if (samples.length>1) {
      svg.append(svgNode('path',{d:`M ${points[0]} L ${points.slice(1).join(' L ')} L ${x(samples.at(-1))},${y(0)} L ${x(samples[0])},${y(0)} Z`,fill:'url(#area-gradient)'}));
      svg.append(svgNode('polyline',{points:points.join(' '),class:'chart-line'}));
    }
    samples.forEach((sample,index)=>{
      if (!sample.ok || samples.length===1 || index===samples.length-1) {
        const dot = svgNode('circle',{cx:x(sample),cy:y(sample.latencyMs),r:sample.ok?3.3:3.4,class:sample.ok?'chart-point':'chart-point-failed'});
        dot.append(svgNode('title',{},`${time(sample.at,true)} · ${number(sample.latencyMs)} ms · ${sample.status === 0 ? 'network error' : `HTTP ${sample.status}`}`));
        svg.append(dot);
      }
    });
    const tickCount = Math.min(samples.length,width<500?3:5);
    const usedTimes = new Set();
    for (let tick=0;tick<tickCount;tick++) {
      const index = tickCount === 1 ? 0 : Math.round(tick/(tickCount-1)*(samples.length-1));
      const sample = samples[index];
      if (usedTimes.has(sample.at)) continue;
      usedTimes.add(sample.at);
      svg.append(svgNode('text',{x:x(sample),y:height-6,'text-anchor':tick===0?'start':tick===tickCount-1?'end':'middle',class:'chart-axis-label'},time(sample.at,true)));
    }
  }
  $('#chart-empty').hidden = samples.length>0;
}
function selectScenario(scenario) {
  if (busy || isActive() || (scenario === 'liveness' && state?.environment !== 'kubernetes')) return;
  selectedScenario = scenario;
  $$('[data-scenario]').forEach(button=>{
    const selected = button.dataset.scenario === scenario;
    button.classList.toggle('selected',selected);
    button.setAttribute('aria-pressed',String(selected));
  });
  $('#selected-scenario-title').textContent = scenarioName(scenario);
}
function updateControls() {
  const active = isActive();
  const hasToken = Boolean($('#control-key').value.trim());
  $$('[data-scenario]').forEach(button=>{button.disabled = busy || active || (button.dataset.scenario === 'liveness' && state?.environment !== 'kubernetes');});
  $('#duration').disabled = busy || active;
  $('#run-button').disabled = busy || active || !connected || !hasToken;
  $('#run-button [data-i18n]').textContent = t(busy ? 'busy' : 'runExperiment');
  $('#stop-button').hidden = !active;
  $('#stop-button').disabled = busy || !hasToken;
}
function renderExperiment() {
  const experiment = state?.experiment;
  if (!messageIsError && messageKey === 'actionRunning' && experiment?.status !== 'baseline') showMessage('');
  $('#experiment-progress').hidden = !experiment;
  if (!experiment) return;
  const statuses = ['baseline','fault','recovery','complete'];
  const currentIndex = statuses.indexOf(experiment.status);
  const completed = experiment.status === 'complete';
  $('#progress-title').textContent = scenarioName(experiment.scenario);
  $('#phase-label').textContent = t(experiment.status);
  $('#phase-label').classList.toggle('failed',experiment.status === 'failed');
  $$('.phase-steps li').forEach((step,index)=>{
    step.classList.toggle('current',index===currentIndex && !completed);
    step.classList.toggle('done',completed || (currentIndex>=0 && index<currentIndex));
  });
  let phaseText = '';
  if (activeStatuses.has(experiment.status)) {
    const remaining = Math.max(0,Math.ceil((new Date(experiment.phaseEndsAt).getTime()-new Date(state.now).getTime())/1000));
    phaseText = Number.isFinite(remaining) && remaining>0 ? t('phaseCountdown',{seconds:remaining}) : t('phaseFinishing');
  } else if (completed) phaseText = Number.isFinite(experiment.recoverySeconds) ? t('recovered',{seconds:number(experiment.recoverySeconds)}) : t('noRecovery');
  else phaseText = t(experiment.status === 'cancelled' ? 'cancelledNote' : 'failedNote');
  $('#phase-time').textContent = phaseText;
  const report = $('#current-report');
  report.hidden = activeStatuses.has(experiment.status);
  report.href = `/api/reports/${encodeURIComponent(experiment.id)}`;
  report.setAttribute('download',`kube-resilience-${experiment.id}.json`);
  const announcement = `${experiment.id}:${experiment.status}`;
  $('#phase-label').setAttribute('aria-label',t('phaseAnnouncement',{scenario:scenarioName(experiment.scenario),phase:t(experiment.status)}));
  if (announcement !== lastAnnouncement) {
    lastAnnouncement = announcement;
    $('#phase-label').setAttribute('role','status');
  }
}
function renderReports() {
  const history = Array.isArray(state?.history) ? state.history : [];
  const fingerprint = language+JSON.stringify(history);
  if (fingerprint===reportFingerprint) return;
  reportFingerprint = fingerprint;
  $('#report-count').textContent = String(history.length);
  const list = $('#reports-list');
  list.replaceChildren();
  if (!history.length) {
    const empty = element('div','empty-state');
    empty.append(element('span','','▤'),element('strong','',t('noReports')),element('p','',t('noReportsHint')));
    empty.firstChild.setAttribute('aria-hidden','true');
    list.append(empty);
    return;
  }
  const sorted = [...history].sort((a,b)=>new Date(b.startedAt)-new Date(a.startedAt));
  sorted.forEach(report=>{
    const row = element('div','report-row');
    const info = element('div','report-info');
    const name = element('div','report-name',scenarioName(report.scenario));
    name.append(element('span',`report-status${report.status==='failed'?' failed':''}`,t(report.status)));
    const recoveryText = report.recoverySeconds !== null && report.recoverySeconds !== undefined ? t('recoveryShort',{seconds:number(report.recoverySeconds)}) : t('recoveryUnconfirmed');
    info.append(name,element('div','report-meta',`${dateTime(report.startedAt)} · ${recoveryText}`));
    const link = element('a','report-download',t('reportJson'));
    link.href = `/api/reports/${encodeURIComponent(report.id)}`;
    link.setAttribute('download',`kube-resilience-${report.id}.json`);
    link.setAttribute('aria-label',t('reportDownloadLabel',{scenario:scenarioName(report.scenario),date:dateTime(report.startedAt)}));
    row.append(info,link);list.append(row);
  });
}
function renderEvents() {
  const events = Array.isArray(state?.events) ? state.events : [];
  const fingerprint = language+JSON.stringify(events);
  if (fingerprint===eventFingerprint) return;
  eventFingerprint = fingerprint;
  const list = $('#events-list');
  list.replaceChildren();
  if (!events.length) {list.append(element('li','event-empty',t('noEvents')));return;}
  [...events].sort((a,b)=>new Date(b.at)-new Date(a.at)).forEach(event=>{
    const row = element('li');
    const stamp = element('time','',time(event.at,true));
    stamp.dateTime = event.at;
    const body = element('div','event-content');
    const knownType = ['baseline','fault','recovery','complete','cancelled','failed','error'].includes(event.type) ? event.type : '';
    const label = translations[language][event.type] ?? event.type.replaceAll(/[_-]/g,' ');
    body.append(element('strong',knownType,label),element('p','',event.message));
    row.append(stamp,body);list.append(row);
  });
}
function showMessage(key, detail = '', isError = false) {
  messageKey = key;messageDetail = detail;messageIsError = isError;renderMessage();
}
function renderMessage() {
  const box = $('#action-message');
  box.hidden = !messageKey;
  box.textContent = messageKey ? `${t(messageKey)}${messageDetail ? `: ${messageDetail}` : ''}` : '';
  box.classList.toggle('error',messageIsError);
}
async function request(path, options = {}) {
  const response = await fetch(path,{...options,signal:AbortSignal.timeout(12000),cache:'no-store'});
  const body = await response.json();
  if (!response.ok) throw new Error(typeof body.error === 'string' ? body.error : `HTTP ${response.status}`);
  return body;
}
async function poll() {
  if (pollInFlight) return;
  pollInFlight = true;
  try {
    const result = await request('/api/state');
    if (!result || !result.target || !result.summary || !Array.isArray(result.samples)) throw new Error('Invalid state response');
    state = result;connected = true;lastUpdated = result.now;
    $('#connection-alert').hidden = true;
    renderState();
  } catch {
    connected = false;
    $('#connection-alert').hidden = false;
    renderConnection();updateControls();
  } finally {pollInFlight = false;}
}
async function writeAction(path, data, successKey, errorKey) {
  if (busy) return;
  const token = $('#control-key').value.trim();
  if (!token) {showMessage('missingKey','',true);$('#control-key').focus();return;}
  busy = true;updateControls();showMessage('busy');
  try {
    const result = await request(path,{method:'POST',headers:{'Content-Type':'application/json','x-lab-token':token},body:JSON.stringify(data)});
    if (state && result.experiment) state.experiment = result.experiment;
    showMessage(successKey);
    await poll();
  } catch (error) {
    showMessage(errorKey,error instanceof Error ? error.message : t('actionFailed'),true);
    // A timed-out request may have reached the controller. Refresh before enabling another run.
    await poll();
  } finally {busy = false;renderState();}
}

$$('[data-language]').forEach(button=>button.addEventListener('click',()=>setLanguage(button.dataset.language)));
$$('[data-scenario]').forEach(button=>button.addEventListener('click',()=>selectScenario(button.dataset.scenario)));
$('#control-key').addEventListener('input',updateControls);
$('#experiment-form').addEventListener('submit',event=>{event.preventDefault();if (!connected || isActive()) return;void writeAction('/api/experiments',{scenario:selectedScenario,durationSeconds:Number($('#duration').value)},'actionRunning','requestStartError');});
$('#stop-button').addEventListener('click',()=>void writeAction('/api/experiments/stop',{},'actionStopped','stopError'));
$$('.nav-link').forEach(link=>link.addEventListener('click',()=>{$$('.nav-link').forEach(item=>item.classList.toggle('active',item===link));}));
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries=>{
    const visible = entries.filter(entry=>entry.isIntersecting).sort((a,b)=>b.intersectionRatio-a.intersectionRatio)[0];
    if (visible) $$('.nav-link').forEach(link=>link.classList.toggle('active',link.getAttribute('href')===`#${visible.target.id}`));
  },{rootMargin:'-10% 0px -55% 0px',threshold:[0,.1,.3]});
  $$('.section-anchor').forEach(section=>observer.observe(section));
}
document.addEventListener('visibilitychange',()=>{if (!document.hidden) void poll();});
window.addEventListener('resize',()=>renderChart(state?.samples ?? []));
setLanguage(language);
void poll();
setInterval(()=>void poll(),1000);
