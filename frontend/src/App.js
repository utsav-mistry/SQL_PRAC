import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import ResultTable from './components/ResultTable';
import TablePreviewModal from './components/TablePreviewModal';
import ErrorBox from './components/ErrorBox';
import Login from './components/Login';
import InfoModal from './components/InfoModal';
import './styles/layout.css';

const API_BASE_URL = process.env.REACT_APP_API_URL ?? '';
const AUTH_ENDPOINT = API_BASE_URL
    ? `${API_BASE_URL.replace(/\/api$/, '')}/auth/login`
    : (process.env.REACT_APP_AUTH_URL ?? '/auth/login');

const api = axios.create({
    baseURL: API_BASE_URL || '/api',
    timeout: 15000
});

const defaultQuery = 'SELECT * FROM students;';

const readLocalStorage = (key) => {
    try {
        return window.localStorage.getItem(key);
    } catch (error) {
        return null;
    }
};

const writeLocalStorage = (key, value) => {
    try {
        if (value === null || value === undefined) {
            window.localStorage.removeItem(key);
        } else {
            window.localStorage.setItem(key, value);
        }
    } catch (error) {
        // Ignore storage errors (e.g. private mode)
    }
};

const App = () => {
    const [token, setToken] = useState(() => readLocalStorage('sqlSandboxToken'));
    const [role, setRole] = useState(() => readLocalStorage('sqlSandboxRole'));
    const [authLoading, setAuthLoading] = useState(false);
    const [authError, setAuthError] = useState(null);

    const [hierarchy, setHierarchy] = useState({});
    const [sql, setSql] = useState(defaultQuery);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [isRunning, setIsRunning] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [tablePreview, setTablePreview] = useState(null);
    const [resultMeta, setResultMeta] = useState(null);
    const [previewMeta, setPreviewMeta] = useState(null);
    const computeIsDesktop = () => (typeof window !== 'undefined' ? window.matchMedia('(min-width: 992px)').matches : true);
    const [isDesktop, setIsDesktop] = useState(computeIsDesktop);
    const [isSidebarOpen, setIsSidebarOpen] = useState(computeIsDesktop);
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPreviewLoading, setIsPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);

    useEffect(() => {
        if (token) {
            api.defaults.headers.common.Authorization = `Bearer ${token}`;
        } else {
            delete api.defaults.headers.common.Authorization;
        }
    }, [token]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const mediaQuery = window.matchMedia('(min-width: 992px)');

        const handleChange = (event) => {
            setIsDesktop(event.matches);
            setIsSidebarOpen(event.matches);
        };

        handleChange(mediaQuery);

        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    useEffect(() => {
        if (isDesktop) {
            setIsSidebarOpen(true);
        }
    }, [isDesktop]);

    const handleLogout = useCallback((message) => {
        setToken(null);
        setRole(null);
        writeLocalStorage('sqlSandboxToken', null);
        writeLocalStorage('sqlSandboxRole', null);
        setHierarchy({});
        setResult(null);
        setError(null);
        setSql(defaultQuery);
        setTablePreview(null);
        if (message) {
            setAuthError(message);
        }
    }, []);

    const fetchHierarchy = useCallback(async () => {
        if (!token) {
            return;
        }
        try {
            const { data } = await api.get('/hierarchy');
            setHierarchy(data);
        } catch (err) {
            if (err.response?.status === 401) {
                handleLogout('Session expired. Please sign in again.');
                return;
            }
            setError(err.response?.data?.error ?? 'Failed to load hierarchy');
        }
    }, [token, handleLogout]);

    useEffect(() => {
        if (token) {
            fetchHierarchy();
        }
    }, [token, fetchHierarchy]);

    const handleLogin = useCallback(async ({ username, password }) => {
        setAuthLoading(true);
        setAuthError(null);
        setError(null);
        try {
            const { data } = await axios.post(AUTH_ENDPOINT, { username, password }, {
                timeout: 15000
            });
            setToken(data.token);
            setRole(data.role);
            writeLocalStorage('sqlSandboxToken', data.token);
            writeLocalStorage('sqlSandboxRole', data.role);
            setSql(defaultQuery);
        } catch (err) {
            setAuthError(err.response?.data?.error ?? 'Login failed');
        } finally {
            setAuthLoading(false);
        }
    }, []);

    const sidebarData = useMemo(() => {
        const databases = Object.entries(hierarchy).map(([databaseName, schemas]) => ({
            name: databaseName,
            schemas: Object.entries(schemas ?? {}).map(([schemaName, schemaTables]) => ({
                name: schemaName,
                fullName: `${databaseName}.${schemaName}`,
                tables: Object.entries(schemaTables ?? {}).map(([tableName, meta]) => ({
                    name: tableName,
                    fullName: schemaName === 'public' ? tableName : `${schemaName}.${tableName}`,
                    meta
                }))
            }))
        }));

        return {
            name: "server@utsav's-rog",
            databases
        };
    }, [hierarchy]);

    const capitalizedRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : 'Practice';

    const handleLoadSampleQuery = useCallback(() => {
        setSql(defaultQuery);
        setResult(null);
        setError(null);
        setTablePreview(null);
    }, []);

    const handleRun = useCallback(async () => {
        if (!token) {
            handleLogout('Please sign in to execute queries.');
            return;
        }

        setIsRunning(true);
        setError(null);
        setResult(null);
        setTablePreview(null);
        setResultMeta(null);
        setPreviewMeta(null);
        try {
            const { data } = await api.post('/execute', { sql });
            setResult(data);
            setResultMeta({
                label: 'Query result',
                elapsed: data.executionTimeMs ?? null,
                rows: data.rowCount ?? data.rows?.length ?? 0
            });

            if (data.hierarchyChanged) {
                await fetchHierarchy();
            }
        } catch (err) {
            if (err.response?.status === 401) {
                handleLogout('Session expired. Please sign in again.');
                return;
            }
            setError(err.response?.data?.error ?? err.message);
        } finally {
            setIsRunning(false);
        }
    }, [sql, token, handleLogout, fetchHierarchy]);

    const handleRunSelection = useCallback(async (selection) => {
        const trimmed = selection?.trim();
        if (!trimmed) {
            handleRun();
            return;
        }

        setIsRunning(true);
        setError(null);
        setResult(null);
        setResultMeta(null);
        setTablePreview(null);
        setPreviewMeta(null);
        try {
            const { data } = await api.post('/execute', { sql: trimmed });
            setResult(data);
            setResultMeta({
                label: 'Selection result',
                elapsed: data.executionTimeMs ?? null,
                rows: data.rowCount ?? data.rows?.length ?? 0
            });

            if (data.hierarchyChanged) {
                await fetchHierarchy();
            }
        } catch (err) {
            if (err.response?.status === 401) {
                handleLogout('Session expired. Please sign in again.');
                return;
            }
            setError(err.response?.data?.error ?? err.message);
        } finally {
            setIsRunning(false);
        }
    }, [handleRun, handleLogout, fetchHierarchy]);

    const handleReset = useCallback(async () => {
        if (!window.confirm('Restore the sandbox to its default state? All practice changes will be lost.')) {
            return;
        }

        setIsResetting(true);
        setError(null);
        setResult(null);
        try {
            await api.post('/reset');
            await fetchHierarchy();
            setSql(defaultQuery);
            setTablePreview(null);
            setResultMeta(null);
            setPreviewMeta(null);
        } catch (err) {
            if (err.response?.status === 401) {
                handleLogout('Session expired. Please sign in again.');
                return;
            }
            setError(err.response?.data?.error ?? err.message);
        } finally {
            setIsResetting(false);
        }
    }, [fetchHierarchy, handleLogout]);

    const previewTable = useCallback(async (tableIdentifier) => {
        if (!tableIdentifier) {
            return;
        }

        const segments = tableIdentifier.split('.');
        const tablePart = segments.pop();
        const schemaPart = segments.join('.') || 'public';
        const qualified = schemaPart === 'public' ? tablePart : `${schemaPart}.${tablePart}`;
        const previewSql = `SELECT * FROM ${qualified} LIMIT 50;`;

        setError(null);
        setPreviewError(null);
        setPreviewMeta(null);
        setTablePreview(null);
        setIsPreviewOpen(true);
        setIsPreviewLoading(true);

        try {
            const { data } = await api.post('/execute', { sql: previewSql });
            setTablePreview({
                tableName: tableIdentifier,
                ...data
            });
            setPreviewMeta({
                label: `Preview: ${tableIdentifier}`,
                elapsed: data.executionTimeMs ?? null,
                rows: data.rowCount ?? data.rows?.length ?? 0
            });
        } catch (err) {
            if (err.response?.status === 401) {
                handleLogout('Session expired. Please sign in again.');
                return;
            }
            setPreviewError(err.response?.data?.error ?? err.message);
        } finally {
            setIsPreviewLoading(false);
        }
    }, [handleLogout]);

    const closePreviewModal = useCallback(() => {
        setIsPreviewOpen(false);
        setPreviewError(null);
        setPreviewMeta(null);
        setTablePreview(null);
        setIsPreviewLoading(false);
    }, []);

    const openSidebar = useCallback(() => {
        setIsSidebarOpen(true);
    }, []);

    const closeSidebar = useCallback(() => {
        setIsSidebarOpen(false);
    }, []);

    const handlePreviewTable = useCallback((tableIdentifier) => {
        previewTable(tableIdentifier);
        if (!isDesktop) {
            setIsSidebarOpen(false);
        }
    }, [previewTable, isDesktop]);

    const appClassName = ['app'];
    if (!isDesktop && isSidebarOpen) {
        appClassName.push('app--sidebar-open');
    }

    const chromeClassName = ['app__chrome'];
    if (isPreviewOpen) {
        chromeClassName.push('app__chrome--blurred');
    }

    if (!token) {
        return <Login onSubmit={handleLogin} loading={authLoading} error={authError} />;
    }

    return (
        <div className={appClassName.join(' ')}>
            <InfoModal />
            <TablePreviewModal
                open={isPreviewOpen}
                onClose={closePreviewModal}
                previewMeta={previewMeta}
                result={tablePreview}
                loading={isPreviewLoading}
                error={previewError}
            />
            <div className={chromeClassName.join(' ')}>
                <header className="app__topbar">
                    <div className="app__identity">
                        {!isDesktop && (
                            <button
                                type="button"
                                className="app__nav-toggle"
                                onClick={openSidebar}
                                aria-controls="workspace-sidebar"
                                aria-expanded={isSidebarOpen}
                            >
                                <i className="fa-solid fa-bars" aria-hidden="true" />
                                <span>Browse tables</span>
                            </button>
                        )}
                        <span className="app__host">server@utsav&apos;s-rog</span>
                        <span className="app__role">Role: {capitalizedRole}</span>
                    </div>
                    <div className="app__actions">
                        <button
                            type="button"
                            className="app__btn app__btn--ghost"
                            onClick={handleLoadSampleQuery}
                        >
                            Load sample query
                        </button>
                        <button
                            type="button"
                            className="app__btn"
                            onClick={handleReset}
                            disabled={isResetting}
                        >
                            {isResetting ? 'Restoring…' : 'Restore sample data'}
                        </button>
                    </div>
                </header>
                <div className="app__body">
                    {!isDesktop && isSidebarOpen && (
                        <div className="sidebar-backdrop" onClick={closeSidebar} role="presentation" />
                    )}
                    <Sidebar
                        data={sidebarData}
                        onReset={handleReset}
                        resetting={isResetting}
                        role={role}
                        onLogout={() => handleLogout()}
                        onPreviewTable={handlePreviewTable}
                        isOpen={isSidebarOpen}
                        isDesktop={isDesktop}
                        onClose={closeSidebar}
                    />
                    <main className="workspace">
                        <section className="workspace__panel workspace__panel--editor">
                            <Editor
                                value={sql}
                                onChange={setSql}
                                onRun={handleRun}
                                onRunSelection={handleRunSelection}
                                loading={isRunning}
                            />
                        </section>
                        <section className="workspace__panel workspace__panel--results">
                            <div className="workspace__results">
                                {error && <ErrorBox message={error} onDismiss={() => setError(null)} />}
                                {result && (
                                    <div className="workspace__result-block">
                                        <ResultTable
                                            title="Query result"
                                            result={result}
                                            elapsed={resultMeta?.elapsed}
                                            rowCount={resultMeta?.rows}
                                        />
                                    </div>
                                )}
                            </div>
                        </section>
                    </main>
                </div>
            </div>
        </div>
    );
};

export default App;
