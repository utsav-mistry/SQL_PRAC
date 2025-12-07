import { performance } from 'perf_hooks';
import { getPracticeClient, getAdminClient, getAdminSandboxClient } from '../db/index.js';
import { config } from '../config/env.js';
import { validateSql } from '../utils/sqlValidator.js';
import { HttpError } from '../utils/errors.js';
import { PROTECTED_SCHEMAS, PROTECTED_TABLES } from '../constants/protected.js';
import { seedSandboxDatabase } from '../sql/seed.js';

const sanitizeRows = (rows) => rows.map((row) => {
    const sanitizedRow = {};
    Object.entries(row).forEach(([key, value]) => {
        if (!key.startsWith('_')) {
            sanitizedRow[key] = value;
        }
    });
    return sanitizedRow;
});

const PROTECTED_PREFIXES = PROTECTED_SCHEMAS.map((schema) => `${schema.toLowerCase()}.`);
const protectedTableSet = new Set(PROTECTED_TABLES.map((table) => table.toLowerCase()));
const protectedSchemaSet = new Set(PROTECTED_SCHEMAS.map((schema) => schema.toLowerCase()));

const isSelectLikeStatement = (sql) => {
    const upper = sql.toUpperCase();
    if (upper.startsWith('SELECT')) {
        return true;
    }

    if (upper.startsWith('WITH')) {
        if (/\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)\b/.test(upper)) {
            return false;
        }
        return /\bSELECT\b/.test(upper);
    }

    return false;
};

const isDDLStatement = (sql) => {
    const upper = sql.toUpperCase().trim();
    return /^\s*(CREATE|DROP|ALTER)\s+(TABLE|SCHEMA|DATABASE)/i.test(upper);
};

const isBlockedIdentifier = (identifier, allowReadonly) => {
    const lower = identifier.toLowerCase();

    if (protectedTableSet.has(lower)) {
        return true;
    }

    if (lower.includes('.')) {
        const [schema, table] = lower.split('.');
        if (protectedSchemaSet.has(schema)) {
            return true;
        }

        if (table && protectedTableSet.has(table)) {
            return true;
        }
    }

    return PROTECTED_PREFIXES.some((prefix) => lower.startsWith(prefix));
};



export const executeQuery = async (sql, user) => {
    if (!user) {
        throw new HttpError(401, 'Authentication required');
    }

    const isAdmin = user.role === 'admin';

    const { valid, reason, sql: sanitizedSql } = validateSql(sql, { allowProtected: isAdmin });
    if (!valid) {
        throw new HttpError(400, reason);
    }

    const selectLike = isSelectLikeStatement(sanitizedSql);

    if (!isAdmin) {
        const identifiers = sanitizedSql.match(/\b([\w]+\.[\w]+|[\w]+)\b/g) ?? [];
        if (identifiers.some((identifier) => isBlockedIdentifier(identifier, selectLike))) {
            throw new HttpError(403, 'Access denied');
        }
    }

    const client = isAdmin ? await getAdminSandboxClient() : await getPracticeClient();
    try {
        const start = performance.now();
        const { rows, fields, rowCount } = await client.query(sanitizedSql);
        const executionTimeMs = Math.round(performance.now() - start);

        const hierarchyChanged = isDDLStatement(sanitizedSql);

        return {
            rowCount,
            fields: fields?.map(({ name }) => name) ?? [],
            rows: sanitizeRows(rows),
            executionTimeMs,
            hierarchyChanged
        };
    } catch (error) {
        console.error('Query failed:', error);
        throw new HttpError(400, error.message);
    } finally {
        client.release();
    }
};

const mapHierarchy = (results) => {
    const hierarchy = {};
    results.forEach(({ database_name: databaseName, schema_name: schemaName, table_name: tableName, column_name: columnName, data_type: dataType }) => {
        if (!hierarchy[databaseName]) {
            hierarchy[databaseName] = {};
        }
        if (!hierarchy[databaseName][schemaName]) {
            hierarchy[databaseName][schemaName] = {};
        }
        if (!hierarchy[databaseName][schemaName][tableName]) {
            hierarchy[databaseName][schemaName][tableName] = {
                columns: []
            };
        }

        hierarchy[databaseName][schemaName][tableName].columns.push({ columnName, dataType });
    });
    return hierarchy;
};

const HIERARCHY_QUERY = `
    SELECT
      current_database() AS database_name,
      nsp.nspname AS schema_name,
      cls.relname AS table_name,
      att.attname AS column_name,
      pg_catalog.format_type(att.atttypid, att.atttypmod) AS data_type
    FROM pg_catalog.pg_class cls
    JOIN pg_catalog.pg_namespace nsp ON nsp.oid = cls.relnamespace
    JOIN pg_catalog.pg_attribute att ON att.attrelid = cls.oid
    WHERE nsp.nspname = 'playground'
      AND cls.relkind = 'r'
      AND att.attnum > 0
      AND NOT att.attisdropped
      AND cls.relname <> ALL($1::text[])
    ORDER BY nsp.nspname, cls.relname, att.attnum;
`;

export const getHierarchy = async () => {
    const client = await getAdminSandboxClient();
    try {
        const { rows } = await client.query(HIERARCHY_QUERY, [PROTECTED_TABLES]);
        const mapped = mapHierarchy(rows);
        return mapped;
    } catch (error) {
        console.error('Hierarchy fetch failed:', error);
        throw new HttpError(500, 'Failed to fetch schema hierarchy');
    } finally {
        client.release();
    }
};



export const resetSandbox = async () => {
    const client = await getAdminClient();
    try {
        console.log("Resetting sandbox...");

        // 1. Drop all tables inside the current database
        const result = await client.query(`
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'playground';
        `);

        for (const row of result.rows) {
            const table = row.tablename;
            await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE;`);
        }

        console.log("Dropped all tables.");

    } catch (error) {
        console.error('Reset failed:', error);
        throw new HttpError(500, 'Failed to reset sandbox');
    } finally {
        client.release();
    }

    try {
        console.log("Seeding...");
        await seedSandboxDatabase();
    } catch (error) {
        console.error('Seeding failed:', error);
        throw new HttpError(500, 'Sandbox reset incomplete due to seeding error');
    }
};