import React, { useState } from 'react';
import { ScreenplayProject, translations, UserSettings } from '../types';
import { 
  Plus, 
  Search, 
  FileText, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Edit2, 
  Settings as SettingsIcon,
  Play,
  Clock,
  BookOpen
} from 'lucide-react';

interface HomeViewProps {
  projects: ScreenplayProject[];
  settings: UserSettings;
  onSelectProject: (id: string) => void;
  onCreateProject: (title: string) => void;
  onRenameProject: (id: string, newTitle: string) => void;
  onDuplicateProject: (id: string) => void;
  onDeleteProject: (id: string) => void;
  onOpenSettings: () => void;
}

export default function HomeView({
  projects,
  settings,
  onSelectProject,
  onCreateProject,
  onRenameProject,
  onDuplicateProject,
  onDeleteProject,
  onOpenSettings,
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  
  // Dialog States
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState('');
  
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState('');
  const [renameTitle, setRenameTitle] = useState('');

  const t = translations[settings.language];
  const isRtl = settings.language === 'ar';

  // Filter projects based on query
  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSceneCount = (project: ScreenplayProject): number => {
    return project.blocks.filter((b) => b.type === 'SCENE_HEADING').length;
  };

  const getWordCount = (project: ScreenplayProject): number => {
    return project.blocks.reduce((acc, b) => {
      if (!b.text) return acc;
      return acc + b.text.trim().split(/\s+/).filter(Boolean).length;
    }, 0);
  };

  // Screenplay Page Estimate: 1 page is ~50-54 lines of formatting
  // 1 page is roughly equivalent to 1 minute of screen time
  const estimatePagesAndDuration = (project: ScreenplayProject) => {
    if (project.blocks.length === 0) return { pages: 0, durationSec: 0 };
    
    let totalLines = 0;
    project.blocks.forEach((b) => {
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

    const pages = Math.max(1, Math.ceil(totalLines / 54));
    // Let's say 1 page = 60 seconds
    const durationSec = pages * 61; // Add 1 sec for realistic average
    return { pages, durationSec };
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(settings.language === 'ar' ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleCreate = () => {
    if (newProjectTitle.trim()) {
      onCreateProject(newProjectTitle.trim());
      setNewProjectTitle('');
      setShowCreateDialog(false);
    } else {
      onCreateProject(t.untitled);
      setShowCreateDialog(false);
    }
  };

  const handleRename = () => {
    if (renameTitle.trim() && renameTargetId) {
      onRenameProject(renameTargetId, renameTitle.trim());
      setRenameTitle('');
      setRenameTargetId('');
      setShowRenameDialog(false);
    }
  };

  const triggerMenuOption = (e: React.MouseEvent, projectId: string, action: () => void) => {
    e.stopPropagation();
    action();
    setActiveMenuId(null);
  };

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto relative h-full transition-colors ${
      settings.darkMode ? 'bg-zinc-900 text-slate-100' : 'bg-[#F3F4F6] text-[#1C1B1F]'
    }`}>
      {/* Home Header */}
      <div className={`px-6 py-5 flex justify-between items-center border-b transition-colors ${
        settings.darkMode ? 'border-zinc-805 bg-zinc-950/20' : 'border-[#E0E0E0] bg-white'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center text-white font-bold shrink-0">
            SW
          </div>
          <div>
            <h1 className={`text-lg font-semibold tracking-tight ${settings.darkMode ? 'text-white' : 'text-[#1C1B1F]'}`}>
              {t.appName}
            </h1>
            <p className={`text-xs ${settings.darkMode ? 'text-zinc-400' : 'text-brand-text font-medium uppercase tracking-wider'}`}>
              {t.tagline}
            </p>
          </div>
        </div>

        {/* Settings button */}
        <button 
          id="btn_home_settings"
          onClick={onOpenSettings}
          className={`p-2.5 rounded-full transition-colors ${
            settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-700'
          }`}
          title={t.settings}
        >
          <SettingsIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="px-5 py-4">
        <div className={`relative flex items-center rounded-2xl border transition-all ${
          settings.darkMode 
            ? 'bg-zinc-950/50 border-zinc-800 focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-primary/20' 
            : 'bg-white border-[#E0E0E0] focus-within:border-brand-primary focus-within:ring-2 focus-within:ring-brand-container'
        }`}>
          <div className={`absolute ${isRtl ? 'right-4' : 'left-4'} text-gray-400`}>
            <Search className="w-5 h-5" />
          </div>
          <input
            id="input_project_search"
            type="text"
            placeholder={t.searchProjects}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full py-3 ${isRtl ? 'pr-12 pl-4' : 'pl-12 pr-4'} bg-transparent outline-none text-sm font-medium`}
          />
        </div>
      </div>

      {/* Projects Grid/List View */}
      <div className="flex-1 px-5 pb-24 overflow-y-auto">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${
              settings.darkMode ? 'bg-zinc-800 text-zinc-600' : 'bg-slate-100 text-slate-400'
            }`}>
              <BookOpen className="w-8 h-8" />
            </div>
            <p className="text-sm font-semibold max-w-xs leading-relaxed text-slate-500">
              {t.noProjects}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredProjects.map((project) => {
              const { pages, durationSec } = estimatePagesAndDuration(project);
              const scenes = getSceneCount(project);
              const words = getWordCount(project);
              const durationMin = Math.floor(durationSec / 60);

              return (
                <div
                  id={`project_card_${project.id}`}
                  key={project.id}
                  onClick={() => onSelectProject(project.id)}
                  className={`group p-4 rounded-3xl border cursor-pointer relative transition-all duration-300 ${
                    settings.darkMode 
                      ? 'bg-zinc-950/40 border-zinc-800/80 hover:bg-zinc-800 hover:border-zinc-700' 
                      : 'bg-white border-[#E0E0E0] hover:shadow-md hover:border-brand-primary'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${
                        settings.darkMode ? 'bg-zinc-800 text-brand-container' : 'bg-brand-container text-brand-dark'
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className={`font-bold text-[15px] leading-tight transition-colors group-hover:text-brand-primary ${
                          settings.darkMode ? 'text-white' : 'text-zinc-950'
                        }`}>
                          {project.title}
                        </h3>
                        <p className={`text-[11px] mt-1 ${settings.darkMode ? 'text-zinc-500' : 'text-slate-400'}`}>
                          {t.lastModified}: {formatDate(project.lastModified)}
                        </p>
                      </div>
                    </div>

                    {/* Context menu trigger */}
                    <div className="relative">
                      <button
                        id={`btn_project_menu_${project.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuId(activeMenuId === project.id ? null : project.id);
                        }}
                        className={`p-2 rounded-xl transition-colors ${
                          settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-100 text-slate-600'
                        }`}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Options */}
                      {activeMenuId === project.id && (
                        <>
                          <div 
                            className="fixed inset-0 z-45" 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuId(null);
                            }}
                          />
                          <div className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-1.5 w-40 rounded-2xl shadow-xl border z-50 overflow-hidden font-medium text-xs ${
                            settings.darkMode ? 'bg-zinc-900 border-zinc-800 text-slate-200' : 'bg-white border-slate-150 text-slate-800'
                          }`}>
                            <button
                              id={`btn_rename_${project.id}`}
                              onClick={(e) => triggerMenuOption(e, project.id, () => {
                                setRenameTargetId(project.id);
                                setRenameTitle(project.title);
                                setShowRenameDialog(true);
                              })}
                              className={`w-full px-4 py-3 flex items-center gap-2.5 transition-colors ${
                                settings.darkMode ? 'hover:bg-zinc-800/80 text-zinc-200' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <Edit2 className="w-3.5 h-3.5 text-brand-primary" />
                              <span>{t.rename}</span>
                            </button>
                            <button
                              id={`btn_duplicate_${project.id}`}
                              onClick={(e) => triggerMenuOption(e, project.id, () => onDuplicateProject(project.id))}
                              className={`w-full px-4 py-3 flex items-center gap-2.5 transition-colors ${
                                settings.darkMode ? 'hover:bg-zinc-800/80 text-zinc-200' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <Copy className="w-3.5 h-3.5 text-brand-primary" />
                              <span>{t.duplicate}</span>
                            </button>
                            <button
                              id={`btn_delete_${project.id}`}
                              onClick={(e) => triggerMenuOption(e, project.id, () => {
                                if (confirm(t.deleteConfirm)) {
                                  onDeleteProject(project.id);
                                }
                              })}
                              className={`w-full px-4 py-3 flex items-center gap-2.5 transition-colors text-rose-500 ${
                                settings.darkMode ? 'hover:bg-red-950/20' : 'hover:bg-rose-50'
                              }`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>{t.delete}</span>
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Meta Pills */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-3 border-t border-slate-100/5 dark:border-zinc-800/60 text-[10px] font-bold">
                    <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                      settings.darkMode ? 'bg-zinc-800/40 text-brand-container' : 'bg-brand-container text-brand-dark'
                    }`}>
                      <Play className="w-3 h-3 fill-current text-brand-primary" />
                      <span>{scenes} {t.scenesCount}</span>
                    </span>

                    <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                      settings.darkMode ? 'bg-zinc-800/40 text-slate-300' : 'bg-gray-100 text-gray-750'
                    }`}>
                      <Clock className="w-3 h-3 text-brand-primary" />
                      <span>{durationMin} {t.minutes}</span>
                    </span>

                    <span className={`px-2.5 py-1 rounded-lg flex items-center gap-1 ${
                      settings.darkMode ? 'bg-zinc-800/40 text-slate-300' : 'bg-gray-100 text-gray-755'
                    }`}>
                      <span>📄 {pages} {settings.language === 'ar' ? 'صفحة' : 'pages'}</span>
                    </span>

                    <span className={`px-2.5 py-1 rounded-lg opacity-70 ${
                      settings.darkMode ? 'text-zinc-550' : 'text-slate-400'
                    }`}>
                      {words} {settings.language === 'ar' ? 'كلمة' : 'words'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
         {/* Floating Action Button for Creative Screenplays */}
      <button
        id="btn_fab_create"
        onClick={() => {
          setNewProjectTitle('');
          setShowCreateDialog(true);
        }}
        className="absolute bottom-8 right-6 w-14 h-14 bg-brand-primary text-white rounded-full flex items-center justify-center shadow-lg hover:bg-brand-primary/95 shadow-brand-primary/20 transform hover:scale-105 transition-all z-40 cursor-pointer"
        title={t.createProject}
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Native-Like Material Modals */}
      {/* 1. Create Play */}
      {showCreateDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all border ${
            settings.darkMode ? 'bg-zinc-950 border-zinc-800 text-slate-100' : 'bg-white border-slate-100 text-[#1C1B1F]'
          }`}>
            <h3 className="text-lg font-bold tracking-tight mb-2">
              {t.createProject}
            </h3>
            <p className={`text-xs mb-4 ${settings.darkMode ? 'text-zinc-400' : 'text-brand-text'}`}>
              {settings.language === 'ar' ? 'أدخل اسماً مميزاً للسيناريو الإبداعي الخاص بك.' : 'Enter a unique name for your creative screenplay.'}
            </p>
            <input
              id="input_create_title"
              type="text"
              placeholder={t.title}
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border mb-5 outline-none font-medium text-sm transition-all focus:ring-1 focus:ring-brand-primary focus:border-brand-primary ${
                settings.darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-[#F3F4F6] border-[#E0E0E0]'
              }`}
            />
            <div className="flex justify-end gap-3 font-semibold text-xs">
              <button
                id="btn_dialog_cancel"
                onClick={() => setShowCreateDialog(false)}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  settings.darkMode ? 'hover:bg-zinc-900 text-zinc-400' : 'hover:bg-gray-100 text-gray-650'
                }`}
              >
                {t.cancel}
              </button>
              <button
                id="btn_dialog_create"
                onClick={handleCreate}
                className="px-5 py-3 rounded-xl bg-brand-primary text-white hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                {t.create}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Rename Screenplay */}
      {showRenameDialog && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center px-6 z-50">
          <div className={`w-full max-w-sm rounded-3xl p-6 shadow-2xl transition-all border ${
            settings.darkMode ? 'bg-zinc-950 border-zinc-800 text-slate-100' : 'bg-white border-slate-100 text-[#1C1B1F]'
          }`}>
            <h3 className="text-lg font-bold tracking-tight mb-2">
              {t.renameProject}
            </h3>
            <input
              id="input_rename_title"
              type="text"
              placeholder={t.title}
              value={renameTitle}
              onChange={(e) => setRenameTitle(e.target.value)}
              className={`w-full px-4 py-3 rounded-2xl border mb-5 outline-none font-medium text-sm transition-all focus:ring-1 focus:ring-brand-primary focus:border-brand-primary ${
                settings.darkMode ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-[#F3F4F6] border-[#E0E0E0]'
              }`}
            />
            <div className="flex justify-end gap-3 font-semibold text-xs">
              <button
                id="btn_rename_cancel"
                onClick={() => setShowRenameDialog(false)}
                className={`px-4 py-3 rounded-xl transition-colors ${
                  settings.darkMode ? 'hover:bg-zinc-900 text-zinc-400' : 'hover:bg-gray-100 text-gray-650'
                }`}
              >
                {t.cancel}
              </button>
              <button
                id="btn_rename_confirm"
                onClick={handleRename}
                className="px-5 py-3 rounded-xl bg-brand-primary text-white hover:opacity-90 transition-all cursor-pointer shadow-sm"
              >
                {t.rename}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
