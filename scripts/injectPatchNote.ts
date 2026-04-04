/**
 * Vite 插件：在 build 产物中注入版本更新弹窗
 * 仅在 build 时生效，不影响工程源码和开发模式
 */
import type { Plugin } from 'vite';

const PATCH_NOTES = [
  { title: '⚔️ v3.5.0 装备战力显示上线', items: [
    '装备面板现已新增“装备战力”显示，已穿戴与背包装备都可直接查看单件评分',
    '背包装备会与当前同槽位已穿戴装备显示战力差值，支持 ↑+X / ↓-X / ≈0 / 可装备 提示',
    '装备战力只计算装备基础属性与词条属性，不再受强化等级、轮回次数与修炼速度词条影响',
  ]},
  { title: '📊 v3.5.0 角色战力口径统一', items: [
    '角色属性面板中的战力现统一走公共公式：攻击 + 防御 + 气血/10',
    '明确区分“装备战力”和“角色战力”两套概念，避免玩家将单件评分与整体角色强度混淆',
  ]},
  { title: '🧪 v3.5.0 文档与稳定性补强', items: [
    '新增装备战力功能的策划文档、开发文档与 checklist 文档，方便后续继续迭代和验收',
    '补充装备战力相关自动化测试，并修复装备战力曾错误受轮回倍率影响的口径问题',
  ]},
  { title: '🧰 v3.4.5 装备与功法体验优化', items: [
    '装备背包新增“立即分解”按钮，可按当前勾选的自动分解品质，立即批量分解背包内对应装备',
    '立即分解会一次性结算所有目标装备的灵石与碎片收益，并在日志中汇总显示本次批量分解结果',
    '功法背包排序优化：默认按功法品阶排序，已满级功法统一下沉到列表后部，同品阶未满级功法按已修炼等级从高到低排列',
  ]},
  { title: '🐛 v3.4.3 离线收益弹窗修复', items: [
    '修复离线收益弹窗中修为、灵草、碎片、装备数量等数值来回跳动的问题',
    '原因：离线收益计算（含随机掉落）在每次组件渲染时被重复调用，现改为仅在首次挂载时计算一次并缓存结果',
  ]},
  { title: '📄 v3.4.2 文档与版本同步', items: [
    '开发者文档已按当前代码实现做全文更新，系统结构、数值口径、模块职责与现有实现保持一致',
    '同步校正文档中的构建命名、区域/秘境数量、属性公式与装备/丹药/轮回等章节描述',
    '正式发版版本号更新为 v3.4.2，并继续按规范输出单 HTML 构建产物',
  ]},
  { title: '�🚑 v3.4.1 紧急修复', items: [
    '修复手动分解装备时点击无反馈后连续点按，可能导致同一件装备被重复结算的问题',
    '分解按钮现增加处理中禁用态，并在状态更新时校验装备是否仍在背包中，避免重复发放奖励',
    '修复暴击率/暴击伤害/闪避百分比词条错误沿用主属性倍率链路，导致数值严重超标的问题',
    '炼丹配方列表新增适用境界/推荐境界标注，帮助玩家判断不同阶段的丹药使用范围',
  ]},
  { title: '🧩 v3.4.0 构建与版本同步', items: [
    '版本号已统一以 package.json 为唯一来源，右下角版本、更新弹窗与构建产物文件名自动同步',
    '正式发版版本现更新为 v3.4.2，构建产物继续按规范名称自动输出',
  ]},
  { title: '⚔️ v3.4.0 战斗与离线体验优化', items: [
    '战斗日志改为逐条播放，每回合信息与血条状态按步骤展示，不再整场战斗结束后一次性刷出',
    '离线收益弹窗新增恢复体力显示，帮助玩家确认秘境体力在离线期间的恢复结果',
  ]},
  { title: '🎒 v3.4.0 成长与界面细节优化', items: [
    '修炼速度 expRate 词条新增 0.01% 真实生效下限，并提升显示精度，避免出现 0.0% 假零值',
    '成就列表支持可领取自动置顶、领取后下沉；丹药衰减提示改为“丹药效果-xx%”，BUFF 倒计时统一为整数秒',
  ]},
  { title: '🐛 v3.4.0 兼容与显示修复', items: [
    '激活中的丹药BUFF颜色现与丹药品质一致，视觉反馈与背包保持统一',
    '补充高进阶区域掉装链路测试，确认不会回退到低境界装备模板；同步清理部分冗余显示逻辑',
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
        <div style="font-size:12px;color:#8a8a9a;margin-top:4px;">2026-04-01</div>
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
