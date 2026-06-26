const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => Array.from(document.querySelectorAll(selector));

const sampleEvidence = [
  {
    evidence: "FailureDiagnosisService 会先查询 testcase、testresult、paramDependences、testsuitlist、configinfo_v1。",
    source: "TesttoolPlatformAPI/ApiTestWeb/test_knowledge/services/failure_diagnosis_service.py",
    supports: "诊断流程不是纯 LLM 猜测，而是先取平台事实。",
    confidence: "高",
    confirmation: "否"
  },
  {
    evidence: "缺少 userId 会被识别为 missing_required_param，且 database_modified=false。",
    source: "TesttoolPlatformAPI/ApiTestWeb/test_knowledge/tests/test_failure_diagnosis_service.py",
    supports: "Codex 可以提出修复建议，但不能默认改库。",
    confidence: "高",
    confirmation: "需要确认真实 userId"
  },
  {
    evidence: "周报记录失败诊断已从纯 RAG 调整为实时数据库事实 + 规则诊断 + RAG 历史经验。",
    source: "docs/test-knowledge-base-weekly-notes-2026-06-11.md",
    supports: "APP 选题来自真实业务进展。",
    confidence: "高",
    confirmation: "否"
  }
];

function createEvidenceRow(item = {}) {
  const row = document.createElement("div");
  row.className = "evidence-row";
  row.innerHTML = `
    <label>证据<input data-field="evidence" value="${escapeHtml(item.evidence || "")}" /></label>
    <label>来源<input data-field="source" value="${escapeHtml(item.source || "")}" /></label>
    <label>支持判断<input data-field="supports" value="${escapeHtml(item.supports || "")}" /></label>
    <label>可信度
      <select data-field="confidence">
        ${["高", "中", "低"].map((value) => `<option ${value === (item.confidence || "高") ? "selected" : ""}>${value}</option>`).join("")}
      </select>
    </label>
    <label>人工确认<input data-field="confirmation" value="${escapeHtml(item.confirmation || "否")}" /></label>
    <button class="icon-button remove-row" type="button" title="删除证据">×</button>
  `;
  row.querySelector(".remove-row").addEventListener("click", () => {
    row.remove();
    renderQuality();
  });
  row.addEventListener("input", renderQuality);
  row.addEventListener("change", renderQuality);
  return row;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function collectState() {
  return {
    title: $("#title").value.trim(),
    project: $("#project").value.trim(),
    module: $("#module").value.trim(),
    env: $("#env").value,
    caseNum: $("#caseNum").value.trim(),
    apiPath: $("#apiPath").value.trim(),
    failureText: $("#failureText").value.trim(),
    evidence: $$("#evidenceRows .evidence-row").map((row) => {
      const item = {};
      row.querySelectorAll("[data-field]").forEach((field) => {
        item[field.dataset.field] = field.value.trim();
      });
      return item;
    }),
    draft: $("#draft").value.trim(),
    runLog: $("#runLog").value.trim(),
    correction: $("#correction").value.trim(),
    updateLog: $("#updateLog").value.trim(),
    recheck: $("#recheck").value.trim(),
    codexCan: $("#codexCan").value.trim(),
    humanMust: $("#humanMust").value.trim(),
    riskType: $(".risk.is-selected")?.dataset.risk || "missing_required_param"
  };
}

function renderQuality() {
  const quality = ReportStudioCore.evaluateQuality(collectState());
  $("#qualityChecklist").innerHTML = quality
    .map((item) => `<li class="${item.passed ? "passed" : ""}"><span>${item.passed ? "✓" : "!"}</span>${item.label}</li>`)
    .join("");
}

function loadSample() {
  $("#evidenceRows").innerHTML = "";
  sampleEvidence.forEach((item) => $("#evidenceRows").appendChild(createEvidenceRow(item)));
  $("#generateReport").click();
  renderQuality();
}

function switchPanel(id) {
  $$(".step").forEach((button) => button.classList.toggle("is-active", button.dataset.step === id));
  $$(".panel").forEach((panel) => panel.classList.toggle("active-panel", panel.id === id));
}

function saveCase() {
  localStorage.setItem("report-studio-draft", JSON.stringify(collectState()));
  $("#saveCase").textContent = "已保存";
  setTimeout(() => {
    $("#saveCase").textContent = "保存草稿";
  }, 1200);
}

function restoreCase() {
  const raw = localStorage.getItem("report-studio-draft");
  if (!raw) return false;
  try {
    const state = JSON.parse(raw);
    ["title", "project", "module", "env", "caseNum", "apiPath", "failureText", "draft", "runLog", "correction", "updateLog", "recheck", "codexCan", "humanMust"].forEach((id) => {
      if (state[id] !== undefined && $("#" + id)) $("#" + id).value = state[id];
    });
    $("#evidenceRows").innerHTML = "";
    (state.evidence || []).forEach((item) => $("#evidenceRows").appendChild(createEvidenceRow(item)));
    $$(".risk").forEach((button) => button.classList.toggle("is-selected", button.dataset.risk === state.riskType));
    return true;
  } catch {
    return false;
  }
}

function downloadMarkdown(markdown) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "test-knowledge-diagnosis-report.md";
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  $$(".step").forEach((button) => button.addEventListener("click", () => switchPanel(button.dataset.step)));
  $$(".risk").forEach((button) => {
    button.addEventListener("click", () => {
      $$(".risk").forEach((item) => item.classList.remove("is-selected"));
      button.classList.add("is-selected");
      renderQuality();
    });
  });
  $$("input, textarea, select").forEach((element) => element.addEventListener("input", renderQuality));
  $("#addEvidence").addEventListener("click", () => {
    $("#evidenceRows").appendChild(createEvidenceRow());
    renderQuality();
  });
  $("#loadSample").addEventListener("click", loadSample);
  $("#saveCase").addEventListener("click", saveCase);
  $("#generateReport").addEventListener("click", () => {
    $("#reportOutput").value = ReportStudioCore.generateMarkdown(collectState());
    renderQuality();
  });
  $("#copyReport").addEventListener("click", async () => {
    const text = $("#reportOutput").value || ReportStudioCore.generateMarkdown(collectState());
    $("#reportOutput").value = text;
    await navigator.clipboard.writeText(text);
    $("#copyReport").textContent = "已复制";
    setTimeout(() => {
      $("#copyReport").textContent = "复制 Markdown";
    }, 1200);
  });
  $("#downloadReport").addEventListener("click", () => {
    const text = $("#reportOutput").value || ReportStudioCore.generateMarkdown(collectState());
    downloadMarkdown(text);
  });
}

bindEvents();
if (!restoreCase()) {
  loadSample();
}
renderQuality();
