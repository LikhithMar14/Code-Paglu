'use client'

import { useState } from "react";
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

const THEMES = ["vs", "vs-dark", "hc-black", "hc-light"];

export default function CodeEditorPage() {
  const [code, setCode] = useState("// Write your code here");
  const [language, setLanguage] = useState("javascript");
  const [theme, setTheme] = useState("vs-dark");
  const [fontSize, setFontSize] = useState(14);
  const [minimapEnabled, setMinimapEnabled] = useState(true);

  const handleEditorChange = (value) => {
    setCode(value);
  };

  const handleEditorDidMount = (editor, monaco) => {
    console.log("Editor mounted successfully");
    editor.focus();

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, function () {
      console.log("Saving code:", code);
    });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Monaco Code Editor</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label htmlFor="language-select" className="block text-sm mb-1">
            Language:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="theme-select" className="block text-sm mb-1">
            Theme:
          </label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-40 px-3 py-2 border border-gray-300 rounded-md"
          >
            {THEMES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="font-size" className="block text-sm mb-1">
            Font Size:
          </label>
          <input
            id="font-size"
            type="number"
            min="10"
            max="30"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <div>
          <label htmlFor="minimap-toggle" className="block text-sm mb-1">
            Minimap:
          </label>
          <input
            id="minimap-toggle"
            type="checkbox"
            checked={minimapEnabled}
            onChange={(e) => setMinimapEnabled(e.target.checked)}
            className="h-4 w-4 mt-3"
          />
        </div>
      </div>

      <div className="border border-gray-300 rounded-md mb-4">
        <MonacoEditor
          height="500px"
          language={language}
          theme={theme}
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            automaticLayout: true,
            minimap: { enabled: minimapEnabled },
            scrollBeyondLastLine: false,
            fontSize: fontSize,
            tabSize: 2,
            wordWrap: "on",
            formatOnPaste: true,
            formatOnType: true,
            renderLineHighlight: "all",
            scrollbar: {
              verticalScrollbarSize: 10,
              horizontalScrollbarSize: 10,
            },
          }}
        />
      </div>

      <div className="mt-4">
        <h2 className="text-lg font-semibold">Editor Output:</h2>
        <pre className="bg-gray-100 p-4 mt-2 rounded-md overflow-x-auto">
          {code}
        </pre>
      </div>
    </div>
  );
}
