import { getAdminSandboxClient } from '../db/index.js';


const STUDENTS_ROWS = [
    { name: 'Aarav Patel', age: 19, city: 'Ahmedabad', grade: 'A' },
    { name: 'Riya Sharma', age: 20, city: 'Mumbai', grade: 'A-' },
    { name: 'Arjun Mehta', age: 18, city: 'Surat', grade: 'B+' },
    { name: 'Priya Nair', age: 21, city: 'Delhi', grade: 'A' },
    { name: 'Krish Jain', age: 19, city: 'Vadodara', grade: 'B' },
    { name: 'Sneha Reddy', age: 22, city: 'Hyderabad', grade: 'A' },
    { name: 'Manav Shah', age: 20, city: 'Pune', grade: 'A-' },
    { name: 'Ishita Desai', age: 21, city: 'Rajkot', grade: 'B+' },
    { name: 'Karan Yadav', age: 18, city: 'Jaipur', grade: 'A' },
    { name: 'Ananya Gupta', age: 20, city: 'Kolkata', grade: 'B' },
    { name: 'Vivaan Singh', age: 19, city: 'Indore', grade: 'A-' },
    { name: 'Diya Kapoor', age: 22, city: 'Bangalore', grade: 'A' }
];

const COURSES_ROWS = [
    { course_name: 'Database Systems', credits: 4 },
    { course_name: 'Operating Systems', credits: 3 },
    { course_name: 'Computer Networks', credits: 4 },
    { course_name: 'Data Structures', credits: 3 },
    { course_name: 'Machine Learning', credits: 4 },
    { course_name: 'Web Development', credits: 3 },
    { course_name: 'Cyber Security', credits: 3 },
    { course_name: 'Cloud Computing', credits: 4 },
    { course_name: 'Mobile Development', credits: 3 },
    { course_name: 'Software Engineering', credits: 3 }
];

const DEPARTMENTS_ROWS = [
    { dept_name: 'Computer Science' },
    { dept_name: 'Information Technology' },
    { dept_name: 'Electronics' },
    { dept_name: 'Artificial Intelligence' },
    { dept_name: 'Cyber Security' },
    { dept_name: 'Data Science' }
];

const INSTRUCTORS_ROWS = [
    { name: 'Dr. Neha Shah', department_id: 1 },
    { name: 'Prof. Raj Kumar', department_id: 2 },
    { name: 'Dr. Anil Mehta', department_id: 3 },
    { name: 'Prof. Kavita Rao', department_id: 4 },
    { name: 'Dr. Arvind Singh', department_id: 5 },
    { name: 'Prof. Meera Patel', department_id: 6 },
    { name: 'Dr. Rakesh Jain', department_id: 1 },
    { name: 'Prof. Sunita Iyer', department_id: 2 },
    { name: 'Dr. Suresh Gupta', department_id: 3 },
    { name: 'Prof. Pooja Joshi', department_id: 4 },
    { name: 'Dr. Hemant Desai', department_id: 5 },
    { name: 'Prof. Ritu Verma', department_id: 6 }
];

const ENROLLMENTS_ROWS = [
    { student_id: 1, course_id: 1, grade: 'A' },
    { student_id: 1, course_id: 2, grade: 'B' },
    { student_id: 2, course_id: 1, grade: 'A' },
    { student_id: 2, course_id: 4, grade: 'A' },
    { student_id: 3, course_id: 3, grade: 'B' },
    { student_id: 4, course_id: 2, grade: 'A' },
    { student_id: 5, course_id: 1, grade: 'C' },
    { student_id: 6, course_id: 5, grade: 'B' },
    { student_id: 7, course_id: 6, grade: 'A' },
    { student_id: 8, course_id: 4, grade: 'B' },
    { student_id: 9, course_id: 2, grade: 'A' },
    { student_id: 10, course_id: 3, grade: 'C' },
    { student_id: 11, course_id: 1, grade: 'A' },
    { student_id: 12, course_id: 7, grade: 'B' },
    { student_id: 4, course_id: 5, grade: 'A' }
];

