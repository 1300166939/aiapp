(function attachCore(global) {
  const riskLabels = {
    missing_required_param: "缺少必填参数",
    invalid_or_expired_params: "参数失效或接口参数变化",
    backend_issue: "后端服务问题",
    dependency_or_order: "参数依赖或测试集顺序问题"
  };

  const acceptanceRules = [
    {
      id: "real-business",
      label: "真实业务问题",
      test: (state) => Boolean(state.project && state.module && state.apiPath && state.failureText)
    },
    {
      id: "evidence",
      label: "证据链不少于 3 条",
      test: (state) => state.evidence.filter((item) => item.evidence && item.source).length >= 3
    },
    {
      id: "loop",
      label: "闭环记录完整",
      test: (state) => Boolean(state.draft && state.runLog && state.correction && state.updateLog && state.recheck)
    },
    {
      id: "boundary",
      label: "人机边界清楚",
      test: (state) => Boolean(state.codexCan && state.humanMust)
    },
    {
      id: "risk",
      label: "风险类型已标注",
      test: (state) => Boolean(state.riskType)
    }
  ];

  function normalizeLines(value) {
    return String(value || "")
      .split(/\n|；|;/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function buildEvidenceTable(evidence) {
    const rows = evidence
      .filter((item) => item.evidence || item.source || item.supports)
      .map((item) => `| ${item.evidence || "待补充"} | ${item.source || "待补充"} | ${item.supports || "待补充"} | ${item.confidence || "中"} | ${item.confirmation || "待确认"} |`);

    return [
      "| 证据 | 来源 | 支持什么判断 | 可信度 | 是否需人工确认 |",
      "|---|---|---|---|---|",
      ...(rows.length ? rows : ["| 待补充 | 待补充 | 待补充 | 中 | 是 |"])
    ].join("\n");
  }

  function evaluateQuality(state) {
    return acceptanceRules.map((rule) => ({
      id: rule.id,
      label: rule.label,
      passed: rule.test(state)
    }));
  }

  function generateMarkdown(state) {
    const riskLabel = riskLabels[state.riskType] || state.riskType || "待判断";
    const codexItems = normalizeLines(state.codexCan);
    const humanItems = normalizeLines(state.humanMust);

    return `# ${state.title || "自动化测试失败诊断报告"}

## 1. 原始需求

基于真实自动化测试平台失败场景，生成一份可复用的 Codex 诊断报告。报告需要覆盖原始问题、证据链、初稿-运行-纠偏-更新-复验闭环，以及哪些动作可以交给 Codex、哪些必须人工判断。

## 2. 业务上下文

- 项目：${state.project || "待补充"}
- 模块：${state.module || "待补充"}
- 环境：${state.env || "待补充"}
- caseNum：${state.caseNum || "待补充"}
- API Path：${state.apiPath || "待补充"}
- 失败现象：${state.failureText || "待补充"}
- 风险类型：${riskLabel}

## 3. MVP 版本

本 APP 的 MVP 目标是让测试同学在一个页面内完成诊断报告产出：

1. 录入失败上下文。
2. 补充证据链。
3. 记录初稿-运行-纠偏-更新-复验过程。
4. 标注 Codex 与人工判断边界。
5. 导出 Markdown 报告。

## 4. 证据链

${buildEvidenceTable(state.evidence)}

## 5. 初稿 - 运行 - 纠偏 - 更新 - 复验

### 初稿判断

${state.draft || "待补充"}

### 运行记录

${state.runLog || "待补充"}

### 纠偏记录

${state.correction || "待补充"}

### 更新内容

${state.updateLog || "待补充"}

### 复验结果

${state.recheck || "待补充"}

## 6. Codex 可处理 / 人工必须判断

### 可以交给 Codex

${codexItems.map((item) => `- ${item}`).join("\n") || "- 待补充"}

### 必须人工判断

${humanItems.map((item) => `- ${item}`).join("\n") || "- 待补充"}

## 7. 验收标准

${evaluateQuality(state).map((item) => `- ${item.passed ? "[x]" : "[ ]"} ${item.label}`).join("\n")}

## 8. 沉淀的项目 Skill

本项目沉淀的 Skill 是 \`report-studio\`，核心规则是：

- 先拿证据，再写结论。
- 不把 RAG 或 LLM 猜测当作事实。
- 所有改库、重跑、调整依赖、上线判断都必须人工确认。
- 每次诊断都保留初稿、运行、纠偏、更新、复验记录。
`;
  }

  const api = {
    riskLabels,
    acceptanceRules,
    normalizeLines,
    buildEvidenceTable,
    evaluateQuality,
    generateMarkdown
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }
  global.ReportStudioCore = api;
})(typeof window !== "undefined" ? window : globalThis);
