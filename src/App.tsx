import React, { useState, useEffect } from 'react';
import { ScreenplayProject, UserSettings, ScreenplayBlock, BlockType, ShowcaseCharacter } from './types';
import MobileFrame from './components/MobileFrame';
import HomeView from './components/HomeView';
import EditorView from './components/EditorView';
import SettingsPanel from './components/SettingsPanel';
import { generatePDF, printScreenplay } from './utils/pdfGenerator';

// Default pre-loaded English Screenplay
const defaultEnglishProject: ScreenplayProject = {
  id: 'default-en',
  title: 'The Midnight Coffee Spot',
  lastModified: Date.now(),
  blocks: [
    { id: 'en-b1', type: 'SCENE_HEADING', text: 'INT. COFFEE SHOP - NIGHT' },
    { id: 'en-b2', type: 'ACTION', text: 'A quiet, dimly lit urban cafe. Rain falls steadily against the windowpane. AHMED (25) sits in the corner, nursing an espresso.' },
    { id: 'en-b3', type: 'CHARACTER', text: 'AHMED' },
    { id: 'en-b4', type: 'PARENTHETICAL', text: '(staring out at the empty streets)' },
    { id: 'en-b5', type: 'DIALOGUE', text: 'I knew she wouldn\'t make it. Why am I still waiting here?' },
    { id: 'en-b6', type: 'ACTION', text: 'The rusty door chime CLINGS. Ahmed looks up instantly.' },
    { id: 'en-b7', type: 'SHOT', text: 'CAMERA PAN TO DOOR ENTRY' },
    { id: 'en-b8', type: 'SCENE_HEADING', text: 'EXT. STREET - CONTINUOUS' },
    { id: 'en-b9', type: 'ACTION', text: 'Beneath a flickering orange streetlamp, a figure in a wet yellow trenchcoat stands shivering. It is LAYLA (24). She gasps.' },
    { id: 'en-b10', type: 'CHARACTER', text: 'LAYLA' },
    { id: 'en-b11', type: 'DIALOGUE', text: 'At least the coffee’s warm inside.' },
    { id: 'en-b12', type: 'TRANSITION', text: 'CUT TO:' },
    { id: 'en-b13', type: 'SCENE_HEADING', text: 'INT. COFFEE SHOP - NIGHT' },
    { id: 'en-b14', type: 'ACTION', text: 'Layla steps in. Her eyes lock onto Ahmed. He stands up, knocking his metal chair back.' },
    { id: 'en-b15', type: 'CHARACTER', text: 'AHMED' },
    { id: 'en-b16', type: 'DIALOGUE', text: 'Layla! You got caught in the bridge blockade, didn\'t you?' },
    { id: 'en-b17', type: 'CHARACTER', text: 'LAYLA' },
    { id: 'en-b18', type: 'DIALOGUE', text: 'The highway was frozen. I walked three miles because you said we needed to talk.' },
    { id: 'en-b19', type: 'CENTER_TEXT', text: 'TO BE CONTINUED' }
  ]
};

