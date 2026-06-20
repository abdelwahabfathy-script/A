import { ScreenplayBlock } from '../types';

export interface CharacterStats {
  sceneCount: number;
  sceneNumbers: number[];
  dialogueCount: number;
  screenTimeStr: string;
}

/**
 * Cleanly and robustly parses the screenplay blocks to determine character statistic metrics.
 * Uses a smart language-agnostic boundary checker so Arabic and English names are parsed perfectly.
 */
export function getCharacterStats(
  blocks: ScreenplayBlock[],
  charName: string,
  language: 'en' | 'ar'
): CharacterStats {
  const nameLower = charName.trim().toLowerCase();
  
  if (!nameLower) {
    return {
      sceneCount: 0,
      sceneNumbers: [],
      dialogueCount: 0,
      screenTimeStr: language === 'ar' ? '٠ ثانية' : '0 sec'
    };
  }

  // Cross-lingual word boundary helper
  const matchesCharacterName = (blockText: string, searchName: string): boolean => {
    const text = blockText.trim().toLowerCase();
    const term = searchName.trim().toLowerCase();
    
    if (!term) return false;
    
    const index = text.indexOf(term);
    if (index === -1) return false;
    
    // Check characters surrounding the match to ensure complete word token boundaries
    const charBefore = index > 0 ? text[index - 1] : ' ';
    const charAfter = index + term.length < text.length ? text[index + term.length] : ' ';
    
    const isWordChar = (char: string) => {
      return /[\p{L}\p{N}_]/u.test(char);
    };
    
    return !isWordChar(charBefore) && !isWordChar(charAfter);
  };

  let sceneCountCounter = 0;
  const scenesWithCharacter = new Set<number>();
  let dialogueCount = 0;
  let currentSpeaker = '';

  blocks.forEach((block) => {
    // 1. Maintain scene numbering count
    if (block.type === 'SCENE_HEADING') {
      sceneCountCounter++;
    }

    // 2. Manage current active speaker context
    if (block.type === 'CHARACTER') {
      // Clean up common parentheticals like "AHMED (V.O.)" or "AHMED (O.S.)" or "AHMED (CONT'D)"
      // to focus specifically on the clean name, but standard containment check works beautifully too
      currentSpeaker = block.text.trim().toLowerCase();
    }

    // 3. Dialogue count matching
    if (block.type === 'DIALOGUE') {
      if (currentSpeaker && matchesCharacterName(currentSpeaker, nameLower)) {
        dialogueCount++;
      }
    }

    // 4. Scene appearance mapping
    if (sceneCountCounter > 0) {
      if (matchesCharacterName(block.text, nameLower)) {
        scenesWithCharacter.add(sceneCountCounter);
      }
    }
  });

  const sceneNumbers = Array.from(scenesWithCharacter).sort((a, b) => a - b);
  const sceneCount = sceneNumbers.length;

  // Professional Screen time estimation formula:
  // Each scene appearance = ~30 seconds, and each dialogue block = ~8 seconds
  const totalSeconds = (sceneCount * 30) + (dialogueCount * 8);
  const min = Math.floor(totalSeconds / 60);
  const sec = totalSeconds % 60;

  let screenTimeStr = '';
  if (language === 'ar') {
    if (min > 0) {
      screenTimeStr = `${min} دقيقة ${sec > 0 ? `و ${sec} ثانية` : ''}`;
    } else {
      screenTimeStr = `${sec} ثانية`;
    }
  } else {
    if (min > 0) {
      screenTimeStr = `${min} min ${sec > 0 ? `${sec} sec` : ''}`;
    } else {
      screenTimeStr = `${sec} sec`;
    }
  }

  return {
    sceneCount,
    sceneNumbers,
    dialogueCount,
    screenTimeStr
  };
}
