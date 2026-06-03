import fs from 'fs';

const filePath = 'classes.puml';

if (fs.existsSync(filePath)) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split(/\r?\n/);
  
  // Filter out any lines that start with '+' at the root level (no indentation)
  // as they represent invalid standalone functions in PlantUML class diagrams.
  const cleanedLines = lines.filter(line => !line.startsWith('+'));
  
  fs.writeFileSync(filePath, cleanedLines.join('\n'));
  console.log('Successfully cleaned up classes.puml by removing invalid top-level functions.');
} else {
  console.error(`Error: ${filePath} not found.`);
}
