/**
 * مكون محرر النصوص الغني (TextEditor)
 * ─────────────────────────────────────
 * يستخدم Draft.js لتوفير محرر نصوص غني يدعم:
 *  • نص عريض (Bold)
 *  • نص مائل (Italic)
 *  • تسطير (Underline)
 *  • قائمة مرتبة (Ordered List)
 *  • قائمة غير مرتبة (Unordered List)
 *
 * الخصائص (Props):
 *  - onChange: دالة تُستدعى عند تغيير المحتوى، تُمرر لها سلسلة JSON (Raw ContentState)
 *  - initialEditorState: حالة أولية للمحرر (اختياري — مفيد لحالة التعديل)
 *
 * السلوك:
 *  يحول المحتوى إلى JSON عبر convertToRaw ويرسله للمكون الأب.
 *  السيرفر يخزّن الخطوات (steps) بصيغة JSON في عمود من نوع JSON.
 */
import { useCallback, useRef, type FC } from 'react';
import {
  Editor,
  EditorState,
  RichUtils,
  convertToRaw,
  type DraftBlockType,
  type DraftInlineStyleType,
} from 'draft-js';
import 'draft-js/dist/Draft.css';
import './TextEditor.css';

/* ─── أنواع الخصائص ─── */
interface TextEditorProps {
  /** دالة تُستدعى عند كل تغيير — تُمرر لها JSON string من Raw ContentState */
  onChange: (rawJson: string) => void;
  /** حالة المحرر المُتحكم بها من الخارج */
  editorState: EditorState;
  /** دالة لتحديث حالة المحرر في المكون الأب */
  onEditorStateChange: (state: EditorState) => void;
}

/* ─── أنواع الأنماط ─── */
interface StyleItem {
  label: string;
  style: string;
}

/* أنماط الكتل (Block Types) */
const BLOCK_TYPES: StyleItem[] = [
  { label: 'قائمة غير مرتبة', style: 'unordered-list-item' },
  { label: 'قائمة مرتبة', style: 'ordered-list-item' },
];

/* أنماط السطر (Inline Styles) */
const INLINE_STYLES: StyleItem[] = [
  { label: 'B', style: 'BOLD' },
  { label: 'I', style: 'ITALIC' },
  { label: 'U', style: 'UNDERLINE' },
];

/* ─── زر تنسيق فردي ─── */
interface StyleButtonProps {
  label: string;
  style: string;
  isActive: boolean;
  onToggle: (style: string) => void;
}

const StyleButton: FC<StyleButtonProps> = ({ label, style, isActive, onToggle }) => {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault(); // منع فقدان التركيز من المحرر
    onToggle(style);
  };

  return (
    <span
      className={`RichEditor-styleButton ${isActive ? 'RichEditor-activeButton' : ''}`}
      onMouseDown={handleMouseDown}
      role="button"
      tabIndex={0}
    >
      {label}
    </span>
  );
};

/* ─── المكون الرئيسي ─── */
const TextEditor: FC<TextEditorProps> = ({ onChange, editorState, onEditorStateChange }) => {
  const editorRef = useRef<Editor>(null);

  /** نقل التركيز إلى المحرر */
  const focusEditor = useCallback(() => {
    editorRef.current?.focus();
  }, []);

  /** معالجة تغيير حالة المحرر */
  const handleChange = useCallback(
    (newState: EditorState) => {
      onEditorStateChange(newState);
      const rawContent = convertToRaw(newState.getCurrentContent());
      onChange(JSON.stringify(rawContent));
    },
    [onChange, onEditorStateChange]
  );

  /** تبديل نمط الكتلة (قائمة مرتبة / غير مرتبة) */
  const toggleBlockType = useCallback(
    (blockType: string) => {
      const newState = RichUtils.toggleBlockType(editorState, blockType as DraftBlockType);
      handleChange(newState);
    },
    [editorState, handleChange]
  );

  /** تبديل النمط السطري (عريض / مائل / تسطير) */
  const toggleInlineStyle = useCallback(
    (inlineStyle: string) => {
      const newState = RichUtils.toggleInlineStyle(
        editorState,
        inlineStyle as DraftInlineStyleType
      );
      handleChange(newState);
    },
    [editorState, handleChange]
  );

  /** اختصارات لوحة المفاتيح */
  const handleKeyCommand = useCallback(
    (command: string, state: EditorState) => {
      const newState = RichUtils.handleKeyCommand(state, command);
      if (newState) {
        handleChange(newState);
        return 'handled' as const;
      }
      return 'not-handled' as const;
    },
    [handleChange]
  );

  // حساب الأنماط النشطة حالياً
  const currentInlineStyle = editorState.getCurrentInlineStyle();
  const selection = editorState.getSelection();
  const currentBlockType = editorState
    .getCurrentContent()
    .getBlockForKey(selection.getStartKey())
    .getType();

  return (
    <div className="RichEditor-root" onClick={focusEditor}>
      {/* ─── شريط الأدوات ─── */}
      <div className="RichEditor-controls">
        {/* أنماط السطر */}
        <div className="RichEditor-controls-group">
          {INLINE_STYLES.map((type) => (
            <StyleButton
              key={type.style}
              label={type.label}
              style={type.style}
              isActive={currentInlineStyle.has(type.style)}
              onToggle={toggleInlineStyle}
            />
          ))}
        </div>
        {/* أنماط الكتل */}
        <div className="RichEditor-controls-group">
          {BLOCK_TYPES.map((type) => (
            <StyleButton
              key={type.style}
              label={type.label}
              style={type.style}
              isActive={type.style === currentBlockType}
              onToggle={toggleBlockType}
            />
          ))}
        </div>
      </div>

      {/* ─── منطقة التحرير ─── */}
      <div className="RichEditor-editor">
        <Editor
          ref={editorRef}
          editorState={editorState}
          onChange={handleChange}
          handleKeyCommand={handleKeyCommand}
          placeholder="اكتب خطوات التحضير هنا..."
          textAlignment="right"
          textDirectionality="RTL"
        />
      </div>
    </div>
  );
};

export default TextEditor;
