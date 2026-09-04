import js from "@eslint/js";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  { ignores: ["dist/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        React: "writable",
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      "no-undef": "error",
      "react/jsx-no-undef": "error",
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off"
    },
    settings: {
      react: {
        version: "detect",
      },
    },
  },
];
