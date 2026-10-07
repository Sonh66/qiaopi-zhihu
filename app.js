const state = {
  materials: [],
  samples: [],
  mediaAnalyses: [],
  chainAnalysis: null,
  borderAnalysis: null,
  benefitText: "",
  decision: null,
  productionSaved: false,
  releaseStatus: "未检查",
};
let imageScanVersion = 0;

const requiredRightsByScenario = {
  "复制": "复制权",
  "信息网络传播权": "信息网络传播权",
  "改编权": "改编权",
  "翻译权": "翻译权",
  "汇编权": "汇编权",
  "商业使用许可": "商业使用许可",
};

const els = {
  projectId: q("#projectId"),
  riskLabel: q("#riskLabel"),
  riskReason: q("#riskReason"),
  rightsLabel: q("#rightsLabel"),
  rightsReason: q("#rightsReason"),
  borderLabel: q("#borderLabel"),
  borderReason: q("#borderReason"),
  releaseLabel: q("#releaseLabel"),
  releaseReason: q("#releaseReason"),
  materialRisk: q("#materialRisk"),
  materialAdvice: q("#materialAdvice"),
  materialRows: q("#materialRows"),
  neededRights: q("#neededRights"),
  missingRights: q("#missingRights"),
  agreementText: q("#agreementText"),
  benefitOutput: q("#benefitOutput"),
  borderOutput: q("#borderOutput"),
  chainMatrix: q("#chainMatrix"),
  sampleOutput: q("#sampleOutput"),
  releaseOutput: q("#releaseOutput"),
  decisionOutput: q("#decisionOutput"),
  legalPrompt: q("#legalPrompt"),
  productionNotice: q("#productionNotice"),
  imageUpload: q("#imageUpload"),
  uploadZone: q("#uploadZone"),
  mediaSummary: q("#mediaSummary"),
  mediaGrid: q("#mediaGrid"),
  archiveSample: q("#archiveSample"),
  archiveReview: q("#archiveReview"),
  archiveChain: q("#archiveChain"),
  archiveRights: q("#archiveRights"),
  archiveBorder: q("#archiveBorder"),
  archiveProduction: q("#archiveProduction"),
  archiveMedia: q("#archiveMedia"),
  archiveRisk: q("#archiveRisk"),
};

function q(selector) {
  return document.querySelector(selector);
}

function field(id) {
  return document.querySelector(`#${id}`);
}

function showStep(stepId) {
  window.WorkspaceUI.navigate(stepId);
}

function generateProjectId() {
  const now = new Date();
  const stamp = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const suffix = String(Math.floor(Math.random() * 900) + 100);
  els.projectId.textContent = `QP-${stamp}-${suffix}`;
  updateArchive();
}

function buildSample() {
  const id = `SAMPLE-${String(state.samples.length + 1).padStart(3, "0")}`;
  const sample = {
    id,
    text: field("sampleText").value,
    feature: field("visualFeature").value,
    story: field("storyElement").value,
    format: field("sampleFormat").value,
    audience: field("audience").value,
    style: field("styleControl").value,
    prompt: "",
    risks: [],
    observations: [],
  };

  sample.prompt = `请基于侨批档案摘要“${sample.text}”，提取${sample.feature}等文化符号，生成面向${sample.audience}的${sample.format}。叙事重点为${sample.story}，风格要求为${sample.style}。不得虚构具体姓名、地址、汇款金额或亲属关系；涉及个人信息时使用概括表达，并保留档案来源说明和AIGC标识。`;
  sample.risks = [
    "个人信息脱敏",
    "历史事实核验",
    "档案来源标注",
    sample.format.includes("短视频") ? "生成合成内容标识" : "改编边界说明",
  ];
  sample.observations = [
    "观察静态档案到数字内容的转化链路",
    "记录模型输入、提示词、人工修改和输出版本",
    "为后续权属分析与风险识别提供可视样本",
  ];

  state.samples.unshift(sample);
  els.sampleOutput.innerHTML = renderSample(sample);
  field("promptText").value = sample.prompt;
  updateArchive();
}

