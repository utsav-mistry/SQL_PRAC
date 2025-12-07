import React from 'react';
import PropTypes from 'prop-types';
import '../styles/sidebar.css';

const Sidebar = ({
    data,
    onReset,
    resetting,
    role,
    onLogout,
    onPreviewTable,
    isOpen,
    isDesktop,
    onClose
}) => {

    const handleLogout = () => {
        if (window.confirm('End your session and clear credentials?')) {
            onLogout();
        }
    };

    // ------------------------------------------------------
    // 1. Convert your structured API data → unified tree format
    // ------------------------------------------------------
    const buildTree = (root) => ({
        name: root.name,
        type: "server",
        fullName: root.name,
        children: (root.databases ?? []).map((db) => ({
            name: db.name,
            type: "database",
            fullName: db.name,
            children: db.schemas.map((schema) => ({
                name: schema.name,
                type: "schema",
                fullName: schema.fullName,
                children: schema.tables.map((table) => ({
                    name: table.name,
                    type: "table",
                    fullName: table.fullName,
                    meta: table.meta,
                    children: [] // tables have no further children
                }))
            }))
        }))
    });

    // ------------------------------------------------------
    // 2. Icon resolver based on type
    // ------------------------------------------------------
    const getIcon = (type) => {
        switch (type) {
            case "server": return "fa-server";
            case "database": return "fa-database";
            case "schema": return "fa-layer-group";
            case "table": return "fa-table";
            default: return "fa-box";
        }
    };

    // ------------------------------------------------------
    // 3. Render a single node (infinite recursion)
    // ------------------------------------------------------
    const renderNode = (node) => {
        const hasChildren = Array.isArray(node.children) && node.children.length > 0;

        return (
            <li key={node.fullName || node.name} className="sidebar__tree-item">
                <details className="sidebar__fold" open>
                    <summary className="sidebar__summary-label">
                        <i className={`fa-solid ${getIcon(node.type)}`} aria-hidden="true" />
                        <span>{node.name}</span>

                        {node.type === "table" && onPreviewTable && (
                            <button
                                className="sidebar__preview"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onPreviewTable(node.fullName);
                                }}
                            >
                                <i className="fa-solid fa-eye" />
                                Preview
                            </button>
                        )}
                    </summary>

                    {/* render columns for tables */}
                    {node.type === "table" && node.meta?.columns && (
                        <ul className="sidebar__column-list">
                            {node.meta.columns.map((col) => (
                                <li
                                    key={`${node.fullName}.${col.columnName}`}
                                    className="sidebar__column"
                                >
                                    <code>{col.columnName}</code>
                                    <span className="sidebar__column-type">{col.dataType}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    {/* recurse into children */}
                    {hasChildren && (
                        <ul className="sidebar__tree-children">
                            {node.children.map(renderNode)}
                        </ul>
                    )}
                </details>
            </li>
        );
    };

    // Build the full tree
    const tree = buildTree(data);

    // ------------------------------------------------------
    // Sidebar container classes
    // ------------------------------------------------------
    const sidebarClassNames = [
        'sidebar',
        isDesktop ? 'sidebar--desktop' : 'sidebar--mobile',
        isOpen ? 'sidebar--open' : 'sidebar--closed'
    ].filter(Boolean).join(' ');

    return (
        <aside
            className={sidebarClassNames}
            id="workspace-sidebar"
            aria-hidden={!isDesktop && !isOpen}
            aria-label="Database objects"
        >
            {/* Header */}
            <div className="sidebar__header">
                <div className="sidebar__heading">
                    <div>
                        <h1 className="sidebar__title">SQL Sandbox</h1>
                        {!isDesktop && (
                            <p className="sidebar__subtitle">
                                Tap a table to preview its sample rows.
                            </p>
                        )}
                    </div>

                    <div className="sidebar__header-actions">
                        <button
                            type="button"
                            className="sidebar__power"
                            onClick={handleLogout}
                            aria-label="Sign out"
                        >
                            <i className="fa-solid fa-power-off" />
                        </button>
                        {!isDesktop && (
                            <button
                                type="button"
                                className="sidebar__close"
                                onClick={onClose}
                                aria-label="Close sidebar"
                            >
                                <i className="fa-solid fa-xmark" />
                            </button>
                        )}
                        
                    </div>
                </div>
            </div>

            {/* Tree */}
            <div className="sidebar__tree">
                <ul className="sidebar__tree-root" style={{ "padding-left":0}}>
                    {renderNode(tree)}
                </ul>
            </div>
        </aside>
    );
};

// ------------------------------------------------------
// PropTypes remain unchanged
// ------------------------------------------------------
Sidebar.propTypes = {
    data: PropTypes.shape({
        name: PropTypes.string.isRequired,
        databases: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                schemas: PropTypes.arrayOf(
                    PropTypes.shape({
                        name: PropTypes.string.isRequired,
                        fullName: PropTypes.string.isRequired,
                        tables: PropTypes.arrayOf(
                            PropTypes.shape({
                                name: PropTypes.string.isRequired,
                                fullName: PropTypes.string.isRequired,
                                meta: PropTypes.shape({
                                    readOnly: PropTypes.bool,
                                    columns: PropTypes.arrayOf(
                                        PropTypes.shape({
                                            columnName: PropTypes.string,
                                            dataType: PropTypes.string
                                        })
                                    )
                                })
                            })
                        ).isRequired
                    })
                ).isRequired
            })
        ).isRequired
    }).isRequired,
    onReset: PropTypes.func.isRequired,
    resetting: PropTypes.bool,
    role: PropTypes.string,
    onLogout: PropTypes.func.isRequired,
    onPreviewTable: PropTypes.func,
    isOpen: PropTypes.bool,
    isDesktop: PropTypes.bool,
    onClose: PropTypes.func
};

Sidebar.defaultProps = {
    resetting: false,
    role: 'practice',
    onPreviewTable: undefined,
    isOpen: true,
    isDesktop: true,
    onClose: () => {}
};

export default Sidebar;
