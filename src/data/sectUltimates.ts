import { SectId } from './sect';

export interface SectUltimateDefinition {
  id: string;
  sectId: SectId;
  name: string;
  description: string;
  cooldownSeconds: number;
  durationSeconds: number;
}

export const SECT_ULTIMATES: SectUltimateDefinition[] = [
  {
    id: 'ult_sword', sectId: 'sect_sword', name: '万剑归宗',
    description: '下一次战斗必定暴击，暴击伤害 ×1.5',
    cooldownSeconds: 300, durationSeconds: 0,
  },
  {
    id: 'ult_pill', sectId: 'sect_pill', name: '炉火纯青',
    description: '下一次炼丹必定成功，且产出 +2',
    cooldownSeconds: 600, durationSeconds: 0,
  },
  {
    id: 'ult_body', sectId: 'sect_body', name: '金刚不坏',
    description: '接下来 60 秒内，战斗所受伤害 -50%',
    cooldownSeconds: 300, durationSeconds: 60,
  },
  {
    id: 'ult_spirit', sectId: 'sect_spirit', name: '天人合一',
    description: '接下来 30 秒内，修炼速度 ×2.0',
    cooldownSeconds: 900, durationSeconds: 30,
  },
  {
    id: 'ult_fortune', sectId: 'sect_fortune', name: '福星高照',
    description: '接下来 3 场战斗，掉落率 +50%',
    cooldownSeconds: 600, durationSeconds: 0,
  },
];

export function getSectUltimate(sectId: SectId): SectUltimateDefinition | undefined {
  return SECT_ULTIMATES.find(u => u.sectId === sectId);
}
