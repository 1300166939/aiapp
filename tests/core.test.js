const assert = require("node:assert/strict");
const core = require("../src/core.js");

const state = {
  title: "stage 环境 userId is required 失败诊断",
  project: "星球",
  module: "次元空间",
  env: "stage",
  caseNum: "3",
  apiPath: "/study-growth/user/level",
  failureText: "接口返回 userId is required",
  riskType: "missing_required_param",
  evidence: [
    {
      evidence: "FailureDiagnosisService 会先查事实表。",
      source: "failure_diagnosis_service.py",
      supports: "不是纯 LLM 猜测。",
      confidence: "高",
      confirmation: "否"
    },
    {
      evidence: "database_modified=false。",
      source: "test_failure_diagnosis_service.py",
      supports: "不默认改库。",
      confidence: "高",
      confirmation: "否"
    },
    {
      evidence: "周报记录已完成失败诊断 v2。",
      source: "docs/test-knowledge-base-weekly-notes-2026-06-11.md",
      supports: "来自真实项目。",
      confidence: "高",
      confirmation: "否"
    }
  ],
  draft: "初步判断缺少 userId。",
  runLog: "py_compile OK。",
  correction: "不能直接改库。",
  updateLog: "更新 Skill 规则。",
  recheck: "静态复验通过。",
  codexCan: "读取代码；建立证据链；生成报告",
  humanMust: "确认 userId 是否有效；确认是否改库；确认是否重跑"
};

const quality = core.evaluateQuality(state);
assert.equal(quality.every((item) => item.passed), true);

const markdown = core.generateMarkdown(state);
assert.match(markdown, /stage 环境 userId is required 失败诊断/);
assert.match(markdown, /FailureDiagnosisService 会先查事实表/);
assert.match(markdown, /必须人工判断/);
assert.match(markdown, /缺少必填参数/);

const lines = core.normalizeLines("A；B;C\nD");
assert.deepEqual(lines, ["A", "B", "C", "D"]);

console.log("core tests OK");