const buildInsertValues = (columns, rows) => {
    const placeholders = rows
        .map((_, rowIndex) => `(${columns.map((__, columnIndex) => `$${rowIndex * columns.length + columnIndex + 1}`).join(', ')})`)
        .join(', ');

    const values = rows.flatMap((row) => columns.map((column) => row[column]));

    return { placeholders, values };
};

const revokeAllMutations = async (client, table) => {
    await client.query(`REVOKE ALL ON TABLE ${table} FROM aayush;`);
    await client.query(`GRANT SELECT ON TABLE ${table} TO aayush;`);
};

export const seedSandboxDatabase = async () => {
    const client = await getAdminSandboxClient();

    try {
        await client.query('BEGIN');

        await client.query(`CREATE SCHEMA IF NOT EXISTS playground;`);
        await client.query(`SET search_path TO playground;`);

        await client.query(`CREATE TABLE IF NOT EXISTS students (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      age INTEGER NOT NULL,
      city TEXT NOT NULL,
      grade TEXT
    );`);

        await client.query(`CREATE TABLE IF NOT EXISTS courses (
      id SERIAL PRIMARY KEY,
      course_name TEXT NOT NULL,
      credits INTEGER NOT NULL
    );`);

        await client.query(`CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      dept_name TEXT NOT NULL UNIQUE
    );`);

        await client.query(`CREATE TABLE IF NOT EXISTS instructors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      department_id INTEGER NOT NULL REFERENCES departments(id) ON DELETE RESTRICT
    );`);

        await client.query(`CREATE TABLE IF NOT EXISTS enrollments (
      id SERIAL PRIMARY KEY,
      student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
      course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
      grade TEXT NOT NULL
    );`);

        await client.query('TRUNCATE TABLE enrollments, instructors, courses, departments, students RESTART IDENTITY CASCADE;');

        const departmentInsert = buildInsertValues(['dept_name'], DEPARTMENTS_ROWS);
        await client.query(`INSERT INTO departments (dept_name) VALUES ${departmentInsert.placeholders};`, departmentInsert.values);

        const studentsInsert = buildInsertValues(['name', 'age', 'city', 'grade'], STUDENTS_ROWS);
        await client.query(`INSERT INTO students (name, age, city, grade) VALUES ${studentsInsert.placeholders};`, studentsInsert.values);

        const coursesInsert = buildInsertValues(['course_name', 'credits'], COURSES_ROWS);
        await client.query(`INSERT INTO courses (course_name, credits) VALUES ${coursesInsert.placeholders};`, coursesInsert.values);

        const instructorsInsert = buildInsertValues(['name', 'department_id'], INSTRUCTORS_ROWS);
        await client.query(`INSERT INTO instructors (name, department_id) VALUES ${instructorsInsert.placeholders};`, instructorsInsert.values);

        const enrollmentsInsert = buildInsertValues(['student_id', 'course_id', 'grade'], ENROLLMENTS_ROWS);
        await client.query(`INSERT INTO enrollments (student_id, course_id, grade) VALUES ${enrollmentsInsert.placeholders};`, enrollmentsInsert.values);

        await client.query('GRANT USAGE ON SCHEMA public TO aayush;');
        await client.query('GRANT CREATE ON SCHEMA public TO aayush;');

        await client.query('GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO aayush;');
        await client.query('GRANT USAGE, SELECT, UPDATE ON ALL SEQUENCES IN SCHEMA public TO aayush;');

        await client.query('ALTER DEFAULT PRIVILEGES GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO aayush;');
        await client.query('ALTER DEFAULT PRIVILEGES GRANT USAGE, SELECT, UPDATE ON SEQUENCES TO aayush;');


        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        await client.end();
    }
};
