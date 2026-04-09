/**
 * Vision CSE OA — Database Seed Script
 * ─────────────────────────────────────
 * Usage:
 *   node scripts/seed.js          → seed questions + create admin
 *   node scripts/seed.js --clear  → wipe all data first, then seed
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')

const User           = require('../models/User')
const MCQQuestion    = require('../models/MCQQuestion')
const CodingQuestion = require('../models/CodingQuestion')
const TestConfig     = require('../models/TestConfig')

// ── Sample MCQ questions ───────────────────────────────────────────────────────
const mcqQuestions = [
  {
    questionText: 'What is the time complexity of binary search on a sorted array of n elements?',
    options: ['O(n)', 'O(log n)', 'O(n log n)', 'O(1)'],
    correctOption: 1, marks: 4, negativeMarks: 1, order: 1
  },
  {
    questionText: 'Which data structure uses LIFO (Last In, First Out) order?',
    options: ['Queue', 'Linked List', 'Stack', 'Tree'],
    correctOption: 2, marks: 4, negativeMarks: 1, order: 2
  },
  {
    questionText: 'What does SQL stand for?',
    options: ['Structured Query Language', 'Simple Query Language', 'Standard Query Logic', 'Sequential Query Layer'],
    correctOption: 0, marks: 4, negativeMarks: 1, order: 3
  },
  {
    questionText: 'Which of the following is NOT a programming paradigm?',
    options: ['Object-Oriented', 'Functional', 'Declarative', 'Sequential Compilation'],
    correctOption: 3, marks: 4, negativeMarks: 1, order: 4
  },
  {
    questionText: 'What is the output of: print(type([])) in Python?',
    options: ["<class 'list'>", "<class 'array'>", "<type 'list'>", 'list'],
    correctOption: 0, marks: 4, negativeMarks: 1, order: 5
  },
  {
    questionText: 'In C++, which keyword is used to prevent a class from being inherited?',
    options: ['static', 'const', 'final', 'sealed'],
    correctOption: 2, marks: 4, negativeMarks: 1, order: 6
  },
  {
    questionText: 'Which sorting algorithm has the best average-case time complexity?',
    options: ['Bubble Sort', 'Insertion Sort', 'Quick Sort', 'Selection Sort'],
    correctOption: 2, marks: 4, negativeMarks: 1, order: 7
  },
  {
    questionText: 'What is a primary key in a relational database?',
    options: [
      'A key used for encryption',
      'A unique identifier for each record in a table',
      'The first column of any table',
      'A foreign reference to another table'
    ],
    correctOption: 1, marks: 4, negativeMarks: 1, order: 8
  },
  {
    questionText: 'Which OSI layer is responsible for routing packets between networks?',
    options: ['Data Link Layer', 'Transport Layer', 'Network Layer', 'Session Layer'],
    correctOption: 2, marks: 4, negativeMarks: 1, order: 9
  },
  {
    questionText: 'What is the result of 5 & 3 in binary bitwise AND?',
    options: ['8', '1', '6', '2'],
    correctOption: 1, marks: 4, negativeMarks: 1, order: 10
  },
  {
    questionText: 'Which of the following is used to handle exceptions in Java?',
    options: ['try-catch', 'if-else', 'switch-case', 'do-while'],
    correctOption: 0, marks: 4, negativeMarks: 1, order: 11
  },
  {
    questionText: 'What does the `git stash` command do?',
    options: [
      'Permanently deletes uncommitted changes',
      'Commits changes with an auto-generated message',
      'Temporarily saves uncommitted changes and reverts working directory',
      'Merges two branches'
    ],
    correctOption: 2, marks: 4, negativeMarks: 1, order: 12
  },
  {
    questionText: 'In Big-O notation, O(2^n) represents:',
    options: ['Linear time', 'Polynomial time', 'Exponential time', 'Logarithmic time'],
    correctOption: 2, marks: 4, negativeMarks: 1, order: 13
  },
  {
    questionText: 'Which HTTP status code indicates "Not Found"?',
    options: ['200', '301', '403', '404'],
    correctOption: 3, marks: 4, negativeMarks: 1, order: 14
  },
  {
    questionText: 'What is a deadlock in operating systems?',
    options: [
      'When a process runs indefinitely without terminating',
      'When two or more processes wait forever for resources held by each other',
      'When CPU utilization drops to zero',
      'When memory allocation fails'
    ],
    correctOption: 1, marks: 4, negativeMarks: 1, order: 15
  }
]

// ── Sample Coding questions ───────────────────────────────────────────────────
const codingQuestions = [
  {
    title: 'Two Sum',
    difficulty: 'Easy',
    order: 1,
    description: `Given an array of integers nums and an integer target, return the indices of the two numbers that add up to target.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nReturn the answer in any order.`,
    inputFormat: `Line 1: n — number of elements\nLine 2: n space-separated integers\nLine 3: target integer`,
    outputFormat: `Two space-separated integers — the 0-based indices of the two numbers`,
    constraints: `2 ≤ n ≤ 10^4\n-10^9 ≤ nums[i] ≤ 10^9\n-10^9 ≤ target ≤ 10^9\nExactly one valid solution exists`,
    examples: [
      { input: '4\n2 7 11 15\n9', output: '0 1', explanation: 'nums[0] + nums[1] = 2 + 7 = 9' },
      { input: '3\n3 2 4\n6', output: '1 2', explanation: 'nums[1] + nums[2] = 2 + 4 = 6' }
    ]
  },
  {
    title: 'Reverse a Linked List',
    difficulty: 'Medium',
    order: 2,
    description: `Given the head of a singly linked list, reverse the list and return the reversed list.\n\nYou must implement a function that accepts the list as space-separated values and outputs the reversed sequence.`,
    inputFormat: `Line 1: n — number of nodes\nLine 2: n space-separated integers (node values)`,
    outputFormat: `n space-separated integers representing the reversed list`,
    constraints: `0 ≤ n ≤ 5000\n-5000 ≤ Node.val ≤ 5000`,
    examples: [
      { input: '5\n1 2 3 4 5', output: '5 4 3 2 1', explanation: 'The list 1→2→3→4→5 becomes 5→4→3→2→1' },
      { input: '2\n1 2', output: '2 1', explanation: 'The list 1→2 becomes 2→1' }
    ]
  },
  {
    title: 'Longest Common Subsequence',
    difficulty: 'Hard',
    order: 3,
    description: `Given two strings text1 and text2, return the length of their longest common subsequence (LCS).\n\nA subsequence is a sequence derived from another string by deleting some characters (possibly none) without changing the order of remaining characters.\n\nA common subsequence is a subsequence common to both strings.`,
    inputFormat: `Line 1: string text1\nLine 2: string text2`,
    outputFormat: `A single integer — the length of the longest common subsequence`,
    constraints: `1 ≤ text1.length, text2.length ≤ 1000\nStrings consist of lowercase English characters only`,
    examples: [
      { input: 'abcde\nace', output: '3', explanation: 'LCS is "ace" with length 3' },
      { input: 'abc\nabc', output: '3', explanation: 'LCS is "abc" with length 3' },
      { input: 'abc\ndef', output: '0', explanation: 'No common subsequence exists' }
    ]
  }
]

// ── Main seed function ─────────────────────────────────────────────────────────
async function seed () {
  try {
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
    console.log('✅ Connected to MongoDB Atlas\n')

    const shouldClear = process.argv.includes('--clear')

    if (shouldClear) {
      console.log('🗑  Clearing existing data...')
      await Promise.all([
        MCQQuestion.deleteMany({}),
        CodingQuestion.deleteMany({}),
        TestConfig.deleteMany({})
      ])
      console.log('   MCQ questions cleared')
      console.log('   Coding questions cleared')
      console.log('   Test config cleared\n')
    }

    // ── MCQ Questions ──────────────────────────────────────────────────────────
    const existingMCQ = await MCQQuestion.countDocuments()
    if (existingMCQ === 0 || shouldClear) {
      await MCQQuestion.insertMany(mcqQuestions)
      console.log(`✅ Inserted ${mcqQuestions.length} MCQ questions`)
    } else {
      console.log(`⏭  MCQ questions already exist (${existingMCQ} found), skipping`)
    }

    // ── Coding Questions ───────────────────────────────────────────────────────
    const existingCoding = await CodingQuestion.countDocuments()
    if (existingCoding === 0 || shouldClear) {
      await CodingQuestion.insertMany(codingQuestions)
      console.log(`✅ Inserted ${codingQuestions.length} coding problems`)
    } else {
      console.log(`⏭  Coding questions already exist (${existingCoding} found), skipping`)
    }

    // ── Test Config ────────────────────────────────────────────────────────────
    const existingConfig = await TestConfig.countDocuments()
    if (existingConfig === 0 || shouldClear) {
      const now = new Date()
      const start = new Date(now.getTime() + 5 * 60 * 1000)      // 5 min from now
      const mcqEnd = new Date(start.getTime() + 45 * 60 * 1000)  // +45 min
      const codingStart = new Date(mcqEnd.getTime() + 10 * 60 * 1000)
      const codingEnd = new Date(codingStart.getTime() + 45 * 60 * 1000)

      await TestConfig.create({
        mcqStartTime: start,
        mcqEndTime: mcqEnd,
        codingStartTime: codingStart,
        codingEndTime: codingEnd,
        mcqDuration: 45,
        codingDuration: 45,
        mcqQuestionCount: 30,
        isActive: true
      })
      console.log('✅ Test config created (MCQ starts 5 minutes from now)')
    } else {
      console.log('⏭  Test config already exists, skipping')
    }

    // ── Clean up stale indexes on users collection ─────────────────────────────
    // This handles cases where the Atlas cluster was previously used for another
    // project that had a 'username' field with a unique index.
    try {
      const db = mongoose.connection.db
      const collections = await db.listCollections({ name: 'users' }).toArray()
      if (collections.length > 0) {
        const indexes = await db.collection('users').indexes()
        const staleIndex = indexes.find(idx => idx.key && idx.key.username !== undefined)
        if (staleIndex) {
          await db.collection('users').dropIndex(staleIndex.name)
          console.log(`🧹 Dropped stale index: "${staleIndex.name}" (username field from old project)`)
        }
      }
    } catch (indexErr) {
      // Non-fatal — log and continue
      console.log('   (index cleanup skipped:', indexErr.message, ')')
    }

    // ── Drop stale indexes on users collection ────────────────────────────────
    // This fixes: "E11000 duplicate key error ... index: username_1"
    // which happens when Atlas has leftover indexes from a previous project.
    try {
      const usersCollection = mongoose.connection.db.collection('users')
      const indexes = await usersCollection.indexes()
      for (const idx of indexes) {
        // Drop any index that references a field not in our schema
        const knownFields = ['_id', 'email', 'scholarNumber']
        const idxFields = Object.keys(idx.key)
        const isStale = idxFields.every(f => !knownFields.includes(f))
        if (isStale && idx.name !== '_id_') {
          await usersCollection.dropIndex(idx.name)
          console.log(`   🗑  Dropped stale index: ${idx.name}`)
        }
      }
    } catch (e) {
      // Collection may not exist yet — that's fine
    }

    // ── Admin User ─────────────────────────────────────────────────────────────
    const adminExists = await User.findOne({ role: 'admin' })
    if (!adminExists) {
      // password hashed by pre-save hook automatically
      await User.create({
        name: 'Admin',
        email: 'admin@visioncse.com',
        scholarNumber: 'ADMIN001',
        branch: 'CSE',
        password: 'Admin@123',   // plain — pre('save') hook hashes it
        role: 'admin'
      })
      console.log('\n✅ Admin user created:')
      console.log('   Email    : admin@visioncse.com')
      console.log('   Password : Admin@123')
      console.log('   ⚠  Change this password immediately after first login!')
    } else {
      console.log('\n⏭  Admin user already exists, skipping')
    }

    console.log('\n🎉 Seed complete! Run `npm run dev` to start the server.\n')
    process.exit(0)
  } catch (err) {
    console.error('\n❌ Seed failed:', err.message)
    console.error('   Make sure MONGO_URI in server/.env is correct.\n')
    process.exit(1)
  }
}

seed()
