import HtmlWebpackPlugin from "html-webpack-plugin";
import baseConfig from "@stanlemon/webdev/webpack.config.js";
import path from "path";
import CopyWebpackPlugin from "copy-webpack-plugin";

export default {
  ...baseConfig,
  entry: "./app/index.js",
  plugins: [
    ...(baseConfig.plugins
      ? baseConfig.plugins.filter(
          (plugin) => !(plugin instanceof HtmlWebpackPlugin)
        )
      : []),
    new HtmlWebpackPlugin({
      template: path.resolve("app/index.html"),
      filename: "index.html",
    }),
    new CopyWebpackPlugin({
      patterns: [{ from: "app/public", to: "." }],
    }),
  ],
};
