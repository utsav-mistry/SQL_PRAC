import React from 'react';
import PropTypes from 'prop-types';
import '../styles/error-box.css';

const ErrorBox = ({ message, onDismiss }) => (
    <div className="error-box" role="alert">
        <div className="error-box__content">
            <h3 className="error-box__title">Query Error</h3>
            <p className="error-box__message">{message}</p>
        </div>
        <button type="button" className="error-box__dismiss" onClick={onDismiss}>
            Dismiss
        </button>
    </div>
);

ErrorBox.propTypes = {
    message: PropTypes.string.isRequired,
    onDismiss: PropTypes.func.isRequired
};

export default ErrorBox;
