import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import ResultTable from './ResultTable';
import '../styles/modal.css';

const TablePreviewModal = ({ open, onClose, previewMeta, result, loading, error }) => {
    useEffect(() => {
        if (!open) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, onClose]);

    useEffect(() => {
        if (open) {
            document.body.classList.add('modal-open');
            return () => {
                document.body.classList.remove('modal-open');
            };
        }

        document.body.classList.remove('modal-open');
        return undefined;
    }, [open]);

    if (!open) {
        return null;
    }

    const title = previewMeta?.label ?? (result?.tableName ? `Preview: ${result.tableName}` : 'Table preview');

    const handleOverlayClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            onClick={handleOverlayClick}
        >
            <div className="modal modal--wide" role="document">
                <header className="modal__header">
                    <div className="modal__title">
                        <i className="fa-solid fa-eye" aria-hidden="true" />
                        <span>{title}</span>
                    </div>
                    <div className="modal__actions">
                        {previewMeta?.rows != null && (
                            <span className="modal__metric">
                                <i className="fa-solid fa-database" aria-hidden="true" />
                                {previewMeta.rows} row{previewMeta.rows === 1 ? '' : 's'}
                            </span>
                        )}
                        {previewMeta?.elapsed != null && (
                            <span className="modal__metric">
                                <i className="fa-regular fa-clock" aria-hidden="true" />
                                {previewMeta.elapsed} ms
                            </span>
                        )}
                        <button type="button" className="modal__close" onClick={onClose} aria-label="Close preview">
                            <i className="fa-solid fa-xmark" />
                        </button>
                    </div>
                </header>
                <div className="modal__body">
                    {loading ? (
                        <div className="modal__loading" role="status" aria-live="polite">
                            <span className="modal__spinner" aria-hidden="true" />
                            <p>Loading preview…</p>
                        </div>
                    ) : error ? (
                        <div className="modal__error" role="alert">
                            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                            <p>{error}</p>
                            <button type="button" className="modal__retry" onClick={onClose}>
                                Dismiss
                            </button>
                        </div>
                    ) : result ? (
                        <div className="modal__table">
                            <ResultTable title={title} result={result} />
                        </div>
                    ) : (
                        <div className="modal__empty">
                            <p>Select a table to preview its sample rows.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

TablePreviewModal.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    previewMeta: PropTypes.shape({
        label: PropTypes.string,
        rows: PropTypes.number,
        elapsed: PropTypes.number
    }),
    result: PropTypes.shape({
        fields: PropTypes.arrayOf(PropTypes.string),
        rows: PropTypes.arrayOf(PropTypes.object),
        rowCount: PropTypes.number,
        tableName: PropTypes.string
    }),
    loading: PropTypes.bool,
    error: PropTypes.string
};

TablePreviewModal.defaultProps = {
    previewMeta: null,
    result: null,
    loading: false,
    error: null
};

export default TablePreviewModal;
