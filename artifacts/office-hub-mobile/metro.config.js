const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

const workspaceRoot = path.resolve(__dirname, "../..");
const officeHubWeb = path.resolve(workspaceRoot, "artifacts/office-hub");
const mockupSandbox = path.resolve(workspaceRoot, "artifacts/mockup-sandbox");

config.resolver = config.resolver || {};
config.resolver.blockList = [
  new RegExp(officeHubWeb.replace(/[/\\]/g, "[/\\\\]") + "[/\\\\]node_modules[/\\\\]\\.vite[/\\\\].*"),
  new RegExp(officeHubWeb.replace(/[/\\]/g, "[/\\\\]") + "[/\\\\]dist[/\\\\].*"),
  new RegExp(mockupSandbox.replace(/[/\\]/g, "[/\\\\]") + "[/\\\\]node_modules[/\\\\]\\.vite[/\\\\].*"),
  new RegExp(mockupSandbox.replace(/[/\\]/g, "[/\\\\]") + "[/\\\\]dist[/\\\\].*"),
];

module.exports = config;
