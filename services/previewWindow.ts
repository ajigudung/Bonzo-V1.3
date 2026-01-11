export type PreviewWindowParams = {
  imageUrl: string;
  title?: string;
  info?: string;
};

type PreviewPayload =
  | { type: 'ajg_set_preview_blob'; blob: Blob }
  | { type: 'ajg_set_preview_blobs'; beforeBlob: Blob; afterBlob: Blob };

/**
 * Reliable sender for the popup: waits for the popup to announce it's ready,
 * and also retries a few times to avoid race conditions in AI Studio / slower browsers.
 */
export function postPreviewPayload(w: Window, payload: PreviewPayload) {
  let done = false;

  const trySend = () => {
    if (done) return;
    try {
      w.postMessage(payload, '*');
    } catch {}
  };

  const onMsg = (ev: MessageEvent) => {
    if (ev.source !== w) return;
    if (ev.data?.type === 'ajg_preview_ready') {
      done = true;
      window.removeEventListener('message', onMsg);
      trySend();
    }
  };

  window.addEventListener('message', onMsg);

  // Retry sends (covers the case where ready message is delayed or blocked)
  const delays = [120, 350, 900, 1600];
  delays.forEach((ms) => {
    window.setTimeout(() => {
      trySend();
    }, ms);
  });

  // Cleanup listener
  window.setTimeout(() => {
    window.removeEventListener('message', onMsg);
  }, 6500);
}

/**
 * Popup preview with zoom/pan + automatic Before/After compare slider (mask overlay).
 *
 * Opener can send:
 * - { type:'ajg_set_preview_blob', blob }
 * - { type:'ajg_set_preview_blobs', beforeBlob, afterBlob }
 */
