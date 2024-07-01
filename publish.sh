# Meant for documentation purposes

npm run build -w @easy-rtc/core
npm version patch -w @easy-rtc/core # patch, minor or major
npm publish -w @easy-rtc/core

npm i -S @easy-rtc/core@latest -w @easy-rtc/react
npm run build -w @easy-rtc/react
npm version patch -w @easy-rtc/react # patch, minor or major
npm publish -w @easy-rtc/react

npm i -S @easy-rtc/core@latest -w @easy-rtc/demo-core
npm i -S @easy-rtc/react@latest -w @easy-rtc/demo-react

npm i --package-lock-only # Necessary to adjust package-lock.json after installs

# Build the sample projects to make sure the new versions don't break the api
npm run build -w @easy-rtc/demo-core
npm run build -w @easy-rtc/demo-react

git add .
git commit -m "version X.Y.Z"