function renderSample(sample) {
  return `
    <article class="sample-card">
      <div class="sample-poster">
        <strong>${escapeHtml(sample.story)}</strong>
        <span>${escapeHtml(sample.format)}</span>
      </div>
      <div>
        <span class="eyebrow">${escapeHtml(sample.id)}</span>
        <h3>${escapeHtml(sample.audience)}样本方案</h3>
        <p>${escapeHtml(sample.prompt)}</p>
        <div class="tag-row">${sample.risks.map((risk) => `<span class="tag medium">${escapeHtml(risk)}</span>`).join("")}</div>
        <div class="tag-row">${sample.observations.map((item) => `<span class="tag low">${escapeHtml(item)}</span>`).join("")}</div>
      </div>
    </article>
  `;
}

function assessRisk() {
  let score = 0;
  const reasons = [];

  if (!field("authorKnown").checked) {
    score += 2;
    reasons.push("作者身份待核验");
  }
  if (!field("authorDead").checked) {
    score += 1;
    reasons.push("作者生存状态不明确");
  }
  if (!field("hasAgreement").checked) {
    score += 2;
    reasons.push("缺少捐赠或寄存协议");
  }
  if (!field("isPublic").checked) {
    score += 2;
    reasons.push("尚未依法公开");
  }
  if (field("hasPersonalInfo").checked) {
    score += 2;
    reasons.push("含个人信息，需脱敏");
  }
  if (field("hasSensitiveHistory").checked) {
    score += 2;
    reasons.push("存在历史失真风险");
  }
  if (field("commercialUse").checked) {
    score += 1;
    reasons.push("商业使用需提高授权强度");
  }
  if (field("acquireType").value === "来源待核验") {
    score += 3;
    reasons.push("档案来源待核验");
  }
  if (state.mediaAnalyses.some((item) => item.level === "high")) {
    score += 1;
    reasons.push("上传结果含高度疑似AIGC图片");
  }

  let level = "低风险";
  let advice = "可进入AIGC制作，但仍需保留素材来源、提示词和人工修改记录。";
  if (score >= 7) {
    level = "高风险";
    advice = "暂缓进入AIGC制作，优先补齐来源、授权、公开状态和个人信息处理依据。";
  } else if (score >= 3) {
    level = "中风险";
    advice = "建议补充授权材料，并在发布前进行人工复核。";
  }

  els.materialRisk.textContent = level;
  els.materialAdvice.textContent = advice;
  els.riskLabel.textContent = level;
  els.riskReason.textContent = reasons.length ? reasons.slice(0, 3).join("；") : "当前素材条件较完整";
  els.archiveRisk.textContent = level;
  return { level, advice, reasons };
}

function addMaterial() {
  const risk = assessRisk();
  state.materials.unshift({
    title: field("materialTitle").value || "未命名侨批素材",
    year: field("materialYear").value,
    source: field("acquireType").value,
    format: field("sourceFormat").value,
    status: risk.level,
    advice: risk.advice,
  });
  renderMaterials();
  updateArchive();
}

function renderMaterials() {
  if (!state.materials.length) {
    els.materialRows.innerHTML = `<tr><td colspan="4">尚未录入素材。填写档案卡后点击“新增素材”。</td></tr>`;
    return;
  }
  els.materialRows.innerHTML = state.materials
    .map((item) => `
      <tr>
        <td>${escapeHtml(item.title)}</td>
        <td>${escapeHtml(item.source)} · ${escapeHtml(item.format)}</td>
        <td>${escapeHtml(item.status)}</td>
        <td>${escapeHtml(item.advice)}</td>
      </tr>
    `)
    .join("");
}

function analyzeChain() {
  const input = field("chainInput").value;
  const model = field("chainModel").value;
  const output = field("chainOutput").value;
  const nodes = document.querySelectorAll("#flowLane .flow-node strong");
  nodes[0].textContent = input;
  nodes[1].textContent = model;
  nodes[2].textContent = output;

  const risks = [
    { title: "数据输入", body: input.includes("原件") ? "复制、扫描和馆藏开放边界需要先核验。" : "转写或脱敏材料仍需保留来源和处理记录。" },
    { title: "模型处理", body: model.includes("图生图") ? "图像风格迁移可能形成改编或近似表达风险。" : "提示词、模型版本和生成时间需要留痕。" },
    { title: "结果输出", body: output.includes("短视频") ? "视频发布需同时检查AIGC声明、平台条款和字幕翻译。" : "发布版本需标注来源、授权范围和生成合成内容标识。" },
  ];
  state.chainAnalysis = { input, model, output, risks };
  els.chainMatrix.innerHTML = risks.map((item) => `<article class="matrix-card"><strong>${item.title}</strong><p>${item.body}</p></article>`).join("");
  els.archiveChain.textContent = "已分析";
  updateArchive();
}

