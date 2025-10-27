#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Configuration
const usersDir = path.join(__dirname, '../users');
const SHOW_SAMPLES = process.argv.includes('--samples');
const REPORT_TYPE = process.argv.find(arg => ['--quality', '--programs', '--fields', '--duplicates'].includes(arg)) || '--all';

// Statistics trackers
const stats = {
  // Processing
  total: 0,
  parsed: 0,
  malformed: 0,

  // Quality issues
  quality: {
    clean: 0,
    messy: 0,
    nullUserIds: 0,
    invalidEmails: 0,
    invalidNames: 0,
    invalidDates: 0,
    nullInstagramHandles: 0,
    errorTikTokHandles: 0,
    emptyProgramIds: 0,
    numericBrands: 0,
    nullTaskIds: 0,
    numericPlatforms: 0,
    brokenLinks: 0,
    nanLikes: 0,
    nullComments: 0,
    noSalesData: 0,
    validSalesData: 0,
    sampleClean: [],
    sampleMessy: []
  },

  // Field completeness
  fields: {
    hasUserId: 0,
    hasValidEmail: 0,
    hasValidName: 0,
    hasValidJoinedAt: 0,
    hasValidSocialHandles: 0,
    hasPrograms: 0,
    hasProgramId: 0,
    hasValidBrand: 0,
    hasTasks: 0,
    hasValidSales: 0,
    completeUserData: 0,
    completeProgramData: 0,
    fullyComplete: 0,
    usersWithoutPrograms: []
  },

  // Platform distribution
  platforms: {},

  // Duplicates & consistency
  duplicates: {
    usersByUserId: new Map(),
    usersByEmail: new Map(),
    programsById: new Map(),
    brandsByName: new Map()
  }
};

// Read all user files (exclude AppleDouble metadata files)
const files = fs.readdirSync(usersDir).filter(f => f.endsWith('.json') && !f.startsWith('._'));
stats.total = files.length;

console.log(`\n${'='.repeat(80)}`);
console.log('COMPREHENSIVE DATA ANALYSIS');
console.log(`${'='.repeat(80)}\n`);
console.log(`Analyzing ${stats.total} JSON files from ${usersDir}\n`);

