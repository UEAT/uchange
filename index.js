#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
const inquirer = require("inquirer");

const VERSION_REGEX = /([0-9]+)\.([0-9]+)\.([0-9]+)/;
const STRICT_VERSION_REGEX = /^([0-9]+)\.([0-9]+)\.([0-9]+)$/;
const CHANGELOG_PATH = path.join(process.cwd(), "CHANGELOG.md");
const PACKAGEJSON_PATH = path.join(process.cwd(), "package.json");
const APPVEYOR_PATH = path.join(process.cwd(), "appveyor.yml");

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
  if (!content) {
    content = fs.readFileSync(CHANGELOG_PATH).toString();
  }

  const nextVersion = getNextVersion(content);
  const nextVersionMatch = nextVersion.match(VERSION_REGEX);
  const minimumMajor = parseInt(nextVersionMatch[1]);
  const minimumMinor = parseInt(nextVersionMatch[2]);
  const minimumPatch = parseInt(nextVersionMatch[3]);

  inquirer
    .prompt([
      {
        type: "input",
        name: "version",
        message: "What is the version you would like to release?",
        default: nextVersion,
        validate: function(version) {
          const match = version.match(STRICT_VERSION_REGEX);
          if (!match || match.length < 4) {
            return "Your version number must match X.X.X";
          }

          const major = parseInt(match[1]);
          const minor = parseInt(match[2]);
          const patch = parseInt(match[3]);
          console.log(major, minor, patch);

          if (major < minimumMajor) {
            return `Your major version must be at least ${minimumMajor}.`;
          } else if (major === minimumMajor) {
            if (minor < minimumMinor) {
              return `Your minor version must be at least ${minimumMinor}.`;
            } else if (minor === minimumMinor) {
              if (patch < minimumPatch) {
                return `Your patch version must be at least ${minimumPatch}.`;
              }
            }
          }

          return true;
        }
      }
    ])
    .then(answer => {
      addContent(content, answer.version);
    });
}

function getNextVersion(content) {
  const match = content.match(VERSION_REGEX);
  if (!match || match.length < 4) {
    return "1.0.0";
  }

  return `${match[1]}.${match[2]}.${parseInt(match[3]) + 1}`;
}

function addContent(content, version) {
  const NEXT_TEMPLATE = fs
    .readFileSync(path.join(__dirname, "NEXT_TEMPLATE.md"))
    .toString();

  content = content.replace(/vNEXT/g, `v${version}`);
  content = content.replace("Date: TBD", `Date: ${new Date().toString()}`);

  const startIndex = content.indexOf("##");
  content =
    content.substr(0, startIndex) +
    NEXT_TEMPLATE +
    "\r\n" +
    content.substr(startIndex);

  saveContent(content);
  saveNodePackage(version);
  saveAppVeyor(version);
  commitGit(version);
}

function saveContent(content) {
  fs.writeFileSync(CHANGELOG_PATH, content);
}

function saveNodePackage(version) {
  if (!fs.existsSync(PACKAGEJSON_PATH)) {
    return;
  }

  let content = fs.readFileSync(PACKAGEJSON_PATH).toString();
  content = content.replace(/"version": "[^"]*"/, `"version": "${version}"`);
  fs.writeFileSync(PACKAGEJSON_PATH, content);
}

function saveAppVeyor(version) {
  if (!fs.existsSync(APPVEYOR_PATH)) {
    return;
  }

  let content = fs.readFileSync(APPVEYOR_PATH).toString();
  const match = version.match(VERSION_REGEX);
  const major = match[1];
  const minor = match[2];
  const patch = match[3];

  content = content.replace(/major\: [0-9]+/, `major: ${major}`);
  content = content.replace(/minor\: [0-9]+/, `minor: ${minor}`);
  content = content.replace(/patch\: [0-9]+/, `patch: ${patch}`);

  fs.writeFileSync(APPVEYOR_PATH, content);
}

function commitGit(version) {
  execSync("git add -A");
  execSync(`git commit -m "Release ${version}\"`);
  execSync(`git tag v${version}`);
  execSync(`git push origin : v${version}`);
}
