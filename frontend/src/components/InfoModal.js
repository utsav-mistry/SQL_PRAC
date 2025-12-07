import React, { useState } from 'react';
import '../styles/info-modal.css';

const InfoModal = () => {
    const [isOpen, setIsOpen] = useState(false);

    // static placeholder server info (no API calls)
    const SERVER_INFO = {
        host: "server@utsav's-rog",
        postgresVersion: '18.1',
        nodeVersion: '25.2.1',
        reactVersion: '16.14.10'
    };

    const services = [
        { name: 'Render', url: 'https://status.render.com', desc: 'Backend & PostgreSQL' },
        { name: 'Vercel', url: 'https://www.vercel-status.com', desc: 'Frontend' }
    ];

    return (
        <>
            <button
                type="button"
                className="info-btn"
                onClick={() => setIsOpen(true)}
                aria-label="Information about this platform"
                title="About this platform"
            >
                <span>i</span>
            </button>

            {isOpen && (
                <div className="info-modal-overlay" onClick={() => setIsOpen(false)}>
                    <div className="info-modal" onClick={(e) => e.stopPropagation()}>
                        <header className="info-modal__header">
                            <h2 className="info-modal__title">SQL Practice Platform</h2>
                            <button
                                type="button"
                                className="info-modal__close"
                                onClick={() => setIsOpen(false)}
                                aria-label="Close"
                            >
                                <i class="fa-solid fa-arrow-right-from-bracket"></i>
                            </button>
                        </header>

                        <div className="info-modal__body">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: '1rem' }}>
                                <div>
                                    <section className="info-modal__section">
                                        <h3 className="info-modal__subtitle">About</h3>
                                        <p className="info-modal__text">
                                            Served from <strong>github.com/utsav-mistry/SQL_PRAC</strong> on <strong>{SERVER_INFO.host}</strong>.
                                        </p>
                                    </section>

                                    <section className="info-modal__section">
                                        <h3 className="info-modal__subtitle">Versions</h3>
                                        <p className="info-modal__text">
                                            React: <strong>{SERVER_INFO.reactVersion}</strong><br />
                                            Node: <strong>{SERVER_INFO.nodeVersion}</strong><br />
                                            PostgreSQL: <strong style={{ wordBreak: 'break-word' }}>{SERVER_INFO.postgresVersion}</strong>
                                        </p>
                                    </section>

                                    <section className="info-modal__section">
                                        <h3 className="info-modal__subtitle">Repository</h3>
                                        <p className="info-modal__text">Browse the source:</p>
                                        <div style={{ marginTop: '0.5rem' }}>
                                            <a
                                                href="https://github.com/utsav-mistry/SQL_PRAC"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="info-modal__docs-btn"
                                                style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem' }}
                                            >
                                                <i className="fa-brands fa-github" aria-hidden="true" />
                                                <span>Browse repo</span>
                                            </a>
                                            <p style={{ marginTop: 8, color: 'var(--text-500)', fontSize: 13 }}>
                                                Opens the repository on GitHub in a new tab.
                                            </p>
                                        </div>
                                    </section>
                                </div>

                                <aside>
                                    <section className="info-modal__section">
                                        <h3 className="info-modal__subtitle">Health check</h3>
                                        <div className="info-modal__services" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {services.map((svc) => (
                                                <a
                                                    key={svc.name}
                                                    href={svc.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="info-modal__service-btn"
                                                    title={`Open ${svc.name} status`}
                                                >
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                                        <span style={{ fontWeight: 700, color: 'var(--text-100)' }}>{svc.name}</span>
                                                        <small style={{ color: 'var(--text-500)' }}>{svc.desc}</small>
                                                    </div>
                                                    <span style={{ color: 'var(--accent-200)', fontWeight: 600 }}>Health</span>
                                                </a>
                                            ))}
                                        </div>

                                        <div style={{ marginTop: 12 }}>
                                            <a
                                                href="https://www.postgresql.org/docs/current/sql-commands.html"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="info-modal__docs-btn"
                                            >
                                                PostgreSQL SQL commands
                                            </a>
                                        </div>
                                    </section>
                                </aside>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default InfoModal;
