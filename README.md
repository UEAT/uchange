# UCHANGE

## Usage

`npx uchange``

The first execution will create your CHANGELOG.md file.

Then, next execution will ask for your next version. Then it will:

- Update your changelog with version and date
- Add a new empty vNEXT section
- Update your package.json version (if present)
- Update your appveyor.yml version (if present)
- Commit the changes on git
- Tag the new version on git
- Push your commit and tag to git
