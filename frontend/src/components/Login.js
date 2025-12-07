import React, { useState } from 'react';
import PropTypes from 'prop-types';
import '../styles/login.css';

const Login = ({ onSubmit, loading = false, error = null }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        onSubmit({ username, password });
    };

    return (
        <div className="login">
            <div className="login__card">
                <header className="login__header">
                    <h1>SQL Practice Platform</h1>
                    <p>Sign in with your assigned sandbox credentials to start querying.</p>
                </header>
                <form className="login__form" onSubmit={handleSubmit}>
                    <label className="login__label">
                        Username
                        <input
                            type="text"
                            className="login__input"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            placeholder="Enter username"
                            autoComplete="username"
                            required
                        />
                    </label>
                    <label className="login__label">
                        Password
                        <input
                            type="password"
                            className="login__input"
                            value={password}
                            onChange={(event) => setPassword(event.target.value)}
                            placeholder="Enter password"
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    {error && <p className="login__error">{error}</p>}
                    <button type="submit" className="login__submit" disabled={loading}>
                        {loading ? 'Authenticating…' : 'Sign in'}
                    </button>
                </form>
                <footer className="login__footer">
                    <p>
                        Admin accounts can manage protected objects; practice accounts are sandboxed to
                        the public playground schema.
                    </p>
                </footer>
            </div>
        </div>
    );
};

Login.propTypes = {
    onSubmit: PropTypes.func.isRequired,
    loading: PropTypes.bool,
    error: PropTypes.string
};

export default Login;