// Default pre-loaded Arabic Screenplay
const defaultArabicProject: ScreenplayProject = {
  id: 'default-ar',
  title: 'لقاء غامض في المقهى',
  lastModified: Date.now() - 3600000, // 1 hour ago
  blocks: [
    { id: 'ar-b1', type: 'SCENE_HEADING', text: 'داخلي. مقهى مارينا - ليل' },
    { id: 'ar-b2', type: 'ACTION', text: 'مقهى دافئ يطل على الشاطئ. الأمطار تضرب الزجاج الخارجي بقوة. أحمد (في أواخر العشرينات) يجلس وحيداً مع كوب قهوة دافئ.' },
    { id: 'ar-b3', type: 'CHARACTER', text: 'أحمد' },
    { id: 'ar-b4', type: 'PARENTHETICAL', text: '(يتنهد بقلق وهو يعد الساعات)' },
    { id: 'ar-b5', type: 'DIALOGUE', text: 'تأخرت كالعادة... ربما تكون قد ألغت الموعد بالكامل.' },
    { id: 'ar-b6', type: 'ACTION', text: 'يدق جرس الباب النحاسي فجأة بمؤشر حاد. يدخل شخص يحمل معطفاً مبتلاً.' },
    { id: 'ar-b7', type: 'SCENE_HEADING', text: 'خارجي. رصيف الميناء - مستمر' },
    { id: 'ar-b8', type: 'ACTION', text: 'ليلى تقف تحت مظلة حمراء مقلوبة بفعل الرياح الشديدة. تمسح قطرات المياه عن عينيها.' },
    { id: 'ar-b9', type: 'CHARACTER', text: 'ليلى' },
    { id: 'ar-b10', type: 'DIALOGUE', text: 'آمل ألا أكون قد أفسدت كل الخطط بمجيئي المتأخر.' },
    { id: 'ar-b11', type: 'TRANSITION', text: 'انتقال سريع:' },
    { id: 'ar-b12', type: 'SCENE_HEADING', text: 'داخلي. مقهى مارينا - مستمر' },
    { id: 'ar-b13', type: 'ACTION', text: 'تلتقي نظراتهما عبر القاعة شبه الخالية. يهرع أحمد للترحيب بها.' },
    { id: 'ar-b14', type: 'CHARACTER', text: 'أحمد' },
    { id: 'ar-b15', type: 'DIALOGUE', text: 'ليلى! يا إلهي، يديك دافئتان رغم الصقيع بالخارج.' },
    { id: 'ar-b16', type: 'CENTER_TEXT', text: 'يتبع...' }
  ]
};

