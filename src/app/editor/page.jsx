"use client"
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
});

const LANGUAGES = [
  "javascript",
  "typescript",
  "html",
  "css",
  "json",
  "python",
  "java",
  "c",
  "cpp",
  "csharp",
  "php",
  "ruby",
  "go",
  "rust",
  "sql",
  "markdown",
  "yaml",
  "shell",
  "xml",
];

// Languages supported by Piston API with correct language identifiers
const RUNNABLE_LANGUAGES = {
  "javascript": { language: "javascript", version: "18.15.0" },
  "python": { language: "python", version: "3.10.0" },
  "java": { language: "java", version: "15.0.2" },
  "c": { language: "c", version: "10.2.0" },
  "cpp": { language: "cpp", version: "10.2.0" },
  "csharp": { language: "csharp", version: "6.12.0" },
  "php": { language: "php", version: "8.2.3" },
  "ruby": { language: "ruby", version: "3.2.1" },
  "go": { language: "go", version: "1.20.2" },
  "rust": { language: "rust", version: "1.68.2" },
};

export default function EditorPage() {
  const searchParams = useSearchParams();
  const roomId = searchParams.get("roomId");
  const username = searchParams.get("username") || "user-" + Math.floor(Math.random() * 10000);
  
  const [code, setCode] = useState("// Write your code here");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [output, setOutput] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [showOutput, setShowOutput] = useState(false);
  const [error, setError] = useState("");
  const [userInput, setUserInput] = useState("");
  const [editorHeight, setEditorHeight] = useState("400px");

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    console.log("Editor mounted successfully");
    editor.focus();

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
      console.log("Saving code:", code);
    });

    // Add run command shortcut (Ctrl+Enter)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, function () {
      runCode();
    });
  };

  const runCode = async () => {
    setIsRunning(true);
    setShowOutput(true);
    setError("");
    setOutput("Running...");

    if (!RUNNABLE_LANGUAGES[language]) {
      setError(`Language '${language}' is not supported for execution.`);
      setIsRunning(false);
      return;
    }

    // Handle language-specific cases
    let codeToRun = code;
    let langConfig = RUNNABLE_LANGUAGES[language];
    
    // Special handling for certain languages
    if (language === "c" || language === "cpp") {
      // For C/C++, add a main function if not present
      if (!codeToRun.includes("int main(") && !codeToRun.includes("void main(")) {
        codeToRun = `int main() {\n${codeToRun}\nreturn 0;\n}`;
      }
    }

    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          language: langConfig.language,
          version: langConfig.version,
          files: [
            {
              name: `main.${getFileExtension(language)}`,
              content: codeToRun,
            },
          ],
          stdin: userInput,
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setOutput(data.output || "No output");
      } else {
        setError(data.error || "Unknown error occurred");
      }
    } catch (err) {
      setError(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getFileExtension = (lang) => {
    const extensions = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      c: "c",
      cpp: "cpp",
      csharp: "cs",
      php: "php",
      ruby: "rb",
      go: "go",
      rust: "rs",
    };
    return extensions[lang] || "txt";
  };

  const getLanguagePlaceholder = (lang) => {
    const placeholders = {
      javascript: "// Write your JavaScript code here",
      python: "# Write your Python code here",
      java: "public class Main {\n    public static void main(String[] args) {\n        // Write your Java code here\n    }\n}",
      c: "int main() {\n    // Write your C code here\n    return 0;\n}",
      cpp: "int main() {\n    // Write your C++ code here\n    return 0;\n}",
      csharp: "using System;\n\nclass Program {\n    static void Main(string[] args) {\n        // Write your C# code here\n    }\n}",
      php: "<?php\n// Write your PHP code here\n?>",
      ruby: "# Write your Ruby code here",
      go: "package main\n\nimport \"fmt\"\n\nfunc main() {\n    // Write your Go code here\n}",
      rust: "fn main() {\n    // Write your Rust code here\n}",
    };
    return placeholders[lang] || `// Write your ${lang} code here`;
  };

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(getLanguagePlaceholder(newLang));
  };

  const adjustEditorHeight = () => {
    const windowHeight = window.innerHeight;
    const newHeight = windowHeight - 200; // Adjust based on your layout
    setEditorHeight(`${newHeight}px`);
  };

  useEffect(() => {
    adjustEditorHeight();
    window.addEventListener("resize", adjustEditorHeight);
    return () => window.removeEventListener("resize", adjustEditorHeight);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      <div className="flex items-center justify-between p-4 bg-slate-800">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold">Code Editor</h1>
          {roomId && (
            <div className="text-sm text-slate-300">
              Room: {roomId} | User: {username}
            </div>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-slate-700 text-white px-3 py-1 rounded"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-slate-700 text-white px-3 py-1 rounded"
          >
            <option value="vs-dark">Dark</option>
            <option value="vs-light">Light</option>
            <option value="hc-black">High Contrast</option>
          </select>
          <select
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="bg-slate-700 text-white px-3 py-1 rounded"
          >
            {[12, 14, 16, 18, 20, 22, 24].map((size) => (
              <option key={size} value={size}>
                {size}px
              </option>
            ))}
          </select>
          <button
            onClick={() => setMinimapEnabled(!minimapEnabled)}
            className="bg-slate-700 text-white px-3 py-1 rounded"
          >
            {minimapEnabled ? "Hide Minimap" : "Show Minimap"}
          </button>
          <button
            onClick={runCode}
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded"
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full h-full">
          <MonacoEditor
            height={editorHeight}
            language={language}
            theme={theme}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize,
              minimap: { enabled: minimapEnabled },
              automaticLayout: true,
              scrollBeyondLastLine: false,
              wordWrap: "on",
              lineNumbers: "on",
              renderLineHighlight: "all",
              roundedSelection: false,
              scrollbar: {
                vertical: "visible",
                horizontal: "visible",
              },
            }}
          />
        </div>
      </div>

      {showOutput && (
        <div className="bg-slate-800 p-4 border-t border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-lg font-semibold">Output</h2>
            <button
              onClick={() => setShowOutput(false)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <div className="bg-slate-900 p-4 rounded font-mono text-sm overflow-auto max-h-40">
            {error ? (
              <div className="text-red-500">{error}</div>
            ) : (
              <pre className="whitespace-pre-wrap">{output}</pre>
            )}
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium mb-1">Input (stdin):</label>
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              className="w-full bg-slate-900 text-white p-2 rounded border border-slate-700"
              rows={3}
              placeholder="Enter input for your program..."
            />
          </div>
        </div>
      )}
    </div>
  );
}
