#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const DEFAULT_FILE = path.join(PROJECT_ROOT, 'data/import/sample-exam.json');
const ALLOWED_DIFFICULTIES = new Set(['easy', 'medium', 'hard']);

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;

  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function parseArgs(argv) {
  const args = {
    file: DEFAULT_FILE,
    dryRun: false,
    reuseExisting: true,
  };

  for (let index = 2; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--help' || arg === '-h') {
      args.help = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--no-reuse-existing') {
      args.reuseExisting = false;
    } else if (arg === '--file' || arg === '-f') {
      args.file = argv[index + 1];
      index += 1;
    } else if (arg.startsWith('--file=')) {
      args.file = arg.slice('--file='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Usage:
  npm run import:exam -- --file data/import/my-exam.json
  npm run import:exam:dry -- --file data/import/my-exam.json

JSON shape:
  {
    "exam": {
      "title": "2026 Ehliyet Deneme Sinavi 1",
      "category": "Genel Deneme",
      "duration_minutes": 45,
      "is_active": true
    },
    "questions": [
      {
        "content": "Question text",
        "options": ["A", "B", "C", "D"],
        "correct_option": 1,
        "category": "trafik | ilkyardim | motor | adap",
        "difficulty": "easy | medium | hard",
        "explanation": "Optional explanation",
        "image_url": "Optional image URL"
      }
    ]
  }
`);
}

function readJson(filePath) {
  const absolutePath = path.isAbsolute(filePath)
    ? filePath
    : path.join(PROJECT_ROOT, filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`Import file not found: ${absolutePath}`);
  }

  return {
    absolutePath,
    payload: JSON.parse(fs.readFileSync(absolutePath, 'utf8')),
  };
}

function assertString(value, name) {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${name} must be a non-empty string.`);
  }
}

function normalizeQuestion(question, index) {
  assertString(question.content, `questions[${index}].content`);

  if (!Array.isArray(question.options) || question.options.length < 2) {
    throw new Error(`questions[${index}].options must contain at least 2 options.`);
  }

  const options = question.options.map((option, optionIndex) => {
    assertString(option, `questions[${index}].options[${optionIndex}]`);
    return option.trim();
  });

  const correctOption = Number(question.correct_option);
  if (!Number.isInteger(correctOption) || correctOption < 0 || correctOption >= options.length) {
    throw new Error(`questions[${index}].correct_option must be a 0-based option index.`);
  }

  const difficulty = question.difficulty || 'medium';
  if (!ALLOWED_DIFFICULTIES.has(difficulty)) {
    throw new Error(`questions[${index}].difficulty must be easy, medium, or hard.`);
  }

  return {
    content: question.content.trim(),
    options,
    correct_option: correctOption,
    category: (question.category || 'trafik').trim(),
    difficulty,
    explanation: question.explanation ? String(question.explanation).trim() : null,
    image_url: question.image_url ? String(question.image_url).trim() : null,
    is_active: question.is_active !== false,
    exam_question: true,
  };
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Payload must be a JSON object.');
  }

  const exam = payload.exam || {};
  assertString(exam.title, 'exam.title');

  if (!Array.isArray(payload.questions) || payload.questions.length === 0) {
    throw new Error('questions must be a non-empty array.');
  }

  return {
    exam: {
      title: exam.title.trim(),
      category: exam.category ? String(exam.category).trim() : 'Genel Deneme',
      duration_minutes: Number.isFinite(Number(exam.duration_minutes))
        ? Number(exam.duration_minutes)
        : 45,
      is_active: exam.is_active !== false,
    },
    questions: payload.questions.map(normalizeQuestion),
  };
}

function createSupabaseClient() {
  loadEnvFile(path.join(PROJECT_ROOT, '.env'));
  loadEnvFile(path.join(PROJECT_ROOT, '.env.local'));

  const url = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Missing SUPABASE_URL/EXPO_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('Warning: SUPABASE_SERVICE_ROLE_KEY is not set. Inserts may fail if RLS is enabled.');
  }

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function findExistingQuestion(supabase, content) {
  const { data, error } = await supabase
    .from('questions')
    .select('id')
    .eq('content', content)
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data?.id || null;
}

async function insertExam(supabase, exam) {
  const { data, error } = await supabase
    .from('exams')
    .insert([exam])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function insertQuestion(supabase, question) {
  const { data, error } = await supabase
    .from('questions')
    .insert([question])
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

async function insertExamQuestions(supabase, examId, questionIds) {
  const rows = questionIds.map((questionId, index) => ({
    exam_id: examId,
    question_id: questionId,
    order_number: index + 1,
  }));

  const { error } = await supabase
    .from('exam_questions')
    .insert(rows);

  if (error) throw error;
}

async function main() {
  const args = parseArgs(process.argv);
  if (args.help) {
    printHelp();
    return;
  }

  const { absolutePath, payload } = readJson(args.file);
  const normalized = normalizePayload(payload);

  console.log(`Import file: ${absolutePath}`);
  console.log(`Exam: ${normalized.exam.title}`);
  console.log(`Questions: ${normalized.questions.length}`);

  if (args.dryRun) {
    console.log('Dry run complete. No database changes were made.');
    return;
  }

  const supabase = createSupabaseClient();
  const examId = await insertExam(supabase, normalized.exam);
  const questionIds = [];

  for (const [index, question] of normalized.questions.entries()) {
    let questionId = null;
    if (args.reuseExisting) {
      questionId = await findExistingQuestion(supabase, question.content);
    }

    if (!questionId) {
      questionId = await insertQuestion(supabase, question);
      console.log(`Inserted question ${index + 1}/${normalized.questions.length}`);
    } else {
      console.log(`Reused existing question ${index + 1}/${normalized.questions.length}`);
    }

    questionIds.push(questionId);
  }

  await insertExamQuestions(supabase, examId, questionIds);
  console.log(`Done. Created exam ${examId} with ${questionIds.length} questions.`);
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
