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

// Map Monaco language identifiers to Piston API language identifiers
const LANGUAGE_MAPPING = {
  "cpp": "cpp",
  "c": "c",
  "javascript": "javascript",
  "python": "python",
  "java": "java",
  "csharp": "csharp",
  "php": "php",
  "ruby": "ruby",
  "go": "go",
  "rust": "rust",
};

const THEMES = ["vs", "vs-dark", "hc-black", "hc-light"];

export default function CodeEditorPage() {
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
      if (!code.includes("main(") && !code.includes("main (")) {
        setError("Your code must include a main function.");
        setIsRunning(false);
        return;
      }
    }
    
    if (language === "go" && !code.includes("package main")) {
      // For Go, add package main if not present
      codeToRun = "package main\n\n" + code;
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
              content: codeToRun,
            },
          ],
          stdin: userInput, // Use the user input
          args: [],
          compile_timeout: 10000,
          run_timeout: 5000,
        }),
      });

      const data = await response.json();
      
      if (data.run) {
        if (data.run.stderr) {
          setError(data.run.stderr);
          setOutput("");
        } else {
          setOutput(data.run.output || "Program executed successfully with no output.");
        }
      } else if (data.compile && data.compile.stderr) {
        // Handle compilation errors
        setError(data.compile.stderr);
        setOutput("");
      } else {
        setError("Failed to execute code.");
      }
    } catch (err) {
      setError(`Error executing code: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const isLanguageRunnable = RUNNABLE_LANGUAGES.hasOwnProperty(language);

  // Language-specific placeholders
  const getLanguagePlaceholder = (lang) => {
    switch (lang) {
      case "javascript":
        return "// JavaScript Example\nconst input = prompt('Enter your name:');\nconsole.log(`Hello, ${input}!`);\n";
      case "python":
        return "# Python Example\nname = input('Enter your name: ')\nprint(f'Hello, {name}!')\n";
      case "java":
        return "// Java Example\nimport java.util.Scanner;\n\npublic class Main {\n  public static void main(String[] args) {\n    Scanner scanner = new Scanner(System.in);\n    System.out.print(\"Enter your name: \");\n    String name = scanner.nextLine();\n    System.out.println(\"Hello, \" + name + \"!\");\n  }\n}\n";
      case "c":
        return "// C Example\n#include <stdio.h>\n\nint main() {\n  char name[50];\n  printf(\"Enter your name: \");\n  scanf(\"%s\", name);\n  printf(\"Hello, %s!\\n\", name);\n  return 0;\n}\n";
      case "cpp":
        return "// C++ Example\n#include <iostream>\n#include <string>\n\nint main() {\n  std::string name;\n  std::cout << \"Enter your name: \";\n  std::cin >> name;\n  std::cout << \"Hello, \" << name << \"!\" << std::endl;\n  return 0;\n}\n";
      case "go":
        return "// Go Example\npackage main\n\nimport (\n  \"fmt\"\n  \"bufio\"\n  \"os\"\n  \"strings\"\n)\n\nfunc main() {\n  reader := bufio.NewReader(os.Stdin)\n  fmt.Print(\"Enter your name: \")\n  name, _ := reader.ReadString('\\n')\n  name = strings.TrimSpace(name)\n  fmt.Printf(\"Hello, %s!\\n\", name)\n}\n";
      default:
        return "// Write your code here";
    }
  };

  // Update code when language changes
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(getLanguagePlaceholder(newLang));
  };

  // Adjust editor height based on screen size
  const adjustEditorHeight = () => {
    if (window.innerWidth < 768) {
      setEditorHeight("300px");
    } else {
      setEditorHeight("400px");
    }
  };

  // Use useEffect for the resize event listener
  useEffect(() => {
    // Add event listener
    window.addEventListener("resize", adjustEditorHeight);
    
    // Call once to set initial height
    adjustEditorHeight();
    
    // Cleanup function to remove event listener when component unmounts
    return () => {
      window.removeEventListener("resize", adjustEditorHeight);
    };
  }, []); // Empty dependency array means this effect runs once on mount

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-full overflow-x-hidden">
      <h1 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Monaco Code Editor</h1>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-4">
        <div className="w-1/2 sm:w-auto">
          <label htmlFor="language-select" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
            Language:
          </label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-full sm:w-40 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang} value={lang} className="bg-black">
                {lang} {RUNNABLE_LANGUAGES[lang] ? "(runnable)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="w-1/2 sm:w-auto">
          <label htmlFor="theme-select" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
            Theme:
          </label>
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="w-full sm:w-40 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm"
          >
            {THEMES.map((t) => (
              <option key={t} value={t} className="bg-black">
                {t}
              </option>
            ))}
          </select>
        </div>

        <div className="w-1/3 sm:w-auto">
          <label htmlFor="font-size" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
            Font Size:
          </label>
          <input
            id="font-size"
            type="number"
            min="10"
            max="30"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full sm:w-20 px-2 py-1 sm:px-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm"
          />
        </div>

        <div className="w-1/3 sm:w-auto flex items-center">
          <label htmlFor="minimap-toggle" className="block text-xs sm:text-sm font-medium text-gray-400 mr-2">
            Minimap:
          </label>
          <input
            id="minimap-toggle"
            type="checkbox"
            checked={minimapEnabled}
            onChange={(e) => setMinimapEnabled(e.target.checked)}
            className="h-4 w-4 rounded border-white/10 bg-white/5 text-violet-500 focus:ring-violet-500 focus:ring-offset-0"
          />
        </div>
      </div>

      <div className="border border-white/10 rounded-lg mb-2 sm:mb-4 overflow-hidden bg-black/30 backdrop-blur-lg">
        <MonacoEditor
          height={editorHeight}
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

      <div className="mb-2 sm:mb-4">
        <label htmlFor="user-input" className="block text-xs sm:text-sm font-medium text-gray-400 mb-1">
          Input (stdin):
        </label>
        <textarea
          id="user-input"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter input for your program here..."
          className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none text-sm resize-y"
          rows="3"
        />
      </div>

      <div className="flex flex-wrap gap-2 sm:gap-4 mb-2 sm:mb-4">
        <button
          onClick={runCode}
          disabled={isRunning || !isLanguageRunnable}
          className={`px-3 py-1 sm:px-4 sm:py-2 rounded-lg font-medium transition-all duration-200 text-sm ${
            isLanguageRunnable
              ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700"
              : "bg-white/5 text-gray-500 cursor-not-allowed border border-white/10"
          }`}
        >
          {isRunning ? "Running..." : "Run Code"} {isLanguageRunnable ? "(Ctrl+Enter)" : "(Not Available)"}
        </button>
        {!isLanguageRunnable && (
          <p className="text-yellow-500 self-center text-xs sm:text-sm">
            Selected language is not supported for execution.
          </p>
        )}
      </div>

      {showOutput && (
        <div className="mt-2 sm:mt-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-300">Output:</h2>
          {error && (
            <div className="bg-red-500/10 text-red-400 p-2 sm:p-4 mt-2 rounded-lg border border-red-500/20 overflow-x-auto">
              <p className="font-semibold">Error:</p>
              <pre className="mt-2 whitespace-pre-wrap text-sm">{error}</pre>
            </div>
          )}
          {output && (
            <pre className="bg-white/5 p-2 sm:p-4 mt-2 rounded-lg border border-white/10 overflow-x-auto text-gray-300 whitespace-pre-wrap text-sm">
              {output}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}