function updateRights() {
  const selected = [...document.querySelectorAll(".scenario:checked")].map((item) => item.value);
  const rights = selected.map((scenario) => requiredRightsByScenario[scenario]);
  const missing = [];

  if (!field("hasAgreement").checked) missing.push("缺少基础捐赠/寄存协议或权利授权文件");
  if (field("commercialUse").checked && !selected.includes("商业使用许可")) missing.push("商业使用许可未选入");
  if (field("overseasUse").checked && !selected.includes("信息网络传播权")) missing.push("海外网络传播场景缺少信息网络传播权");
  if (selected.includes("翻译权")) missing.push("外语版本需确认翻译权和译文署名方式");
  if (field("hasPersonalInfo").checked) missing.push("授权文件应增加个人信息脱敏与展示范围条款");

  els.neededRights.innerHTML = rights.length ? rights.map((right) => `<li>${escapeHtml(right)}</li>`).join("") : "<li>未选择使用场景</li>";
  els.missingRights.innerHTML = missing.length ? missing.map((item) => `<li>${escapeHtml(item)}</li>`).join("") : "<li>当前场景未发现明显缺口</li>";
  els.rightsLabel.textContent = missing.length ? "需补充" : "基本匹配";
  els.rightsReason.textContent = missing.length ? missing[0] : "可生成授权申请或协议文本";
  els.archiveRights.textContent = missing.length ? "需补充授权" : "已匹配";
}

function generateAgreementText() {
  const selected = [...document.querySelectorAll(".scenario:checked")].map((item) => item.value);
  const rights = selected.map((scenario) => requiredRightsByScenario[scenario]).join("、") || "待确认权限";
  const title = field("projectName").value || "本AIGC项目";
  const unit = field("unitName").value || "馆方";
  const region = field("region").value || "约定传播地区";

  els.agreementText.value = `${unit}同意在“${title}”项目中，按约定范围使用经审核的侨批档案素材。授权范围包括：${rights}。使用方式限于${field("workType").value}制作、必要的格式转换、人工修改、发布前审核和合规存档；传播地区为${region}。项目团队应标注侨批来源，保存AIGC生成记录，按要求完成个人信息脱敏，并在发布版本中声明AIGC辅助生成及保留生成合成内容标识。未经另行书面同意，不得超出本授权目的、期限、地域或商业使用范围。`;
  updateRights();
}

function buildBenefit() {
  const stakeholders = field("stakeholders").value;
  const rule = field("benefitRule").value;
  state.benefitText = `参与主体：${stakeholders}。分配建议：${rule}；侨批馆负责来源标注和发布备案，档案提供方保留撤回或限制展示的沟通渠道，AIGC创作者提交提示词、版本和修改记录，技术平台仅按授权范围处理素材。`;
  els.benefitOutput.className = "release-output";
  els.benefitOutput.innerHTML = `<strong>分配建议已生成</strong><p>${escapeHtml(state.benefitText)}</p>`;
}

function runBorder() {
  const jurisdiction = field("targetJurisdiction").value;
  const platform = field("targetPlatform").value;
  const language = field("publishLanguage").value;
  const items = [
    { title: "审查标准", body: `${jurisdiction}传播场景下，需同步核验版权授权、人格权益、个人信息处理和历史叙事准确性。` },
    { title: "平台责任", body: `${platform}发布前应确认AIGC标识、申诉通道、二次上传条款和素材再利用限制。` },
    { title: "信息披露", body: `${language}版本应保留侨批来源、AIGC辅助生成声明、脱敏说明和馆方授权边界。` },
  ];
  state.borderAnalysis = { jurisdiction, platform, language, items };
  els.borderOutput.innerHTML = items.map((item) => `<article class="compare-card"><strong>${item.title}</strong><p>${item.body}</p></article>`).join("");
  els.borderLabel.textContent = "需复核";
  els.borderReason.textContent = `${jurisdiction} · ${platform}`;
  els.archiveBorder.textContent = "已分析";
  updateArchive();
}

