# Meant for documentation purposes

# Use local dependencies and make sure the new versions don't break the API
npm run link
npm run build:all

# Test it in the browser
npm run demo:core
npm run demo:react

npm version patch -w @easy-rtc/core # patch, minor or major
npm publish -w @easy-rtc/core

npm i -S @easy-rtc/core@latest -w @easy-rtc/react
npm run build -w @easy-rtc/react # Build again after installing the new dependency
npm version patch -w @easy-rtc/react # patch, minor or major
npm publish -w @easy-rtc/react

npm i -S @easy-rtc/core@latest -w @easy-rtc/demo-core
npm i -S @easy-rtc/react@latest -w @easy-rtc/demo-react
npm i --package-lock-only # Necessary to adjust package-lock.json after installs

npm run build:demo # Build again after installing the new dependencies

git add ...
git commit -m "version X.Y.Z"
