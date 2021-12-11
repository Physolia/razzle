import path from "path";

import Webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import { logger } from "razzle";
import createConfig from "./createConfig.js";
import defaultOptions from "./defaultOptions.js";
import { Webpack5PluginOptions, Webpack5RazzlePlugin } from "./types";

export * from "./types.js";

const Plugin: Webpack5RazzlePlugin = {
  name: "webpack5",
  defaultOptions: defaultOptions,
  modifyRazzleContext: (pluginOptions, razzleContext) => {
    const {
      paths: { appPath },
    } = razzleContext;
    const srcPath = path.join(appPath, "src");
    const appBuild = path.join(appPath, "build");

    razzleContext.paths = {
      ...razzleContext.paths,
      srcPath: srcPath,
      appBuild: appBuild,
      appBuildPublic: path.join(appBuild, "public"),
      appServerIndex: path.join(srcPath, "index"),
      appServerPath: path.join(srcPath, "server"),
      appClientPath: path.join(srcPath, "client"),
    };

    razzleContext = {
      ...razzleContext,
      webBuilds: pluginOptions.webBuilds,
      nodeBuilds: pluginOptions.nodeBuilds,
    };
    return razzleContext;
  },
  addCommands: {
    start: (argv, pluginOptions, razzleConfig, razzleContext) => {
      argv.command(
        "start",
        "start the webpack devserver",
        function (yargs) {
          return yargs.option("u", {
            alias: "url",
            describe: "the URL to open",
          });
        },
        async (argv) => {
          if (typeof process.env["NODE_ENV"] === "undefined") {
            process.env["NODE_ENV"] = "development";
          } else if (process.env["NODE_ENV"] === "production") {
            logger.warn(
              "Cannot run devserver with NODE_ENV production, setting to development"
            );
            process.env["NODE_ENV"] = "development";
          }
          const configs = await createConfig(
            pluginOptions,
            razzleConfig,
            razzleContext,
            true,
            true,
            true
          );
          const compiler = Webpack(
            configs.configurations.map((config) => config[0])
          );

          if (configs.devServerConfiguration) {
            const server = new WebpackDevServer(
              configs.devServerConfiguration,
              compiler
            );

            const runServer = async () => {
              console.log("Starting server...");
              await server.start();
            };

            runServer();
          } else {
            compiler.watch(
              {
                // Example [watchOptions](/configuration/watch/#watchoptions)
                aggregateTimeout: 300,
                poll: undefined,
              },
              (err, stats) => {
                // [Stats Object](#stats-object)
                // Print watch/build result here...
                console.log(stats);
              }
            );
          }
        }
      );
    },

    build: (argv, pluginOptions, razzleConfig, razzleContext) => {
      argv.command(
        "build",
        "build using webpack",
        function (yargs) {
          return yargs.option("u", {
            alias: "url",
            describe: "the URL to open",
          });
        },
        async (argv) => {
          if (typeof process.env["NODE_ENV"] === "undefined") {
            process.env["NODE_ENV"] = "production";
          } else if (process.env["NODE_ENV"] === "development") {
            logger.warn(
              "Running build with NODE_ENV=development, set NODE_ENV=production"
            );
          }
          console.log(process.env["NODE_ENV"]);
          const configs = await createConfig(
            pluginOptions,
            razzleConfig,
            razzleContext,
            false,
            process.env["NODE_ENV"] === "development",
            false
          );
          const compiler = Webpack(
            configs.configurations.map((config) => config[0])
          );
          compiler.run((err, stats) => {
            // [Stats Object](#stats-object)
            // Print watch/build result here...
            console.log(stats);
          });
        }
      );
    },
  },
};

export default function (options: Webpack5PluginOptions): {
  plugin: Webpack5RazzlePlugin;
  options: Webpack5PluginOptions;
} {
  return {
    plugin: Plugin,
    options: { ...(Plugin.defaultOptions || {}), ...options },
  };
}
