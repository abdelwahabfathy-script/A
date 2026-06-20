import React, { useState, useMemo } from 'react';
import { ShowcaseCharacter, ScreenplayBlock, UserSettings } from '../types';
import { getCharacterStats, CharacterStats } from '../utils/characterStats';
import { 
  X, 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  User, 
  Users, 
  ArrowUpDown, 
  Calendar, 
  Heart, 
  Sparkles, 
  BookOpen, 
  StickyNote, 
  UserCircle, 
  Dna, 
  Target, 
  History,
  FileDown,
  Printer,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { generateCharacterReportPDF } from '../utils/pdfGenerator';

interface CharactersPanelProps {
  isOpen: boolean;
  onClose: () => void;
  blocks: ScreenplayBlock[];
  characters: ShowcaseCharacter[];
  onUpdateCharacters: (characters: ShowcaseCharacter[]) => void;
  settings: UserSettings;
}

export default function CharactersPanel({
  isOpen,
  onClose,
  blocks,
  characters,
  onUpdateCharacters,
  settings,
}: CharactersPanelProps) {
  const isAr = settings.language === 'ar';
  const isRtl = isAr;
  
  // States
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'scenes' | 'dialogue'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingCharId, setEditingCharId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formGender, setFormGender] = useState('');
  const [formAge, setFormAge] = useState('');
  const [formPhysicalDescription, setFormPhysicalDescription] = useState('');
  const [formPersonalityTraits, setFormPersonalityTraits] = useState('');
  const [formPsychologicalTraits, setFormPsychologicalTraits] = useState('');
  const [formMotivationsGoals, setFormMotivationsGoals] = useState('');
  const [formBackgroundStory, setFormBackgroundStory] = useState('');
  const [formRelationships, setFormRelationships] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Dictionary matching languages beautifully
  const ct = {
    en: {
      title: 'Characters Database',
      subtitle: 'Track profiles, story arcs, and dynamic screentime stats',
      searchPlaceholder: 'Search by name, background or traits...',
      noCharacters: 'No characters in this screenplay yet.',
      addCharacter: 'Create Character',
      editCharacter: 'Edit Character',
      deleteCharacter: 'Delete Character',
      saveCharacter: 'Save Profile',
      cancel: 'Cancel',
      deleteConfirm: 'Are you sure you want to delete this character?',
      
      // Fields labels
      name: 'Character Name',
      gender: 'Gender',
      age: 'Age',
      physicalDescription: 'Physical Description',
      personalityTraits: 'Personality Traits',
      psychologicalTraits: 'Psychological Traits',
      motivationsGoals: 'Motivations and Goals',
      backgroundStory: 'Background Story',
      relationships: 'Relationships with Others',
      notes: 'Creative Notes',
      
      // Stats labels
      statsTitle: 'Screenplay Stats',
      totalScenes: 'Total Scenes',
      scenesList: 'Scene Numbers',
      dialogueCount: 'Dialogue Snatches',
      screenTime: 'Est. Screen Time',
      
      // Sorting
      sortByLabel: 'Sort By',
      sortName: 'Name',
      sortScenes: 'Appearances',
      sortDialogue: 'Dialogues',
      
      // Details
      profileTitle: 'Character Profile',
      backToDirectory: 'Back to Directory',
      exportReport: 'Export PDF Report',
      printReport: 'Print Report',
      placeholderName: 'e.g., Captain Miller',
      placeholderGender: 'e.g., Male / Female / Non-binary',
      placeholderAge: 'e.g., 34 years old',
    },
    ar: {
      title: 'قاعدة بيانات الشخصيات',
      subtitle: 'تتبع الملفات الشخصية، والقصة والظهور الإحصائي التلقائي',
      searchPlaceholder: 'ابحث بالاسم أو الخلفية أو السمات...',
      noCharacters: 'لا توجد أي شخصيات في هذا السيناريو بعد.',
      addCharacter: 'إنشاء شخصية',
      editCharacter: 'تعديل شخصية',
      deleteCharacter: 'حذف شخصية',
      saveCharacter: 'حفظ الملف الشخصي',
      cancel: 'إلغاء',
      deleteConfirm: 'هل أنت متأكد من حذف هذه الشخصية بالكامل؟',
      
      // Fields labels
      name: 'اسم الشخصية',
      gender: 'الجنس',
      age: 'العمر',
      physicalDescription: 'المظهر والملامح الجسدية',
      personalityTraits: 'السمات والطباع الشخصية',
      psychologicalTraits: 'المميزات والسمات النفسية',
      motivationsGoals: 'الدوافع والأهداف الرئيسية',
      backgroundStory: 'قصة الخلفية والتاريخ',
      relationships: 'العلاقات مع الشخصيات الأخرى',
      notes: 'ملاحظات وتفاصيل إبداعية',
      
      // Stats labels
      statsTitle: 'إحصائيات السيناريو',
      totalScenes: 'إجمالي المشاهد',
      scenesList: 'أرقام المشاهد',
      dialogueCount: 'السطور الحوارية',
      screenTime: 'وقت الشاشة التقديري',
      
      // Sorting
      sortByLabel: 'ترتيب حسب',
      sortName: 'الاسم',
      sortScenes: 'معدل الظهور',
      sortDialogue: 'الحوارات وبث الخطاب',
      
      // Details
      profileTitle: 'الملف التعريفي للبطل',
      backToDirectory: 'العودة للتصنيف',
      exportReport: 'تصدير الملف لـ PDF',
      printReport: 'طباعة التقرير كاملاً',
      placeholderName: 'مثال: القائد أحمد',
      placeholderGender: 'مثال: ذكر / أنثى',
      placeholderAge: 'مثال: ٢٨ سنة',
    }
  }[settings.language];

  // Open creation form
  const handleOpenAddForm = () => {
    setEditingCharId(null);
    setFormName('');
    setFormGender('');
    setFormAge('');
    setFormPhysicalDescription('');
    setFormPersonalityTraits('');
    setFormPsychologicalTraits('');
    setFormMotivationsGoals('');
    setFormBackgroundStory('');
    setFormRelationships('');
    setFormNotes('');
    setShowEditForm(true);
  };

  // Open edit form
  const handleOpenEditForm = (char: ShowcaseCharacter) => {
    setEditingCharId(char.id);
    setFormName(char.name);
    setFormGender(char.gender);
    setFormAge(char.age);
    setFormPhysicalDescription(char.physicalDescription);
    setFormPersonalityTraits(char.personalityTraits);
    setFormPsychologicalTraits(char.psychologicalTraits);
    setFormMotivationsGoals(char.motivationsGoals);
    setFormBackgroundStory(char.backgroundStory);
    setFormRelationships(char.relationships);
    setFormNotes(char.notes);
    setShowEditForm(true);
  };

  // Submit Save
  const handleSaveCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    const newChar: ShowcaseCharacter = {
      id: editingCharId || `char-${Math.random().toString(36).substring(2, 11)}`,
      name: formName.trim(),
      gender: formGender.trim(),
      age: formAge.trim(),
      physicalDescription: formPhysicalDescription.trim(),
      personalityTraits: formPersonalityTraits.trim(),
      psychologicalTraits: formPsychologicalTraits.trim(),
      motivationsGoals: formMotivationsGoals.trim(),
      backgroundStory: formBackgroundStory.trim(),
      relationships: formRelationships.trim(),
      notes: formNotes.trim()
    };

    let updatedList: ShowcaseCharacter[];
    if (editingCharId) {
      updatedList = characters.map(c => c.id === editingCharId ? newChar : c);
    } else {
      updatedList = [...characters, newChar];
    }

    onUpdateCharacters(updatedList);
    setShowEditForm(false);
    setEditingCharId(null);
    setActiveProfileId(newChar.id); // View their profile index right after creating
  };

  // Delete handler
  const handleDeleteCharacter = (id: string) => {
    if (window.confirm(ct.deleteConfirm)) {
      const updated = characters.filter(c => c.id !== id);
      onUpdateCharacters(updated);
      if (activeProfileId === id) {
        setActiveProfileId(null);
      }
    }
  };

  // Calculate dynamic stats for all characters to enable sorting/searching
  const charactersWithStats = useMemo(() => {
    return characters.map(char => {
      const stats = getCharacterStats(blocks, char.name, settings.language);
      return {
        ...char,
        stats
      };
    });
  }, [characters, blocks, settings.language]);

  // Handle Search and Sorting
  const filteredAndSortedCharacters = useMemo(() => {
    const list = charactersWithStats.filter(char => {
      const query = searchQuery.toLowerCase();
      return (
        char.name.toLowerCase().includes(query) ||
        char.personalityTraits.toLowerCase().includes(query) ||
        char.physicalDescription.toLowerCase().includes(query) ||
        char.backgroundStory.toLowerCase().includes(query) ||
        char.motivationsGoals.toLowerCase().includes(query)
      );
    });

    return list.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name, settings.language);
      } else if (sortBy === 'scenes') {
        comparison = a.stats.sceneCount - b.stats.sceneCount;
      } else if (sortBy === 'dialogue') {
        comparison = a.stats.dialogueCount - b.stats.dialogueCount;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [charactersWithStats, searchQuery, sortBy, sortOrder, settings.language]);

  const activeCharacter = charactersWithStats.find(c => c.id === activeProfileId);

  // Trigger Local printing style document for all characters
  const handlePrintCharacterReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const dir = isAr ? 'rtl' : 'ltr';

    const formattedCardsHtml = charactersWithStats.map((char, index) => {
      return `
        <div class="character-print-card">
          <div class="card-header">
            <h2>${index + 1}. ${char.name.toUpperCase()}</h2>
            <div class="badge-row">
              <span class="badge ${char.gender ? '' : 'hidden'}">${char.gender}</span>
              <span class="badge ${char.age ? '' : 'hidden'}">${char.age}</span>
            </div>
          </div>

          <div class="section-grid">
            <div class="col stats-col">
              <h3>📊 ${isAr ? 'بيانات وإحصاءات الظهور التلقائي' : 'Script Analytics'}</h3>
              <table class="stats-table">
                <tr>
                  <td>${ct.totalScenes}:</td>
                  <td><strong>${char.stats.sceneCount}</strong></td>
                </tr>
                <tr>
                  <td>${ct.scenesList}:</td>
                  <td>${char.stats.sceneNumbers.length > 0 ? char.stats.sceneNumbers.join(', ') : '-'}</td>
                </tr>
                <tr>
                  <td>${ct.dialogueCount}:</td>
                  <td><strong>${char.stats.dialogueCount}</strong></td>
                </tr>
                <tr>
                  <td>${ct.screenTime}:</td>
                  <td><strong>${char.stats.screenTimeStr}</strong></td>
                </tr>
              </table>
            </div>

            <div class="col fields-col">
              <h3>👤 ${isAr ? 'الملف التعريفي والسمات' : 'Detailed Profile'}</h3>
              <div class="field-item ${char.physicalDescription ? '' : 'hidden'}">
                <span class="field-label">${ct.physicalDescription}:</span>
                <span class="field-text">${char.physicalDescription}</span>
              </div>
              <div class="field-item ${char.personalityTraits ? '' : 'hidden'}">
                <span class="field-label">${ct.personalityTraits}:</span>
                <span class="field-text">${char.personalityTraits}</span>
              </div>
              <div class="field-item ${char.psychologicalTraits ? '' : 'hidden'}">
                <span class="field-label">${ct.psychologicalTraits}:</span>
                <span class="field-text">${char.psychologicalTraits}</span>
              </div>
              <div class="field-item ${char.motivationsGoals ? '' : 'hidden'}">
                <span class="field-label">${ct.motivationsGoals}:</span>
                <span class="field-text">${char.motivationsGoals}</span>
              </div>
              <div class="field-item ${char.backgroundStory ? '' : 'hidden'}">
                <span class="field-label">${ct.backgroundStory}:</span>
                <span class="field-text">${char.backgroundStory}</span>
              </div>
              <div class="field-item ${char.relationships ? '' : 'hidden'}">
                <span class="field-label">${ct.relationships}:</span>
                <span class="field-text">${char.relationships}</span>
              </div>
              <div class="field-item ${char.notes ? '' : 'hidden'}">
                <span class="field-label">${ct.notes}:</span>
                <span class="field-text">${char.notes}</span>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('<hr class="page-breaker"/>');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html dir="${dir}" lang="${settings.language}">
      <head>
        <meta charset="utf-8">
        <title>Characters Report - ${ct.title}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;700&family=Amiri:wght@400;700&display=swap');
          body {
            font-family: 'Cairo', 'Arial', sans-serif;
            margin: 0;
            padding: 24px;
            color: #111;
            background-color: #fff;
            font-size: 11pt;
            line-height: 1.5;
          }
          .title-area {
            text-align: center;
            margin-bottom: 30px;
          }
          h1 {
            color: #6750A4;
            margin-bottom: 5px;
          }
          h2 {
            margin-top: 0;
            color: #3b82f6;
          }
          .character-print-card {
            padding: 10px 0;
          }
          .card-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 2px solid #503d82;
            padding-bottom: 8px;
            margin-bottom: 15px;
          }
          .badge-row {
            display: flex;
            gap: 10px;
          }
          .badge {
            background-color: #f3f4f6;
            margin: 0;
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 9pt;
            font-weight: bold;
          }
          .section-grid {
            display: flex;
            gap: 30px;
            margin-top: 15px;
          }
          .col {
            flex: 1;
          }
          .stats-col {
            max-width: 35%;
            border-right: ${isAr ? 'none' : '1px solid #e5e7eb'};
            border-left: ${isAr ? '1px solid #e5e7eb' : 'none'};
            padding-right: 15px;
            padding-left: 15px;
          }
          .stats-table {
            width: 100%;
            border-collapse: collapse;
          }
          .stats-table td {
            padding: 6px 0;
            font-size: 10pt;
          }
          .field-item {
            margin-bottom: 12px;
          }
          .field-label {
            font-weight: bold;
            display: block;
            color: #4b5563;
            font-size: 9.5pt;
          }
          .field-text {
            display: block;
            margin-top: 4px;
            color: #1f2937;
            text-align: justify;
          }
          .hidden {
            display: none !important;
          }
          .page-breaker {
            margin: 40px 0;
            border: 0;
            border-top: 1px dashed #bbb;
            page-break-after: always;
          }
          @media print {
            .no-print {
              display: none !important;
            }
          }
          .print-nav {
            background-color: #1e293b;
            color: white;
            padding: 12px 20px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
          }
          .btn {
            background-color: #3b82f6;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <div class="print-nav no-print">
          <span>${isAr ? 'تقرير الشخصيات وقاعدة البيانات التثقيفية' : 'Characters Profile Report Screen'}</span>
          <button class="btn" onclick="window.print()">${isAr ? 'بدء الطباعة الآن / حفظ بملف PDF' : 'Print PDF'}</button>
        </div>
        
        <div class="title-area">
          <h1>${ct.title}</h1>
          <p>${ct.subtitle}</p>
        </div>

        ${formattedCardsHtml}
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Trigger programmed jsPDF report containing characters
  const handleExportPDFReport = () => {
    // Generate the programmatic file
    const mockProject = {
      title: ct.title,
      blocks: blocks
    } as any;
    generateCharacterReportPDF(mockProject, characters, settings);
  };

  if (!isOpen) return null;

  return (
    <div id="characters_panel_overlay" className="absolute inset-0 bg-black/60 flex items-center justify-center p-0 md:p-4 z-40 transition-all select-none font-sans overflow-hidden">
      <div className={`w-full h-full md:max-w-[412px] md:h-[840px] md:rounded-[40px] flex flex-col relative overflow-hidden transition-all border duration-300 shadow-2xl ${
        settings.darkMode ? 'bg-zinc-950 border-zinc-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        
        {/* UPPER HEADER */}
        <div className={`px-5 py-4 flex items-center justify-between border-b shrink-0 ${
          settings.darkMode ? 'bg-zinc-900/60 border-zinc-800/80' : 'bg-slate-50 border-slate-100'
        }`}>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-primary shrink-0 animate-pulse" />
            <div>
              <h2 className="font-bold text-sm tracking-tight">{activeProfileId ? ct.profileTitle : ct.title}</h2>
              <p className="text-[10px] opacity-60 font-semibold">{ct.subtitle.slice(0, 48)}...</p>
            </div>
          </div>
          
          <button
            id="btn_close_characters_panel"
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              settings.darkMode ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-slate-200 text-slate-500'
            }`}
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* CONTAINER SHEETS BODY */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          
          {/* PROFILE VIEW SHEET */}
          {activeCharacter && !showEditForm ? (
            <div className="absolute inset-0 flex flex-col bg-inherit z-10">
              
              {/* Profile Top bar Actions */}
              <div className={`px-5 py-2.5 flex justify-between items-center border-b shrink-0 ${
                settings.darkMode ? 'bg-zinc-900/40 border-zinc-850' : 'bg-slate-100/30 border-slate-100'
              }`}>
                <button
                  id="btn_char_profile_back"
                  onClick={() => setActiveProfileId(null)}
                  className={`flex items-center gap-1 font-bold text-xs cursor-pointer py-1.5 px-2.5 rounded-xl transition-colors ${
                    settings.darkMode ? 'text-zinc-300 hover:bg-zinc-850' : 'text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {isAr ? <ChevronRight className="w-4 h-4 ml-0.5" /> : <ChevronLeft className="w-4 h-4 mr-0.5" />}
                  <span>{ct.backToDirectory}</span>
                </button>

                <div className="flex gap-1">
                  <button
                    onClick={() => handleOpenEditForm(activeCharacter)}
                    className={`p-2 rounded-xl text-brand-primary hover:opacity-90 transition-all cursor-pointer ${
                      settings.darkMode ? 'hover:bg-zinc-850' : 'hover:bg-slate-100'
                    }`}
                    title={ct.editCharacter}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCharacter(activeCharacter.id)}
                    className={`p-2 rounded-xl text-rose-500 hover:opacity-90 transition-all cursor-pointer ${
                      settings.darkMode ? 'hover:bg-zinc-850' : 'hover:bg-slate-100'
                    }`}
                    title={ct.deleteCharacter}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Character Details Body Scrolling layout */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                
                {/* Visual Avatar Header Box */}
                <div className={`p-4 rounded-3xl flex items-center gap-4 relative overflow-hidden bg-gradient-to-tr ${
                  settings.darkMode 
                    ? 'from-zinc-900 to-zinc-950 border border-zinc-800' 
                    : 'from-brand-primary/5 to-purple-500/5 border border-purple-100'
                }`}>
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg ${
                    settings.darkMode ? 'bg-zinc-800 border border-zinc-750 text-brand-primary' : 'bg-brand-primary text-white'
                  }`}>
                    {activeCharacter.name.trim().charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-base truncate tracking-tight">{activeCharacter.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {activeCharacter.gender && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-sky-400/10 text-sky-400 font-bold border border-sky-400/20">
                          {activeCharacter.gender}
                        </span>
                      )}
                      {activeCharacter.age && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] bg-amber-400/10 text-amber-400 font-bold border border-amber-400/20">
                          {activeCharacter.age}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Eelegant Bento Statistics Board */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-brand-primary flex items-center gap-1">
                    <span>📊</span>
                    <span>{ct.statsTitle}</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-3 rounded-2xl flex flex-col gap-0.5 border ${
                      settings.darkMode ? 'bg-zinc-900/40 border-zinc-850' : 'bg-[#F3F4F6] border-slate-150'
                    }`}>
                      <span className="text-[10px] opacity-65 font-semibold text-slate-400">{ct.totalScenes}</span>
                      <span className="font-black text-lg text-emerald-500">{activeCharacter.stats.sceneCount}</span>
                    </div>

                    <div className={`p-3 rounded-2xl flex flex-col gap-0.5 border ${
                      settings.darkMode ? 'bg-zinc-900/40 border-zinc-850' : 'bg-[#F3F4F6] border-slate-150'
                    }`}>
                      <span className="text-[10px] opacity-65 font-semibold text-slate-400">{ct.dialogueCount}</span>
                      <span className="font-black text-lg text-brand-primary">{activeCharacter.stats.dialogueCount}</span>
                    </div>

                    <div className={`p-3 rounded-2xl col-span-2 flex flex-col gap-0.5 border ${
                      settings.darkMode ? 'bg-zinc-900/40 border-zinc-850' : 'bg-[#F3F4F6] border-slate-150'
                    }`}>
                      <span className="text-[10px] opacity-65 font-semibold text-slate-400">{ct.screenTime}</span>
                      <span className="font-black text-base text-amber-500">{activeCharacter.stats.screenTimeStr}</span>
                    </div>

                    {activeCharacter.stats.sceneNumbers.length > 0 && (
                      <div className={`p-3 rounded-2xl col-span-2 flex flex-col gap-1 border ${
                        settings.darkMode ? 'bg-zinc-900/40 border-zinc-850' : 'bg-[#F3F4F6] border-slate-150'
                      }`}>
                        <span className="text-[10px] opacity-65 font-semibold text-slate-400">{ct.scenesList}</span>
                        <div className="flex flex-wrap gap-1.5 mt-0.5">
                          {activeCharacter.stats.sceneNumbers.map(n => (
                            <span key={n} className={`px-2 py-0.5 rounded font-black text-[10px] scale-95 ${
                              settings.darkMode ? 'bg-zinc-800 text-zinc-350' : 'bg-[#E8DEF8]/40 text-brand-dark'
                            }`}>
                              🎬 {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Profile fields bento blocks */}
                <div className="space-y-4 pt-2">
                  
                  {/* Physical Traits */}
                  {activeCharacter.physicalDescription && (
                    <div className={`p-4 rounded-3xl border transition-all ${
                      settings.darkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-indigo-400">
                        <Dna className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>{ct.physicalDescription}</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed font-semibold opacity-90 whitespace-pre-wrap">{activeCharacter.physicalDescription}</p>
                    </div>
                  )}

                  {/* Personality Traits */}
                  {activeCharacter.personalityTraits && (
                    <div className={`p-4 rounded-3xl border transition-all ${
                      settings.darkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-pink-400">
                        <Sparkles className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>{ct.personalityTraits}</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed font-semibold opacity-90 whitespace-pre-wrap">{activeCharacter.personalityTraits}</p>
                    </div>
                  )}

                  {/* Psychological Traits */}
                  {activeCharacter.psychologicalTraits && (
                    <div className={`p-4 rounded-3xl border transition-all ${
                      settings.darkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-amber-400">
                        <UserCircle className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>{ct.psychologicalTraits}</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed font-semibold opacity-90 whitespace-pre-wrap">{activeCharacter.psychologicalTraits}</p>
                    </div>
                  )}

                  {/* Motivations & Goals */}
                  {activeCharacter.motivationsGoals && (
                    <div className={`p-4 rounded-3xl border transition-all ${
                      settings.darkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-emerald-400">
                        <Target className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>{ct.motivationsGoals}</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed font-semibold opacity-90 whitespace-pre-wrap">{activeCharacter.motivationsGoals}</p>
                    </div>
                  )}

                  {/* Background Story */}
                  {activeCharacter.backgroundStory && (
                    <div className={`p-4 rounded-3xl border transition-all ${
                      settings.darkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-cyan-400">
                        <History className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>{ct.backgroundStory}</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed font-semibold opacity-90 whitespace-pre-wrap">{activeCharacter.backgroundStory}</p>
                    </div>
                  )}

                  {/* Relationships with Other Characters */}
                  {activeCharacter.relationships && (
                    <div className={`p-4 rounded-3xl border transition-all ${
                      settings.darkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-rose-400">
                        <Heart className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>{ct.relationships}</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed font-semibold opacity-90 whitespace-pre-wrap">{activeCharacter.relationships}</p>
                    </div>
                  )}

                  {/* Notes */}
                  {activeCharacter.notes && (
                    <div className={`p-4 rounded-3xl border transition-all ${
                      settings.darkMode ? 'bg-zinc-900/50 border-zinc-800/80' : 'bg-slate-50 border-slate-100'
                    }`}>
                      <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-violet-400">
                        <StickyNote className="w-4.5 h-4.5 flex-shrink-0" />
                        <span>{ct.notes}</span>
                      </div>
                      <p className="text-[11.5px] leading-relaxed font-semibold opacity-90 whitespace-pre-wrap">{activeCharacter.notes}</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          ) : null}

          {/* EDIT/ADD CHARACTER FORM SHEET */}
          {showEditForm ? (
            <form onSubmit={handleSaveCharacter} className="absolute inset-0 flex flex-col bg-inherit z-25 overflow-hidden">
              <div className={`px-5 py-3 flex justify-between items-center border-b shrink-0 ${
                settings.darkMode ? 'bg-zinc-900/50 border-zinc-800' : 'bg-slate-50 border-slate-100'
              }`}>
                <h3 className="font-bold text-xs text-brand-primary">
                  {editingCharId ? ct.editCharacter : ct.addCharacter}
                </h3>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setShowEditForm(false)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      settings.darkMode ? 'hover:bg-zinc-850 text-zinc-400' : 'hover:bg-slate-100 text-slate-500'
                    }`}
                  >
                    {ct.cancel}
                  </button>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4">
                
                {/* Character Name field (Required) */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-75">{ct.name} <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    maxLength={40}
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={ct.placeholderName}
                    className={`px-4 py-3 rounded-2xl border text-xs font-semibold tracking-tight transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                      settings.darkMode 
                        ? 'bg-zinc-900 border-zinc-850 text-white focus:border-zinc-700' 
                        : 'bg-[#F3F4F6] border-slate-200 text-slate-950 focus:border-indigo-400'
                    }`}
                  />
                </div>

                {/* Grid for Gender & Age */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold opacity-75">{ct.gender}</label>
                    <input
                      type="text"
                      maxLength={30}
                      value={formGender}
                      onChange={(e) => setFormGender(e.target.value)}
                      placeholder={ct.placeholderGender}
                      className={`px-4 py-3 rounded-2xl border text-xs font-semibold tracking-tight transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                        settings.darkMode 
                          ? 'bg-zinc-900 border-zinc-850 text-white' 
                          : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                      }`}
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold opacity-75">{ct.age}</label>
                    <input
                      type="text"
                      maxLength={20}
                      value={formAge}
                      onChange={(e) => setFormAge(e.target.value)}
                      placeholder={ct.placeholderAge}
                      className={`px-4 py-3 rounded-2xl border text-xs font-semibold tracking-tight transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                        settings.darkMode 
                          ? 'bg-zinc-900 border-zinc-850 text-white' 
                          : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                      }`}
                    />
                  </div>
                </div>

                {/* Traits, Backgrounds description fields */}
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-75">{ct.physicalDescription}</label>
                  <textarea
                    rows={2}
                    value={formPhysicalDescription}
                    onChange={(e) => setFormPhysicalDescription(e.target.value)}
                    className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                      settings.darkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-75">{ct.personalityTraits}</label>
                  <textarea
                    rows={2}
                    value={formPersonalityTraits}
                    onChange={(e) => setFormPersonalityTraits(e.target.value)}
                    className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                      settings.darkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-75">{ct.psychologicalTraits}</label>
                  <textarea
                    rows={2}
                    value={formPsychologicalTraits}
                    onChange={(e) => setFormPsychologicalTraits(e.target.value)}
                    className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                      settings.darkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-75">{ct.motivationsGoals}</label>
                  <textarea
                    rows={2}
                    value={formMotivationsGoals}
                    onChange={(e) => setFormMotivationsGoals(e.target.value)}
                    className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                      settings.darkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-75">{ct.backgroundStory}</label>
                  <textarea
                    rows={3}
                    value={formBackgroundStory}
                    onChange={(e) => setFormBackgroundStory(e.target.value)}
                    className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                      settings.darkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-75">{ct.relationships}</label>
                  <textarea
                    rows={2}
                    value={formRelationships}
                    onChange={(e) => setFormRelationships(e.target.value)}
                    className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                      settings.darkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold opacity-75">{ct.notes}</label>
                  <textarea
                    rows={2}
                    value={formNotes}
                    onChange={(e) => setFormNotes(e.target.value)}
                    className={`px-4 py-3 rounded-2xl border text-xs font-semibold transition-all focus:ring-2 focus:ring-brand-primary outline-none ${
                      settings.darkMode ? 'bg-zinc-900 border-zinc-850 text-white' : 'bg-[#F3F4F6] border-slate-200 text-slate-950'
                    }`}
                  />
                </div>

              </div>

              {/* Save footer */}
              <div className={`p-4 border-t shrink-0 ${
                settings.darkMode ? 'bg-zinc-900 border-zinc-805' : 'bg-slate-50 border-slate-100'
              }`}>
                <button
                  type="submit"
                  id="btn_submit_char_profile"
                  className="w-full py-3.5 bg-brand-primary hover:opacity-95 text-white rounded-2xl text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  {ct.saveCharacter}
                </button>
              </div>
            </form>
          ) : null}

          {/* MAIN DIRECTORY VIEW */}
          <div className="flex-1 flex flex-col overflow-hidden">
            
            {/* Search and Sort Toolbar */}
            <div className={`p-4 border-b shrink-0 space-y-3 ${
              settings.darkMode ? 'bg-zinc-900/30 border-zinc-850' : 'bg-slate-50/50 border-slate-100'
            }`}>
              {/* Search input field */}
              <div className="relative">
                <Search className={`w-4 h-4 absolute top-1/2 transform -translate-y-1/2 opacity-50 ${isAr ? 'left-3' : 'right-3'}`} />
                <input
                  type="text"
                  id="input_search_characters"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={ct.searchPlaceholder}
                  className={`w-full py-2.5 px-3 rounded-2xl border text-xs font-semibold transition-all outline-none focus:ring-2 focus:ring-brand-primary ${
                    settings.darkMode 
                      ? 'bg-zinc-900/60 border-zinc-800 text-white focus:border-zinc-700' 
                      : 'bg-[#F3F4F6] border-slate-150 text-slate-950 focus:border-indigo-400'
                  }`}
                  style={{ paddingRight: isAr ? '12px' : '36px', paddingLeft: isAr ? '36px' : '12px' }}
                />
              </div>

              {/* Sorting Selection options */}
              <div className="flex items-center justify-between gap-2 text-[10.5px]">
                <div className="flex items-center gap-1 opacity-70 font-bold">
                  <ArrowUpDown className="w-3.5 h-3.5" />
                  <span>{ct.sortByLabel}:</span>
                </div>
                
                <div className="flex items-center gap-1">
                  {(['name', 'scenes', 'dialogue'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => {
                        if (sortBy === mode) {
                          setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
                        } else {
                          setSortBy(mode);
                          setSortOrder(mode === 'name' ? 'asc' : 'desc');
                        }
                      }}
                      className={`px-2.5 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                        sortBy === mode
                          ? 'bg-brand-primary/10 text-brand-primary border border-brand-primary/25'
                          : settings.darkMode 
                            ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 border border-zinc-800' 
                            : 'bg-[#F3F4F6] hover:bg-slate-200 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {mode === 'name' && ct.sortName}
                      {mode === 'scenes' && ct.sortScenes}
                      {mode === 'dialogue' && ct.sortDialogue}
                      {sortBy === mode && (
                        <span className="ml-1 scale-95">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Scrolling Directory Cards list */}
            <div className="flex-1 p-5 overflow-y-auto space-y-3">
              {filteredAndSortedCharacters.length === 0 ? (
                <div className="py-16 text-center">
                  <User className="w-12 h-12 text-zinc-600 mx-auto opacity-30 animate-bounce" />
                  <p className="text-xs font-bold text-slate-500 mt-3">{ct.noCharacters}</p>
                </div>
              ) : (
                filteredAndSortedCharacters.map((char) => (
                  <div
                    key={char.id}
                    onClick={() => setActiveProfileId(char.id)}
                    className={`p-4 rounded-[24px] border transition-all cursor-pointer flex justify-between items-center group relative ${
                      settings.darkMode 
                        ? 'bg-zinc-900/60 hover:bg-zinc-900 border-zinc-800 text-slate-100 hover:border-zinc-700' 
                        : 'bg-white hover:bg-slate-50 border-slate-150 text-slate-900 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base bg-brand-primary/10 text-brand-primary shrink-0`}>
                        {char.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="truncate">
                        <h4 className="font-bold text-xs truncate tracking-tight">{char.name}</h4>
                        <div className="flex items-center gap-2 mt-1 font-semibold text-[9.5px] opacity-70">
                          <span className="text-emerald-500">🎬 {char.stats.sceneCount}</span>
                          <span className="text-brand-primary">💬 {char.stats.dialogueCount}</span>
                          <span className="text-amber-500">⏱ {char.stats.screenTimeStr}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-brand-primary transition-all ${
                        isRtl ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Direct Multi-format PDF Reports generator Footer */}
            <div className={`p-4 border-t gap-2 flex shrink-0 ${
              settings.darkMode ? 'bg-zinc-900 border-zinc-805' : 'bg-slate-50 border-slate-100'
            }`}>
              
              <button
                id="btn_characters_pdf_export_report"
                onClick={handleExportPDFReport}
                disabled={characters.length === 0}
                className="flex-1 py-3 bg-[#E8DEF8]/25 border border-[#E8DEF8]/35 text-brand-primary hover:opacity-90 disabled:opacity-40 rounded-xl text-[11px] font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileDown className="w-4 h-4" />
                <span>{ct.exportReport}</span>
              </button>

              <button
                id="btn_characters_print_report"
                onClick={handlePrintCharacterReport}
                disabled={characters.length === 0}
                className="flex-1 py-3 bg-zinc-850 hover:opacity-90 disabled:opacity-40 rounded-xl text-[11px] font-bold text-white transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-brand-primary" />
                <span>{ct.printReport}</span>
              </button>
            </div>

            {/* Create character bottom trigger */}
            <div className={`px-4 pb-4 shrink-0 bg-inherit`}>
              <button
                id="btn_characters_add_new"
                onClick={handleOpenAddForm}
                className="w-full py-3.5 bg-brand-primary hover:opacity-95 text-white rounded-2xl text-xs font-black tracking-wide transition-all text-center flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{ct.addCharacter}</span>
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
