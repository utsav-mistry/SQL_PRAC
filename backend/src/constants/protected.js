export const PROTECTED_SCHEMAS = [
    'protected',
    'system',
    'internal',
    'setup',
    'pg_catalog',
    'information_schema',
    'pg_toast',
    'pg_temp'
];

export const PROTECTED_TABLES = ['migrations', 'audit_logs', 'system_logs'];

export const BLOCKED_IDENTIFIERS = [
    ...PROTECTED_SCHEMAS,
    ...PROTECTED_TABLES,
    'pg_database',
    'pg_roles',
    'pg_user',
    'pg_authid',
    'pg_shadow',
    'pg_settings',
    'pg_stat_activity',
    'pg_stat_replication',
    'pg_locks',
    'pg_stat_bgwriter',
    'pg_stat_wal',
    'pg_stat_ssl',
    'pg_stat_progress_vacuum',
    'pg_stat_progress_analyze',
    'pg_proc',
    'pg_extension',
    'pg_namespace'
];

export const SAFE_DATABASE_PREFIX = 'sandbox';
