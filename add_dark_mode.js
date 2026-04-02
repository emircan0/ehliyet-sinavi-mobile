const fs = require('fs');
const path = require('path');

const filesToUpdate = [
    'app/quiz/[id].tsx',
    'app/quiz/quick.tsx',
    'app/quiz/result.tsx',
    'app/study/[id].tsx'
];

filesToUpdate.forEach(file => {
    const fullPath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(fullPath)) return;

    let content = fs.readFileSync(fullPath, 'utf8');

    // Replace explicit screen layouts
    content = content.replace(/className="flex-1 bg-white"/g, 'className="flex-1 bg-base"');
    content = content.replace(/className="flex-1 bg-slate-50"/g, 'className="flex-1 bg-base"');
    content = content.replace(/<ScreenLayout className="bg-white">/g, '<ScreenLayout className="bg-base">');
    
    // Cards & Elements
    content = content.replace(/bg-white([^/])/g, (match, p1) => {
        // If it already has a dark variant, skip
        if (p1.includes('dark:bg')) return match;
        return `bg-white dark:bg-slate-900${p1}`;
    });

    content = content.replace(/border-slate-100([^a-z])/g, (match, p1) => {
        if (p1.includes('dark:border')) return match;
        return `border-slate-100 dark:border-slate-800${p1}`;
    });

    content = content.replace(/border-slate-200([^a-z])/g, (match, p1) => {
        if (p1.includes('dark:border')) return match;
        return `border-slate-200 dark:border-slate-800${p1}`;
    });

    content = content.replace(/text-slate-900([^a-z])/g, (match, p1) => {
        if (p1.includes('dark:text')) return match;
        return `text-slate-900 dark:text-slate-50${p1}`;
    });

    content = content.replace(/text-slate-800([^a-z])/g, (match, p1) => {
        if (p1.includes('dark:text')) return match;
        return `text-slate-800 dark:text-slate-100${p1}`;
    });

    content = content.replace(/text-slate-500([^a-z])/g, (match, p1) => {
        if (p1.includes('dark:text')) return match;
        return `text-slate-500 dark:text-slate-400${p1}`;
    });

    content = content.replace(/text-slate-600([^a-z])/g, (match, p1) => {
        if (p1.includes('dark:text')) return match;
        return `text-slate-600 dark:text-slate-300${p1}`;
    });

    content = content.replace(/bg-slate-50([^a-z/])/g, (match, p1) => {
        if (p1.includes('dark:bg')) return match;
        return `bg-slate-50 dark:bg-slate-800${p1}`;
    });

    fs.writeFileSync(fullPath, content);
    console.log(`Updated ${file}`);
});
