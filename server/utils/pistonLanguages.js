// Piston (https://github.com/engineer-man/piston) doesn't guarantee a
// fixed language-name spelling across deployments/versions — some list
// C++ as "c++", others as "cpp". So instead of hardcoding one exact
// string, we give each of our languages a list of candidate identifiers
// and match against whatever Piston's own /runtimes endpoint reports
// (checking both the runtime's "language" field and its "aliases" list).
export const PISTON_LANGUAGE_CANDIDATES = {
  C: ["c"],
  "C++": ["c++", "cpp"],
  Java: ["java"],
  Python: ["python", "python3", "py"],
  JavaScript: ["javascript", "node", "js"],
};

export function candidatesFor(language) {
  return PISTON_LANGUAGE_CANDIDATES[language] || null;
}

// JDoodle (https://www.jdoodle.com/compiler-api) uses its own fixed
// language + versionIndex identifiers. versionIndex "0" is the oldest
// supported compiler version for most languages in JDoodle's table, not
// necessarily the newest — check https://docs.jdoodle.com/compiler-api/compiler-api
// if you want a specific compiler version.
export const JDOODLE_LANGUAGE_IDS = {
  C: { language: "c", versionIndex: "4" },
  "C++": { language: "cpp17", versionIndex: "0" },
  Java: { language: "java", versionIndex: "4" },
  Python: { language: "python3", versionIndex: "4" },
  JavaScript: { language: "nodejs", versionIndex: "4" },
};

export function jdoodleIdFor(language) {
  return JDOODLE_LANGUAGE_IDS[language] || null;
}
