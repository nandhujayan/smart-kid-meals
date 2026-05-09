const fs = require('fs');

function fixFile(file) {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  
  // Environments
  content = content.replace(/import\.meta\.env\.VITE_SUPABASE_PUBLISHABLE_KEY/g, 'process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY');
  content = content.replace(/import\.meta\.env\.VITE_SUPABASE_URL/g, 'process.env.EXPO_PUBLIC_SUPABASE_URL');
  content = content.replace(/import\.meta\.env\.VITE_GEMINI_API_KEY/g, 'process.env.EXPO_PUBLIC_GEMINI_API_KEY');
  
  // Toasts
  content = content.replace(/import \{ toast \} from "sonner";/g, 'import { Alert } from "react-native";\nconst toast = { success: (msg) => Alert.alert("Success", msg), error: (msg, opts) => Alert.alert("Error", msg) };');
  
  // Replace localStorage (very basic wrapper since many are in async functions already)
  content = content.replace(/localStorage\.getItem\((.*?)\)/g, 'await AsyncStorage.getItem($1)');
  content = content.replace(/localStorage\.setItem\((.*?),\s*(.*?)\)/g, 'await AsyncStorage.setItem($1, $2)');
  content = content.replace(/localStorage\.removeItem\((.*?)\)/g, 'await AsyncStorage.removeItem($1)');
  
  // Fix nested await in JSON parse
  content = content.replace(/JSON\.parse\(await AsyncStorage\.getItem\((.*?)\) \|\| "\[\]"\)/g, 'JSON.parse((await AsyncStorage.getItem($1)) || "[]")');
  content = content.replace(/JSON\.parse\(\(await AsyncStorage\.getItem\((.*?)\)\) \|\| "\[\]"\)/g, 'JSON.parse((await AsyncStorage.getItem($1)) || "[]")');

  if (content.includes('AsyncStorage') && !content.includes('@react-native-async-storage/async-storage')) {
     content = `import AsyncStorage from '@react-native-async-storage/async-storage';\n` + content;
  }
  
  fs.writeFileSync(file, content);
}

fixFile('lib/gemini.ts');
fixFile('lib/meal-data.ts');
fixFile('lib/diagnostics.ts');
console.log('Fixed imports in mobile lib.');
