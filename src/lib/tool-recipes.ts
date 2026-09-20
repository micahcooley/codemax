/** Reviewed launch definitions, not bundled servers or automatic installation.
 * Exact source references and runtime prerequisites live in TOOL_LIBRARY.md.
 * Choosing a recipe only fills a draft. Zag and the native host still require
 * explicit local-process consent and an enabled tool catalog before execution.
 */
export interface ToolRecipe {id:string;label:string;description:string;icon:string;command:string;args:string[];folder?:boolean;note:string;version:string;bundled?:boolean;}
export const toolRecipes:ToolRecipe[]=[
 {id:'native',label:'Local project tools',icon:'folder',description:'Built-in file reading, editing, search, moves and recoverable deletion. Commands are optional.',command:'builtin:local-tools',args:['--workspace'],folder:true,bundled:true,version:'0.2.0',note:'Bundled native process; no npm or Python needed. File operations stay inside the chosen project without following links. Writes and trusted shell commands must be enabled explicitly.'},
 {id:'files',label:'Project files',icon:'folder',description:'Read, search, edit and organize files in a folder you choose.',command:'npx',args:['-y','@modelcontextprotocol/server-filesystem@2026.8.31'],folder:true,version:'2026.8.31',note:'Requires Node.js/npm. File access controls are provided by the server; the process itself runs as your user. Enable only the operations you need.'},
 {id:'git',label:'Git repositories',icon:'history',description:'Inspect changes and history, or make approved repository updates.',command:'uvx',args:['mcp-server-git==2026.8.18','--repository'],folder:true,version:'2026.8.18',note:'Requires uv/uvx and Git. Choose a repository. This is a starting location, not an operating-system sandbox. Read and write operations are selected separately after connection.'},
 {id:'fetch',label:'Read web pages',icon:'globe',description:'Retrieve a specific public page and return its readable content.',command:'uvx',args:['mcp-server-fetch==2026.8.18'],version:'2026.8.18',note:'Requires uv/uvx. This fetches a supplied URL, not search-engine results. The server can also reach local/internal addresses. Review URLs and network destinations before approving; it is not a public-only network sandbox.'},
 {id:'memory',label:'Working notes',icon:'layers',description:'Store and retrieve a local knowledge graph across tasks.',command:'npx',args:['-y','@modelcontextprotocol/server-memory@2026.8.31'],version:'2026.8.31',note:'Requires Node.js/npm. Notes are persisted by the MCP server, separately from Codemax settings. Avoid secrets; returned notes are sent to the selected website.'},
 {id:'browser',label:'Browser tools',icon:'search',description:'Navigate pages, search through websites and inspect page structure.',command:'npx',args:['-y','@playwright/mcp@0.0.82','--isolated'],version:'0.0.82',note:'Requires Node.js and Playwright browser binaries. Opens a separate isolated browser, not your signed-in Codemax provider tabs. Interactive actions and results still require tool permission.'},
];
export function recipeDefinition(id:string,folder='',permissions:{write?:boolean;commands?:boolean}={}):{label:string;command:string;args:string[]} {
 const recipe=toolRecipes.find(r=>r.id===id);if(!recipe)throw Error('Unknown tool recipe.');
 const args=[...recipe.args];
 if(recipe.folder){
  const path=folder.trim();
  if(!path.startsWith('/')||path.split('/').filter(Boolean).every(c=>c==='.')||/[\x00-\x1f\x7f]/.test(path)||path.split('/').some(c=>c==='..'))
   throw Error('Choose a specific absolute folder, not the filesystem root or a parent traversal.');
  args.push(path);
 }
 if(recipe.bundled){if(permissions.write)args.push('--allow-write');if(permissions.commands)args.push('--allow-trusted-commands');}
 return {label:recipe.label,command:recipe.command,args};
}
