import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import '../styles/editor.css';

const Editor = ({ value, onChange, onRun, onRunSelection, loading }) => {
    const textareaRef = useRef(null);

    const handleRunSelection = () => {
        if (!textareaRef.current) return;

        const { selectionStart, selectionEnd, value: sqlText } = textareaRef.current;
        const selection = sqlText.slice(selectionStart, selectionEnd).trim();
        onRunSelection?.(selection);
    };

    const handleKeyDown = (event) => {
        if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'enter') {
            event.preventDefault();
            handleRunSelection();
        }
    };

    return (
        <section className="editor">
            <header className="editor__header">
                <div>
                    <h2 className="editor__title">SQL Editor</h2>
                    <p className="editor__hint">
                        Use CTRL/CMD + Enter to run just the highlighted statement, or run the entire query below.
                    </p>
                </div>
                <div className="editor__actions">
                    <button
                        type="button"
                        className="editor__btn editor__btn--ghost"
                        onClick={handleRunSelection}
                        disabled={loading}
                    >
                        Run selected
                    </button>
                    <button
                        type="button"
                        className="editor__btn"
                        onClick={onRun}
                        disabled={loading}
                    >
                        {loading ? 'Running…' : 'Run full query'}
                    </button>
                </div>
            </header>
            <textarea
                ref={textareaRef}
                className="editor__textarea"
                value={value}
                onChange={(event) => onChange(event.target.value)}
                onKeyDown={handleKeyDown}
                spellCheck={false}
                placeholder="-- Write a SQL statement\nSELECT * FROM students;"
            />
        </section>
    );
};

Editor.propTypes = {
    value: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired,
    onRun: PropTypes.func.isRequired,
    onRunSelection: PropTypes.func,
    loading: PropTypes.bool
};

Editor.defaultProps = {
    onRunSelection: undefined,
    loading: false
};

export default Editor;
