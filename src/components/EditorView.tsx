import React, { useState, useEffect, useRef } from 'react';
import { ScreenplayBlock, BlockType, translations, UserSettings, ShowcaseCharacter } from '../types';
import { parseRawText } from '../utils/parser';
import { 
  ArrowLeft, 
  Settings as SettingsIcon, 
  Menu, 
  Search, 
  BarChart3, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  RotateCcw, 
  RotateCw,
  Compass,
  FileDown,
  Printer,
  ChevronUp,
  ChevronDown,
  X,
  Users
} from 'lucide-react';
import CharactersPanel from './CharactersPanel';

interface EditorViewProps {
  projectTitle: string;
  blocks: ScreenplayBlock[];
  settings: UserSettings;
  canUndo: boolean;
  canRedo: boolean;
  onBack: () => void;
  onUpdateBlocks: (blocks: ScreenplayBlock[]) => void;
  onUndo: () => void;
  onRedo: () => void;
  onExportPdf: () => void;
  onPrintPdf: () => void;
  characters: ShowcaseCharacter[];
  onUpdateCharacters: (characters: ShowcaseCharacter[]) => void;
  autoOpenCharacters?: boolean;
  onCloseCharacters?: () => void;
}

export default function EditorView({
  projectTitle,
  blocks,
  settings,
  canUndo,
  canRedo,
  onBack,
  onUpdateBlocks,
  onUndo,
  onRedo,
  onExportPdf,
  onPrintPdf,
  characters,
  onUpdateCharacters,
  autoOpenCharacters = false,
  onCloseCharacters,
}: EditorViewProps) {
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [localBlocks, setLocalBlocks] = useState<ScreenplayBlock[]>([]);
  
  // Navigation / Drawer states
  const [showSceneList, setShowSceneList] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [pastedText, setPastedText] = useState('');
  const [showCharacters, setShowCharacters] = useState(false);

  // Auto-open characters state monitoring
  useEffect(() => {
    if (autoOpenCharacters) {
      setShowCharacters(true);
      setShowSceneList(false);
      setShowStats(false);
    }
  }, [autoOpenCharacters]);
  
  // Local Search state in document
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<number[]>([]); // indexes of matched blocks
  const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);

  const t = translations[settings.language];
  const isRtl = settings.language === 'ar';
  
  const blockRefs = useRef<{ [key: string]: HTMLTextAreaElement | null }>({});

  // Push updates up to parent on change
  useEffect(() => {
    setLocalBlocks(blocks);
  }, [blocks]);

  // Adjust textarea heights dynamically to prevent nested scrollbars
  const adjustHeight = (id: string) => {
    const el = blockRefs.current[id];
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  // Trigger height adjustment on block load or update
  useEffect(() => {
    localBlocks.forEach((block) => {
      adjustHeight(block.id);
    });
  }, [localBlocks, settings.fontSize]);

  const updateBlockText = (id: string, text: string) => {
    // Apply automatic uppercase where dictated by screenplay conventions
    let updatedText = text;
    const block = localBlocks.find(b => b.id === id);
    if (block) {
      if (['SCENE_HEADING', 'CHARACTER', 'TRANSITION', 'SHOT'].includes(block.type)) {
        updatedText = text.toUpperCase();
      }
      
      const newBlocks = localBlocks.map((b) => 
        b.id === id ? { ...b, text: updatedText } : b
      );
      setLocalBlocks(newBlocks);
      onUpdateBlocks(newBlocks);
    }
  };

  const changeBlockType = (id: string, newType: BlockType) => {
    const newBlocks = localBlocks.map((b) => {
      if (b.id === id) {
        let finalVal = b.text;
        if (['SCENE_HEADING', 'CHARACTER', 'TRANSITION', 'SHOT'].includes(newType)) {
          finalVal = b.text.toUpperCase();
        }
        return { ...b, type: newType, text: finalVal };
      }
      return b;
    });
    setLocalBlocks(newBlocks);
    onUpdateBlocks(newBlocks);
    
    // Maintain focus and adjust height
    setTimeout(() => {
      blockRefs.current[id]?.focus();
      adjustHeight(id);
    }, 50);
  };

  const addNewBlockAfter = (targetId: string, type: BlockType = 'ACTION', text: string = '') => {
    const newId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
    const targetIdx = localBlocks.findIndex((b) => b.id === targetId);
    
    const newBlock: ScreenplayBlock = { id: newId, type, text };
    const newBlocks = [...localBlocks];
    newBlocks.splice(targetIdx + 1, 0, newBlock);
    
    setLocalBlocks(newBlocks);
    onUpdateBlocks(newBlocks);
    setActiveBlockId(newId);
    
    // Auto-focus the newly created block
    setTimeout(() => {
      blockRefs.current[newId]?.focus();
      adjustHeight(newId);
    }, 50);
  };

  const deleteBlock = (id: string) => {
    if (localBlocks.length <= 1) {
      // Don't leave document with 0 blocks
      const updated = [{ ...localBlocks[0], text: '', type: 'ACTION' as BlockType }];
      setLocalBlocks(updated);
      onUpdateBlocks(updated);
      return;
    }

    const idx = localBlocks.findIndex((b) => b.id === id);
    const newBlocks = localBlocks.filter((b) => b.id !== id);
    setLocalBlocks(newBlocks);
    onUpdateBlocks(newBlocks);

    // Focus on neighboring block after deletion
    const focusIdx = idx > 0 ? idx - 1 : 0;
    const focusId = newBlocks[focusIdx].id;
    setActiveBlockId(focusId);
    
    setTimeout(() => {
      blockRefs.current[focusId]?.focus();
    }, 50);
  };

  // SMART KEYBOARD CONTROLS (Enter, Backspace, Tab)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, block: ScreenplayBlock, index: number) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      
      // Screenplay Smart Transitions on pressing Enter:
      let nextType: BlockType = 'ACTION';
      
      if (block.type === 'CHARACTER') {
        nextType = 'DIALOGUE';
      } else if (block.type === 'DIALOGUE') {
        // Toggle to active action, or keep going
        nextType = 'ACTION';
      } else if (block.type === 'PARENTHETICAL') {
        nextType = 'DIALOGUE';
      } else if (block.type === 'SCENE_HEADING') {
        nextType = 'ACTION';
      } else {
        nextType = block.type; // Keep same type for sequential actions, shots etc.
      }

      addNewBlockAfter(block.id, nextType);
    } 
    
    else if (e.key === 'Backspace' && block.text === '') {
      e.preventDefault();
      deleteBlock(block.id);
    } 
    
    else if (e.key === 'Tab') {
      e.preventDefault();
      // Tab cycles through major screenplay block configurations
      const cycle: BlockType[] = [
        'SCENE_HEADING',
        'ACTION',
        'CHARACTER',
        'DIALOGUE',
        'PARENTHETICAL',
        'TRANSITION',
        'SHOT',
        'CENTER_TEXT'
      ];
      const nextIdx = (cycle.indexOf(block.type) + 1) % cycle.length;
      changeBlockType(block.id, cycle[nextIdx]);
    }
  };

  // Convert raw pasted text into blocks
  const handleImportText = () => {
    if (pastedText.trim() === '') return;
    const parsed = parseRawText(pastedText);
    if (parsed.length > 0) {
      // Replace or append blocks? We will merge them to the active document
      const merged = [...localBlocks.filter(b => b.text.trim() !== ''), ...parsed];
      setLocalBlocks(merged);
      onUpdateBlocks(merged);
      setPastedText('');
      setShowImportDialog(false);
    }
  };

  // Scene navigation drawer
  const getScenesList = () => {
    return localBlocks.map((b, idx) => ({ block: b, idx })).filter((item) => item.block.type === 'SCENE_HEADING');
  };

  const jumpToBlock = (id: string) => {
    setActiveBlockId(id);
    setShowSceneList(false);
    setTimeout(() => {
      blockRefs.current[id]?.focus();
      const el = document.getElementById(`block_item_${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 150);
  };

  // Statistics calculation
  const getStats = () => {
    let wordCount = 0;
    let sceneCount = 0;
    let dialogueCount = 0;
    let totalLines = 0;

    localBlocks.forEach((b) => {
      const words = b.text.trim().split(/\s+/).filter(Boolean).length;
      wordCount += words;
      
      if (b.type === 'SCENE_HEADING') sceneCount++;
      if (b.type === 'DIALOGUE') dialogueCount++;

      // Lines multiplier estimation
      const charCount = b.text.length;
      if (b.type === 'ACTION') {
        totalLines += Math.ceil(charCount / 60) + 1;
      } else if (b.type === 'DIALOGUE') {
        totalLines += Math.ceil(charCount / 35) + 1;
      } else if (b.type === 'CHARACTER') {
        totalLines += 2;
      } else if (b.type === 'PARENTHETICAL') {
        totalLines += 1.5;
      } else if (b.type === 'SCENE_HEADING') {
        totalLines += 3;
      } else {
        totalLines += 2;
      }
    });

    const pages = localBlocks.length > 0 ? Math.max(1, Math.ceil(totalLines / 54)) : 0;
    
    // Est Screen Time calculation: ~1 min per page (60 sec)
    const totalSecs = pages * 60;
    const minStr = Math.floor(totalSecs / 60);
    const secStr = totalSecs % 60;

    return {
      pages,
      scenes: sceneCount,
      words: wordCount,
      dialogues: dialogueCount,
      screenTime: `${minStr} ${t.minutes} ${secStr > 0 ? `${secStr} ${t.seconds}` : ''}`
    };
  };

  // Perform Local Search on Text blocks
  useEffect(() => {
    if (!searchQuery.trim() || !showSearch) {
      setSearchResults([]);
      setCurrentSearchIndex(-1);
      return;
    }

    const matches: number[] = [];
    localBlocks.forEach((b, idx) => {
      if (b.text.toLowerCase().includes(searchQuery.toLowerCase())) {
        matches.push(idx);
      }
    });
    
    setSearchResults(matches);
    if (matches.length > 0) {
      setCurrentSearchIndex(0);
      jumpToBlock(localBlocks[matches[0]].id);
    } else {
      setCurrentSearchIndex(-1);
    }
  }, [searchQuery, showSearch]);

  const navigateSearch = (dir: 'next' | 'prev') => {
    if (searchResults.length === 0) return;
    let nextIdx = currentSearchIndex;
    if (dir === 'next') {
      nextIdx = (currentSearchIndex + 1) % searchResults.length;
    } else {
      nextIdx = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
    }
    setCurrentSearchIndex(nextIdx);
    jumpToBlock(localBlocks[searchResults[nextIdx]].id);
  };

  const getBlockStyle = (type: BlockType): string => {
    // Font settings are applied dynamically on typography
    const txtAlign = isRtl ? 'text-right' : 'text-left';
    
    switch (type) {
      case 'SCENE_HEADING':
        return `font-bold tracking-wider uppercase py-1 text-white placeholder-white/40 ${txtAlign}`;
      case 'ACTION':
        return `py-1 ${txtAlign} tracking-normal opacity-90`;
      case 'CHARACTER':
        // Centered and Bold
        return `font-bold text-center uppercase tracking-wide underline decoration-dotted decoration-1 underline-offset-4 py-2 text-brand-primary max-w-[80%] mx-auto`;
      case 'DIALOGUE':
        // Squeezed and centered
        return `py-1 max-w-[75%] mx-auto relative ${isRtl ? 'text-right pr-[15%]' : 'text-left pl-[15%]'}`;
      case 'PARENTHETICAL':
        // Centered italic
        return `italic text-center text-slate-400 max-w-[60%] mx-auto py-0.5`;
      case 'TRANSITION':
        // Pushed to the right/left
        return `uppercase font-semibold tracking-wide py-1.5 text-brand-primary/95 ${isRtl ? 'text-left' : 'text-right'}`;
      case 'SHOT':
        return `font-bold uppercase tracking-tight py-2 border-b border-brand-primary/10 ${txtAlign}`;
      case 'CENTER_TEXT':
        return `text-center font-medium tracking-tight py-2 text-brand-primary focus:text-brand-primary italic`;
      default:
        return '';
    }
  };

  const getToolbarButtonClass = (btnType: BlockType): string => {
    const activeBlock = localBlocks.find(b => b.id === activeBlockId);
    const isCurrent = activeBlock?.type === btnType;
    return `px-3.5 py-1.5 rounded-full text-[10px] font-bold shrink-0 transition-all select-none border cursor-pointer ${
      isCurrent 
        ? 'bg-brand-container text-brand-dark border-brand-primary shadow-sm font-semibold' 
        : settings.darkMode 
          ? 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:text-white' 
          : 'bg-white text-brand-text border-[#E0E0E0] hover:bg-brand-sidebar hover:text-brand-dark'
    }`;
  };

  const activeBlockRefIndex = localBlocks.findIndex(b => b.id === activeBlockId);
  const activeBlockTypeDisplay = localBlocks[activeBlockRefIndex]?.type || 'ACTION';

  return (
    <div className={`flex-1 flex flex-col overflow-hidden relative h-full transition-colors ${
      settings.darkMode ? 'bg-zinc-900 text-slate-100' : 'bg-[#F3F4F6] text-[#1C1B1F]'
    }`}>
      
      {/* Upper Menu Toolbar */}
      <div className={`px-4 py-3.5 flex justify-between items-center border-b select-none z-30 transition-all ${
        settings.darkMode ? 'border-zinc-800 bg-zinc-950/40' : 'border-slate-200 bg-white/40'
      }`}>
        <div className="flex items-center gap-1">
          <button
            id="editor_btn_back"
            onClick={onBack}
            className={`p-2 rounded-xl transition-colors ${
              settings.darkMode ? 'hover:bg-zinc-800' : 'hover:bg-slate-200'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="max-w-[150px] md:max-w-xs truncate ml-1">
            <h2 className="font-bold text-[14px] leading-tight truncate">
              {projectTitle}
            </h2>
            <p className="text-[10px] opacity-60 text-slate-400">
              {t.editor}
            </p>
          </div>
        </div>

        {/* Action button bar */}
        <div className="flex items-center gap-1">
          {/* Active scene list drawer trigger */}
          <button
            id="editor_btn_scenes"
            onClick={() => {
              setShowSceneList(!showSceneList);
              setShowStats(false);
            }}
            className={`p-2 rounded-xl transition-colors relative ${
              showSceneList 
                ? 'bg-brand-primary text-white' 
                : settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-[#E8DEF8]/50 text-brand-primary'
            }`}
            title={t.sceneList}
          >
            <Compass className="w-4.5 h-4.5" />
          </button>

          {/* Statistics trigger */}
          <button
            id="editor_btn_stats"
            onClick={() => {
              setShowStats(!showStats);
              setShowSceneList(false);
              setShowCharacters(false);
            }}
            className={`p-2 rounded-xl transition-colors ${
              showStats 
                ? 'bg-brand-primary text-white' 
                : settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-[#E8DEF8]/50 text-brand-primary'
            }`}
            title={t.statistics}
          >
            <BarChart3 className="w-4.5 h-4.5" />
          </button>

          {/* Characters Database Trigger */}
          <button
            id="editor_btn_characters"
            onClick={() => {
              setShowCharacters(!showCharacters);
              setShowStats(false);
              setShowSceneList(false);
            }}
            className={`p-2 rounded-xl transition-colors ${
              showCharacters 
                ? 'bg-brand-primary text-white' 
                : settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-[#E8DEF8]/50 text-brand-primary'
            }`}
            title={settings.language === 'ar' ? 'البطل والشخصيات' : 'Characters Database'}
          >
            <Users className="w-4.5 h-4.5" />
          </button>

          {/* Paste / Import Trigger */}
          <button
            id="editor_btn_import"
            onClick={() => setShowImportDialog(true)}
            className={`p-2 rounded-xl transition-colors ${
              settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-[#E8DEF8]/50 text-brand-primary'
            }`}
            title="Import Raw Text"
          >
            <Upload className="w-4.5 h-4.5" />
          </button>

          {/* Export / Print dropdown */}
          <button
            id="editor_btn_print"
            onClick={onPrintPdf}
            className={`p-2 rounded-xl transition-colors ${
              settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-[#E8DEF8]/50 text-brand-primary'
            }`}
            title={t.exportPdf}
          >
            <Printer className="w-4.5 h-4.5" />
          </button>

          {/* Fast PDF direct download */}
          <button
            id="editor_btn_export"
            onClick={onExportPdf}
            className={`p-2 rounded-xl transition-colors ${
              settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-[#E8DEF8]/50 text-brand-primary'
            }`}
            title="Download PDF FILE"
          >
            <Download className="w-4.5 h-4.5" />
          </button>

          {/* Embedded Local Search Trigger */}
          <button
            id="editor_btn_search"
            onClick={() => setShowSearch(!showSearch)}
            className={`p-2 rounded-xl transition-colors ${
              showSearch 
                ? 'bg-brand-primary text-white' 
                : settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-[#E8DEF8]/50 text-brand-primary'
            }`}
            title="Search inside Script"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Embedded Local Search Strip */}
      {showSearch && (
        <div className={`px-4 py-2 border-b flex items-center justify-between gap-2 z-25 text-xs font-semibold ${
          settings.darkMode ? 'bg-zinc-950/60 border-zinc-800/80 text-zinc-300' : 'bg-slate-100 border-slate-200 text-slate-700'
        }`}>
          <div className="flex items-center gap-1.5 flex-1 max-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <input
              id="editor_search_field"
              type="text"
              placeholder={t.searchInScreenplay}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent outline-none border-b border-transparent focus:border-brand-primary font-medium pb-0.5"
            />
          </div>
          
          <div className="flex items-center gap-2">
            {searchResults.length > 0 && (
              <span className="opacity-80 scale-90">
                {currentSearchIndex + 1} / {searchResults.length}
              </span>
            )}
            <div className="flex items-center gap-1">
              <button
                id="search_navigate_prev"
                onClick={() => navigateSearch('prev')}
                disabled={searchResults.length === 0}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30"
              >
                <ChevronUp className="w-4 h-4" />
              </button>
              <button
                id="search_navigate_next"
                onClick={() => navigateSearch('next')}
                disabled={searchResults.length === 0}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800 disabled:opacity-30"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              <button
                id="search_strip_close"
                onClick={() => {
                  setShowSearch(false);
                  setSearchQuery('');
                }}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Screenplay Live Canvas */}
      <div className={`flex-1 overflow-y-auto px-6 py-8 relative ${
        settings.darkMode ? 'bg-zinc-950/30' : 'bg-white'
      }`} style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
        
        {/* Subtle page margins and boundaries mock */}
        <div className="max-w-[90%] mx-auto flex flex-col gap-3 min-h-[350px] pb-36">
          {localBlocks.map((block, idx) => {
            const isFocused = activeBlockId === block.id;
            const headingNum = getScenesList().findIndex((item) => item.block.id === block.id) + 1;
            const wordCount = block.text.trim().split(/\s+/).filter(Boolean).length;

            const isSceneHeading = block.type === 'SCENE_HEADING';

            return (
              <div
                id={`block_item_${block.id}`}
                key={block.id}
                className={`flex gap-1 relative group w-full transition-all ${
                  isSceneHeading
                    ? `rounded-[16px] my-6 py-2.5 px-4 bg-[#1E1E1E] text-white shadow-md shadow-black/30 border-l-[6px] border-brand-primary ${
                        isFocused ? 'ring-2 ring-brand-primary shadow-lg scale-[1.005]' : ''
                      }`
                    : isFocused
                      ? settings.darkMode ? 'bg-zinc-900/60 ring-1 ring-orange-500/20 rounded-xl' : 'bg-orange-50/50 ring-1 ring-orange-100 rounded-xl'
                      : 'hover:bg-slate-100/10 rounded-xl'
                }`}
              >
                {/* Scene numbering dynamic labels */}
                {isSceneHeading && settings.sceneNumbering && (
                  <span className={`absolute top-4 text-[9px] font-bold px-2 py-0.5 rounded shadow-md z-15 ${
                    isRtl ? '-right-6' : '-left-6'
                  } ${settings.darkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-brand-primary text-white'}`}>
                    🎬 {headingNum}
                  </span>
                )}

                {/* Main editable text block input area */}
                <textarea
                  id={`block_textarea_${block.id}`}
                  ref={(el) => { blockRefs.current[block.id] = el; }}
                  value={block.text}
                  onChange={(e) => {
                    updateBlockText(block.id, e.target.value);
                    adjustHeight(block.id);
                  }}
                  onKeyDown={(e) => handleKeyDown(e, block, idx)}
                  onFocus={() => setActiveBlockId(block.id)}
                  style={{ 
                    fontSize: `${isSceneHeading ? Math.round(settings.fontSize * 1.15) : settings.fontSize}pt`,
                    fontFamily: "Arial, 'Cairo', sans-serif",
                    lineHeight: '1.65',
                    resize: 'none'
                  }}
                  placeholder={
                    block.type === 'SCENE_HEADING' ? t.placeholderHeading :
                    block.type === 'CHARACTER' ? t.placeholderCharacter :
                    block.type === 'DIALOGUE' ? t.placeholderDialogue :
                    block.type === 'PARENTHETICAL' ? t.placeholderParenthetical :
                    block.type === 'TRANSITION' ? t.placeholderTransition :
                    block.type === 'SHOT' ? t.placeholderShot :
                    block.type === 'CENTER_TEXT' ? t.placeholderCenterText :
                    t.placeholderAction
                  }
                  rows={1}
                  className={`flex-1 w-full p-2.5 bg-transparent border-0 outline-none overflow-hidden transition-all duration-150 ${getBlockStyle(block.type)} ${
                    isFocused ? 'opacity-100' : 'opacity-85'
                  }`}
                />

                {/* Mini context hover deletions */}
                {isFocused && (
                  <div className={`absolute top-2.5 ${isRtl ? 'left-2.5' : 'right-2.5'} flex gap-1 z-10 opacity-60 hover:opacity-100`}>
                    <button
                      id={`btn_block_delete_${block.id}`}
                      onClick={() => deleteBlock(block.id)}
                      className="p-1 rounded bg-zinc-850 hover:bg-red-500/20 text-rose-500 transition-colors cursor-pointer"
                      title="Delete element"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* Quick Add Elements spacer */}
          <div className="flex justify-center mt-6">
            <button
              id="editor_btn_quick_add"
              onClick={() => {
                const lastBlock = localBlocks[localBlocks.length - 1];
                addNewBlockAfter(lastBlock ? lastBlock.id : 'first', 'ACTION');
              }}
              className={`py-2 px-4 rounded-full flex items-center gap-1.5 text-xs font-bold border border-dashed transition-all cursor-pointer ${
                settings.darkMode 
                  ? 'border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-500' 
                  : 'border-slate-300 text-slate-500 hover:text-slate-900 hover:border-slate-500'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>{settings.language === 'ar' ? 'إضافة جزيئ جديد للغوص' : 'Add screenplay block'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Panel 1: Scene Outline Drawer */}
      {showSceneList && (
        <>
          <div className="absolute inset-0 bg-black/45 z-35" onClick={() => setShowSceneList(false)} />
          <div className={`absolute top-0 bottom-0 ${isRtl ? 'left-0' : 'right-0'} w-72 border-r shadow-2xl flex flex-col z-40 transition-transform duration-300 ${
            settings.darkMode ? 'bg-zinc-950 border-zinc-900 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <div className={`p-4 border-b flex justify-between items-center ${
              settings.darkMode ? 'border-zinc-800' : 'border-slate-200'
            }`}>
              <h3 className="font-bold text-sm tracking-tight flex items-center gap-2">
                <Compass className="w-4.5 h-4.5 text-rose-500" />
                <span>{t.sceneList} ({getScenesList().length})</span>
              </h3>
              <button 
                id="btn_close_drawer"
                onClick={() => setShowSceneList(false)}
                className="p-1 rounded-lg hover:opacity-80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {getScenesList().length === 0 ? (
                <p className="text-xs text-center text-slate-400 font-medium py-10 leading-relaxed">
                  {t.noScenes}
                </p>
              ) : (
                getScenesList().map((item, index) => (
                  <button
                    id={`btn_drawer_jump_${item.block.id}`}
                    key={item.block.id}
                    onClick={() => jumpToBlock(item.block.id)}
                    className={`w-full text-left p-3 rounded-2xl border text-xs font-semibold leading-normal transition-all hover:border-orange-500 hover:bg-orange-500/5 ${
                      settings.darkMode 
                        ? 'border-zinc-900 bg-zinc-900/40 text-slate-300 hover:text-white' 
                        : 'border-slate-100 bg-slate-50/50 text-slate-700 hover:text-slate-950'
                    }`}
                    style={{ textAlign: isRtl ? 'right' : 'left' }}
                  >
                    <div className="text-[10px] text-amber-500 mb-0.5">
                      {settings.language === 'ar' ? `المشهد ${index + 1}` : `Scene ${index + 1}`}
                    </div>
                    {item.block.text || '...'}
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {/* Floating Panel 2: Statistics Sheet */}
      {showStats && (
        <>
          <div className="absolute inset-0 bg-black/45 z-35" onClick={() => setShowStats(false)} />
          <div className={`absolute bottom-0 left-0 right-0 max-h-[400px] border-t shadow-2xl flex flex-col z-40 transition-all p-6 ${
            settings.darkMode ? 'bg-zinc-950 border-zinc-900 text-slate-100' : 'bg-white border-slate-205 text-slate-900'
          } rounded-t-[32px]`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className="font-bold text-base tracking-tight flex items-center gap-2 text-amber-500">
                <BarChart3 className="w-5 h-5" />
                <span>{t.statistics}</span>
              </h3>
              <button 
                id="btn_close_stats"
                onClick={() => setShowStats(false)}
                className="p-1 rounded-lg hover:opacity-80"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stats Bento Grid */}
            <div className="grid grid-cols-2 gap-4 pb-4">
              <div className={`p-4 rounded-2xl border ${
                settings.darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="text-[10px] uppercase opacity-60 mb-1">{t.totalPages}</div>
                <div className="text-xl font-extrabold text-amber-500">{getStats().pages}</div>
              </div>
              
              <div className={`p-4 rounded-2xl border ${
                settings.darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="text-[10px] uppercase opacity-60 mb-1">{settings.language === 'ar' ? 'المشاهد' : 'Scenes'}</div>
                <div className="text-xl font-extrabold text-rose-500">{getStats().scenes}</div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                settings.darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="text-[10px] uppercase opacity-60 mb-1">{t.wordCount}</div>
                <div className="text-xl font-extrabold text-teal-400">{getStats().words}</div>
              </div>

              <div className={`p-4 rounded-2xl border ${
                settings.darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <div className="text-[10px] uppercase opacity-60 mb-1">{t.screenTime}</div>
                <div className="text-xs font-extrabold text-purple-400 whitespace-nowrap leading-relaxed pt-1">{getStats().screenTime}</div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Floating Dialog: Paste / Import Overlay Box */}
      {showImportDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
          <div className={`w-full max-w-sm rounded-[32px] p-6 shadow-2xl transition-all border ${
            settings.darkMode ? 'bg-zinc-950 border-zinc-800 text-slate-100' : 'bg-white border-slate-100 text-slate-900'
          }`}>
            <h3 className="text-md font-bold tracking-tight mb-2">
              {t.importExport}
            </h3>
            <p className={`text-xs mb-3 ${settings.darkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
              {t.pasteWordText}
            </p>
            <textarea
              id="editor_paste_area"
              placeholder={t.pastePlaceholder}
              value={pastedText}
              onChange={(e) => setPastedText(e.target.value)}
              rows={6}
              className={`w-full p-3 rounded-2xl border mb-4 outline-none font-medium text-xs transition-all ${
                settings.darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-slate-50 border-slate-200'
              }`}
            />
            <div className="flex justify-end gap-3 font-semibold text-xs">
              <button
                id="btn_import_cancel"
                onClick={() => {
                  setShowImportDialog(false);
                  setPastedText('');
                }}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  settings.darkMode ? 'hover:bg-zinc-900 text-zinc-400' : 'hover:bg-slate-100'
                }`}
              >
                {t.cancel}
              </button>
              <button
                id="btn_import_submit"
                onClick={handleImportText}
                className="px-5 py-3 rounded-xl bg-orange-500 text-white hover:bg-orange-600 transition-all cursor-pointer"
              >
                {t.importButton}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BOTTOM FORMATTING TOOLBAR - ALWAYS VISIBLE */}
      <div className={`px-4 py-3 border-t select-none z-30 transition-all ${
        settings.darkMode ? 'border-zinc-800 bg-zinc-950/80' : 'border-slate-200 bg-white/95'
      } shadow-lg`}>
        
        {/* Undo Redo Mini Strip */}
        <div className="flex items-center justify-between mb-3 border-b border-dashed dark:border-zinc-800/60 pb-2">
          {/* Active type descriptor */}
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-primary flex items-center gap-1 select-none">
            🎨 {settings.language === 'ar' ? 'العنصر الحالي ' : 'ACTIVE FORMAT: '}{activeBlockTypeDisplay}
          </span>
          
          <div className="flex gap-2">
            <button
              id="editor_btn_undo"
              onClick={onUndo}
              disabled={!canUndo}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                settings.darkMode 
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300 disabled:opacity-20 hover:text-white hover:bg-zinc-805' 
                  : 'border-slate-200 bg-slate-50 text-slate-700 disabled:opacity-20 hover:bg-slate-100'
              }`}
              title={t.undo}
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              id="editor_btn_redo"
              onClick={onRedo}
              disabled={!canRedo}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                settings.darkMode 
                  ? 'border-zinc-800 bg-zinc-900 text-zinc-300 disabled:opacity-20 hover:text-white hover:bg-zinc-805' 
                  : 'border-slate-200 bg-slate-50 text-slate-700 disabled:opacity-20 hover:bg-slate-100'
              }`}
              title={t.redo}
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 8 Screenplay Formatter Buttons: Slider Flow */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-800">
          <button
            id="fmt_scene_heading"
            onClick={() => activeBlockId && changeBlockType(activeBlockId, 'SCENE_HEADING')}
            className={getToolbarButtonClass('SCENE_HEADING')}
          >
            {settings.language === 'ar' ? 'رأس مشهد' : 'SCENE HEADING'}
          </button>
          <button
            id="fmt_action"
            onClick={() => activeBlockId && changeBlockType(activeBlockId, 'ACTION')}
            className={getToolbarButtonClass('ACTION')}
          >
            {settings.language === 'ar' ? 'حركة/وصف' : 'ACTION'}
          </button>
          <button
            id="fmt_character"
            onClick={() => activeBlockId && changeBlockType(activeBlockId, 'CHARACTER')}
            className={getToolbarButtonClass('CHARACTER')}
          >
            {settings.language === 'ar' ? 'شخصية' : 'CHARACTER'}
          </button>
          <button
            id="fmt_dialogue"
            onClick={() => activeBlockId && changeBlockType(activeBlockId, 'DIALOGUE')}
            className={getToolbarButtonClass('DIALOGUE')}
          >
            {settings.language === 'ar' ? 'حوار' : 'DIALOGUE'}
          </button>
          <button
            id="fmt_parenthetical"
            onClick={() => activeBlockId && changeBlockType(activeBlockId, 'PARENTHETICAL')}
            className={getToolbarButtonClass('PARENTHETICAL')}
          >
            {settings.language === 'ar' ? 'ملاحظة' : 'PARENTHETICAL'}
          </button>
          <button
            id="fmt_transition"
            onClick={() => activeBlockId && changeBlockType(activeBlockId, 'TRANSITION')}
            className={getToolbarButtonClass('TRANSITION')}
          >
            {settings.language === 'ar' ? 'انتقال سريع' : 'TRANSITION'}
          </button>
          <button
            id="fmt_shot"
            onClick={() => activeBlockId && changeBlockType(activeBlockId, 'SHOT')}
            className={getToolbarButtonClass('SHOT')}
          >
            {settings.language === 'ar' ? 'لقطة كاميرا' : 'SHOT'}
          </button>
          <button
            id="fmt_center_text"
            onClick={() => activeBlockId && changeBlockType(activeBlockId, 'CENTER_TEXT')}
            className={getToolbarButtonClass('CENTER_TEXT')}
          >
            {settings.language === 'ar' ? 'توسيط نص' : 'CENTER TEXT'}
          </button>
        </div>

        {/* Floating guidance tips */}
        <p className="text-[10px] select-none text-slate-400 mt-2 text-center opacity-80 leading-normal">
          {t.helpText}
        </p>
      </div>

      <CharactersPanel
        isOpen={showCharacters}
        onClose={() => {
          setShowCharacters(false);
          onCloseCharacters?.();
        }}
        blocks={localBlocks}
        characters={characters}
        onUpdateCharacters={onUpdateCharacters}
        settings={settings}
      />

    </div>
  );
}
