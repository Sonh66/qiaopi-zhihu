(() => {
  const pages = {
    dashboard: { title: "侨批智护", label: "研究总览", group: "研究工作台", description: "侨批 AIGC 合规研究工作台" },
    project: { title: "项目建档", label: "项目建档", group: "档案与样本", description: "建立项目身份，记录创作与传播范围。" },
    sample: { title: "样本集构建", label: "样本集构建", group: "档案与样本", description: "提取档案叙事，形成可追溯的 AIGC 样本方案。" },
    materials: { title: "素材权属审核", label: "素材权属审核", group: "档案与样本", description: "核验档案来源、开放状态与个人信息。" },
    chain: { title: "生成链路分析", label: "生成链路分析", group: "生成与权利", description: "追溯数据输入、模型处理与传播作品。" },
    rights: { title: "授权与利益分配", label: "授权与分配", group: "生成与权利", description: "匹配使用权限，记录署名与利益分配约定。" },
    production: { title: "AIGC 识别记录", label: "AIGC 识别记录", group: "生成与权利", description: "上传生成素材，留存模型、提示词与修改过程。" },
    crossborder: { title: "跨境规则对接", label: "跨境规则对接", group: "传播与合规", description: "记录目标地区、平台与语言的传播要求。" },
    decision: { title: "授权决策树", label: "授权决策树", group: "传播与合规", description: "逐项核对使用条件，形成授权与复核建议。" },
    release: { title: "发布前检查", label: "发布前检查", group: "传播与合规", description: "核验授权范围、信息脱敏与生成内容标识。" },
    archive: { title: "合规档案包", label: "合规档案包", group: "传播与合规", description: "汇集研究记录，导出项目的合规档案。" },
  };
  const pageOrder = Object.keys(pages);
  const engine = window.gsap;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = window.matchMedia("(max-width: 900px)");
  let motionEnabled = true;
  try { motionEnabled = localStorage.getItem("qiaopi-motion") !== "off"; } catch { motionEnabled = true; }
  let progressRatio = 0;
  let currentPage = "dashboard";
  let navigationTimeline;
  let pageContext;
  let feedbackContext;
  let toastTimeline;
  let toastTimeout;
  let drawerTween;
  let mounted = false;

  const select = (selector) => document.querySelector(selector);
  const shouldAnimate = () => Boolean(engine && motionEnabled && !reducedMotion.matches);

  function moveIndicator(immediate = false) {
    const button = select(".nav-item.active");
    const indicator = select("#navIndicator");
    if (!button || !indicator) return;
    const position = { y: button.offsetTop, height: button.offsetHeight };
    if (shouldAnimate() && !immediate) {
      engine.to(indicator, { ...position, duration: .48, ease: "expo.out", overwrite: true });
    } else if (engine) {
      engine.killTweensOf(indicator);
      engine.set(indicator, position);
    } else {
      indicator.style.transform = `translateY(${position.y}px)`;
      indicator.style.height = `${position.height}px`;
    }
  }

  function closeDrawer(returnFocus = false) {
    const sidebar = select("#sidebar");
    if (!sidebar.classList.contains("open")) return;
    if (drawerTween) drawerTween.kill();
    sidebar.classList.remove("open");
    sidebar.style.removeProperty("transform");
    select("#drawerBackdrop").hidden = true;
    document.body.classList.remove("drawer-open");
    select("#menuToggle").setAttribute("aria-expanded", "false");
    if (returnFocus) select("#menuToggle").focus();
  }

  function openDrawer() {
    select("#sidebar").classList.add("open");
    select("#drawerBackdrop").hidden = false;
    document.body.classList.add("drawer-open");
    select("#menuToggle").setAttribute("aria-expanded", "true");
    moveIndicator(true);
    if (shouldAnimate()) {
      drawerTween = engine.fromTo("#sidebar", { xPercent: -100 }, { xPercent: 0, duration: .38, ease: "expo.out", clearProps: "transform" });
    }
    select(".nav-item.active").focus();
  }

  function cancelPageMotion() {
    if (navigationTimeline) navigationTimeline.kill();
    if (pageContext) pageContext.revert();
    if (feedbackContext) feedbackContext.revert();
    navigationTimeline = null;
    pageContext = null;
    feedbackContext = null;
  }

  function activatePage(pageId, updateHistory) {
    currentPage = pageId;
    document.body.dataset.page = pageId;
    document.querySelectorAll(".step-section").forEach((section) => {
      section.classList.toggle("active", section.id === pageId);
      section.setAttribute("aria-label", pages[section.id].label);
    });
    document.querySelectorAll(".nav-item").forEach((button) => {
      const active = button.dataset.step === pageId;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    });
    select("#pageTitle").textContent = pages[pageId].title;
    select("#pageDescription").textContent = pages[pageId].description;
    select("#pageLocation").textContent = `${pages[pageId].group} / ${pages[pageId].label}`;
    select("#breadcrumbTitle").textContent = pages[pageId].label;
    document.title = `${pages[pageId].label} | 侨批智护`;
    if (updateHistory && location.hash !== `#${pageId}`) history.pushState({ page: pageId }, "", `#${pageId}`);
    moveIndicator();
    closeDrawer();
  }

  function animatePageIn(direction = 1) {
    if (!shouldAnimate()) return;
    const section = document.getElementById(currentPage);
    pageContext = engine.context(() => {
      const reveal = [select(".page-heading"), ...section.children];
      engine.fromTo(reveal, { opacity: 0, x: direction * 26, y: 8 }, {
        opacity: 1, x: 0, y: 0, duration: .56,
        stagger: { each: .045, amount: .18 }, ease: "expo.out", clearProps: "transform,opacity",
      });
      if (currentPage === "dashboard") {
        engine.fromTo(".phase-number", { y: 15, opacity: 0 }, { y: 0, opacity: 1, stagger: .07, duration: .55, ease: "power3.out", delay: .12, clearProps: "transform,opacity" });
        engine.fromTo("#routeTracer", { xPercent: -100 }, { xPercent: 770, duration: 2.6, ease: "power2.inOut", repeat: 1, repeatDelay: .8 });
        engine.fromTo(".archive-scan", { top: "0%", opacity: 0 }, { top: "100%", opacity: .65, duration: 1.6, ease: "power1.inOut", delay: .3, onComplete() { engine.set(".archive-scan", { opacity: 0 }); } });
      }
      if (currentPage === "chain") animateChain();
    }, select("#pageStage"));
  }

  function animateChain() {
    document.querySelectorAll(".flow-line").forEach((line, index) => {
      if (!line.querySelector(".flow-packet")) {
        const packet = document.createElement("span");
        packet.className = "flow-packet";
        packet.setAttribute("aria-hidden", "true");
        line.append(packet);
      }
      const vertical = window.innerWidth <= 620;
      engine.fromTo(line.firstElementChild, vertical ? { y: -35, x: 0 } : { x: -20, y: 0 }, {
        ...(vertical ? { y: 20 } : { x: line.clientWidth + 20 }), duration: 1.1, delay: index * .4, repeat: 2, ease: "none",
      });
    });
  }

  function navigate(pageId, options = {}) {
    if (!Object.hasOwn(pages, pageId)) return;
    const previousPage = currentPage;
    cancelPageMotion();
    if (previousPage === pageId && !options.initial) {
      closeDrawer();
      return;
    }
    const direction = pageOrder.indexOf(pageId) >= pageOrder.indexOf(previousPage) ? 1 : -1;
    const commit = () => {
      activatePage(pageId, !options.fromHistory && !options.initial);
      if (!options.initial) {
        window.scrollTo({ top: 0, behavior: "instant" });
        select("#pageStage").focus({ preventScroll: true });
      }
      animatePageIn(direction);
    };
    if (options.initial || options.fromHistory || !shouldAnimate()) {
      commit();
      return;
    }
    navigationTimeline = engine.timeline();
    pageContext = engine.context(() => {
      navigationTimeline.to([select(".page-heading"), document.getElementById(previousPage)], {
        x: -direction * 16, opacity: 0, duration: .14, ease: "power2.in",
        onComplete() {
          pageContext.revert();
          pageContext = null;
          commit();
        },
      });
    }, select("#pageStage"));
  }

  function toast(message) {
    const element = select("#toast");
    select("#toastMessage").textContent = message;
    clearTimeout(toastTimeout);
    if (toastTimeline) toastTimeline.kill();
    if (shouldAnimate()) {
      toastTimeline = engine.timeline()
        .fromTo(element, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .3, ease: "power3.out" })
        .to(element, { y: 8, autoAlpha: 0, duration: .2, delay: 2.5 });
    } else {
      element.style.opacity = "1";
      element.style.visibility = "visible";
      toastTimeout = setTimeout(() => { element.style.opacity = "0"; element.style.visibility = "hidden"; }, 2700);
    }
  }

  function syncStats(projectState) {
    select("#sampleCount").textContent = projectState.samples.length;
    select("#materialCount").textContent = projectState.materials.length;
    select("#imageCount").textContent = projectState.mediaAnalyses.length;
    select("#currentProjectName").textContent = select("#projectName").value || "未命名项目";
    select("#materialTask").textContent = projectState.materials.length ? `${projectState.materials.length} 份素材已录入` : "录入档案来源与权利信息";
    select("#imageTask").textContent = projectState.mediaAnalyses.length ? `${projectState.mediaAnalyses.length} 张图片已记录` : "上传图片，记录生成痕迹";
    select("#releaseTask").textContent = projectState.releaseStatus === "未检查" ? "核对脱敏、授权与内容标识" : projectState.releaseStatus;
    const completed = [Boolean(select("#projectName").value.trim()), projectState.samples.length > 0, projectState.materials.length > 0,
      Boolean(projectState.chainAnalysis), Boolean(projectState.benefitText), Boolean(projectState.borderAnalysis),
      projectState.productionSaved, projectState.releaseStatus !== "未检查"].filter(Boolean).length;
    select("#sidebarProgress").textContent = `${completed} / 8`;
    progressRatio = completed / 8;
    if (shouldAnimate()) engine.to("#sidebarProgressFill", { scaleX: completed / 8, duration: .7, ease: "power3.out", overwrite: true });
    else select("#sidebarProgressFill").style.transform = `scaleX(${completed / 8})`;
  }

  function addIcons() {
    const actionIcons = {
      refreshId: "refresh-cw", buildSample: "sparkles", addMaterial: "plus", analyzeChain: "workflow",
      generateAgreement: "file-pen-line", buildBenefit: "scale", runBorder: "globe-2", saveProduction: "save",
      clearImages: "trash-2", runDecision: "git-branch", buildLegalPrompt: "wand-sparkles", runReleaseCheck: "shield-check", exportArchive: "download",
    };
    Object.entries(actionIcons).forEach(([id, name]) => {
      const icon = document.createElement("i");
      icon.dataset.lucide = name;
      select(`#${id}`).prepend(icon);
    });
    const uploadIcon = document.createElement("i");
    uploadIcon.dataset.lucide = "image-up";
    select("#uploadZone").prepend(uploadIcon);
    const archiveIcons = ["layers", "scan-text", "workflow", "file-check-2", "globe-2", "clapperboard", "scan-line", "shield-alert"];
    document.querySelectorAll(".archive-card").forEach((card, index) => {
      const icon = document.createElement("i");
      icon.dataset.lucide = archiveIcons[index];
      card.prepend(icon);
    });
    if (window.lucide) window.lucide.createIcons({ attrs: { "aria-hidden": "true" } });
  }

  function init() {
    if (mounted) return;
    mounted = true;
    try { motionEnabled = localStorage.getItem("qiaopi-motion") !== "off"; } catch { motionEnabled = true; }
    select("#motionEnabled").checked = motionEnabled;
    document.body.classList.toggle("motion-disabled", !motionEnabled);
    addIcons();
    select("#workspaceDate").textContent = new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
    select("#menuToggle").addEventListener("click", () => {
      if (select("#sidebar").classList.contains("open")) closeDrawer(true);
      else openDrawer();
    });
    select("#drawerBackdrop").addEventListener("click", () => closeDrawer(true));
    document.addEventListener("keydown", (event) => {
      if (!mobile.matches || !select("#sidebar").classList.contains("open")) return;
      if (event.key === "Escape") closeDrawer(true);
      if (event.key === "Tab") {
        const buttons = [...select("#sidebar").querySelectorAll("button")];
        const first = buttons[0];
        const last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    });
    const disableMotion = () => {
      cancelPageMotion();
      if (engine) {
        engine.killTweensOf(".brand, .workspace-label, #sidebarProgressFill, button");
        engine.set(".brand, .workspace-label, button", { clearProps: "transform,opacity" });
        engine.set("#sidebarProgressFill", { scaleX: progressRatio });
      }
      moveIndicator(true);
      if (toastTimeline) { toastTimeline.kill(); select("#toast").style.visibility = "hidden"; }
    };
    select("#motionEnabled").addEventListener("change", (event) => {
      motionEnabled = event.target.checked;
      document.body.classList.toggle("motion-disabled", !motionEnabled);
      try { localStorage.setItem("qiaopi-motion", motionEnabled ? "on" : "off"); } catch { /* Storage may be unavailable in private sessions. */ }
      disableMotion();
      if (shouldAnimate()) animatePageIn();
    });
    reducedMotion.addEventListener("change", disableMotion);
    mobile.addEventListener("change", () => { closeDrawer(); moveIndicator(true); });
    window.addEventListener("resize", () => moveIndicator(true));
    window.addEventListener("popstate", () => navigate(location.hash.slice(1) || "dashboard", { fromHistory: true }));
    window.addEventListener("hashchange", () => {
      const target = location.hash.slice(1) || "dashboard";
      if (target !== currentPage) navigate(target, { fromHistory: true });
    });
    const messages = {
      refreshId: "项目编号已更新", buildSample: "样本方案已生成", addMaterial: "素材已加入审核记录",
      analyzeChain: "生成链路已更新", generateAgreement: "授权文本已生成", buildBenefit: "分配建议已生成",
      runBorder: "跨境规则分析已更新", saveProduction: "制作记录已登记", runDecision: "授权决策已更新",
      buildLegalPrompt: "法律审查提示词已生成", runReleaseCheck: "发布检查已完成", exportArchive: "档案包已导出", clearImages: "图片记录已清空",
    };
    document.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (button && messages[button.id]) toast(messages[button.id]);
      if (button && shouldAnimate() && !button.dataset.step && !button.dataset.jump) {
        engine.fromTo(button, { scale: .96 }, { scale: 1, duration: .28, ease: "back.out(1.5)", clearProps: "transform", overwrite: true });
      }
    });
    const observer = new MutationObserver((mutations) => {
      if (!shouldAnimate()) return;
      const inserted = mutations.flatMap((mutation) => [...mutation.addedNodes])
        .filter((node) => node.nodeType === 1 && node.closest(".step-section.active"));
      if (!inserted.length) return;
      if (feedbackContext) feedbackContext.revert();
      feedbackContext = engine.context(() => {}, select("#pageStage"));
      feedbackContext.add(() => {
        engine.fromTo(inserted, { y: 15, opacity: 0 }, { y: 0, opacity: 1, duration: .45, stagger: .045, ease: "power3.out", clearProps: "transform,opacity" });
      });
    });
    ["sampleOutput", "materialRows", "chainMatrix", "borderOutput", "benefitOutput", "decisionOutput", "releaseOutput", "mediaGrid"].forEach((id) => observer.observe(select(`#${id}`), { childList: true }));
    select("#pulseMap").addEventListener("click", () => {
      if (!shouldAnimate()) return;
      if (!pageContext) pageContext = engine.context(() => {}, select("#pageStage"));
      pageContext.add(() => {
        engine.fromTo(".phase-top", { y: 9, opacity: .4 }, { y: 0, opacity: 1, duration: .5, stagger: .09, ease: "power3.out", clearProps: "transform,opacity" });
        engine.fromTo("#routeTracer", { xPercent: -100 }, { xPercent: 770, duration: 1.4, ease: "power2.inOut", overwrite: true });
      });
    });
    navigate(Object.hasOwn(pages, location.hash.slice(1)) ? location.hash.slice(1) : "dashboard", { initial: true });
    if (shouldAnimate()) engine.fromTo(".brand, .workspace-label", { opacity: 0, y: -8 }, { opacity: 1, y: 0, duration: .65, stagger: .08, ease: "power3.out", clearProps: "transform,opacity" });
    window.addEventListener("pagehide", () => { observer.disconnect(); cancelPageMotion(); }, { once: true });
  }

  window.WorkspaceUI = { init, navigate, syncStats, toast };
})();
