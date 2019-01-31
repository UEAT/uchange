#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const inquirer = require("inquirer");

const VERSION_REGEX = /([0-9]+)\.([0-9]+)\.([0-9]+)/;
const CHANGELOG_PATH = path.join(process.cwd(), "CHANGELOG.md");

if (!fs.existsSync(CHANGELOG_PATH)) {
  init();
} else {
  bumpVersion();
}

function init() {
  const splittedCwd = process.cwd().split(path.sep);

  inquirer
    .prompt([
      {
        type: "input",
        name: "projectName",
        message: "What is the name of your project?",
        default: splittedCwd[splittedCwd.length - 1]
      }
    ])
    .then(answer => {
      createNewFile(answer.projectName);
    });
}

function createNewFile(projectName) {
  const NEW_TEMPLATE = fs
    .readFileSync(path.join(__dirname, "NEW_TEMPLATE.md"))
    .toString();

  let content = NEW_TEMPLATE.replace(/PROJECT_NAME/g, projectName);
  saveContent(content);
}

function bumpVersion(content) {
  const nextVersion = "1.0.0";

  inquirer
    .prompt([
      {
        type: "input",
        name: "version",
        message: "What is the version you would like to release?",
        default: nextVersion,
        validate: function(version) {
          if (VERSION_REGEX.test(version)) {
            return true;
          } else {
            return "Your version number must match X.X.X";
          }
        }
      }
    ])
    .then(answer => {
      addContent(content, answer.version);
    });
}

function addContent(content, version) {
  const NEXT_TEMPLATE = fs
    .readFileSync(path.join(__dirname, "NEXT_TEMPLATE.md"))
    .toString();

  if (!content) {
    content = fs.readFileSync(CHANGELOG_PATH).toString();
  }

  content = content.replace(/vNEXT/g, `v${version}`);
  content = content.replace("Date: TBD", `Date: ${new Date().toString()}`);

  const startIndex = content.indexOf("##");
  content =
    content.substr(0, startIndex) +
    NEXT_TEMPLATE +
    "\r\n\r\n" +
    content.substr(startIndex);

  saveContent(content);
}

function saveContent(content) {
  fs.writeFileSync(CHANGELOG_PATH, content);
}
