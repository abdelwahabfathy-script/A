export type BlockType =
  | 'SCENE_HEADING'
  | 'ACTION'
  | 'CHARACTER'
  | 'DIALOGUE'
  | 'PARENTHETICAL'
  | 'TRANSITION'
  | 'SHOT'
  | 'CENTER_TEXT';

export interface ScreenplayBlock {
  id: string;
  type: BlockType;
  text: string;
}

export interface ScreenplayProject {
  id: string;
  title: string;
  blocks: ScreenplayBlock[];
  lastModified: number;
}

export interface UserSettings {
  fontSize: number; // e.g., 12, 14, 16, 18, 20
  darkMode: boolean;
  language: 'en' | 'ar';
  autosave: boolean;
  sceneNumbering: boolean;
}

export const translations = {
  en: {
    appName: "Scene Writer",
    tagline: "Unleash your scenes, write professionally.",
    projects: "Projects",
    searchProjects: "Search projects...",
    searchInScreenplay: "Search inside screenplay...",
    noProjects: "No screenplay projects found. Tap '+' to create one!",
    createProject: "Create Screenplay",
    renameProject: "Rename Screenplay",
    duplicateProject: "Duplicate Screenplay",
    deleteProject: "Delete Screenplay",
    title: "Title",
    untitled: "Untitled Screenplay",
    lastModified: "Last modified",
    scenesCount: "scenes",
    deleteConfirm: "Are you sure you want to delete this screenplay?",
    duplicateConfirm: "Duplicate this screenplay?",
    cancel: "Cancel",
    confirm: "Confirm",
    create: "Create",
    save: "Save",
    rename: "Rename",
    duplicate: "Duplicate",
    delete: "Delete",
    editor: "Editor",
    statistics: "Statistics",
    scenes: "Scenes",
    settings: "Settings",
    totalPages: "Total Pages",
    wordCount: "Word Count",
    screenTime: "Est. Screen Time",
    minutes: "min",
    seconds: "sec",
    sceneList: "Scene List",
    noScenes: "No scenes created yet",
    sceneNumbering: "Scene Numbering",
    sceneNumberingDesc: "Show numbers on scene headings",
    fontSize: "Font Size",
    darkMode: "Dark Mode",
    language: "Language",
    autosave: "Autosave Changes",
    autosaveActive: "Autosaved",
    importExport: "Import & Export",
    exportPdf: "Export to PDF",
    importTxt: "Import TXT File",
    pasteWordText: "Paste text / import raw content below:",
    importButton: "Import Text",
    back: "Back",
    // Block labels
    HEADING: "Scene Heading",
    ACTION: "Action",
    CHARACTER: "Character",
    DIALOGUE: "Dialogue",
    PARENTHETICAL: "Parenthetical",
    TRANSITION: "Transition",
    SHOT: "Shot",
    CENTER_TEXT: "Center Text",
    undo: "Undo",
    redo: "Redo",
    addTitle: "Add Scene Title",
    placeholderHeading: "e.g., INT. HOUSE - NIGHT",
    placeholderAction: "Ahmed enters wearing a dark coat...",
    placeholderCharacter: "AHMED",
    placeholderDialogue: "I thought we were meeting in the plaza.",
    placeholderParenthetical: "(whispering)",
    placeholderTransition: "CUT TO:",
    placeholderShot: "CLOSE UP on his nervous eyes.",
    placeholderCenterText: "THE END",
    pastePlaceholder: "Paste your screenplay text here...",
    helpText: "💡 Tip: Press Enter to auto-advance (Character -> Dialogue -> Action). Press TAB to toggle formats.",
  },
  ar: {
    appName: "كاتب السيناريو",
    tagline: "أطلق العنان لمشاهدك واكتب باحترافية.",
    projects: "المشاريع",
    searchProjects: "البحث في المشاريع...",
    searchInScreenplay: "البحث داخل السيناريو...",
    noProjects: "لم يتم العثور على أي سيناريو. اضغط '+' لإنشاء واحد!",
    createProject: "إنشاء سيناريو",
    renameProject: "إعادة تسمية السيناريو",
    duplicateProject: "عمل نسخة مكررة",
    deleteProject: "حذف السيناريو",
    title: "العنوان",
    untitled: "سيناريو غير معنون",
    lastModified: "آخر تعديل",
    scenesCount: "مشاهد",
    deleteConfirm: "هل أنت متأكد أنك تريد حذف هذا السيناريو؟",
    duplicateConfirm: "هل تريد إنشاء نسخة مكررة من هذا السيناريو؟",
    cancel: "إلغاء",
    confirm: "تأكيد",
    create: "إنشاء",
    save: "حفظ",
    rename: "إعادة تسمية",
    duplicate: "نسخ مكرر",
    delete: "حذف",
    editor: "المحرر",
    statistics: "الإحصائيات",
    scenes: "المشاهد",
    settings: "الإعدادات",
    totalPages: "عدد الصفحات",
    wordCount: "عدد الكلمات",
    screenTime: "الوقت التقديري",
    minutes: "دقيقة",
    seconds: "ثانية",
    sceneList: "قائمة المشاهد",
    noScenes: "لا توجد مشاهد مضافة بعد",
    sceneNumbering: "ترقيم المشاهد",
    sceneNumberingDesc: "إظهار الأرقام على ترويسة المشاهد",
    fontSize: "حجم الخط",
    darkMode: "الوضع الداكن",
    language: "اللغة",
    autosave: "حفظ تلقائي",
    autosaveActive: "تم الحفظ تلقائياً",
    importExport: "الاستيراد والتصدير",
    exportPdf: "تصدير إلى PDF",
    importTxt: "استيراد ملف TXT",
    pasteWordText: "قم بلصق النص أو استيراد محتوى خام أدناه:",
    importButton: "استيراد النص",
    back: "رجوع",
    // Block labels
    HEADING: "رأس المشهد",
    ACTION: "حركة / وصف",
    CHARACTER: "الشخصية",
    DIALOGUE: "الحوار",
    PARENTHETICAL: "ملاحظة أداء",
    TRANSITION: "المؤثر الانتقالي",
    SHOT: "لقطة الكاميرا",
    CENTER_TEXT: "تبسيط / توسيط",
    undo: "تراجع",
    redo: "إعادة",
    addTitle: "إضافة عنوان للمشهد",
    placeholderHeading: "مثال: خارجي. منزل أحمد - ليل",
    placeholderAction: "يدخل أحمد وهو يرتدي معطفاً دافئاً...",
    placeholderCharacter: "أحمد",
    placeholderDialogue: "ظننت أننا سنلتقي في الساحة العامة.",
    placeholderParenthetical: "(يهمس بقلق)",
    placeholderTransition: "انتقال سريع إلى:",
    placeholderShot: "لقطة قريبة لعينيه المتوترتين.",
    placeholderCenterText: "تمت بحمد الله",
    pastePlaceholder: "الصق نص السيناريو الخاص بك هنا...",
    helpText: "💡 نصيحة: اضغط على Enter للانتقال التلقائي (الشخصية -> حوار -> حركة). اضغط على TAB للتبديل السريع.",
  }
};