// Process each file
files.forEach((file, index) => {
  const filePath = path.join(usersDir, file);
  let rawData = fs.readFileSync(filePath, 'utf8');

  // Try to fix malformed JSON (missing closing brace)
  if (!rawData.trim().endsWith('}')) {
    rawData += '\n}';
  }

  try {
    const user = JSON.parse(rawData);
    stats.parsed++;

    let isClean = true;

    // === DATA QUALITY ANALYSIS ===

    // User-level quality checks
    if (user.user_id === null) {
      stats.quality.nullUserIds++;
      isClean = false;
    }
    if (user.email === 'invalid-email') {
      stats.quality.invalidEmails++;
      isClean = false;
    }
    if (user.name === '???') {
      stats.quality.invalidNames++;
      isClean = false;
    }
    if (user.joined_at === 'not-a-date') {
      stats.quality.invalidDates++;
      isClean = false;
    }
    if (user.instagram_handle === null) {
      stats.quality.nullInstagramHandles++;
      isClean = false;
    }
    if (user.tiktok_handle === '#error_handle') {
      stats.quality.errorTikTokHandles++;
      isClean = false;
    }

    // === FIELD COMPLETENESS ANALYSIS ===

    const hasUserId = user.user_id !== null;
    const hasValidEmail = user.email && user.email !== 'invalid-email';
    const hasValidName = user.name && user.name !== '???';
    const hasValidJoinedAt = user.joined_at && user.joined_at !== 'not-a-date';
    const hasValidSocial = (
      (user.instagram_handle && user.instagram_handle !== null) ||
      (user.tiktok_handle && user.tiktok_handle !== '#error_handle')
    );

    if (hasUserId) stats.fields.hasUserId++;
    if (hasValidEmail) stats.fields.hasValidEmail++;
    if (hasValidName) stats.fields.hasValidName++;
    if (hasValidJoinedAt) stats.fields.hasValidJoinedAt++;
    if (hasValidSocial) stats.fields.hasValidSocialHandles++;

    const completeUser = hasUserId && hasValidEmail && hasValidName && hasValidJoinedAt;
    if (completeUser) stats.fields.completeUserData++;

    // === DUPLICATE TRACKING ===

    // Track by user_id
    if (user.user_id !== null) {
      if (!stats.duplicates.usersByUserId.has(user.user_id)) {
        stats.duplicates.usersByUserId.set(user.user_id, []);
      }
      stats.duplicates.usersByUserId.get(user.user_id).push({
        file,
        name: user.name,
        email: user.email
      });
    }

    // Track by email
    if (hasValidEmail) {
      if (!stats.duplicates.usersByEmail.has(user.email)) {
        stats.duplicates.usersByEmail.set(user.email, []);
      }
      stats.duplicates.usersByEmail.get(user.email).push({
        file,
        user_id: user.user_id,
        name: user.name
      });
    }

    // === PROGRAM ANALYSIS ===

    const hasPrograms = user.advocacy_programs &&
                       Array.isArray(user.advocacy_programs) &&
                       user.advocacy_programs.length > 0;

    if (hasPrograms) {
      stats.fields.hasPrograms++;

      user.advocacy_programs.forEach(program => {
        // Quality checks
        if (program.program_id === '') {
          stats.quality.emptyProgramIds++;
          isClean = false;
        }
        if (typeof program.brand === 'number') {
          stats.quality.numericBrands++;
          isClean = false;
        }
        if (program.total_sales_attributed === 'no-data') {
          stats.quality.noSalesData++;
          isClean = false;
        } else if (typeof program.total_sales_attributed === 'number') {
          stats.quality.validSalesData++;
        }

        // Field completeness
        const hasProgramId = program.program_id && program.program_id !== '';
        const hasValidBrand = program.brand && typeof program.brand === 'string';
        const hasTasks = program.tasks_completed &&
                        Array.isArray(program.tasks_completed) &&
                        program.tasks_completed.length > 0;
        const hasValidSales = typeof program.total_sales_attributed === 'number';

        if (hasProgramId) stats.fields.hasProgramId++;
        if (hasValidBrand) stats.fields.hasValidBrand++;
        if (hasTasks) stats.fields.hasTasks++;
        if (hasValidSales) stats.fields.hasValidSales++;

        const completeProgram = hasProgramId && hasValidBrand && hasTasks;
        if (completeProgram) stats.fields.completeProgramData++;
        if (completeUser && completeProgram) stats.fields.fullyComplete++;

        // Track program duplicates
        if (hasProgramId) {
          if (!stats.duplicates.programsById.has(program.program_id)) {
            stats.duplicates.programsById.set(program.program_id, []);
          }
          stats.duplicates.programsById.get(program.program_id).push({
            file,
            user_id: user.user_id,
            brand: program.brand
          });
        }

        // Track brands
        if (hasValidBrand) {
          if (!stats.duplicates.brandsByName.has(program.brand)) {
            stats.duplicates.brandsByName.set(program.brand, []);
          }
          stats.duplicates.brandsByName.get(program.brand).push({
            file,
            program_id: program.program_id
          });
        }

        // Task analysis
        if (program.tasks_completed && Array.isArray(program.tasks_completed)) {
          program.tasks_completed.forEach(task => {
            // Quality checks
            if (task.task_id === null) {
              stats.quality.nullTaskIds++;
              isClean = false;
            }
            if (typeof task.platform === 'number') {
              stats.quality.numericPlatforms++;
              isClean = false;
            } else if (task.platform) {
              stats.platforms[task.platform] = (stats.platforms[task.platform] || 0) + 1;
            }
            if (task.post_url === 'broken_link') {
              stats.quality.brokenLinks++;
              isClean = false;
            }
            if (task.likes === 'NaN') {
              stats.quality.nanLikes++;
              isClean = false;
            }
            if (task.comments === null) {
              stats.quality.nullComments++;
              isClean = false;
            }
          });
        }
      });
    } else {
      stats.fields.usersWithoutPrograms.push(file);
    }

    // Track clean vs messy
    if (isClean) {
      stats.quality.clean++;
      if (SHOW_SAMPLES && stats.quality.sampleClean.length < 3) {
        stats.quality.sampleClean.push(file);
      }
    } else {
      stats.quality.messy++;
      if (SHOW_SAMPLES && stats.quality.sampleMessy.length < 3) {
        stats.quality.sampleMessy.push(file);
      }
    }

  } catch (err) {
    stats.malformed++;
  }

  // Progress indicator
  if ((index + 1) % 1000 === 0) {
    process.stdout.write(`Processed ${index + 1}/${stats.total} files...\r`);
  }
});

console.log('\n');

// === REPORTING FUNCTIONS ===

const pct = (count, total = stats.total) =>
  `${count.toLocaleString()} (${(count/total*100).toFixed(2)}%)`;