export function renderPreviewWindow(w: Window, params: PreviewWindowParams) {
  const title = params.title ?? 'Preview';
  const info = params.info ?? '';

  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${title.replace(/</g, '&lt;')}</title>
  <style>
    :root{color-scheme:dark;}
    body{margin:0;font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto; background:#0b1020; color:#e5e7eb;}

    #bar{position:fixed; top:0; left:0; right:0; height:52px; display:flex; align-items:center; justify-content:space-between; gap:12px;
         padding:0 12px; background:rgba(17,24,39,.92); backdrop-filter:blur(8px); border-bottom:1px solid rgba(55,65,81,.8); z-index:10;}
    #bar .left{min-width:0; display:flex; flex-direction:column;}
    #bar .title{font-weight:800; color:#fbbf24; line-height:1.1;}
    #bar .sub{font-size:12px; color:#9ca3af; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:65vw;}
    #bar .right{display:flex; align-items:center; gap:8px;}

    button{border:1px solid rgba(55,65,81,.9); background:#111827; color:#e5e7eb; padding:8px 10px; border-radius:10px; cursor:pointer; font-weight:700; font-size:13px;}
    button:hover{background:#0b1224;}
    button.active{border-color:#fbbf24;}

    #viewport{position:fixed; top:52px; left:0; right:0; bottom:0; display:flex; align-items:center; justify-content:center; background:#0b1020;}
    #scroller{width:100%; height:100%; overflow:hidden; cursor:default;}
    #scroller.drag{cursor:grabbing;}
    #wrap{display:flex; align-items:center; justify-content:center; min-height:100%; min-width:100%;}

    #layer{position:relative; display:inline-block; transform-origin:0 0; will-change:transform;}
    #imgBase{display:block; user-select:none; -webkit-user-drag:none;}

    /* AFTER overlays full-size. We reveal it with clip-path (mask), not by resizing. */
    #imgAfter{
      position:absolute; left:0; top:0;
      width:100%; height:100%;
      display:none;
      user-select:none; -webkit-user-drag:none;
      object-fit:fill;
      pointer-events:none;
      clip-path: inset(0 50% 0 0);
    }
    #divider{
      position:absolute; top:0; bottom:0; left:50%;
      width:2px; background:#fbbf24; box-shadow:0 0 0 1px rgba(0,0,0,.25);
      display:none;
      pointer-events:none;
    }
    #knob{
      position:absolute; top:50%; left:50%; transform:translate(-50%,-50%);
      width:34px; height:34px; border-radius:999px;
      background:rgba(17,24,39,.92);
      border:1px solid rgba(251,191,36,.8);
      display:flex; align-items:center; justify-content:center;
    }
    #knob:before{content:''; width:10px; height:10px; border-left:2px solid #fbbf24; border-right:2px solid #fbbf24; opacity:.9;}

    .tag{
      position:absolute; top:10px; padding:6px 10px; border-radius:999px; font-size:11px; font-weight:900; letter-spacing:.06em;
      background:rgba(17,24,39,.75); border:1px solid rgba(55,65,81,.85); display:none; pointer-events:none;
    }
    .tag.before{left:10px; color:#d1d5db;}
    .tag.after{right:10px; color:#fbbf24; border-color:rgba(251,191,36,.55);}

    #compareUi{
      position:fixed; left:12px; right:12px; bottom:12px;
      display:none; align-items:center; gap:10px;
      padding:10px 12px; border-radius:14px;
      background:rgba(17,24,39,.85); border:1px solid rgba(55,65,81,.85); z-index:11;
    }
    #compareUi .lbl{font-size:12px; font-weight:800; letter-spacing:.04em;}
    #compareUi .before{color:#9ca3af;}
    #compareUi .after{color:#fbbf24;}
    #range{flex:1;}

    .fit #imgBase{max-width:100%; max-height:100%; width:auto; height:auto; margin:auto;}
    .hundred{overflow:auto;}
    .hundred #imgBase{max-width:none; max-height:none;}

    .hint{
      position:fixed; right:12px; bottom:72px;
      padding:10px 12px; border-radius:12px;
      background:rgba(17,24,39,.85); border:1px solid rgba(55,65,81,.85);
      font-size:12px; color:#d1d5db; z-index:12;
    }
    .err{
      position:fixed; left:12px; right:12px; bottom:12px;
      padding:12px; border-radius:12px;
      background:rgba(127,29,29,.25); border:1px solid rgba(239,68,68,.35);
      color:#fecaca; font-size:12px; display:none; z-index:20;
    }
    .zoom{
      position:fixed; left:12px; bottom:72px;
      padding:10px 12px; border-radius:12px;
      background:rgba(17,24,39,.85); border:1px solid rgba(55,65,81,.85);
      font-size:12px; color:#d1d5db; display:none; z-index:12;
    }
  </style>
</head>
<body>
  <div id="bar">
    <div class="left">
      <div class="title">${title.replace(/</g, '&lt;')}</div>
      <div class="sub">${info.replace(/</g, '&lt;')}</div>
    </div>
    <div class="right">
      <button id="fitBtn" class="active">Fit</button>
      <button id="hBtn">100%</button>
    </div>
  </div>

  <div id="viewport">
    <div id="loading" style="position:fixed;top:52px;left:0;right:0;bottom:0;display:flex;align-items:center;justify-content:center;color:#9ca3af;font-size:14px">Loading preview…</div>
    <div id="scroller" class="fit">
      <div id="wrap">
        <div id="layer">
          <img id="imgBase" alt="preview" />
          <img id="imgAfter" alt="after" />
          <div id="divider"><div id="knob"></div></div>
          <div id="tagBefore" class="tag before">BEFORE</div>
          <div id="tagAfter" class="tag after">AFTER</div>
        </div>
      </div>
    </div>
  </div>

  <div id="compareUi">
    <div class="lbl before">BEFORE</div>
    <input id="range" type="range" min="0" max="100" value="50" />
    <div class="lbl after">AFTER</div>
  </div>

  <div class="hint">Wheel: zoom in/out • Drag: pan (100% / zoomed)</div>
  <div id="zoom" class="zoom"></div>
  <div id="err" class="err"></div>

  <script>
    let beforeUrl = null;
    let afterUrl = null;
    let currentUrls = [];

    function revokeAll(){
      try { currentUrls.forEach(u => { if(u) URL.revokeObjectURL(u); }); } catch(e){}
      currentUrls = [];
    }
    window.addEventListener('beforeunload', () => revokeAll());

    const initialUrl = ${JSON.stringify(params.imageUrl || '')};

    const scroller = document.getElementById('scroller');
    const fitBtn = document.getElementById('fitBtn');
    const hBtn = document.getElementById('hBtn');

    const layer = document.getElementById('layer');
    const imgBase = document.getElementById('imgBase');
    const imgAfter = document.getElementById('imgAfter');
    const divider = document.getElementById('divider');
    const tagBefore = document.getElementById('tagBefore');
    const tagAfter = document.getElementById('tagAfter');

    const compareUi = document.getElementById('compareUi');
    const range = document.getElementById('range');

    const err = document.getElementById('err');
    const loading = document.getElementById('loading');
    const zoomEl = document.getElementById('zoom');

    let mode = 'fit';
    let scale = 1;
    const MIN_SCALE = 0.1;
    const MAX_SCALE = 8;

    function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

    function showZoom(){
      zoomEl.style.display = 'block';
      zoomEl.textContent = Math.round(scale * 100) + '%';
      clearTimeout(showZoom._t);
      showZoom._t = setTimeout(() => { zoomEl.style.display = 'none'; }, 800);
    }

    function applyTransform(){
      layer.style.transform = 'scale(' + scale.toFixed(4) + ')';
      if(mode === 'fit'){
        scroller.style.overflow = (scale > 1.01) ? 'auto' : 'hidden';
      } else {
        scroller.style.overflow = 'auto';
      }
      showZoom();
    }

    function setMode(next){
      mode = next;
      if(mode === 'fit'){
        scroller.classList.add('fit');
        scroller.classList.remove('hundred');
        scroller.style.overflow = (scale > 1.01) ? 'auto' : 'hidden';
        fitBtn.classList.add('active');
        hBtn.classList.remove('active');
      } else {
        scroller.classList.remove('fit');
        scroller.classList.add('hundred');
        scroller.style.overflow = 'auto';
        fitBtn.classList.remove('active');
        hBtn.classList.add('active');
        requestAnimationFrame(() => {
          scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
          scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) / 2;
        });
      }
    }

    function hasCompare(){
      return !!beforeUrl && !!afterUrl && beforeUrl !== afterUrl;
    }

    function setSplit(pct){
      const p = clamp(pct, 0, 100);
      // Mask AFTER (clip), do NOT resize any image
      const rightInset = (100 - p).toFixed(3) + '%';
      imgAfter.style.clipPath = 'inset(0 ' + rightInset + ' 0 0)';
      divider.style.left = p + '%';
    }

    function renderState(){
      const canCompare = hasCompare();

      if(canCompare){
        // Always show compare UI when both images exist
        compareUi.style.display = 'flex';
        imgAfter.style.display = 'block';
        divider.style.display = 'block';
        tagBefore.style.display = 'block';
        tagAfter.style.display = 'block';

        imgBase.src = beforeUrl;
        imgAfter.src = afterUrl;
        setSplit(parseInt(range.value || '50', 10));
      } else {
        compareUi.style.display = 'none';
        imgAfter.style.display = 'none';
        divider.style.display = 'none';
        tagBefore.style.display = 'none';
        tagAfter.style.display = 'none';

        if(afterUrl) imgBase.src = afterUrl;
        else if(beforeUrl) imgBase.src = beforeUrl;
      }
    }

    range.addEventListener('input', (e) => {
      if(!hasCompare()) return;
      setSplit(parseInt(e.target.value, 10));
    });

    fitBtn.addEventListener('click', () => setMode('fit'));
    hBtn.addEventListener('click', () => setMode('hundred'));

    function showError(msg){
      if(loading) loading.style.display = 'none';
      err.style.display = 'block';
      err.textContent = msg;
    }

    imgBase.onerror = () => showError('Gagal memuat image preview. Coba ulangi Preview atau izinkan pop-up.');
    imgAfter.onerror = () => showError('Gagal memuat image compare (after). Coba ulangi Preview.');

    imgBase.onload = () => {
      if(loading) loading.style.display = 'none';
      err.style.display = 'none';
      // reset zoom on new image
      scale = 1;
      applyTransform();
      if(mode==='hundred'){
        requestAnimationFrame(() => {
          scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
          scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) / 2;
        });
      }
    };

    function setSingle(url){
      beforeUrl = null;
      afterUrl = url;
      if(loading) loading.style.display = 'flex';
      renderState();
    }

    function setBoth(bUrl, aUrl){
      beforeUrl = bUrl;
      afterUrl = aUrl;
      range.value = '50';
      if(loading) loading.style.display = 'flex';
      renderState();
    }

    if(initialUrl){ setSingle(initialUrl); }

    window.addEventListener('message', (ev) => {
      try {
        if(ev.data?.type === 'ajg_set_preview_blob'){
          const blob = ev.data.blob;
          if(!blob) return;
          revokeAll();
          const u = URL.createObjectURL(blob);
          currentUrls = [u];
          setSingle(u);
          return;
        }

        if(ev.data?.type === 'ajg_set_preview_blobs'){
          const b = ev.data.beforeBlob;
          const a = ev.data.afterBlob;
          if(!b || !a) return;
          revokeAll();
          const bu = URL.createObjectURL(b);
          const au = URL.createObjectURL(a);
          currentUrls = [bu, au];
          setBoth(bu, au);
          return;
        }
      } catch(e) {}
    });

    // wheel zoom
    scroller.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY;
      const zoomFactor = Math.pow(1.0015, -delta);
      const nextScale = clamp(scale * zoomFactor, MIN_SCALE, MAX_SCALE);
      if(nextScale === scale) return;

      const rect = scroller.getBoundingClientRect();
      const cx = e.clientX - rect.left + scroller.scrollLeft;
      const cy = e.clientY - rect.top + scroller.scrollTop;
      const relX = cx / scale;
      const relY = cy / scale;

      scale = nextScale;
      applyTransform();

      scroller.scrollLeft = relX * scale - (e.clientX - rect.left);
      scroller.scrollTop = relY * scale - (e.clientY - rect.top);
    }, { passive:false });

    // drag pan
    let isDown = false, startX=0, startY=0, startL=0, startT=0;
    scroller.addEventListener('pointerdown', (e) => {
      if(!(mode==='hundred' || scale>1.01)) return;
      isDown = true;
      scroller.setPointerCapture(e.pointerId);
      scroller.classList.add('drag');
      startX = e.clientX; startY = e.clientY;
      startL = scroller.scrollLeft; startT = scroller.scrollTop;
      e.preventDefault();
    });
    scroller.addEventListener('pointermove', (e) => {
      if(!isDown || !(mode==='hundred' || scale>1.01)) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      scroller.scrollLeft = startL - dx;
      scroller.scrollTop = startT - dy;
      e.preventDefault();
    });
    function endDrag(){ isDown=false; scroller.classList.remove('drag'); }
    scroller.addEventListener('pointerup', endDrag);
    scroller.addEventListener('pointercancel', endDrag);

    setMode('fit');
    applyTransform();

    // Handshake: tell opener we're ready to receive blobs
    try { window.opener && window.opener.postMessage({ type: 'ajg_preview_ready' }, '*'); } catch(e){}
  </script>
</body>
</html>`;

  w.document.open();
  w.document.write(html);
  w.document.close();
}
