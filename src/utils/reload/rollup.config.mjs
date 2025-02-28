import typescript from "@rollup/plugin-typescript";

const plugins = [typescript()];

export default [
  {
    plugins,
    input: "src/utils/reload/initReloadServer.ts",
    output: {
      file: "src/utils/reload/initReloadServer.js",
    },
    external: ["ws", "chokidar", "timers"],
  },
  {
    plugins,
    input: "src/utils/reload/injections/script.ts",
    output: {
      file: "src/utils/reload/injections/script.js",
    },
  },
  {
    plugins,
    input: "src/utils/reload/injections/view.ts",
    output: {
      file: "src/utils/reload/injections/view.js",
    },
  },
];