export default function App() {
  const [screen, setScreen] = useState<'HOME' | 'EDITOR' | 'SETTINGS'>('HOME');
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isPwa, setIsPwa] = useState<boolean>(false);
  const [autoOpenCharacters, setAutoOpenCharacters] = useState<boolean>(false);

  // Capture the browser PWA events & standalone state
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    const handleAppInstalled = () => {
      console.log('App was installed successfully');
      setDeferredPrompt(null);
      setIsPwa(true);
    };

    const checkPwa = () => {
      const isStandalone = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.matchMedia('(display-mode: fullscreen)').matches ||
        (window.navigator as any).standalone === true;
      setIsPwa(isStandalone);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    checkPwa();
    const mediaPromptStandalone = window.matchMedia('(display-mode: standalone)');
    const mediaPromptFullscreen = window.matchMedia('(display-mode: fullscreen)');
    
    try {
      mediaPromptStandalone.addEventListener('change', checkPwa);
      mediaPromptFullscreen.addEventListener('change', checkPwa);
    } catch (e) {
      try {
        mediaPromptStandalone.addListener(checkPwa);
        mediaPromptFullscreen.addListener(checkPwa);
      } catch (err) {}
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      try {
        mediaPromptStandalone.removeEventListener('change', checkPwa);
        mediaPromptFullscreen.removeEventListener('change', checkPwa);
      } catch (e) {
        try {
          mediaPromptStandalone.removeListener(checkPwa);
          mediaPromptFullscreen.removeListener(checkPwa);
        } catch (err) {}
      }
    };
  }, []);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User prompt choice outcomes: ${outcome}`);
    setDeferredPrompt(null);
  };

  // Settings state with Local Storage sync
  const [settings, setSettings] = useState<UserSettings>(() => {
    const saved = localStorage.getItem('scene_writer_settings');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return {
      fontSize: 14,
      darkMode: true,
      language: 'en',
      autosave: true,
      sceneNumbering: true
    };
  });

  // Projects state with Local Storage sync
  const [projects, setProjects] = useState<ScreenplayProject[]>(() => {
    const saved = localStorage.getItem('scene_writer_projects');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    return [defaultEnglishProject, defaultArabicProject];
  });

  // Simple Undo/Redo tracking state
  const [historyStack, setHistoryStack] = useState<ScreenplayBlock[][]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Sync Settings to Local Storage
  useEffect(() => {
    localStorage.setItem('scene_writer_settings', JSON.stringify(settings));
    // Apply Arabic RTL on root layout if language changes
    document.body.dir = settings.language === 'ar' ? 'rtl' : 'ltr';
  }, [settings]);

  // Sync Projects to Local Storage
  useEffect(() => {
    localStorage.setItem('scene_writer_projects', JSON.stringify(projects));
  }, [projects]);

  // Project handling utilities
  const handleSelectProject = (id: string) => {
    const proj = projects.find(p => p.id === id);
    if (proj) {
      setActiveProjectId(id);
      
      // Auto-switch language matching the selection context to provide dynamic smoothness
      const hasArabic = proj.blocks.some(b => /[\u0600-\u06FF]/.test(b.text));
      setSettings(prev => ({ ...prev, language: hasArabic ? 'ar' : 'en' }));
      
      // Seed Undo History stack
      setHistoryStack([JSON.parse(JSON.stringify(proj.blocks))]);
      setHistoryIndex(0);
      setScreen('EDITOR');
    }
  };

  const handleCreateProject = (title: string) => {
    const id = `project-${Math.random().toString(36).substring(2, 11)}`;
    const newProject: ScreenplayProject = {
      id,
      title: title,
      lastModified: Date.now(),
      blocks: [
        { id: `b-${id}-1`, type: 'SCENE_HEADING', text: settings.language === 'ar' ? 'داخلي. مكان مجهول - نهار' : 'INT. PLACE - DAY' },
        { id: `b-${id}-2`, type: 'ACTION', text: settings.language === 'ar' ? 'اكتب ترويسة الأحداث ووصف الحركة والملامح هنا...' : 'Ahmed stands looking at the neon sign...' }
      ]
    };
    const updated = [newProject, ...projects];
    setProjects(updated);
    
    // Autoselect the newly minted screenplay project
    handleSelectProject(id);
  };

  const handleRenameProject = (id: string, newTitle: string) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, title: newTitle, lastModified: Date.now() } : p
    ));
  };

  const handleManageCharacters = (id: string) => {
    handleSelectProject(id);
    setAutoOpenCharacters(true);
  };

  const handleUpdateCharacters = (projectId: string, characters: ShowcaseCharacter[]) => {
    setProjects(prev => prev.map(p => 
      p.id === projectId ? { ...p, characters, lastModified: Date.now() } : p
    ));
  };

  const handleDuplicateProject = (id: string) => {
    const target = projects.find(p => p.id === id);
    if (!target) return;

    const dupId = `project-${Math.random().toString(36).substring(2, 11)}`;
    const dup: ScreenplayProject = {
      id: dupId,
      title: `${target.title} (${settings.language === 'ar' ? 'نسخة مكررة' : 'Copy'})`,
      lastModified: Date.now(),
      blocks: JSON.parse(JSON.stringify(target.blocks))
    };
    setProjects(prev => [dup, ...prev]);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    if (activeProjectId === id) {
      setActiveProjectId(null);
      setScreen('HOME');
    }
  };

  // Live Screenplay Blocks edits with history tracing
  const handleUpdateBlocks = (newBlocks: ScreenplayBlock[]) => {
    if (!activeProjectId) return;

    // Persist changes to projects array
    setProjects(prev => prev.map(p => 
      p.id === activeProjectId 
        ? { ...p, blocks: newBlocks, lastModified: Date.now() } 
        : p
    ));

    // Handle History Stack tracking for Undo/Redo safely
    const currentHistoryState = historyStack[historyIndex];
    
    // We only push to the history stack if:
    // 1. Array length changed (block added/deleted)
    // 2. A block's type changed
    // 3. To avoid flooding the history on every keystroke, we check text differences 
    //    and we can periodically snapshot or do so on blur.
    
    const lengthChanged = !currentHistoryState || currentHistoryState.length !== newBlocks.length;
    let typeOrKeyframeChanged = false;

    if (!lengthChanged && currentHistoryState) {
      for (let i = 0; i < newBlocks.length; i++) {
        if (newBlocks[i].type !== currentHistoryState[i].type) {
          typeOrKeyframeChanged = true;
          break;
        }
      }
    }

    if (lengthChanged || typeOrKeyframeChanged) {
      const cleanBlocksCopy = JSON.parse(JSON.stringify(newBlocks));
      const slicedHistory = historyStack.slice(0, historyIndex + 1);
      
      setHistoryStack([...slicedHistory, cleanBlocksCopy]);
      setHistoryIndex(slicedHistory.length);
    } else {
      // Direct text keystroke: silently overwrite the active index slot in history
      // so when we undo, we roll back to the state before we left that block/structure
      const cleanBlocksCopy = JSON.parse(JSON.stringify(newBlocks));
      setHistoryStack(prev => {
        const copy = [...prev];
        if (historyIndex >= 0 && historyIndex < copy.length) {
          copy[historyIndex] = cleanBlocksCopy;
        }
        return copy;
      });
    }
  };

  // History operations
  const handleUndo = () => {
    if (historyIndex > 0 && activeProjectId) {
      const prevIdx = historyIndex - 1;
      const prevBlocks = historyStack[prevIdx];
      setHistoryIndex(prevIdx);
      
      // Rollback projects array
      setProjects(prev => prev.map(p => 
        p.id === activeProjectId ? { ...p, blocks: prevBlocks, lastModified: Date.now() } : p
      ));
    }
  };

  const handleRedo = () => {
    if (historyIndex < historyStack.length - 1 && activeProjectId) {
      const nextIdx = historyIndex + 1;
      const nextBlocks = historyStack[nextIdx];
      setHistoryIndex(nextIdx);

      // Advance projects array
      setProjects(prev => prev.map(p => 
        p.id === activeProjectId ? { ...p, blocks: nextBlocks, lastModified: Date.now() } : p
      ));
    }
  };

  // PDF Exporters
  const handleExportPdf = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (activeProject) {
      generatePDF(activeProject, settings);
    }
  };

  const handlePrintPdf = () => {
    const activeProject = projects.find(p => p.id === activeProjectId);
    if (activeProject) {
      printScreenplay(activeProject, settings);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId);

  return (
    <MobileFrame themeMode={settings.darkMode ? 'dark' : 'light'} language={settings.language} isPwa={isPwa}>
      {screen === 'HOME' && (
        <HomeView
          projects={projects}
          settings={settings}
          onSelectProject={handleSelectProject}
          onCreateProject={handleCreateProject}
          onRenameProject={handleRenameProject}
          onDuplicateProject={handleDuplicateProject}
          onDeleteProject={handleDeleteProject}
          onOpenSettings={() => setScreen('SETTINGS')}
          deferredPrompt={deferredPrompt}
          onInstallPWA={handleInstallPWA}
          isPwa={isPwa}
          onManageCharacters={handleManageCharacters}
        />
      )}

      {screen === 'EDITOR' && activeProject && (
        <EditorView
          projectTitle={activeProject.title}
          blocks={activeProject.blocks}
          settings={settings}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < historyStack.length - 1}
          onBack={() => {
            setScreen('HOME');
            setAutoOpenCharacters(false);
          }}
          onUpdateBlocks={handleUpdateBlocks}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onExportPdf={handleExportPdf}
          onPrintPdf={handlePrintPdf}
          characters={activeProject.characters || []}
          onUpdateCharacters={(chars) => handleUpdateCharacters(activeProject.id, chars)}
          autoOpenCharacters={autoOpenCharacters}
          onCloseCharacters={() => setAutoOpenCharacters(false)}
        />
      )}

      {screen === 'SETTINGS' && (
        <SettingsPanel
          settings={settings}
          onUpdateSettings={setSettings}
          onBack={() => setScreen('HOME')}
          deferredPrompt={deferredPrompt}
          onInstallPWA={handleInstallPWA}
          isPwa={isPwa}
        />
      )}
    </MobileFrame>
  );
}
