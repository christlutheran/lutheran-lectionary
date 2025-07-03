import HtmlWebpackPlugin from "html-webpack-plugin";
import baseConfig from "@stanlemon/webdev/webpack.config.js";
import path from "path";

export default {
  ...baseConfig,
  entry: "./app/index.js",
  plugins: [
    ...(baseConfig.plugins || []),
    new HtmlWebpackPlugin({
      template: path.resolve("app/index.html"),
      filename: "index.html",
    }),
  ],
};