function saveProduction() {
  state.productionSaved = true;
  els.archiveProduction.textContent = "已保存";
  els.productionNotice.textContent = "已保存到档案包";
  updateArchive();
}

async function handleImageFiles(files) {
  const imageFiles = [...files].filter((file) => file.type.startsWith("image/"));
  if (!imageFiles.length) return;
  const scanVersion = ++imageScanVersion;
  els.uploadZone.setAttribute("aria-busy", "true");
  els.mediaSummary.innerHTML = `<strong>正在识别 ${imageFiles.length} 张图片</strong><p>读取文件、解析元数据并抽样分析画面特征。</p>`;

  const analyses = [];
  const failures = [];
  for (const file of imageFiles) {
    try {
      const analysis = await analyzeImage(file);
      if (scanVersion !== imageScanVersion) {
        URL.revokeObjectURL(analysis.previewUrl);
        analyses.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        return;
      }
      analyses.push(analysis);
    } catch {
      if (scanVersion !== imageScanVersion) {
        analyses.forEach((item) => URL.revokeObjectURL(item.previewUrl));
        return;
      }
      failures.push(file.name);
    }
  }
  state.mediaAnalyses.forEach((item) => URL.revokeObjectURL(item.previewUrl));
  state.mediaAnalyses = analyses;
  state.productionSaved = false;
  els.archiveProduction.textContent = "待保存";
  els.productionNotice.textContent = "图片记录已变更";
  els.uploadZone.removeAttribute("aria-busy");
  renderMediaAnalyses();
  assessRisk();
  updateArchive();
  if (failures.length) {
    els.mediaSummary.querySelector("p").textContent += ` 无法读取 ${failures.length} 个文件，请选择有效图片：${failures.join("、")}`;
  }
  window.WorkspaceUI.toast(failures.length ? `${analyses.length} 张已记录，${failures.length} 张无法读取` : `${analyses.length} 张图片已识别并记录`);
}

async function analyzeImage(file) {
  const [imageInfo, rawText] = await Promise.all([loadImageInfo(file), readFileText(file)]);
  const metadata = extractAiMetadata(rawText);
  const visual = imageInfo.canvas ? sampleImageFeatures(imageInfo.canvas) : null;
  const findings = [...metadata.findings];

  if (visual) {
    if (visual.edgeRatio < 0.05 && visual.colorVariance < 23) findings.push("画面纹理较平滑，建议人工核验是否为生成图");
    if (visual.edgeRatio > 0.22 && visual.colorVariance > 58) findings.push("细节边缘密集，需核验文字、手部、纹样等异常");
  }

  const score = metadata.score + (findings.length > metadata.findings.length ? 1 : 0);
  const conclusion = score >= 4 ? "高度疑似AIGC" : score >= 2 ? "疑似含AIGC痕迹" : "未发现明确AIGC痕迹";
  const level = score >= 4 ? "high" : score >= 2 ? "medium" : "low";

  return {
    id: makeId(),
    name: file.name,
    size: file.size,
    type: file.type || "未知类型",
    width: imageInfo.width,
    height: imageInfo.height,
    previewUrl: imageInfo.previewUrl,
    conclusion,
    level,
    metadata: metadata.matches,
    prompt: metadata.prompt,
    findings: findings.length ? findings : ["未读取到生成器、提示词或参数字段"],
    visual,
  };
}

function loadImageInfo(file) {
  return new Promise((resolve, reject) => {
    const previewUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 96;
      canvas.height = 96;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, 96, 96);
      resolve({ width: img.naturalWidth, height: img.naturalHeight, previewUrl, canvas });
    };
    img.onerror = () => {
      URL.revokeObjectURL(previewUrl);
      reject(new Error(`无法解码图片：${file.name}`));
    };
    img.src = previewUrl;
  });
}

async function readFileText(file) {
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let text = "";
  const chunkSize = 16384;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    text += String.fromCharCode(...chunk);
  }
  return text;
}

