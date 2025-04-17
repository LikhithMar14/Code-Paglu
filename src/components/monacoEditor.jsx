import React from "react";
import Editor from "@monaco-editor/react";

function CodeEditor() {
  return (
    <Editor
      height="500px"
      defaultLanguage="javascript"
      defaultValue="// write your code here"
      theme="vs-dark"
    />
  );
}

export default CodeEditor;
