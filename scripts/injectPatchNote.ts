/**
 * Vite 插件：在 build 产物中注入版本更新弹窗
 * 仅在 build 时生效，不影响工程源码和开发模式
 */
import type { Plugin } from 'vite';

const PATCH_NOTES = [
  { title: '🏯 v3.7.0 门派优化二期', items: [
    '门派等级上限扩展至10级，新增Lv.3/Lv.6~10共25个里程碑被动',
    '六种全新机制型被动：剑宗额外掉落、丹宗双倍炼丹、体修宗浴血奋战/不灭金身、灵宗突破保护、福地宗双倍功法',
    '五大门派满级解锁专属"绝学"主动技能：万剑归宗、炉火纯青、金刚不坏、天人合一、福星高照',
    '日常任务池扩充至22+，成长任务每门派≥5个',
  ]},
  { title: '⚔️ v3.7.0 门派试炼塔', items: [
    '门派Lv.3解锁50层试炼塔爬塔挑战，每5层设守关Boss',
    '每日3次挑战机会，失败不扣次数，30秒冷却后可重试',
    '首次通关奖励贡献+灵石+丹药+功法，最高层数每日发放修炼Buff',
    '试炼塔Boss属性独立于玩家境界，纯实力检验',
  ]},
  { title: '🛒 v3.7.0 贡献商店 & 轮回传承', items: [
    '门派Lv.2解锁贡献商店，日刷新6件商品，含门派专属卷轴',
    '消费贡献不降低门派等级，灵活消费更自由',
    '轮回后门派贡献按比例继承，已解锁被动与试炼塔记录保留',
    '5转以上可"转世投胎"更换门派，保留前世被动形成混合流派',
  ]},
  { title: '🔧 v3.7.0 问题修复', items: [
    '修复Lv.3空等级无被动的问题——五大門派新增对应Lv.3被动',
    '门派升级时新增即时资源奖励（灵石/丹药/装备/修为/灵草）',
    '灵宗Lv.5离线加成从5%上调至8%，修复离线收益计算',
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
        <div style="font-size:12px;color:#8a8a9a;margin-top:4px;">2026-04-27</div>
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
