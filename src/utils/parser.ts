import { ScreenplayBlock, BlockType } from '../types';

/**
 * Parses free-form text into structured screenplay blocks.
 * Designed to parse English and Arabic screenplays, handling capitalization and RTL cues.
 */
export function parseRawText(text: string): ScreenplayBlock[] {
  const blocks: ScreenplayBlock[] = [];
  if (!text || text.trim() === '') {
    return [];
  }

  // Split lines
  const lines = text.split(/\r?\n/);
  let prevType: BlockType | null = null;
  let inDialogueFlow = false;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed === '') {
      continue;
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);

    // 1. Check for Scene Handlers
    const isHeading = 
      /^(INT\.|EXT\.|I\/E\.|INT\/EXT\.|EXT\/INT\.|داخلي\.|خارجي\.|داخلي\/خارجي|خارجي\/داخلي)/i.test(trimmed) ||
      trimmed.toUpperCase().startsWith('INT. ') ||
      trimmed.toUpperCase().startsWith('EXT. ') ||
      trimmed.startsWith('داخلي ') ||
      trimmed.startsWith('خارجي ');

    if (isHeading) {
      blocks.push({ id, type: 'SCENE_HEADING', text: trimmed.toUpperCase() });
      prevType = 'SCENE_HEADING';
      inDialogueFlow = false;
      continue;
    }

    // 2. Check for Parenthetical
    const isParenthetical = trimmed.startsWith('(') && trimmed.endsWith(')');
    if (isParenthetical) {
      blocks.push({ id, type: 'PARENTHETICAL', text: trimmed });
      prevType = 'PARENTHETICAL';
      // Parentheticals can continue a dialogue flow
      continue;
    }

    // 3. Check for Transition
    const isTransition = 
      /^(CUT TO|DISSOLVE TO|FADE OUT|FADE IN|FADE TO|FADE UP|SMASH CUT|MATCH CUT):?$/i.test(trimmed) ||
      trimmed.endsWith(':') && (trimmed.toUpperCase() === trimmed || trimmed.includes('انتقال') || trimmed.includes('قطع'));

    if (isTransition) {
      blocks.push({ id, type: 'TRANSITION', text: trimmed.toUpperCase() });
      prevType = 'TRANSITION';
      inDialogueFlow = false;
      continue;
    }

    // 4. Check for Camera Shot
    const isShot =
      /^(CLOSE UP|WIDE SHOT|MED\. SHOT|MEDIUM SHOT|POV|TRACKING SHOT|ANGLE ON|ZOOM IN|PAN TO|Establishing Shot)/i.test(trimmed) ||
      /^(لقطة قريبة|لقطة واسعة|لقطة متوسطة|وجهة نظر|تتبع الكاميرا)/.test(trimmed);

    if (isShot) {
      blocks.push({ id, type: 'SHOT', text: trimmed.toUpperCase() });
      prevType = 'SHOT';
      inDialogueFlow = false;
      continue;
    }

    // 5. Check if it looks like a Character Name
    // A character name is uppercase (if English), short (< 30 chars), and is typically followed by dialogue
    const hasArabicLetters = /[\u0600-\u06FF]/.test(trimmed);
    const isAllUppercase = trimmed === trimmed.toUpperCase();
    const isShort = trimmed.length > 0 && trimmed.length < 30;
    
    // In English screenplay format, characters are uppercase and not ending with punctuation besides notes (O.S., V.O.)
    // In Arabic screenplays, character names are short, bold or isolated before lines
    const isPotentialCharacter = isShort && (hasArabicLetters || isAllUppercase) && !trimmed.endsWith('.') && !trimmed.endsWith(',') && !trimmed.endsWith('?');

    if (isPotentialCharacter && !inDialogueFlow) {
      // Lookahead: is the next line dialogue or parenthetical?
      let nextLineHasText = false;
      if (i + 1 < lines.length) {
        const nextTrimmed = lines[i + 1].trim();
        if (nextTrimmed !== '') {
          nextLineHasText = true;
        }
      }

      if (nextLineHasText) {
        blocks.push({ id, type: 'CHARACTER', text: trimmed.toUpperCase() });
        prevType = 'CHARACTER';
        inDialogueFlow = true;
        continue;
      }
    }

    // 6. Dialogue flow handling
    // If the previous block was character or parenthetical, or if we are in dialogue flow, this line is likely dialogue
    if (inDialogueFlow && (prevType === 'CHARACTER' || prevType === 'PARENTHETICAL' || prevType === 'DIALOGUE')) {
      blocks.push({ id, type: 'DIALOGUE', text: trimmed });
      prevType = 'DIALOGUE';
      continue;
    }

    // 7. Otherwise, default to Action
    blocks.push({ id, type: 'ACTION', text: trimmed });
    prevType = 'ACTION';
    inDialogueFlow = false;
  }

  return blocks;
}

/**
 * Formats structured screenplay blocks back to a single standardized text representation.
 */
export function stringifyScreenplay(blocks: ScreenplayBlock[]): string {
  return blocks.map(block => {
    switch (block.type) {
      case 'SCENE_HEADING':
        return `\n${block.text.toUpperCase()}\n`;
      case 'CHARACTER':
        return `\n${block.text.toUpperCase()}\n`;
      case 'DIALOGUE':
        return `${block.text}`;
      case 'PARENTHETICAL':
        return `${block.text}`;
      case 'TRANSITION':
        return `\n${block.text.toUpperCase()}\n`;
      case 'SHOT':
        return `\n${block.text.toUpperCase()}\n`;
      default:
        // ACTION and CENTER_TEXT
        return `\n${block.text}\n`;
    }
  }).join('\n').replace(/\n{3,}/g, '\n\n');
}
