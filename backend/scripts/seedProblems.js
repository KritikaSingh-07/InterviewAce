import 'dotenv/config';
import fs from 'fs/promises';
import path from 'path';
import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import CodingProblem from '../src/models/CodingProblem.js';

const datasetPath = path.resolve(
  process.argv[2] || 'src/data/interviewace_problems.json'
);

const BATCH_SIZE = 100;

const normalise = (record) => ({
  ...record,

  slug: String(
    record.slug ||
    record.id ||
    record.externalId ||
    record.title ||
    ''
  )
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, ''),

  topic: record.topic || record.primaryTopic || record.category,

  companies: record.companies || record.companyTags || [],

  starterCode:
    record.starterCode ||
    record.templates ||
    {},

  visibleTestCases:
    record.visibleTestCases ||
    record.testCases ||
    [],

  hiddenTestCases:
    record.hiddenTestCases ||
    [],

  isPublished:
    record.isPublished ?? true,
});

try {
  console.log('\nINTERVIEWACE CODING PROBLEM IMPORTER');
  console.log('====================================');
  console.log(`Dataset: ${datasetPath}`);

  const parsed = JSON.parse(
    await fs.readFile(datasetPath, 'utf8')
  );

  const problems = (
    Array.isArray(parsed)
      ? parsed
      : parsed.problems
  ).map(normalise);

  console.log(`Problems found: ${problems.length}`);

  const invalid = problems.filter(
    (problem) =>
      !problem.slug ||
      !problem.title ||
      !problem.topic ||
      !problem.difficulty ||
      !problem.description
  );

  if (invalid.length > 0) {
    throw new Error(
      `${invalid.length} problems are missing required fields.`
    );
  }

  await connectDB();

  let processed = 0;

  for (
    let offset = 0;
    offset < problems.length;
    offset += BATCH_SIZE
  ) {
    const batch = problems.slice(
      offset,
      offset + BATCH_SIZE
    );

    await CodingProblem.bulkWrite(
      batch.map((problem) => ({
        updateOne: {
          filter: { slug: problem.slug },
          update: { $set: problem },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    processed += batch.length;

    console.log(
      `Processed ${processed}/${problems.length}`
    );
  }

  console.log('\nImport completed successfully.');
  console.log(`Total problems: ${problems.length}`);
  console.log(`Dataset: ${datasetPath}`);
} catch (error) {
  console.error(
    `\nImport failed: ${error.message}`
  );

  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
  console.log('MongoDB connection closed.');
}