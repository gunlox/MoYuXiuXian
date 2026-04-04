import { Monster, Drop } from '../data/monsters';
import { Attributes, BonusAttributes } from '../data/realms';
import { formatNumber } from '../utils/format';

/** 战斗日志条目 */
export interface BattleLogEntry {
  text: string;
  type: 'info' | 'player_attack' | 'monster_attack' | 'victory' | 'defeat' | 'drop';
  playerHpBar?: { current: number; max: number } | null;
}

/** 战斗结果 */
export interface BattleResult {
  victory: boolean;
  rounds: number;
  logs: BattleLogEntry[];
  expGained: number;
  drops: { name: string; type: Drop['type']; amount: number }[];
  playerHpRemaining: number;
  playerHpMax: number;
}

/** 执行一场自动战斗 */
export function executeBattle(
  playerAttrs: Attributes,
  bonusAttrs: BonusAttributes,
  monster: Monster,
  options?: { captureLogs?: boolean; dropBonus?: number },
): BattleResult {
  const captureLogs = options?.captureLogs ?? true;
  const logs: BattleLogEntry[] = [];
  const drops: { name: string; type: Drop['type']; amount: number }[] = [];

  // 随机实例化怪物属性（攻击与血量独立随机）
  const instAtk = Math.floor(monster.attackMin + Math.random() * (monster.attackMax - monster.attackMin + 1));
  const instHp  = Math.floor(monster.hpMin  + Math.random() * (monster.hpMax  - monster.hpMin  + 1));
  const instDef = monster.defense;

  let playerHp = playerAttrs.hp;
  const playerMaxHp = playerAttrs.hp;
  let monsterHp = instHp;
  let round = 0;
  const maxRounds = 50;

  if (captureLogs) {
    logs.push({
      text: `遇遇【${monster.name}】！(攻${formatNumber(instAtk)} 防${formatNumber(instDef)} 血${formatNumber(instHp)})`,
      type: 'info',
      playerHpBar: { current: playerHp, max: playerMaxHp },
    });
  }

  while (playerHp > 0 && monsterHp > 0 && round < maxRounds) {
    round++;

    // 玩家攻击：基础伤害
    const baseDmg = Math.max(
      Math.floor(playerAttrs.attack - monster.defense * 0.5),
      Math.floor(playerAttrs.attack * 0.1)
    );
    // 暴击判断
    const isCrit = Math.random() < bonusAttrs.critRate;
    const totalPlayerDmg = isCrit
      ? Math.floor(baseDmg * (1 + bonusAttrs.critDmg))
      : baseDmg;
    monsterHp -= totalPlayerDmg;

    if (captureLogs) {
      logs.push({
        text: isCrit
          ? `第${round}回合：【暴击】！造成 ${formatNumber(totalPlayerDmg)} 点伤害`
          : `第${round}回合：你出手，造成 ${formatNumber(totalPlayerDmg)} 点伤害`,
        type: 'player_attack',
        playerHpBar: { current: playerHp, max: playerMaxHp },
      });
    }

    if (monsterHp <= 0) break;

    // 怪物攻击（先判断闪避）
    const dodged = Math.random() < bonusAttrs.dodge;
    if (dodged) {
      if (captureLogs) {
        logs.push({
          text: `第${round}回合：你闪避了【${monster.name}】的攻击！`,
          type: 'player_attack',
          playerHpBar: { current: playerHp, max: playerMaxHp },
        });
      }
    } else {
      const monsterDmg = Math.max(
        Math.floor(instAtk - playerAttrs.defense * 0.5),
        Math.floor(instAtk * 0.1)
      );
      playerHp -= monsterDmg;
      if (captureLogs) {
        logs.push({
          text: `第${round}回合：【${monster.name}】攻击，造成 ${formatNumber(monsterDmg)} 点伤害 (剩余气血 ${formatNumber(Math.max(0, playerHp))}/${formatNumber(playerMaxHp)})`,
          type: 'monster_attack',
          playerHpBar: { current: Math.max(0, playerHp), max: playerMaxHp },
        });
      }
    }

    if (playerHp <= 0) break;
  }

  const victory = monsterHp <= 0;

  if (victory) {
    if (captureLogs) {
      logs.push({
        text: `🎉 击败【${monster.name}】！用时${round}回合`,
        type: 'victory',
        playerHpBar: { current: Math.max(0, playerHp), max: playerMaxHp },
      });
    }

    // 计算掉落
    const dropBonusVal = options?.dropBonus ?? 0;
    for (const drop of monster.drops) {
      const effectiveChance = Math.min(drop.chance * (1 + dropBonusVal), 1.0);
      if (Math.random() <= effectiveChance) {
        drops.push({ name: drop.name, type: drop.type, amount: drop.amount });
        if (captureLogs) {
          const icon = drop.type === 'gold' ? '💎' : drop.type === 'herb' ? '🌿' : '💠';
          logs.push({
            text: `${icon} 获得 ${drop.name} x${drop.amount}`,
            type: 'drop',
            playerHpBar: { current: Math.max(0, playerHp), max: playerMaxHp },
          });
        }
      }
    }
  } else if (playerHp <= 0) {
    if (captureLogs) {
      logs.push({
        text: `💀 不敌【${monster.name}】，败退而归`,
        type: 'defeat',
        playerHpBar: { current: 0, max: playerMaxHp },
      });
    }
  } else {
    if (captureLogs) {
      logs.push({
        text: `⏱️ 战斗超时，${monster.name}逃跑了`,
        type: 'info',
        playerHpBar: { current: Math.max(0, playerHp), max: playerMaxHp },
      });
    }
  }

  return {
    victory,
    rounds: round,
    logs,
    expGained: victory ? monster.expReward : 0,
    drops,
    playerHpRemaining: Math.max(0, playerHp),
    playerHpMax: playerMaxHp,
  };
}