function showProcessingSummary() {
  console.log(`${'='.repeat(80)}`);
  console.log('PROCESSING SUMMARY');
  console.log(`${'='.repeat(80)}\n`);
  console.log(`Total Files:           ${stats.total.toLocaleString()}`);
  console.log(`Successfully Parsed:   ${pct(stats.parsed)}`);
  console.log(`Malformed JSON:        ${pct(stats.malformed)}`);
}

function showQualityReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('DATA QUALITY REPORT');
  console.log(`${'='.repeat(80)}\n`);

  console.log('--- OVERVIEW ---');
  console.log(`Clean Records:         ${pct(stats.quality.clean)}`);
  console.log(`Messy Records:         ${pct(stats.quality.messy)}`);

  console.log('\n--- USER-LEVEL ISSUES ---');
  console.log(`Null user_id:          ${pct(stats.quality.nullUserIds)}`);
  console.log(`Invalid email:         ${pct(stats.quality.invalidEmails)}`);
  console.log(`Invalid name (???):    ${pct(stats.quality.invalidNames)}`);
  console.log(`Invalid date:          ${pct(stats.quality.invalidDates)}`);
  console.log(`Null Instagram:        ${pct(stats.quality.nullInstagramHandles)}`);
  console.log(`Error TikTok:          ${pct(stats.quality.errorTikTokHandles)}`);

  console.log('\n--- PROGRAM-LEVEL ISSUES ---');
  console.log(`Empty program_id:      ${pct(stats.quality.emptyProgramIds)}`);
  console.log(`Numeric brands:        ${pct(stats.quality.numericBrands)}`);
  console.log(`No sales data:         ${pct(stats.quality.noSalesData)}`);

  console.log('\n--- TASK-LEVEL ISSUES ---');
  console.log(`Null task_id:          ${pct(stats.quality.nullTaskIds)}`);
  console.log(`Numeric platforms:     ${pct(stats.quality.numericPlatforms)}`);
  console.log(`Broken links:          ${pct(stats.quality.brokenLinks)}`);
  console.log(`NaN likes:             ${pct(stats.quality.nanLikes)}`);
  console.log(`Null comments:         ${pct(stats.quality.nullComments)}`);

  console.log('\n--- PLATFORM DISTRIBUTION ---');
  Object.entries(stats.platforms)
    .sort((a, b) => b[1] - a[1])
    .forEach(([platform, count]) => {
      const total = Object.values(stats.platforms).reduce((a, b) => a + b, 0);
      console.log(`${platform.padEnd(20)}: ${pct(count, total)}`);
    });

  if (SHOW_SAMPLES) {
    console.log('\n--- SAMPLE FILES ---');
    console.log(`Clean: ${stats.quality.sampleClean.join(', ')}`);
    console.log(`Messy: ${stats.quality.sampleMessy.join(', ')}`);
  }
}

function showFieldsReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('FIELD COMPLETENESS REPORT');
  console.log(`${'='.repeat(80)}\n`);

  console.log('--- USER-LEVEL COMPLETENESS ---');
  console.log(`Valid user_id:         ${pct(stats.fields.hasUserId)}`);
  console.log(`Valid email:           ${pct(stats.fields.hasValidEmail)}`);
  console.log(`Valid name:            ${pct(stats.fields.hasValidName)}`);
  console.log(`Valid joined_at:       ${pct(stats.fields.hasValidJoinedAt)}`);
  console.log(`Valid social handle:   ${pct(stats.fields.hasValidSocialHandles)}`);
  console.log(`Complete user profile: ${pct(stats.fields.completeUserData)}`);

  console.log('\n--- PROGRAM-LEVEL COMPLETENESS ---');
  console.log(`Has programs:          ${pct(stats.fields.hasPrograms)}`);
  console.log(`Has program_id:        ${pct(stats.fields.hasProgramId)}`);
  console.log(`Has valid brand:       ${pct(stats.fields.hasValidBrand)}`);
  console.log(`Has tasks:             ${pct(stats.fields.hasTasks)}`);
  console.log(`Has valid sales:       ${pct(stats.fields.hasValidSales)}`);
  console.log(`Complete program data: ${pct(stats.fields.completeProgramData)}`);

  console.log('\n--- OVERALL COMPLETENESS ---');
  console.log(`Fully complete:        ${pct(stats.fields.fullyComplete)}`);
  console.log(`Users w/o programs:    ${stats.fields.usersWithoutPrograms.length}`);
}

function showDuplicatesReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('DUPLICATES & CONSISTENCY REPORT');
  console.log(`${'='.repeat(80)}\n`);

  // User ID duplicates
  const dupUserIds = Array.from(stats.duplicates.usersByUserId.entries())
    .filter(([id, files]) => files.length > 1);
  console.log('--- USER ID DUPLICATES ---');
  console.log(`Unique user_ids:       ${stats.duplicates.usersByUserId.size.toLocaleString()}`);
  console.log(`Duplicate user_ids:    ${dupUserIds.length}`);

  // Email duplicates
  const dupEmails = Array.from(stats.duplicates.usersByEmail.entries())
    .filter(([email, files]) => files.length > 1);
  console.log('\n--- EMAIL DUPLICATES ---');
  console.log(`Unique emails:         ${stats.duplicates.usersByEmail.size.toLocaleString()}`);
  console.log(`Duplicate emails:      ${dupEmails.length}`);

  if (dupEmails.length > 0 && SHOW_SAMPLES) {
    console.log('\nTop 5 duplicate emails:');
    dupEmails.slice(0, 5).forEach(([email, occurrences]) => {
      console.log(`  ${email}: ${occurrences.length} times`);
    });
  }

  // Program ID duplicates
  const dupPrograms = Array.from(stats.duplicates.programsById.entries())
    .filter(([id, files]) => files.length > 1);
  console.log('\n--- PROGRAM ID DUPLICATES ---');
  console.log(`Unique program_ids:    ${stats.duplicates.programsById.size.toLocaleString()}`);
  console.log(`Duplicate program_ids: ${dupPrograms.length}`);

  // Brand distribution
  console.log('\n--- BRAND DISTRIBUTION ---');
  console.log(`Unique brands:         ${stats.duplicates.brandsByName.size.toLocaleString()}`);

  const topBrands = Array.from(stats.duplicates.brandsByName.entries())
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10);

  console.log('\nTop 10 brands by program count:');
  topBrands.forEach(([brand, programs]) => {
    const uniquePrograms = new Set(programs.map(p => p.program_id));
    console.log(`  ${brand.padEnd(30)}: ${uniquePrograms.size} programs`);
  });
}

function showProgramsReport() {
  console.log(`\n${'='.repeat(80)}`);
  console.log('PROGRAM STRUCTURE REPORT');
  console.log(`${'='.repeat(80)}\n`);

  const totalPrograms = stats.duplicates.programsById.size;
  const sharedPrograms = Array.from(stats.duplicates.programsById.entries())
    .filter(([id, users]) => users.length > 1);

  console.log('--- PROGRAM SHARING ANALYSIS ---');
  console.log(`Total programs:        ${totalPrograms.toLocaleString()}`);
  console.log(`Programs with 1 user:  ${(totalPrograms - sharedPrograms.length).toLocaleString()}`);
  console.log(`Shared programs:       ${sharedPrograms.length}`);

  console.log('\n--- BRAND-PROGRAM RELATIONSHIP ---');
  const brandsWithMultiplePrograms = Array.from(stats.duplicates.brandsByName.entries())
    .filter(([brand, programs]) => {
      const uniquePrograms = new Set(programs.map(p => p.program_id));
      return uniquePrograms.size > 1;
    });

  console.log(`Brands w/ 1 program:   ${(stats.duplicates.brandsByName.size - brandsWithMultiplePrograms.length).toLocaleString()}`);
  console.log(`Brands w/ multiple:    ${brandsWithMultiplePrograms.length}`);
}

// === GENERATE REPORTS ===

showProcessingSummary();

if (REPORT_TYPE === '--all' || REPORT_TYPE === '--quality') {
  showQualityReport();
}

if (REPORT_TYPE === '--all' || REPORT_TYPE === '--fields') {
  showFieldsReport();
}

if (REPORT_TYPE === '--all' || REPORT_TYPE === '--duplicates') {
  showDuplicatesReport();
}

if (REPORT_TYPE === '--all' || REPORT_TYPE === '--programs') {
  showProgramsReport();
}

console.log(`\n${'='.repeat(80)}\n`);

// Usage help
if (process.argv.includes('--help')) {
  console.log('Usage: node analyze-all.js [options]\n');
  console.log('Options:');
  console.log('  --quality      Show data quality report only');
  console.log('  --fields       Show field completeness report only');
  console.log('  --duplicates   Show duplicates & consistency report only');
  console.log('  --programs     Show program structure report only');
  console.log('  --samples      Include sample files in output');
  console.log('  --all          Show all reports (default)');
  console.log('  --help         Show this help message\n');
}
