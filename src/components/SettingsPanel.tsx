import React from 'react';
import { UserSettings, translations } from '../types';
import { ArrowLeft, Moon, Sun, Languages, Hash, Type, Save, ArrowRightLeft } from 'lucide-react';

interface SettingsPanelProps {
  settings: UserSettings;
  onUpdateSettings: (settings: UserSettings) => void;
  onBack: () => void;
}

export default function SettingsPanel({
  settings,
  onUpdateSettings,
  onBack,
}: SettingsPanelProps) {
  const t = translations[settings.language];
  const isRtl = settings.language === 'ar';

  const toggleDarkMode = () => {
    onUpdateSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const handleLanguageChange = (lang: 'en' | 'ar') => {
    onUpdateSettings({ ...settings, language: lang });
  };

  const setFontSize = (size: number) => {
    onUpdateSettings({ ...settings, fontSize: size });
  };

  const toggleAutosave = () => {
    onUpdateSettings({ ...settings, autosave: !settings.autosave });
  };

  const toggleSceneNumbering = () => {
    onUpdateSettings({ ...settings, sceneNumbering: !settings.sceneNumbering });
  };

  return (
    <div className={`flex-1 flex flex-col overflow-y-auto h-full transition-colors ${
      settings.darkMode ? 'bg-zinc-900 text-slate-100' : 'bg-[#F3F4F6] text-[#1C1B1F]'
    }`}>
      {/* Header */}
      <div className={`px-5 py-4 flex items-center gap-3 border-b transition-colors ${
        settings.darkMode ? 'border-zinc-805 bg-zinc-950/20' : 'border-[#E0E0E0] bg-white'
      }`}>
        <button
          id="settings_btn_back"
          onClick={onBack}
          className={`p-2 rounded-xl transition-colors ${
            settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-750'
          }`}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-bold text-base">{t.settings}</span>
      </div>

      <div className="p-5 flex flex-col gap-6">
        {/* Dark Mode Tile */}
        <div className={`p-4 rounded-3xl border transition-all ${
          settings.darkMode ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-[#E0E0E0]'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl ${
                settings.darkMode ? 'bg-zinc-800 text-brand-container' : 'bg-brand-sidebar text-brand-primary'
              }`}>
                {settings.darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-sm">{t.darkMode}</h3>
                <p className={`text-[11px] font-medium leading-normal ${settings.darkMode ? 'text-zinc-500' : 'text-brand-text'}`}>
                  {settings.language === 'ar' ? 'توفير استهلاك البطارية وإراحة لعينيك' : 'Saves device juice & soothes tired eyes'}
                </p>
              </div>
            </div>
            {/* Toggle Switch */}
            <button
              id="settings_toggle_darkmode"
              onClick={toggleDarkMode}
              className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                settings.darkMode ? 'bg-brand-primary' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.darkMode ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className={`p-4 rounded-3xl border transition-all ${
          settings.darkMode ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-2xl ${
              settings.darkMode ? 'bg-zinc-800 text-blue-400' : 'bg-slate-100 text-blue-500'
            }`}>
              <Languages className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t.language}</h3>
              <p className={`text-[11px] leading-normal font-medium ${settings.darkMode ? 'text-zinc-500' : 'text-slate-500'}`}>
                {settings.language === 'ar' ? 'تغيير لغة التطبيق والاتجاهات بالكامل' : 'Toggle translation layout & dynamic text alignments'}
              </p>
            </div>
          </div>
          {/* Radio Buttons */}
          <div className="grid grid-cols-2 gap-3 font-semibold text-xs text-center pr-1 pl-1">
            <button
              id="lang_en_btn"
              onClick={() => handleLanguageChange('en')}
              className={`py-3.5 rounded-2xl border transition-all cursor-pointer ${
                settings.language === 'en'
                  ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white border-transparent shadow shadow-rose-500/10'
                  : settings.darkMode 
                    ? 'bg-zinc-900 border-zinc-805 text-zinc-400 hover:text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
            >
              English (LTR)
            </button>
            <button
              id="lang_ar_btn"
              onClick={() => handleLanguageChange('ar')}
              className={`py-3.5 rounded-2xl border transition-all cursor-pointer ${
                settings.language === 'ar'
                  ? 'bg-gradient-to-tr from-amber-500 to-rose-500 text-white border-transparent shadow shadow-rose-500/10'
                  : settings.darkMode 
                    ? 'bg-zinc-900 border-zinc-805 text-zinc-400 hover:text-white' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
              }`}
            >
              العربية (RTL)
            </button>
          </div>
        </div>

        {/* Font Size Adjustment */}
        <div className={`p-4 rounded-3xl border transition-all ${
          settings.darkMode ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-[#E0E0E0]'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2 rounded-2xl ${
              settings.darkMode ? 'bg-zinc-800 text-brand-container' : 'bg-brand-sidebar text-brand-primary'
            }`}>
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">{t.fontSize} ({settings.fontSize}pt)</h3>
              <p className={`text-[11px] leading-normal font-medium ${settings.darkMode ? 'text-zinc-500' : 'text-brand-text'}`}>
                {settings.language === 'ar' ? 'تعديل حجم خط عينة السيناريو مجهرياً' : 'Adjust text scaling inside the primary editor canvas'}
              </p>
            </div>
          </div>
          {/* Dynamic Range Slider / Segment Bar */}
          <div className="px-1 py-1 flex items-center justify-between gap-3 text-xs font-bold">
            <span className="opacity-70 text-[10px]">A</span>
            <input
              id="settings_font_slider"
              type="range"
              min={10}
              max={22}
              step={2}
              value={settings.fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-slate-250 accent-brand-primary dark:bg-zinc-800"
            />
            <span className="text-sm">A</span>
          </div>
          <div className="flex justify-between text-[9px] text-slate-400 font-bold px-5 mt-1.5 select-none">
            <span>10pt</span>
            <span>14pt</span>
            <span>18pt</span>
            <span>22pt</span>
          </div>
        </div>

        {/* Dynamic Scene Numbering Title */}
        <div className={`p-4 rounded-3xl border transition-all ${
          settings.darkMode ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-[#E0E0E0]'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl ${
                settings.darkMode ? 'bg-zinc-800 text-brand-container' : 'bg-brand-sidebar text-brand-primary'
              }`}>
                <Hash className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t.sceneNumbering}</h3>
                <p className={`text-[11px] leading-normal font-medium ${settings.darkMode ? 'text-zinc-500' : 'text-brand-text'}`}>
                  {t.sceneNumberingDesc}
                </p>
              </div>
            </div>
            <button
              id="settings_toggle_scenenumbering"
              onClick={toggleSceneNumbering}
              className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                settings.sceneNumbering ? 'bg-brand-primary' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.sceneNumbering ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Autosave Toggle option */}
        <div className={`p-4 rounded-3xl border transition-all ${
          settings.darkMode ? 'bg-zinc-950/40 border-zinc-800/80' : 'bg-white border-[#E0E0E0]'
        }`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-2xl ${
                settings.darkMode ? 'bg-zinc-800 text-brand-container' : 'bg-brand-sidebar text-brand-primary'
              }`}>
                <Save className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">{t.autosave}</h3>
                <p className={`text-[11px] leading-normal font-medium ${settings.darkMode ? 'text-zinc-500' : 'text-brand-text'}`}>
                  {settings.language === 'ar' ? 'حفظ تلقائي عند كل ضغطة حرف' : 'Persist screenplay draft changes locally on typewriter strokes'}
                </p>
              </div>
            </div>
            <button
              id="settings_toggle_autosave"
              onClick={toggleAutosave}
              className={`w-11 h-6 rounded-full p-1 transition-colors relative cursor-pointer ${
                settings.autosave ? 'bg-brand-primary' : 'bg-slate-300'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                settings.autosave ? (isRtl ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
