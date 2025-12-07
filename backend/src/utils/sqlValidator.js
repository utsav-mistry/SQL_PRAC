import { PROTECTED_SCHEMAS, PROTECTED_TABLES, BLOCKED_IDENTIFIERS, SAFE_DATABASE_PREFIX } from '../constants/protected.js';

const BLOCKED_KEYWORDS = [
    'ALTER ROLE',
    'CREATE ROLE',
    'DROP ROLE',
    'CREATE USER',
    'DROP USER',
    'ALTER USER',
    'GRANT',
    'REVOKE',
    'EXTENSION',
    'FUNCTION',
    'TRIGGER',
    'PROCEDURE',
    'SYSTEM',
    'ALTER SYSTEM',
    'SECURITY',
    ' PROGRAM ',
    ' COPY ',
    ' ROLE ',
    ' USER '
];

const ALLOWED_START_KEYWORDS = [
    'SELECT',
    'INSERT',
    'UPDATE',
    'DELETE',
    'CREATE',
    'DROP',
    'ALTER'
];

const SINGLE_STATEMENT_REGEX = /;(?=(?:[^'"`]*['"`][^'"`]*['"`])*[^'"`]*$)/g;

const extractIdentifiers = (sql) => {
    const regex = /(?:from|join|into|update|table|schema|database)\s+([\w\."]+)/gi;
    const identifiers = [];
    let match;
    while ((match = regex.exec(sql)) !== null) {
        identifiers.push(match[1].replaceAll('"', ''));
    }
    return identifiers;
};

const containsProtectedIdentifier = (sql) => {
    const normalized = sql.toLowerCase();
    return BLOCKED_IDENTIFIERS.some((identifier) => normalized.includes(identifier.toLowerCase()));
};



export const validateSql = (sql, options = {}) => {
    const { allowProtected = false } = options;
    if (!sql || typeof sql !== 'string') {
        return { valid: false, reason: 'Empty SQL statement' };
    }

    const trimmed = sql.trim();
    const sanitized = trimmed.endsWith(';') ? trimmed.slice(0, -1).trim() : trimmed;

    const semicolons = sanitized.match(SINGLE_STATEMENT_REGEX);
    if (semicolons && semicolons.length > 0) {
        return { valid: false, reason: 'Only single statements are allowed' };
    }

    const upper = sanitized.toUpperCase();
    const startsWithAllowed = ALLOWED_START_KEYWORDS.some((keyword) => upper.startsWith(keyword));
    if (!startsWithAllowed) {
        return { valid: false, reason: 'Only DML/DQL/DCL statements are allowed' };
    }

    if (BLOCKED_KEYWORDS.some((keyword) => upper.includes(keyword))) {
        return { valid: false, reason: 'Statement contains blocked keywords' };
    }

    if (/\bDO\b/.test(upper)) {
        return { valid: false, reason: 'DO blocks are not permitted' };
    }

    if (!allowProtected && containsProtectedIdentifier(sanitized)) {
        return { valid: false, reason: 'Access to protected objects is denied' };
    }

    const databaseMatch = /^(CREATE|DROP)\s+DATABASE\s+"?([\w-]+)"?/i.exec(sanitized);
    if (databaseMatch) {
        const [, action, dbName] = databaseMatch;
        if (!dbName.toLowerCase().startsWith(SAFE_DATABASE_PREFIX.toLowerCase())) {
            return {
                valid: false,
                reason: `${action.toUpperCase()} DATABASE is limited to names starting with "${SAFE_DATABASE_PREFIX}"`
            };
        }
    }

    return { valid: true, sql: sanitized };
};
