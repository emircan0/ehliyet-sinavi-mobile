const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'app/profile.tsx',
    'app/auth/login.tsx',
    'app/(tabs)/statistics.tsx',
    'app/(tabs)/settings.tsx',
    'app/index.tsx',
    'app/(tabs)/ai-tutor.tsx',
    'app/(tabs)/index.tsx',
    'app/(tabs)/quizzes.tsx',
    'src/components/ScreenLayout.tsx',
    'src/components/ui/Button.tsx',
    'src/components/ui/Input.tsx',
    'src/components/ui/Card.tsx'
];

function getRelativePath(fromPath, toPath) {
    const relative = path.relative(path.dirname(fromPath), toPath);
    return relative.startsWith('.') ? relative : './' + relative;
}

const baseDir = process.cwd();

filesToUpdate.forEach(file => {
    const fullPath = path.resolve(baseDir, file);
    if (!fs.existsSync(fullPath)) {
        console.log("Not found:", fullPath);
        return;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    
    if (content.includes("useThemeMode")) {
        console.log("Already updated:", file);
        return;
    }

    const relPathObj = getRelativePath(fullPath, path.resolve(baseDir, 'src/hooks/useThemeMode')).replace(/\\/g, '/');
    const importReplacement = `import { useThemeMode } from '${relPathObj}';`;
    
    let newContent = content.replace(/import\s+\{\s*useColorScheme\s*\}\s+from\s+['"]nativewind['"];/g, importReplacement);
    
    // Replace const { colorScheme } = useColorScheme(); const isDarkMode = colorScheme === 'dark';
    newContent = newContent.replace(/const\s+\{\s*colorScheme\s*\}\s*=\s*useColorScheme\(\);\s*const\s+isDarkMode\s*=\s*colorScheme\s*===\s*['"]dark['"];/g, 'const { isDarkMode, colorScheme } = useThemeMode();');
    
    // Replace const { colorScheme, setColorScheme } = useColorScheme();
    newContent = newContent.replace(/const\s+\{\s*colorScheme\s*(,\s*setColorScheme\s*)?\}\s*=\s*useColorScheme\(\);/g, 'const { isDarkMode, colorScheme$1 } = useThemeMode();');

    // Remove remaining isDarkMode declarations
    newContent = newContent.replace(/const\s+isDarkMode\s*=\s*colorScheme\s*===\s*['"]dark['"];/g, '');

    if (newContent !== content) {
        fs.writeFileSync(fullPath, newContent);
        console.log(`Updated ${file}`);
    } else {
        console.log(`No replace needed for ${file}`);
    }
});