function extractAiMetadata(text) {
  const patterns = ["Stable Diffusion", "Midjourney", "DALL-E", "DALL·E", "ComfyUI", "Automatic1111", "NovelAI", "InvokeAI", "Civitai", "Leonardo", "Firefly", "AIGC", "AI Generated", "negative prompt", "cfg scale", "sampler", "seed", "model hash", "workflow", "prompt"];
  const matches = patterns.filter((pattern) => text.toLowerCase().includes(pattern.toLowerCase()));
  const findings = [];
  if (matches.some((item) => !["prompt", "negative prompt", "seed"].includes(item.toLowerCase()))) findings.push("发现生成器或工作流标记");
  if (matches.some((item) => ["prompt", "negative prompt", "cfg scale", "sampler", "seed", "model hash"].includes(item.toLowerCase()))) findings.push("发现提示词、种子或采样参数痕迹");
  const prompt = extractPromptSnippet(text);
  if (prompt) findings.push("提取到疑似提示词片段");
  return { matches, findings, prompt, score: matches.length >= 3 ? 4 : matches.length ? 2 : 0 };
}

function extractPromptSnippet(text) {
  const cleaned = text.replace(/[^\x20-\x7e\u4e00-\u9fa5，。；：、（）《》“”]/g, " ");
  const match = cleaned.match(/(?:prompt|Prompt|parameters|Description|UserComment|提示词)\s*[:=]\s*(.{20,360})/);
  return match ? match[1].replace(/\s+/g, " ").trim() : "";
}

function sampleImageFeatures(canvas) {
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const { data, width, height } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  let sumSq = 0;
  let edges = 0;
  const luminance = [];

  for (let i = 0; i < data.length; i += 4) {
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    luminance.push(y);
    sum += y;
    sumSq += y * y;
  }

  for (let y = 1; y < height; y += 1) {
    for (let x = 1; x < width; x += 1) {
      const index = y * width + x;
      const delta = Math.abs(luminance[index] - luminance[index - 1]) + Math.abs(luminance[index] - luminance[index - width]);
      if (delta > 42) edges += 1;
    }
  }

  const total = luminance.length || 1;
  const mean = sum / total;
  const variance = Math.sqrt(Math.max(sumSq / total - mean * mean, 0));
  return { edgeRatio: Number((edges / total).toFixed(3)), colorVariance: Number(variance.toFixed(2)) };
}

function renderMediaAnalyses() {
  if (!state.mediaAnalyses.length) {
    els.mediaSummary.innerHTML = `<strong>尚未上传图片</strong><p>上传后自动扫描 EXIF、XMP、PNG 文本块、生成参数和基础视觉特征。</p>`;
    els.mediaGrid.innerHTML = "";
    return;
  }

  const highCount = state.mediaAnalyses.filter((item) => item.level === "high").length;
  const mediumCount = state.mediaAnalyses.filter((item) => item.level === "medium").length;
  els.mediaSummary.innerHTML = `<strong>已识别 ${state.mediaAnalyses.length} 张图片</strong><p>${highCount} 张高度疑似AIGC，${mediumCount} 张疑似含AIGC痕迹。结果将进入合规档案包。</p>`;
  els.mediaGrid.innerHTML = state.mediaAnalyses.map((item) => {
    const prompt = item.prompt ? `<p><strong>提示词：</strong>${escapeHtml(item.prompt)}</p>` : "";
    const metadata = item.metadata.length ? `<p><strong>命中字段：</strong>${escapeHtml(item.metadata.join("、"))}</p>` : "";
    const visual = item.visual ? `<p><strong>视觉抽样：</strong>边缘 ${item.visual.edgeRatio}，色阶波动 ${item.visual.colorVariance}</p>` : "";
    return `
      <article class="media-card">
        <img src="${item.previewUrl}" alt="${escapeHtml(item.name)}预览" />
        <div>
          <h4>${escapeHtml(item.name)}</h4>
          <p>${item.width} x ${item.height} · ${formatBytes(item.size)} · ${escapeHtml(item.type)}</p>
          <div class="tag-row"><span class="tag ${item.level}">${escapeHtml(item.conclusion)}</span></div>
          ${metadata}${prompt}${visual}
          <div class="tag-row">${item.findings.map((finding) => `<span class="tag">${escapeHtml(finding)}</span>`).join("")}</div>
        </div>
      </article>
    `;
  }).join("");
}

