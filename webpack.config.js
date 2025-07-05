import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyWebpackPlugin from "copy-webpack-plugin";

// Correct loader order for CSS: style-loader, css-loader, postcss-loader
const cssRule = {
  test: /\.css$/i,
  use: [
    "style-loader",
    "css-loader",
    "postcss-loader"
  ],
};

export default {
  entry: "./app/index.js",
  output: {
    path: path.resolve("dist"),
    filename: "static/[name].[contenthash].js",
    clean: true,
    publicPath: "/",
  },
  resolve: {
    extensions: [".js", ".jsx", ".json"],
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"]
          }
        }
      },
      cssRule,
      {
        test: /\.(png|jpe?g|gif|svg|ico|webp)$/i,
        type: "asset/resource",
        generator: {
          filename: "static/images/[name][ext]"
        }
      },
      {
        test: /\.(woff2?|eot|ttf|otf)$/i,
        type: "asset/resource",
        generator: {
          filename: "static/fonts/[name][ext]"
        }
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve("app/index.html"),
      filename: "index.html"
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: "app/public", to: "." }
      ]
    })
  ],
  devServer: {
    static: {
      directory: path.resolve("dist")
    },
    port: 3000,
    historyApiFallback: true,
    open: true
  },
  mode: process.env.NODE_ENV === "production" ? "production" : "development"
};
