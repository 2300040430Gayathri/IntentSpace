import { useRef, useCallback } from 'react';
import { IoList, IoLink } from 'react-icons/io5';
import styles from './RichTextEditor.module.css';

const RichTextEditor = ({ value, onChange, placeholder = 'Start writing...' }) => {
  const editorRef = useRef(null);

  const exec = useCallback((command, val = null) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    onChange(editorRef.current?.innerHTML || '');
  }, [onChange]);

  const handleInput = () => {
    onChange(editorRef.current?.innerHTML || '');
  };

  return (
    <div className={styles.editor}>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => exec('bold')} title="Bold"><strong>B</strong></button>
        <button type="button" onClick={() => exec('italic')} title="Italic"><em>I</em></button>
        <button type="button" onClick={() => exec('insertUnorderedList')} title="List"><IoList /></button>
        <button type="button" onClick={() => { const url = prompt('URL:'); if (url) exec('createLink', url); }} title="Link"><IoLink /></button>
      </div>
      <div
        ref={editorRef}
        className={styles.content}
        contentEditable
        dangerouslySetInnerHTML={{ __html: value }}
        onInput={handleInput}
        data-placeholder={placeholder}
      />
    </div>
  );
};

export default RichTextEditor;