function runDecision() {
  const issues = [];
  if (!field("decisionPublic").checked) issues.push("档案尚未公开");
  if (field("decisionOwner").checked) issues.push("权利主体不明确");
  if (field("decisionTransform").checked) issues.push("涉及改编或二次创作");
  if (field("decisionCommercial").checked) issues.push("存在商业转化");
  if (field("decisionOverseas").checked) issues.push("涉及境外传播");
  if (field("decisionPersonal").checked) issues.push("涉及可识别个人信息");

  let title = "可附条件放行";
  let className = "decision-output";
  if (issues.includes("档案尚未公开") || issues.includes("权利主体不明确")) {
    title = "先补充授权与来源核验";
    className = "decision-output blocked";
  } else if (issues.length >= 3) {
    title = "进入人工复核";
    className = "decision-output review";
  }

  state.decision = { title, issues };
  els.decisionOutput.className = className;
  els.decisionOutput.innerHTML = `<strong>${title}</strong><p>${issues.length ? issues.join("；") : "当前条件较完整"}。建议同步保存审核表、授权文件、制作记录和发布版本。</p>`;
}

function buildLegalPrompt() {
  const title = field("projectName").value;
  const material = field("materialTitle").value;
  els.legalPrompt.value = `请作为侨批AIGC合规审查智能体，审查项目“${title}”。素材为“${material}”，拟发布平台为“${field("platform").value}”，传播地区为“${field("region").value}”。请按以下维度输出：1. 档案开放与来源核验；2. 著作权权属与授权范围；3. 个人信息脱敏；4. AIGC生成链路记录；5. 海外平台条款与跨境传播风险；6. 发布前必须补齐的材料清单。输出结论需分为可发布、补充材料后发布、人工复核、暂缓发布四类。`;
}

function runReleaseCheck() {
  const checks = [...document.querySelectorAll("#releaseChecks input")];
  const total = checks.length;
  const done = checks.filter((item) => item.checked).length;
  const missingLabels = checks.filter((item) => !item.checked).map((item) => item.parentElement.textContent.trim());
  els.releaseOutput.classList.remove("blocked", "review");

  if (done === total) {
    state.releaseStatus = "检查通过";
    els.releaseOutput.innerHTML = `<strong>检查通过</strong><p>可导出合规档案包，并保留审核表、授权文件、制作记录、发布版本和风险提示。</p>`;
  } else if (missingLabels.includes("已完成个人信息脱敏") || missingLabels.includes("已声明使用AIGC") || missingLabels.includes("已保留生成合成内容标识")) {
    state.releaseStatus = "需整改";
    els.releaseOutput.classList.add("blocked");
    els.releaseOutput.innerHTML = `<strong>需整改后发布</strong><p>缺少关键发布条件：${missingLabels.join("；")}。</p>`;
  } else {
    state.releaseStatus = "人工复核";
    els.releaseOutput.classList.add("review");
    els.releaseOutput.innerHTML = `<strong>建议人工复核</strong><p>待确认事项：${missingLabels.join("；")}。</p>`;
  }

  els.releaseLabel.textContent = state.releaseStatus;
  els.releaseReason.textContent = done === total ? "全部检查项已完成" : `已完成 ${done}/${total} 项`;
  updateArchive();
}

