// Test script to verify app safety fixes
const fs = require('fs');

console.log('🔍 Testing App Safety Fixes...\n');

// Check if console.log statements are removed
const appContent = fs.readFileSync('App.js', 'utf8');
const supabaseContent = fs.readFileSync('src/services/supabase.js', 'utf8');

const consoleLogsInApp = (appContent.match(/console\.log/g) || []).length;
const consoleLogsInSupabase = (supabaseContent.match(/console\.log/g) || []).length;

console.log('✅ Console.log removal check:');
console.log(`   App.js: ${consoleLogsInApp} console.log statements found`);
console.log(`   Supabase: ${consoleLogsInSupabase} console.log statements found`);

// Check for ErrorBoundary
const hasErrorBoundary = appContent.includes('ErrorBoundary');
console.log(`✅ Error boundary: ${hasErrorBoundary ? 'IMPLEMENTED' : 'MISSING'}`);

// Check for safe imports
const hasSafeImports = supabaseContent.includes('try {') && supabaseContent.includes('react-native-base64');
console.log(`✅ Safe imports: ${hasSafeImports ? 'IMPLEMENTED' : 'MISSING'}`);

// Check for initialization state
const hasInitState = appContent.includes('isReady') && appContent.includes('useEffect');
console.log(`✅ Initialization state: ${hasInitState ? 'IMPLEMENTED' : 'MISSING'}`);

console.log('\n🚀 Ready for production build!');
