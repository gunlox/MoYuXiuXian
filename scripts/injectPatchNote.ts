/**
 * Vite 插件：在 build 产物中注入版本更新弹窗
 * 仅在 build 时生效，不影响工程源码和开发模式
 */
import type { Plugin } from 'vite';

const PATCH_NOTES = [
  { title: '🏯 v3.6.0 门派深度化系统上线', items: [
    '拜入门派后可在"门派"页签接取日常任务和成长任务',
    '完成任务获得门派贡献，贡献累积提升门派等级（最高5级），解锁里程碑被动加成',
    '五大门派各有独特被动方向：剑宗（攻暴）、丹宗（炼丹/修炼）、体修宗（防御/生命）、灵宗（修炼/突破）、福地宗（掉落/秘境）',
  ]},
  { title: '📋 v3.6.0 门派任务系统', items: [
    '每日刷新2个日常任务，完成战斗、突破、炼丹、秘境等活动即可推进进度',
    '成长任务为一次性里程碑目标，达标后可领取大量贡献奖励',
    '任务进度与战斗、突破、炼丹、秘境等系统自动联动',
  ]},
  { title: '🌟 v3.6.0 仙缘公式修复', items: [
    '修复转生仙缘计算因 floor 向下取整导致转生次数加成被吞的问题',
    '改用 ceil 向上取整，确保每次转生都能获得更多仙缘',
  ]},
  { title: '📖 v3.6.0 新手引导更新', items: [
    '新手引导"选择门派"步骤新增门派成长系统说明（任务→贡献→等级→被动）',
    '结尾步骤新增提醒：别忘了每天去门派页签完成日常任务',
  ]},
];

function buildPatchHTML(versionLabel: string, storageKey: string): string {
  const sectionsHTML = PATCH_NOTES.map(s => `
    <div style="margin-bottom:18px;">
      <div style="font-size:15px;font-weight:bold;color:#f5c842;margin-bottom:8px;font-family:KaiTi,STKaiti,serif;">${s.title}</div>
      <ul style="margin:0;padding-left:18px;">
        ${s.items.map(i => `<li style="color:#d4c9a8;font-size:13px;margin-bottom:5px;line-height:1.6;">${i}</li>`).join('')}
      </ul>
    </div>
  `).join('');

  return `
<div id="__patch_overlay__" style="
  position:fixed;inset:0;z-index:99999;
  background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);
  display:flex;align-items:center;justify-content:center;">
  <div style="
    background:linear-gradient(135deg,#1a1a2e,#16213e);
    border:1px solid rgba(245,200,66,0.35);border-radius:16px;
    padding:28px 32px;max-width:560px;width:90%;
    max-height:80vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,0.6);">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">
      <div>
        <div style="font-size:20px;font-weight:bold;color:#f5c842;font-family:KaiTi,STKaiti,serif;">摸鱼修仙 ${versionLabel} 更新日志</div>
        <div style="font-size:12px;color:#8a8a9a;margin-top:4px;">2026-04-04</div>
      </div>
      <div style="
        background:rgba(245,200,66,0.15);border:1px solid rgba(245,200,66,0.3);
        border-radius:20px;padding:4px 14px;font-size:12px;color:#f5c842;">${versionLabel}</div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,0.08);padding-top:18px;">
      ${sectionsHTML}
    </div>
    <div style="text-align:center;margin-top:8px;">
      <button onclick="
        document.getElementById('__patch_overlay__').remove();
        localStorage.setItem('${storageKey}','1');
      " style="
        background:linear-gradient(to right,#f5c842,#d4a017);
        color:#1a1200;border:none;border-radius:8px;
        padding:10px 36px;font-size:14px;font-weight:bold;
        cursor:pointer;font-family:KaiTi,STKaiti,serif;
        transition:opacity 0.2s;"
        onmouseover="this.style.opacity='0.85'"
        onmouseout="this.style.opacity='1'">
        知道了，开始修仙！
      </button>
    </div>
  </div>
</div>
<script>
(function(){
  if(localStorage.getItem('${storageKey}')){
    var el=document.getElementById('__patch_overlay__');
    if(el) el.remove();
  }
})();
</script>`;
}

export function injectPatchNote(version: string): Plugin {
  const versionLabel = `v${version}`;
  const storageKey = `moyu_patch_seen_${versionLabel}`;
  return {
    name: 'inject-patch-note',
    apply: 'build',
    transformIndexHtml(html: string) {
      return html.replace('</body>', buildPatchHTML(versionLabel, storageKey) + '\n</body>');
    },
  };
}