function exportArchive() {
  assessRisk();
  updateRights();
  const archive = {
    projectId: els.projectId.textContent,
    projectName: field("projectName").value,
    unitName: field("unitName").value,
    ownerName: field("ownerName").value,
    workType: field("workType").value,
    platform: field("platform").value,
    region: field("region").value,
    commercialUse: field("commercialUse").checked,
    overseasUse: field("overseasUse").checked,
    samples: state.samples,
    materials: state.materials,
    risk: els.riskLabel.textContent,
    chainAnalysis: state.chainAnalysis,
    rightsStatus: els.rightsLabel.textContent,
    agreementText: els.agreementText.value,
    benefitText: state.benefitText,
    borderAnalysis: state.borderAnalysis,
    decision: state.decision,
    production: {
      modelName: field("modelName").value,
      generateTime: field("generateTime").value,
      creators: field("creators").value,
      extraProtected: field("extraProtected").value,
      promptText: field("promptText").value,
      revisionText: field("revisionText").value,
      mediaAnalyses: state.mediaAnalyses.map(({ previewUrl, ...item }) => item),
      saved: state.productionSaved,
    },
    releaseStatus: state.releaseStatus,
    legalPrompt: els.legalPrompt.value,
    exportedAt: new Date().toLocaleString("zh-CN"),
  };

  const blob = new Blob([JSON.stringify(archive, null, 2)], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${archive.projectId}-合规档案包.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function updateArchive() {
  els.archiveSample.textContent = state.samples.length ? `${state.samples.length}个样本` : "待生成";
  els.archiveReview.textContent = state.materials.length ? `${state.materials.length}份素材` : "待录入";
  els.archiveChain.textContent = state.chainAnalysis ? "已分析" : "待分析";
  els.archiveBorder.textContent = state.borderAnalysis ? "已分析" : "待分析";
  els.archiveMedia.textContent = state.mediaAnalyses.length ? `${state.mediaAnalyses.length}张已识别` : "待上传";
  els.archiveRisk.textContent = els.riskLabel.textContent;
  window.WorkspaceUI.syncStats(state);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function makeId() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function setDefaultTime() {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  field("generateTime").value = now.toISOString().slice(0, 16);
}

function bindEvents() {
  q("#stepNav").addEventListener("click", (event) => {
    const button = event.target.closest(".nav-item");
    if (button) showStep(button.dataset.step);
  });

  document.querySelectorAll("[data-jump]").forEach((button) => {
    button.addEventListener("click", () => showStep(button.dataset.jump));
  });

  q("#refreshId").addEventListener("click", generateProjectId);
  q("#buildSample").addEventListener("click", buildSample);
  q("#addMaterial").addEventListener("click", addMaterial);
  q("#analyzeChain").addEventListener("click", analyzeChain);
  q("#generateAgreement").addEventListener("click", generateAgreementText);
  q("#buildBenefit").addEventListener("click", buildBenefit);
  q("#runBorder").addEventListener("click", runBorder);
  q("#saveProduction").addEventListener("click", saveProduction);
  q("#runDecision").addEventListener("click", runDecision);
  q("#buildLegalPrompt").addEventListener("click", buildLegalPrompt);
  q("#runReleaseCheck").addEventListener("click", runReleaseCheck);
  q("#exportArchive").addEventListener("click", exportArchive);
  q("#clearImages").addEventListener("click", () => {
    imageScanVersion += 1;
    els.uploadZone.removeAttribute("aria-busy");
    state.mediaAnalyses.forEach((item) => URL.revokeObjectURL(item.previewUrl));
    state.mediaAnalyses = [];
    els.imageUpload.value = "";
    state.productionSaved = false;
    els.archiveProduction.textContent = "待保存";
    els.productionNotice.textContent = "图片记录已变更";
    renderMediaAnalyses();
    assessRisk();
    updateArchive();
  });

  els.imageUpload.addEventListener("change", (event) => handleImageFiles(event.target.files));
  els.uploadZone.addEventListener("dragover", (event) => {
    event.preventDefault();
    els.uploadZone.classList.add("dragging");
  });
  els.uploadZone.addEventListener("dragleave", () => els.uploadZone.classList.remove("dragging"));
  els.uploadZone.addEventListener("drop", (event) => {
    event.preventDefault();
    els.uploadZone.classList.remove("dragging");
    handleImageFiles(event.dataTransfer.files);
  });

  ["authorKnown", "authorDead", "hasAgreement", "isPublic", "hasPersonalInfo", "hasSensitiveHistory", "commercialUse", "overseasUse", "acquireType"].forEach((id) => {
    field(id).addEventListener("change", () => {
      assessRisk();
      updateRights();
    });
  });

  document.querySelectorAll(".scenario").forEach((item) => item.addEventListener("change", updateRights));
  field("projectName").addEventListener("input", () => window.WorkspaceUI.syncStats(state));
}

bindEvents();
setDefaultTime();
assessRisk();
updateRights();
generateAgreementText();
renderMaterials();
analyzeChain();
runBorder();
runDecision();
buildLegalPrompt();
updateArchive();
window.WorkspaceUI.init();
