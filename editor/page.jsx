"use client"
import { useState, useEffect } from "react";
import dynamic from "next/dynamic";

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

export default function EditorPage() {
  const [code, setCode] = useState("// Write your code here");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [minimapEnabled, setMinimapEnabled] = useState(true);
  const [editorHeight, setEditorHeight] = useState("400px");

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    console.log("Editor mounted successfully");
    editor.focus();

    // Add save command shortcut (Ctrl+S)
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
      console.log("Saving code:", code);
    });
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
        </div>
        <div className="flex items-center space-x-4">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
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
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div className="w-full h-full">
          <MonacoEditor
            height={editorHeight}
            defaultLanguage="javascript"
            language={language}
            theme={theme}
            value={code}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              fontSize: fontSize,
              minimap: { enabled: minimapEnabled },
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: "on",
              lineNumbers: "on",
              folding: true,
              lineDecorationsWidth: 10,
              lineNumbersMinChars: 3,
              renderLineHighlight: "all",
              scrollbar: {
                vertical: "visible",
                horizontal: "visible",
              },
            }}
          />
        </div>
      </div>
    </div>
  );
} 